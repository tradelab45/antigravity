import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Swords, 
  TrendingUp, 
  TrendingDown, 
  Award, 
  Zap, 
  ShieldCheck, 
  Activity, 
  Crown, 
  Scale, 
  ArrowRight,
  Flame,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';
import confetti from 'canvas-confetti';
import { useSimulator } from '../../../context/SimulatorContext';
import { formatINR, formatPercent } from '../../../utils/formatters';
import { playOrderFilledSound, playSuccessChime } from '../../../utils/soundEffects';
import type { StockDetail } from '../../../types';
import { useModalDialog } from '../../../hooks/useModalDialog';

interface StockBattleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStock?: (stock: StockDetail) => void;
}

interface RivalryPreset {
  id: string;
  title: string;
  tagline: string;
  symbolA: string;
  symbolB: string;
}

const PRESET_RIVALRIES: RivalryPreset[] = [
  {
    id: 'auto-titans',
    title: 'Tata Motors vs Mahindra & Mahindra',
    tagline: 'The Great Indian EV & SUV Supremacy Duel',
    symbolA: 'TATAMOTORS',
    symbolB: 'M&M',
  },
  {
    id: 'it-giants',
    title: 'TCS vs Infosys',
    tagline: 'Dalal Street Tech Titans & Compounding Machines',
    symbolA: 'TCS',
    symbolB: 'INFY',
  },
  {
    id: 'banking-supremacy',
    title: 'HDFC Bank vs ICICI Bank',
    tagline: 'The Ultimate Private Banking Credit Fortress Clash',
    symbolA: 'HDFCBANK',
    symbolB: 'ICICIBANK',
  },
  {
    id: 'conglomerate-clash',
    title: 'Reliance Industries vs Adani Enterprises',
    tagline: 'Mega-Cap Infrastructure & Energy Overlords',
    symbolA: 'RELIANCE',
    symbolB: 'ADANIENT',
  },
  {
    id: 'growth-vs-moat',
    title: 'Zomato vs Bharti Airtel',
    tagline: 'High-Beta Quick Commerce vs Cash-Flow Telecom Moat',
    symbolA: 'ZOMATO',
    symbolB: 'BHARTIARTL',
  },
];

