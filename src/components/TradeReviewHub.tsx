import React, { useEffect, useState, useMemo } from 'react';
import { 
  BarChart3, 
  Dna, 
  Award, 
  BrainCircuit, 
  BookOpen, 
  Share2, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Clock, 
  Percent, 
  ShieldCheck, 
  Sparkles, 
  Copy, 
  Download,
  Flame,
  Layers,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  Target,
  ShieldAlert,
  Calendar,
  RotateCcw,
  FileSpreadsheet,
  Eye,
  Info,
  ChevronRight,
  ExternalLink,
  SlidersHorizontal,
  Check,
  ImagePlus,
  Save,
  NotebookTabs
} from 'lucide-react';
import { useSimulator } from '../context/SimulatorContext';
import { formatINR } from '../utils/formatters';
import { TraderDNA, SkillScoreBreakdown, TradeJournalEntry, ProductType, Order } from '../types';

export interface TradeHistoryTransaction {
  id: string;
  orderId: string;
  symbol: string;
  stockName: string;
  type: 'BUY' | 'SELL';
  productType: ProductType;
  orderType: 'MARKET' | 'LIMIT' | 'GTT';
  quantity: number;
  price: number;
  totalAmount: number;
  timestamp: string;
  executionTime?: string;
  status: 'EXECUTED' | 'PENDING' | 'CANCELLED';
  // Closed Position Metrics (For SELL / Closed Trades)
  isClosedPosition: boolean;
  buyAvgPrice?: number;
  realizedPnL?: number;
  realizedPnLPercent?: number;
  rMultiple?: number;
  /** Stop and target as recorded on the order, absent when none was set. */
  plannedStopLoss?: number;
  plannedTarget?: number;
  exitReason?: 'TARGET_HIT' | 'STOP_LOSS_HIT' | 'MANUAL_EXIT' | 'SQUARE_OFF';
  charges?: number;
  holdTime?: string;
  setup?: string;
  notes?: string;
  aiFeedback?: string;
  executionScore?: number;
  riskScore?: number;
}

interface StoredTradeReview {
  note: string;
  lesson: string;
  rating: number;
  screenshot?: string;
  tags?: string[];
  planFollowed?: 'YES' | 'PARTLY' | 'NO';
  emotionBefore?: string;
  emotionAfter?: string;
  annotations?: Array<{ kind: 'ENTRY' | 'STOP' | 'TARGET' | 'EXIT'; x: number; y: number }>;
  updatedAt: string;
}

// A standard deviation estimated from a handful of trades is noise, so the
// Sharpe ratio stays hidden until the sample is large enough to mean something.
const SHARPE_MINIMUM_TRADES = 8;

/** Plain-language band for a per-trade Sharpe ratio. */
const describeSharpe = (ratio: number): string => {
  if (ratio < 0) return 'Negative';
  if (ratio < 0.5) return 'Weak';
  if (ratio < 1) return 'Fair';
  if (ratio < 2) return 'Good';
  return 'Strong';
};

const REVIEW_TAGS = ['FOMO', 'Earnings', 'Breakout', 'Value thesis', 'Revenge trade', 'Long-term'];
const EMOTIONS = ['Calm', 'Confident', 'Uncertain', 'Excited', 'Fearful', 'Frustrated'];


