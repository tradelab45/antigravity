import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { gzipSync } from 'node:zlib';
import { UpstoxService, mapUpstoxInstruments, parseUpstoxQuote } from '../src/modules/market-data/server/upstoxService';
import { mergeQuote, quoteLabel } from '../src/modules/market-data/utils/quoteState';
import type { StockDetail } from '../src/types';
import { catalogPage, listedStockDetail } from '../src/modules/market-data/server/stockCatalog';

const key = 'NSE_EQ|INE002A01018';
const rows = [{ segment: 'NSE_EQ', instrument_type: 'EQ', trading_symbol: 'RELIANCE', instrument_key: key }];
const feed = (price = 1250, time = Date.now()) => ({ fullFeed: { marketFF: {
  ltpc: { ltp: price, cp: 1200, ltt: String(time) },
  vtt: '0', marketOHLC: { ohlc: [{ interval: '1d', open: 1220, high: 1260, low: 1210 }] },
} } });

class FakeStreamer extends EventEmitter {
  subscriptions: string[][] = [];
  disconnected = false;
  async connect() { this.emit('open'); }
  disconnect() { this.disconnected = true; this.emit('close'); }
  subscribe(keys: string[]) { this.subscriptions.push(keys); }
  autoReconnect() {}
}

function fixture() {
  const streamer = new FakeStreamer();
  const quotes: any[] = [];
  const symbols = ['RELIANCE'];
  const service = new UpstoxService({
    token: 'test-secret-do-not-expose', symbols: () => symbols, aliases: {},
    onQuote: (...args) => quotes.push(args),
    fetcher: (async () => new Response(gzipSync(JSON.stringify(rows)))) as typeof fetch,
    createStreamer: () => streamer,
  });
  return { service, streamer, quotes, symbols };
}

test('full feed keeps exchange timestamp, previous close, OHLC and zero volume', () => {
  const quote = parseUpstoxQuote(feed(1250, 1700000000000));
  assert.deepEqual(quote, { price: 1250, previousClose: 1200, lastUpdated: '2023-11-14T22:13:20.000Z',
    open: 1220, dayHigh: 1260, dayLow: 1210, volume: 0 });
});

test('invalid prices and missing or invalid timestamps are rejected', () => {
  for (const invalid of [null, {}, feed(NaN), feed(-1), feed(100, 0), feed(100, Infinity),
    { ltpc: { ltp: 100, cp: 0, ltt: Date.now() } }]) {
    assert.equal(parseUpstoxQuote(invalid), null);
  }
});

test('instrument mapping uses aliases and excludes derivatives and other exchanges', () => {
  const mapping = mapUpstoxInstruments([...rows,
    { ...rows[0], trading_symbol: 'FUTURE', segment: 'NSE_FO' },
    { ...rows[0], trading_symbol: 'OTHER', instrument_type: 'FUT' },
  ], ['OLD', 'FUTURE', 'OTHER', 'MISSING'], { OLD: 'RELIANCE' });
  assert.deepEqual([...mapping], [['OLD', key]]);
});

test('missing token performs no network access', async () => {
  const service = new UpstoxService({ symbols: () => ['RELIANCE'], aliases: {}, onQuote() {},
    fetcher: (() => { throw new Error('Unexpected network'); }) as typeof fetch });
  await service.start();
  assert.equal(service.status().state, 'disabled');
  service.stop();
});

test('connects once, decodes frames and marks live only during exchange open session', async () => {
  const { service, streamer, quotes } = fixture();
  try {
    await service.start();
    await service.start();
    assert.deepEqual(streamer.subscriptions, [[key]]);
    streamer.emit('message', Buffer.from(JSON.stringify({ feeds: { [key]: feed() } })));
    assert.equal(service.isLive('RELIANCE'), false);
    streamer.emit('message', JSON.stringify({ marketInfo: { segmentStatus: { NSE_EQ: 'NORMAL_OPEN' } } }));
    assert.equal(service.isLive('RELIANCE'), true);
    assert.equal(quotes[0][0], 'RELIANCE');
    streamer.emit('message', JSON.stringify({ marketInfo: { segmentStatus: { NSE_EQ: 'NORMAL_CLOSE' } } }));
    assert.equal(service.isLive('RELIANCE'), false);
    assert.ok(!JSON.stringify(service.status()).includes('test-secret'));
  } finally { service.stop(); }
  assert.equal(streamer.disconnected, true);
});

