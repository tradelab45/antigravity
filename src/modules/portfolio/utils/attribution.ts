import { formatINR } from '../../../utils/formatters';

/** A single holding's contribution to the day's move. */
export interface DayContribution {
  symbol: string;
  /** Rupee change for the whole position today. */
  dayChangeAmount: number;
  /** Percentage change of the share price today. */
  dayChangePercent: number;
}

export interface DayAttribution {
  /** Net rupee change across every holding. */
  total: number;
  direction: 'up' | 'down' | 'flat';
  /** Positions that moved the same way as the net figure, largest first. */
  leaders: DayContribution[];
  /** Positions that moved against it, largest first. */
  detractors: DayContribution[];
  /**
   * Share of the total gross movement explained by the largest contributor,
   * between 0 and 1. High values mean one position drove the day.
   */
  concentration: number;
  /** Plain-language explanation, or null when there is nothing to explain. */
  sentence: string | null;
}

/** Below this the day is reported as flat rather than as a move worth explaining. */
const FLAT_THRESHOLD_RUPEES = 1;

const rupees = (value: number): string => formatINR(Math.abs(value), false);

/**
 * Explains a portfolio's move today in terms of the positions that caused it.
 *
 * The point is to show that a net figure hides offsetting moves: a portfolio
 * up ₹200 may contain a position up ₹3,800 and another down ₹3,600.
 */
export function describePortfolioDay(contributions: DayContribution[]): DayAttribution {
  const measured = contributions.filter(
    (item) => Number.isFinite(item.dayChangeAmount) && item.dayChangeAmount !== 0,
  );

  const total = Number(
    contributions
      .reduce((sum, item) => sum + (Number.isFinite(item.dayChangeAmount) ? item.dayChangeAmount : 0), 0)
      .toFixed(2),
  );

  const direction: DayAttribution['direction'] =
    Math.abs(total) < FLAT_THRESHOLD_RUPEES ? 'flat' : total > 0 ? 'up' : 'down';

  const byImpact = [...measured].sort(
    (a, b) => Math.abs(b.dayChangeAmount) - Math.abs(a.dayChangeAmount),
  );

  // When the day is flat, the interesting split is still gainers vs losers, so
  // the sign of the largest mover stands in for a direction.
  const referenceSign = direction === 'flat' ? Math.sign(byImpact[0]?.dayChangeAmount ?? 0) : Math.sign(total);

  const leaders = byImpact.filter((item) => Math.sign(item.dayChangeAmount) === referenceSign);
  const detractors = byImpact.filter(
    (item) => referenceSign !== 0 && Math.sign(item.dayChangeAmount) === -referenceSign,
  );

  const grossMovement = byImpact.reduce((sum, item) => sum + Math.abs(item.dayChangeAmount), 0);
  const concentration = grossMovement > 0 ? Math.abs(byImpact[0].dayChangeAmount) / grossMovement : 0;

  return {
    total,
    direction,
    leaders,
    detractors,
    concentration,
    sentence: buildSentence({ total, direction, leaders, detractors, measuredCount: measured.length }),
  };
}

function buildSentence({
  total,
  direction,
  leaders,
  detractors,
  measuredCount,
}: {
  total: number;
  direction: DayAttribution['direction'];
  leaders: DayContribution[];
  detractors: DayContribution[];
  measuredCount: number;
}): string | null {
  if (measuredCount === 0) return null;

  const top = leaders[0];
  const against = detractors[0];

  if (direction === 'flat') {
    if (top && against) {
      return `Barely moved overall, but ${top.symbol} added ${rupees(top.dayChangeAmount)} and ${against.symbol} took ${rupees(against.dayChangeAmount)} back.`;
    }
    return 'Your holdings barely moved today.';
  }

  const verb = direction === 'up' ? 'Up' : 'Down';
  const opening = `${verb} ${rupees(total)} today`;

  if (!top) return `${opening}.`;

  // One position and nothing pulling the other way: the whole move is that name.
  if (measuredCount === 1) {
    return `${opening} — all of it ${top.symbol} (${formatSignedPercent(top.dayChangePercent)}).`;
  }

  const lead = `${opening}. ${rupees(top.dayChangeAmount)} of that is ${top.symbol} (${formatSignedPercent(top.dayChangePercent)})`;

  if (against) {
    return `${lead}, while ${against.symbol} pulled ${rupees(against.dayChangeAmount)} the other way.`;
  }

  return `${lead}.`;
}

/** Formats a percentage with an explicit sign, e.g. "+2.41%". */
export function formatSignedPercent(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}
