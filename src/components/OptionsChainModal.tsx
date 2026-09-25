import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  Activity, 
  Zap, 
  HelpCircle, 
  Info, 
  Check, 
  ArrowUpRight, 
  ArrowDownRight,
  BarChart3,
  Sparkles,
  Sliders,
  DollarSign,
  ShieldAlert,
  Clock
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  ReferenceLine,
  CartesianGrid,
  Legend
} from 'recharts';
import { useSimulator } from '../context/SimulatorContext';
import { generateOptionChain } from '../utils/optionsCalculator';
import { playOrderFilledSound } from '../utils/soundEffects';
import { formatINR } from '../utils/formatters';
import { OptionContract } from '../types';

interface OptionsChainModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OptionsChainModal: React.FC<OptionsChainModalProps> = ({ isOpen, onClose }) => {
  const { marketIndices, executeOptionOrder, optionPositions, closeOptionPosition, cashBalance } = useSimulator();
  const [selectedUnderlying, setSelectedUnderlying] = useState<'NIFTY' | 'BANKNIFTY'>('NIFTY');
  const [showGreeks, setShowGreeks] = useState(true);
  const [selectedContract, setSelectedContract] = useState<{
    contract: OptionContract;
    type: 'CE' | 'PE';
    action: 'BUY' | 'SELL';
  } | null>(null);
  const [lotCount, setLotCount] = useState(1);
  const [activeSubtab, setActiveSubtab] = useState<'CHAIN' | 'GREEKS_SMILE' | 'POSITIONS' | 'PAYOFF'>('CHAIN');

  // Spot prices
  const spotPrice = useMemo(() => {
    if (selectedUnderlying === 'NIFTY') {
      return marketIndices?.nifty50?.value || 24650.0;
    } else {
      return marketIndices?.niftyBank?.value || 51320.0;
    }
  }, [selectedUnderlying, marketIndices]);

  const lotSize = selectedUnderlying === 'NIFTY' ? 75 : 30;

  // Generate synthetic live option contracts
  const chain = useMemo(() => {
    return generateOptionChain(selectedUnderlying, spotPrice);
  }, [selectedUnderlying, spotPrice]);

  // Data for Greeks & IV Smile visualization
  const greeksSmileData = useMemo(() => {
    return chain.map((c) => ({
      strike: c.strikePrice,
      ceIv: Number(c.ceIv.toFixed(1)),
      peIv: Number(c.peIv.toFixed(1)),
      avgIv: Number(((c.ceIv + c.peIv) / 2).toFixed(1)),
      ceDelta: Number(c.ceDelta.toFixed(2)),
      peDelta: Number(c.peDelta.toFixed(2)),
      ceTheta: Number(Math.abs(c.ceTheta).toFixed(1)),
      peTheta: Number(Math.abs(c.peTheta).toFixed(1)),
      ceOi: c.ceOi,
      peOi: c.peOi,
      isAtm: Math.abs(c.strikePrice - spotPrice) <= (selectedUnderlying === 'NIFTY' ? 25 : 50),
    }));
  }, [chain, spotPrice, selectedUnderlying]);

  // Payoff calculation points for interactive payoff chart
  const payoffData = useMemo(() => {
    if (!selectedContract) return [];
    const { contract, type, action } = selectedContract;
    const strike = contract.strikePrice;
    const premium = type === 'CE' ? contract.ceLtp : contract.peLtp;
    const range = spotPrice * 0.05; // +/- 5% range
    const steps = 24;
    const stepSize = (range * 2) / steps;
    
    const points = [];
    for (let i = 0; i <= steps; i++) {
      const p = (spotPrice - range) + (i * stepSize);
      let pnlPerShare = 0;
      if (type === 'CE') {
        const intrinsic = Math.max(0, p - strike);
        pnlPerShare = action === 'BUY' ? intrinsic - premium : premium - intrinsic;
      } else {
        const intrinsic = Math.max(0, strike - p);
        pnlPerShare = action === 'BUY' ? intrinsic - premium : premium - intrinsic;
      }
      const totalPnl = Math.round(pnlPerShare * lotSize * lotCount);
      points.push({
        price: Math.round(p),
        pnl: totalPnl,
        isProfit: totalPnl >= 0
      });
    }
    return points;
  }, [selectedContract, spotPrice, lotSize, lotCount]);

