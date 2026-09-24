import type { StockDetail } from '../types';

export function mergeQuote(current: StockDetail, incoming: StockDetail): StockDetail {
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