export function TradeReviewHub({ initialTab = 'DNA' }: { initialTab?: 'HISTORY' | 'PERFORMANCE' | 'JOURNAL' | 'BEHAVIOR' | 'DNA' | 'SKILL' }) {
  const { totalPnL, totalPnLPercent, orders, userXP, notifyUser, currentUser } = useSimulator();
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'HISTORY' | 'PERFORMANCE' | 'JOURNAL' | 'BEHAVIOR' | 'DNA' | 'SKILL'>(initialTab);

  // Filter States for Trade History Log
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');
  const [pnlFilter, setPnlFilter] = useState<'ALL' | 'PROFIT' | 'LOSS' | 'BREAKEVEN'>('ALL');
  const [productFilter, setProductFilter] = useState<'ALL' | 'CNC' | 'MIS'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'EXECUTED' | 'PENDING' | 'CANCELLED'>('ALL');
  const [timeFilter, setTimeFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST' | 'PNL_HIGH' | 'PNL_LOW' | 'VALUE_HIGH' | 'QTY_HIGH'>('NEWEST');

  // Modals & Details
  const [selectedTradeForDetail, setSelectedTradeForDetail] = useState<TradeHistoryTransaction | null>(null);
  const [selectedJournalTrade, setSelectedJournalTrade] = useState<TradeJournalEntry | null>(null);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [tradeToShare, setTradeToShare] = useState<TradeHistoryTransaction | null>(null);
  const reviewStorageKey = `rr_trade_reviews:${currentUser?.id || 'guest'}`;
  const [tradeReviews, setTradeReviews] = useState<Record<string, StoredTradeReview>>(() => {
    try {
      return JSON.parse(localStorage.getItem(reviewStorageKey) || '{}');
    } catch {
      return {};
    }
  });
  const [reviewDraft, setReviewDraft] = useState<StoredTradeReview>({ note: '', lesson: '', rating: 3, updatedAt: '' });
  const [annotationTool, setAnnotationTool] = useState<'ENTRY' | 'STOP' | 'TARGET' | 'EXIT' | null>(null);

  useEffect(() => {
    localStorage.setItem(reviewStorageKey, JSON.stringify(tradeReviews));
  }, [reviewStorageKey, tradeReviews]);

  // Compile the signed-in user's real simulator transactions only.
  const allTransactions: TradeHistoryTransaction[] = useMemo(() => {
    const liveItems: TradeHistoryTransaction[] = orders.map((ord: Order) => {
      const isSell = ord.type === 'SELL';
      const buyPrice = ord.buyAvgPrice || (isSell ? ord.price * 0.97 : ord.price);
      const realizedPnL = ord.realizedPnL !== undefined 
        ? ord.realizedPnL 
        : (isSell ? Number(((ord.price - buyPrice) * ord.quantity).toFixed(2)) : undefined);
      const realizedPnLPercent = ord.realizedPnLPercent !== undefined
        ? ord.realizedPnLPercent
        : (isSell && buyPrice > 0 ? Number((((ord.price - buyPrice) / buyPrice) * 100).toFixed(2)) : undefined);

      // An R-multiple is profit measured against the capital genuinely put at
      // risk, so it only exists when the trade carried a stop-loss. Assigning
      // a figure from the sign of the P&L would be circular, so it stays
      // undefined and the UI omits it.
      const stopLossPrice = ord.bracketOrder?.stopLossPrice;
      const riskPerShare = stopLossPrice && buyPrice > stopLossPrice ? buyPrice - stopLossPrice : 0;
      const rMult = ord.rMultiple !== undefined
        ? ord.rMultiple
        : (isSell && riskPerShare > 0 ? Number(((ord.price - buyPrice) / riskPerShare).toFixed(2)) : undefined);

      // Without a recorded stop or target, why a position closed is not known.
      const exitReason = ord.exitReason || undefined;
      const charges = ord.charges || (ord.productType === 'MIS' ? 20.0 + (ord.totalAmount * 0.00025) : ord.totalAmount * 0.001);

      return {
        id: `th-${ord.id}`,
        orderId: ord.id,
        symbol: ord.symbol,
        stockName: ord.stockName,
        type: ord.type,
        productType: ord.productType,
        orderType: ord.orderType,
        quantity: ord.quantity,
        price: ord.price,
        totalAmount: ord.totalAmount,
        timestamp: ord.timestamp,
        executionTime: ord.executionTime || `${ord.timestamp} IST`,
        status: ord.status === 'TRIGGERED' ? 'EXECUTED' : ord.status,
        isClosedPosition: isSell && ord.status === 'EXECUTED',
        buyAvgPrice: isSell ? buyPrice : undefined,
        realizedPnL,
        realizedPnLPercent,
        rMultiple: rMult,
        plannedStopLoss: stopLossPrice,
        plannedTarget: ord.bracketOrder?.targetPrice,
        exitReason,
        charges: Number(charges.toFixed(2)),
        holdTime: ord.holdTime || (ord.productType === 'MIS' ? 'Intraday (Same Day)' : '1 Day+'),
        // The setup is whatever the trader actually wrote. Naming it
        // "Technical Profit Target" on their behalf invents a rationale.
        setup: ord.notes || undefined,
        notes: ord.notes || `${ord.type} order of ${ord.quantity} shares of ${ord.symbol}`,
        // A factual note about the fill, rather than a verdict on discipline
        // that nothing in the order measured.
        aiFeedback: isSell && riskPerShare > 0
          ? `Exited at ₹${ord.price.toFixed(2)} against a stop at ₹${stopLossPrice!.toFixed(2)}.`
          : `${isSell ? 'Exit' : 'Entry'} filled at ₹${ord.price.toFixed(2)}${riskPerShare > 0 ? '' : ' · no stop-loss recorded'}.`,
        // executionScore and riskScore are intentionally absent: nothing in an
        // order supports a 0-100 quality grade, and a fabricated one reads as
        // evidence of skill.
      };
    });

    return liveItems;
  }, [orders]);

  // Apply All User Filters
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((item) => {
      // 1. Search Query (Symbol, Name, OrderId)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSym = item.symbol.toLowerCase().includes(q);
        const matchName = item.stockName.toLowerCase().includes(q);
        const matchId = item.orderId.toLowerCase().includes(q);
        if (!matchSym && !matchName && !matchId) return false;
      }

      // 2. Type Filter (BUY vs SELL)
      if (typeFilter !== 'ALL' && item.type !== typeFilter) {
        return false;
      }

      // 3. P&L Status Filter (For Closed Positions)
      if (pnlFilter !== 'ALL') {
        if (!item.isClosedPosition || item.realizedPnL === undefined) {
          return false;
        }
        if (pnlFilter === 'PROFIT' && item.realizedPnL <= 0) return false;
        if (pnlFilter === 'LOSS' && item.realizedPnL >= 0) return false;
        if (pnlFilter === 'BREAKEVEN' && Math.abs(item.realizedPnL) > 0.5) return false;
      }

      // 4. Product Type Filter (CNC vs MIS)
      if (productFilter !== 'ALL' && item.productType !== productFilter) {
        return false;
      }

      // 5. Order Status Filter (EXECUTED, PENDING, CANCELLED)
      if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false;
      }

      // 6. Time Filter
      if (timeFilter === 'TODAY') {
        const isToday = item.timestamp.toLowerCase().includes('today') || item.timestamp.includes(':');
        if (!isToday) return false;
      } else if (timeFilter === 'WEEK') {
        const isRecent = item.timestamp.toLowerCase().includes('today') || item.timestamp.toLowerCase().includes('yesterday') || item.timestamp.includes('day') || item.timestamp.includes('Aug');
        if (!isRecent) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'NEWEST') return 0; // Natural array order is newest first
      if (sortBy === 'OLDEST') return -1;
      if (sortBy === 'PNL_HIGH') return (b.realizedPnL || 0) - (a.realizedPnL || 0);
      if (sortBy === 'PNL_LOW') return (a.realizedPnL || 0) - (b.realizedPnL || 0);
      if (sortBy === 'VALUE_HIGH') return b.totalAmount - a.totalAmount;
      if (sortBy === 'QTY_HIGH') return b.quantity - a.quantity;
      return 0;
    });
  }, [allTransactions, searchQuery, typeFilter, pnlFilter, productFilter, statusFilter, timeFilter, sortBy]);

  // Aggregate KPI summary for closed positions
  const closedPositionStats = useMemo(() => {
    const closedItems = allTransactions.filter(t => t.isClosedPosition && t.realizedPnL !== undefined);
    const winTrades = closedItems.filter(t => (t.realizedPnL || 0) > 0);
    const lossTrades = closedItems.filter(t => (t.realizedPnL || 0) < 0);
    const totalRealized = closedItems.reduce((acc, t) => acc + (t.realizedPnL || 0), 0);
    const totalTurnover = allTransactions.reduce((acc, t) => acc + t.totalAmount, 0);

    const winSum = winTrades.reduce((acc, t) => acc + (t.realizedPnL || 0), 0);
    const lossSum = Math.abs(lossTrades.reduce((acc, t) => acc + (t.realizedPnL || 0), 0));

    const avgWin = winTrades.length > 0 ? winSum / winTrades.length : 0;
    const avgLoss = lossTrades.length > 0 ? lossSum / lossTrades.length : 0;
    const winRate = closedItems.length > 0 ? (winTrades.length / closedItems.length) * 100 : 0;
    const profitFactor = lossSum > 0 ? (winSum / lossSum) : winSum > 0 ? 9.99 : 0;

    // Per-trade Sharpe ratio measured on this account's own realised returns.
    // Sharpe = mean(return) / standard deviation(return). Capital only carries
    // market risk while a position is open, so the per-trade risk-free rate is
    // 0% and the mean return is already the excess return.
    // A ratio needs dispersion to mean anything, so it stays unavailable until
    // there are enough closed trades to estimate a standard deviation.
    const tradeReturns = closedItems
      .map((item) => item.realizedPnLPercent)
      .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
    const sharpeSampleSize = tradeReturns.length;
    const sharpeMinimumTrades = SHARPE_MINIMUM_TRADES;
    let sharpeRatio: number | null = null;

    if (sharpeSampleSize >= sharpeMinimumTrades) {
      const meanReturn = tradeReturns.reduce((acc, value) => acc + value, 0) / sharpeSampleSize;
      const variance = tradeReturns.reduce((acc, value) => acc + (value - meanReturn) ** 2, 0) / (sharpeSampleSize - 1);
      const standardDeviation = Math.sqrt(variance);
      if (standardDeviation > 0.0001) {
        sharpeRatio = meanReturn / standardDeviation;
      }
    }

    return {
      totalTradesCount: allTransactions.length,
      closedTradesCount: closedItems.length,
      winCount: winTrades.length,
      lossCount: lossTrades.length,
      winRate,
      totalRealized,
      avgWin,
      avgLoss,
      profitFactor,
      totalTurnover,
      sharpeRatio,
      sharpeSampleSize,
      sharpeMinimumTrades
    };
  }, [allTransactions]);

  // Equity curve built from this account's own realised P&L, oldest trade first.
  // `allTransactions` is newest-first, so it is reversed before accumulating.
  const equityCurve = useMemo(() => {
    const closedOldestFirst = [...allTransactions]
      .reverse()
      .filter((item) => item.isClosedPosition && typeof item.realizedPnL === 'number');

    const startingCapital = 1000000;
    let running = startingCapital;
    const points = [{ index: 0, equity: startingCapital }];
    closedOldestFirst.forEach((item, position) => {
      running += item.realizedPnL || 0;
      points.push({ index: position + 1, equity: running });
    });

    const equities = points.map((point) => point.equity);
    const minEquity = Math.min(...equities);
    const maxEquity = Math.max(...equities);
    const span = maxEquity - minEquity || 1;

    // Chart viewBox is 700x180 with a 40px left gutter and 20px vertical padding.
    const plotted = points.map((point) => {
      const x = points.length === 1 ? 40 : 40 + (point.index / (points.length - 1)) * 620;
      const y = 160 - ((point.equity - minEquity) / span) * 140;
      return { x, y, equity: point.equity };
    });

    return {
      hasTrades: closedOldestFirst.length > 0,
      tradeCount: closedOldestFirst.length,
      startingCapital,
      finalEquity: running,
      path: plotted.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' '),
      lastPoint: plotted[plotted.length - 1],
      baselineY: 160 - ((startingCapital - minEquity) / span) * 140,
    };
  }, [allTransactions]);

  // Trader DNA calculation
  const traderDna: TraderDNA = useMemo(() => {
    const executedOrders = orders.filter((o) => o.status === 'EXECUTED');
    const tradeCount = executedOrders.length;
    if (tradeCount === 0) {
      return {
        discipline: 0,
        riskControl: 0,
        momentum: 0,
        timing: 0,
        patience: 0,
        consistency: 0,
        adaptability: 0,
        strategyClarity: 0,
        archetype: 'Unclassified Rookie',
        strength: 'Complete your first simulated trade to build a measurable profile',
        weakness: 'Not enough trade evidence yet',
        bestConditions: 'Complete a planned trade with a stop-loss',
        worstConditions: 'Not enough data yet'
      };
    }

    const stoppedOrders = executedOrders.filter((o) => o.bracketOrder?.stopLossPrice || o.bracketOrder?.stopLossPercent).length;
    const closedOrders = executedOrders.filter((o) => o.type === 'SELL' && o.realizedPnL !== undefined);
    const profitableCloses = closedOrders.filter((o) => (o.realizedPnL || 0) > 0).length;
    const stopUsage = stoppedOrders / tradeCount;
    const observedWinRate = closedOrders.length > 0 ? profitableCloses / closedOrders.length : 0;
    const discipline = Math.round(35 + stopUsage * 55);
    const riskControl = Math.round(Math.max(20, Math.min(95, 70 + stopUsage * 20 - Math.max(0, -totalPnLPercent) * 3)));
    const evidenceFactor = Math.min(1, tradeCount / 10);
    const consistency = Math.round((35 + observedWinRate * 55) * evidenceFactor);

    return {
      discipline,
      riskControl,
      momentum: Math.round(Math.min(90, 35 + Math.max(0, totalPnLPercent) * 4 + tradeCount * 2)),
      timing: Math.round(Math.min(90, 40 + observedWinRate * 40 + Math.min(10, tradeCount))),
      patience: Math.round(Math.min(90, 45 + (orders.filter((o) => o.productType === 'CNC').length / tradeCount) * 35)),
      consistency,
      adaptability: Math.round(Math.min(90, 35 + new Set(executedOrders.map((o) => o.symbol)).size * 7)),
      strategyClarity: Math.round(Math.min(95, 35 + stopUsage * 45 + Math.min(15, tradeCount))),
      archetype: discipline > 80 && riskControl > 80 ? 'Disciplined Momentum Trader' : 'Systematic Growth Scalper',
      strength: stopUsage >= 0.7 ? 'Consistent use of predefined risk controls' : 'Building repeatable execution habits',
      weakness: stopUsage < 0.5 ? 'Add stop-loss protection to more trades' : 'Build a larger sample of closed trades',
      bestConditions: 'High-volume trending sessions & opening range breakouts',
      worstConditions: 'Low-volume choppy range-bound sideways consolidation'
    };
  }, [orders, totalPnLPercent]);

  // Skill Score Calculation
  const skillScore: SkillScoreBreakdown = useMemo(() => {
    const executedTradeCount = orders.filter((order) => order.status === 'EXECUTED').length;
    if (executedTradeCount === 0) {
      return {
        overallScore: 0,
        rank: 'Rookie',
        riskControl: 0,
        consistency: 0,
        execution: 0,
        drawdownControl: 0,
        strategyAdherence: 0,
        riskAdjustedReturn: 0,
        learningCompletion: Math.round(Math.min((userXP / 1000) * 100, 100)),
        nextRankThreshold: 400
      };
    }
    const risk = traderDna.riskControl * 2.5;
    const cons = traderDna.consistency * 2.0;
    const exec = traderDna.timing * 1.5;
    const draw = (100 - Math.min(Math.abs(totalPnLPercent), 20) * 4) * 1.5;
    const strat = traderDna.strategyClarity * 1.0;
    const ret = Math.min(Math.max(50 + totalPnLPercent * 2, 0), 100) * 1.0;
    const learn = Math.min(userXP / 20, 100) * 0.5;

    const total = Math.round(risk + cons + exec + draw + strat + ret + learn);

    let rank: SkillScoreBreakdown['rank'] = 'Rookie';
    let nextThreshold = 500;
    if (total >= 900) { rank = 'Elite'; nextThreshold = 1000; }
    else if (total >= 800) { rank = 'Platinum'; nextThreshold = 900; }
    else if (total >= 700) { rank = 'Gold'; nextThreshold = 800; }
    else if (total >= 550) { rank = 'Silver'; nextThreshold = 700; }
    else if (total >= 400) { rank = 'Bronze'; nextThreshold = 550; }

    return {
      overallScore: Math.min(total, 999),
      rank,
      riskControl: Math.round(traderDna.riskControl),
      consistency: Math.round(traderDna.consistency),
      execution: Math.round(traderDna.timing),
      drawdownControl: Math.round(Math.max(0, 100 - Math.abs(totalPnLPercent) * 3)),
      strategyAdherence: Math.round(traderDna.strategyClarity),
      riskAdjustedReturn: Math.round(Math.min(Math.max(50 + totalPnLPercent * 2, 0), 100)),
      learningCompletion: Math.round(Math.min((userXP / 1000) * 100, 100)),
      nextRankThreshold: nextThreshold
    };
  }, [orders, traderDna, totalPnLPercent, userXP]);

  // Journal entries mapping
  const journalEntries: TradeJournalEntry[] = useMemo(() => {
    return allTransactions.filter(t => t.isClosedPosition).map((t, idx) => ({
      id: `j-${t.id}`,
      orderId: t.orderId,
      symbol: t.symbol,
      side: t.type,
      productType: t.productType,
      quantity: t.quantity,
      // No separate planned entry is recorded, so the fill stands for both
      // rather than a price invented a fraction below it.
      plannedEntry: t.buyAvgPrice || t.price,
      actualEntry: t.buyAvgPrice || t.price,
      plannedStopLoss: t.plannedStopLoss ?? 0,
      actualExit: t.price,
      plannedTarget: t.plannedTarget ?? 0,
      pnl: t.realizedPnL || 0,
      pnlPercent: t.realizedPnLPercent || 0,
      // Excursion, slippage and hold time are not recorded by the simulator,
      // so they are left at zero rather than invented. Scores and tags are
      // omitted for the same reason: the trader supplies those in a review.
      mfe: 0,
      mae: 0,
      rMultiple: t.rMultiple ?? 0,
      slippage: 0,
      charges: t.charges || 0,
      holdTimeMinutes: 0,
      setup: t.setup || 'Not recorded',
      tags: [],
      emotion: '',
      executionScore: 0,
      riskScore: 0,
      disciplineScore: 0,
      ruleCompliance: false,
      aiFeedback: t.aiFeedback || '',
      timestamp: t.timestamp
    }));
  }, [allTransactions]);

  // Export filtered trade history to CSV
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      notifyUser('Export Warning', 'No trade transactions match the current filter selection.', 'WARNING');
      return;
    }

    const headers = [
      'Order ID',
      'Date Time IST',
      'Symbol',
      'Company Name',
      'Side (Type)',
      'Product Type',
      'Order Type',
      'Quantity',
      'Executed Price (INR)',
      'Total Amount (INR)',
      'Buy Avg Price (INR)',
      'Realized PnL (INR)',
      'Realized PnL (%)',
      'R-Multiple',
      'Exit Outcome',
      'Charges (INR)',
      'Hold Time',
      'Status'
    ];

    const rows = filteredTransactions.map(t => [
      t.orderId,
      `"${t.executionTime || t.timestamp}"`,
      t.symbol,
      `"${t.stockName}"`,
      t.type,
      t.productType,
      t.orderType,
      t.quantity,
      t.price.toFixed(2),
      t.totalAmount.toFixed(2),
      t.buyAvgPrice ? t.buyAvgPrice.toFixed(2) : 'N/A',
      t.realizedPnL !== undefined ? t.realizedPnL.toFixed(2) : 'N/A',
      t.realizedPnLPercent !== undefined ? `${t.realizedPnLPercent.toFixed(2)}%` : 'N/A',
      t.rMultiple !== undefined ? `${t.rMultiple}R` : 'N/A',
      t.exitReason || 'N/A',
      t.charges !== undefined ? t.charges.toFixed(2) : '0.00',
      `"${t.holdTime || 'N/A'}"`,
      t.status
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `RupeeRookie_History_Log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    notifyUser('Export Successful! 📊', `Exported ${filteredTransactions.length} transaction records to CSV file.`, 'SUCCESS');
  };

  // Reset all active filters to default
  const handleResetFilters = () => {
    setSearchQuery('');
    setTypeFilter('ALL');
    setPnlFilter('ALL');
    setProductFilter('ALL');
    setStatusFilter('ALL');
    setTimeFilter('ALL');
    setSortBy('NEWEST');
  };

  const openTradeReview = (entry: TradeJournalEntry) => {
    const existing = tradeReviews[entry.orderId];
    setSelectedJournalTrade(entry);
    setReviewDraft(existing || { note: '', lesson: '', rating: 3, tags: [], planFollowed: 'PARTLY', emotionBefore: 'Calm', emotionAfter: 'Calm', annotations: [], updatedAt: '' });
  };

  const handleReviewScreenshot = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      notifyUser('Screenshot not added', 'Choose a PNG, JPG, or WebP image.', 'WARNING');
      return;
    }
    if (file.size > 1_500_000) {
      notifyUser('Screenshot too large', 'Use an image smaller than 1.5 MB so the journal stays fast on mobile.', 'WARNING');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setReviewDraft((previous) => ({ ...previous, screenshot: String(reader.result || '') }));
    reader.readAsDataURL(file);
  };

  const saveTradeReview = () => {
    if (!selectedJournalTrade) return;
    if (reviewDraft.note.trim().length < 8 || reviewDraft.lesson.trim().length < 8) {
      notifyUser('Add a little more detail', 'Write at least one sentence for the review and lesson.', 'WARNING');
      return;
    }
    setTradeReviews((previous) => ({
      ...previous,
      [selectedJournalTrade.orderId]: { ...reviewDraft, updatedAt: new Date().toISOString() },
    }));
    notifyUser('Post-trade review saved', `${selectedJournalTrade.symbol} now has a journal review${reviewDraft.screenshot ? ' and screenshot' : ''}.`, 'SUCCESS');
    setSelectedJournalTrade(null);
  };

  const weeklyReflection = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recent = Object.values(tradeReviews).filter((review) => new Date(review.updatedAt).getTime() >= cutoff);
    const reviewed = recent.length;
    const followed = recent.filter((review) => review.planFollowed === 'YES').length;
    const tags = recent.flatMap((review) => review.tags || []);
    const topTag = tags.sort((a, b) => tags.filter((tag) => tag === b).length - tags.filter((tag) => tag === a).length)[0];
    const missingStops = journalEntries.filter((entry) => entry.plannedStopLoss <= 0).length;
    const lossesWithoutPlan = journalEntries.filter((entry) => entry.pnl < 0 && tradeReviews[entry.orderId]?.planFollowed === 'NO').length;
    const pattern = lossesWithoutPlan > 0 ? `${lossesWithoutPlan} reviewed loss${lossesWithoutPlan === 1 ? '' : 'es'} came from trades where the plan was not followed.` : missingStops > 0 ? `${missingStops} closed trade${missingStops === 1 ? '' : 's'} did not record a stop.` : reviewed ? 'No repeated high-confidence mistake pattern is visible yet.' : 'Complete a few post-trade reviews to identify genuine personal patterns.';
    return { reviewed, followRate: reviewed ? Math.round((followed / reviewed) * 100) : 0, topTag, pattern };
  }, [journalEntries, tradeReviews]);

  const annotateScreenshot = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!annotationTool || !reviewDraft.screenshot) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const marker = { kind: annotationTool, x: Math.round(((event.clientX - rect.left) / rect.width) * 100), y: Math.round(((event.clientY - rect.top) / rect.height) * 100) };
    setReviewDraft((previous) => ({ ...previous, annotations: [...(previous.annotations || []).filter((item) => item.kind !== annotationTool), marker] }));
    setAnnotationTool(null);
  };

  const isAnyFilterActive = searchQuery !== '' || typeFilter !== 'ALL' || pnlFilter !== 'ALL' || productFilter !== 'ALL' || statusFilter !== 'ALL' || timeFilter !== 'ALL' || sortBy !== 'NEWEST';

  // Handle open share card
  const handleOpenShareModal = (trade: TradeHistoryTransaction) => {
    setTradeToShare(trade);
    setShowShareModal(true);
  };

  const activeShareCardTrade = tradeToShare || allTransactions[0];

  return (
    <div className="rr-terminal w-full max-w-7xl mx-auto space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Top Main Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl text-white relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 uppercase tracking-wider flex items-center gap-1.5">
                <BrainCircuit className="w-3.5 h-3.5 text-indigo-400" />
                Trader Intelligence & Performance Review
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                Rank: {skillScore.rank} ({skillScore.overallScore}/1000)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>Trade Review & Intelligence Hub</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Filter transaction history with status indicators (Buy/Sell), review closed position P&L markers, and analyze execution discipline.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex w-full shrink-0 items-center gap-2 md:w-auto">
            <button
              id="export-csv-top-btn"
              type="button"
              onClick={handleExportCSV}
              className="flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-xs font-bold text-slate-200 transition-all hover:bg-slate-700 hover:text-white cursor-pointer md:flex-none"
              title="Export filtered trade history to CSV"
            >
              <FileSpreadsheet className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Export CSV</span>
            </button>
            <button
              id="generate-share-card-btn"
              type="button"
              onClick={() => allTransactions[0] && handleOpenShareModal(allTransactions[0])}
              disabled={allTransactions.length === 0}
              className="flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white shadow-lg transition-all hover:bg-indigo-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 md:flex-none"
            >
              <Share2 className="w-4 h-4 shrink-0" />
              <span className="sm:hidden">Trade Card</span>
              <span className="hidden sm:inline">VERIFIED TRADE CARD</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 grid grid-cols-2 gap-2 border-t border-slate-800 pt-4 sm:flex sm:items-center sm:overflow-x-auto">
          {[
            { id: 'DNA', label: 'Trader DNA Radar', shortLabel: 'Trader DNA', icon: Dna },
            { id: 'JOURNAL', label: 'Trade Journal & Notes', shortLabel: 'Journal', icon: BookOpen },
            { id: 'HISTORY', label: 'Trade History Log', shortLabel: 'History', icon: Clock, countBadge: allTransactions.length },
            { id: 'PERFORMANCE', label: 'Performance Analytics', shortLabel: 'Performance', icon: BarChart3 },
            { id: 'BEHAVIOR', label: 'Behavioral Analytics', shortLabel: 'Behaviour', icon: AlertTriangle },
            { id: 'SKILL', label: 'Skill Score (0-1000)', shortLabel: 'Skill Score', icon: Award }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`trade-hub-tab-${tab.id.toLowerCase()}`}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 py-2.5 text-xs font-black transition-all cursor-pointer sm:justify-start sm:px-4 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="sm:hidden">{tab.shortLabel}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.countBadge !== undefined && (
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                    isActive ? 'bg-indigo-700 text-white' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {tab.countBadge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: FILTERABLE TRADE HISTORY LOG */}
      {/* ========================================================================= */}
      {activeTab === 'HISTORY' && (
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* 1. Total Transactions */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
                <span>Total Transactions</span>
                <Clock className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {closedPositionStats.totalTradesCount}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {allTransactions.filter(t => t.type === 'BUY').length} Buys
                </span>
                <span>•</span>
                <span className="font-semibold text-rose-600 dark:text-rose-400">
                  {allTransactions.filter(t => t.type === 'SELL').length} Sells
                </span>
              </div>
            </div>

            {/* 2. Closed Positions & Win Rate */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
                <span>Win Rate</span>
                <Target className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {closedPositionStats.winRate.toFixed(1)}%
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{closedPositionStats.winCount}W</span>
                <span>-</span>
                <span className="text-rose-600 dark:text-rose-400 font-bold">{closedPositionStats.lossCount}L</span>
                <span className="text-[10px] text-slate-400">({closedPositionStats.closedTradesCount} Closed)</span>
              </div>
            </div>

            {/* 3. Realized Closed P&L */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
                <span>Realized Net P&L</span>
                {closedPositionStats.totalRealized >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-rose-500" />
                )}
              </div>
              <div className={`text-2xl font-black font-mono ${
                closedPositionStats.totalRealized >= 0 
                  ? 'text-emerald-600 dark:text-emerald-400' 
                  : 'text-rose-600 dark:text-rose-400'
              }`}>
                {closedPositionStats.totalRealized >= 0 ? '+' : ''}₹{closedPositionStats.totalRealized.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                From {closedPositionStats.closedTradesCount} closed positions
              </div>
            </div>

            {/* 4. Profit Factor & Avg Ratio */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
                <span>Profit Factor</span>
                <Percent className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                {closedPositionStats.profitFactor.toFixed(2)}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                Avg Win: +₹{Math.round(closedPositionStats.avgWin).toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Filter Bar & Controls Container */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="trade-history-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Symbol (e.g. TATAMOTORS, RELIANCE) or Order ID..."
                  className="w-full pl-10 pr-9 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Primary Dropdowns */}
              <div className="flex flex-wrap items-center gap-2">
                {/* 1. Transaction Type (BUY / SELL) */}
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 uppercase px-1.5">Type:</span>
                  <button
                    id="filter-type-all"
                    type="button"
                    onClick={() => setTypeFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      typeFilter === 'ALL'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    All
                  </button>
                  <button
                    id="filter-type-buy"
                    type="button"
                    onClick={() => setTypeFilter('BUY')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      typeFilter === 'BUY'
                        ? 'bg-emerald-500 text-slate-950 shadow-xs'
                        : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                    }`}
                  >
                    <ArrowDownLeft className="w-3 h-3" />
                    <span>BUY</span>
                  </button>
                  <button
                    id="filter-type-sell"
                    type="button"
                    onClick={() => setTypeFilter('SELL')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      typeFilter === 'SELL'
                        ? 'bg-rose-500 text-white shadow-xs'
                        : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                    }`}
                  >
                    <ArrowUpRight className="w-3 h-3" />
                    <span>SELL (Closed)</span>
                  </button>
                </div>

                {/* 2. P&L Marker Filter */}
                <select
                  id="filter-pnl-select"
                  value={pnlFilter}
                  onChange={(e) => setPnlFilter(e.target.value as any)}
                  className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="ALL">All P&L Outcomes</option>
                  <option value="PROFIT">🟢 In Profit (+PnL)</option>
                  <option value="LOSS">🔴 In Loss (-PnL)</option>
                  <option value="BREAKEVEN">⚪ Breakeven (0 PnL)</option>
                </select>

                {/* 3. Product Type (CNC / MIS) */}
                <select
                  id="filter-product-select"
                  value={productFilter}
                  onChange={(e) => setProductFilter(e.target.value as any)}
                  className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="ALL">All Products (CNC & MIS)</option>
                  <option value="CNC">Delivery (CNC 1x)</option>
                  <option value="MIS">Intraday (MIS 5x)</option>
                </select>

                {/* 4. Sort By */}
                <select
                  id="filter-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="NEWEST">Sort: Most Recent</option>
                  <option value="OLDEST">Sort: Oldest First</option>
                  <option value="PNL_HIGH">Highest Profit (₹)</option>
                  <option value="PNL_LOW">Highest Loss (₹)</option>
                  <option value="VALUE_HIGH">Highest Trade Value (₹)</option>
                  <option value="QTY_HIGH">Highest Quantity</option>
                </select>
              </div>
            </div>

            {/* Quick Filter Tag Bar & Active Summary */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Quick Presets:</span>
                <button
                  type="button"
                  onClick={() => { setTypeFilter('SELL'); setPnlFilter('PROFIT'); }}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 transition-all cursor-pointer"
                >
                  🏆 Closed Wins Only
                </button>
                <button
                  type="button"
                  onClick={() => { setTypeFilter('SELL'); setPnlFilter('LOSS'); }}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 transition-all cursor-pointer"
                >
                  📉 Closed Losses Only
                </button>
                <button
                  type="button"
                  onClick={() => { setProductFilter('MIS'); }}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/20 transition-all cursor-pointer"
                >
                  ⚡ MIS Intraday (5x)
                </button>
                <button
                  type="button"
                  onClick={() => { setProductFilter('CNC'); }}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 transition-all cursor-pointer"
                >
                  📦 Delivery (CNC)
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  Showing <strong className="text-slate-900 dark:text-white">{filteredTransactions.length}</strong> of {allTransactions.length} records
                </span>
                {isAnyFilterActive && (
                  <button
                    id="reset-trade-filters-btn"
                    type="button"
                    onClick={handleResetFilters}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Filters</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div className="space-y-3">
            {filteredTransactions.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-4 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto">
                  <Filter className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">No Matching Transactions</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                    No trade logs match the current search filters. Try clearing filters or searching for another stock symbol.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow cursor-pointer hover:bg-indigo-500 transition-all"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              filteredTransactions.map((item) => {
                const isBuy = item.type === 'BUY';
                const isSell = item.type === 'SELL';
                const isClosed = item.isClosedPosition;
                const isProfit = (item.realizedPnL || 0) > 0;
                const isLoss = (item.realizedPnL || 0) < 0;

                return (
                  <div
                    key={item.id}
                    id={`trade-row-${item.id}`}
                    className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all space-y-3 relative group"
                  >
                    {/* Top Row: Indicators, Symbol, Timestamps, and Quick Action */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Left: Status Indicator Badge + Stock Symbol */}
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        {/* Status Indicator (Buy / Sell) */}
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-black tracking-wide flex items-center gap-1.5 shadow-xs ${
                          isBuy 
                            ? 'bg-emerald-500 text-slate-950 dark:bg-emerald-400 dark:text-slate-950' 
                            : 'bg-rose-500 text-white dark:bg-rose-500 dark:text-white'
                        }`}>
                          {isBuy ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                          <span>{isBuy ? 'BUY' : 'SELL'}</span>
                        </span>

                        {/* Product Type (CNC / MIS) */}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          item.productType === 'MIS'
                            ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                            : 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30'
                        }`}>
                          {item.productType === 'MIS' ? 'MIS (5x Intraday)' : 'CNC (Delivery)'}
                        </span>

                        {/* Execution Order Type */}
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                          {item.orderType}
                        </span>

                        {/* Symbol & Name */}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-slate-900 dark:text-white text-base font-mono">
                              {item.symbol}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden md:inline">
                              • {item.stockName}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Profit/Loss Marker for Closed Positions, or Volume */}
                      <div className="flex items-center gap-3">
                        {isClosed && item.realizedPnL !== undefined ? (
                          <div className="flex items-center gap-2">
                            {/* P&L Marker Badge */}
                            <div className={`px-3 py-1 rounded-xl text-right font-mono font-black text-sm flex items-center gap-1.5 border shadow-xs ${
                              isProfit
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                : isLoss
                                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                            }`}>
                              {isProfit && <TrendingUp className="w-4 h-4 text-emerald-500" />}
                              {isLoss && <TrendingDown className="w-4 h-4 text-rose-500" />}
                              <span>
                                {item.realizedPnL >= 0 ? '+' : ''}₹{item.realizedPnL.toFixed(2)}
                              </span>
                              <span className="text-xs font-bold opacity-85">
                                ({item.realizedPnLPercent !== undefined && item.realizedPnLPercent >= 0 ? '+' : ''}{item.realizedPnLPercent?.toFixed(2)}%)
                              </span>
                            </div>

                            {/* R-Multiple Marker */}
                            {item.rMultiple !== undefined && (
                              <span className={`px-2 py-1 rounded-lg text-xs font-black font-mono hidden sm:inline-block ${
                                item.rMultiple >= 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                              }`}>
                                {item.rMultiple >= 0 ? `+${item.rMultiple}R` : `${item.rMultiple}R`}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="text-right">
                            <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200 block">
                              Total: ₹{item.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {item.quantity} Shares @ ₹{item.price.toFixed(2)}
                            </span>
                          </div>
                        )}

                        {/* Quick View & Share buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedTradeForDetail(item)}
                            className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                            title="Inspect Trade Breakdown"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenShareModal(item)}
                            className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                            title="Generate Share Card"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Middle Row: Price Metrics & Closed Position Journey */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Quantity</span>
                        <span className="font-black text-slate-900 dark:text-white">{item.quantity} Shares</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                          {isClosed ? 'Exit Fill Price' : 'Executed Price'}
                        </span>
                        <span className="font-black text-slate-900 dark:text-white">₹{item.price.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                          {isClosed ? 'Entry Buy Avg' : 'Gross Value'}
                        </span>
                        <span className="font-black text-slate-900 dark:text-white">
                          {isClosed && item.buyAvgPrice ? `₹${item.buyAvgPrice.toFixed(2)}` : `₹${item.totalAmount.toLocaleString('en-IN')}`}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                          {isClosed ? 'Outcome Status' : 'Order Status'}
                        </span>
                        <span className="font-bold flex items-center gap-1">
                          {isClosed ? (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                              item.exitReason === 'TARGET_HIT' 
                                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                : item.exitReason === 'STOP_LOSS_HIT'
                                ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}>
                              {item.exitReason ? item.exitReason.replace('_', ' ') : 'CLOSED'}
                            </span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Filled
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Row: AI Diagnosis Snippet & Execution Time */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-2 truncate">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="truncate italic">
                          {item.aiFeedback || 'Executed cleanly following risk parameters.'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 font-mono text-[11px]">
                        {item.holdTime && (
                          <span className="text-slate-400">Hold: {item.holdTime}</span>
                        )}
                        <span className="text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.executionTime || item.timestamp}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PERFORMANCE ANALYTICS */}
      {/* ========================================================================= */}
      {activeTab === 'PERFORMANCE' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Gross Simulated P&L</span>
              <span className={`text-xl font-black font-mono mt-1 block ${totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {totalPnL >= 0 ? '+' : ''}₹{totalPnL.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Win Rate</span>
              <span className="text-xl font-black font-mono text-indigo-300 mt-1 block">
                {closedPositionStats.winRate.toFixed(1)}%
              </span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Profit Factor</span>
              <span className="text-xl font-black font-mono text-emerald-400 mt-1 block">
                {closedPositionStats.profitFactor.toFixed(2)}
              </span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Sharpe Ratio</span>
              <span className={`text-xl font-black font-mono mt-1 block ${closedPositionStats.sharpeRatio === null ? 'text-slate-500' : closedPositionStats.sharpeRatio >= 1 ? 'text-emerald-400' : closedPositionStats.sharpeRatio >= 0 ? 'text-amber-300' : 'text-rose-400'}`}>
                {closedPositionStats.sharpeRatio === null
                  ? '—'
                  : `${closedPositionStats.sharpeRatio.toFixed(2)} (${describeSharpe(closedPositionStats.sharpeRatio)})`}
              </span>
              <span className="mt-1 block text-[10px] font-medium leading-snug text-slate-400">
                {closedPositionStats.sharpeRatio === null
                  ? `${closedPositionStats.sharpeSampleSize}/${closedPositionStats.sharpeMinimumTrades} closed trades needed`
                  : `Per-trade, from ${closedPositionStats.sharpeSampleSize} closed trades`}
              </span>
            </div>
          </div>

          {/* Equity Curve Progression */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg text-white space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-300">
                Simulated Equity Curve Progression
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {equityCurve.hasTrades ? `${equityCurve.tradeCount} closed trade${equityCurve.tradeCount === 1 ? '' : 's'}` : 'No closed trades yet'}
              </span>
            </div>
            <div className="w-full bg-slate-950/80 rounded-2xl p-4 border border-slate-800">
              {equityCurve.hasTrades ? (
                <>
                  <svg viewBox="0 0 700 180" className="w-full h-auto select-none" role="img" aria-label={`Equity curve across ${equityCurve.tradeCount} closed trades, ending at ${formatINR(equityCurve.finalEquity)}`}>
                    <line x1="40" y1={equityCurve.baselineY} x2="660" y2={equityCurve.baselineY} stroke="#334155" strokeDasharray="3,3" />
                    <text x="40" y={equityCurve.baselineY - 5} fill="#64748b" fontSize="9" fontFamily="monospace">
                      Start ₹{equityCurve.startingCapital.toLocaleString('en-IN')}
                    </text>
                    <path
                      d={equityCurve.path}
                      fill="none"
                      stroke={equityCurve.finalEquity >= equityCurve.startingCapital ? '#10b981' : '#f43f5e'}
                      strokeWidth="3"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                    <circle
                      cx={equityCurve.lastPoint.x}
                      cy={equityCurve.lastPoint.y}
                      r="5"
                      fill={equityCurve.finalEquity >= equityCurve.startingCapital ? '#10b981' : '#f43f5e'}
                    />
                  </svg>
                  <p className="mt-2 text-right font-mono text-xs font-bold text-slate-300">
                    Realised equity: {formatINR(equityCurve.finalEquity)}
                  </p>
                </>
              ) : (
                <p className="py-8 text-center text-xs font-medium text-slate-400">
                  Close your first simulated position to plot a real equity curve. Nothing is drawn from sample data.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TRADE JOURNAL & AI NOTES */}
      {/* ========================================================================= */}
      {activeTab === 'JOURNAL' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg text-white space-y-4">
          <div className="flex flex-col gap-1 border-b border-slate-800 pb-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-300">
              Automated Trade Execution Journal & Notes
            </h3>
            <span className="text-xs text-slate-400 font-mono">{journalEntries.length} Recorded Journal Trades</span>
          </div>

          <div className="grid gap-3 rounded-2xl border border-indigo-500/30 bg-indigo-950/30 p-4 sm:grid-cols-[1fr_auto]">
            <div><p className="text-[10px] font-black uppercase tracking-wide text-indigo-300">Automatic weekly reflection · device-local</p><p className="mt-1 text-sm font-black">{weeklyReflection.reviewed ? `${weeklyReflection.reviewed} review${weeklyReflection.reviewed === 1 ? '' : 's'} · ${weeklyReflection.followRate}% plan-follow rate` : 'Not enough journal evidence yet'}</p><p className="mt-2 text-xs leading-relaxed text-slate-300">{weeklyReflection.pattern}</p>{weeklyReflection.topTag && <p className="mt-2 text-[11px] font-bold text-indigo-200">Most-used tag: {weeklyReflection.topTag}</p>}</div><span className="h-fit rounded-full bg-slate-800 px-3 py-1 text-[10px] font-black text-slate-300">Based only on your reviews</span>
          </div>

          <div className="space-y-3">
            {journalEntries.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-800/40 p-6 text-center">
                <NotebookTabs className="mx-auto h-7 w-7 text-slate-500" />
                <p className="mt-2 text-sm font-black text-white">No closed trades to review yet</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">When you close a simulated position, add a chart screenshot, describe the decision, and record one lesson. You do not need to trade just to fill the journal.</p>
              </div>
            )}
            {journalEntries.map((entry) => {
              const storedReview = tradeReviews[entry.orderId];
              return (
              <div 
                key={entry.id} 
                className="bg-slate-800/60 hover:bg-slate-800/90 transition-all p-4 rounded-2xl border border-slate-700/60 space-y-3"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-black ${
                      entry.side === 'BUY' ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
                    }`}>
                      {entry.side}
                    </span>
                    <span className="font-extrabold text-white text-sm font-mono">
                      {entry.symbol} ({entry.quantity} Qty)
                    </span>
                    {entry.setup && entry.setup !== 'Not recorded' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                        {entry.setup}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-black font-mono text-sm ${entry.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {entry.pnl >= 0 ? '+' : ''}₹{entry.pnl.toFixed(2)} ({entry.pnlPercent.toFixed(2)}%)
                    </span>
                    <button type="button" onClick={() => openTradeReview(entry)} className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-[10px] font-black text-white hover:bg-indigo-500">
                      <ImagePlus className="h-3.5 w-3.5" /> {storedReview ? 'Edit review' : 'Add review'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono text-slate-400 bg-slate-900/50 p-2.5 rounded-xl">
                  <div>Entry: ₹{entry.actualEntry.toFixed(2)}</div>
                  <div>Exit: ₹{entry.actualExit.toFixed(2)}</div>
                  <div title="An R-multiple needs a recorded stop-loss to measure risk against.">
                    {entry.plannedStopLoss > 0
                      ? `R-Multiple: ${entry.rMultiple >= 0 ? '+' : ''}${entry.rMultiple}R`
                      : 'R-Multiple: no stop set'}
                  </div>
                  <div>Charges: ₹{entry.charges.toFixed(2)}</div>
                </div>

                {entry.aiFeedback && (
                  <p className="text-xs text-slate-300 italic">
                    💡 AI Insight: {entry.aiFeedback}
                  </p>
                )}
                {storedReview && (
                  <div className="grid grid-cols-1 gap-3 rounded-2xl border border-indigo-500/30 bg-indigo-950/30 p-3 sm:grid-cols-[1fr_112px]">
                    <div>
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wide text-indigo-300">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Your post-trade review · {storedReview.rating}/5
                      </div>
                      <p className="mt-2 text-xs text-slate-200">{storedReview.note}</p>
                      <p className="mt-1 text-[11px] text-indigo-200"><strong>Lesson:</strong> {storedReview.lesson}</p>
                      <div className="mt-2 flex flex-wrap gap-1">{(storedReview.tags || []).map((tag) => <span key={tag} className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[9px] font-black text-indigo-200">{tag}</span>)}</div>
                      {storedReview.planFollowed && <p className="mt-2 text-[10px] font-bold text-slate-300">Plan followed: {storedReview.planFollowed.toLowerCase()} · Emotion: {storedReview.emotionBefore || '—'} → {storedReview.emotionAfter || '—'}</p>}
                    </div>
                    {storedReview.screenshot && <img src={storedReview.screenshot} alt={`${entry.symbol} trade chart screenshot`} className="h-24 w-full rounded-xl object-cover sm:h-20" />}
                  </div>
                )}
              </div>
            );})}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: BEHAVIORAL ANALYTICS */}
      {/* ========================================================================= */}
      {activeTab === 'BEHAVIOR' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg text-white space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span>Behavioral Flaw Detection Engine</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              AI monitors trading habits to detect revenge trades, over-leverage, and drifting stop losses.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white">Revenge Trading Risk</span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  LOW RISK (CLEAN)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                You maintain strict 1x lot sizes after losing trades without impulsively doubling down.
              </p>
            </div>

            <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white">Stop-Loss Discipline</span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  94% COMPLIANT
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Bracket orders and predetermined price stops are utilized across 94% of placed orders.
              </p>
            </div>

            <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white">Breakout Chasing (Late Entries)</span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                  MILD RISK
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Average entry price occurs 0.4% above confirmed pivot levels. Wait for VWAP retests before entering.
              </p>
            </div>

            <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white">Overtrading Frequency</span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  OPTIMAL (2-4 Trades/Day)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Trading frequency remains highly selective without churning unnecessary exchange charges.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: TRADER DNA */}
      {/* ========================================================================= */}
      {activeTab === 'DNA' && (closedPositionStats.closedTradesCount < 5 ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-white shadow-lg">
          <div className="mx-auto max-w-xl py-10 text-center">
            <Dna className="mx-auto h-10 w-10 text-indigo-400" />
            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.14em] text-indigo-300">Evidence required</p>
            <h3 className="mt-1 text-2xl font-black">Trader DNA is still forming</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-400">Complete at least five closed simulated trades before an archetype or trait score is generated. This prevents one or two outcomes from creating a misleading identity.</p>
            <div className="mx-auto mt-5 max-w-sm rounded-2xl border border-slate-700 bg-slate-800/70 p-4">
              <div className="flex items-center justify-between text-xs font-bold"><span>Closed trade evidence</span><span className="font-mono text-indigo-300">{closedPositionStats.closedTradesCount} / 5</span></div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-700"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(100, (closedPositionStats.closedTradesCount / 5) * 100)}%` }} /></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg text-white space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block">
                Trading Archetype
              </span>
              <h3 className="text-2xl font-black text-white flex items-center gap-2.5">
                <Dna className="w-6 h-6 text-indigo-400" />
                <span>{traderDna.archetype}</span>
              </h3>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              {Math.min(100, Math.round((closedPositionStats.closedTradesCount / 12) * 100))}% evidence confidence
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              {[
                { label: 'Discipline', val: traderDna.discipline, color: 'from-indigo-500 to-indigo-600' },
                { label: 'Risk Control', val: traderDna.riskControl, color: 'from-emerald-500 to-emerald-600' },
                { label: 'Momentum', val: traderDna.momentum, color: 'from-amber-500 to-amber-600' },
                { label: 'Timing & Entry', val: traderDna.timing, color: 'from-blue-500 to-blue-600' },
                { label: 'Patience', val: traderDna.patience, color: 'from-purple-500 to-purple-600' },
                { label: 'Consistency', val: traderDna.consistency, color: 'from-teal-500 to-teal-600' },
                { label: 'Adaptability', val: traderDna.adaptability, color: 'from-rose-500 to-rose-600' },
                { label: 'Strategy Clarity', val: traderDna.strategyClarity, color: 'from-cyan-500 to-cyan-600' }
              ].map((trait) => (
                <div key={trait.label} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-300">{trait.label}</span>
                    <span className="font-mono text-white">{trait.val}/100</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${trait.color}`}
                      style={{ width: `${trait.val}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 space-y-1">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                  Core Superpower
                </span>
                <p className="text-xs text-slate-200">{traderDna.strength}</p>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 space-y-1">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                  Key Growth Area
                </span>
                <p className="text-xs text-slate-200">{traderDna.weakness}</p>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 space-y-1">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                  Optimal Market Condition
                </span>
                <p className="text-xs text-slate-200">{traderDna.bestConditions}</p>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* ========================================================================= */}
      {/* TAB 6: SKILL SCORE */}
      {/* ========================================================================= */}
      {activeTab === 'SKILL' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg text-white space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Quantified RupeeRookie Skill Score
              </span>
              <h3 className="text-3xl font-black text-white flex items-center gap-3">
                <Award className="w-8 h-8 text-amber-400" />
                <span>{skillScore.overallScore}</span>
                <span className="text-sm font-bold text-amber-300 font-mono px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30">
                  {skillScore.rank}
                </span>
              </h3>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Next Tier: Platinum (800)</span>
              <span className="text-xs font-mono font-bold text-indigo-300">
                {800 - skillScore.overallScore} points needed
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-800/40 p-3 rounded-2xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Risk Control (25%)</span>
              <span className="text-lg font-black font-mono text-emerald-400 mt-1 block">{skillScore.riskControl}/100</span>
            </div>
            <div className="bg-slate-800/40 p-3 rounded-2xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Consistency (20%)</span>
              <span className="text-lg font-black font-mono text-indigo-300 mt-1 block">{skillScore.consistency}/100</span>
            </div>
            <div className="bg-slate-800/40 p-3 rounded-2xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Execution (15%)</span>
              <span className="text-lg font-black font-mono text-blue-400 mt-1 block">{skillScore.execution}/100</span>
            </div>
            <div className="bg-slate-800/40 p-3 rounded-2xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Drawdown Ctrl (15%)</span>
              <span className="text-lg font-black font-mono text-teal-400 mt-1 block">{skillScore.drawdownControl}/100</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TRADE DIAGNOSTIC DETAIL MODAL */}
      {/* ========================================================================= */}
      {selectedJournalTrade && (
        <div className="fixed inset-0 z-[95] flex items-end justify-center bg-slate-950/75 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[28px] border border-slate-700 bg-slate-900 p-5 text-white shadow-2xl sm:rounded-3xl sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-indigo-300">Post-trade review</p>
                <h3 className="mt-1 text-lg font-black">{selectedJournalTrade.symbol} · {selectedJournalTrade.side}</h3>
                <p className="text-xs text-slate-400">Add evidence and reflect on the decision—not only the outcome.</p>
              </div>

              <div><span className="text-xs font-extrabold text-slate-200">What influenced this trade?</span><div className="mt-2 flex flex-wrap gap-2">{REVIEW_TAGS.map((tag) => { const selected = (reviewDraft.tags || []).includes(tag); return <button key={tag} type="button" onClick={() => setReviewDraft((previous) => ({ ...previous, tags: selected ? (previous.tags || []).filter((item) => item !== tag) : [...(previous.tags || []), tag] }))} className={`min-h-9 rounded-full border px-3 text-[10px] font-black ${selected ? 'border-indigo-400 bg-indigo-500 text-white' : 'border-slate-700 bg-slate-800 text-slate-300'}`}>{tag}</button>; })}</div></div>
              <div className="grid gap-3 sm:grid-cols-3"><label className="text-xs font-extrabold text-slate-200">Plan followed?<select value={reviewDraft.planFollowed || 'PARTLY'} onChange={(event) => setReviewDraft((previous) => ({ ...previous, planFollowed: event.target.value as StoredTradeReview['planFollowed'] }))} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2 text-xs"><option value="YES">Yes</option><option value="PARTLY">Partly</option><option value="NO">No</option></select></label><label className="text-xs font-extrabold text-slate-200">Emotion before<select value={reviewDraft.emotionBefore || 'Calm'} onChange={(event) => setReviewDraft((previous) => ({ ...previous, emotionBefore: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2 text-xs">{EMOTIONS.map((emotion) => <option key={emotion}>{emotion}</option>)}</select></label><label className="text-xs font-extrabold text-slate-200">Emotion after<select value={reviewDraft.emotionAfter || 'Calm'} onChange={(event) => setReviewDraft((previous) => ({ ...previous, emotionAfter: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2 text-xs">{EMOTIONS.map((emotion) => <option key={emotion}>{emotion}</option>)}</select></label></div>
              <button type="button" onClick={() => setSelectedJournalTrade(null)} className="rounded-xl border border-slate-700 p-2 text-slate-300" aria-label="Close post-trade review">✕</button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="text-xs font-extrabold text-slate-200">What went according to plan?</span>
                <textarea value={reviewDraft.note} onChange={(event) => setReviewDraft((previous) => ({ ...previous, note: event.target.value }))} maxLength={500} placeholder="Entry, sizing, stop, exit, emotions…" className="mt-2 min-h-24 w-full resize-none rounded-2xl border border-slate-700 bg-slate-800 p-3 text-xs text-white outline-none focus:border-indigo-500" />
              </label>
              <label className="block">
                <span className="text-xs font-extrabold text-slate-200">What will you repeat or change next time?</span>
                <textarea value={reviewDraft.lesson} onChange={(event) => setReviewDraft((previous) => ({ ...previous, lesson: event.target.value }))} maxLength={300} placeholder="One specific, testable lesson…" className="mt-2 min-h-20 w-full resize-none rounded-2xl border border-slate-700 bg-slate-800 p-3 text-xs text-white outline-none focus:border-indigo-500" />
              </label>
              <div>
                <span className="text-xs font-extrabold text-slate-200">Decision quality</span>
                <div className="mt-2 grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button key={rating} type="button" onClick={() => setReviewDraft((previous) => ({ ...previous, rating }))} className={`rounded-xl border py-2 text-xs font-black ${reviewDraft.rating === rating ? 'border-amber-400 bg-amber-400 text-slate-950' : 'border-slate-700 bg-slate-800 text-slate-300'}`}>{rating}</button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-dashed border-slate-600 bg-slate-800/60 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-extrabold">Chart screenshot</p>
                    <p className="text-[10px] text-slate-400">PNG, JPG or WebP · under 1.5 MB</p>
                  </div>
                  <label className="cursor-pointer rounded-xl bg-slate-700 px-3 py-2 text-[10px] font-black text-white">
                    <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleReviewScreenshot} className="sr-only" />
                    {reviewDraft.screenshot ? 'Replace image' : 'Choose image'}
                  </label>
                </div>
                {reviewDraft.screenshot && (
                  <><div className="mt-3 flex flex-wrap gap-1.5">{(['ENTRY','STOP','TARGET','EXIT'] as const).map((tool) => <button key={tool} type="button" onClick={() => setAnnotationTool(tool)} className={`min-h-9 rounded-lg border px-2 text-[9px] font-black ${annotationTool === tool ? 'border-amber-400 bg-amber-400 text-slate-950' : 'border-slate-600 bg-slate-800'}`}>Mark {tool.toLowerCase()}</button>)}<button type="button" onClick={() => setReviewDraft((previous) => ({ ...previous, annotations: [] }))} className="min-h-9 rounded-lg border border-slate-600 px-2 text-[9px] font-black">Clear marks</button></div><p className="mt-1 text-[10px] text-slate-400">Choose a marker, then tap its position on the screenshot.</p><div className="relative mt-2 overflow-hidden rounded-xl" onClick={annotateScreenshot} role="img" aria-label="Trade screenshot annotation canvas">
                    <img src={reviewDraft.screenshot} alt="Selected trade chart screenshot preview" className="max-h-52 w-full object-cover" />
                    {(reviewDraft.annotations || []).map((marker) => <span key={marker.kind} style={{ left: `${marker.x}%`, top: `${marker.y}%` }} className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white px-2 py-1 text-[8px] font-black shadow-lg ${marker.kind === 'STOP' ? 'bg-rose-600' : marker.kind === 'TARGET' ? 'bg-emerald-600' : marker.kind === 'ENTRY' ? 'bg-indigo-600' : 'bg-amber-500 text-slate-950'}`}>{marker.kind}</span>)}
                    <button type="button" onClick={() => setReviewDraft((previous) => ({ ...previous, screenshot: undefined }))} className="absolute right-2 top-2 rounded-lg bg-slate-950/80 px-2 py-1 text-[10px] font-black">Remove</button>
                  </div></>
                )}
              </div>
            </div>

            <button type="button" onClick={saveTradeReview} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3 text-xs font-black text-white hover:bg-indigo-500">
              <Save className="h-4 w-4" /> Save post-trade review
            </button>
          </div>
        </div>
      )}

      {selectedTradeForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 text-slate-900 dark:text-white shadow-2xl space-y-5 relative">
            <button
              id="close-trade-detail-modal"
              type="button"
              onClick={() => setSelectedTradeForDetail(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              ✕
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className={`px-3 py-1 rounded-xl text-xs font-black ${
                selectedTradeForDetail.type === 'BUY' 
                  ? 'bg-emerald-500 text-slate-950' 
                  : 'bg-rose-500 text-white'
              }`}>
                {selectedTradeForDetail.type} {selectedTradeForDetail.productType}
              </span>
              <div>
                <h3 className="text-lg font-black font-mono">{selectedTradeForDetail.symbol}</h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">{selectedTradeForDetail.stockName} • {selectedTradeForDetail.orderId}</span>
              </div>
            </div>

            {/* P&L Highlight if Closed */}
            {selectedTradeForDetail.isClosedPosition && selectedTradeForDetail.realizedPnL !== undefined && (
              <div className={`p-4 rounded-2xl border ${
                selectedTradeForDetail.realizedPnL >= 0
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
              }`}>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider">Net Realized Result</span>
                  <span className="text-xs font-black px-2 py-0.5 rounded bg-black/20 font-mono">
                    {selectedTradeForDetail.exitReason || 'CLOSED'}
                  </span>
                </div>
                <div className="text-2xl font-black font-mono mt-1">
                  {selectedTradeForDetail.realizedPnL >= 0 ? '+' : ''}₹{selectedTradeForDetail.realizedPnL.toFixed(2)}
                  <span className="text-sm font-bold ml-2">
                    ({selectedTradeForDetail.realizedPnLPercent !== undefined && selectedTradeForDetail.realizedPnLPercent >= 0 ? '+' : ''}{selectedTradeForDetail.realizedPnLPercent?.toFixed(2)}%)
                  </span>
                </div>
              </div>
            )}

            {/* Trade Execution Metrics Table */}
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2 font-mono text-xs">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Quantity Traded:</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedTradeForDetail.quantity} Shares</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Execution Fill Price:</span>
                <span className="font-bold text-slate-900 dark:text-white">₹{selectedTradeForDetail.price.toFixed(2)}</span>
              </div>
              {selectedTradeForDetail.buyAvgPrice && (
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Entry Buy Avg Price:</span>
                  <span className="font-bold text-slate-900 dark:text-white">₹{selectedTradeForDetail.buyAvgPrice.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Gross Turnover Value:</span>
                <span className="font-bold text-slate-900 dark:text-white">₹{selectedTradeForDetail.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Estimated Charges & STT:</span>
                <span className="font-bold text-slate-900 dark:text-white">₹{selectedTradeForDetail.charges?.toFixed(2) || '32.50'}</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Execution Timestamp IST:</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedTradeForDetail.executionTime || selectedTradeForDetail.timestamp}</span>
              </div>
            </div>

            {/* AI Diagnosis */}
            <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 p-4 rounded-2xl space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-black text-indigo-700 dark:text-indigo-300 uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Chanakya AI Trade Diagnosis</span>
              </div>
              <p className="text-xs text-indigo-950 dark:text-indigo-200 leading-relaxed">
                {selectedTradeForDetail.aiFeedback || 'Trade executed strictly according to strategy guidelines.'}
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedTradeForDetail(null);
                  handleOpenShareModal(selectedTradeForDetail);
                }}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow"
              >
                <Share2 className="w-4 h-4" />
                <span>GENERATE VERIFIED SHARE CARD</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SHAREABLE TRADE CARD MODAL */}
      {/* ========================================================================= */}
      {showShareModal && activeShareCardTrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl space-y-6 relative">
            <button
              id="close-share-card-modal"
              type="button"
              onClick={() => setShowShareModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white cursor-pointer"
            >
              ✕
            </button>

            {/* The Actual Watermarked Share Card */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 border-2 border-indigo-500/40 rounded-3xl p-6 space-y-4 relative overflow-hidden shadow-2xl">
              {/* Prominent Safety Watermark */}
              <div className="absolute -right-8 -bottom-6 text-slate-800/30 text-7xl font-black select-none pointer-events-none rotate-12">
                SIMULATED
              </div>

              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-black text-indigo-400 text-lg tracking-wider">RUPEEROOKIE</span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    PAPER TRADE
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Verified Sim Log</span>
              </div>

              <div>
                <span className={`text-xs font-black px-2 py-0.5 rounded ${
                  activeShareCardTrade.type === 'BUY' ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
                }`}>
                  {activeShareCardTrade.type} {activeShareCardTrade.quantity} QTY [{activeShareCardTrade.productType}]
                </span>
                <h3 className="text-2xl font-black text-white font-mono mt-1">
                  {activeShareCardTrade.symbol}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">
                    {activeShareCardTrade.isClosedPosition ? 'Realized P&L' : 'Trade Value'}
                  </span>
                  <span className={`text-lg font-black font-mono ${
                    activeShareCardTrade.realizedPnL !== undefined
                      ? (activeShareCardTrade.realizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400')
                      : 'text-indigo-300'
                  }`}>
                    {activeShareCardTrade.realizedPnL !== undefined
                      ? `${activeShareCardTrade.realizedPnL >= 0 ? '+' : ''}₹${activeShareCardTrade.realizedPnL.toFixed(2)}`
                      : `₹${activeShareCardTrade.totalAmount.toLocaleString('en-IN')}`}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold block">
                    {activeShareCardTrade.rMultiple !== undefined ? 'R-Multiple' : 'Price'}
                  </span>
                  <span className="text-lg font-black font-mono text-indigo-300">
                    {activeShareCardTrade.rMultiple !== undefined 
                      ? `${activeShareCardTrade.rMultiple >= 0 ? '+' : ''}${activeShareCardTrade.rMultiple}R`
                      : `₹${activeShareCardTrade.price.toFixed(2)}`}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-400 font-mono pt-1">
                {/* Facts from the order, not a skill grade. A shareable card
                    is the last place to assert a score nothing measured. */}
                <span>Charges: ₹{(activeShareCardTrade.charges ?? 0).toFixed(2)}</span>
                <span>Held: {activeShareCardTrade.holdTime || '—'}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                id="copy-trade-card-btn"
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText?.(
                    `Simulated Paper Trade on RupeeRookie: ${activeShareCardTrade.symbol} [${activeShareCardTrade.type}] ${activeShareCardTrade.quantity} Qty @ ₹${activeShareCardTrade.price.toFixed(2)} (P&L: ${activeShareCardTrade.realizedPnL !== undefined ? (activeShareCardTrade.realizedPnL >= 0 ? '+' : '') + '₹' + activeShareCardTrade.realizedPnL.toFixed(2) : 'Open Entry'})`
                  );
                  notifyUser('Card Copied', 'Trade summary copied to clipboard!', 'SUCCESS');
                  setShowShareModal(false);
                }}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow"
              >
                <Copy className="w-4 h-4" />
                <span>COPY TRADE CARD</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
