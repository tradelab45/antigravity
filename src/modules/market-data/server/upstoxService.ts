import { gunzipSync } from 'node:zlib';
import UpstoxClient from 'upstox-js-sdk';

export interface UpstoxQuote {
  price: number;
  previousClose: number;
  lastUpdated: string;
  open?: number;
  dayHigh?: number;
  dayLow?: number;
  volume?: number;
  high52?: number;
  low52?: number;
}

const positive = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

export function parseUpstoxQuote(feed: any): UpstoxQuote | null {
  const full = feed?.fullFeed?.marketFF;
  const ltpc = full?.ltpc ?? feed?.ltpc;
  const timestamp = Number(ltpc?.ltt);
  if (!positive(ltpc?.ltp) || !positive(ltpc?.cp) || !positive(timestamp) ||
      !Number.isFinite(new Date(timestamp).getTime())) return null;
  const daily = full?.marketOHLC?.ohlc?.find((bar: any) => bar.interval === '1d');
  const volume = Number(full?.vtt);
  return {
    price: ltpc.ltp,
    previousClose: ltpc.cp,
    lastUpdated: new Date(timestamp).toISOString(),
    ...(positive(daily?.open) ? { open: daily.open } : {}),
    ...(positive(daily?.high) ? { dayHigh: daily.high } : {}),
    ...(positive(daily?.low) ? { dayLow: daily.low } : {}),
    ...(Number.isFinite(volume) && volume >= 0 ? { volume } : {}),
  };
}

export function mapUpstoxInstruments(rows: any[], symbols: string[], aliases: Record<string, string>) {
  const instruments = new Map<string, string>();
  for (const row of rows) {
    if (row.segment === 'NSE_EQ' && row.instrument_type === 'EQ' &&
        typeof row.instrument_key === 'string' && row.instrument_key.startsWith('NSE_EQ|')) {
      instruments.set(row.trading_symbol, row.instrument_key);
    }
  }
  return new Map(symbols.flatMap(symbol => {
    const key = instruments.get(aliases[symbol] || symbol);
    return key ? [[symbol, key] as const] : [];
  }));
}

type Streamer = {
  on(event: string, listener: (...args: any[]) => void): unknown;
  connect(): Promise<void>;
  disconnect(): void;
  subscribe(keys: string[], mode: string): void;
  autoReconnect(enabled: boolean): void;
};

const createStreamer = (token: string): Streamer => {
  UpstoxClient.ApiClient.instance.authentications.OAUTH2.accessToken = token;
  return new UpstoxClient.MarketDataStreamerV3();
};

export class UpstoxService {
  private streamer?: Streamer;
  private timer?: ReturnType<typeof setTimeout>;
  private connectTimer?: ReturnType<typeof setTimeout>;
  private stopped = false;
  private starting = false;
  private retry = 0;
  private instruments: any[] = [];
  private instrumentLoad?: Promise<void>;
  private snapshotLoad?: Promise<void>;
  private instrumentMap = new Map<string, string>();
  private quotes = new Map<string, UpstoxQuote>();
  private receivedAt = new Map<string, number>();
  private state = 'disabled';
  private marketOpen = false;
  private lastMessageAt: string | null = null;

  constructor(private options: {
    token?: string;
    symbols: () => string[];
    aliases: Record<string, string>;
    onQuote: (symbol: string, quote: UpstoxQuote, key: string) => void;
    fetcher?: typeof fetch;
    createStreamer?: typeof createStreamer;
  }) {}

  status() {
    return {
      configured: Boolean(this.options.token),
      state: this.state,
      marketOpen: this.state === 'connected' && this.marketOpen,
      lastMessageAt: this.lastMessageAt,
      subscribed: this.instrumentMap.size,
      unmapped: this.options.symbols().filter(symbol => !this.instrumentMap.has(symbol)),
    };
  }

