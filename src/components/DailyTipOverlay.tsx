import React, { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { ArrowRight, BookOpen, Brain, CalendarDays, Lightbulb, ShieldCheck, Sparkles, Target, X } from 'lucide-react';
import type { UserAccount } from '../types';
import type { AppTabType } from './Header';

interface DailyTipOverlayProps {
  user: UserAccount;
  onClose: () => void;
  onNavigate: (tab: AppTabType) => void;
}

const DAILY_TIPS: Array<{ title: string; body: string; takeaway: string; action: string; tab: AppTabType; Icon: React.ElementType }> = [
  { title: 'Plan the loss before the profit', body: 'Before a simulated trade, write the price that proves your idea wrong. Position size should follow that risk—not excitement.', takeaway: 'A stop-loss is a decision made calmly, before the market tests you.', action: 'Open Trade Journal', tab: 'journal', Icon: ShieldCheck },
  { title: 'Five minutes of learning compounds', body: 'Complete one short Academy concept today. Consistency builds stronger judgement than placing more trades.', takeaway: 'Learning activity earns progress; excessive trading does not.', action: 'Continue Academy', tab: 'academy', Icon: BookOpen },
  { title: 'Concentration can hide in plain sight', body: 'Owning several stocks is not diversification when they all depend on the same sector or economic driver.', takeaway: 'Check sector weights before adding another similar company.', action: 'Review Portfolio', tab: 'portfolio', Icon: Target },
  { title: 'A catalyst needs a date and a reason', body: '“This stock may rise” is not a plan. Record what could change expectations and when the market may learn it.', takeaway: 'Clear catalysts make a thesis testable instead of hopeful.', action: 'Open Journal', tab: 'journal', Icon: CalendarDays },
  { title: 'Price movement is not proof', body: 'A rising price can validate momentum, but it does not automatically validate the business. Compare the move with earnings, valuation and risk.', takeaway: 'Separate what the price did from why you think it happened.', action: 'Explore Markets', tab: 'screener', Icon: Brain },
  { title: 'Patience is an investing action', body: 'You do not need to trade every session. Waiting for your planned price or completing a lesson can be the best decision today.', takeaway: 'No trade is better than an unplanned trade.', action: 'View Today’s Mission', tab: 'home', Icon: Lightbulb },
  { title: 'Review the process, not only P&L', body: 'A profitable trade can still be poorly planned, while a disciplined trade can lose. Score whether you followed the plan.', takeaway: 'Good habits are more repeatable than lucky outcomes.', action: 'Review Trader DNA', tab: 'review', Icon: Sparkles },
  { title: 'Know your maximum allocation', body: 'Decide the largest portfolio weight you will allow before buying. This protects you from letting confidence become concentration.', takeaway: 'Limits are most useful when set before emotions arrive.', action: 'Check Risk View', tab: 'portfolio', Icon: ShieldCheck },
];

const getIstDayOrdinal = () => {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value || 0);
  return Math.floor(Date.UTC(value('year'), value('month') - 1, value('day')) / 86_400_000);
};

const hashUser = (value: string) => Array.from(value).reduce((hash, character) => ((hash * 31) + character.charCodeAt(0)) >>> 0, 0);

export const getDailyTipStorageKey = (userId: string) => {
  const dateKey = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  return `rr_daily_tip_seen:${userId}:${dateKey}`;
};

export const DailyTipOverlay: React.FC<DailyTipOverlayProps> = ({ user, onClose, onNavigate }) => {
  const tip = useMemo(() => DAILY_TIPS[(getIstDayOrdinal() + hashUser(user.id)) % DAILY_TIPS.length], [user.id]);
  const Icon = tip.Icon;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-end justify-center p-0 sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="daily-tip-title">
      <button className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} aria-label="Close tip of the day" />
      <motion.section initial={{ opacity: 0, y: 28, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.98 }} className="relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[30px] border border-indigo-200 bg-white p-5 shadow-2xl dark:border-indigo-800 dark:bg-slate-900 sm:max-w-lg sm:rounded-[30px] sm:p-7">
        <button onClick={onClose} className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" aria-label="Close tip of the day"><X className="h-5 w-5" /></button>

        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-indigo-700 dark:text-indigo-300"><Sparkles className="h-4 w-4" /> Tip of the day</div>
        <div className="mt-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25"><Icon className="h-7 w-7" /></div>
        <h2 id="daily-tip-title" className="mt-5 pr-12 text-2xl font-black tracking-tight text-slate-950 dark:text-white">{tip.title}</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{tip.body}</p>

        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
          <p className="text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">Remember</p>
          <p className="mt-1 text-sm font-bold leading-relaxed text-amber-950 dark:text-amber-100">{tip.takeaway}</p>
        </div>

        <p className="mt-4 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">Personalised for today’s learning session. Educational guidance only—not investment advice.</p>
        <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button onClick={onClose} className="min-h-12 rounded-2xl border border-slate-200 px-4 text-sm font-black text-slate-700 dark:border-slate-700 dark:text-slate-200">Maybe later</button>
          <button onClick={() => onNavigate(tip.tab)} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 text-sm font-black text-white shadow-lg shadow-indigo-500/20">{tip.action}<ArrowRight className="h-4 w-4" /></button>
        </div>
      </motion.section>
    </div>,
    document.body,
  );
};
