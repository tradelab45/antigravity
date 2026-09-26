import React, { lazy, Suspense, useState } from 'react';
import { PieChart, Star } from 'lucide-react';
import type { StockDetail } from '../../../types';
import { PageSkeleton } from '../../../components/PageSkeleton';
const PortfolioView = lazy(() => import('./PortfolioView').then(module => ({ default: module.PortfolioView })));
const WatchlistView = lazy(() => import('./WatchlistView').then(module => ({ default: module.WatchlistView })));

interface PortfolioHubProps {
  onSelectStock: (stock: StockDetail) => void;
  onNavigateToScreener: () => void;
  initialSection?: 'watchlist' | 'positions';
}

export const PortfolioHub: React.FC<PortfolioHubProps> = ({
  onSelectStock,
  onNavigateToScreener,
  initialSection = 'positions',
}) => {
  const [activeSection, setActiveSection] = useState<'watchlist' | 'positions'>(initialSection);

  return (
    <div className="space-y-6">
      <nav
        aria-label="Portfolio sections"
        className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:inline-grid sm:min-w-[420px]"
      >
        <button
          type="button"
          onClick={() => setActiveSection('watchlist')}
          aria-current={activeSection === 'watchlist' ? 'page' : undefined}
          className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-xs font-black transition-colors ${
            activeSection === 'watchlist'
              ? 'bg-slate-900 text-white shadow-sm dark:bg-indigo-600'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          <Star className="h-4 w-4" />
          Watchlist
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('positions')}
          aria-current={activeSection === 'positions' ? 'page' : undefined}
          className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-xs font-black transition-colors ${
            activeSection === 'positions'
              ? 'bg-slate-900 text-white shadow-sm dark:bg-indigo-600'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          <PieChart className="h-4 w-4" />
          Trade &amp; Positions
        </button>
      </nav>

      <Suspense fallback={<PageSkeleton page="portfolio" />}>{activeSection === 'watchlist' ? (
        <WatchlistView onSelectStock={onSelectStock} onNavigateToScreener={onNavigateToScreener} />
      ) : (
        <PortfolioView onSelectStock={onSelectStock} onNavigateToScreener={onNavigateToScreener} />
      )}</Suspense>
    </div>
  );
};
