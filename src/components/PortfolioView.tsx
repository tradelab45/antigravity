import React, { useMemo, useState } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  PieChart as PieIcon, 
  Clock, 
  ShieldCheck, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles, 
  CheckCircle2, 
  RefreshCw, 
  Layers, 
  HelpCircle, 
  History, 
  Search, 
  Filter, 
  ArrowUpDown, 
  ShoppingBag, 
  DollarSign,
  Calculator,
  Award,
  Zap,
  FileText,
  Download,
  AlertTriangle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { useSimulator } from '../context/SimulatorContext';
import { StockDetail, Holding, Order } from '../types';
import { formatINR, formatPercent, formatIndianShort, formatNumberIndian } from '../utils/formatters';
import { PortfolioEquityAreaChart } from './ui/area-charts-2';
import { PortfolioReportModal } from './PortfolioReportModal';

interface PortfolioViewProps {
  onSelectStock: (stock: StockDetail) => void;
  onNavigateToScreener: () => void;
}

const SECTOR_COLORS = [
  '#f59e0b', // amber
  '#10b981', // emerald
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#64748b', // slate
];

const INDIAN_SYMBOL_ALIASES: Record<string, string> = {
  'PARADEP': 'PARADEEP',
  'PARADEEPPHOSPHATES': 'PARADEEP',
  'M&M': 'M_M',
  'L&T': 'LT',
  'BAJAJ-AUTO': 'BAJAJ_AUTO',
  'MCDOWELL-N': 'UNITDSPR',
};

