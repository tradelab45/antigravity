import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHARGE_RATES, estimateTradeCharges } from '../src/utils/tradeCharges';

const lineFor = (estimate: ReturnType<typeof estimateTradeCharges>, label: string) => {
  const line = estimate.lines.find((entry) => entry.label === label);
  assert.ok(line, `no "${label}" line in the estimate`);
  return line!;
};

test('turnover is price times quantity', () => {
  const estimate = estimateTradeCharges(1226.4, 100, 'BUY', 'CNC');
  assert.equal(estimate.turnover, 122640);
});

test('delivery carries no brokerage, intraday is capped', () => {
  assert.equal(lineFor(estimateTradeCharges(1000, 100, 'BUY', 'CNC'), 'Brokerage').amount, 0);

  // 0.03% of ₹1,00,000 is ₹30, above the ₹20 cap.
  assert.equal(
    lineFor(estimateTradeCharges(1000, 100, 'BUY', 'MIS'), 'Brokerage').amount,
    CHARGE_RATES.brokerageIntradayCap,
  );

  // 0.03% of ₹10,000 is ₹3, below the cap, so the rate applies.
  assert.equal(lineFor(estimateTradeCharges(100, 100, 'BUY', 'MIS'), 'Brokerage').amount, 3);
});

test('STT is charged on both sides of a delivery trade', () => {
  assert.equal(lineFor(estimateTradeCharges(1000, 100, 'BUY', 'CNC'), 'STT').amount, 100);
  assert.equal(lineFor(estimateTradeCharges(1000, 100, 'SELL', 'CNC'), 'STT').amount, 100);
});

test('intraday pays STT on the sell only', () => {
  assert.equal(lineFor(estimateTradeCharges(1000, 100, 'BUY', 'MIS'), 'STT').amount, 0);
  assert.equal(lineFor(estimateTradeCharges(1000, 100, 'SELL', 'MIS'), 'STT').amount, 25);
});

test('stamp duty is charged on the buy side only', () => {
  assert.ok(lineFor(estimateTradeCharges(1000, 100, 'BUY', 'CNC'), 'Stamp duty').amount > 0);
  assert.equal(lineFor(estimateTradeCharges(1000, 100, 'SELL', 'CNC'), 'Stamp duty').amount, 0);
});

test('GST applies to brokerage and exchange fees, not to STT or stamp duty', () => {
  const estimate = estimateTradeCharges(1000, 100, 'BUY', 'MIS');
  const brokerage = lineFor(estimate, 'Brokerage').amount;
  const exchange = lineFor(estimate, 'Exchange charges').amount;
  const sebi = lineFor(estimate, 'SEBI turnover fee').amount;
  const gst = lineFor(estimate, 'GST').amount;

  assert.equal(gst, Number(((brokerage + exchange + sebi) * CHARGE_RATES.gstRate).toFixed(2)));

  // If STT were in the base, GST on this order would be far larger.
  const stt = lineFor(estimate, 'STT').amount;
  assert.ok(gst < (brokerage + exchange + sebi + stt) * CHARGE_RATES.gstRate + 0.01);
});

test('a delivery sell carries the depository charge, a buy does not', () => {
  const sell = estimateTradeCharges(1000, 100, 'SELL', 'CNC');
  assert.equal(lineFor(sell, 'DP charge').amount, CHARGE_RATES.dpChargeOnDeliverySell);

  const buy = estimateTradeCharges(1000, 100, 'BUY', 'CNC');
  assert.equal(buy.lines.find((line) => line.label === 'DP charge'), undefined);

  const intradaySell = estimateTradeCharges(1000, 100, 'SELL', 'MIS');
  assert.equal(intradaySell.lines.find((line) => line.label === 'DP charge'), undefined);
});

test('a buy costs more than turnover and a sell returns less', () => {
  const buy = estimateTradeCharges(1000, 100, 'BUY', 'CNC');
  assert.ok(buy.netAmount > buy.turnover, 'charges are added to a buy');
  assert.equal(buy.netAmount, Number((buy.turnover + buy.totalCharges).toFixed(2)));

  const sell = estimateTradeCharges(1000, 100, 'SELL', 'CNC');
  assert.ok(sell.netAmount < sell.turnover, 'charges come out of a sell');
  assert.equal(sell.netAmount, Number((sell.turnover - sell.totalCharges).toFixed(2)));
});

test('the total is the sum of the lines shown', () => {
  for (const side of ['BUY', 'SELL'] as const) {
    for (const product of ['CNC', 'MIS'] as const) {
      const estimate = estimateTradeCharges(1226.4, 203, side, product);
      const summed = Number(
        estimate.lines.reduce((total, line) => total + line.amount, 0).toFixed(2),
      );
      assert.equal(
        estimate.totalCharges,
        summed,
        `${side} ${product}: the total must be what the rows add up to`,
      );
    }
  }
});

test('every line explains itself', () => {
  const estimate = estimateTradeCharges(1000, 10, 'BUY', 'CNC');
  for (const line of estimate.lines) {
    assert.ok(line.note.trim().length > 10, `"${line.label}" needs a note a beginner can read`);
  }
});

test('a zero or negative order produces no charges rather than nonsense', () => {
  const empty = estimateTradeCharges(1000, 0, 'BUY', 'CNC');
  assert.equal(empty.turnover, 0);
  assert.equal(empty.totalCharges, 0);
  assert.equal(empty.netAmount, 0);

  const negative = estimateTradeCharges(-500, -3, 'BUY', 'CNC');
  assert.equal(negative.turnover, 0);
  assert.equal(negative.totalCharges, 0);
});

test('the rates carry the period they were taken from', () => {
  assert.ok(CHARGE_RATES.ratesAsOf.length > 0);
  assert.equal(estimateTradeCharges(100, 1, 'BUY', 'CNC').ratesAsOf, CHARGE_RATES.ratesAsOf);
});
