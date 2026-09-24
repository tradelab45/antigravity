import React, { useEffect, useState } from 'react';
import { useSimulator } from '../context/SimulatorContext';
import { X, CheckCircle, Info, AlertTriangle, AlertCircle } from 'lucide-react';
import { AppNotification } from '../types';

const TOAST_LIFETIME_MS = 5000;

const ICONS: Record<string, React.ElementType> = {
  SUCCESS: CheckCircle,
  WARNING: AlertTriangle,
  ALERT: AlertCircle,
};

const ICON_TONE: Record<string, string> = {
  SUCCESS: 'text-emerald-600 dark:text-emerald-400',
  WARNING: 'text-amber-600 dark:text-amber-400',
  ALERT: 'text-rose-600 dark:text-rose-400',
};

export const ToastNotifier: React.FC = () => {
  const { notifications, markNotificationRead } = useSimulator();
  const [activeToast, setActiveToast] = useState<AppNotification | null>(null);

  // Derived from the notification list alone. Keying the effect on the id
  // rather than on the toast object stops it re-running on its own output.
  const newestUnreadId = notifications.find((item) => !item.read)?.id ?? null;

  useEffect(() => {
    setActiveToast(newestUnreadId ? notifications.find((item) => item.id === newestUnreadId) ?? null : null);
  }, [newestUnreadId, notifications]);

  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => markNotificationRead(activeToast.id), TOAST_LIFETIME_MS);
    return () => clearTimeout(timer);
  }, [activeToast, markNotificationRead]);

  if (!activeToast) return null;

  const Icon = ICONS[activeToast.type] ?? Info;
  const tone = ICON_TONE[activeToast.type] ?? 'text-slate-500 dark:text-slate-400';

  return (
    <div
      role="status"
      aria-live="polite"
      /* On a phone the bottom edge already carries the tab bar, the quick dock
         and the glossary pill, so a toast anchored at bottom-4 covered the
         navigation and swallowed every tap on it for five seconds. It clears
         them here and returns to the corner from lg up, where none exist.
         Left and right are pinned on small screens: w-full against right-4
         put the left edge 10px off-screen at 390px. */
      className="motion-safe:animate-in motion-safe:slide-in-from-bottom-5 motion-safe:fade-in motion-safe:duration-300 fixed bottom-[9.5rem] left-3 right-3 z-[100] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 lg:bottom-4 lg:left-auto lg:w-full lg:max-w-sm"
    >
      <div className="flex items-start gap-3 p-4">
        <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${tone}`} />
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{activeToast.title}</h4>
          <p className="mt-1 text-xs leading-snug text-slate-600 dark:text-slate-300">{activeToast.message}</p>
        </div>
        <button
          type="button"
          onClick={() => markNotificationRead(activeToast.id)}
          aria-label="Dismiss notification"
          className="-m-1.5 shrink-0 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="h-1 w-full bg-slate-200 dark:bg-slate-700">
        <div
          className="h-full bg-slate-900 motion-safe:animate-[shrink_5s_linear_forwards] dark:bg-indigo-400"
          style={{ transformOrigin: 'left' }}
        />
      </div>
    </div>
  );
};
