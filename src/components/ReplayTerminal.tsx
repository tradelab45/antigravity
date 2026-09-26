import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  FastForward, 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  EyeOff, 
  Award, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  ShieldAlert, 
  ArrowRight,
  Flame,
  Info,
  SlidersHorizontal,
  ChevronRight,
  HelpCircle
} from 'lucide-react';
import { REPLAY_SCENARIOS } from '../data/replayData';
import { ReplayScenario, ReplayCandle } from '../types';
import { useSimulator } from '../context/SimulatorContext';

export function ReplayTerminal() {
  const { userXP, completeLesson, notifyUser } = useSimulator();
  const [selectedScenario, setSelectedScenario] = useState<ReplayScenario>(REPLAY_SCENARIOS[0]);
  const [isBlindMode, setIsBlindMode] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(2); // 1x, 2x, 5x, 10x, 50x
  const [currentCandleIndex, setCurrentCandleIndex] = useState<number>(0);
  
  // Simulated Replay Positions & Trade State
  const [replayPosition, setReplayPosition] = useState<{
    side: 'BUY' | 'SELL';
    qty: number;
    entryPrice: number;
    entryTime: string;
    stopLoss?: number;
    target?: number;
  } | null>(null);
  
  const [completedReplayTrades, setCompletedReplayTrades] = useState<Array<{
    side: 'BUY' | 'SELL';
    qty: number;
    entryPrice: number;
    exitPrice: number;
    entryTime: string;
    exitTime: string;
    pnl: number;
    pnlPct: number;
    hadStopLoss: boolean;
    hadTarget: boolean;
    exitReason: string;
  }>>([]);

  const [tradeQuantity, setTradeQuantity] = useState<number>(100);
  const [replayStopLoss, setReplayStopLoss] = useState<number | ''>('');
  const [replayTarget, setReplayTarget] = useState<number | ''>('');
  const [showRevealModal, setShowRevealModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'SCENARIOS' | 'TERMINAL' | 'REVIEW'>('TERMINAL');

  const visibleCandles = useMemo(() => {
    return selectedScenario.candles.slice(0, currentCandleIndex + 1);
  }, [selectedScenario, currentCandleIndex]);

  const currentCandle = visibleCandles[visibleCandles.length - 1] || selectedScenario.candles[0];
  const isSessionFinished = currentCandleIndex >= selectedScenario.candles.length - 1;

  // Timer loop for replay progression
  useEffect(() => {
    let interval: any = null;
    if (isPlaying && !isSessionFinished) {
      const delay = Math.max(100, 1000 / playbackSpeed);
      interval = setInterval(() => {
        setCurrentCandleIndex((prev) => {
          if (prev >= selectedScenario.candles.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, delay);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, playbackSpeed, isSessionFinished, selectedScenario.candles.length]);

  // Check Stop Loss and Target triggers automatically
  useEffect(() => {
    if (!replayPosition || !currentCandle) return;

    if (replayPosition.side === 'BUY') {
      if (replayPosition.stopLoss && currentCandle.low <= replayPosition.stopLoss) {
        handleClosePosition(replayPosition.stopLoss, 'Stop-Loss Hit');
      } else if (replayPosition.target && currentCandle.high >= replayPosition.target) {
        handleClosePosition(replayPosition.target, 'Target Hit');
      }
    } else {
      if (replayPosition.stopLoss && currentCandle.high >= replayPosition.stopLoss) {
        handleClosePosition(replayPosition.stopLoss, 'Stop-Loss Hit');
      } else if (replayPosition.target && currentCandle.low <= replayPosition.target) {
        handleClosePosition(replayPosition.target, 'Target Hit');
      }
    }
  }, [currentCandleIndex, replayPosition]);

  const handleExecuteTrade = (side: 'BUY' | 'SELL') => {
    if (replayPosition) {
      handleClosePosition(currentCandle.close, 'Manual Exit');
    }
    const sl = replayStopLoss !== '' ? Number(replayStopLoss) : undefined;
    const tgt = replayTarget !== '' ? Number(replayTarget) : undefined;

    setReplayPosition({
      side,
      qty: tradeQuantity,
      entryPrice: currentCandle.close,
      entryTime: currentCandle.time,
      stopLoss: sl,
      target: tgt
    });

    notifyUser(
      `Replay ${side} Executed`,
      `${side} ${tradeQuantity} shares of ${isBlindMode ? selectedScenario.blindName : selectedScenario.realSymbol} @ ₹${currentCandle.close.toFixed(2)}`,
      'SUCCESS'
    );
  };

  const handleClosePosition = (exitPrice: number, reason: string) => {
    if (!replayPosition) return;
    const pnl = replayPosition.side === 'BUY'
      ? (exitPrice - replayPosition.entryPrice) * replayPosition.qty
      : (replayPosition.entryPrice - exitPrice) * replayPosition.qty;
    
    const pnlPct = replayPosition.side === 'BUY'
      ? ((exitPrice - replayPosition.entryPrice) / replayPosition.entryPrice) * 100
      : ((replayPosition.entryPrice - exitPrice) / replayPosition.entryPrice) * 100;

    setCompletedReplayTrades((prev) => [
      ...prev,
      {
        side: replayPosition.side,
        qty: replayPosition.qty,
        entryPrice: replayPosition.entryPrice,
        exitPrice,
        entryTime: replayPosition.entryTime,
        exitTime: currentCandle.time,
        pnl,
        pnlPct,
        hadStopLoss: Boolean(replayPosition.stopLoss),
        hadTarget: Boolean(replayPosition.target),
        exitReason: reason
      }
    ]);

    setReplayPosition(null);
    notifyUser(
      `Replay Position Closed (${reason})`,
      `P&L: ${pnl >= 0 ? '+' : ''}₹${pnl.toFixed(2)} (${pnlPct.toFixed(2)}%)`,
      pnl >= 0 ? 'SUCCESS' : 'WARNING'
    );
  };

  const handleResetSession = () => {
    setIsPlaying(false);
    setCurrentCandleIndex(0);
    setReplayPosition(null);
    setCompletedReplayTrades([]);
    setShowRevealModal(false);
  };

  const handleEndAndReveal = () => {
    if (replayPosition) {
      handleClosePosition(currentCandle.close, 'Session End Close');
    }
    setIsPlaying(false);
    setShowRevealModal(true);
  };

  const totalReplayPnL = useMemo(() => {
    const closed = completedReplayTrades.reduce((acc, t) => acc + t.pnl, 0);
    let open = 0;
    if (replayPosition) {
      open = replayPosition.side === 'BUY'
        ? (currentCandle.close - replayPosition.entryPrice) * replayPosition.qty
        : (replayPosition.entryPrice - currentCandle.close) * replayPosition.qty;
    }
    return closed + open;
  }, [completedReplayTrades, replayPosition, currentCandle]);

  const sessionScorecard = useMemo(() => {
    const count = completedReplayTrades.length;
    if (count === 0) return { entry: 0, risk: 0, patience: 0, mistakes: ['No completed trade evidence'], overall: 0 };
    const planned = completedReplayTrades.filter((trade) => trade.hadStopLoss && trade.hadTarget).length;
    const protectedTrades = completedReplayTrades.filter((trade) => trade.hadStopLoss).length;
    const winners = completedReplayTrades.filter((trade) => trade.pnl > 0).length;
    const entry = Math.round(Math.min(100, 35 + (planned / count) * 45 + (winners / count) * 20));
    const risk = Math.round((protectedTrades / count) * 100);
    const patience = Math.round(Math.max(20, 100 - Math.max(0, count - 2) * 18));
    const mistakes = [
      protectedTrades < count ? `${count - protectedTrades} trade${count - protectedTrades === 1 ? '' : 's'} entered without a stop-loss` : '',
      planned < count ? `${count - planned} trade${count - planned === 1 ? '' : 's'} lacked a complete stop-and-target plan` : '',
      count > 4 ? 'High trade frequency reduced the patience score' : '',
    ].filter(Boolean);
    return { entry, risk, patience, mistakes: mistakes.length ? mistakes : ['No major process mistakes detected'], overall: Math.round((entry + risk + patience) / 3) };
  }, [completedReplayTrades]);

  // SVG Chart Dimensions calculation
  const chartHeight = 300;
  const chartWidth = 720;
  const padding = { top: 20, bottom: 40, left: 60, right: 20 };

  const minPrice = Math.min(...visibleCandles.map((c) => c.low)) * 0.995;
  const maxPrice = Math.max(...visibleCandles.map((c) => c.high)) * 1.005;
  const priceRange = maxPrice - minPrice || 1;

  const getY = (price: number) => {
    return chartHeight - padding.bottom - ((price - minPrice) / priceRange) * (chartHeight - padding.top - padding.bottom);
  };

  const getX = (index: number) => {
    const totalSlots = Math.max(selectedScenario.candles.length, 15);
    const availableWidth = chartWidth - padding.left - padding.right;
    return padding.left + (index / (totalSlots - 1)) * availableWidth;
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Historical Replay Engine
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 uppercase">
                Zero Hindsight Bias
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {isBlindMode ? selectedScenario.blindName : `${selectedScenario.realSymbol} — ${selectedScenario.title}`}
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl">
              {isBlindMode
                ? "Blind Session active: Stock symbol and date are hidden. Focus purely on price action, VWAP anchors, and risk-reward execution."
                : `${selectedScenario.realDate} • ${selectedScenario.tagline}`}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Blind Mode Toggle */}
            <button
              type="button"
              onClick={() => setIsBlindMode(!isBlindMode)}
              aria-pressed={isBlindMode}
              className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 border transition-all cursor-pointer ${
                isBlindMode 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/40 hover:bg-amber-500/30' 
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {isBlindMode ? <EyeOff className="w-4 h-4 shrink-0" /> : <Eye className="w-4 h-4 shrink-0" />}
              <span>{isBlindMode ? 'Blind Mode ON' : 'Blind Mode OFF'}</span>
            </button>

            {/* Scenario Picker */}
            <select
              value={selectedScenario.id}
              onChange={(e) => {
                const sc = REPLAY_SCENARIOS.find((s) => s.id === e.target.value);
                if (sc) {
                  setSelectedScenario(sc);
                  handleResetSession();
                }
              }}
              className="bg-slate-800 border border-slate-700 text-white text-xs font-bold rounded-xl px-3 py-2 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              {REPLAY_SCENARIOS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.category}: {s.title} ({s.difficulty})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Terminal Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Replay Chart & Timeline (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg text-white space-y-4">
            {/* Chart Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white font-mono">
                    ₹{currentCandle.close.toFixed(2)}
                  </span>
                  <span className={`text-xs font-extrabold ${currentCandle.close >= selectedScenario.initialPrice ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {currentCandle.close >= selectedScenario.initialPrice ? '+' : ''}
                    {(((currentCandle.close - selectedScenario.initialPrice) / selectedScenario.initialPrice) * 100).toFixed(2)}%
                  </span>
                </div>
                <div className="h-4 w-px bg-slate-700" />
                <div className="text-xs text-slate-400 font-mono">
                  Time: <span className="text-white font-bold">{currentCandle.time}</span>
                </div>
              </div>

              {/* Playback Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetSession}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
                  title="Reset Replay"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  disabled={isSessionFinished}
                  className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                    isPlaying
                      ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                      : 'bg-indigo-600 text-white hover:bg-indigo-500'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                  <span>{isPlaying ? 'PAUSE' : 'PLAY REPLAY'}</span>
                </button>

                {/* Speed Multipliers */}
                <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl p-0.5">
                  {[1, 2, 5, 10, 50].map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => setPlaybackSpeed(spd)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                        playbackSpeed === spd
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (currentCandleIndex < selectedScenario.candles.length - 1) {
                      setCurrentCandleIndex((prev) => prev + 1);
                    }
                  }}
                  disabled={isSessionFinished}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-40"
                  title="Step 1 Candle"
                >
                  +1 Bar
                </button>
              </div>
            </div>

            {/* Interactive SVG Candlestick / Price Chart */}
            <div className="w-full overflow-x-auto bg-slate-950/80 rounded-2xl p-2 border border-slate-800/80">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto select-none">
                {/* Horizontal Price Grid Lines */}
                {[0.2, 0.4, 0.6, 0.8].map((ratio, i) => {
                  const p = minPrice + priceRange * ratio;
                  const y = getY(p);
                  return (
                    <g key={i}>
                      <line x1={padding.left} y1={y} x2={chartWidth - padding.right} y2={y} stroke="#1e293b" strokeDasharray="3,3" />
                      <text x={padding.left - 8} y={y + 4} fill="#64748b" fontSize="10" textAnchor="end" fontFamily="monospace">
                        ₹{p.toFixed(1)}
                      </text>
                    </g>
                  );
                })}

                {/* VWAP Line */}
                <path
                  d={visibleCandles.reduce((acc, c, idx) => {
                    const x = getX(idx);
                    const y = getY(c.vwap || c.close);
                    return `${acc} ${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }, '')}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                  strokeDasharray="2,2"
                  opacity="0.7"
                />

                {/* Candlesticks */}
                {visibleCandles.map((candle, idx) => {
                  const x = getX(idx);
                  const isUp = candle.close >= candle.open;
                  const candleColor = isUp ? '#10b981' : '#f43f5e';
                  const yHigh = getY(candle.high);
                  const yLow = getY(candle.low);
                  const yOpen = getY(candle.open);
                  const yClose = getY(candle.close);
                  const bodyTop = Math.min(yOpen, yClose);
                  const bodyHeight = Math.max(Math.abs(yClose - yOpen), 2);
                  const candleWidth = 8;

                  return (
                    <g key={idx}>
                      {/* High-Low Wick */}
                      <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={candleColor} strokeWidth="1.5" />
                      {/* Candle Body */}
                      <rect
                        x={x - candleWidth / 2}
                        y={bodyTop}
                        width={candleWidth}
                        height={bodyHeight}
                        fill={candleColor}
                        rx="1"
                      />
                      {/* Time Labels on bottom */}
                      {idx % 4 === 0 && (
                        <text x={x} y={chartHeight - 12} fill="#64748b" fontSize="9" textAnchor="middle" fontFamily="monospace">
                          {candle.time}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Entry marker if position active */}
                {replayPosition && (
                  <g>
                    <line
                      x1={padding.left}
                      y1={getY(replayPosition.entryPrice)}
                      x2={chartWidth - padding.right}
                      y2={getY(replayPosition.entryPrice)}
                      stroke={replayPosition.side === 'BUY' ? '#10b981' : '#f43f5e'}
                      strokeWidth="1.5"
                      strokeDasharray="4,4"
                    />
                    <text
                      x={chartWidth - padding.right - 10}
                      y={getY(replayPosition.entryPrice) - 4}
                      fill={replayPosition.side === 'BUY' ? '#10b981' : '#f43f5e'}
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="end"
                    >
                      ENTRY: ₹{replayPosition.entryPrice.toFixed(2)} ({replayPosition.side})
                    </text>
                  </g>
                )}
              </svg>
            </div>

            {/* Replay Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs text-slate-400 font-medium">
                <span>Session Progress</span>
                <span>
                  {currentCandleIndex + 1} / {selectedScenario.candles.length} Candles ({Math.round(((currentCandleIndex + 1) / selectedScenario.candles.length) * 100)}%)
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-200"
                  style={{ width: `${((currentCandleIndex + 1) / selectedScenario.candles.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Execution Ticket & Position Card (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Active Replay Position Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg text-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                Replay Position
              </span>
              <span className={`text-xs font-black font-mono px-2 py-0.5 rounded-full ${
                totalReplayPnL >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
              }`}>
                {totalReplayPnL >= 0 ? '+' : ''}₹{totalReplayPnL.toFixed(2)}
              </span>
            </div>

            {replayPosition ? (
              <div className="space-y-3 bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-black px-2.5 py-1 rounded-md ${
                    replayPosition.side === 'BUY' ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
                  }`}>
                    {replayPosition.side} {replayPosition.qty} QTY
                  </span>
                  <span className="text-xs font-mono text-slate-300">
                    Entry: ₹{replayPosition.entryPrice.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Current P&L:</span>
                  {(() => {
                    const pnl = replayPosition.side === 'BUY'
                      ? (currentCandle.close - replayPosition.entryPrice) * replayPosition.qty
                      : (replayPosition.entryPrice - currentCandle.close) * replayPosition.qty;
                    const pnlPct = replayPosition.side === 'BUY'
                      ? ((currentCandle.close - replayPosition.entryPrice) / replayPosition.entryPrice) * 100
                      : ((replayPosition.entryPrice - currentCandle.close) / replayPosition.entryPrice) * 100;
                    const isGain = pnl >= 0;
                    return (
                      <span className={`font-black font-mono text-sm ${isGain ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isGain ? '+' : ''}₹{pnl.toFixed(2)} ({pnlPct.toFixed(2)}%)
                      </span>
                    );
                  })()}
                </div>

                <button
                  type="button"
                  onClick={() => handleClosePosition(currentCandle.close, 'Manual Close')}
                  className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer"
                >
                  Close Position @ Market
                </button>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-500 font-medium">
                No active position. Use the execution ticket below to enter a trade during the replay!
              </div>
            )}

            {/* Replay Order Execution Ticket */}
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleExecuteTrade('BUY')}
                  className="py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-2xl flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-95"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>BUY MARKET</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExecuteTrade('SELL')}
                  className="py-3 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-2xl flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-95"
                >
                  <TrendingDown className="w-4 h-4" />
                  <span>SELL SHORT</span>
                </button>
              </div>

              {/* Order Parameters */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Quantity</label>
                  <input
                    type="number"
                    value={tradeQuantity}
                    onChange={(e) => setTradeQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-slate-800 border border-slate-700 text-white font-mono rounded-xl px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Stop Loss (₹)</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="Optional"
                    value={replayStopLoss}
                    onChange={(e) => setReplayStopLoss(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 text-white font-mono rounded-xl px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Target (₹)</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="Optional"
                    value={replayTarget}
                    onChange={(e) => setReplayTarget(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 text-white font-mono rounded-xl px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* End & Reveal Button */}
              <button
                type="button"
                onClick={handleEndAndReveal}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white text-xs font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer active:scale-98"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>END SESSION & REVEAL DATA</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* REVEAL & POST-SESSION PERFORMANCE MODAL */}
      {showRevealModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 text-white shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                    Session Reveal & Performance Review
                  </span>
                  <h3 className="text-xl font-black text-white">
                    {selectedScenario.realSymbol} — {selectedScenario.realDate}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRevealModal(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Historical Narrative */}
            <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 space-y-2">
              <h4 className="text-xs font-black text-indigo-300 uppercase tracking-wider">
                What Really Happened
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedScenario.historicalContext}
              </p>
            </div>

            {/* Performance Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Net Replay P&L</span>
                <span className={`text-base font-black font-mono mt-0.5 block ${totalReplayPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {totalReplayPnL >= 0 ? '+' : ''}₹{totalReplayPnL.toFixed(2)}
                </span>
              </div>
              <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Trades Taken</span>
                <span className="text-base font-black font-mono text-white mt-0.5 block">
                  {completedReplayTrades.length}
                </span>
              </div>
              <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Skill Score Impact</span>
                <span className="text-base font-black font-mono text-indigo-300 mt-0.5 block">
                  +35 XP
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-700 bg-slate-800/45 p-4">
              <div className="flex items-center justify-between gap-3">
                <div><h4 className="text-xs font-black uppercase tracking-wider text-white">Post-session process scorecard</h4><p className="text-[10px] text-slate-400">Based only on actions taken in this replay.</p></div>
                <span className="rounded-xl bg-indigo-500/20 px-3 py-1 font-mono text-sm font-black text-indigo-300">{sessionScorecard.overall}/100</span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[['Entry quality', sessionScorecard.entry], ['Risk plan', sessionScorecard.risk], ['Patience', sessionScorecard.patience]].map(([label, value]) => (
                  <div key={String(label)} className="rounded-xl border border-slate-700 bg-slate-900/60 p-3 text-center"><span className="block text-[9px] font-bold uppercase text-slate-400">{label}</span><span className="mt-1 block font-mono text-lg font-black text-white">{value}</span></div>
                ))}
              </div>
              <div className="mt-3 space-y-1.5">{sessionScorecard.mistakes.map((mistake) => <div key={mistake} className="flex items-start gap-2 text-[11px] text-slate-300"><ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" /><span>{mistake}</span></div>)}</div>
            </div>

            {/* Key Lessons */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider">
                Key Professional Lessons from this Session
              </h4>
              <div className="space-y-2">
                {selectedScenario.keyLessons.map((lesson, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 bg-slate-800/30 p-3 rounded-xl border border-slate-800 text-xs text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{lesson}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  completeLesson(`replay-${selectedScenario.id}`, 35);
                  setShowRevealModal(false);
                  handleResetSession();
                }}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition-all cursor-pointer"
              >
                Save Review & Try Another Scenario
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
