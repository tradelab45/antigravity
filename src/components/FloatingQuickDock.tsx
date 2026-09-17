import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Accessibility, Swords, TrendingUp, Settings2, X } from 'lucide-react';

export const FloatingQuickDock: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenSearch = () => {
    window.dispatchEvent(new CustomEvent('open-app-search'));
  };

  const handleOpenAccessibility = () => {
    window.dispatchEvent(new CustomEvent('open-accessibility-settings'));
  };

  const handleOpenBattle = () => {
    window.dispatchEvent(new CustomEvent('open-stock-battle'));
  };

  const handleOpenOptions = () => {
    window.dispatchEvent(new CustomEvent('open-options-chain'));
  };

  return (
    <aside
      aria-label="Quick Actions Dock"
      className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 flex items-center gap-1.5 p-1 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200/80 dark:border-white/15 shadow-2xl shadow-slate-900/15 dark:shadow-black/50 select-none transition-all"
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0, scale: 0.8, marginRight: 0 }}
            animate={{ width: 'auto', opacity: 1, scale: 1, marginRight: 4 }}
            exit={{ width: 0, opacity: 0, scale: 0.8, marginRight: 0 }}
            className="flex items-center gap-1.5 overflow-hidden origin-right"
            style={{ whiteSpace: 'nowrap' }}
          >
            {/* 1v1 Stock Battle Arena Button */}
            <motion.button
              id="floating-dock-battle-btn"
              type="button"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleOpenBattle}
              aria-label="Open 1v1 Stock Battle Arena"
              className="flex h-10 items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-black text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/40 transition-colors cursor-pointer shrink-0"
              title="1v1 Blue-Chip Stock Battle Arena (Tug-of-War)"
            >
              <Swords className="h-4 w-4 text-amber-500" />
              <span className="hidden sm:inline">1v1 Battle</span>
            </motion.button>

            {/* Subtle Divider */}
            <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-700/80 shrink-0" />

            {/* F&O Options Chain Button */}
            <motion.button
              id="floating-dock-options-btn"
              type="button"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleOpenOptions}
              aria-label="Open F&O Options Chain"
              className="flex h-10 items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-black text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer shrink-0"
              title="F&O Options Chain & Interactive Payoff Diagram"
            >
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="hidden sm:inline">F&O Options</span>
            </motion.button>

            {/* Subtle Divider */}
            <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-700/80 shrink-0" />
            
            {/* Search App Button with Ctrl K Badge */}
            <motion.button
              id="floating-dock-search-btn"
              type="button"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleOpenSearch}
              aria-label="Search app (Ctrl + K)"
              className="flex h-10 items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-black text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              title="Open Dalal Street and App Search (Ctrl+K or /)"
            >
              <Search className="h-4 w-4 text-emerald-600 dark:text-[#00f59b]" />
              <span className="hidden sm:inline">Search app</span>
              <kbd className="hidden rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 lg:inline shrink-0">
                Ctrl K
              </kbd>
            </motion.button>

            {/* Subtle Divider */}
            <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-700/80 shrink-0" />

            {/* Accessibility Center Button */}
            <motion.button
              id="floating-dock-accessibility-btn"
              type="button"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleOpenAccessibility}
              aria-label="Open accessibility and language settings"
              className="flex h-10 items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-black text-indigo-900 dark:text-indigo-200 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer shrink-0"
              title="Accessibility and Language Settings"
            >
              <Accessibility className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">Accessibility</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Quick Actions Menu"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow-md hover:bg-slate-700 dark:hover:bg-slate-100 transition-colors cursor-pointer"
        title="Quick Actions"
      >
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {isOpen ? <X className="h-4 w-4" /> : <Settings2 className="h-4 w-4" />}
        </motion.div>
      </motion.button>
    </aside>
  );
};