export const PortfolioView: React.FC<PortfolioViewProps> = ({ onSelectStock, onNavigateToScreener }) => {
  const { 
    portfolioValue, 
    investedValue, 
    cashBalance, 
    totalPnL, 
    totalPnLPercent, 
    dayPnL, 
    holdings, 
    orders, 
    stocks,
    portfolioHistory,
    userLevel,
    cancelPendingOrder,
    nseMarketInfo,
    marketHoursMode,
    syncHoldingsRealTime,
    isSyncingHoldings,
    lastHoldingsSyncTime,
    currentUser,
    completedLessonIds
  } = useSimulator();

  // Internal tab: 'holdings' | 'analytics' | 'pending' | 'history'
  const [portfolioTab, setPortfolioTab] = useState<'holdings' | 'analytics' | 'pending' | 'history'>('holdings');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  
  // Trade History filters
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'EXECUTED' | 'CANCELLED'>('ALL');
  const [tradeFilter, setTradeFilter] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');
  const [tradeSearch, setTradeSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'NEWEST' | 'OLDEST'>('NEWEST');
  const [stressScenario, setStressScenario] = useState<'IT_10' | 'BANK_15' | 'BROAD_8'>('IT_10');

  const isTotalProfit = totalPnL >= 0;
  const isDayProfit = dayPnL >= 0;

  // Pending Orders Count
  const pendingOrdersList = useMemo(() => {
    return orders.filter((o) => o.status === 'PENDING');
  }, [orders]);

  // Active Holdings Details with Live Market Pricing
  const holdingsList = useMemo(() => {
    return (Object.values(holdings) as Holding[]).map((holding: Holding) => {
      const alias = INDIAN_SYMBOL_ALIASES[holding.symbol] || holding.symbol;
      const stock = stocks.find((s) => s.symbol === holding.symbol || s.symbol === alias || (holding.symbol === 'PARADEEP' && s.symbol === 'PARADEP') || (holding.symbol === 'PARADEP' && s.symbol === 'PARADEEP'));
      const curPrice = stock && stock.price > 0 ? stock.price : holding.avgBuyPrice;
      const curValue = Number((curPrice * holding.quantity).toFixed(2));
      const totalInvested = holding.totalInvested > 0 ? holding.totalInvested : Number((holding.avgBuyPrice * holding.quantity).toFixed(2));
      const pnl = Number((curValue - totalInvested).toFixed(2));
      const pnlPercent = totalInvested > 0 ? Number(((pnl / totalInvested) * 100).toFixed(2)) : 0;
      
      const stockPrevClose = stock?.previousClose && stock.previousClose > 0 ? stock.previousClose : curPrice;
      const dayChange = stock ? (typeof stock.change === 'number' && !isNaN(stock.change) ? stock.change : (curPrice - stockPrevClose)) : 0;
      const dayChangeAmount = Number((dayChange * holding.quantity).toFixed(2));
      const dayChangePercent = stockPrevClose > 0 ? Number(((dayChange / stockPrevClose) * 100).toFixed(2)) : (stock?.changePercent || 0);
      
      const priceDifferenceFromBuy = Number((curPrice - holding.avgBuyPrice).toFixed(2));
      const priceDifferencePercent = holding.avgBuyPrice > 0 ? Number(((priceDifferenceFromBuy / holding.avgBuyPrice) * 100).toFixed(2)) : 0;

      return {
        ...holding,
        totalInvested,
        stock,
        curPrice,
        curValue,
        pnl,
        pnlPercent,
        dayChangeAmount,
        dayChangePercent,
        priceDifferenceFromBuy,
        priceDifferencePercent,
      };
    });
  }, [holdings, stocks]);

  // Total holdings invested and current market value
  const totalHoldingsInvested = useMemo(() => {
    return holdingsList.reduce((sum, h) => sum + h.totalInvested, 0);
  }, [holdingsList]);

  const totalHoldingsCurrentValue = useMemo(() => {
    return holdingsList.reduce((sum, h) => sum + h.curValue, 0);
  }, [holdingsList]);

  const holdingsPnL = totalHoldingsCurrentValue - totalHoldingsInvested;
  const holdingsPnLPercent = totalHoldingsInvested > 0 ? (holdingsPnL / totalHoldingsInvested) * 100 : 0;
  const isHoldingsProfit = holdingsPnL >= 0;

  const dayPnLPercent = totalHoldingsInvested > 0 ? (dayPnL / totalHoldingsInvested) * 100 : 0;

  // Sector Breakdown for Pie Chart
  const sectorData = useMemo(() => {
    const sectorMap: Record<string, number> = {};
    let totalStockVal = 0;

    holdingsList.forEach((h) => {
      const sec = h.stock ? h.stock.sector : 'Other';
      sectorMap[sec] = (sectorMap[sec] || 0) + h.curValue;
      totalStockVal += h.curValue;
    });

    return Object.entries(sectorMap)
      .map(([name, value]) => ({
        name,
        value: Number(value.toFixed(2)),
        percentage: totalStockVal > 0 ? ((value / totalStockVal) * 100).toFixed(1) : '0',
      }))
      .sort((a, b) => b.value - a.value);
  }, [holdingsList]);

  const riskAnalysis = useMemo(() => {
    const sectors = sectorData.map((sector) => {
      const percentage = Number(sector.percentage);
      const level = percentage > 50 ? 'HIGH' : percentage > 35 ? 'ELEVATED' : 'BALANCED';
      return { ...sector, percentageNumber: percentage, level };
    });
    const totalValue = holdingsList.reduce((sum, holding) => sum + holding.curValue, 0);
    const largestHolding = [...holdingsList]
      .map((holding) => ({ symbol: holding.symbol, weight: totalValue > 0 ? (holding.curValue / totalValue) * 100 : 0 }))
      .sort((a, b) => b.weight - a.weight)[0];
    const warnings: string[] = [];
    const largestSector = sectors[0];

    if (largestSector?.percentageNumber > 50) warnings.push(`${largestSector.name} is ${largestSector.percentageNumber.toFixed(0)}% of invested value. A sector-specific fall would have an outsized impact.`);
    else if (largestSector?.percentageNumber > 35) warnings.push(`${largestSector.name} is above the 35% sector review level.`);
    if (largestHolding?.weight > 30) warnings.push(`${largestHolding.symbol} is ${largestHolding.weight.toFixed(0)}% of invested value. Review single-stock concentration.`);
    if (sectors.length > 0 && sectors.length < 3) warnings.push(`Exposure spans only ${sectors.length} sector${sectors.length === 1 ? '' : 's'}. Consider whether the portfolio depends on one economic theme.`);

    return { sectors, largestHolding, warnings };
  }, [holdingsList, sectorData]);

  // Portfolio Health Score & Tips
  const healthAnalysis = useMemo(() => {
    const numHoldings = holdingsList.length;
    const sectors = new Set(holdingsList.map((h) => h.stock?.sector).filter(Boolean));
    const cashRatio = cashBalance / (portfolioValue || 1);

    const executedTrades = orders.filter((order) => order.status === 'EXECUTED').length;
    const profileId = currentUser?.id || 'guest';
    let tradePlans: Array<{ invalidationLevel?: number; maximumAllocationPct?: number }> = [];
    let journalReviews: Record<string, unknown> = {};
    try { tradePlans = JSON.parse(localStorage.getItem(`rr_trade_plans:${profileId}`) || '[]'); } catch { tradePlans = []; }
    try { journalReviews = JSON.parse(localStorage.getItem(`rr_trade_reviews:${profileId}`) || '{}'); } catch { journalReviews = {}; }
    const planCoverage = executedTrades > 0 ? Math.min(1, tradePlans.length / executedTrades) : 0;
    const journalCoverage = executedTrades > 0 ? Math.min(1, Object.keys(journalReviews).length / executedTrades) : 0;
    const learningCoverage = Math.min(1, completedLessonIds.length / 12);
    const largestHoldingWeight = riskAnalysis.largestHolding?.weight || 0;

    // Health rewards diversification and decision process—not profit.
    let score = 10;
    score += Math.min(20, sectors.size * 5);
    score += largestHoldingWeight <= 25 ? 15 : largestHoldingWeight <= 35 ? 8 : 0;
    score += cashRatio >= 0.05 && cashRatio <= 0.45 ? 10 : 4;
    score += planCoverage * 20;
    score += journalCoverage * 15;
    score += learningCoverage * 10;

    if (numHoldings === 0) {
      return {
        score: 40,
        label: 'Ready to Learn',
        tips: [
          'No risk is active yet. Complete a diversification lesson before making your first simulated decision.',
          'Use the risk heatmap after you build a practice portfolio; there is no need to trade every day.',
        ],
      };
    }

    score = Math.round(Math.min(100, score));

    const tips = [];
    if (sectors.size < 3) {
      tips.push('Review whether your holdings depend on the same sector or economic cause. More holdings are not automatically safer.');
    }
    if (cashRatio > 0.6) {
      tips.push('Most capital is unallocated. There is no need to invest it quickly; use Academy and a written plan first.');
    } else if (cashRatio < 0.05) {
      tips.push('The portfolio has little cash flexibility. Review whether that matches your simulation rules.');
    }
    if (executedTrades > 0 && planCoverage < 0.7) tips.push('Write a catalyst, invalidation level and maximum allocation before more simulated buys.');
    if (executedTrades > 0 && journalCoverage < 0.5) tips.push('Complete post-trade reviews so the score can measure decision quality rather than outcomes.');
    if (learningCoverage < 0.25) tips.push('Complete the first Academy path before relying on advanced portfolio tools.');
    if (tips.length === 0) {
      tips.push('No current process warning is triggered. Continue reviewing the plan after each simulated decision.');
    }

    return {
      score,
      label: score >= 80 ? 'Strong Process' : score >= 60 ? 'Developing Well' : 'Build the Process',
      tips,
      evidence: { sectors: sectors.size, planCoverage, journalCoverage, learningCoverage },
    };
  }, [holdingsList, cashBalance, portfolioValue, orders, currentUser?.id, completedLessonIds.length, riskAnalysis.largestHolding?.weight]);

  const resilienceAnalysis = useMemo(() => {
    const definitions = {
      IT_10: { label: 'IT falls 10%', shock: -0.10, matches: (sector: string) => /IT|Software|Technology/i.test(sector) },
      BANK_15: { label: 'Banking falls 15%', shock: -0.15, matches: (sector: string) => /Bank|Financial|BFSI/i.test(sector) },
      BROAD_8: { label: 'Broad market falls 8%', shock: -0.08, matches: () => true },
    } as const;
    const scenario = definitions[stressScenario];
    const affectedValue = holdingsList.reduce((total, holding) => total + (scenario.matches(holding.stock?.sector || '') ? holding.curValue : 0), 0);
    const estimatedImpact = affectedValue * scenario.shock;
    const estimatedPortfolioPct = portfolioValue > 0 ? (estimatedImpact / portfolioValue) * 100 : 0;

    const values = portfolioHistory.map((point) => Number(point.portfolioValue)).filter((value) => Number.isFinite(value) && value > 0);
    let peak = values[0] || portfolioValue;
    let worstDrawdown = 0;
    for (const value of values) {
      peak = Math.max(peak, value);
      worstDrawdown = Math.min(worstDrawdown, peak > 0 ? ((value - peak) / peak) * 100 : 0);
    }
    const currentDrawdown = peak > 0 ? Math.min(0, ((portfolioValue - peak) / peak) * 100) : 0;
    const recoveryNeeded = currentDrawdown < 0 ? ((1 / (1 + currentDrawdown / 100)) - 1) * 100 : 0;
    const largestSector = riskAnalysis.sectors[0];
    const rebalanceAmount = largestSector && largestSector.percentageNumber > 35
      ? Math.max(0, largestSector.value - totalHoldingsCurrentValue * 0.35)
      : 0;
    return { scenario, affectedValue, estimatedImpact, estimatedPortfolioPct, peak, worstDrawdown, currentDrawdown, recoveryNeeded, largestSector, rebalanceAmount };
  }, [holdingsList, portfolioHistory, portfolioValue, riskAnalysis.sectors, stressScenario, totalHoldingsCurrentValue]);

  // Filtered and Sorted Trade History
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    if (tradeFilter !== 'ALL') {
      result = result.filter((o) => o.type === tradeFilter);
    }

    if (statusFilter !== 'ALL') {
      result = result.filter((o) => o.status === statusFilter);
    }

    if (tradeSearch.trim()) {
      const q = tradeSearch.toLowerCase().trim();
      result = result.filter(
        (o) => o.symbol.toLowerCase().includes(q) || o.stockName.toLowerCase().includes(q)
      );
    }

    if (sortOrder === 'OLDEST') {
      result.reverse();
    }

    return result;
  }, [orders, tradeFilter, statusFilter, tradeSearch, sortOrder]);

  // Trade History Stats
  const tradeStats = useMemo(() => {
    const totalTrades = orders.length;
    const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
    const executedOrders = orders.filter((o) => o.status === 'EXECUTED');
    const buyOrders = orders.filter((o) => o.type === 'BUY');
    const sellOrders = orders.filter((o) => o.type === 'SELL');
    
    const totalBuyValue = buyOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalSellValue = sellOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    return {
      totalTrades,
      pendingCount,
      executedCount: executedOrders.length,
      buyCount: buyOrders.length,
      sellCount: sellOrders.length,
      totalBuyValue,
      totalSellValue,
    };
  }, [orders]);

  return (
    <div className="space-y-6">

      {/* Real-time Data Sync Status & Manual Sync Trigger */}
      <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="flex h-2.5 w-2.5 relative">
            {(isSyncingHoldings || nseMarketInfo.isNSEMarketOpen) && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isSyncingHoldings ? 'bg-amber-400' : 'bg-emerald-400'
            }`}></span>}
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
              isSyncingHoldings ? 'bg-amber-500' : nseMarketInfo.isNSEMarketOpen ? 'bg-emerald-500' : 'bg-slate-400'
            }`}></span>
          </span>
          <span className="font-extrabold text-slate-800">
            {isSyncingHoldings
              ? 'Syncing latest available market prices...'
              : nseMarketInfo.isNSEMarketOpen
                ? 'Market open · latest available prices'
                : 'Market closed · showing last available prices'}
          </span>
          <span className="text-slate-400 font-medium hidden sm:inline">•</span>
          <span className="text-slate-500 font-mono text-[11px] hidden sm:inline">
            Last holdings sync: {lastHoldingsSyncTime} IST
          </span>
        </div>

        <button
          onClick={() => syncHoldingsRealTime()}
          disabled={isSyncingHoldings}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
          title="Refresh the latest available prices for all holdings"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isSyncingHoldings ? 'animate-spin' : ''}`} />
          <span>{isSyncingHoldings ? 'Syncing...' : 'Refresh Prices'}</span>
        </button>
      </div>

      {/* Mobile-first portfolio concentration heatmap */}
      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-indigo-600" />
              <h2 className="text-sm font-black text-slate-950 dark:text-white">Portfolio risk heatmap</h2>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">Sector allocation and concentration warnings based on current invested value.</p>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-black ${riskAnalysis.warnings.length ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'}`}>
            {holdingsList.length === 0 ? 'NO EXPOSURE' : riskAnalysis.warnings.length ? `${riskAnalysis.warnings.length} REVIEW` : 'BALANCED'}
          </span>
        </div>

        {riskAnalysis.sectors.length > 0 ? (
          <>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {riskAnalysis.sectors.map((sector) => (
                <div
                  key={sector.name}
                  className={`rounded-2xl border p-3 ${sector.level === 'HIGH' ? 'border-rose-300 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/30' : sector.level === 'ELEVATED' ? 'border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30' : 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[11px] font-extrabold text-slate-900 dark:text-white">{sector.name}</span>
                    <span className="font-mono text-xs font-black">{sector.percentageNumber.toFixed(1)}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/80 dark:bg-slate-800">
                    <div className={`h-full rounded-full ${sector.level === 'HIGH' ? 'bg-rose-500' : sector.level === 'ELEVATED' ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, sector.percentageNumber)}%` }} />
                  </div>
                  <p className="mt-1.5 text-[9px] font-black tracking-wide text-slate-500">{sector.level}</p>
                </div>
              ))}
            </div>
            {riskAnalysis.warnings.length > 0 && (
              <div className="mt-3 space-y-2">
                {riskAnalysis.warnings.map((warning) => (
                  <div key={warning} className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{warning}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center dark:border-slate-700 dark:bg-slate-800/60">
            <PieIcon className="mx-auto h-6 w-6 text-slate-400" />
            <p className="mt-2 text-xs font-extrabold text-slate-800 dark:text-slate-200">Your heatmap will appear after your first simulated holding</p>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Learn about diversification first—there is no daily trading requirement.</p>
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2" aria-label="Portfolio resilience tools">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-600" /><h2 className="text-sm font-black text-slate-950 dark:text-white">What-if stress test</h2></div><p className="mt-1 text-xs text-slate-500">Educational estimate based on current sector values—not a forecast.</p></div><select value={stressScenario} onChange={(event) => setStressScenario(event.target.value as typeof stressScenario)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black dark:border-slate-700 dark:bg-slate-900"><option value="IT_10">IT falls 10%</option><option value="BANK_15">Banking falls 15%</option><option value="BROAD_8">Broad market falls 8%</option></select></div>
          <div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800"><p className="text-[10px] font-black uppercase text-slate-500">Affected holdings</p><p className="mt-1 font-mono text-base font-black">{formatINR(resilienceAnalysis.affectedValue, false)}</p></div><div className="rounded-2xl bg-rose-50 p-3 dark:bg-rose-950/30"><p className="text-[10px] font-black uppercase text-rose-700">Estimated impact</p><p className="mt-1 font-mono text-base font-black text-rose-700">{formatINR(resilienceAnalysis.estimatedImpact, false)} ({resilienceAnalysis.estimatedPortfolioPct.toFixed(2)}%)</p></div></div>
          <p className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-xs leading-relaxed text-indigo-950 dark:border-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-200">Companies in the same sector can move together because they share customers, regulation, currency exposure or interest-rate sensitivity. More stock names do not always mean more diversification.</p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2"><TrendingDown className="h-5 w-5 text-rose-600" /><h2 className="text-sm font-black text-slate-950 dark:text-white">Drawdown &amp; rebalance sandbox</h2></div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><p className="text-[10px] uppercase text-slate-500">Current</p><p className="mt-1 font-mono text-sm font-black">{resilienceAnalysis.currentDrawdown.toFixed(2)}%</p></div><div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><p className="text-[10px] uppercase text-slate-500">Worst recorded</p><p className="mt-1 font-mono text-sm font-black">{resilienceAnalysis.worstDrawdown.toFixed(2)}%</p></div><div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><p className="text-[10px] uppercase text-slate-500">Recovery needed</p><p className="mt-1 font-mono text-sm font-black">{resilienceAnalysis.recoveryNeeded.toFixed(2)}%</p></div></div>
          <div className="mt-3 rounded-2xl border border-dashed border-slate-300 p-3 text-xs leading-relaxed dark:border-slate-700">{resilienceAnalysis.rebalanceAmount > 0 && resilienceAnalysis.largestSector ? <><strong>{resilienceAnalysis.largestSector.name}</strong> is above the 35% review level. Moving approximately <strong>{formatINR(resilienceAnalysis.rebalanceAmount, false)}</strong> out of that sector would model a 35% ceiling. This sandbox does not place orders.</> : holdingsList.length ? 'No sector currently needs a reduction to reach the 35% review ceiling. This is a learning rule, not a recommendation.' : 'Add a simulated holding to see genuine drawdown and rebalancing estimates.'}</div>
        </article>
      </section>

      {/* Portfolio Overview Banner Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Portfolio Value */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span className="flex items-center gap-1.5 uppercase tracking-wider">
              <Wallet className="w-4 h-4 text-slate-900" /> TOTAL PORTFOLIO VALUE
            </span>
            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
              isTotalProfit ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }`}>
              {formatPercent(totalPnLPercent)}
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
              {formatINR(portfolioValue)}
            </div>
            <div className={`text-xs font-black flex items-center gap-1 mt-1.5 ${
              isTotalProfit ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {isTotalProfit ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              {isTotalProfit ? '+' : ''}{formatINR(totalPnL)} Overall Net Return
            </div>
          </div>
        </div>

        {/* Invested Value in Stocks & Real-Time Unrealized P&L */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span className="flex items-center gap-1.5 uppercase tracking-wider">
              <Layers className="w-4 h-4 text-slate-900" /> BOUGHT SHARES VALUE
            </span>
            {totalHoldingsInvested > 0 && (
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                isHoldingsProfit ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
              }`}>
                {formatPercent(holdingsPnLPercent)}
              </span>
            )}
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
              {formatINR(totalHoldingsCurrentValue)}
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <div className={`text-xs font-black flex items-center gap-1 ${
                isHoldingsProfit ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {isHoldingsProfit ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {isHoldingsProfit ? '+' : ''}{formatINR(holdingsPnL)} ({formatPercent(holdingsPnLPercent)})
              </div>
              <div className="text-[11px] text-slate-400 font-medium font-mono">
                Cost: {formatINR(totalHoldingsInvested)}
              </div>
            </div>
          </div>
        </div>

        {/* Available Virtual Cash */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="text-xs text-slate-500 font-bold flex items-center gap-1.5 uppercase tracking-wider">
            <Wallet className="w-4 h-4 text-indigo-600" /> AVAILABLE CASH
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
              {formatINR(cashBalance)}
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1.5">
              {((cashBalance / (portfolioValue || 1)) * 100).toFixed(1)}% of total portfolio
            </div>
          </div>
        </div>

        {/* Today's Gain/Loss */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="text-xs text-slate-500 font-bold flex items-center gap-1.5 uppercase tracking-wider">
            <TrendingUp className="w-4 h-4 text-emerald-600" /> TODAY&apos;S P&L (1-DAY)
          </div>
          <div className="mt-3">
            <div className={`text-2xl sm:text-3xl font-black tracking-tight font-mono ${
              isDayProfit ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {isDayProfit ? '+' : ''}{formatINR(dayPnL)}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium mt-1.5">
              <span className={`font-black ${isDayProfit ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatPercent(dayPnLPercent)}
              </span>
              <span className="text-[11px] text-slate-400">{nseMarketInfo.isNSEMarketOpen ? 'Market open' : 'Market closed'}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Sub-Navigation Switcher between Holdings, Execution List / Pending, & Trade History */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs">
          <button
            id="tab-holdings-overview"
            onClick={() => setPortfolioTab('holdings')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              portfolioTab === 'holdings'
                ? 'bg-slate-900 text-white shadow-md shadow-indigo-900/20'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Holdings & Allocation</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
              portfolioTab === 'holdings' ? 'bg-white/20 text-white' : 'bg-[#E2E8F0] text-slate-900'
            }`}>
              {holdingsList.length}
            </span>
          </button>

          <button
            id="tab-analytics"
            onClick={() => setPortfolioTab('analytics')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              portfolioTab === 'analytics'
                ? 'bg-slate-900 text-white shadow-md shadow-indigo-900/20'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Calculator className="w-4 h-4 text-amber-500" />
            <span>XIRR, Alpha & Tax Ledger</span>
          </button>

          <button
            id="tab-pending-orders"
            onClick={() => setPortfolioTab('pending')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              portfolioTab === 'pending'
                ? 'bg-slate-900 text-white shadow-md shadow-indigo-900/20'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Execution List / Pending</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
              pendingOrdersList.length > 0 
                ? 'bg-amber-400 text-amber-950 animate-pulse' 
                : portfolioTab === 'pending' 
                  ? 'bg-white/20 text-white' 
                  : 'bg-[#E2E8F0] text-slate-900'
            }`}>
              {pendingOrdersList.length}
            </span>
          </button>

          <button
            id="tab-trade-history"
            onClick={() => setPortfolioTab('history')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              portfolioTab === 'history'
                ? 'bg-slate-900 text-white shadow-md shadow-indigo-900/20'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <History className="w-4 h-4" />
            <span>All Orders & History</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
              portfolioTab === 'history' ? 'bg-white/20 text-white' : 'bg-[#E2E8F0] text-slate-900'
            }`}>
              {orders.length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            id="btn-export-portfolio-report"
            onClick={() => setReportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-black shadow-2xs transition-all cursor-pointer"
            title="Export Portfolio Holdings & Performance Report (CSV, JSON, PDF)"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span>Export Summary Report</span>
            <span className="bg-indigo-50 text-indigo-700 text-[9px] px-1.5 py-0.2 rounded-full font-bold border border-indigo-200">
              CSV/PDF
            </span>
          </button>

          <button
            onClick={onNavigateToScreener}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-[#3b4b1c] text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer"
          >
            <span>+ Trade Indian Stocks</span>
          </button>
        </div>
      </div>

      {/* Persistent Pending Orders Notice Banner if any orders are queued */}
      {pendingOrdersList.length > 0 && portfolioTab !== 'pending' && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-200 rounded-xl">
              <Clock className="w-5 h-5 text-amber-800 animate-spin" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-black">
                {pendingOrdersList.length} Pending After-Market Order(s) in Execution List
              </h4>
              <p className="text-[11px] text-amber-800 font-medium">
                Queued to execute automatically when NSE Market opens at 09:15 AM IST ({nseMarketInfo.nextOpeningDateString}).
              </p>
            </div>
          </div>
          <button
            onClick={() => setPortfolioTab('pending')}
            className="px-3.5 py-1.5 bg-amber-900 hover:bg-amber-950 text-white text-xs font-black rounded-xl transition-all cursor-pointer shrink-0"
          >
            View Execution List →
          </button>
        </div>
      )}

      {/* VIEW 1: Holdings & Analytics Tab */}
      {portfolioTab === 'holdings' && (
        <div className="space-y-6">
          
          {/* Active Holdings Table (Shifted to Top) */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  Active Holdings ({holdingsList.length})
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Click on any stock to view holding breakdown and buy more or sell shares
                </p>
              </div>

              <div className="flex items-center gap-3">
                {orders.length > 0 && (
                  <button
                    onClick={() => setPortfolioTab('history')}
                    className="text-xs text-indigo-600 hover:underline font-bold hidden sm:inline cursor-pointer"
                  >
                    View Completed Orders ({orders.length}) →
                  </button>
                )}
                <button
                  onClick={onNavigateToScreener}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-indigo-950 text-white text-xs font-extrabold transition-all shadow-md cursor-pointer"
                >
                  + Buy New Stocks
                </button>
              </div>
            </div>

            {holdingsList.length > 0 ? (
              <>
                {/* Mobile / Tablet Responsive Share Cards View */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 lg:hidden">
                  {holdingsList.map((h) => {
                    const isGain = h.pnl >= 0;
                    const isDayGain = h.dayChangeAmount >= 0;
                    const targetStock: StockDetail = h.stock || {
                      symbol: h.symbol,
                      name: h.symbol,
                      sector: 'Diversified Equity',
                      price: h.curPrice,
                      change: 0,
                      changePercent: 0,
                      dayHigh: h.curPrice * 1.02,
                      dayLow: h.curPrice * 0.98,
                      open: h.curPrice,
                      previousClose: h.curPrice,
                      high52: h.curPrice * 1.25,
                      low52: h.curPrice * 0.75,
                      peRatio: 22.5,
                      industryPe: 24.0,
                      marketCapCr: 45000,
                      eps: h.curPrice / 22.5,
                      dividendYield: 1.2,
                      bookValue: h.curPrice * 0.4,
                      roe: 18.5,
                      volume: 500000,
                      avgVolume: 450000,
                      beta: 1.02,
                      description: `Active investment position in ${h.symbol}.`,
                      teenSummary: `Holdings: ${h.quantity} shares owned with total current valuation of ${formatINR(h.curValue)}.`,
                      popularBrands: [h.symbol],
                      strengths: ['Active portfolio constituent', 'High liquidity Indian equity'],
                      risks: ['Market volatility and sector cycles'],
                    };

                    return (
                      <div
                        key={`card-${h.symbol}`}
                        onClick={() => onSelectStock(targetStock)}
                        className="bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-slate-900 text-sm">{h.symbol}</span>
                              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-1.5 py-0.2 rounded-md">
                                {h.quantity} Shares
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 font-medium">
                              {h.stock?.name || h.symbol} • {h.stock?.sector || 'Equity'}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">LTP (Current)</span>
                            <div className="font-black text-slate-900 font-mono text-sm">₹{h.curPrice.toFixed(2)}</div>
                            <div className={`text-[10px] font-bold ${h.priceDifferenceFromBuy >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {h.priceDifferenceFromBuy >= 0 ? '▲ +' : '▼ '}{h.priceDifferencePercent.toFixed(2)}% vs Buy
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                          <div className="bg-slate-50 p-2 rounded-xl">
                            <span className="text-[10px] text-slate-500 font-bold block">Avg Buy Price</span>
                            <span className="font-black text-slate-900 font-mono">₹{h.avgBuyPrice.toFixed(2)}</span>
                          </div>
                          <div className="bg-slate-50 p-2 rounded-xl text-right">
                            <span className="text-[10px] text-slate-500 font-bold block">Total Invested</span>
                            <span className="font-black text-slate-900 font-mono">{formatINR(h.totalInvested)}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-slate-50 p-2 rounded-xl">
                            <span className="text-[10px] text-slate-500 font-bold block">Current Value</span>
                            <span className="font-black text-slate-900 font-mono">{formatINR(h.curValue)}</span>
                          </div>
                          <div className={`p-2 rounded-xl text-right ${isGain ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
                            <span className="text-[10px] font-bold block">Total P&L</span>
                            <span className={`font-black font-mono ${isGain ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {isGain ? '+' : ''}{formatINR(h.pnl)} ({formatPercent(h.pnlPercent)})
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <div className="text-[11px] font-bold">
                            <span className="text-slate-400">1-Day: </span>
                            <span className={`font-mono ${isDayGain ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {isDayGain ? '+' : ''}{formatINR(h.dayChangeAmount)} ({formatPercent(h.dayChangePercent)})
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectStock(targetStock);
                            }}
                            className="px-3 py-1 bg-slate-900 hover:bg-indigo-950 text-white font-extrabold text-xs rounded-xl shadow-2xs"
                          >
                            Trade →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Full Table View */}
                <div className="overflow-x-auto hidden lg:block">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-3">COMPANY & SECTOR</th>
                        <th className="py-3 px-3 text-right">QTY OWNED</th>
                        <th className="py-3 px-3 text-right">AVG BUY PRICE</th>
                        <th className="py-3 px-3 text-right">LTP (CURRENT)</th>
                        <th className="py-3 px-3 text-right">INVESTED</th>
                        <th className="py-3 px-3 text-right">CURRENT VALUE</th>
                        <th className="py-3 px-3 text-right">TODAY&apos;S P&L</th>
                        <th className="py-3 px-3 text-right">TOTAL P&L</th>
                        <th className="py-3 px-3 text-center">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/50 text-zinc-700">
                      {holdingsList.map((h) => {
                        const isGain = h.pnl >= 0;
                        const isDayGain = h.dayChangeAmount >= 0;
                        const targetStock: StockDetail = h.stock || {
                          symbol: h.symbol,
                          name: h.symbol,
                          sector: 'Diversified Equity',
                          price: h.curPrice,
                          change: 0,
                          changePercent: 0,
                          dayHigh: h.curPrice * 1.02,
                          dayLow: h.curPrice * 0.98,
                          open: h.curPrice,
                          previousClose: h.curPrice,
                          high52: h.curPrice * 1.25,
                          low52: h.curPrice * 0.75,
                          peRatio: 22.5,
                          industryPe: 24.0,
                          marketCapCr: 45000,
                          eps: h.curPrice / 22.5,
                          dividendYield: 1.2,
                          bookValue: h.curPrice * 0.4,
                          roe: 18.5,
                          volume: 500000,
                          avgVolume: 450000,
                          beta: 1.02,
                          description: `Active investment position in ${h.symbol}.`,
                          teenSummary: `Holdings: ${h.quantity} shares owned with total current valuation of ${formatINR(h.curValue)}.`,
                          popularBrands: [h.symbol],
                          strengths: ['Active portfolio constituent', 'High liquidity Indian equity'],
                          risks: ['Market volatility and sector cycles'],
                        };

                        return (
                          <tr 
                            key={h.symbol} 
                            onClick={() => onSelectStock(targetStock)}
                            className="hover:bg-indigo-50/50 transition-colors cursor-pointer group"
                            title="Click to view share details and Buy More / Sell"
                          >
                            <td className="py-3 px-3">
                              <div className="font-extrabold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                                <span>{h.symbol}</span>
                                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-1.5 py-0.2 rounded-md">
                                  {h.quantity} shares
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 font-medium">{h.stock?.name || h.symbol} • {h.stock?.sector || 'Equity'}</div>
                            </td>
                            <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                              {h.quantity}
                            </td>
                            <td className="py-3 px-3 text-right font-medium">
                              ₹{h.avgBuyPrice.toFixed(2)}
                            </td>
                            <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                              <div>₹{h.curPrice.toFixed(2)}</div>
                              <div className={`text-[10px] font-bold ${h.priceDifferenceFromBuy >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {h.priceDifferenceFromBuy >= 0 ? '▲ +' : '▼ '}{h.priceDifferencePercent.toFixed(2)}%
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right font-medium text-slate-500">
                              {formatINR(h.totalInvested)}
                            </td>
                            <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                              {formatINR(h.curValue)}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className={`font-extrabold ${isDayGain ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {isDayGain ? '+' : ''}{formatINR(h.dayChangeAmount)}
                              </div>
                              <div className={`text-[10px] font-bold ${isDayGain ? 'text-emerald-700' : 'text-rose-700'}`}>
                                ({formatPercent(h.dayChangePercent)})
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className={`font-extrabold ${isGain ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {isGain ? '+' : ''}{formatINR(h.pnl)}
                              </div>
                              <div className={`text-[10px] font-bold ${isGain ? 'text-emerald-700' : 'text-rose-700'}`}>
                                ({formatPercent(h.pnlPercent)})
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectStock(targetStock);
                                }}
                                className="px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-900 hover:text-white text-slate-900 font-extrabold text-xs border border-slate-200 transition-all cursor-pointer shadow-2xs group-hover:bg-slate-900 group-hover:text-white"
                              >
                                Trade
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                <Wallet className="w-10 h-10 text-zinc-400 mx-auto mb-2" />
                <h4 className="text-sm font-extrabold text-slate-900">Your portfolio is currently empty</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Your ₹10,00,000 virtual balance is safe here while you learn. There is no need to place a trade today.
                </p>
                <button
                  onClick={onNavigateToScreener}
                  className="mt-4 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-indigo-950 text-white font-extrabold text-xs shadow-md cursor-pointer"
                >
                  Explore Companies When Ready
                </button>
              </div>
            )}
          </div>

          {/* Visual Analytics Grid: Equity Growth Chart & Sector Asset Allocation (Positioned Below Active Holdings) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Cols: Portfolio Equity Curve Performance Chart */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                    Portfolio Performance Tracking
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {orders.some((order) => order.status === 'EXECUTED') ? 'Account value recorded from your genuine simulated activity' : 'A real account timeline will start after your first executed trade'}
                  </p>
                </div>
                <span className="text-xs font-extrabold text-slate-900 bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl">
                  Account Trend
                </span>
              </div>

              <div className="h-64 w-full">
                {orders.some((order) => order.status === 'EXECUTED') && portfolioHistory.length > 1 ? (
                  <PortfolioEquityAreaChart data={portfolioHistory} height={240} />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 text-center">
                    <TrendingUp className="mb-3 h-8 w-8 text-slate-300" />
                    <p className="text-sm font-black text-slate-800">No performance history yet</p>
                    <p className="mt-1 max-w-sm text-xs font-medium text-slate-500">Your genuine portfolio curve will begin after your first executed simulated trade. No sample returns are shown.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right 1 Col: Holdings by Sector Donut Chart */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-emerald-600" />
                  Holdings by Sector
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Portfolio sector diversification
                </p>
              </div>

              <div className="h-52 w-full my-2">
                {sectorData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sectorData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {sectorData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={SECTOR_COLORS[index % SECTOR_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(val: any) => formatINR(Number(val))}
                        contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '12px', fontSize: '11px', color: '#0F172A' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <PieIcon className="w-8 h-8 mb-2 opacity-20" />
                    <span className="text-xs font-medium">No active holdings</span>
                  </div>
                )}
              </div>

              <div className="space-y-1 text-xs">
                {sectorData.slice(0, 4).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-slate-500">
                    <div className="flex items-center gap-1.5 truncate max-w-[160px]">
                      <span 
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: SECTOR_COLORS[idx % SECTOR_COLORS.length] }}
                      />
                      <span className="truncate font-medium">{item.name}</span>
                    </div>
                    <span className="font-extrabold text-slate-900">{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Portfolio Health & Diversification Rating Card */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md">
                  {healthAnalysis.score}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-white text-base">Portfolio Health Rating</h4>
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-white/10 text-amber-300 border border-white/10">
                      {healthAnalysis.label}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 mt-1">
                    Based on diversification, position size, cash flexibility, trade plans, journal reviews and learning—not profit.
                  </p>
                </div>
              </div>

              <div className="text-xs text-white bg-white/10 p-3.5 rounded-2xl border border-white/10 w-full sm:w-auto max-w-md">
                <div className="font-bold text-amber-300 flex items-center gap-1 mb-1">
                  <Sparkles className="w-3.5 h-3.5" /> Mentor Guidance:
                </div>
                <ul className="space-y-1 text-[11px] text-white font-medium">
                  {healthAnalysis.tips.map((tip, i) => (
                    <li key={i}>• {tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* VIEW: Analytics, XIRR, Benchmark Alpha & Capital Gains Tax Ledger */}
      {portfolioTab === 'analytics' && (() => {
        // Calculations for Market-Cap Allocation
        let largeCapVal = 0;
        let midCapVal = 0;
        let smallCapVal = 0;

        holdingsList.forEach((h) => {
          const mcap = h.stock?.marketCapCr || 50000;
          if (mcap >= 50000) largeCapVal += h.curValue;
          else if (mcap >= 15000) midCapVal += h.curValue;
          else smallCapVal += h.curValue;
        });

        const totalPort = portfolioValue || 1;
        const largeCapPct = ((largeCapVal / totalPort) * 100).toFixed(1);
        const midCapPct = ((midCapVal / totalPort) * 100).toFixed(1);
        const smallCapPct = ((smallCapVal / totalPort) * 100).toFixed(1);
        const cashPct = ((cashBalance / totalPort) * 100).toFixed(1);

        // Professional analytics stay unavailable until genuine dated cash flows,
        // a period-matched NIFTY series, and sufficient return observations exist.
        const executedOrders = orders.filter((order) => order.status === 'EXECUTED');
        const analyticsHistoryCount = portfolioHistory.filter((item) => Number.isFinite(item.portfolioValue)).length;
        const xirrReady = executedOrders.length >= 2 && analyticsHistoryCount >= 30;
        const benchmarkReady = false;
        const betaReady = false;

        // Tax Ledger Calculations (Budget 2024 Indian Tax Slabs)
        // STCG: 20% on short-term equity gains (< 1 year)
        // LTCG: 12.5% on long-term equity gains (> 1 year, with ₹1.25L exemption)
        const unrealizedGains = Math.max(0, totalPnL);
        const stcgRate = 0.20; // 20%
        const ltcgRate = 0.125; // 12.5%
        const ltcgExemption = 125000;

        // Assume virtual trades are short term (< 12 months) by default
        const estimatedStcgTax = unrealizedGains * stcgRate;
        const estimatedLtcgTax = Math.max(0, unrealizedGains - ltcgExemption) * ltcgRate;

        return (
          <div className="space-y-6">
            <div className="flex items-start gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-indigo-950">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-indigo-700" />
              <div><p className="text-xs font-black uppercase tracking-wider">Analytics integrity</p><p className="mt-1 text-[11px] leading-relaxed">RupeeRookie shows XIRR, alpha and beta only when the required dated cash flows and period-matched benchmark history exist. No sample or estimated performance statistic is substituted.</p></div>
            </div>
            {/* Top KPI Metrics Row: XIRR, Benchmark Alpha, Sharpe Ratio */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* XIRR Card */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                  <span className="flex items-center gap-1.5 uppercase">
                    <TrendingUp className="w-4 h-4 text-emerald-600" /> Annualized XIRR
                  </span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-800 font-black px-2 py-0.5 rounded-full border border-emerald-200">
                    CAGR
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-400 font-mono mt-2">
                  {xirrReady ? 'Pending calculation' : '—'}
                </div>
                <div className="text-[11px] text-slate-500 font-medium mt-1">
                  {xirrReady ? 'Dated cash-flow engine is not connected yet' : `${analyticsHistoryCount}/30 account observations · ${executedOrders.length}/2 executed orders`}
                </div>
              </div>

              {/* Benchmark Alpha Card */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                  <span className="flex items-center gap-1.5 uppercase">
                    <Award className="w-4 h-4 text-indigo-600" /> Benchmark Alpha
                  </span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">Needs matched period</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono mt-2 text-slate-400">{benchmarkReady ? 'Pending calculation' : '—'}</div>
                <div className="text-[11px] text-slate-500 font-medium mt-1">
                  A same-start-date NIFTY 50 total-return series is required
                </div>
              </div>

              {/* Portfolio Beta */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                  <span className="flex items-center gap-1.5 uppercase">
                    <Zap className="w-4 h-4 text-amber-600" /> Portfolio Beta (β)
                  </span>
                  <span className="text-[10px] bg-slate-100 text-slate-700 font-black px-2 py-0.5 rounded-full">
                    VOLATILITY
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-400 font-mono mt-2">{betaReady ? 'Pending calculation' : '—'}</div>
                <div className="text-[11px] text-slate-500 font-medium mt-1">
                  Requires sufficient paired daily portfolio and benchmark returns
                </div>
              </div>

              {/* Capital Gains Tax Liability */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                  <span className="flex items-center gap-1.5 uppercase">
                    <Calculator className="w-4 h-4 text-rose-600" /> If sold now
                  </span>
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 font-black px-2 py-0.5 rounded-full">
                    STCG (20%)
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono mt-2">
                  {formatINR(estimatedStcgTax)}
                </div>
                <div className="text-[11px] text-slate-500 font-medium mt-1">
                  Illustrative STCG on {formatINR(unrealizedGains)} gains if realised; not a filed tax liability
                </div>
              </div>
            </div>

            {/* Middle Section: Market-Cap Allocation & Tax Breakdown Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Card 1: Market-Cap Distribution */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                      <PieIcon className="w-5 h-5" />
                    </span>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Market-Cap Allocation</h4>
                      <p className="text-xs text-slate-500 font-medium">Large-Cap vs Mid-Cap vs Small-Cap breakdown</p>
                    </div>
                  </div>
                </div>

                {/* Progress Bar Stack */}
                <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex gap-0.5">
                  <div style={{ width: `${largeCapPct}%` }} className="bg-indigo-600 transition-all duration-500" title={`Large Cap: ${largeCapPct}%`} />
                  <div style={{ width: `${midCapPct}%` }} className="bg-amber-500 transition-all duration-500" title={`Mid Cap: ${midCapPct}%`} />
                  <div style={{ width: `${smallCapPct}%` }} className="bg-emerald-500 transition-all duration-500" title={`Small Cap: ${smallCapPct}%`} />
                  <div style={{ width: `${cashPct}%` }} className="bg-slate-300 transition-all duration-500" title={`Cash: ${cashPct}%`} />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0" />
                      Large-Cap
                    </div>
                    <div className="text-base font-black text-slate-900 font-mono mt-1">{largeCapPct}%</div>
                    <div className="text-[10px] text-slate-500 font-mono">{formatINR(largeCapVal)}</div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                      Mid-Cap
                    </div>
                    <div className="text-base font-black text-slate-900 font-mono mt-1">{midCapPct}%</div>
                    <div className="text-[10px] text-slate-500 font-mono">{formatINR(midCapVal)}</div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                      Small-Cap
                    </div>
                    <div className="text-base font-black text-slate-900 font-mono mt-1">{smallCapPct}%</div>
                    <div className="text-[10px] text-slate-500 font-mono">{formatINR(smallCapVal)}</div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0" />
                      Liquid Cash
                    </div>
                    <div className="text-base font-black text-slate-900 font-mono mt-1">{cashPct}%</div>
                    <div className="text-[10px] text-slate-500 font-mono">{formatINR(cashBalance)}</div>
                  </div>
                </div>
              </div>

              {/* Card 2: Union Budget Capital Gains Tax Ledger */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
                      <Calculator className="w-5 h-5" />
                    </span>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Indian Capital Gains Tax Ledger</h4>
                      <p className="text-xs text-slate-500 font-medium">Updated as per Union Budget revised tax slabs</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black bg-rose-50 text-rose-800 px-2 py-0.5 rounded-full border border-rose-200">
                    Section 111A & 112A
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <div>
                      <span className="font-bold text-slate-900 block">Short-Term Capital Gains (STCG)</span>
                      <span className="text-[10px] text-slate-500">Held &lt; 12 Months • Taxed @ 20%</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-black text-slate-900 text-sm">{formatINR(estimatedStcgTax)}</span>
                      <span className="text-[10px] text-slate-500 block">20% of {formatINR(unrealizedGains)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <div>
                      <span className="font-bold text-slate-900 block">Long-Term Capital Gains (LTCG)</span>
                      <span className="text-[10px] text-slate-500">Held &ge; 12 Months • 12.5% above ₹1.25L</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-black text-emerald-700 text-sm">{formatINR(estimatedLtcgTax)}</span>
                      <span className="text-[10px] text-slate-500 block">₹1.25 Lakh Exemption</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl text-[11px] text-indigo-950 font-medium leading-relaxed">
                  💡 <strong>Tax Tip for Young Investors:</strong> Unrealized gains are not taxed until you sell! Long-term investing (&gt; 1 year) significantly reduces your tax rate from 20% to 12.5% with an annual ₹1.25 Lakh tax-free profit buffer.
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* VIEW 2: Dedicated Execution List / Pending Orders Tab */}
      {portfolioTab === 'pending' && (
        <div className="space-y-6">
          {/* Status Alert Banner */}
          <div className="bg-white border-2 border-amber-400/80 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-3 bg-amber-100 border border-amber-300 rounded-2xl shrink-0">
                  <Clock className="w-6 h-6 text-amber-800" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      Order Execution Queue ({pendingOrdersList.length} Pending)
                    </h3>
                    <span className="bg-amber-100 text-amber-900 text-xs font-black px-2.5 py-0.5 rounded-full border border-amber-300">
                      AFTER-MARKET QUEUE
                    </span>
                  </div>
                  <p className="text-xs text-zinc-700 font-medium mt-1 leading-relaxed">
                    Orders placed when the NSE Market is closed are safely held in your pending execution list. 
                    They will execute automatically as soon as the market opens at <strong>09:15 AM IST</strong> ({nseMarketInfo.nextOpeningDateString}). You will receive an instant notification when execution completes.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-right shrink-0">
                <div className="text-[10px] text-slate-500 font-bold uppercase">Next Market Open Countdown</div>
                <div className="text-base font-black text-slate-900 font-mono mt-0.5">
                  {nseMarketInfo.nextSessionCountdown}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  Current IST: {nseMarketInfo.istTimeString}
                </div>
              </div>
            </div>
          </div>

          {/* Pending Orders Table */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Pending / In-Execution Orders ({pendingOrdersList.length})
                </h4>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Held orders awaiting NSE market open. You can cancel any queued order anytime before execution.
                </p>
              </div>
              <button
                onClick={onNavigateToScreener}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-indigo-950 text-white text-xs font-extrabold transition-all shadow-md cursor-pointer"
              >
                + Place New Order
              </button>
            </div>

            {pendingOrdersList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-3">PLACED TIME (IST)</th>
                      <th className="py-3 px-3">ACTION</th>
                      <th className="py-3 px-3">STOCK / COMPANY</th>
                      <th className="py-3 px-3">ORDER TYPE</th>
                      <th className="py-3 px-3 text-right">QUANTITY</th>
                      <th className="py-3 px-3 text-right">ORDER PRICE</th>
                      <th className="py-3 px-3 text-right">RESERVED VALUE</th>
                      <th className="py-3 px-3 text-center">STATUS</th>
                      <th className="py-3 px-3 text-center">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/50 text-zinc-700">
                    {pendingOrdersList.map((ord) => {
                      const matchedStock = stocks.find((s) => s.symbol === ord.symbol);
                      return (
                        <tr key={ord.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                            {ord.placedTimeIST || ord.timestamp}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black ${
                              ord.type === 'BUY' 
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}>
                              {ord.type === 'BUY' ? '▲ BUY' : '▼ SELL'}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-extrabold text-slate-900 text-sm">{ord.symbol}</div>
                            <div className="text-[11px] text-slate-500 font-medium">{ord.stockName}</div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                              {ord.orderType}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                            {ord.quantity} shares
                          </td>
                          <td className="py-3 px-3 text-right font-extrabold text-slate-900 font-mono">
                            ₹{ord.price.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-right font-black text-slate-900 font-mono">
                            {formatINR(ord.totalAmount)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-900 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-300">
                              <Clock className="w-3 h-3 text-amber-700 animate-pulse" /> PENDING (AMO)
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => cancelPendingOrder(ord.id)}
                                className="px-3 py-1 rounded-xl bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 font-bold text-xs border border-rose-200 transition-colors cursor-pointer"
                                title="Cancel order and refund reserved resources"
                              >
                                Cancel Order
                              </button>
                              {matchedStock && (
                                <button
                                  onClick={() => onSelectStock(matchedStock)}
                                  className="px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-slate-900 hover:text-white text-slate-900 font-bold text-xs border border-slate-200 transition-colors cursor-pointer"
                                >
                                  View
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <h4 className="text-sm font-extrabold text-slate-900">No Pending Orders in Execution List</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  All your placed orders have either been executed or cancelled. Any after-market orders placed during closed hours will appear here.
                </p>
                <button
                  onClick={onNavigateToScreener}
                  className="mt-4 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-indigo-950 text-white font-extrabold text-xs shadow-md cursor-pointer"
                >
                  Explore Stocks & Place Order
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: Dedicated Trade History Tab */}
      {portfolioTab === 'history' && (
        <div className="space-y-6">
          
          {/* Trade History Overview Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                <span className="flex items-center gap-1.5 uppercase tracking-wider">
                  <History className="w-4 h-4 text-slate-900" /> TOTAL ORDERS LOGGED
                </span>
              </div>
              <div className="mt-2.5">
                <div className="text-2xl font-black text-slate-900">{tradeStats.totalTrades}</div>
                <div className="text-xs text-slate-500 font-medium mt-1">
                  {tradeStats.executedCount} Executed • {tradeStats.pendingCount} Pending
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs text-emerald-700 font-bold">
                <span className="flex items-center gap-1.5 uppercase tracking-wider">
                  <ShoppingBag className="w-4 h-4 text-emerald-600" /> BUY ORDERS
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-extrabold">
                  {tradeStats.buyCount} Orders
                </span>
              </div>
              <div className="mt-2.5">
                <div className="text-2xl font-black text-emerald-700">{formatINR(tradeStats.totalBuyValue)}</div>
                <div className="text-xs text-slate-500 font-medium mt-1">Total buy order value</div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs text-rose-700 font-bold">
                <span className="flex items-center gap-1.5 uppercase tracking-wider">
                  <DollarSign className="w-4 h-4 text-rose-600" /> SELL ORDERS
                </span>
                <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-extrabold">
                  {tradeStats.sellCount} Orders
                </span>
              </div>
              <div className="mt-2.5">
                <div className="text-2xl font-black text-rose-700">{formatINR(tradeStats.totalSellValue)}</div>
                <div className="text-xs text-slate-500 font-medium mt-1">Total sell proceeds</div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                <span className="flex items-center gap-1.5 uppercase tracking-wider">
                  <Clock className="w-4 h-4 text-indigo-600" /> PENDING QUEUE
                </span>
              </div>
              <div className="mt-2.5">
                <div className="text-2xl font-black text-amber-600">{tradeStats.pendingCount}</div>
                <div className="text-xs text-slate-500 font-medium mt-1">Awaiting market open</div>
              </div>
            </div>
          </div>

          {/* Trade History Main Table & Filter Controls */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            
            {/* Header & Filter Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-900" />
                  Chronological Order Log ({filteredOrders.length})
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Complete audit trail of all buy, sell, pending AMO, and executed orders
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Search Box */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={tradeSearch}
                    onChange={(e) => setTradeSearch(e.target.value)}
                    placeholder="Search stock..."
                    className="pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-900 placeholder-[#64748B] focus:outline-none focus:border-slate-900 w-36 sm:w-44"
                  />
                </div>

                {/* Status Filter */}
                <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setStatusFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
                      statusFilter === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setStatusFilter('PENDING')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
                      statusFilter === 'PENDING' ? 'bg-amber-600 text-white' : 'text-slate-500 hover:text-amber-700'
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => setStatusFilter('EXECUTED')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
                      statusFilter === 'EXECUTED' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-emerald-700'
                    }`}
                  >
                    Executed
                  </button>
                </div>

                {/* Action Filter Buttons */}
                <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setTradeFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
                      tradeFilter === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    All Types
                  </button>
                  <button
                    onClick={() => setTradeFilter('BUY')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
                      tradeFilter === 'BUY' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-emerald-700'
                    }`}
                  >
                    Buys
                  </button>
                  <button
                    onClick={() => setTradeFilter('SELL')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
                      tradeFilter === 'SELL' ? 'bg-rose-600 text-white' : 'text-slate-500 hover:text-rose-700'
                    }`}
                  >
                    Sells
                  </button>
                </div>

                {/* Sort Toggle */}
                <button
                  onClick={() => setSortOrder(sortOrder === 'NEWEST' ? 'OLDEST' : 'NEWEST')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
                  title="Toggle Chronological Order"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span>{sortOrder === 'NEWEST' ? 'Newest' : 'Oldest'}</span>
                </button>
              </div>
            </div>

            {/* Table of Orders */}
            {filteredOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="py-3 px-3">DATE & TIME</th>
                      <th className="py-3 px-3">ACTION</th>
                      <th className="py-3 px-3">STOCK / COMPANY</th>
                      <th className="py-3 px-3">ORDER TYPE</th>
                      <th className="py-3 px-3 text-right">QUANTITY</th>
                      <th className="py-3 px-3 text-right">ENTRY / EXEC PRICE</th>
                      <th className="py-3 px-3 text-right">TOTAL VALUE</th>
                      <th className="py-3 px-3 text-center">STATUS</th>
                      <th className="py-3 px-3 text-center">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/50 text-zinc-700">
                    {filteredOrders.map((ord) => {
                      const matchedStock = stocks.find((s) => s.symbol === ord.symbol);
                      return (
                        <tr key={ord.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                            <div>{ord.timestamp}</div>
                            {ord.executionTime && (
                              <div className="text-[10px] text-emerald-700 font-bold">Exec: {ord.executionTime}</div>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black ${
                              ord.type === 'BUY' 
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}>
                              {ord.type === 'BUY' ? '▲ BUY' : '▼ SELL'}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-extrabold text-slate-900 text-sm">{ord.symbol}</div>
                            <div className="text-[11px] text-slate-500 font-medium">{ord.stockName}</div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                              {ord.orderType}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                            {ord.quantity} shares
                          </td>
                          <td className="py-3 px-3 text-right font-extrabold text-slate-900 font-mono">
                            ₹{ord.price.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-right font-black text-slate-900 font-mono">
                            {formatINR(ord.totalAmount)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {ord.status === 'PENDING' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                                <Clock className="w-3 h-3 text-amber-700 animate-pulse" /> PENDING (AMO)
                              </span>
                            ) : ord.status === 'CANCELLED' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded-full border border-zinc-300">
                                🚫 CANCELLED
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                                <CheckCircle2 className="w-3 h-3" /> EXECUTED
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {ord.status === 'PENDING' && (
                                <button
                                  onClick={() => cancelPendingOrder(ord.id)}
                                  className="px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 font-bold text-xs border border-rose-200 transition-colors cursor-pointer"
                                >
                                  Cancel
                                </button>
                              )}
                              {matchedStock && (
                                <button
                                  onClick={() => onSelectStock(matchedStock)}
                                  className="px-3 py-1 rounded-xl bg-slate-50 hover:bg-slate-900 hover:text-white text-slate-900 font-bold text-xs border border-slate-200 transition-colors cursor-pointer"
                                >
                                  View / Trade
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                <Clock className="w-10 h-10 text-zinc-400 mx-auto mb-2" />
                <h4 className="text-sm font-extrabold text-slate-900">
                  {orders.length === 0 ? 'No orders in your history yet' : 'No transactions matching your filter'}
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {orders.length === 0 
                    ? 'Start building your portfolio with ₹10,00,000 virtual money! All pending, executed, and cancelled orders will be logged here.'
                    : 'Try clearing your search query or selecting "All" to view all logged orders.'}
                </p>
                {orders.length === 0 && (
                  <button
                    onClick={onNavigateToScreener}
                    className="mt-4 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-indigo-950 text-white font-extrabold text-xs shadow-md cursor-pointer"
                  >
                    Browse Screener & Place First Trade
                  </button>
                )}
              </div>
            )}

          </div>

        </div>
      )}

      {/* Portfolio Performance & Holdings Summary Report Modal */}
      <PortfolioReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        portfolioValue={portfolioValue}
        investedValue={investedValue}
        cashBalance={cashBalance}
        totalPnL={totalPnL}
        totalPnLPercent={totalPnLPercent}
        dayPnL={dayPnL}
        holdings={holdings}
        orders={orders}
        stocks={stocks}
      />

    </div>
  );
};