test('old ticks, stale timestamps and malformed frames cannot produce live prices', async () => {
  const { service, streamer, quotes } = fixture();
  try {
    await service.start();
    const timestamp = Date.now() - 120_000;
    streamer.emit('message', JSON.stringify({ marketInfo: { segmentStatus: { NSE_EQ: 2 } }, feeds: { [key]: feed(1250, timestamp) } }));
    streamer.emit('message', JSON.stringify({ feeds: { [key]: feed(1000, timestamp - 1000) } }));
    streamer.emit('message', 'bad json');
    assert.equal(quotes.length, 1);
    assert.equal(service.getQuote('RELIANCE')?.price, 1250);
    assert.equal(service.isLive('RELIANCE'), false);
  } finally { service.stop(); }
});

test('socket failure releases quote ownership and schedules reconnection without exposing errors', async () => {
  const { service, streamer } = fixture();
  try {
    await service.start();
    streamer.emit('message', JSON.stringify({ feeds: { [key]: feed() } }));
    streamer.emit('error', new Error('Authorization: Bearer test-secret-do-not-expose'));
    assert.equal(service.status().state, 'reconnecting');
    assert.equal(service.getQuote('RELIANCE'), undefined);
    assert.ok(!JSON.stringify(service.status()).includes('test-secret'));
  } finally { service.stop(); }
});

test('failed instrument downloads degrade to reconnecting', async () => {
  const service = new UpstoxService({ token: 'test', symbols: () => ['RELIANCE'], aliases: {}, onQuote() {},
    fetcher: (async () => new Response('unavailable', { status: 503 })) as typeof fetch });
  try {
    await service.start();
    assert.equal(service.status().state, 'reconnecting');
  } finally { service.stop(); }
});

test('browser ignores older polling responses and accepts status downgrades at same timestamp', () => {
  const current = { symbol: 'RELIANCE', price: 1250, quoteAsOf: new Date().toISOString(), quoteStatus: 'live', quoteSource: 'Upstox' } as StockDetail;
  assert.equal(mergeQuote(current, { ...current, price: 1000, quoteAsOf: '2020-01-01' }), current);
  assert.equal(mergeQuote(current, { ...current, quoteAsOf: undefined }), current);
  assert.equal(mergeQuote(current, { ...current, quoteStatus: 'delayed' }).quoteStatus, 'delayed');
  assert.equal(quoteLabel(current), 'Live');
  assert.equal(quoteLabel({ ...current, quoteAsOf: '2020-01-01' }), 'Latest available');
});

test('closed-session quotes remain owned by Upstox after a minute', async (t) => {
  const { service, streamer } = fixture();
  let now = Date.now();
  t.mock.method(Date, 'now', () => now);
  try {
    await service.start();
    streamer.emit('message', JSON.stringify({ marketInfo: { segmentStatus: { NSE_EQ: 'NORMAL_CLOSE' } }, feeds: { [key]: feed(1250, now) } }));
    now += 120_000;
    assert.equal(service.getQuote('RELIANCE')?.price, 1250);
    assert.equal(service.isLive('RELIANCE'), false);
    streamer.emit('message', JSON.stringify({ marketInfo: { segmentStatus: { NSE_EQ: 'NORMAL_OPEN' } } }));
    assert.equal(service.getQuote('RELIANCE'), undefined);
  } finally { service.stop(); }
});

test('catalog pages preserve seed order and add 23 unique stocks beyond the first 100', () => {
  const listings = Array.from({ length: 150 }, (_, index) => ({ symbol: `S${index}`, name: `Stock ${index}`, instrumentKey: `NSE_EQ|${index}` }));
  const seeds = listings.slice(0, 77).map(stock => stock.symbol);
  const first = catalogPage(seeds, listings, 0, 100);
  const second = catalogPage(seeds, listings, first.nextOffset, 23);
  assert.equal(first.items.length, 100);
  assert.equal(second.items.length, 23);
  assert.equal(second.nextOffset, 123);
  assert.equal(new Set([...first.items, ...second.items].map(stock => stock.symbol)).size, 123);
  assert.equal(catalogPage(seeds, listings, 146, 23).hasMore, false);
  assert.equal(listedStockDetail(listings[0]).peRatio, 0);
});

