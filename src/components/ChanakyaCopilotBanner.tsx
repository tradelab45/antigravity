import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, ShieldAlert, Target, TrendingUp, CheckCircle, ArrowRight, Zap } from 'lucide-react';
import { useSimulator } from '../context/SimulatorContext';

export const ChanakyaCopilotBanner: React.FC = () => {
  const { copilotFeedback, clearCopilotFeedback } = useSimulator();

  if (!copilotFeedback) return null;

  const isBuy = copilotFeedback.action === 'BUY';
  const isHighRisk = copilotFeedback.riskRating === 'HIGH';
  const isModerateRisk = copilotFeedback.riskRating === 'MODERATE';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.98 }}
        className="relative z-40 mb-4 bg-gradient-to-r from-indigo-900/90 via-slate-900/95 to-slate-950 text-white rounded-3xl p-5 border border-indigo-500/30 shadow-xl overflow-hidden"
      >
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-amber-400 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Chanakya AI Trade Copilot
                </span>
                <span className="text-slate-400 text-xs">• Just Now</span>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    isHighRisk
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : isModerateRisk
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {copilotFeedback.riskRating} RISK
                </span>
              </div>

              <div className="text-sm font-semibold text-white mt-1 leading-snug">
                {copilotFeedback.advice}
              </div>

              {/* Target and Stop-Loss guidance pills */}
              <div className="flex flex-wrap items-center gap-3 mt-3 text-xs">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-medium">
                  <Target className="w-3.5 h-3.5" />
                  <span>Target 1 (+8%): </span>
                  <span className="font-bold font-mono">₹{copilotFeedback.suggestedTarget}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 font-medium">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Suggested Stop-Loss (-5%): </span>
                  <span className="font-bold font-mono">₹{copilotFeedback.suggestedStopLoss}</span>
                </div>
                {copilotFeedback.productType === 'MIS' && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-medium">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Intraday MIS (5x Leverage Active)</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
            <button
              onClick={clearCopilotFeedback}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Dismiss Copilot Banner"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
