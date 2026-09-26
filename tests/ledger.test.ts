import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_CAPITAL,
  MAX_STORED_ORDERS,
  MAX_SYNCED_ORDERS,
  emptyLedger,
  executeOrder,
  portfolioValue,
  orderPage,
  sanitiseLedger,
  squareOffDeadline,
  squareOffIntraday,
  syncView,
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

test('the stored order history is capped', () => {
  let ledger = emptyLedger();
  for (let i = 0; i < MAX_STORED_ORDERS + 20; i += 1) {
    ledger = buy(ledger, 1, 10).ledger!;
  }
  assert.equal(ledger.orders.length, MAX_STORED_ORDERS);
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

test('an intraday sale returns the margin and the profit, not the whole sale', () => {
  const held = buy(emptyLedger(), 10, 1000, 'MIS').ledger!;
  assert.equal(held.cashBalance, INITIAL_CAPITAL - 2_000);

  const flat = sell(held, 10, 1000, 'MIS').ledger!;
  assert.equal(
    flat.cashBalance,
    INITIAL_CAPITAL,
    'a break-even intraday round trip must leave the balance where it started',
  );
});

test('an intraday profit is credited on top of the released margin', () => {
  const held = buy(emptyLedger(), 10, 1000, 'MIS').ledger!;
  const sold = sell(held, 10, 1100, 'MIS').ledger!;
  assert.equal(sold.cashBalance, INITIAL_CAPITAL + 1_000, 'a ₹100 gain on 10 shares');
});

test('an intraday loss is taken out of the balance', () => {
  const held = buy(emptyLedger(), 10, 1000, 'MIS').ledger!;
  const sold = sell(held, 10, 900, 'MIS').ledger!;
  assert.equal(sold.cashBalance, INITIAL_CAPITAL - 1_000);
});

test('a delivery sale is unchanged by the intraday rule', () => {
  const held = buy(emptyLedger(), 10, 1000).ledger!;
  const sold = sell(held, 10, 1250).ledger!;
  assert.equal(sold.cashBalance, INITIAL_CAPITAL + 2_500);
});

test('the square-off deadline is 3:20pm IST on the day the position was taken', () => {
  // 2026-03-02 05:00 UTC is 10:30am IST, a normal trading morning.
  const deadline = squareOffDeadline('2026-03-02T05:00:00.000Z');
  assert.equal(new Date(deadline).toISOString(), '2026-03-02T09:50:00.000Z', '3:20pm IST');
});

test('a position taken late in the IST evening belongs to that IST day', () => {
  // 2026-03-02 20:00 UTC is 1:30am IST on the 3rd.
  const deadline = squareOffDeadline('2026-03-02T20:00:00.000Z');
  assert.equal(new Date(deadline).toISOString(), '2026-03-03T09:50:00.000Z');
});

test('an intraday position is closed once its session has ended', () => {
  const opened = new Date('2026-03-02T05:00:00.000Z');
  const held = executeOrder(
    emptyLedger(),
    { symbol: 'RELIANCE', stockName: 'Reliance', quantity: 10, side: 'BUY', product: 'MIS', price: 1000 },
    opened,
  ).ledger!;

  const before = squareOffIntraday(held, { RELIANCE: 1100 }, new Date('2026-03-02T09:00:00.000Z'));
  assert.equal(before.closed.length, 0, 'nothing is due before 3:20pm IST');
  assert.equal(before.ledger, held, 'an untouched ledger is returned as it was');

  const after = squareOffIntraday(held, { RELIANCE: 1100 }, new Date('2026-03-02T10:00:00.000Z'));
  assert.equal(after.closed.length, 1);
  assert.equal(after.closed[0].exitReason, 'SQUARE_OFF', 'the order says who closed it');
  assert.equal(after.ledger.holdings.RELIANCE, undefined, 'the position is gone');
  assert.equal(after.ledger.cashBalance, INITIAL_CAPITAL + 1_000, 'closed at the quote, not at cost');
});

test('a delivery holding is never squared off', () => {
  const held = executeOrder(
    emptyLedger(),
    { symbol: 'RELIANCE', stockName: 'Reliance', quantity: 10, side: 'BUY', product: 'CNC', price: 1000 },
    new Date('2026-03-02T05:00:00.000Z'),
  ).ledger!;

  const result = squareOffIntraday(held, { RELIANCE: 1100 }, new Date('2026-06-02T10:00:00.000Z'));
  assert.equal(result.closed.length, 0);
  assert.ok(result.ledger.holdings.RELIANCE, 'delivery is held until it is sold');
});

test('a position with no quote is closed at its own cost, not at nothing', () => {
  const held = executeOrder(
    emptyLedger(),
    { symbol: 'RELIANCE', stockName: 'Reliance', quantity: 10, side: 'BUY', product: 'MIS', price: 1000 },
    new Date('2026-03-02T05:00:00.000Z'),
  ).ledger!;

  const result = squareOffIntraday(held, {}, new Date('2026-03-02T10:00:00.000Z'));
  assert.equal(result.closed.length, 1);
  assert.equal(
    result.ledger.cashBalance,
    INITIAL_CAPITAL,
    'an unquoted square-off must not invent a profit or a loss',
  );
});

test('several stale intraday positions are all closed', () => {
  let ledger = emptyLedger();
  const opened = new Date('2026-03-02T05:00:00.000Z');
  for (const symbol of ['A', 'B', 'C']) {
    ledger = executeOrder(
      ledger,
      { symbol, stockName: symbol, quantity: 5, side: 'BUY', product: 'MIS', price: 200 },
      opened,
    ).ledger!;
  }

  const result = squareOffIntraday(ledger, { A: 210, B: 190, C: 200 }, new Date('2026-03-03T10:00:00.000Z'));
  assert.equal(result.closed.length, 3);
  assert.deepEqual(result.ledger.holdings, {});
});

test('a synced ledger carries one page of orders and the true count', () => {
  let ledger = emptyLedger();
  for (let i = 0; i < MAX_SYNCED_ORDERS + 50; i += 1) {
    ledger = buy(ledger, 1, 10).ledger!;
  }

  const view = syncView(ledger);
  assert.equal(view.orders.length, MAX_SYNCED_ORDERS, 'the browser gets a page');
  assert.equal(view.orderCount, MAX_SYNCED_ORDERS + 50, 'and is told what it is a page of');
  assert.equal(view.cashBalance, ledger.cashBalance, 'everything else is untouched');
});

test('paging walks back through the history newest first', () => {
  let ledger = emptyLedger();
  for (let i = 1; i <= 250; i += 1) {
    ledger = buy(ledger, i, 10).ledger!;
  }

  const first = orderPage(ledger, 0, 100);
  assert.equal(first.orders.length, 100);
  assert.equal(first.orders[0].quantity, 250, 'the newest order leads');
  assert.equal(first.total, 250);

  const third = orderPage(ledger, 200, 100);
  assert.equal(third.orders.length, 50, 'the last page is short rather than padded');
  assert.equal(third.orders[49].quantity, 1, 'and ends on the oldest order');
});

test('a nonsensical page request is clamped rather than obeyed', () => {
  let ledger = emptyLedger();
  for (let i = 0; i < 300; i += 1) ledger = buy(ledger, 1, 10).ledger!;

  assert.equal(orderPage(ledger, -50, 100).offset, 0);
  assert.equal(orderPage(ledger, 0, 5_000).orders.length, 200, 'a page has a ceiling');
  assert.equal(orderPage(ledger, 0, -1).limit, 100, 'and a sensible default');
  assert.deepEqual(orderPage(ledger, 9_999, 100).orders, [], 'past the end is empty, not an error');
});

test('an intraday buy cannot convert a delivery holding', () => {
  const held = buy(emptyLedger(), 10, 1000, 'CNC').ledger!;
  const mixed = buy(held, 5, 1000, 'MIS');

  assert.equal(mixed.ok, false, 'the delivery shares would otherwise be squared off at 3:20pm');
  assert.match(mixed.message, /one position per share/);
  assert.equal(held.holdings.RELIANCE.productType, 'CNC', 'the holding is left as it was');
});

test('a delivery buy cannot convert an intraday holding either', () => {
  const held = buy(emptyLedger(), 10, 1000, 'MIS').ledger!;
  assert.equal(buy(held, 5, 1000, 'CNC').ok, false);
});

test('adding to a holding of the same product still works', () => {
  const held = buy(emptyLedger(), 10, 1000, 'MIS').ledger!;
  const more = buy(held, 10, 1200, 'MIS');
  assert.equal(more.ok, true);
  assert.equal(more.ledger!.holdings.RELIANCE.quantity, 20);
});