test('full master resolves new stocks and REST covers stocks beyond the websocket limit', async () => {
  const instruments = Array.from({ length: 2001 }, (_, i) => ({ ...rows[0], trading_symbol: `S${i}`, name: `Company ${i}`, instrument_key: `NSE_EQ|KEY${i}` }));
  const streamer = new FakeStreamer();
  let quoteRequests = 0;
  const updates: any[] = [];
  const service = new UpstoxService({ token: 'test', symbols: () => instruments.map(row => row.trading_symbol), aliases: {},
    createStreamer: () => streamer, onQuote: (...args) => updates.push(args),
    fetcher: (async (input) => {
      if (String(input).includes('NSE.json.gz')) return new Response(gzipSync(JSON.stringify(instruments)));
      quoteRequests++;
      assert.ok(String(input).includes('KEY2000'));
      return Response.json({ status: 'success', data: { last: {
        instrument_token: 'NSE_EQ|KEY2000', last_price: 123, prev_close_price: 120,
        last_trade_time: String(Date.now()), volume: 10, ohlc: { open: 121, high: 125, low: 120 }, year_high: 200, year_low: 100,
      } } });
    }) as typeof fetch,
  });
  try {
    await service.start();
    assert.equal(service.catalog().length, 2001);
    assert.equal(streamer.subscriptions[0].length, 2000);
    await service.refreshQuotes(['S2000']);
    assert.equal(updates[0][0], 'S2000');
    assert.equal(service.getQuote('S2000')?.price, 123);
    assert.equal(service.getQuote('S2000')?.high52, 200);
    await service.refreshQuotes(['S2000']);
    assert.equal(quoteRequests, 1);
  } finally { service.stop(); }
});

test('newly tracked symbols subscribe immediately without reconnecting', async () => {
  const streamer = new FakeStreamer();
  const symbols = ['RELIANCE'];
  const service = new UpstoxService({ token: 'test', symbols: () => symbols, aliases: {}, onQuote() {},
    createStreamer: () => streamer,
    fetcher: (async () => new Response(gzipSync(JSON.stringify([...rows, { ...rows[0], trading_symbol: 'NEW', instrument_key: 'NSE_EQ|NEW' }])))) as typeof fetch,
  });
  try {
    await service.start();
    symbols.push('NEW');
    service.syncSymbols();
    service.syncSymbols();
    assert.deepEqual(streamer.subscriptions, [[key], ['NSE_EQ|NEW']]);
  } finally { service.stop(); }
});

test('a live Upstox tick replaces a fallback quote stamped at fetch time', () => {
  // The fallback was fetched at 10:00:05; the trade it is being compared with
  // printed at 10:00:02. Ordering by timestamp alone kept the stale fallback.
  const fallback = { symbol: 'RELIANCE', price: 1244.2, quoteSource: 'Google Finance · NSE fallback',
    quoteAsOf: '2026-09-25T04:30:05.000Z', quoteStatus: 'delayed' } as StockDetail;
  const tick = { ...fallback, price: 1250, quoteSource: 'Upstox V3 - NSE',
    quoteAsOf: '2026-09-25T04:30:02.000Z', quoteStatus: 'live' } as StockDetail;
  const merged = mergeQuote(fallback, tick);
  assert.equal(merged.price, 1250);
  assert.equal(merged.quoteSource, 'Upstox V3 - NSE');
});

test('an older Upstox tick still cannot replace a newer Upstox tick', () => {
  const newer = { symbol: 'RELIANCE', price: 1250, quoteSource: 'Upstox V3 - NSE',
    quoteAsOf: '2026-09-25T04:30:05.000Z' } as StockDetail;
  assert.equal(mergeQuote(newer, { ...newer, price: 1240, quoteAsOf: '2026-09-25T04:30:01.000Z' }), newer);
});

test('inspect reports the last Upstox quote even after it stops owning the price', async () => {
  const { service, streamer } = fixture();
  try {
    await service.start();
    streamer.emit('message', JSON.stringify({ feeds: { [key]: feed(1250) } }));
    let info = service.inspect('RELIANCE');
    assert.equal(info.subscribed, true);
    assert.equal(info.instrumentKey, key);
    assert.equal(info.lastQuote?.price, 1250);
    assert.equal(info.ownsPrice, true);
    streamer.emit('error', new Error('socket dropped'));
    info = service.inspect('RELIANCE');
    assert.equal(info.ownsPrice, false);
    assert.equal(info.lastQuote?.price, 1250);
    assert.ok(!JSON.stringify(info).includes('test-secret'));
  } finally { service.stop(); }
});
