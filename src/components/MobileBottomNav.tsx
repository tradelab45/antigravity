import React, { useState } from 'react';
import {
  BarChart3,
  BookOpen,
  Calculator,
  Dna,
  Grid3X3,
  History,
  Home,
  NotebookTabs,
  PieChart,
  Trophy,
  Wallet,
  X,
  Zap,
  ShieldCheck,
  LifeBuoy,
} from 'lucide-react';
import type { AppTabType } from './Header';

interface MobileBottomNavProps {
  activeTab: AppTabType;
  setActiveTab: (tab: AppTabType) => void;
}

const MORE_GROUPS: Array<{
  title: string;
  subtitle: string;
  items: Array<{ id: AppTabType; label: string; icon: React.ElementType }>;
}> = [
  {
    title: 'Discover',
    subtitle: 'Find and follow companies',
    items: [
      { id: 'screener', label: 'Markets', icon: BarChart3 },
    ],
  },
  {
    title: 'Practice & Simulation',
    subtitle: 'Plan, simulate and test strategies',
    items: [
      { id: 'portfolio', label: 'Trading & Portfolio', icon: Wallet },
      { id: 'replay', label: 'Replay OS', icon: History },
    ],
  },
  {
    title: 'Trader DNA & Journal',
    subtitle: 'Review psychology, execution and journal notes',
    items: [
      { id: 'review', label: 'Trader DNA', icon: Dna },
      { id: 'journal', label: 'Trade Journal', icon: NotebookTabs },
    ],
  },
  {
    title: 'Learn',
    subtitle: 'Build knowledge at your pace',
    items: [
      { id: 'academy', label: 'Academy', icon: BookOpen },
      { id: 'chanakya', label: 'AI Coach', icon: Zap },
      { id: 'calculator', label: 'SIP Calculator', icon: Calculator },
    ],
  },
  {
    title: 'Progress',
    subtitle: 'Measure skill, not activity',
    items: [
      { id: 'challenges', label: 'Challenges & Achievements', icon: Trophy },
    ],
  },
  {
    title: 'Support',
    subtitle: 'Find answers and manage your records',
    items: [
      { id: 'help', label: 'Help & Support', icon: LifeBuoy },
      { id: 'privacy', label: 'Data & Privacy', icon: ShieldCheck },
    ],
  },
];

const PRIMARY_ITEMS: Array<{ id: AppTabType; label: string; icon: React.ElementType }> = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'screener', label: 'Markets', icon: BarChart3 },
  { id: 'portfolio', label: 'Portfolio', icon: PieChart },
  { id: 'academy', label: 'Learn', icon: BookOpen },
];

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeTab, setActiveTab }) => {
  const [moreOpen, setMoreOpen] = useState(false);
  const isPrimaryTab = PRIMARY_ITEMS.some((item) => item.id === activeTab);

  const navigate = (tab: AppTabType) => {
    setActiveTab(tab);
    setMoreOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {moreOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="More RupeeRookie sections">
          <button
            type="button"
            aria-label="Close more menu"
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[78vh] overflow-y-auto rounded-t-[28px] border-t border-slate-200 bg-white px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-300 dark:bg-slate-700" />
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-950 dark:text-white">Explore RupeeRookie</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Everything organised by what you want to do.</p>
              </div>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="rounded-xl border border-slate-200 p-2 text-slate-600 dark:border-slate-700 dark:text-slate-300"
                aria-label="Close more menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-5">
              {MORE_GROUPS.map((group) => (
                <section key={group.title}>
                  <div className="mb-2">
                    <h3 className="text-xs font-black uppercase tracking-[0.14em] text-indigo-700 dark:text-indigo-300">{group.title}</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{group.subtitle}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const selected = activeTab === item.id || (item.id === 'challenges' && activeTab === 'badges');
                      return (
                        <button
                          key={`${group.title}-${item.label}`}
                          type="button"
                          onClick={() => navigate(item.id)}
                          className={`flex min-h-14 items-center gap-2.5 rounded-2xl border p-3 text-left text-xs font-extrabold transition-colors ${
                            selected
                              ? 'border-indigo-300 bg-indigo-50 text-indigo-950 dark:border-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-100'
                              : 'border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                          }`}
                        >
                          <Icon className={`h-4 w-4 shrink-0 ${selected ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-500'}`} />
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      )}

      <nav
        aria-label="Mobile primary navigation"
        className="fixed inset-x-0 bottom-0 z-[80] grid grid-cols-5 border-0 bg-white/85 dark:bg-slate-950/85 px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_40px_rgba(0,0,0,0.2)] backdrop-blur-2xl lg:hidden"
      >
        <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/50 dark:via-white/20 to-transparent pointer-events-none" />
        {PRIMARY_ITEMS.map((item) => {
          const Icon = item.icon;
          const selected = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-current={selected ? 'page' : undefined}
              onClick={() => navigate(item.id)}
              className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-extrabold ${selected ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'}`}
            >
              <span className={`rounded-xl p-1.5 ${selected ? 'bg-indigo-100 dark:bg-indigo-950' : ''}`}><Icon className="h-4.5 w-4.5" /></span>
              {item.label}
            </button>
          );
        })}
        <button
          type="button"
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen(true)}
          className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-extrabold ${!isPrimaryTab || moreOpen ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'}`}
        >
          <span className={`rounded-xl p-1.5 ${!isPrimaryTab || moreOpen ? 'bg-indigo-100 dark:bg-indigo-950' : ''}`}><Grid3X3 className="h-4.5 w-4.5" /></span>
          More
        </button>
      </nav>
    </>
  );
};
