import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Command, Sparkles, Zap } from 'lucide-react';
import { useModalDialog } from '../hooks/useModalDialog';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  const { ref: dialogRef, dialogProps } = useModalDialog({
    onClose,
    open: isOpen,
    label: 'Keyboard shortcuts',
  });

  if (!isOpen) return null;

  const shortcuts = [
    { key: 'B', action: 'Quick BUY execution on active stock', category: 'Trading' },
    { key: 'S', action: 'Quick SELL / square off active stock', category: 'Trading' },
    { key: '/', action: 'Focus Global Stock Screener search bar', category: 'Navigation' },
    { key: 'Esc', action: 'Dismiss active dialog or close modal', category: 'General' },
    { key: '?', action: 'Open / close this Keyboard Shortcuts HUD', category: 'Help' },
    { key: '1', action: 'Switch to Market Screener Tab', category: 'Tabs' },
    { key: '2', action: 'Switch to Custom Watchlists Tab', category: 'Tabs' },
    { key: '3', action: 'Switch to Order Book & Trade Logs Tab', category: 'Tabs' },
    { key: '4', action: 'Switch to Portfolio Analytics & Tax Ledger Tab', category: 'Tabs' },
    { key: '5', action: 'Switch to Derivatives & Options Chain Simulator', category: 'Tabs' },
    { key: '6', action: 'Switch to RupeeRookie Academy Lessons Tab', category: 'Tabs' },
    { key: '7', action: 'Switch to Dalal Street Alpha League & Badges Tab', category: 'Tabs' },
  ];

  return (
    <div id="shortcuts-modal-overlay" ref={dialogRef} {...dialogProps} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden"
      >
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Command className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Pro Terminal Keyboard Shortcuts
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
                  Hotkeys
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Execute lightning-fast orders and navigate like a Dalal Street floor trader.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 max-h-[60vh] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
          {shortcuts.map((sc, index) => (
            <div key={index} className="py-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold border border-slate-200 dark:border-slate-700 shadow-xs min-w-[32px] text-center">
                  {sc.key}
                </span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  {sc.action}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {sc.category}
              </span>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Shortcuts are active across all simulator terminals.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors"
          >
            Got it
          </button>
        </div>
      </motion.div>
    </div>
  );
};
