import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Star, ArrowRight, ArrowUpDown, Bell, Check, LayoutGrid, List, StickyNote, Scale, History } from 'lucide-react';
import { useSimulator } from '../../../context/SimulatorContext';
import { StockDetail } from '../../../types';
import { formatINR, formatPercent } from '../../../utils/formatters';

interface WatchlistViewProps {
  onSelectStock: (stock: StockDetail) => void;
  onNavigateToScreener: () => void;
}

type SortMode = 'ADDED' | 'GAINERS' | 'LOSERS' | 'PRICE_HIGH' | 'NAME';
type WatchNotes = Record<string, string>;
type WatchAlerts = Record<string, number | ''>;

export const WatchlistView: React.FC<WatchlistViewProps> = ({ onSelectStock, onNavigateToScreener }) => {
  const { stocks, watchlistGroups, activeWatchlistGroupId, setActiveWatchlistGroupId, createWatchlistGroup, deleteWatchlistGroup, removeStockFromGroup, currentUser, notifyUser } = useSimulator();
  const storagePrefix = `rr_watchlist_workspace:${currentUser?.id || 'guest'}`;
  const [sortMode, setSortMode] = useState<SortMode>('ADDED');
  const [compact, setCompact] = useState(false);
  const [notes, setNotes] = useState<WatchNotes>(() => {
    try { return JSON.parse(localStorage.getItem(`${storagePrefix}:notes`) || '{}'); } catch { return {}; }
  });
  const [alerts, setAlerts] = useState<WatchAlerts>(() => {
    try { return JSON.parse(localStorage.getItem(`${storagePrefix}:alerts`) || '{}'); } catch { return {}; }
  });
  const [comparison, setComparison] = useState<string[]>([]);

  const toggleComparison = (symbol: string) => {
    setComparison((previous) => previous.includes(symbol) ? previous.filter((item) => item !== symbol) : previous.length < 3 ? [...previous, symbol] : previous);
  };

  useEffect(() => { localStorage.setItem(`${storagePrefix}:notes`, JSON.stringify(notes)); }, [notes, storagePrefix]);
  useEffect(() => { localStorage.setItem(`${storagePrefix}:alerts`, JSON.stringify(alerts)); }, [alerts, storagePrefix]);

  const activeGroup = useMemo(() => watchlistGroups.find(g => g.id === activeWatchlistGroupId) || watchlistGroups[0], [watchlistGroups, activeWatchlistGroupId]);
  const watchlist = activeGroup?.symbols || [];

  const watchlistStocks = useMemo(() => {
    const result = watchlist.map((symbol) => stocks.find((stock) => stock.symbol === symbol)).filter((stock): stock is StockDetail => stock !== undefined);
    return [...result].sort((a, b) => {
      if (sortMode === 'GAINERS') return b.changePercent - a.changePercent;
      if (sortMode === 'LOSERS') return a.changePercent - b.changePercent;
      if (sortMode === 'PRICE_HIGH') return b.price - a.price;
      if (sortMode === 'NAME') return a.name.localeCompare(b.name);
      return watchlist.indexOf(a.symbol) - watchlist.indexOf(b.symbol);
    });
  }, [watchlist, stocks, sortMode]);

  if (watchlistStocks.length === 0) {
    return (
      <div className="rr-surfaces">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 text-center shadow-sm">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200"><Star className="w-8 h-8 text-slate-500" /></div>
        <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">Your watchlist is empty</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mb-8 font-medium">Save companies you want to study. A watchlist is for observation—not a signal to trade.</p>
        <button onClick={onNavigateToScreener} className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-extrabold hover:bg-indigo-700 transition-colors shadow-md">Explore companies <ArrowRight className="w-4 h-4" /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="rr-surfaces space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2"><Star className="w-6 h-6 fill-amber-400 text-amber-500" /> My Watchlist</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Track a thesis, set a calm alert, and review why each company matters.</p>
            
            <div className="flex items-center gap-2 mt-4">
               {watchlistGroups.map(group => (
                 <button
                   key={group.id}
                   onClick={() => setActiveWatchlistGroupId(group.id)}
                   className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${activeWatchlistGroupId === group.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                 >
                   {group.name}
                 </button>
               ))}
               <button
                 onClick={() => {
                   const name = prompt('Enter new watchlist folder name:');
                   if (name && name.trim()) {
                     createWatchlistGroup(name.trim());
                   }
                 }}
                 className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 border border-dashed border-slate-300"
               >
                 + New Folder
               </button>
            </div>
  
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <label className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />
            <select aria-label="Sort watchlist" value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)} className="bg-transparent text-xs font-bold text-slate-800 outline-none">
              <option value="ADDED">Recently added</option><option value="GAINERS">Top gainers</option><option value="LOSERS">Top decliners</option><option value="PRICE_HIGH">Highest price</option><option value="NAME">Company name</option>
            </select>
          </label>
          <div className="flex shrink-0 rounded-xl border border-slate-200 bg-white p-1" aria-label="Watchlist density">
            <button type="button" onClick={() => setCompact(false)} aria-label="Comfortable card view" className={`rounded-lg p-1.5 ${!compact ? 'bg-slate-900 text-white' : 'text-slate-500'}`}><LayoutGrid className="h-4 w-4" /></button>
            <button type="button" onClick={() => setCompact(true)} aria-label="Compact list view" className={`rounded-lg p-1.5 ${compact ? 'bg-slate-900 text-white' : 'text-slate-500'}`}><List className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      {comparison.length > 0 && (
        <section className="rounded-3xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-900 dark:bg-indigo-950/30" aria-label="Company comparison">
          <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><Scale className="h-4 w-4 text-indigo-700" /><h3 className="text-xs font-black text-indigo-950 dark:text-indigo-200">Compare companies ({comparison.length}/3)</h3></div><button type="button" onClick={() => setComparison([])} className="min-h-9 rounded-lg px-3 text-xs font-bold text-indigo-700 dark:text-indigo-300">Clear</button></div>
          <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[520px] text-left text-xs"><thead><tr className="text-slate-500"><th className="p-2">Company</th><th className="p-2">Price</th><th className="p-2">Day move</th><th className="p-2">P/E</th><th className="p-2">Industry P/E</th><th className="p-2">Sector</th></tr></thead><tbody>{comparison.map((symbol) => stocks.find((stock) => stock.symbol === symbol)).filter((stock): stock is StockDetail => Boolean(stock)).map((stock) => <tr key={stock.symbol} className="border-t border-indigo-200 dark:border-indigo-900"><td className="p-2 font-black">{stock.symbol}</td><td className="p-2 font-mono font-bold">{formatINR(stock.price)}</td><td className={`p-2 font-black ${stock.changePercent >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{formatPercent(stock.changePercent)}</td><td className="p-2 font-mono">{stock.peRatio}</td><td className="p-2 font-mono">{stock.industryPe}</td><td className="p-2">{stock.sector}</td></tr>)}</tbody></table></div>
          {comparison.length < 2 && <p className="mt-2 text-[11px] text-indigo-800 dark:text-indigo-300">Select one more company to make the comparison useful.</p>}
        </section>
      )}

      <div className={compact ? 'space-y-2' : 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'}>
        {watchlistStocks.map((stock) => {
          const isUp = stock.change >= 0;
          const note = notes[stock.symbol] || '';
          const alertPrice = alerts[stock.symbol] ?? '';
          return (
            <motion.article initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} key={stock.symbol} onClick={() => onSelectStock(stock)} className={`cursor-pointer border border-slate-200 bg-white transition-all hover:border-indigo-300 hover:shadow-md ${compact ? 'rounded-2xl p-3' : 'rounded-3xl p-5'}`}>
              <div className={`flex gap-3 ${compact ? 'items-center' : 'items-start justify-between'}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><h3 className="font-black text-slate-900">{stock.symbol}</h3><span className="truncate text-[10px] font-bold text-slate-500">{stock.name}</span></div>
                  <div className="mt-1 flex items-baseline gap-2"><span className="font-mono text-base font-black text-slate-900">{formatINR(stock.price)}</span><span className={`text-xs font-black ${isUp ? 'text-emerald-600' : 'text-rose-600'}`}>{isUp ? '+' : ''}{formatPercent(stock.changePercent)}</span></div>
                </div>
                <button type="button" onClick={(event) => { event.stopPropagation(); removeStockFromGroup(activeWatchlistGroupId, stock.symbol); }} className="rounded-xl p-2 text-amber-500 hover:bg-rose-50 hover:text-rose-600" aria-label={`Remove ${stock.symbol} from watchlist`}><Star className="h-5 w-5 fill-current" /></button>
              </div>
              <button type="button" onClick={(event) => { event.stopPropagation(); toggleComparison(stock.symbol); }} aria-pressed={comparison.includes(stock.symbol)} disabled={!comparison.includes(stock.symbol) && comparison.length >= 3} className={`mt-2 min-h-9 rounded-xl border px-3 text-[11px] font-black ${comparison.includes(stock.symbol) ? 'border-indigo-500 bg-indigo-100 text-indigo-900' : 'border-slate-200 text-slate-600 disabled:opacity-40'}`}><Scale className="mr-1 inline h-3.5 w-3.5" />{comparison.includes(stock.symbol) ? 'Comparing' : 'Compare'}</button>
              {!compact && <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-500">{stock.teenSummary || stock.description}</p>}
              <div className={`mt-3 grid gap-2 ${compact ? 'sm:grid-cols-2' : ''}`} onClick={(event) => event.stopPropagation()}>
                <label className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-slate-500"><StickyNote className="h-3 w-3" /> Why I’m watching</span>
                  <textarea value={note} onChange={(event) => setNotes((previous) => ({ ...previous, [stock.symbol]: event.target.value }))} maxLength={180} rows={compact ? 1 : 2} placeholder="Valuation, product launch, earnings…" className="mt-1.5 w-full resize-none bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-400" />
                </label>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-slate-500"><Bell className="h-3 w-3" /> Price alert</span>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">₹</span>
                    <input aria-label={`Price alert for ${stock.symbol}`} type="number" min="0" value={alertPrice} onChange={(event) => setAlerts((previous) => ({ ...previous, [stock.symbol]: event.target.value === '' ? '' : Number(event.target.value) }))} placeholder="Target price" className="min-w-0 flex-1 bg-transparent font-mono text-xs font-bold text-slate-900 outline-none" />
                    <button type="button" onClick={() => notifyUser('Price alert saved', alertPrice ? `${stock.symbol} alert set at ${formatINR(Number(alertPrice))}.` : `${stock.symbol} alert cleared.`, 'SUCCESS')} className="rounded-lg bg-slate-900 p-1.5 text-white" aria-label={`Save alert for ${stock.symbol}`}><Check className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              </div>
              {!compact && (note || alertPrice) && <div className="mt-3 rounded-xl border border-slate-100 bg-white p-2.5 text-[10px] text-slate-500" onClick={(event) => event.stopPropagation()}><p className="flex items-center gap-1 font-black uppercase tracking-wide"><History className="h-3 w-3" /> Watch timeline</p><div className="mt-1 space-y-1">{note && <p>• Thesis note saved on this device</p>}{alertPrice && <p>• Price alert active at {formatINR(Number(alertPrice))}</p>}<p>• Latest quote: {stock.quoteAsOf ? new Date(stock.quoteAsOf).toLocaleDateString('en-IN') : 'timestamp unavailable'}</p></div></div>}
            </motion.article>
          );
        })}
      </div>
    </div>
  );
};