export const StockBattleModal: React.FC<StockBattleModalProps> = ({
  isOpen,
  onClose,
  onSelectStock,
}) => {
  const { stocks, executeBuyOrder } = useSimulator();

  const [selectedPresetId, setSelectedPresetId] = useState<string>('auto-titans');
  const [customSymbolA, setCustomSymbolA] = useState<string>('TATAMOTORS');
  const [customSymbolB, setCustomSymbolB] = useState<string>('M&M');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [orderNotification, setOrderNotification] = useState<{ symbol: string; qty: number } | null>(null);

  const activePreset = useMemo(() => {
    return PRESET_RIVALRIES.find((p) => p.id === selectedPresetId) || PRESET_RIVALRIES[0];
  }, [selectedPresetId]);

  const symbolA = isCustomMode ? customSymbolA : activePreset.symbolA;
  const symbolB = isCustomMode ? customSymbolB : activePreset.symbolB;

  const stockA = useMemo(() => {
    return stocks.find((s) => s.symbol === symbolA) || stocks[0];
  }, [stocks, symbolA]);

  const stockB = useMemo(() => {
    return stocks.find((s) => s.symbol === symbolB) || stocks[1] || stocks[0];
  }, [stocks, symbolB]);

  const { scoreA, scoreB, percentA, percentB, leader } = useMemo(() => {
    if (!stockA || !stockB) {
      return { scoreA: 50, scoreB: 50, percentA: 50, percentB: 50, leader: 'TIE' as const };
    }

    const changeA = stockA.changePercent || 0;
    const changeB = stockB.changePercent || 0;
    const momA = Math.max(0, Math.min(30, 15 + changeA * 3));
    const momB = Math.max(0, Math.min(30, 15 + changeB * 3));

    const highA = stockA.high52 || stockA.price * 1.1;
    const lowA = stockA.low52 || stockA.price * 0.9;
    const proxA = highA > lowA ? ((stockA.price - lowA) / (highA - lowA)) * 25 : 12.5;

    const highB = stockB.high52 || stockB.price * 1.1;
    const lowB = stockB.low52 || stockB.price * 0.9;
    const proxB = highB > lowB ? ((stockB.price - lowB) / (highB - lowB)) * 25 : 12.5;

    const peA = stockA.peRatio || 25;
    const peB = stockB.peRatio || 25;
    const valScoreA = peA < 20 ? 25 : peA < 40 ? 20 : peA < 70 ? 14 : 9;
    const valScoreB = peB < 20 ? 25 : peB < 40 ? 20 : peB < 70 ? 14 : 9;

    const moatA = 18;
    const moatB = 18;

    const totalA = momA + proxA + valScoreA + moatA;
    const totalB = momB + proxB + valScoreB + moatB;

    const sum = totalA + totalB || 1;
    const pA = Math.round((totalA / sum) * 100);
    const pB = 100 - pA;

    return {
      scoreA: Math.round(totalA),
      scoreB: Math.round(totalB),
      percentA: pA,
      percentB: pB,
      leader: pA > pB ? 'A' : pA < pB ? 'B' : 'TIE',
    };
  }, [stockA, stockB]);

  // Head-to-head on four measures, each computed only from what the data holds
  // for both shares. A measure either share lacks is left out rather than
  // filled in. The first version filled gaps with stand-ins that differed by
  // side (an ROE of 18.5% for the left share and 16.2% for the right, leverage
  // of 0.42x against 0.58x), so a share with missing data won or lost by
  // construction. It also called the rise from the 52-week low a "1-Year
  // Return", which it is not.
  const radarData = useMemo(() => {
    if (!stockA || !stockB) return [];

    const positive = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n > 0;
    const score = (n: number) => Math.max(15, Math.min(95, Math.round(n)));
    const winnerBy = (a: number, b: number, higherWins: boolean) =>
      a === b ? 'TIE' : (a > b) === higherWins ? 'A' : 'B';

    const rows: Array<{
      metric: string;
      scoreA: number;
      scoreB: number;
      rawA: string;
      rawB: string;
      winner: 'A' | 'B' | 'TIE';
      explainer: string;
    }> = [];

    if (positive(stockA.peRatio) && positive(stockB.peRatio)) {
      const peA = stockA.peRatio;
      const peB = stockB.peRatio;
      rows.push({
        metric: 'P/E Valuation',
        scoreA: score(100 - (peA / 60) * 55),
        scoreB: score(100 - (peB / 60) * 55),
        rawA: `${peA.toFixed(1)}x`,
        rawB: `${peB.toFixed(1)}x`,
        winner: winnerBy(peA, peB, false),
        explainer: 'Lower P/E = higher earnings yield per ₹ paid',
      });
    }

    if (positive(stockA.low52) && positive(stockB.low52)) {
      const upA = ((stockA.price - stockA.low52) / stockA.low52) * 100;
      const upB = ((stockB.price - stockB.low52) / stockB.low52) * 100;
      rows.push({
        metric: 'Above 52-week low',
        scoreA: score((upA / 90) * 70 + 20),
        scoreB: score((upB / 90) * 70 + 20),
        rawA: `+${upA.toFixed(1)}%`,
        rawB: `+${upB.toFixed(1)}%`,
        winner: winnerBy(upA, upB, true),
        explainer: 'How far the price has risen from its lowest point of the past year. Not a one-year return.',
      });
    }

    const roeOf = (stock: StockDetail): number | null => {
      if (typeof stock.roe === 'number' && Number.isFinite(stock.roe) && stock.roe !== 0) return stock.roe;
      const calculated = stock.dupontAnalysis?.calculatedRoe;
      return typeof calculated === 'number' && Number.isFinite(calculated) && calculated !== 0 ? calculated * 100 : null;
    };
    const roeA = roeOf(stockA);
    const roeB = roeOf(stockB);
    if (roeA !== null && roeB !== null) {
      rows.push({
        metric: 'Return on Equity (RoE)',
        scoreA: score((roeA / 35) * 80 + 15),
        scoreB: score((roeB / 35) * 80 + 15),
        rawA: `${roeA.toFixed(1)}%`,
        rawB: `${roeB.toFixed(1)}%`,
        winner: winnerBy(roeA, roeB, true),
        explainer: 'Profit generated per ₹1 of equity capital',
      });
    }

    // The DuPont equity multiplier is assets ÷ equity, so one less than it is
    // total liabilities per ₹1 of equity. Borrowing is part of that, not all
    // of it, which is why this is not labelled debt-to-equity.
    const multA = stockA.dupontAnalysis?.equityMultiplier;
    const multB = stockB.dupontAnalysis?.equityMultiplier;
    if (positive(multA) && positive(multB)) {
      const levA = Math.max(0, multA - 1);
      const levB = Math.max(0, multB - 1);
      rows.push({
        metric: 'Liabilities to equity',
        scoreA: score(100 - levA * 35),
        scoreB: score(100 - levB * 35),
        rawA: `${levA.toFixed(2)}x`,
        rawB: `${levB.toFixed(2)}x`,
        winner: winnerBy(levA, levB, false),
        explainer: 'Total liabilities per ₹1 of equity. Lower means less leverage and less interest risk.',
      });
    }

    return rows;
  }, [stockA, stockB]);

  const handleQuickBackStock = (stock: StockDetail, shares = 10) => {
    const res = executeBuyOrder(stock.symbol, shares, 'MARKET', stock.price, 'CNC');
    if (res.success) {
      playOrderFilledSound();
      playSuccessChime();
      setOrderNotification({ symbol: stock.symbol, qty: shares });
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#8b5cf6', '#6366f1', '#00f59b', '#f59e0b'],
          disableForReducedMotion: true,
        });
      } catch {}
      setTimeout(() => setOrderNotification(null), 3500);
    }
  };

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const { ref: dialogRef, dialogProps } = useModalDialog({
    onClose,
    open: isOpen,
    label: 'One versus one stock battle',
    // The component binds Escape itself.
    closeOnEscape: false,
  });

  if (!isOpen) return null;

  return (
    <div
      id="stock-battle-modal"
      ref={dialogRef}
      {...dialogProps}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-hidden"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        transition={{ duration: 0.22 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 text-white border border-violet-500/30 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden relative"
      >
        <div className="absolute top-0 left-1/4 w-96 h-36 bg-violet-600/20 blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-96 h-36 bg-indigo-600/20 blur-3xl pointer-events-none" />

        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 text-amber-300 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-1.5">
                  1v1 Blue-Chip Stock Battle Arena
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 text-[10px] font-black uppercase tracking-wider">
                  Dalal Street Coliseum
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Side-by-side comparative analysis, real-time momentum tug-of-war, and Chanakya AI Arbiter judgment.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/40 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-400" /> Rivalries:
          </span>
          {PRESET_RIVALRIES.map((preset) => {
            const isActive = !isCustomMode && selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => {
                  setIsCustomMode(false);
                  setSelectedPresetId(preset.id);
                }}
                className={
                  "px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer " +
                  (isActive
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/25"
                    : "bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60")
                }
              >
                {preset.title}
              </button>
            );
          })}

          <button
            onClick={() => setIsCustomMode(true)}
            className={
              "px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer " +
              (isCustomMode
                ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md"
                : "bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60")
            }
          >
            ⚔️ Custom Matchup
          </button>
        </div>

        {isCustomMode && (
          <div className="p-3 bg-violet-950/30 border-b border-slate-800 flex flex-wrap items-center justify-center gap-4 text-xs font-bold">
            <div className="flex items-center gap-2">
              <span className="text-violet-300">Contender A:</span>
              <select
                value={customSymbolA}
                onChange={(e) => setCustomSymbolA(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1 text-white font-mono"
              >
                {stocks.map((s) => (
                  <option key={"a-" + s.symbol} value={s.symbol}>
                    {s.symbol} — {s.name}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-amber-400 font-black text-sm">VS</span>

            <div className="flex items-center gap-2">
              <span className="text-indigo-300">Contender B:</span>
              <select
                value={customSymbolB}
                onChange={(e) => setCustomSymbolB(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1 text-white font-mono"
              >
                {stocks.map((s) => (
                  <option key={"b-" + s.symbol} value={s.symbol}>
                    {s.symbol} — {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-6">
          <AnimatePresence>
            {orderNotification && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold flex items-center justify-between shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>
                    Simulated buy order placed! Bought <strong>{orderNotification.qty} shares</strong> of{" "}
                    <strong>{orderNotification.symbol}</strong>.
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-black uppercase">Order Filled ✓</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* THE VISUAL TUG-OF-WAR MOMENTUM BAR */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between text-xs font-black">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-violet-400 animate-pulse" />
                <span className="text-violet-300 font-bold uppercase tracking-wider">
                  {stockA.symbol} ({percentA}%)
                </span>
                {leader === 'A' && (
                  <span className="flex items-center gap-1 text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full">
                    <Crown className="w-3 h-3 text-amber-400" /> Momentum Lead
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono">
                <Scale className="w-3.5 h-3.5 text-amber-400" />
                <span>Financial Strength Tug-of-War</span>
              </div>

              <div className="flex items-center gap-2">
                {leader === 'B' && (
                  <span className="flex items-center gap-1 text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full">
                    <Crown className="w-3 h-3 text-amber-400" /> Momentum Lead
                  </span>
                )}
                <span className="text-indigo-300 font-bold uppercase tracking-wider">
                  {stockB.symbol} ({percentB}%)
                </span>
                <span className="w-3 h-3 rounded-full bg-indigo-400 animate-pulse" />
              </div>
            </div>

            <div className="relative h-7 w-full rounded-2xl bg-slate-800/80 p-1 flex overflow-hidden border border-slate-700/80">
              <motion.div
                className="h-full rounded-xl bg-gradient-to-r from-violet-600 via-purple-500 to-emerald-400 flex items-center justify-start px-3 font-mono text-[11px] font-black text-slate-950 shadow-inner"
                animate={{ width: percentA + "%" }}
                transition={{ type: 'spring', stiffness: 120, damping: 18 }}
              >
                {percentA > 20 && <span>{stockA.symbol} • {percentA}%</span>}
              </motion.div>

              <motion.div
                className="h-full rounded-xl bg-gradient-to-l from-indigo-600 via-sky-500 to-amber-300 flex items-center justify-end px-3 font-mono text-[11px] font-black text-slate-950 shadow-inner"
                animate={{ width: percentB + "%" }}
                transition={{ type: 'spring', stiffness: 120, damping: 18 }}
              >
                {percentB > 20 && <span>{percentB}% • {stockB.symbol}</span>}
              </motion.div>

              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white border-2 border-slate-900 flex items-center justify-center text-slate-900 shadow-md pointer-events-none"
                style={{ left: percentA + "%" }}
              >
                <Swords className="w-3.5 h-3.5 text-violet-700" />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
              <span>RSI &amp; 1-Day Price Action</span>
              <span>52-Week High Proximity</span>
              <span>P/E Valuation Multiple</span>
            </div>
          </div>

          {/* SIDE-BY-SIDE CONTENDER HERO CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Contender A Card */}
            <div className="bg-slate-950/70 border border-violet-500/30 rounded-3xl p-5 sm:p-6 space-y-4 relative overflow-hidden shadow-xl flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />

              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-black tracking-wider uppercase text-violet-400 bg-violet-500/15 border border-violet-500/30 px-2 py-0.5 rounded-full">
                      Corner A • {stockA.sector}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white mt-1.5">
                      {stockA.name}
                    </h3>
                    <div className="text-xs font-mono font-bold text-slate-400">
                      NSE: {stockA.symbol}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xl sm:text-2xl font-black font-mono text-white">
                      {formatINR(stockA.price)}
                    </div>
                    <div className={
                      "text-xs font-black inline-flex items-center gap-0.5 mt-0.5 " +
                      ((stockA.change || 0) >= 0 ? "text-emerald-400" : "text-rose-400")
                    }>
                      {(stockA.change || 0) >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      <span>{formatPercent(stockA.changePercent || 0)}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 mt-4 pt-4 border-t border-slate-800 text-xs">
                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">P/E Ratio</span>
                    <span className="font-mono font-black text-slate-200 text-sm">
                      {stockA.peRatio ? stockA.peRatio.toFixed(1) : '—'}x
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">52W High</span>
                    <span className="font-mono font-black text-slate-200 text-sm">
                      {stockA.high52 ? formatINR(stockA.high52) : '—'}
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Market Cap</span>
                    <span className="font-mono font-black text-slate-200 text-sm">
                      {stockA.marketCapCr ? ("₹" + Math.round(stockA.marketCapCr).toLocaleString() + " Cr") : 'Large Cap'}
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">52W Low</span>
                    <span className="font-mono font-black text-slate-200 text-sm">
                      {stockA.low52 ? formatINR(stockA.low52) : '—'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickBackStock(stockA, 10)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-xs shadow-md shadow-violet-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>Back {stockA.symbol} (Buy 10)</span>
                </button>
                {onSelectStock && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectStock(stockA);
                      onClose();
                    }}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                    title="Open Deep Analysis Modal"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Contender B Card */}
            <div className="bg-slate-950/70 border border-indigo-500/30 rounded-3xl p-5 sm:p-6 space-y-4 relative overflow-hidden shadow-xl flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-black tracking-wider uppercase text-indigo-400 bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                      Corner B • {stockB.sector}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white mt-1.5">
                      {stockB.name}
                    </h3>
                    <div className="text-xs font-mono font-bold text-slate-400">
                      NSE: {stockB.symbol}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xl sm:text-2xl font-black font-mono text-white">
                      {formatINR(stockB.price)}
                    </div>
                    <div className={
                      "text-xs font-black inline-flex items-center gap-0.5 mt-0.5 " +
                      ((stockB.change || 0) >= 0 ? "text-emerald-400" : "text-rose-400")
                    }>
                      {(stockB.change || 0) >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      <span>{formatPercent(stockB.changePercent || 0)}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 mt-4 pt-4 border-t border-slate-800 text-xs">
                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">P/E Ratio</span>
                    <span className="font-mono font-black text-slate-200 text-sm">
                      {stockB.peRatio ? stockB.peRatio.toFixed(1) : '—'}x
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">52W High</span>
                    <span className="font-mono font-black text-slate-200 text-sm">
                      {stockB.high52 ? formatINR(stockB.high52) : '—'}
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Market Cap</span>
                    <span className="font-mono font-black text-slate-200 text-sm">
                      {stockB.marketCapCr ? ("₹" + Math.round(stockB.marketCapCr).toLocaleString() + " Cr") : 'Large Cap'}
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">52W Low</span>
                    <span className="font-mono font-black text-slate-200 text-sm">
                      {stockB.low52 ? formatINR(stockB.low52) : '—'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickBackStock(stockB, 10)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-black text-xs shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>Back {stockB.symbol} (Buy 10)</span>
                </button>
                {onSelectStock && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectStock(stockB);
                      onClose();
                    }}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                    title="Open Deep Analysis Modal"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* HEAD-TO-HEAD COMPARATIVE RADAR CHART: only the measures both shares have data for */}
          <div className="backdrop-blur-md bg-slate-900/60 border border-slate-700/50 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-violet-400 animate-pulse" />
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <span>Head-to-Head Radar Comparison</span>
                    <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 text-[10px] font-mono font-bold uppercase tracking-wider">
                      Compare Mode
                    </span>
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Multi-axial financial blueprint comparing <strong>{stockA.symbol}</strong> vs <strong>{stockB.symbol}</strong> on the fundamentals both have data for: P/E, the rise from the 52-week low, RoE and liabilities to equity. A measure either share lacks is left out.
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono font-bold shrink-0">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-500/15 border border-violet-500/30 text-violet-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-violet-500" /> {stockA.symbol}
                </span>
                <span className="text-slate-500 font-black">vs</span>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> {stockB.symbol}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Radar Chart Visual */}
              <div className="lg:col-span-6 h-64 sm:h-72 w-full flex items-center justify-center relative">
                {radarData.length >= 3 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                      <PolarGrid stroke="#334155" strokeDasharray="3 3" />
                      <PolarAngleAxis 
                        dataKey="metric" 
                        tick={{ fill: '#cbd5e1', fontSize: 11, fontWeight: 'bold' }} 
                      />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" tick={false} />
                      <Radar
                        name={stockA.symbol}
                        dataKey="scoreA"
                        stroke="#8b5cf6"
                        fill="#8b5cf6"
                        fillOpacity={0.35}
                        strokeWidth={2}
                      />
                      <Radar
                        name={stockB.symbol}
                        dataKey="scoreB"
                        stroke="#06b6d4"
                        fill="#06b6d4"
                        fillOpacity={0.35}
                        strokeWidth={2}
                      />
                      <RechartsTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const item = payload[0].payload as any;
                            return (
                              <div className="backdrop-blur-md bg-slate-950/90 border border-slate-700 p-3 rounded-2xl text-xs text-white shadow-2xl font-mono space-y-1">
                                <div className="font-bold text-amber-300 border-b border-slate-800 pb-1">{item.metric}</div>
                                <div className="text-violet-400 flex items-center justify-between gap-3">
                                  <span>{stockA.symbol}:</span>
                                  <span className="font-black">{item.rawA} (Score {item.scoreA}/100)</span>
                                </div>
                                <div className="text-cyan-400 flex items-center justify-between gap-3">
                                  <span>{stockB.symbol}:</span>
                                  <span className="font-black">{item.rawB} (Score {item.scoreB}/100)</span>
                                </div>
                                <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800 italic">
                                  {item.explainer}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="px-6 text-center text-xs font-semibold text-slate-300">
                    A radar needs at least three measures both shares have data for, and these two share {radarData.length}. The cards alongside compare what there is.
                  </p>
                )}
              </div>

              {/* 4 Metric Comparative Cards */}
              <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {radarData.map((d) => (
                  <div
                    key={d.metric}
                    className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all space-y-2 relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-300 text-[11px]">{d.metric}</span>
                      {d.winner === 'A' ? (
                        <span className="text-[10px] font-mono font-bold text-violet-300 bg-violet-500/20 px-1.5 py-0.5 rounded">
                          🏆 {stockA.symbol}
                        </span>
                      ) : d.winner === 'B' ? (
                        <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-500/20 px-1.5 py-0.5 rounded">
                          🏆 {stockB.symbol}
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                          Tie
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                      <div className={"p-2 rounded-xl border " + (d.winner === 'A' ? "bg-violet-950/40 border-violet-500/40 text-violet-200" : "bg-slate-900 border-slate-800 text-slate-400")}>
                        <div className="text-[9px] text-slate-400 uppercase">{stockA.symbol}</div>
                        <div className="text-sm font-black mt-0.5">{d.rawA}</div>
                      </div>

                      <div className={"p-2 rounded-xl border " + (d.winner === 'B' ? "bg-cyan-950/40 border-cyan-500/40 text-cyan-200" : "bg-slate-900 border-slate-800 text-slate-400")}>
                        <div className="text-[9px] text-slate-400 uppercase">{stockB.symbol}</div>
                        <div className="text-sm font-black mt-0.5">{d.rawB}</div>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400 leading-tight italic pt-0.5">
                      {d.explainer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CHANAKYA ARBITER'S VERDICT */}
          <div className="bg-gradient-to-r from-violet-950/40 via-slate-950 to-indigo-950/40 border border-violet-500/30 rounded-3xl p-5 sm:p-6 space-y-3 shadow-xl">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 text-xs font-black">
                ⚔️
              </div>
              <div>
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <span>Chanakya AI Arbiter Verdict</span>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/30">
                    Dual Profile Breakdown
                  </span>
                </h4>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs leading-relaxed text-slate-300 pt-1">
              <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[11px] font-black text-amber-300 uppercase tracking-wide flex items-center gap-1">
                  🛡️ For Conservative / Long-Term Value Investors
                </span>
                <p>
                  {(stockA.peRatio || 30) <= (stockB.peRatio || 30) ? (
                    <span>
                      <strong className="text-white">{stockA.symbol}</strong> trades at a more conservative valuation multiple (
                      <span className="font-mono text-emerald-400">{(stockA.peRatio || 25).toFixed(1)}x PE</span> vs{" "}
                      <span className="font-mono text-slate-400">{(stockB.peRatio || 30).toFixed(1)}x PE</span>). It offers higher margin of safety against sudden Dalal Street pullbacks.
                    </span>
                  ) : (
                    <span>
                      <strong className="text-white">{stockB.symbol}</strong> trades at a more attractive multiple (
                      <span className="font-mono text-emerald-400">{(stockB.peRatio || 25).toFixed(1)}x PE</span> vs{" "}
                      <span className="font-mono text-slate-400">{(stockA.peRatio || 30).toFixed(1)}x PE</span>). Recommended for patient compounding.
                    </span>
                  )}
                </p>
              </div>

              <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[11px] font-black text-violet-300 uppercase tracking-wide flex items-center gap-1">
                  ⚡ For High-Beta / Momentum &amp; Breakout Traders
                </span>
                <p>
                  {(stockA.changePercent || 0) >= (stockB.changePercent || 0) ? (
                    <span>
                      <strong className="text-white">{stockA.symbol}</strong> commands stronger near-term relative strength (
                      <span className="font-mono text-emerald-400">{formatPercent(stockA.changePercent || 0)}</span> vs{" "}
                      <span className="font-mono text-slate-400">{formatPercent(stockB.changePercent || 0)}</span>). Watch for volume continuation above current session highs.
                    </span>
                  ) : (
                    <span>
                      <strong className="text-white">{stockB.symbol}</strong> commands stronger momentum thrust (
                      <span className="font-mono text-emerald-400">{formatPercent(stockB.changePercent || 0)}</span> vs{" "}
                      <span className="font-mono text-slate-400">{formatPercent(stockA.changePercent || 0)}</span>). Favorable risk-to-reward on intraday pullbacks.
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono">
            RupeeRookie Dalal Street Comparative Analysis • Educational Simulator
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Close Arena
          </button>
        </div>
      </motion.div>
    </div>
  );
};