  const payoffMetrics = useMemo(() => {
    if (!selectedContract) return null;
    const { contract, type, action } = selectedContract;
    const strike = contract.strikePrice;
    const premium = type === 'CE' ? contract.ceLtp : contract.peLtp;
    const totalPremium = premium * lotSize * lotCount;
    const breakeven = type === 'CE' ? strike + premium : strike - premium;
    const thetaDecay = Math.abs(type === 'CE' ? contract.ceTheta : contract.peTheta) * lotSize * lotCount;

    return {
      strike,
      premium,
      totalPremium,
      breakeven,
      thetaDecay,
      maxProfit: action === 'BUY' ? (type === 'CE' ? 'Unlimited' : formatINR((strike - premium) * lotSize * lotCount)) : formatINR(totalPremium),
      maxLoss: action === 'BUY' ? formatINR(totalPremium) : 'Unlimited (High Risk)',
    };
  }, [selectedContract, lotSize, lotCount]);

  if (!isOpen) return null;

  const handlePlaceOptionTrade = () => {
    if (!selectedContract) return;
    const { contract, type, action } = selectedContract;
    const price = type === 'CE' ? contract.ceLtp : contract.peLtp;
    
    const res = executeOptionOrder(
      selectedUnderlying,
      type,
      contract.strikePrice,
      contract.expiryDate,
      lotCount,
      price,
      action
    );

    if (res.success) {
      playOrderFilledSound();
      setSelectedContract(null);
      setActiveSubtab('POSITIONS');
    }
  };

