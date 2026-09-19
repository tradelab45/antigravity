import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { gzipSync } from 'node:zlib';
import { UpstoxService, mapUpstoxInstruments, parseUpstoxQuote } from '../src/server/upstoxService';
import { mergeQuote, quoteLabel } from '../src/utils/quoteState';
import type { StockDetail } from '../src/types';

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
