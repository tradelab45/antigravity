import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Sliders, 
  AlertOctagon, 
  Clock, 
  Flame, 
  Lock, 
  Unlock, 
  Sparkles, 
  Info,
  CheckCircle2,
  X
} from 'lucide-react';
import { useSimulator } from '../../../context/SimulatorContext';
import { RiskSettings } from '../../../types';

interface RiskCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RiskCenterModal({ isOpen, onClose }: RiskCenterModalProps) {
  const { totalPnL, totalPnLPercent, investedValue, notifyUser } = useSimulator();

  const [riskConfig, setRiskConfig] = useState<RiskSettings>({
    maxDailyLoss: 25000,
    maxWeeklyLoss: 60000,
    maxPositionSizePct: 15,
    maxTradesPerDay: 6,
    mandatoryStopLoss: true,
    maxLeverage: 5,
    cooldownActive: false,
    cooldownUntil: undefined
  });

  const [cooldownRemainingSeconds, setCooldownRemainingSeconds] = useState<number>(0);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', closeOnEscape); };
  }, [isOpen, onClose]);

  // Timer for cooldown
  useEffect(() => {
    let timer: any = null;
    if (riskConfig.cooldownActive && riskConfig.cooldownUntil) {
      timer = setInterval(() => {
        const diff = Math.max(0, Math.round((new Date(riskConfig.cooldownUntil!).getTime() - Date.now()) / 1000));
        setCooldownRemainingSeconds(diff);
        if (diff <= 0) {
          setRiskConfig((prev) => ({ ...prev, cooldownActive: false, cooldownUntil: undefined }));
          notifyUser('Cool-Down Ended', 'Emotional reset complete. Review your trade plan before proceeding.', 'INFO');
        }
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [riskConfig.cooldownActive, riskConfig.cooldownUntil]);

  const handleStartCooldown = (minutes: number = 10) => {
    const until = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    setRiskConfig((prev) => ({
      ...prev,
      cooldownActive: true,
      cooldownUntil: until
    }));
    notifyUser(
      'Cool-Down Mode Activated',
      `Trading paused for ${minutes} minutes to cultivate discipline and review trade setups.`,
      'WARNING'
    );
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-end justify-center overflow-hidden bg-slate-950/80 p-0 backdrop-blur-md sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="risk-center-title" onClick={onClose}>
      <div className="relative max-h-[94dvh] w-full max-w-2xl overflow-y-auto overflow-x-hidden rounded-t-[28px] border border-slate-700 bg-slate-900 p-4 text-white shadow-2xl sm:max-h-[90vh] sm:rounded-3xl sm:p-6" onClick={(event) => event.stopPropagation()}>
        <div className="sticky -top-4 z-20 -mx-4 -mt-4 mb-5 flex items-start justify-between gap-3 border-b border-slate-800 bg-slate-900/98 px-4 pb-4 pt-4 backdrop-blur sm:-top-6 sm:-mx-6 sm:-mt-6 sm:px-6 sm:pt-6">
          <div className="flex min-w-0 items-center gap-3 pr-12">
            <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-300 border border-rose-500/30">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block">
                Institutional Risk Guardrails
              </span>
              <h3 id="risk-center-title" className="text-base font-black leading-tight text-white sm:text-xl">
                Risk Management Center & Cool-Down OS
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close risk management center"
            className="absolute right-3 top-3 grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-slate-700 bg-slate-800 text-slate-200 shadow-lg transition-colors hover:bg-slate-700 hover:text-white sm:right-5 sm:top-5"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 sm:space-y-6">

        {/* Cooldown Active Banner */}
        {riskConfig.cooldownActive && (
          <div className="bg-amber-950/60 border border-amber-500/50 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-amber-400 animate-pulse" />
              <div>
                <span className="text-xs font-black text-amber-300 uppercase block">
                  Cool-Down Mode Active
                </span>
                <p className="text-xs text-slate-300">
                  Trading locked to prevent emotional tilt. Time remaining:
                </p>
              </div>
            </div>
            <span className="text-2xl font-black font-mono text-amber-400">
              {Math.floor(cooldownRemainingSeconds / 60)}:{(cooldownRemainingSeconds % 60).toString().padStart(2, '0')}
            </span>
          </div>
        )}

        {/* Real-Time Risk Meters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-slate-800/40 p-3.5 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Capital at Risk</span>
            <span className="text-lg font-black font-mono text-white block">
              ₹{investedValue.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-400">
              {((investedValue / 1000000) * 100).toFixed(1)}% of ₹10L capital
            </span>
          </div>

          <div className="bg-slate-800/40 p-3.5 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Daily Drawdown</span>
            <span className={`text-lg font-black font-mono block ${totalPnL < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {totalPnL < 0 ? `-₹${Math.abs(totalPnL).toLocaleString('en-IN')}` : '₹0.00 (Safe)'}
            </span>
            <span className="text-[10px] text-slate-400">
              Max Limit: ₹{riskConfig.maxDailyLoss.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-slate-800/40 p-3.5 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Mandatory Stop-Loss</span>
            <span className="text-lg font-black text-emerald-400 block flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>ENFORCED</span>
            </span>
            <span className="text-[10px] text-slate-400">
              Bracket order auto-attached
            </span>
          </div>
        </div>

        {/* Guardrail Controls */}
        <div className="space-y-4 bg-slate-800/50 p-5 rounded-2xl border border-slate-700/60">
          <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider">
            Configure Account Risk Limits
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Max Daily Loss */}
            <div className="space-y-1.5">
              <label className="text-slate-400 font-bold block">Max Daily Loss Limit (₹)</label>
              <input
                type="number"
                step="5000"
                value={riskConfig.maxDailyLoss}
                onChange={(e) => setRiskConfig({ ...riskConfig, maxDailyLoss: Number(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Max Position Size % */}
            <div className="space-y-1.5">
              <label className="text-slate-400 font-bold block">Max Position Size (% of Capital)</label>
              <input
                type="number"
                min="5"
                max="50"
                value={riskConfig.maxPositionSizePct}
                onChange={(e) => setRiskConfig({ ...riskConfig, maxPositionSizePct: Number(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Max Trades Per Day */}
            <div className="space-y-1.5">
              <label className="text-slate-400 font-bold block">Max Trades Allowed Per Day</label>
              <input
                type="number"
                min="1"
                max="20"
                value={riskConfig.maxTradesPerDay}
                onChange={(e) => setRiskConfig({ ...riskConfig, maxTradesPerDay: Number(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Mandatory Stop Loss Toggle */}
            <div className="space-y-1.5">
              <label className="text-slate-400 font-bold block">Mandatory Stop-Loss Rule</label>
              <button
                type="button"
                onClick={() => setRiskConfig({ ...riskConfig, mandatoryStopLoss: !riskConfig.mandatoryStopLoss })}
                className={`w-full py-2 px-3 rounded-xl font-bold flex items-center justify-between border transition-all cursor-pointer ${
                  riskConfig.mandatoryStopLoss
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                <span>{riskConfig.mandatoryStopLoss ? 'STRICT REQUIREMENT' : 'OPTIONAL'}</span>
                {riskConfig.mandatoryStopLoss ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Cool-Down Triggers */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">Feeling tilted or hesitant?</span>
            <span className="text-[10px] text-slate-400">Voluntary Emotional Reset</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleStartCooldown(5)}
              className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-xs font-extrabold rounded-xl border border-slate-700 transition-colors cursor-pointer text-center"
            >
              5-Min Cooldown
            </button>
            <button
              type="button"
              onClick={() => handleStartCooldown(15)}
              className="py-2.5 px-4 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-extrabold rounded-xl border border-amber-500/40 transition-colors cursor-pointer text-center"
            >
              15-Min Review Cooldown
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  , document.body);
}
