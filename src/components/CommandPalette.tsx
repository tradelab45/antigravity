import React, { useEffect, useMemo, useRef, useState } from 'react';
import { 
  BarChart3, 
  BookOpen, 
  Calculator, 
  Command, 
  Home, 
  PieChart, 
  Search, 
  ShieldCheck, 
  Sparkles, 
  X, 
  Zap, 
  History, 
  Dna, 
  Trophy, 
  HelpCircle,
  TrendingUp,
  TrendingDown,
  ArrowRight
} from 'lucide-react';
import type { StockDetail } from '../types';
import type { AppTabType } from './Header';
import { CLIENT_KEYWORD_MAP } from '../constants/marketKeywords';

interface CommandPaletteProps {
  stocks: StockDetail[];
  onNavigate: (tab: AppTabType) => void;
  onSelectStock: (stock: StockDetail) => void;
}

const destinations: Array<{ tab: AppTabType; label: string; description: string; icon: React.ElementType; badge?: string }> = [
  { tab: 'home', label: 'Home Dashboard', description: 'Market overview, learning streak & quick portfolio summary', icon: Home },
  { tab: 'screener', label: 'Dalal Street Screener', description: 'Search, filter & analyze 75+ Indian companies', icon: BarChart3 },
  { tab: 'portfolio', label: 'Portfolio & Positions', description: 'Live holdings, P&L, allocation & risk analytics', icon: PieChart },
  { tab: 'chanakya', label: 'AI Coach (Chanakya)', description: 'Real-time trade guidance, guardrails & mentor feedback', icon: Zap, badge: 'AI' },
  { tab: 'replay', label: 'Replay OS', description: 'Blind bar replay & historical candle simulation', icon: History, badge: 'Blind' },
  { tab: 'review', label: 'Trader DNA', description: 'Behavioral analytics, win rate & psychology diagnostics', icon: Dna },
  { tab: 'journal', label: 'Trading Journal', description: 'Document trade rationales, screenshots & lessons', icon: BookOpen },
  { tab: 'academy', label: 'Investor Academy', description: 'Structured lessons, valuation frameworks & quizzes', icon: Sparkles },
  { tab: 'challenges', label: 'Progress & Badges', description: 'Milestones, XP achievements & leaderboard', icon: Trophy },
  { tab: 'calculator', label: 'Compound Calculator', description: 'SIP, lumpsum & wealth horizon projection', icon: Calculator },
  { tab: 'privacy', label: 'Data & Privacy', description: 'Local storage, data exports & security controls', icon: ShieldCheck },
  { tab: 'help', label: 'Help & Support', description: 'User guide, simulation FAQs & trading terminology', icon: HelpCircle },
];

const POPULAR_SYMBOLS = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'TATAMOTORS', 'ITC', 'ZOMATO'];