  getQuote(symbol: string) {
    const quote = this.quotes.get(symbol);
    // Closed-session snapshots remain useful, but a broken stream cannot own prices.
    return quote && (Date.now() - (this.receivedAt.get(symbol) || 0) < 60_000 ||
      (this.state === 'connected' && !this.marketOpen)) ? quote : undefined;
  }

  isLive(symbol: string) {
    const quote = this.getQuote(symbol);
    const age = quote ? Date.now() - Date.parse(quote.lastUpdated) : Infinity;
    return this.state === 'connected' && this.marketOpen && age >= -5000 && age < 60_000;
  }

  async loadInstruments() {
    if (this.instruments.length) return;
    if (!this.instrumentLoad) {
      this.instrumentLoad = (async () => {
        const response = await (this.options.fetcher || fetch)(
          'https://assets.upstox.com/market-quote/instruments/exchange/NSE.json.gz',
          { signal: AbortSignal.timeout(20_000) },
        );
        if (!response.ok) throw new Error('Instrument download failed');
        const bytes = Buffer.from(await response.arrayBuffer());
        const json = bytes[0] === 0x1f && bytes[1] === 0x8b ? gunzipSync(bytes) : bytes;
        const rows = JSON.parse(json.toString('utf8'));
        if (!Array.isArray(rows)) throw new Error('Invalid instruments');
        this.instruments = rows;
      })().finally(() => { this.instrumentLoad = undefined; });
    }
    await this.instrumentLoad;
  }

  catalog() {
    const aliases = new Map(Object.entries(this.options.aliases).map(([old, current]) => [current, old]));
    const unique = new Map<string, { symbol: string; name: string; instrumentKey: string }>();
    for (const row of this.instruments) {
      if (row.segment !== 'NSE_EQ' || row.instrument_type !== 'EQ' ||
          typeof row.trading_symbol !== 'string' || !row.instrument_key?.startsWith('NSE_EQ|')) continue;
      const symbol = aliases.get(row.trading_symbol) || row.trading_symbol;
      unique.set(symbol, { symbol, name: row.name || symbol, instrumentKey: row.instrument_key });
    }
    return [...unique.values()].sort((a, b) => a.symbol.localeCompare(b.symbol, 'en'));
  }

  async refreshQuotes(symbols: string[]) {
    if (!this.options.token) return;
    // Coalesce concurrent page, portfolio and polling requests before rechecking the cache.
    if (this.snapshotLoad) await this.snapshotLoad;
    await this.loadInstruments();
    if (this.snapshotLoad) await this.snapshotLoad;
    const mapping = mapUpstoxInstruments(this.instruments, symbols, this.options.aliases);
    const pending = [...mapping].filter(([symbol]) => !this.getQuote(symbol));
    if (!pending.length) return;
    const run = (async () => {
      for (let offset = 0; offset < pending.length; offset += 100) {
        const batch = pending.slice(offset, offset + 100);
        const url = new URL('https://api.upstox.com/v3/market-quote/quotes');
        url.searchParams.set('instrument_key', [...new Set(batch.map(([, key]) => key))].join(','));
        const response = await (this.options.fetcher || fetch)(url, {
          headers: { Authorization: `Bearer ${this.options.token}`, Accept: 'application/json' },
          signal: AbortSignal.timeout(15_000),
        });
        if (!response.ok) throw new Error(`Upstox quotes unavailable (${response.status})`);
        const body = await response.json();
        if (body.status !== 'success') throw new Error('Upstox quotes unavailable');
        const byKey = new Map(Object.values(body.data || {}).map((raw: any) => [raw.instrument_token, raw]));
        for (const [symbol, key] of batch) {
          const raw: any = byKey.get(key);
          if (!raw) continue;
          const quote = parseUpstoxQuote({ fullFeed: { marketFF: {
            ltpc: { ltp: raw.last_price, cp: raw.prev_close_price, ltt: raw.last_trade_time },
            vtt: raw.volume,
            marketOHLC: { ohlc: [{ ...raw.ohlc, interval: '1d' }] },
          } } });
          if (!quote) continue;
          if (positive(raw.year_high)) quote.high52 = raw.year_high;
          if (positive(raw.year_low)) quote.low52 = raw.year_low;
          this.acceptQuote(symbol, quote, key);
        }
      }
    })();
    this.snapshotLoad = run;
    try { await run; } finally { if (this.snapshotLoad === run) this.snapshotLoad = undefined; }
  }

