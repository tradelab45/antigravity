import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_CAPITAL,
  MAX_ORDERS,
  emptyLedger,
  executeOrder,
  portfolioValue,
  sanitiseLedger,
  type Ledger,
} from '../src/server/ledger';

const buy = (ledger: Ledger, quantity: number, price: number, product: 'CNC' | 'MIS' = 'CNC') =>
  executeOrder(ledger, {
    symbol: 'RELIANCE',
    stockName: 'Reliance Industries',
    quantity,
    side: 'BUY',
    product,
    price,
  });

const sell = (ledger: Ledger, quantity: number, price: number, product: 'CNC' | 'MIS' = 'CNC') =>
  executeOrder(ledger, {
    symbol: 'RELIANCE',
    stockName: 'Reliance Industries',
    quantity,
    side: 'SELL',
    product,
    price,
  });

test('a new ledger starts at the practice capital with nothing held', () => {
  const ledger = emptyLedger();
  assert.equal(ledger.cashBalance, INITIAL_CAPITAL);
  assert.deepEqual(ledger.holdings, {});
  assert.deepEqual(ledger.orders, []);
});

test('a delivery buy moves cash into a holding', () => {
  const result = buy(emptyLedger(), 10, 1000);
  assert.equal(result.ok, true);

  const ledger = result.ledger!;
  assert.equal(ledger.cashBalance, INITIAL_CAPITAL - 10_000);
  assert.equal(ledger.holdings.RELIANCE.quantity, 10);
  assert.equal(ledger.holdings.RELIANCE.avgBuyPrice, 1000);
  assert.equal(ledger.orders.length, 1);
  assert.equal(ledger.orders[0].type, 'BUY');
});

test('intraday blocks a fifth of the value as margin', () => {
  const result = buy(emptyLedger(), 10, 1000, 'MIS');
  assert.equal(result.ledger!.cashBalance, INITIAL_CAPITAL - 2_000, 'MIS is five times leverage');
});

test('a second buy averages the price rather than replacing it', () => {
  const first = buy(emptyLedger(), 10, 1000).ledger!;
  const second = buy(first, 10, 1200).ledger!;

  assert.equal(second.holdings.RELIANCE.quantity, 20);
  assert.equal(second.holdings.RELIANCE.avgBuyPrice, 1100);
  assert.equal(second.holdings.RELIANCE.totalInvested, 22_000);
});

test('a buy beyond the available cash is refused and changes nothing', () => {
  const ledger = emptyLedger();
  const result = buy(ledger, 100_000, 1000);
  assert.equal(result.ok, false);
  assert.equal(result.ledger, undefined, 'a refused order must not return a ledger');
  assert.equal(ledger.cashBalance, INITIAL_CAPITAL, 'the original is untouched');
});

test('selling more than is held is refused', () => {
  const held = buy(emptyLedger(), 5, 1000).ledger!;
  const result = sell(held, 6, 1100);
  assert.equal(result.ok, false);
  assert.match(result.message, /hold 5/);
});

test('selling nothing at all is refused', () => {
  const result = sell(emptyLedger(), 1, 1000);
  assert.equal(result.ok, false);
});

test('a sale returns cash and records the realised profit', () => {
  const held = buy(emptyLedger(), 10, 1000).ledger!;
  const result = sell(held, 4, 1250);
  assert.equal(result.ok, true);

  const ledger = result.ledger!;
  assert.equal(ledger.cashBalance, INITIAL_CAPITAL - 10_000 + 5_000);
  assert.equal(ledger.holdings.RELIANCE.quantity, 6);
  assert.equal(ledger.orders[0].realizedPnL, 1_000, '4 shares bought at 1000, sold at 1250');
});

test('a loss is recorded as a negative realised figure', () => {
  const held = buy(emptyLedger(), 10, 1000).ledger!;
  const result = sell(held, 10, 900);
  assert.equal(result.ledger!.orders[0].realizedPnL, -1_000);
});

test('selling the whole holding removes it rather than leaving a zero row', () => {
  const held = buy(emptyLedger(), 10, 1000).ledger!;
  const after = sell(held, 10, 1000).ledger!;
  assert.equal(after.holdings.RELIANCE, undefined);
});

test('a fractional or zero quantity is refused', () => {
  for (const quantity of [0, -3, 1.5, Number.NaN]) {
    assert.equal(buy(emptyLedger(), quantity, 1000).ok, false, `quantity ${quantity}`);
  }
});

test('a missing or nonsensical quote is refused', () => {
  for (const price of [0, -100, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.equal(buy(emptyLedger(), 1, price).ok, false, `price ${price}`);
  }
});

test('the order history is capped', () => {
  let ledger = emptyLedger();
  for (let i = 0; i < MAX_ORDERS + 20; i += 1) {
    ledger = buy(ledger, 1, 10).ledger!;
  }
  assert.equal(ledger.orders.length, MAX_ORDERS);
});

test('the newest order is first', () => {
  const first = buy(emptyLedger(), 1, 100).ledger!;
  const second = buy(first, 2, 200).ledger!;
  assert.equal(second.orders[0].quantity, 2);
});

test('portfolio value is computed from the quotes, not from what was paid', () => {
  const ledger = buy(emptyLedger(), 10, 1000).ledger!;
  assert.equal(portfolioValue(ledger, { RELIANCE: 1200 }), INITIAL_CAPITAL - 10_000 + 12_000);
});

test('a missing quote falls back to the average cost rather than to zero', () => {
  const ledger = buy(emptyLedger(), 10, 1000).ledger!;
  assert.equal(
    portfolioValue(ledger, {}),
    INITIAL_CAPITAL,
    'an unquoted holding must not be valued at nothing',
  );
});

test('a malformed stored ledger is repaired rather than trusted', () => {
  const repaired = sanitiseLedger({
    cashBalance: 'not a number',
    holdings: {
      GOOD: { symbol: 'GOOD', quantity: 5, avgBuyPrice: 100, totalInvested: 500 },
      NEGATIVE: { symbol: 'NEGATIVE', quantity: -5, avgBuyPrice: 100 },
      NAN: { symbol: 'NAN', quantity: 5, avgBuyPrice: Number.NaN },
    },
    orders: 'nope',
  });

  assert.equal(repaired.cashBalance, INITIAL_CAPITAL, 'a NaN balance would poison every trade');
  assert.ok(repaired.holdings.GOOD);
  assert.equal(repaired.holdings.NEGATIVE, undefined);
  assert.equal(repaired.holdings.NAN, undefined);
  assert.deepEqual(repaired.orders, []);
});

test('a ledger survives a round trip through JSON unchanged', () => {
  const ledger = buy(emptyLedger(), 7, 1234.5).ledger!;
  const restored = sanitiseLedger(JSON.parse(JSON.stringify(ledger)));
  assert.equal(restored.cashBalance, ledger.cashBalance);
  assert.equal(restored.holdings.RELIANCE.quantity, 7);
  assert.equal(restored.orders.length, 1);
});

test('cash never drifts into fractions of a paisa', () => {
  let ledger = emptyLedger();
  for (let i = 0; i < 25; i += 1) {
    ledger = buy(ledger, 3, 1226.4).ledger!;
    ledger = sell(ledger, 1, 1331.7).ledger!;
  }
  assert.equal(
    ledger.cashBalance,
    Number(ledger.cashBalance.toFixed(2)),
    'repeated rounding must not accumulate a tail',
  );
});
