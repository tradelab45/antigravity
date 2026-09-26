import type { StockDetail } from '../../../types';

export interface ListedStock { symbol: string; name: string; instrumentKey: string }

export function catalogPage(seeds: string[], listings: ListedStock[], offset: number, limit: number) {
  const bySymbol = new Map(listings.map(stock => [stock.symbol, stock]));
  const seeded = new Set(seeds);
  const ordered = [...seeds.map(symbol => bySymbol.get(symbol)).filter((stock): stock is ListedStock => !!stock),
    ...listings.filter(stock => !seeded.has(stock.symbol))];
  const items = ordered.slice(offset, offset + limit);
  const nextOffset = offset + items.length;
  return { items, nextOffset, hasMore: nextOffset < ordered.length, total: ordered.length };
}

export function listedStockDetail(stock: ListedStock): StockDetail {
  // The instrument master does not contain fundamentals. Do not invent them.
  return {
    symbol: stock.symbol, name: stock.name, sector: 'NSE Equities',
    price: 0, previousClose: 0, change: 0, changePercent: 0,
    open: 0, dayHigh: 0, dayLow: 0, high52: 0, low52: 0,
    volume: 0, avgVolume: 0, peRatio: 0, industryPe: 0, marketCapCr: 0,
    eps: 0, dividendYield: 0, bookValue: 0, roe: 0, beta: 0,
    description: `${stock.name} is listed on the National Stock Exchange.`,
    teenSummary: 'NSE-listed equity. Company fundamentals are not available in the market feed.',
    popularBrands: [], strengths: [], risks: [], quoteTicker: stock.instrumentKey,
  };
}