  private acceptQuote(symbol: string, quote: UpstoxQuote, key: string) {
    const previous = this.quotes.get(symbol);
    if (previous && quote.lastUpdated < previous.lastUpdated) return;
    this.quotes.set(symbol, quote);
    this.receivedAt.set(symbol, Date.now());
    this.options.onQuote(symbol, quote, key);
  }

  syncSymbols() {
    const next = mapUpstoxInstruments(this.instruments, this.options.symbols(), this.options.aliases);
    // Full mode supports up to 2,000 instruments on a standard connection.
    const bounded = new Map([...next].slice(0, 2000));
    const added = [...bounded].filter(([symbol]) => !this.instrumentMap.has(symbol)).map(([, key]) => key);
    if (this.state === 'connected' && added.length) this.streamer?.subscribe([...new Set(added)], 'full');
    this.instrumentMap = bounded;
  }

  async start() {
    if (!this.options.token || this.stopped || this.starting || this.streamer) return;
    this.starting = true;
    this.state = 'connecting';
    try {
      await this.loadInstruments();
      if (this.stopped) return;
      this.syncSymbols();
      if (!this.instrumentMap.size) throw new Error('No matching instruments');
      const streamer = (this.options.createStreamer || createStreamer)(this.options.token);
      this.streamer = streamer;
      // Manage retries here to cover authorization failures as well as socket closes.
      streamer.autoReconnect(false);
      streamer.on('open', () => {
        if (this.streamer !== streamer) return;
        clearTimeout(this.connectTimer);
        this.state = 'connected';
        this.retry = 0;
        streamer.subscribe([...new Set(this.instrumentMap.values())], 'full');
      });
      streamer.on('message', (data: Buffer | string) => {
        if (this.streamer !== streamer) return;
        try {
          const message = JSON.parse(data.toString());
          const segment = message?.marketInfo?.segmentStatus?.NSE_EQ;
          if (segment !== undefined) this.marketOpen = segment === 'NORMAL_OPEN' || segment === 2;
          this.lastMessageAt = new Date().toISOString();
          for (const [symbol, key] of this.instrumentMap) {
            const quote = parseUpstoxQuote(message?.feeds?.[key]);
            if (!quote) continue;
            this.acceptQuote(symbol, quote, key);
          }
        } catch {
          // A malformed provider frame must not terminate the server.
        }
      });
      streamer.on('error', () => { if (this.streamer === streamer) this.reconnect(); });
      streamer.on('close', () => { if (this.streamer === streamer) this.reconnect(); });
      this.connectTimer = setTimeout(() => this.reconnect(), 20_000);
      await streamer.connect();
    } catch {
      this.reconnect();
    } finally {
      this.starting = false;
    }
  }

  private reconnect() {
    this.disconnect();
    if (this.stopped || this.timer) return;
    this.state = 'reconnecting';
    this.timer = setTimeout(() => {
      this.timer = undefined;
      void this.start();
    }, Math.min(60_000, 1000 * 2 ** Math.min(this.retry++, 6)));
    this.timer.unref();
  }

  private disconnect() {
    clearTimeout(this.connectTimer);
    this.marketOpen = false;
    this.receivedAt.clear();
    const streamer = this.streamer;
    this.streamer = undefined;
    try { streamer?.disconnect(); } catch { /* Socket may not have opened yet. */ }
  }

  stop() {
    this.stopped = true;
    clearTimeout(this.timer);
    this.disconnect();
    this.state = 'disabled';
  }
}
