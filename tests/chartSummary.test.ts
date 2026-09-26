import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  describeParts,
  describeSeries,
  partRows,
  seriesRows,
} from '../src/utils/chartSummary';

const rupees = (value: number) => `₹${Math.round(value).toLocaleString('en-IN')}`;

test('a rising series is described by its ends and its extremes', () => {
  const summary = describeSeries(
    'Portfolio value',
    [
      { label: '1 Sep', value: 1_000_000 },
      { label: '2 Sep', value: 960_000 },
      { label: '3 Sep', value: 1_042_000 },
    ],
    rupees,
  );

  assert.match(summary, /3 readings from 1 Sep to 3 Sep/);
  assert.match(summary, /up ₹42,000 \(4\.2%\)/);
  assert.match(summary, /Highest ₹10,42,000 at 3 Sep/);
  assert.match(summary, /lowest ₹9,60,000 at 2 Sep/);
});

test('a falling series says down, not a signed number', () => {
  const summary = describeSeries(
    'Value',
    [{ label: 'Jan', value: 100 }, { label: 'Feb', value: 75 }],
  );
  assert.match(summary, /down 25 \(25\.0%\)/);
  assert.ok(!summary.includes('-25'), 'a screen reader should hear "down", not a minus sign');
});

test('a flat series is not described as a tiny move', () => {
  const summary = describeSeries('Value', [
    { label: 'Jan', value: 50 },
    { label: 'Feb', value: 50 },
  ]);
  assert.match(summary, /unchanged/);
});

test('an empty series says so rather than reading as zero', () => {
  assert.match(describeSeries('Portfolio value', []), /no data yet/);
  assert.match(describeSeries('Portfolio value', [{ label: 'x', value: NaN }]), /no data yet/);
});

test('a single reading is not described as a trend', () => {
  const summary = describeSeries('Value', [{ label: 'Jan', value: 10 }]);
  assert.match(summary, /one reading so far/);
  assert.ok(!summary.includes('Highest'), 'one point has no high and low worth naming');
});

test('a series starting at zero does not claim a percentage', () => {
  const summary = describeSeries('Value', [
    { label: 'Jan', value: 0 },
    { label: 'Feb', value: 500 },
  ]);
  assert.match(summary, /up 500\./, 'a rise from nothing has no percentage');
  assert.ok(!summary.includes('Infinity'));
});

test('parts are ranked, totalled and given their share', () => {
  const summary = describeParts(
    'Holdings by sector',
    [
      { name: 'Banking', value: 60_000 },
      { name: 'IT', value: 30_000 },
      { name: 'Pharma', value: 10_000 },
    ],
    rupees,
  );

  assert.match(summary, /3 parts totalling ₹1,00,000/);
  assert.match(summary, /Banking ₹60,000 \(60\.0%\)/);
  assert.ok(summary.indexOf('Banking') < summary.indexOf('IT'), 'largest first');
});

test('a long breakdown is summarised rather than recited in full', () => {
  const parts = Array.from({ length: 10 }, (_, index) => ({
    name: `Sector ${index}`,
    value: index + 1,
  }));
  const summary = describeParts('Holdings', parts);
  assert.match(summary, /and 4 more/);
});

test('an empty breakdown says nothing is there yet', () => {
  assert.match(describeParts('Holdings by sector', []), /nothing to show yet/);
  assert.match(describeParts('Holdings', [{ name: 'x', value: 0 }]), /nothing to show yet/);
});

test('the hidden table rows carry every reading', () => {
  const rows = seriesRows(
    [{ label: 'Jan', value: 1 }, { label: 'Feb', value: 2 }, { label: 'Mar', value: NaN }],
  );
  assert.deepEqual(rows, [['Jan', '1'], ['Feb', '2']], 'an unreadable point is left out, not zeroed');

  assert.deepEqual(partRows([{ name: 'IT', value: 5 }], rupees), [['IT', '₹5']]);
});
