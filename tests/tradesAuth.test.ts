import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { AddressInfo } from 'net';
import { createTradesRouter, type TradeRecord, type TradeUserRef } from '../src/server/routes/trading-simulator';

/**
 * Drives the real /api/trades route in-process. The session lookup is injected,
 * so a test header stands in for the academy session cookie.
 */

async function startTradesApp() {
  const state = {
    trades: [] as TradeRecord[],
    users: [
      { id: 'usr_alice', fullName: 'Alice Real', email: 'alice@example.com', totalTrades: 0 },
      { id: 'usr_bob', fullName: 'Bob Victim', email: 'bob@example.com', totalTrades: 0 },
    ] as TradeUserRef[],
  };
  const app = express();
  app.use(express.json());
  app.use(createTradesRouter({
    loadTrades: () => state.trades,
    saveTrades: (next) => { state.trades = next; },
    loadUsers: () => state.users,
    saveUsers: (next) => { state.users = next; },
    sessionUserId: (req) => (req.get('x-test-session') || null),
  }));
  const server = await new Promise<ReturnType<express.Express['listen']>>((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const post = (body: unknown, session?: string) => fetch(`${base}/api/trades`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(session ? { 'x-test-session': session } : {}) },
    body: JSON.stringify(body),
  });
  return { state, post, close: () => server.close() };
}

/** Exactly what SimulatorContext.syncTradeToAdminAndBroadcast sends. */
const appTrade = {
  orderId: 'ORD-1790000000000-123', symbol: 'RELIANCE', stockName: 'Reliance Industries',
  type: 'BUY', orderType: 'LIMIT', productType: 'MIS', quantity: 5, price: 1226.5,
  totalAmount: 6132.5, realizedPnL: 0, status: 'EXECUTED',
  userId: 'usr_alice', userName: 'Alice Real', userEmail: 'alice@example.com',
  timestamp: new Date().toISOString(),
};

test('a trade from someone with no session is refused and nothing is stored', async () => {
  const { state, post, close } = await startTradesApp();
  try {
    const res = await post(appTrade);
    assert.equal(res.status, 401);
    assert.equal(state.trades.length, 0);
  } finally { close(); }
});

test('identity comes from the session, never from the request body', async () => {
  const { state, post, close } = await startTradesApp();
  try {
    const res = await post({ ...appTrade, userId: 'usr_bob', userName: 'Bob Victim', userEmail: 'bob@example.com' }, 'usr_alice');
    assert.equal(res.status, 200);
    const [stored] = state.trades;
    assert.equal(stored.userId, 'usr_alice', 'the trade belongs to whoever is signed in');
    assert.equal(stored.userName, 'Alice Real', 'the name comes from the user store');
    assert.equal(stored.userEmail, 'alice@example.com');
    assert.equal(state.users.find((u) => u.id === 'usr_bob')!.totalTrades, 0, 'the named victim is untouched');
    assert.equal(state.users.find((u) => u.id === 'usr_alice')!.totalTrades, 1);
  } finally { close(); }
});

test('a session for a user who no longer exists is refused', async () => {
  const { state, post, close } = await startTradesApp();
  try {
    const res = await post(appTrade, 'usr_deleted');
    assert.equal(res.status, 401);
    assert.equal(state.trades.length, 0);
  } finally { close(); }
});

test('the app\'s own trade payload is recorded unchanged', async () => {
  const { state, post, close } = await startTradesApp();
  try {
    const res = await post(appTrade, 'usr_alice');
    assert.equal(res.status, 200);
    const [stored] = state.trades;
    assert.equal(stored.orderId, appTrade.orderId);
    assert.equal(stored.symbol, 'RELIANCE');
    assert.equal(stored.stockName, 'Reliance Industries');
    assert.equal(stored.orderType, 'LIMIT');
    assert.equal(stored.productType, 'MIS');
    assert.equal(stored.quantity, 5);
    assert.equal(stored.price, 1226.5);
    assert.equal(stored.totalAmount, 6132.5);
    assert.equal(stored.status, 'EXECUTED');
  } finally { close(); }
});

test('free-text fields cannot carry arbitrary values into the ledger', async () => {
  const { state, post, close } = await startTradesApp();
  try {
    const res = await post({
      ...appTrade,
      orderId: '=HYPERLINK("http://evil.example","x")',
      orderType: '=1+1',
      status: '@SUM(A1)',
      stockName: 'x'.repeat(5000),
    }, 'usr_alice');
    assert.equal(res.status, 200);
    const [stored] = state.trades;
    assert.match(stored.orderId!, /^ORD-\d+$/, 'an invalid order id is replaced, not stored');
    assert.equal(stored.orderType, 'MARKET');
    assert.equal(stored.status, 'EXECUTED');
    assert.ok(stored.stockName.length <= 120, 'names are capped');
  } finally { close(); }
});

test('nonsense quantities and prices are rejected', async () => {
  const { state, post, close } = await startTradesApp();
  try {
    for (const bad of [{ quantity: -5 }, { quantity: 'abc' }, { price: 0 }, { price: 'NaN' }, { symbol: '' }]) {
      const res = await post({ ...appTrade, ...bad }, 'usr_alice');
      assert.equal(res.status, 400, `expected 400 for ${JSON.stringify(bad)}`);
    }
    assert.equal(state.trades.length, 0);
  } finally { close(); }
});

test('one account cannot flood the ledger, and other accounts are unaffected', async () => {
  const { state, post, close } = await startTradesApp();
  try {
    let last = 0;
    for (let i = 0; i < 125; i += 1) last = (await post(appTrade, 'usr_alice')).status;
    assert.equal(last, 429, 'the flooding account is throttled');
    assert.equal(state.trades.length, 120, 'only the allowance was written');
    assert.equal((await post(appTrade, 'usr_bob')).status, 200, 'a different account still trades');
  } finally { close(); }
});