export function CommandPalette({ stocks, onNavigate, onSelectStock }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Global keyboard shortcuts & custom event listener
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((value) => !value);
      } else if (event.key === '/' && !typing) {
        event.preventDefault();
        setOpen(true);
      } else if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    const handleOpenEvent = () => setOpen(true);

    window.addEventListener('keydown', handleKey);
    window.addEventListener('open-app-search', handleOpenEvent);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('open-app-search', handleOpenEvent);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    window.setTimeout(() => inputRef.current?.focus(), 40);
  }, [open]);

  // Filter app navigation destinations
  const filteredDestinations = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return destinations.slice(0, 5);
    return destinations.filter((item) => `${item.label} ${item.description}`.toLowerCase().includes(needle));
  }, [query]);

  // Filter Dalal Street stocks with symbol, name, sector, and brand synonym matching
  const filteredStocks = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];

    // Check if query matches keyword map for brand synonyms (Maggi, Bullet, Zudio, Blinkit)
    const keywordMatchedSymbols = new Set<string>();
    for (const [key, syms] of Object.entries(CLIENT_KEYWORD_MAP || {})) {
      if (needle.includes(key) || key.includes(needle)) {
        syms.forEach(s => keywordMatchedSymbols.add(s));
      }
    }

    return stocks
      .filter((stock) => {
        const symbolMatch = stock.symbol.toLowerCase().includes(needle);
        const nameMatch = stock.name.toLowerCase().includes(needle);
        const sectorMatch = (stock.sector || '').toLowerCase().includes(needle);
        const brandMatch = stock.popularBrands?.some(b => b.toLowerCase().includes(needle));
        const keywordMatch = keywordMatchedSymbols.has(stock.symbol);
        return symbolMatch || nameMatch || sectorMatch || brandMatch || keywordMatch;
      })
      .slice(0, 8);
  }, [query, stocks]);

  const popularStocks = useMemo(() => {
    return stocks.filter(s => POPULAR_SYMBOLS.includes(s.symbol));
  }, [stocks]);

  const close = () => setOpen(false);

  return (
    <>
      {open && (
        <div 
          className="fixed inset-0 z-[120] flex items-start justify-center px-3 pt-[7vh] sm:pt-[10vh] animate-in fade-in duration-150" 
          role="dialog" 
          aria-modal="true" 
          aria-label="Search Dalal Street & RupeeRookie"
        >
          {/* Frosted Outside Backdrop */}
          <button 
            type="button" 
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-md cursor-default" 
            onClick={close} 
            aria-label="Close search" 
          />

          {/* Liquid Glass Command Modal */}
          <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200/90 dark:border-white/15 bg-white/95 dark:bg-[#060e0a]/95 backdrop-blur-2xl shadow-2xl shadow-black/40 text-left">
            {/* Liquid Glass Bevel Sheen along top edge */}
            <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#00f59b]/70 to-transparent pointer-events-none" />

            {/* Search Input Field with Glowing Icon */}
            <div className="flex items-center gap-3 border-b border-slate-200/80 dark:border-white/10 p-4">
              <Search className="h-5 w-5 text-emerald-600 dark:text-[#00f59b] shrink-0" />
              <input 
                ref={inputRef} 
                value={query} 
                onChange={(event) => setQuery(event.target.value)} 
                placeholder="Search stocks by symbol, name, or brand (Maggi, Bullet, Zudio, Blinkit)..." 
                className="min-w-0 flex-1 bg-transparent text-sm sm:text-base font-black outline-none placeholder:font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-white" 
                aria-label="Search pages and stocks" 
              />
              {query && (
                <button 
                  type="button" 
                  onClick={() => setQuery('')} 
                  className="rounded-xl p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Clear query"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <kbd className="hidden sm:inline-block rounded-lg border border-slate-200 dark:border-white/15 bg-slate-100 dark:bg-white/5 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
                ESC
              </kbd>
            </div>

            {/* Quick Bluechip Jump Chips when query is empty */}
            {!query && (
              <div className="px-4 py-3 bg-slate-50/70 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 shrink-0 mr-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-500" /> Bluechips:
                </span>
                {popularStocks.map(stock => (
                  <button
                    key={stock.symbol}
                    type="button"
                    onClick={() => { onSelectStock(stock); close(); }}
                    className="px-2.5 py-1 rounded-xl bg-white dark:bg-white/5 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20 border border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-slate-200 text-xs font-black transition-all shrink-0 cursor-pointer flex items-center gap-1.5 group"
                  >
                    <span className="group-hover:text-emerald-600 dark:group-hover:text-[#00f59b]">{stock.symbol}</span>
                    <span className="text-[10px] font-mono text-slate-400">₹{stock.price.toFixed(0)}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Search Results Area */}
            <div className="max-h-[60vh] overflow-y-auto p-3 space-y-3">
              {/* Companies Matching Query */}
              {filteredStocks.length > 0 && (
                <div>
                  <div className="px-2 pb-1.5 text-[10px] font-mono font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between">
                    <span>Dalal Street Companies ({filteredStocks.length})</span>
                    <span className="text-emerald-600 dark:text-[#00f59b]">NSE Live Feed</span>
                  </div>
                  <div className="space-y-1">
                    {filteredStocks.map((stock) => {
                      const isUp = (stock.changePercent ?? 0) >= 0;
                      return (
                        <button 
                          key={stock.symbol} 
                          type="button" 
                          onClick={() => { onSelectStock(stock); close(); }} 
                          className="flex w-full items-center justify-between gap-3 rounded-2xl p-2.5 sm:p-3 text-left hover:bg-emerald-500/10 dark:hover:bg-white/10 focus:bg-emerald-500/15 focus:outline-none transition-colors group cursor-pointer border border-transparent hover:border-emerald-500/20"
                        >
                          <div className="min-w-0 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center font-black text-xs text-slate-800 dark:text-white shrink-0 group-hover:scale-105 transition-transform">
                              {stock.symbol.slice(0, 3)}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                                <span className="group-hover:text-emerald-600 dark:group-hover:text-[#00f59b] transition-colors">
                                  {stock.symbol}
                                </span>
                                <span className="text-xs font-medium text-slate-400 dark:text-slate-400 truncate">
                                  · {stock.name}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate flex items-center gap-2 mt-0.5">
                                <span>{stock.sector}</span>
                                {stock.popularBrands && stock.popularBrands.length > 0 && (
                                  <span className="text-[10px] bg-slate-100 dark:bg-white/10 px-1.5 py-0.2 rounded font-sans text-slate-600 dark:text-slate-300">
                                    {stock.popularBrands[0]}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0 font-mono">
                            <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                              ₹{stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className={`text-[11px] font-bold flex items-center justify-end gap-0.5 ${isUp ? 'text-emerald-600 dark:text-[#00f59b]' : 'text-rose-600'}`}>
                              {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              <span>{isUp ? '+' : ''}{stock.changePercent?.toFixed(2)}%</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Navigation Destinations */}
              {filteredDestinations.length > 0 && (
                <div>
                  <div className="px-2 pb-1.5 pt-2 text-[10px] font-mono font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    <span>App Navigation & Features</span>
                  </div>
                  <div className="space-y-1">
                    {filteredDestinations.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button 
                          key={item.tab} 
                          type="button" 
                          onClick={() => { onNavigate(item.tab); close(); }} 
                          className="flex w-full items-center justify-between gap-3 rounded-2xl p-2.5 text-left hover:bg-slate-100 dark:hover:bg-white/10 focus:bg-slate-100 dark:focus:bg-white/10 focus:outline-none transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="rounded-xl bg-slate-100 dark:bg-white/10 p-2 text-slate-700 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-[#00f59b] group-hover:scale-105 transition-all shrink-0">
                              <Icon className="h-4 w-4" />
                            </span>
                            <div className="min-w-0">
                              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                                {item.label}
                                {item.badge && (
                                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                                    {item.badge}
                                  </span>
                                )}
                              </span>
                              <span className="block text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                {item.description}
                              </span>
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {query && filteredDestinations.length === 0 && filteredStocks.length === 0 && (
                <div className="py-12 text-center select-none">
                  <Command className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600 animate-pulse" />
                  <p className="mt-3 text-sm font-black text-slate-900 dark:text-white">No company or page found for "{query}"</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Try searching by symbol (TCS, INFY), brand (Maggi, Bullet, Zudio), or page (AI Coach, Portfolio).
                  </p>
                </div>
              )}
            </div>

            {/* Footer Hints */}
            <div className="px-4 py-2.5 border-t border-slate-100 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-3">
                <span><kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-white/10 font-mono text-[9px]">↵</kbd> to select</span>
                <span><kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-white/10 font-mono text-[9px]">esc</kbd> to close</span>
              </div>
              <span className="font-mono text-[10px] text-emerald-600 dark:text-[#00f59b] font-bold">
                RupeeRookie Dalal Street Search
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
