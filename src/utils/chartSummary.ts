/**
 * Text alternatives for charts.
 *
 * A chart in this app is drawn as SVG and announced by a screen reader as
 * nothing at all: a learner using one was told a section existed and never
 * what it showed. These build the sentence a sighted reader takes from the
 * shape — where it started, where it ended, the extremes, the biggest slice —
 * from the same array the chart is drawn from, so the description cannot drift
 * from the picture.
 *
 * Nothing here is allowed to round an absence into a number. A series with
 * nothing in it says so.
 */

export interface SeriesPoint {
  /** What the point is called on the axis: a date, a year, a label. */
  label: string;
  value: number;
}

export interface NamedValue {
  name: string;
  value: number;
}

type Format = (value: number) => string;

const plain: Format = (value) => String(Math.round(value * 100) / 100);

const usable = (points: SeriesPoint[]): SeriesPoint[] =>
  (Array.isArray(points) ? points : []).filter(
    (point) => point && Number.isFinite(point.value),
  );

/**
 * Describes a line or area chart: the direction, the ends and the extremes.
 */
export function describeSeries(
  what: string,
  points: SeriesPoint[],
  format: Format = plain,
): string {
  const data = usable(points);
  if (data.length === 0) return `${what}: no data yet.`;
  if (data.length === 1) {
    return `${what}: one reading so far, ${format(data[0].value)} at ${data[0].label}.`;
  }

  const first = data[0];
  const last = data[data.length - 1];
  const change = last.value - first.value;
  const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'level';

  let high = data[0];
  let low = data[0];
  for (const point of data) {
    if (point.value > high.value) high = point;
    if (point.value < low.value) low = point;
  }

  const move =
    direction === 'level'
      ? 'unchanged'
      : `${direction} ${format(Math.abs(change))}${
          first.value !== 0
            ? ` (${Math.abs((change / Math.abs(first.value)) * 100).toFixed(1)}%)`
            : ''
        }`;

  return (
    `${what}: ${data.length} readings from ${first.label} to ${last.label}. ` +
    `${format(first.value)} to ${format(last.value)}, ${move}. ` +
    `Highest ${format(high.value)} at ${high.label}, lowest ${format(low.value)} at ${low.label}.`
  );
}

/**
 * Describes a pie or bar of parts: how many, the largest, and the share it
 * takes. Shares are of the total actually present, not of an assumed whole.
 */
export function describeParts(
  what: string,
  parts: NamedValue[],
  format: Format = plain,
): string {
  const data = (Array.isArray(parts) ? parts : []).filter(
    (part) => part && Number.isFinite(part.value) && part.value > 0,
  );
  if (data.length === 0) return `${what}: nothing to show yet.`;

  const total = data.reduce((sum, part) => sum + part.value, 0);
  const ranked = [...data].sort((a, b) => b.value - a.value);
  const share = (value: number) => `${((value / total) * 100).toFixed(1)}%`;

  const listed = ranked
    .slice(0, 6)
    .map((part) => `${part.name} ${format(part.value)} (${share(part.value)})`)
    .join(', ');
  const rest = ranked.length > 6 ? `, and ${ranked.length - 6} more` : '';

  return `${what}: ${data.length} part${data.length === 1 ? '' : 's'} totalling ${format(total)}. ${listed}${rest}.`;
}

/** The rows a chart's hidden table is built from. */
export const seriesRows = (points: SeriesPoint[], format: Format = plain): string[][] =>
  usable(points).map((point) => [point.label, format(point.value)]);

export const partRows = (parts: NamedValue[], format: Format = plain): string[][] =>
  (Array.isArray(parts) ? parts : [])
    .filter((part) => part && Number.isFinite(part.value))
    .map((part) => [part.name, format(part.value)]);