  return (
    <div id="options-chain-modal" className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Derivatives & Options Chain Simulator
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                  Simulated Black-Scholes Greeks
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Explore illustrative strike prices, Call/Put premiums, and Delta/Theta Greeks in a risk-free educational simulation.
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

        {/* Controls Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3">
          {/* Index Selector */}
          <div className="flex items-center gap-2">
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                onClick={() => { setSelectedUnderlying('NIFTY'); setSelectedContract(null); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedUnderlying === 'NIFTY'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                NIFTY 50 (Lot: 75)
              </button>
              <button
                onClick={() => { setSelectedUnderlying('BANKNIFTY'); setSelectedContract(null); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedUnderlying === 'BANKNIFTY'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                BANK NIFTY (Lot: 30)
              </button>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-mono">
              <span className="text-slate-400">Spot: </span>
              <span className="font-bold text-slate-900 dark:text-white">
                ₹{spotPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Subtabs & Greeks Toggle */}
          <div className="flex items-center gap-3">
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                onClick={() => setActiveSubtab('CHAIN')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  activeSubtab === 'CHAIN'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Options Chain
              </button>
              <button
                onClick={() => setActiveSubtab('POSITIONS')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                  activeSubtab === 'POSITIONS'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <span>Option Positions</span>
                {optionPositions.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">
                    {optionPositions.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => {
                  if (!selectedContract && chain.length > 0) {
                    const mid = chain[Math.floor(chain.length / 2)];
                    setSelectedContract({ contract: mid, type: 'CE', action: 'BUY' });
                  }
                  setActiveSubtab('PAYOFF');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  activeSubtab === 'PAYOFF'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Payoff Diagram
              </button>
              <button
                onClick={() => setActiveSubtab('GREEKS_SMILE')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                  activeSubtab === 'GREEKS_SMILE'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <span>⚡ IV Smile & Greeks</span>
              </button>
            </div>

            <button
              onClick={() => setShowGreeks(!showGreeks)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                showGreeks
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Greeks (Δ, Γ, Θ, ν)</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeSubtab === 'POSITIONS' ? (
            // Active Option Positions Subview
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-500" />
                  Active Simulated Option Contracts ({optionPositions.length})
                </h3>
              </div>

              {optionPositions.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  <Layers className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Open Option Positions</div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    Select a Call (CE) or Put (PE) strike from the Options Chain tab to simulate options trading and observe Greek decay.
                  </p>
                  <button
                    onClick={() => setActiveSubtab('CHAIN')}
                    className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors"
                  >
                    View Options Chain
                  </button>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 uppercase font-semibold">
                        <tr>
                          <th className="p-3">Contract</th>
                          <th className="p-3">Side</th>
                          <th className="p-3">Lots / Qty</th>
                          <th className="p-3">Buy Premium</th>
                          <th className="p-3">Current LTP</th>
                          <th className="p-3">Invested</th>
                          <th className="p-3">Current Value</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {optionPositions.map(pos => (
                          <tr key={pos.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="p-3 font-bold text-slate-900 dark:text-white">
                              {pos.underlying} {pos.strikePrice} {pos.optionType}
                              <div className="text-[10px] font-normal text-slate-400">{pos.expiryDate}</div>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                pos.optionType === 'CE'
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                              }`}>
                                {pos.optionType} ({pos.action})
                              </span>
                            </td>
                            <td className="p-3 font-medium text-slate-700 dark:text-slate-300">
                              {pos.contracts / (pos.underlying === 'NIFTY' ? 75 : 30)} Lots ({pos.contracts} qty)
                            </td>
                            <td className="p-3 font-medium text-slate-700 dark:text-slate-300">₹{pos.avgPrice.toFixed(2)}</td>
                            <td className="p-3 font-semibold text-slate-900 dark:text-white">₹{pos.currentLtp.toFixed(2)}</td>
                            <td className="p-3 font-medium text-slate-700 dark:text-slate-300">₹{pos.investedAmount.toLocaleString('en-IN')}</td>
                            <td className="p-3 font-bold text-slate-900 dark:text-white">₹{pos.currentValue.toLocaleString('en-IN')}</td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => closeOptionPosition(pos.id)}
                                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors"
                              >
                                Square Off
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : activeSubtab === 'PAYOFF' && selectedContract ? (
            // Interactive Payoff Diagram Subview
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md font-bold text-xs ${
                      selectedContract.type === 'CE'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                    }`}>
                      {selectedContract.type} ({selectedContract.action})
                    </span>
                    <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                      Expiry Payoff: {selectedUnderlying} {selectedContract.contract.strikePrice} {selectedContract.type}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Visual hockey-stick P&amp;L curve at expiration across simulated spot price movements.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-xs text-slate-500 font-bold">Lots:</span>
                    <div className="flex items-center gap-1.5 font-mono">
                      <button
                        type="button"
                        onClick={() => setLotCount(Math.max(1, lotCount - 1))}
                        className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center cursor-pointer"
                      >
                        -
                      </button>
                      <span className="font-black text-xs min-w-[20px] text-center">{lotCount}</span>
                      <button
                        type="button"
                        onClick={() => setLotCount(lotCount + 1)}
                        className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Total Premium</div>
                    <div className="text-sm font-black text-indigo-600 dark:text-indigo-400 font-mono">
                      ₹{((selectedContract.type === 'CE' ? selectedContract.contract.ceLtp : selectedContract.contract.peLtp) * lotSize * lotCount).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 Interactive Key Metric Cards */}
              {payoffMetrics && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Break-Even Expiry</span>
                    <span className="font-mono font-black text-slate-900 dark:text-white text-sm">
                      ₹{payoffMetrics.breakeven.toFixed(2)}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                    <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase block">Max Profit</span>
                    <span className="font-mono font-black text-emerald-700 dark:text-emerald-300 text-sm">
                      {payoffMetrics.maxProfit}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
                    <span className="text-[10px] font-bold text-rose-800 dark:text-rose-400 uppercase block">Max Risk / Loss</span>
                    <span className="font-mono font-black text-rose-700 dark:text-rose-300 text-sm">
                      {payoffMetrics.maxLoss}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
                    <span className="text-[10px] font-bold text-indigo-800 dark:text-indigo-400 uppercase block">Theta Time Decay</span>
                    <span className="font-mono font-black text-indigo-700 dark:text-indigo-300 text-sm">
                      -₹{payoffMetrics.thetaDecay.toFixed(0)} / day
                    </span>
                  </div>
                </div>
              )}

              {/* Interactive AreaChart Payoff Diagram */}
              <div className="h-64 sm:h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={payoffData} margin={{ top: 15, right: 20, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00f59b" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#00f59b" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="lossGrad" x1="0" y1="1" x2="0" y2="0">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis
                      dataKey="price"
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      tickFormatter={(v) => `₹${v}`}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      tickFormatter={(v) => `₹${v.toLocaleString('en-IN')}`}
                    />
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload as { price: number; pnl: number; isProfit: boolean };
                          return (
                            <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl text-white text-xs shadow-xl font-mono">
                              <div className="text-slate-400">Spot at Expiry: ₹{data.price.toLocaleString('en-IN')}</div>
                              <div className={`text-sm font-black mt-1 ${data.isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                                P&amp;L: {data.pnl >= 0 ? '+' : ''}₹{data.pnl.toLocaleString('en-IN')}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="3 3" />
                    {payoffMetrics && (
                      <ReferenceLine
                        x={payoffMetrics.strike}
                        stroke="#818cf8"
                        strokeDasharray="4 4"
                        label={{ value: 'Strike', fill: '#818cf8', fontSize: 10, position: 'top' }}
                      />
                    )}
                    {payoffMetrics && (
                      <ReferenceLine
                        x={Math.round(payoffMetrics.breakeven)}
                        stroke="#00f59b"
                        strokeDasharray="4 4"
                        label={{ value: 'Break-Even', fill: '#00f59b', fontSize: 10, position: 'top' }}
                      />
                    )}
                    <Area
                      type="monotone"
                      dataKey="pnl"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      fill="url(#profitGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <Info className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>Interactive curve illustrates profit hockey-stick past break-even strike. Zero real risk.</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedContract(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Back to Chain
                  </button>
                  <button
                    type="button"
                    onClick={handlePlaceOptionTrade}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md shadow-indigo-500/20 cursor-pointer flex items-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span>Confirm Simulated Trade</span>
                  </button>
                </div>
              </div>
            </div>
          ) : activeSubtab === 'GREEKS_SMILE' ? (
            // Options Chain Greek & IV Smile Visualizer Subview
            <div className="space-y-5">
              {/* Overview Card */}
              <div className="backdrop-blur-md bg-slate-900/70 border border-slate-700/60 rounded-3xl p-5 text-white shadow-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                      ⚡
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                        <span>{selectedUnderlying} Implied Volatility (IV) Smile & Greeks Visualizer</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold uppercase">
                          Black-Scholes Surface
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        Empirical volatility skew, Delta exposure across moneyness, and Theta time-decay erosion curves.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-slate-400">Current Spot:</span>
                    <span className="px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 font-black text-amber-400">
                      ₹{spotPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* 3 Summary Concept Badges */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                    <div className="font-bold text-amber-300 flex items-center gap-1.5">
                      <span>📈 Volatility Smile / Skew</span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      OTM Puts trade at higher IV due to institutional crash hedging demand, forming an asymmetric &quot;smile&quot; or volatility smirk.
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                    <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <span>🎯 Delta (Δ) Gradient</span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Call Delta moves from 0 (OTM) to 0.5 (ATM) to 1.0 (ITM). Put Delta mirrors inversely from 0 to -1.0.
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                    <div className="font-bold text-rose-400 flex items-center gap-1.5">
                      <span>⏳ Theta (Θ) Decay Peak</span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Time decay operates non-linearly, accelerating exponentially for At-The-Money (ATM) strikes into expiry week.
                    </p>
                  </div>
                </div>
              </div>

              {/* Chart 1: IV Smile Curve */}
              <div className="backdrop-blur-md bg-slate-900/60 border border-slate-700/50 rounded-3xl p-5 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
                      <span>1. Implied Volatility (IV) Smile & Skew Curve</span>
                      <span className="text-[10px] text-slate-400 font-mono font-normal">
                        (Strike Price vs IV %)
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Observe the classic Dalal Street smirk: deep out-of-the-money puts trade at elevated implied volatility.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <span className="w-2.5 h-0.5 bg-emerald-400" /> Call IV
                    </span>
                    <span className="flex items-center gap-1 text-rose-400">
                      <span className="w-2.5 h-0.5 bg-rose-400" /> Put IV
                    </span>
                    <span className="flex items-center gap-1 text-indigo-400">
                      <span className="w-2.5 h-0.5 bg-indigo-400" /> Average IV
                    </span>
                  </div>
                </div>

                <div className="h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={greeksSmileData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                      <XAxis
                        dataKey="strike"
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                        tickFormatter={(v) => `${v}`}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                        tickFormatter={(v) => `${v}%`}
                        domain={['dataMin - 2', 'dataMax + 2']}
                      />
                      <RechartsTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload as any;
                            return (
                              <div className="backdrop-blur-md bg-slate-950/90 border border-slate-700 p-2.5 rounded-xl text-white text-xs font-mono shadow-xl space-y-1">
                                <div className="font-bold text-amber-300">Strike: ₹{d.strike} {d.isAtm ? '(ATM)' : ''}</div>
                                <div className="text-emerald-400">Call IV: {d.ceIv}%</div>
                                <div className="text-rose-400">Put IV: {d.peIv}%</div>
                                <div className="text-indigo-300">Mean IV: {d.avgIv}%</div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <ReferenceLine
                        x={chain.find(c => Math.abs(c.strikePrice - spotPrice) <= (selectedUnderlying === 'NIFTY' ? 25 : 50))?.strikePrice}
                        stroke="#f59e0b"
                        strokeDasharray="4 4"
                        label={{ value: 'ATM Spot', fill: '#f59e0b', fontSize: 10, position: 'top' }}
                      />
                      <Line type="monotone" dataKey="ceIv" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} name="Call IV" />
                      <Line type="monotone" dataKey="peIv" stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 3 }} name="Put IV" />
                      <Line type="monotone" dataKey="avgIv" stroke="#818cf8" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Mean IV" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Delta Sensitivity & Theta Decay Dual Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Delta Curve */}
                <div className="backdrop-blur-md bg-slate-900/60 border border-slate-700/50 rounded-3xl p-5 shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-white">
                        2. Option Delta (Δ) Sensitivity
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Directional sensitivity per ₹1 move in spot.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono">
                      <span className="text-emerald-400 font-bold">CE (0 to 1)</span>
                      <span className="text-rose-400 font-bold">PE (0 to -1)</span>
                    </div>
                  </div>

                  <div className="h-56 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={greeksSmileData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                        <XAxis dataKey="strike" tick={{ fontSize: 9, fill: '#94a3b8' }} />
                        <YAxis domain={[-1, 1]} ticks={[-1, -0.5, 0, 0.5, 1]} tick={{ fontSize: 9, fill: '#94a3b8' }} />
                        <ReferenceLine y={0} stroke="#64748b" strokeWidth={1} />
                        <RechartsTooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload as any;
                              return (
                                <div className="backdrop-blur-md bg-slate-950/90 border border-slate-700 p-2.5 rounded-xl text-white text-xs font-mono shadow-xl space-y-1">
                                  <div className="font-bold text-amber-300">Strike: ₹{d.strike}</div>
                                  <div className="text-emerald-400">Call Delta: +{d.ceDelta}</div>
                                  <div className="text-rose-400">Put Delta: {d.peDelta}</div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Line type="monotone" dataKey="ceDelta" stroke="#10b981" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="peDelta" stroke="#f43f5e" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Theta Decay Curve */}
                <div className="backdrop-blur-md bg-slate-900/60 border border-slate-700/50 rounded-3xl p-5 shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-white">
                        3. Theta (Θ) Daily Time Decay
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Rupees eroded per contract per calendar day.
                      </p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      Peaks At ATM
                    </span>
                  </div>

                  <div className="h-56 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={greeksSmileData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                        <defs>
                          <linearGradient id="thetaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                        <XAxis dataKey="strike" tick={{ fontSize: 9, fill: '#94a3b8' }} />
                        <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} tickFormatter={(v) => `₹${v}`} />
                        <RechartsTooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload as any;
                              return (
                                <div className="backdrop-blur-md bg-slate-950/90 border border-slate-700 p-2.5 rounded-xl text-white text-xs font-mono shadow-xl space-y-1">
                                  <div className="font-bold text-amber-300">Strike: ₹{d.strike} {d.isAtm ? '(ATM)' : ''}</div>
                                  <div className="text-rose-400">Call Theta: -₹{d.ceTheta} / day</div>
                                  <div className="text-rose-400">Put Theta: -₹{d.peTheta} / day</div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area type="monotone" dataKey="ceTheta" stroke="#f43f5e" strokeWidth={2} fill="url(#thetaGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Main Options Chain Table
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-center text-xs">
                  {/* Super Header */}
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                      <th colSpan={showGreeks ? 7 : 3} className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 py-2 uppercase font-bold text-[11px] tracking-wider border-r border-slate-200 dark:border-slate-800">
                        CALLS (CE) - Bullish
                      </th>
                      <th className="bg-slate-100 dark:bg-slate-800 py-2 uppercase font-bold text-[11px] tracking-wider text-slate-700 dark:text-slate-300">
                        STRIKE
                      </th>
                      <th colSpan={showGreeks ? 7 : 3} className="bg-rose-500/10 text-rose-700 dark:text-rose-300 py-2 uppercase font-bold text-[11px] tracking-wider border-l border-slate-200 dark:border-slate-800">
                        PUTS (PE) - Bearish
                      </th>
                    </tr>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 text-[11px]">
                      {/* CE Columns */}
                      {showGreeks && <th className="p-2.5">IV</th>}
                      {showGreeks && <th className="p-2.5">Delta (Δ)</th>}
                      {showGreeks && <th className="p-2.5">Theta (Θ)</th>}
                      <th className="p-2.5">OI</th>
                      <th className="p-2.5">Change %</th>
                      <th className="p-2.5">LTP (₹)</th>
                      <th className="p-2.5 border-r border-slate-200 dark:border-slate-800">Action</th>

                      {/* Strike */}
                      <th className="p-2.5 bg-slate-100/80 dark:bg-slate-800 font-bold text-slate-900 dark:text-white">
                        Strike Price
                      </th>

                      {/* PE Columns */}
                      <th className="p-2.5 border-l border-slate-200 dark:border-slate-800">Action</th>
                      <th className="p-2.5">LTP (₹)</th>
                      <th className="p-2.5">Change %</th>
                      <th className="p-2.5">OI</th>
                      {showGreeks && <th className="p-2.5">Theta (Θ)</th>}
                      {showGreeks && <th className="p-2.5">Delta (Δ)</th>}
                      {showGreeks && <th className="p-2.5">IV</th>}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {chain.map((c) => {
                      const isCallITM = spotPrice > c.strikePrice;
                      const isPutITM = c.strikePrice > spotPrice;
                      const isAtm = Math.abs(c.strikePrice - spotPrice) <= (selectedUnderlying === 'NIFTY' ? 25 : 50);

                      return (
                        <tr
                          key={c.strikePrice}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                            isAtm ? 'bg-amber-500/10 dark:bg-amber-500/5' : ''
                          }`}
                        >
                          {/* CE Data */}
                          {showGreeks && <td className={`p-2 font-mono ${isCallITM ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''}`}>{c.ceIv}%</td>}
                          {showGreeks && <td className={`p-2 font-mono text-emerald-600 dark:text-emerald-400 font-semibold ${isCallITM ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''}`}>+{c.ceDelta}</td>}
                          {showGreeks && <td className={`p-2 font-mono text-rose-500 ${isCallITM ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''}`}>{c.ceTheta}</td>}
                          <td className={`p-2 font-mono text-slate-500 ${isCallITM ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''}`}>{c.ceOi.toLocaleString()}</td>
                          <td className={`p-2 font-semibold ${isCallITM ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''} ${c.ceChange >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                            {c.ceChangePercent > 0 ? `+${c.ceChangePercent}%` : `${c.ceChangePercent}%`}
                          </td>
                          <td className={`p-2 font-bold text-slate-900 dark:text-white ${isCallITM ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''}`}>
                            ₹{c.ceLtp.toFixed(2)}
                          </td>
                          <td className={`p-2 border-r border-slate-200 dark:border-slate-800 ${isCallITM ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''}`}>
                            <button
                              onClick={() => {
                                setSelectedContract({ contract: c, type: 'CE', action: 'BUY' });
                                setActiveSubtab('PAYOFF');
                              }}
                              className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] transition-colors"
                            >
                              BUY CE
                            </button>
                          </td>

                          {/* Strike In Middle */}
                          <td className={`p-2.5 font-bold font-mono text-slate-900 dark:text-white ${isAtm ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 ring-1 ring-amber-400' : 'bg-slate-100/70 dark:bg-slate-800/80'}`}>
                            {c.strikePrice}
                            {isAtm && <span className="block text-[9px] text-amber-600 dark:text-amber-400 font-sans font-semibold">ATM</span>}
                          </td>

                          {/* PE Data */}
                          <td className={`p-2 border-l border-slate-200 dark:border-slate-800 ${isPutITM ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''}`}>
                            <button
                              onClick={() => {
                                setSelectedContract({ contract: c, type: 'PE', action: 'BUY' });
                                setActiveSubtab('PAYOFF');
                              }}
                              className="px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] transition-colors"
                            >
                              BUY PE
                            </button>
                          </td>
                          <td className={`p-2 font-bold text-slate-900 dark:text-white ${isPutITM ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''}`}>
                            ₹{c.peLtp.toFixed(2)}
                          </td>
                          <td className={`p-2 font-semibold ${isPutITM ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''} ${c.peChange >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                            {c.peChangePercent > 0 ? `+${c.peChangePercent}%` : `${c.peChangePercent}%`}
                          </td>
                          <td className={`p-2 font-mono text-slate-500 ${isPutITM ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''}`}>{c.peOi.toLocaleString()}</td>
                          {showGreeks && <td className={`p-2 font-mono text-rose-500 ${isPutITM ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''}`}>{c.peTheta}</td>}
                          {showGreeks && <td className={`p-2 font-mono text-rose-600 dark:text-rose-400 font-semibold ${isPutITM ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''}`}>{c.peDelta}</td>}
                          {showGreeks && <td className={`p-2 font-mono ${isPutITM ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''}`}>{c.peIv}%</td>}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Info & Order Panel */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Info className="w-4 h-4 text-indigo-500" />
            <span>Green shaded rows = In-The-Money (ITM) Calls. Red shaded rows = In-The-Money (ITM) Puts.</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Available Cash:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                ₹{cashBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            </div>

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 font-semibold text-slate-800 dark:text-slate-200 transition-colors"
            >
              Close Simulator
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
