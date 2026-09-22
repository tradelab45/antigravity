import { test } from 'node:test';
import assert from 'node:assert/strict';
import { describePortfolioDay, formatSignedPercent } from '../src/utils/attribution';

const holding = (symbol: string, dayChangeAmount: number, dayChangePercent = 1) => ({
  symbol,
  dayChangeAmount,
  dayChangePercent,
});

test('explains a gain in terms of the position that caused it', () => {
  const result = describePortfolioDay([
    holding('RELIANCE', 3800, 2.41),
    holding('TCS', 400, 0.35),
  ]);

  assert.equal(result.total, 4200);
  assert.equal(result.direction, 'up');
  assert.equal(result.leaders[0].symbol, 'RELIANCE');
  assert.equal(result.detractors.length, 0);
  assert.match(result.sentence!, /Up ₹4,200 today/);
  assert.match(result.sentence!, /₹3,800 of that is RELIANCE \(\+2\.41%\)/);
});

test('names the position pulling the other way', () => {
  const result = describePortfolioDay([
    holding('RELIANCE', 3800, 2.41),
    holding('TCS', -3600, -3.88),
  ]);

  assert.equal(result.total, 200);
  assert.equal(result.direction, 'up');
  assert.equal(result.detractors[0].symbol, 'TCS');
  assert.match(result.sentence!, /TCS pulled ₹3,600 the other way/);
});

test('a small net move still surfaces the offsetting pair', () => {
  const result = describePortfolioDay([
    holding('RELIANCE', 3800, 2.41),
    holding('TCS', -3800, -3.88),
  ]);

  assert.equal(result.total, 0);
  assert.equal(result.direction, 'flat');
  assert.match(result.sentence!, /RELIANCE added ₹3,800 and TCS took ₹3,800 back/);
});

test('attributes the whole move when only one position moved', () => {
  const result = describePortfolioDay([holding('INFY', -1250, -1.19)]);

  assert.equal(result.direction, 'down');
  assert.match(result.sentence!, /Down ₹1,250 today — all of it INFY \(-1\.19%\)/);
});

test('reports concentration so a one-stock day is visible', () => {
  const concentrated = describePortfolioDay([holding('RELIANCE', 5000), holding('TCS', 100)]);
  const spread = describePortfolioDay([holding('RELIANCE', 1000), holding('TCS', 1000), holding('INFY', 1000)]);

  assert.ok(concentrated.concentration > 0.9);
  assert.ok(spread.concentration < 0.4);
});

test('says nothing when no holding moved', () => {
  const result = describePortfolioDay([holding('RELIANCE', 0), holding('TCS', 0)]);

  assert.equal(result.total, 0);
  assert.equal(result.direction, 'flat');
  assert.equal(result.sentence, null);
});

test('ignores non-finite contributions rather than producing NaN', () => {
  const result = describePortfolioDay([
    holding('RELIANCE', Number.NaN),
    holding('TCS', 500, 0.4),
  ]);

  assert.equal(result.total, 500);
  assert.equal(result.leaders.length, 1);
  assert.equal(result.leaders[0].symbol, 'TCS');
});

test('formats percentages with an explicit sign', () => {
  assert.equal(formatSignedPercent(2.4), '+2.40%');
  assert.equal(formatSignedPercent(-2.4), '-2.40%');
  assert.equal(formatSignedPercent(Number.NaN), '—');
});
