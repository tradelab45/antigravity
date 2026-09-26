import type { StockDetail } from '../../../types';

const isUpstox = (stock: StockDetail) => Boolean(stock.quoteSource?.startsWith('Upstox'));

export function mergeQuote(current: StockDetail, incoming: StockDetail): StockDetail {
  // Timestamps from different providers are not comparable: Upstox stamps the
  // exchange's last-trade time, while a fallback quote without its own time is
  // stamped when it was fetched. Comparing them let a fallback price fetched a
  // moment after a trade permanently outrank that live tick, so the card froze
  // on the older price. A broker quote always replaces a fallback one; the
  // timestamp only orders quotes that could have been compared fairly.
  if (isUpstox(incoming) && !isUpstox(current)) return { ...current, ...incoming };
  const currentTime = Date.parse(current.quoteAsOf || '');
  const incomingTime = Date.parse(incoming.quoteAsOf || '');
  if (Number.isFinite(currentTime) && (!Number.isFinite(incomingTime) || incomingTime < currentTime)) return current;
  return { ...current, ...incoming };
}

export function quoteLabel(stock: StockDetail) {
  if (stock.quoteStatus === 'unavailable') return 'Quote unavailable';
  const age = Date.now() - Date.parse(stock.quoteAsOf || '');
  if (stock.quoteStatus === 'live' && age >= -5000 && age < 60_000) return 'Live';
  if (!stock.quoteSource) return 'Simulated';
  return 'Latest available';
}
