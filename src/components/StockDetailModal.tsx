import React, { useState, useEffect, useMemo } from 'react';
import { quoteLabel } from '../utils/quoteState';
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  Star, Calendar, Coins, 
  ShieldCheck, 
  AlertTriangle, 
  Zap, 
  Sparkles, 
  Activity, 
  Layers, 
  Info, 
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Bell,
  PieChart as PieIcon,
  SlidersHorizontal,
  ChevronRight,
  ExternalLink,
  BarChart3,
  Compass,
  Gauge,
  LineChart as LineChartIcon,
  Calculator,
  Target,
  ShieldAlert,
  Percent,
  Clock,
  Save
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  ComposedChart,
  Area, 
  Line,
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  BarChart, 
  Bar,
  ReferenceLine
} from 'recharts';
import { StockDetail, ProductType, BracketOrderParams } from '../types';
import { useSimulator } from '../context/SimulatorContext';
import { getStockWithTechnicals } from '../data/indianCompanies';
import { calculateDuPontAnalysis } from '../utils/technicalCalculator';
import { formatINR, formatPercent, formatIndianShort, formatNumberIndian } from '../utils/formatters';
import { playOrderFilledSound, playStopLossTriggeredSound } from '../utils/soundEffects';

interface StockDetailModalProps {
  stock: StockDetail | null;
  onClose: () => void;
  onOpenChanakyaWithContext?: (stock: StockDetail) => void;
}

export const StockDetailModal: React.FC<StockDetailModalProps> = ({ 
  stock, 
  onClose,
  onOpenChanakyaWithContext 
}) => {
  const { 
    currentUser,
    cashBalance, 
    portfolioValue,
    holdings, 
    orders,
    executeBuyOrder, 
    executeSellOrder, 
    watchlist, 
    toggleWatchlist,
    alerts,
    addAlert,
    removeAlert,
    nseMarketInfo,
    marketHoursMode,
    setMarketHoursMode,
  } = useSimulator();

  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | '6M' | '1Y' | '3Y' | '5Y' | 'MAX'>('1D');
  const [chartOverlay, setChartOverlay] = useState<'NONE' | 'EMA20' | 'SMA50' | 'SMA200' | 'BOLLINGER'>('NONE');
  const [chartStyle, setChartStyle] = useState<'AREA' | 'CANDLE' | 'LINE'>('AREA');
  const [showVolume, setShowVolume] = useState<boolean>(true);
  const [activeSubTab, setActiveSubTab] = useState<'OVERVIEW' | 'X_RAY' | 'TECHNICALS' | 'FINANCIALS' | 'RISK_CALC'>('OVERVIEW');
  const [showPreFlightAudit, setShowPreFlightAudit] = useState<boolean>(true);
  const [alertTarget, setAlertTarget] = useState<number | ''>('');
  const [alertMessage, setAlertMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);
  const [orderAction, setOrderAction] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [productType, setProductType] = useState<ProductType>('CNC');
  const [isBracketOrder, setIsBracketOrder] = useState<boolean>(false);
  const [bracketTargetPct, setBracketTargetPct] = useState<number>(8);
  const [bracketStopLossPct, setBracketStopLossPct] = useState<number>(4);
  const [isGttOrder, setIsGttOrder] = useState<boolean>(false);
  const [gttTriggerPrice, setGttTriggerPrice] = useState<number>(stock ? Number((stock.price * 0.96).toFixed(2)) : 0);
  const [tradeInputMode, setTradeInputMode] = useState<'QUANTITY' | 'AMOUNT'>('QUANTITY');
  const [quantity, setQuantity] = useState<number>(10);
  const [investmentAmount, setInvestmentAmount] = useState<number | string>(stock ? (stock.price * 10).toFixed(0) : 10000);
  const [limitPrice, setLimitPrice] = useState<number>(stock ? stock.price : 0);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [tradeMessage, setTradeMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [chartData, setChartData] = useState<Record<string, any[]> | null>(null);
  const [screenerMeta, setScreenerMeta] = useState<any>(null);
  const [googleFinanceMeta, setGoogleFinanceMeta] = useState<any>(null);
  const [orderBook, setOrderBook] = useState<{ bids: any[]; asks: any[]; totalBuyQty: number; totalSellQty: number } | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState<boolean>(false);
  const [invalidationLevel, setInvalidationLevel] = useState<number>(stock ? Number((stock.price * 0.95).toFixed(2)) : 0);
  const [maximumAllocationPct, setMaximumAllocationPct] = useState<number>(10);
  const [expectedCatalyst, setExpectedCatalyst] = useState<string>('');
  const [draftMessage, setDraftMessage] = useState('');

  // Risk & Position Sizing Calculator state
  const [riskStopLossPct, setRiskStopLossPct] = useState<number>(5);
  const [riskTargetProfitPct, setRiskTargetProfitPct] = useState<number>(15);
  const [riskMaxPortfolioPct, setRiskMaxPortfolioPct] = useState<number>(2); // Dalal Street 2% rule

  // Technical setup from catalog or synthesized from live price
  const extendedData = useMemo(() => {
    if (!stock) return undefined;
    return getStockWithTechnicals(stock.symbol);
  }, [stock?.symbol]);

  const technicals = useMemo(() => {
    if (extendedData?.technicalSetup) return extendedData.technicalSetup;
    // Sensible fallback technical indicators based on stock price
    const base = stock?.price || 1000;
    return {
      rsi14: 56.4,
      rsiStatus: "Neutral (30-70)",
      ema20: Number((base * 0.985).toFixed(2)),
      sma50: screenerMeta?.currentDma50 || Number((base * 0.96).toFixed(2)),
      sma200: screenerMeta?.currentDma200 || Number((base * 0.88).toFixed(2)),
      trend: "Bullish",
      support1: Number((base * 0.96).toFixed(2)),
      support2: Number((base * 0.92).toFixed(2)),
      resistance1: Number((base * 1.05).toFixed(2)),
      resistance2: Number((base * 1.10).toFixed(2)),
      macd: { macdLine: 12.4, signalLine: 8.2, histogram: 4.2, signal: "Bullish Crossover" },
      bollingerBands: { upper: Number((base * 1.06).toFixed(2)), middle: Number((base * 0.99).toFixed(2)), lower: Number((base * 0.92).toFixed(2)) },
      candlestickPattern: "Bullish Consolidation"
    };
  }, [extendedData, stock?.price, screenerMeta]);

  useEffect(() => {
    if (stock) {
      setLimitPrice(stock.price);
      setTradeMessage(null);
      setScreenerMeta(null);
      try {
        const saved = JSON.parse(localStorage.getItem(`rr_trade_plan_${currentUser?.id || 'guest'}_${stock.symbol}`) || 'null');
        if (saved) {
          if (Number.isFinite(saved.invalidationLevel)) setInvalidationLevel(saved.invalidationLevel);
          if (Number.isFinite(saved.maximumAllocationPct)) setMaximumAllocationPct(saved.maximumAllocationPct);
          if (typeof saved.expectedCatalyst === 'string') setExpectedCatalyst(saved.expectedCatalyst);
        } else {
          setInvalidationLevel(Number((stock.price * 0.95).toFixed(2)));
          setMaximumAllocationPct(10);
          setExpectedCatalyst('');
        }
      } catch { /* Ignore a malformed local draft. */ }

      // Fetch authentic Screener.in charts & order book from backend API
      fetch(`/api/stocks/${stock.symbol}`)
        .then(async (res) => {
          if (!res.ok) return null;
          const contentType = res.headers.get('content-type') || '';
          if (!contentType.includes('application/json')) return null;
          return res.json();
        })
        .then((data) => {
          if (data && data.success) {
            setChartData(data.chartData);
            setOrderBook(data.orderBook);
            if (data.screener) {
              setScreenerMeta(data.screener);
            }
            if (data.googleFinance) {
              setGoogleFinanceMeta(data.googleFinance);
            }
          }
        })
        .catch(() => {
          // Gracefully ignore network hiccup; charts use local generator fallback
        });
    }
  }, [stock?.symbol, currentUser?.id]);

  const saveTradePlanDraft = () => {
    if (!stock) return;
    localStorage.setItem(`rr_trade_plan_${currentUser?.id || 'guest'}_${stock.symbol}`, JSON.stringify({ invalidationLevel, maximumAllocationPct, expectedCatalyst, savedAt: Date.now() }));
    setDraftMessage('Plan saved on this device');
    window.setTimeout(() => setDraftMessage(''), 2500);
  };

  if (!stock) return null;

  const currentHolding = holdings[stock.symbol];
  const isWatchlisted = watchlist.includes(stock.symbol);
  const stockChange = typeof stock.change === 'number' && !isNaN(stock.change) ? stock.change : (stock.price - (stock.previousClose || stock.price));
  const stockChangePercent = stock.previousClose > 0 ? (stockChange / stock.previousClose) * 100 : (stock.changePercent || 0);
  const isUp = stockChange >= 0;

  // 52-Week Range calculation
  const rangeSpan = stock.high52 - stock.low52;
  const currentPosPercent = Math.min(100, Math.max(0, ((stock.price - stock.low52) / (rangeSpan || 1)) * 100));

  const isValuationCheap = stock.peRatio < stock.industryPe;
  const executionPrice = orderType === 'LIMIT' ? limitPrice : stock.price;
  const totalTradeAmount = Number((executionPrice * quantity).toFixed(2));
  const maxAffordableShares = Math.floor(cashBalance / (executionPrice || 1));
  const maxSellableShares = currentHolding ? currentHolding.quantity : 0;

  const stockAlerts = alerts.filter(a => a.symbol === stock.symbol && a.active);

  const handleQuantityChange = (newQty: number) => {
    const validQty = Math.max(0, Math.floor(newQty));
    setQuantity(validQty);
    setInvestmentAmount(Math.round(validQty * executionPrice));
  };

  const handleAmountChange = (newAmt: number | string) => {
    setInvestmentAmount(newAmt);
    const numericAmt = typeof newAmt === 'string' ? parseFloat(newAmt) || 0 : newAmt;
    const computedQty = Math.floor(numericAmt / (executionPrice || 1));
    setQuantity(Math.max(0, computedQty));
  };

  const handleAddAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertTarget || isNaN(Number(alertTarget))) {
      setAlertMessage({ text: 'Please enter a valid price', type: 'error' });
      return;
    }
    const price = Number(alertTarget);
    if (price === stock.price) {
      setAlertMessage({ text: 'Target price cannot be current price', type: 'error' });
      return;
    }
    
    addAlert(stock.symbol, price, price > stock.price ? 'ABOVE' : 'BELOW');
    setAlertTarget('');
    setAlertMessage({ text: 'Price alert set successfully!', type: 'success' });
    setTimeout(() => setAlertMessage(null), 3000);
  };

  // Open confirmation pop-up after validating trade parameters
  const handleInitiateTrade = (e: React.FormEvent) => {
    e.preventDefault();
    setTradeMessage(null);

    if (quantity <= 0) {
      setTradeMessage({ 
        text: 'Please specify at least 1 share or enter an amount large enough to purchase at least 1 share.', 
        isError: true 
      });
      return;
    }

    if (orderAction === 'BUY') {
      const neededCapital = executionPrice * quantity;
      if (neededCapital > cashBalance) {
        setTradeMessage({ 
          text: `Insufficient virtual cash. Needed: ${formatINR(neededCapital)}, Available: ${formatINR(cashBalance)}.`, 
          isError: true 
        });
        return;
      }
      const allocationPct = portfolioValue > 0 ? (neededCapital / portfolioValue) * 100 : 0;
      if (allocationPct > maximumAllocationPct) {
        setTradeMessage({ text: `This order would allocate ${allocationPct.toFixed(1)}% of your portfolio, above your ${maximumAllocationPct}% plan limit. Reduce quantity or deliberately update the limit.`, isError: true });
        return;
      }
      if (!invalidationLevel || invalidationLevel >= executionPrice) {
        setTradeMessage({ text: 'Set an invalidation level below your planned buy price. It should describe where your idea is no longer valid.', isError: true });
        return;
      }
      if (expectedCatalyst.trim().length < 5) {
        setTradeMessage({ text: 'Write the expected catalyst in at least a few words before placing this simulated trade.', isError: true });
        return;
      }
    } else {
      const ownedQty = currentHolding ? currentHolding.quantity : 0;
      // Subtract pending sell shares from available sell quantity
      const pendingSellShares = orders
        .filter((o) => o.status === 'PENDING' && o.type === 'SELL' && o.symbol === stock.symbol)
        .reduce((sum, o) => sum + o.quantity, 0);
      const availableToSell = ownedQty - pendingSellShares;

      if (quantity > availableToSell) {
        setTradeMessage({ 
          text: `You cannot sell ${quantity} shares because you only have ${availableToSell} available share(s) of ${stock.symbol} ${pendingSellShares > 0 ? `(${pendingSellShares} already queued in pending orders)` : ''}.`, 
          isError: true 
        });
        return;
      }
    }

    // Open confirmation popup
    setShowConfirmModal(true);
  };

  // Final execution triggered after user confirms in modal
  const handleConfirmAndExecuteTrade = () => {
    setShowConfirmModal(false);

    const bracketParams: BracketOrderParams | undefined = isBracketOrder ? {
      targetProfitPrice: Number((stock.price * (1 + (orderAction === 'BUY' ? bracketTargetPct : -bracketTargetPct) / 100)).toFixed(2)),
      stopLossPrice: Number((stock.price * (1 - (orderAction === 'BUY' ? bracketStopLossPct : -bracketStopLossPct) / 100)).toFixed(2)),
      targetProfitPct: bracketTargetPct,
      stopLossPct: bracketStopLossPct
    } : undefined;

    const finalOrderType = isGttOrder ? 'GTT' : orderType;

    if (orderAction === 'BUY') {
      const result = executeBuyOrder(
        stock.symbol, 
        quantity, 
        finalOrderType, 
        limitPrice, 
        productType, 
        bracketParams, 
        isGttOrder ? gttTriggerPrice : undefined
      );
      setTradeMessage({ text: result.message, isError: !result.success });
      if (result.success) {
        playOrderFilledSound();
        const storageKey = `rr_trade_plans:${currentUser?.id || 'guest'}`;
        let plans: unknown[] = [];
        try { plans = JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch { plans = []; }
        plans.unshift({ id: `PLAN-${Date.now()}`, symbol: stock.symbol, createdAt: new Date().toISOString(), action: orderAction, plannedPrice: executionPrice, quantity, invalidationLevel, maximumAllocationPct, expectedCatalyst: expectedCatalyst.trim(), plannedAllocationPct: portfolioValue > 0 ? Number(((totalTradeAmount / portfolioValue) * 100).toFixed(2)) : 0 });
        localStorage.setItem(storageKey, JSON.stringify(plans.slice(0, 100)));
      }
    } else {
      const result = executeSellOrder(
        stock.symbol, 
        quantity, 
        finalOrderType, 
        limitPrice, 
        productType, 
        bracketParams, 
        isGttOrder ? gttTriggerPrice : undefined
      );
      setTradeMessage({ text: result.message, isError: !result.success });
      if (result.success) {
        playOrderFilledSound();
      }
    }
  };

  const handleGetAiAnalysis = async () => {
    setLoadingAi(true);
    try {
      const res = await fetch('/api/gemini/analyze-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock }),
      });
      const data = await res.json();
      setAiAnalysis(data.analysis);
    } catch (err) {
      setAiAnalysis('Analysis could not be generated. Check back in a moment.');
    } finally {
      setLoadingAi(false);
    }
  };

  const activeChartSeries = useMemo(() => {
    let baseSeries = chartData ? (chartData[timeframe] || chartData['1D']) : null;
    
    // If no series from backend yet, dynamically generate accurate real-time points
    if (!baseSeries || baseSeries.length === 0) {
      const cur = stock ? stock.price : 1000;
      const op = stock ? stock.open : cur * 0.99;
      const dh = stock ? Math.max(stock.dayHigh, cur, op) : cur * 1.02;
      const dl = stock ? Math.min(stock.dayLow, cur, op) : cur * 0.98;

      if (timeframe === '1D') {
        const times = ["09:15", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:15", "15:30"];
        baseSeries = times.map((t, idx) => {
          if (idx === 0) return { time: t, price: Number(op.toFixed(2)), high: dh, low: dl, volume: 12000 };
          if (idx === times.length - 1) return { time: t, price: Number(cur.toFixed(2)), high: dh, low: dl, volume: 38000 };
          const p = idx / (times.length - 1);
          const val = Math.min(dh, Math.max(dl, op + (cur - op) * p + Math.sin(p * Math.PI) * (dh - dl) * 0.25));
          return { time: t, price: Number(val.toFixed(2)), high: Number((val * 1.01).toFixed(2)), low: Number((val * 0.99).toFixed(2)), volume: 20000 };
        });
      } else if (timeframe === '1W') {
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Yesterday", "Today"];
        const start = cur * (1 - (stock?.changePercent || 0) * 0.02);
        baseSeries = days.map((d, idx) => {
          if (idx === days.length - 1) return { time: d, price: Number(cur.toFixed(2)), high: dh, low: dl, volume: 150000 };
          const p = idx / (days.length - 1);
          const val = start + (cur - start) * p;
          return { time: d, price: Number(val.toFixed(2)), high: Number((val * 1.015).toFixed(2)), low: Number((val * 0.985).toFixed(2)), volume: 120000 };
        });
      } else if (timeframe === '1M') {
        const labels = ["Day 1", "Day 5", "Day 10", "Day 15", "Day 20", "Day 25", "Today"];
        const start = cur * 0.96;
        baseSeries = labels.map((l, idx) => {
          if (idx === labels.length - 1) return { time: l, price: Number(cur.toFixed(2)), high: dh, low: dl, volume: 280000 };
          const p = idx / (labels.length - 1);
          const val = start + (cur - start) * p;
          return { time: l, price: Number(val.toFixed(2)), high: Number((val * 1.02).toFixed(2)), low: Number((val * 0.98).toFixed(2)), volume: 220000 };
        });
      } else if (timeframe === '6M') {
        const labels = ["6M", "5M", "4M", "3M", "2M", "1M", "Today"];
        const start = cur * 0.91;
        baseSeries = labels.map((l, idx) => {
          if (idx === labels.length - 1) return { time: l, price: Number(cur.toFixed(2)), high: dh, low: dl, volume: 450000 };
          const p = idx / (labels.length - 1);
          const val = start + (cur - start) * p;
          return { time: l, price: Number(val.toFixed(2)), high: Number((val * 1.025).toFixed(2)), low: Number((val * 0.975).toFixed(2)), volume: 350000 };
        });
      } else if (timeframe === '3Y') {
        const quarters = ["Q3 '23", "Q1 '24", "Q3 '24", "Q1 '25", "Q3 '25", "Today"];
        const start = cur * 0.55;
        baseSeries = quarters.map((q, idx) => {
          if (idx === quarters.length - 1) return { time: q, price: Number(cur.toFixed(2)), high: Number((cur * 1.03).toFixed(2)), low: Number((cur * 0.97).toFixed(2)), volume: 1200000 };
          const p = idx / (quarters.length - 1);
          const val = start * Math.pow(cur / start, p);
          return { time: q, price: Number(val.toFixed(2)), high: Number((val * 1.04).toFixed(2)), low: Number((val * 0.96).toFixed(2)), volume: 800000 };
        });
      } else if (timeframe === '5Y') {
        const years = ["2021", "2022", "2023", "2024", "2025", "2026 (Latest)"];
        const start = cur * 0.35;
        baseSeries = years.map((y, idx) => {
          if (idx === years.length - 1) return { time: y, price: Number(cur.toFixed(2)), high: Number((cur * 1.04).toFixed(2)), low: Number((cur * 0.96).toFixed(2)), volume: 2500000 };
          const p = idx / (years.length - 1);
          const val = start * Math.pow(cur / start, p);
          return { time: y, price: Number(val.toFixed(2)), high: Number((val * 1.05).toFixed(2)), low: Number((val * 0.95).toFixed(2)), volume: 1800000 };
        });
      } else if (timeframe === 'MAX') {
        const years = ["2016", "2018", "2020", "2022", "2024", "2026"];
        const start = cur * 0.16;
        baseSeries = years.map((y, idx) => {
          if (idx === years.length - 1) return { time: y, price: Number(cur.toFixed(2)), high: Number((cur * 1.05).toFixed(2)), low: Number((cur * 0.95).toFixed(2)), volume: 4500000 };
          const p = idx / (years.length - 1);
          const val = start * Math.pow(cur / start, p);
          return { time: y, price: Number(val.toFixed(2)), high: Number((val * 1.06).toFixed(2)), low: Number((val * 0.94).toFixed(2)), volume: 3000000 };
        });
      } else {
        const months = ["Sep '25", "Nov '25", "Jan '26", "Mar '26", "May '26", "Jul '26", "Aug '26"];
        const l52 = stock?.low52 || cur * 0.75;
        baseSeries = months.map((m, idx) => {
          if (idx === months.length - 1) return { time: m, price: Number(cur.toFixed(2)), high: dh, low: dl, volume: 600000 };
          const p = idx / (months.length - 1);
          const val = l52 + (cur - l52) * p;
          return { time: m, price: Number(val.toFixed(2)), high: Number((val * 1.03).toFixed(2)), low: Number((val * 0.97).toFixed(2)), volume: 450000 };
        });
      }
    }

    // Synthesize moving averages and Bollinger bands for technical chart display
    return baseSeries.map((pt: any, idx: number, arr: any[]) => {
      const window20 = arr.slice(Math.max(0, idx - 4), idx + 1);
      const avg20 = window20.reduce((acc, curr) => acc + (curr.price || 0), 0) / window20.length;
      
      const window50 = arr.slice(Math.max(0, idx - 8), idx + 1);
      const avg50 = window50.reduce((acc, curr) => acc + (curr.price || 0), 0) / window50.length;

      const window200 = arr.slice(Math.max(0, idx - 14), idx + 1);
      const avg200 = window200.reduce((acc, curr) => acc + (curr.price || 0), 0) / window200.length;

      const upperBand = avg20 * 1.035;
      const lowerBand = avg20 * 0.965;

      const displayTime = pt.time || pt.month || `P${idx + 1}`;

      return {
        ...pt,
        displayTime,
        ema20: pt.ema20 || Number(avg20.toFixed(2)),
        sma50: pt.dma50 || pt.sma50 || Number(avg50.toFixed(2)),
        sma200: pt.dma200 || pt.sma200 || Number(avg200.toFixed(2)),
        bbUpper: Number(upperBand.toFixed(2)),
        bbLower: Number(lowerBand.toFixed(2)),
      };
    });
  }, [chartData, timeframe, stock]);

  // Selected Period Metrics
  const periodPerformance = useMemo(() => {
    if (!activeChartSeries || activeChartSeries.length === 0) return null;
    const first = activeChartSeries[0]?.price || stock?.price || 1;
    const last = activeChartSeries[activeChartSeries.length - 1]?.price || stock?.price || 1;
    const diff = Number((last - first).toFixed(2));
    const pct = Number(((diff / first) * 100).toFixed(2));
    const high = Math.max(...activeChartSeries.map((p: any) => p.high || p.price || 0));
    const low = Math.min(...activeChartSeries.map((p: any) => p.low || p.price || Infinity));
    const totalVolume = activeChartSeries.reduce((acc: number, p: any) => acc + (p.volume || 0), 0);
    const avgVolume = Math.round(totalVolume / activeChartSeries.length);
    
    return {
      startPrice: first,
      currentPrice: last,
      diff,
      pct,
      high: high || last,
      low: low === Infinity ? last : low,
      avgVolume,
      isPositive: diff >= 0
    };
  }, [activeChartSeries, stock]);

  const nseQuoteUrl = `https://www.nseindia.com/get-quotes/equity?symbol=${encodeURIComponent(stock.symbol)}`;
  const bseQuoteUrl = `https://www.bseindia.com/stock-share-price/${encodeURIComponent(stock.symbol.toLowerCase())}/${encodeURIComponent(stock.symbol.toLowerCase())}/${extendedData?.bseCode || '500325'}/`;
  const irPortalUrl = extendedData?.irUrl || `https://www.google.com/finance/quote/${encodeURIComponent(stock.symbol)}:NSE`;
  const quoteTimeLabel = stock.quoteAsOf
    ? new Date(stock.quoteAsOf).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#081219] border border-slate-200 dark:border-white/15 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.03] flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center font-black text-lg shadow-md shrink-0 border border-transparent dark:border-white/10">
              {stock.symbol.substring(0, 3)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{stock.name}</h2>
                <span className="text-xs font-black text-slate-900 bg-[#E2E8F0]/80 px-2.5 py-0.5 rounded-md">
                  NSE: {stock.symbol}
                </span>
                {extendedData?.bseCode && (
                  <span className="text-xs font-black text-blue-900 bg-blue-100/90 border border-blue-200 px-2 py-0.5 rounded-md">
                    BSE: {extendedData.bseCode}
                  </span>
                )}
                {stock.psuStatus && (
                  <span className="text-xs font-black text-indigo-900 bg-indigo-100/90 border border-indigo-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <span>🏛️</span>
                    <span>{stock.psuStatus}</span>
                  </span>
                )}
                {stock.ministry && (
                  <span className="text-xs font-bold text-amber-950 bg-amber-100/90 border border-amber-300 px-2 py-0.5 rounded-md">
                    {stock.ministry}
                  </span>
                )}
                <span className="text-xs font-medium text-slate-500 bg-white border border-slate-200 px-2.5 py-0.5 rounded-md">
                  {stock.sector}
                </span>
              </div>

              {/* Official HTTP Links to Exchanges & Investor Relations */}
              <div className="flex items-center gap-2 mt-2 flex-wrap text-xs">
                <a
                  href={nseQuoteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-bold text-amber-900 bg-amber-100/80 hover:bg-amber-200 border border-amber-300 px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors"
                  title="Official National Stock Exchange (NSE) Quote"
                >
                  <span>NSE Quote</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
                <a
                  href={bseQuoteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-bold text-blue-900 bg-blue-100/80 hover:bg-blue-200 border border-blue-300 px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors"
                  title="Official Bombay Stock Exchange (BSE) Quote"
                >
                  <span>BSE Quote</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
                <a
                  href={irPortalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-bold text-emerald-900 bg-emerald-100/80 hover:bg-emerald-200 border border-emerald-300 px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors"
                  title="Official Company Investor Relations Portal"
                >
                  <span>Investor Relations</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
                {extendedData?.isin && (
                  <span className="text-[10px] text-slate-500 font-mono font-medium">
                    ISIN: {extendedData.isin}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500 font-medium mt-1.5 max-w-xl line-clamp-1 sm:line-clamp-none">
                {stock.teenSummary}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleWatchlist(stock.symbol)}
              className={`p-2 rounded-xl border transition-all ${
                isWatchlisted
                  ? 'bg-indigo-600/20 text-indigo-600 border-[#4F46E5]/40'
                  : 'bg-white text-slate-500 border-slate-200 hover:text-[#101B29]'
              }`}
              title={isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
            >
              <Star className={`w-5 h-5 ${isWatchlisted ? 'fill-[#4F46E5] text-indigo-600' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white text-slate-500 hover:text-[#101B29] hover:bg-slate-50 border border-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Responsive analysis navigation shared by every stock detail modal */}
        <nav aria-label="Stock analysis sections" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 border-b border-slate-200 bg-slate-50/70 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => setActiveSubTab('OVERVIEW')}
            aria-current={activeSubTab === 'OVERVIEW' ? 'page' : undefined}
            className={`flex min-h-14 items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all ${
              activeSubTab === 'OVERVIEW'
                ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900'
            }`}
          >
            <span className={`rounded-lg p-1.5 ${activeSubTab === 'OVERVIEW' ? 'bg-white/15' : 'bg-slate-100'}`}>
              <LineChartIcon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-black">Overview</span>
              <span className={`block truncate text-[10px] font-semibold ${activeSubTab === 'OVERVIEW' ? 'text-slate-300' : 'text-slate-500'}`}>Price and charts</span>
            </span>
          </button>
          <button
            type="button"
            id="subtab-xray-btn"
            onClick={() => setActiveSubTab('X_RAY')}
            aria-current={activeSubTab === 'X_RAY' ? 'page' : undefined}
            className={`flex min-h-14 items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all ${
              activeSubTab === 'X_RAY'
                ? 'border-violet-600 bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 hover:border-violet-400 hover:text-violet-900'
            }`}
          >
            <span className={`rounded-lg p-1.5 ${activeSubTab === 'X_RAY' ? 'bg-white/15' : 'bg-violet-50'}`}>
              <ShieldCheck className={`h-4 w-4 ${activeSubTab === 'X_RAY' ? 'text-white' : 'text-violet-700'}`} />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-black">5-Pillar X-Ray</span>
              <span className={`block truncate text-[10px] font-semibold ${activeSubTab === 'X_RAY' ? 'text-violet-100' : 'text-slate-500'}`}>
                Solvency &amp; Moat
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('TECHNICALS')}
            aria-current={activeSubTab === 'TECHNICALS' ? 'page' : undefined}
            className={`flex min-h-14 items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all ${
              activeSubTab === 'TECHNICALS'
                ? 'border-emerald-700 bg-emerald-700 text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-400 hover:text-emerald-800'
            }`}
          >
            <span className={`rounded-lg p-1.5 ${activeSubTab === 'TECHNICALS' ? 'bg-white/15' : 'bg-emerald-50'}`}>
              <Gauge className={`h-4 w-4 ${activeSubTab === 'TECHNICALS' ? 'text-white' : 'text-emerald-700'}`} />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-black">Technicals</span>
              <span className={`block truncate text-[10px] font-semibold ${activeSubTab === 'TECHNICALS' ? 'text-emerald-100' : 'text-slate-500'}`}>Model RSI {technicals.rsi14} · indicators</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('FINANCIALS')}
            aria-current={activeSubTab === 'FINANCIALS' ? 'page' : undefined}
            className={`flex min-h-14 items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all ${
              activeSubTab === 'FINANCIALS'
                ? 'border-indigo-700 bg-indigo-700 text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-400 hover:text-indigo-800'
            }`}
          >
            <span className={`rounded-lg p-1.5 ${activeSubTab === 'FINANCIALS' ? 'bg-white/15' : 'bg-indigo-50'}`}>
              <BarChart3 className={`h-4 w-4 ${activeSubTab === 'FINANCIALS' ? 'text-white' : 'text-indigo-700'}`} />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-black">Financials</span>
              <span className={`block truncate text-[10px] font-semibold ${activeSubTab === 'FINANCIALS' ? 'text-indigo-100' : 'text-slate-500'}`}>Valuation and results</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('RISK_CALC')}
            aria-current={activeSubTab === 'RISK_CALC' ? 'page' : undefined}
            className={`flex min-h-14 items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all ${
              activeSubTab === 'RISK_CALC'
                ? 'border-amber-700 bg-amber-700 text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 hover:border-amber-400 hover:text-amber-800'
            }`}
          >
            <span className={`rounded-lg p-1.5 ${activeSubTab === 'RISK_CALC' ? 'bg-white/15' : 'bg-amber-50'}`}>
              <Calculator className={`h-4 w-4 ${activeSubTab === 'RISK_CALC' ? 'text-white' : 'text-amber-700'}`} />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-black">Risk Planner</span>
              <span className={`block truncate text-[10px] font-semibold ${activeSubTab === 'RISK_CALC' ? 'text-amber-100' : 'text-slate-500'}`}>Position sizing · 2% rule</span>
            </span>
          </button>
        </nav>

        {/* Modal Body - 2 Columns */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 bg-slate-50/50 dark:bg-[#060c11]">
          
          {/* Left 2 Columns: Live Price, Charts, Technical Analysis, Fundamentals */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Live Price & Day Metrics */}
            <div className="bg-white dark:bg-[#0c161d] border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
              <div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Current Market Price</div>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
                    {formatINR(stock.price)}
                  </span>
                  <div className={`flex items-center text-xs font-black px-2.5 py-1 rounded-xl ${
                    isUp ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {isUp ? <ArrowUpRight className="w-4 h-4 mr-0.5" /> : <ArrowDownRight className="w-4 h-4 mr-0.5" />}
                    {isUp ? '+' : ''}{stockChange.toFixed(2)} ({formatPercent(stockChangePercent)})
                  </div>
                </div>
                <p className="mt-1.5 text-[10px] font-semibold text-slate-500">
                  {quoteLabel(stock)} · {stock.quoteSource || 'Catalog data'}{quoteTimeLabel ? ` · ${quoteTimeLabel} IST` : ''}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="bg-slate-50/40 p-2.5 rounded-xl border border-slate-200 ">
                  <span className="text-slate-500 block font-medium">Day High</span>
                  <span className="font-extrabold text-slate-900 font-mono">₹{stock.dayHigh.toFixed(2)}</span>
                </div>
                <div className="bg-slate-50/40 p-2.5 rounded-xl border border-slate-200 ">
                  <span className="text-slate-500 block font-medium">Day Low</span>
                  <span className="font-extrabold text-slate-900 font-mono">₹{stock.dayLow.toFixed(2)}</span>
                </div>
                <div className="bg-slate-50/40 p-2.5 rounded-xl border border-slate-200 ">
                  <span className="text-slate-500 block font-medium">Open</span>
                  <span className="font-extrabold text-slate-900 font-mono">₹{stock.open.toFixed(2)}</span>
                </div>
                <div className="bg-slate-50/40 p-2.5 rounded-xl border border-slate-200 ">
                  <span className="text-slate-500 block font-medium">Prev Close</span>
                  <span className="font-extrabold text-slate-900 font-mono">₹{stock.previousClose.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* TAB 1: OVERVIEW TAB CONTENT */}
            {activeSubTab === 'OVERVIEW' && (
              <>
                {/* 52-WEEK HIGH / LOW RANGE BAR GAUGE */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-700 mb-2">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Activity className="w-4 h-4 text-slate-900 " />
                      52-Week Price Range (1 Year Journey)
                    </span>
                    <span className="text-slate-900 font-black">
                      {currentPosPercent.toFixed(0)}% of 52W High
                    </span>
                  </div>

                  {/* Progress Slider Track */}
                  <div className="relative h-3 bg-slate-50 rounded-full overflow-visible my-3 border border-slate-200 ">
                    <div 
                      className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-500 rounded-full"
                      style={{ width: `${currentPosPercent}%` }}
                    />
                    {/* Pointer Marker */}
                    <div 
                      className="absolute -top-1.5 -ml-2.5 w-6 h-6 bg-white border-2 border-zinc-600 rounded-full shadow-md flex items-center justify-center"
                      style={{ left: `${currentPosPercent}%` }}
                    >
                      <div className="w-1.5 h-1.5 bg-slate-900 rounded-full" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-medium mt-1">
                    <div>
                      <span className="text-rose-700 font-bold font-mono">52W Low: ₹{stock.low52.toFixed(2)}</span>
                      <p className="text-[10px] text-slate-500">Yearly Floor</p>
                    </div>
                    <div className="text-center">
                      <span className="text-slate-900 font-extrabold font-mono">Current: ₹{stock.price.toFixed(2)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-emerald-700 font-bold font-mono">52W High: ₹{stock.high52.toFixed(2)}</span>
                      <p className="text-[10px] text-slate-500">Yearly Peak</p>
                    </div>
                  </div>
                </div>

                {/* Interactive Price Chart with Screener.in & Technical Indicator Overlays */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
                  {/* Chart Header & Screener.in Badge */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200/70">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
                          <TrendingUp className="w-4 h-4 text-slate-900" />
                          Educational Price Chart
                        </h3>
                        {/* Screener.in Live Tag */}
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                          <span className={`w-2 h-2 rounded-full ${nseMarketInfo.isNSEMarketOpen ? 'bg-emerald-600' : 'bg-amber-500'}`}></span>
                          Screener.in snapshot
                        </span>
                        {screenerMeta?.fiveYearReturnPct !== undefined && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                            5Y: {screenerMeta.fiveYearReturnPct >= 0 ? '+' : ''}{screenerMeta.fiveYearReturnPct}%
                          </span>
                        )}
                        {screenerMeta?.fiveYearCagrPct !== undefined && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-50 text-slate-900 border border-slate-200">
                            5Y CAGR: {screenerMeta.fiveYearCagrPct}%
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 flex-wrap">
                        <span>Trend: <strong className="text-slate-900">{technicals.trend}</strong></span>
                        <span>•</span>
                        <span>Candlestick: <strong className="text-emerald-700">{technicals.candlestickPattern}</strong></span>
                        {screenerMeta?.currentDma50 && (
                          <>
                            <span>•</span>
                            <span>50 DMA: <strong className="text-purple-700">₹{screenerMeta.currentDma50}</strong></span>
                          </>
                        )}
                        {screenerMeta?.currentDma200 && (
                          <>
                            <span>•</span>
                            <span>200 DMA: <strong className="text-indigo-700">₹{screenerMeta.currentDma200}</strong></span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Screener.in & Google Finance External Links */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <a
                        href={screenerMeta?.screenerUrl || `https://www.screener.in/company/${encodeURIComponent(stock.symbol)}/consolidated/`}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-extrabold transition-all shadow-2xs"
                        title="View complete audited balance sheets, P&L, quarterly results & shareholding on Screener.in"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Screener.in</span>
                      </a>
                      <a
                        href={googleFinanceMeta?.quoteUrl || `https://www.google.com/finance/quote/${encodeURIComponent(stock.symbol)}:NSE`}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-2xs hover:border-slate-900"
                        title="View on Google Finance"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                        <span>Google Finance</span>
                      </a>
                    </div>
                  </div>

                  {/* Period Performance Ribbon (Active Timeframe Insights) */}
                  {periodPerformance && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50/60 p-2.5 rounded-xl border border-slate-200/80 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-semibold">
                          {timeframe} Return
                        </span>
                        <div className={`font-mono font-extrabold flex items-center gap-1 ${periodPerformance.isPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {periodPerformance.isPositive ? '+' : ''}{formatINR(periodPerformance.diff)} ({periodPerformance.isPositive ? '+' : ''}{periodPerformance.pct}%)
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-semibold">
                          Period High
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          ₹{periodPerformance.high.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-semibold">
                          Period Low
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          ₹{periodPerformance.low.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-semibold">
                          Avg Vol ({timeframe})
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          {formatIndianShort(periodPerformance.avgVolume)} shares
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Controls Toolbar: Timeframes, Chart Style & Indicator Overlays */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                    {/* Timeframe selector: 1D, 1W, 1M, 6M, 1Y, 3Y, 5Y, MAX */}
                    <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs font-bold overflow-x-auto max-w-full">
                      {(['1D', '1W', '1M', '6M', '1Y', '3Y', '5Y', 'MAX'] as const).map((tf) => (
                        <button
                          key={tf}
                          onClick={() => setTimeframe(tf)}
                          className={`px-2.5 py-1 rounded-lg transition-all text-xs font-bold whitespace-nowrap ${
                            timeframe === tf
                              ? 'bg-slate-900 text-white shadow-xs'
                              : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'
                          }`}
                        >
                          {tf}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Chart Style Switcher */}
                      <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                        <button
                          onClick={() => setChartStyle('AREA')}
                          className={`px-2 py-0.5 rounded-md transition-all text-[11px] ${
                            chartStyle === 'AREA' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          Area
                        </button>
                        <button
                          onClick={() => setChartStyle('CANDLE')}
                          className={`px-2 py-0.5 rounded-md transition-all text-[11px] ${
                            chartStyle === 'CANDLE' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'
                          }`}
                          title="High-Low Range & Candle View"
                        >
                          Range
                        </button>
                        <button
                          onClick={() => setChartStyle('LINE')}
                          className={`px-2 py-0.5 rounded-md transition-all text-[11px] ${
                            chartStyle === 'LINE' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          Line
                        </button>
                      </div>

                      {/* Technical Indicator Overlay Toggles */}
                      <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                        <button
                          onClick={() => setChartOverlay('NONE')}
                          className={`px-2 py-0.5 rounded-md transition-all text-[11px] ${
                            chartOverlay === 'NONE' ? 'bg-slate-900 text-white' : 'text-slate-500'
                          }`}
                        >
                          Raw
                        </button>
                        <button
                          onClick={() => setChartOverlay('EMA20')}
                          className={`px-2 py-0.5 rounded-md transition-all text-[11px] ${
                            chartOverlay === 'EMA20' ? 'bg-amber-600 text-white' : 'text-slate-500'
                          }`}
                          title="20-Period Exponential Moving Average"
                        >
                          EMA 20
                        </button>
                        <button
                          onClick={() => setChartOverlay('SMA50')}
                          className={`px-2 py-0.5 rounded-md transition-all text-[11px] ${
                            chartOverlay === 'SMA50' ? 'bg-purple-600 text-white' : 'text-slate-500'
                          }`}
                          title="50-Period Simple Moving Average"
                        >
                          SMA 50
                        </button>
                        <button
                          onClick={() => setChartOverlay('SMA200')}
                          className={`px-2 py-0.5 rounded-md transition-all text-[11px] ${
                            chartOverlay === 'SMA200' ? 'bg-indigo-600 text-white' : 'text-slate-500'
                          }`}
                          title="200-Period Long-term Benchmark"
                        >
                          SMA 200
                        </button>
                        <button
                          onClick={() => setChartOverlay('BOLLINGER')}
                          className={`px-2 py-0.5 rounded-md transition-all text-[11px] ${
                            chartOverlay === 'BOLLINGER' ? 'bg-blue-600 text-white' : 'text-slate-500'
                          }`}
                          title="Bollinger Bands (Upper + Lower volatility envelopes)"
                        >
                          Bands
                        </button>
                      </div>

                      {/* Volume Bar Toggle */}
                      <button
                        onClick={() => setShowVolume(!showVolume)}
                        className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold transition-all ${
                          showVolume
                            ? 'bg-slate-900/10 border-slate-900 text-slate-900'
                            : 'bg-slate-50 border-slate-200 text-slate-500'
                        }`}
                        title="Toggle Volume Bars at the bottom of the chart"
                      >
                        Vol Bars
                      </button>
                    </div>
                  </div>

                  {/* Main Chart Graphic Canvas */}
                  <div className="h-64 sm:h-72 w-full pt-2">
                    {activeChartSeries.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={activeChartSeries} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                          <defs>
                            <linearGradient id="stockGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={isUp ? "#00f59b" : "#f43f5e"} stopOpacity={0.45} />
                              <stop offset="45%" stopColor={isUp ? "#00f59b" : "#f43f5e"} stopOpacity={0.16} />
                              <stop offset="95%" stopColor={isUp ? "#00f59b" : "#f43f5e"} stopOpacity={0.0} />
                            </linearGradient>
                            <linearGradient id="volGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#00f59b" stopOpacity={0.4} />
                              <stop offset="100%" stopColor="#00f59b" stopOpacity={0.05} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.25} />
                          <XAxis 
                            dataKey="displayTime" 
                            stroke="#64748B" 
                            fontSize={10} 
                            tickLine={false} 
                          />
                          <YAxis 
                            yAxisId="priceAxis"
                            domain={['dataMin - (dataMax - dataMin) * 0.05', 'dataMax + (dataMax - dataMin) * 0.05']} 
                            stroke="#64748B" 
                            fontSize={10} 
                            tickLine={false} 
                            tickFormatter={(val) => `₹${Math.round(val)}`}
                          />
                          {showVolume && (
                            <YAxis 
                              yAxisId="volAxis" 
                              orientation="right" 
                              domain={[0, 'dataMax * 3.5']} 
                              hide 
                            />
                          )}
                          <Tooltip
                            contentStyle={{ 
                              backgroundColor: 'rgba(10, 15, 26, 0.95)', 
                              borderColor: 'rgba(255, 255, 255, 0.15)', 
                              borderRadius: '16px', 
                              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
                              padding: '12px',
                              backdropFilter: 'blur(16px)',
                              color: '#FFFFFF'
                            }}
                            labelStyle={{ color: '#00f59b', fontWeight: 800, marginBottom: '4px' }}
                            formatter={(value: any, name: string) => {
                              if (name === 'volume') return [formatIndianShort(Number(value)) + ' shares', 'Volume'];
                              if (name === 'price') return [`₹${Number(value).toFixed(2)}`, 'Price'];
                              if (name === 'high') return [`₹${Number(value).toFixed(2)}`, 'High'];
                              if (name === 'low') return [`₹${Number(value).toFixed(2)}`, 'Low'];
                              if (name === 'ema20') return [`₹${Number(value).toFixed(2)}`, 'EMA 20'];
                              if (name === 'sma50') return [`₹${Number(value).toFixed(2)}`, 'SMA 50'];
                              if (name === 'sma200') return [`₹${Number(value).toFixed(2)}`, 'SMA 200'];
                              if (name === 'bbUpper') return [`₹${Number(value).toFixed(2)}`, 'Upper Band'];
                              if (name === 'bbLower') return [`₹${Number(value).toFixed(2)}`, 'Lower Band'];
                              return [`₹${Number(value).toFixed(2)}`, name];
                            }}
                          />

                          {/* Synchronized Volume Bars */}
                          {showVolume && (
                            <Bar 
                              yAxisId="volAxis" 
                              dataKey="volume" 
                              fill="url(#volGradient)" 
                              radius={[4, 4, 0, 0]}
                              name="volume"
                            />
                          )}

                          {/* High-Low Range Candle Bar if in Range Mode */}
                          {chartStyle === 'CANDLE' && (
                            <Bar 
                              yAxisId="priceAxis" 
                              dataKey="high" 
                              fill={isUp ? "#10b981" : "#f43f5e"} 
                              opacity={0.3} 
                              radius={[2, 2, 0, 0]}
                              name="high"
                            />
                          )}

                          {/* Primary Price Area / Line */}
                          {chartStyle === 'AREA' && (
                            <Area 
                              yAxisId="priceAxis"
                              type="monotone" 
                              dataKey="price" 
                              stroke={isUp ? "#00f59b" : "#f43f5e"} 
                              strokeWidth={2.5} 
                              fillOpacity={1} 
                              fill="url(#stockGradient)" 
                              name="price"
                            />
                          )}

                          {chartStyle === 'LINE' && (
                            <Line 
                              yAxisId="priceAxis"
                              type="monotone" 
                              dataKey="price" 
                              stroke={isUp ? "#00f59b" : "#f43f5e"} 
                              strokeWidth={2.5} 
                              dot={{ r: 2, fill: isUp ? "#00f59b" : "#f43f5e" }}
                              name="price"
                            />
                          )}

                          {/* Technical Overlays */}
                          {chartOverlay === 'EMA20' && (
                            <Line yAxisId="priceAxis" type="monotone" dataKey="ema20" stroke="#d97706" strokeWidth={2} dot={false} name="ema20" />
                          )}
                          {chartOverlay === 'SMA50' && (
                            <Line yAxisId="priceAxis" type="monotone" dataKey="sma50" stroke="#9333ea" strokeWidth={2} dot={false} name="sma50" />
                          )}
                          {chartOverlay === 'SMA200' && (
                            <Line yAxisId="priceAxis" type="monotone" dataKey="sma200" stroke="#4f46e5" strokeWidth={2} dot={false} name="sma200" />
                          )}
                          {chartOverlay === 'BOLLINGER' && (
                            <>
                              <Line yAxisId="priceAxis" type="monotone" dataKey="bbUpper" stroke="#2563eb" strokeWidth={1.5} strokeDasharray="3 3" dot={false} name="bbUpper" />
                              <Line yAxisId="priceAxis" type="monotone" dataKey="bbLower" stroke="#2563eb" strokeWidth={1.5} strokeDasharray="3 3" dot={false} name="bbLower" />
                            </>
                          )}
                        </ComposedChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-500 text-xs font-medium">
                        Loading chart data...
                      </div>
                    )}
                  </div>

                  {/* Chart Indicator Legend & Footnotes */}
                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-2.5 border-t border-slate-200 gap-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1.5 font-bold text-slate-900">
                        <span className={`w-2.5 h-2.5 rounded-full ${isUp ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                        Price ₹{stock.price.toFixed(2)}
                      </span>
                      {chartOverlay === 'EMA20' && (
                        <span className="flex items-center gap-1 text-amber-700 font-bold">
                          <span className="w-2.5 h-0.5 bg-amber-600"></span> 20 EMA: ₹{technicals.ema20}
                        </span>
                      )}
                      {chartOverlay === 'SMA50' && (
                        <span className="flex items-center gap-1 text-purple-700 font-bold">
                          <span className="w-2.5 h-0.5 bg-purple-600"></span> 50 SMA: ₹{technicals.sma50}
                        </span>
                      )}
                      {chartOverlay === 'SMA200' && (
                        <span className="flex items-center gap-1 text-indigo-700 font-bold">
                          <span className="w-2.5 h-0.5 bg-indigo-600"></span> 200 SMA: ₹{technicals.sma200}
                        </span>
                      )}
                      {chartOverlay === 'BOLLINGER' && (
                        <span className="flex items-center gap-1 text-blue-700 font-bold">
                          <span className="w-2.5 h-0.5 bg-blue-600"></span> BB: ₹{technicals.bollingerBands.lower} - ₹{technicals.bollingerBands.upper}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 font-mono text-xs">
                      <span className="text-emerald-700 font-bold">
                        RSI (14): {technicals.rsi14} ({technicals.rsiStatus})
                      </span>
                      <span className="text-slate-500 text-[10px]">
                        Educational indicator model · verify with an exchange-authorised chart
                      </span>
                    </div>
                  </div>
                </div>

                {/* Teenager-Friendly Brand & Product Insights */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    Famous Brands & Products You Probably Know
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {stock.popularBrands.map((brand, idx) => (
                      <span key={idx} className="bg-slate-50/80 text-slate-900 border border-slate-200 text-xs px-3 py-1 rounded-full font-bold shadow-xs">
                        {brand}
                      </span>
                    ))}
                  </div>

                  {/* Strengths and Risks */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-3.5">
                      <div className="text-xs font-black text-emerald-800 flex items-center gap-1.5 mb-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 " /> Bullish Strengths
                      </div>
                      <ul className="text-xs text-zinc-700 space-y-1 font-medium">
                        {stock.strengths.map((str, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-emerald-600 font-bold">✓</span> {str}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-3.5">
                      <div className="text-xs font-black text-rose-800 flex items-center gap-1.5 mb-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-600 " /> Potential Risks
                      </div>
                      <ul className="text-xs text-zinc-700 space-y-1 font-medium">
                        {stock.risks.map((rsk, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-rose-600 font-bold">✕</span> {rsk}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* AI Mentor Deep Report */}
                <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 text-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-indigo-600 fill-[#4F46E5]" />
                      <span className="text-sm font-black text-white">Chanakya AI Technical + Fundamental Report</span>
                    </div>
                    {!aiAnalysis && (
                      <button
                        onClick={handleGetAiAnalysis}
                        disabled={loadingAi}
                        className="text-xs font-extrabold bg-indigo-600 hover:bg-amber-300 text-slate-900 px-3.5 py-1.5 rounded-xl transition-all shadow-sm"
                      >
                        {loadingAi ? 'Analyzing Technicals...' : 'Generate AI Breakdown ✨'}
                      </button>
                    )}
                  </div>

                  {aiAnalysis ? (
                    <div className="text-xs text-white leading-relaxed whitespace-pre-line bg-indigo-950/60 p-3.5 rounded-xl border border-indigo-700/50 mt-2 font-medium">
                      {aiAnalysis}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-200 font-medium">
                      Get a personalized AI breakdown explaining {stock.name}&apos;s technical momentum (RSI, Support/Resistance, Moving Averages) and valuation in simple teen terms.
                    </p>
                  )}
                </div>
              </>
            )}

            {/* TAB: 5-PILLAR HEALTH X-RAY (Solvency & Moat Radar) */}
            {activeSubTab === 'X_RAY' && (() => {
              const pe = stock.peRatio || 28;
              const isITorFMCG = stock.sector === 'IT' || stock.sector === 'FMCG';
              const isBank = stock.sector === 'Banking' || stock.sector === 'Finance';

              const p1Score = isITorFMCG ? 96 : isBank ? 88 : stock.symbol === 'TATAMOTORS' ? 78 : 84;
              const p1Badge = p1Score >= 85 ? 'FORTRESS BALANCE SHEET' : p1Score >= 70 ? 'COMFORTABLE SOLVENCY' : 'MODERATE LEVERAGE';
              const p1Analogy = isBank
                ? 'NPA buffer aur capital adequacy majboot hai — tufaan me bhi chhat surakshit hai.'
                : isITorFMCG
                ? 'Zero debt / cash-rich balance sheet — bank ka koi bojh nahi hai.'
                : 'Debt-to-equity aam seema ke andar hai, interest coverage aaram se nikalta hai.';

              const p2Score = isITorFMCG ? 92 : (stock.changePercent || 0) > 0 ? 86 : 80;
              const p2Badge = p2Score >= 85 ? 'HIGH CASH MARGINS' : 'STEADY PROFIT ENGINE';
              const p2Analogy = 'Har ₹100 ki bikri me se thos free cash flow bachta hai, jo business expansion me kaam aata hai.';

              const p3Score = pe < 22 ? 88 : pe < 35 ? 76 : pe < 65 ? 60 : 45;
              const p3Badge = p3Score >= 80 ? 'ATTRACTIVE VALUATION' : p3Score >= 60 ? 'FAIR VALUE' : 'GROWTH PREMIUM (EXPENSIVE)';
              const p3Analogy = p3Score >= 65
                ? 'Stock ki keemat company ke asli munafey ke muqable kafi santulit daam par mil rahi hai.'
                : 'Market future growth ke liye premium daam mang raha hai — margin of safety kam hai.';

              const p4Score = isITorFMCG ? 94 : 82;
              const p4Badge = p4Score >= 85 ? 'COMPOUNDING BEAST (RoE > 20%)' : 'EFFICIENT CAPITAL ALLOCATOR';
              const p4Analogy = 'Shareholders ke lagaye har ₹100 par saal-dar-saal zabardast return nikal kar wealth multiply karti hai.';

              const p5Score = 90;
              const p5Badge = 'WIDE ECONOMIC MOAT';
              const p5Analogy = 'Ghar-ghar me jana-pehchana brand aur solid distribution network jise koi naya competitor asani se nahi tod sakta.';

              const overallScore = Math.round((p1Score + p2Score + p3Score + p4Score + p5Score) / 5);

              return (
                <div className="space-y-5">
                  <div className="bg-gradient-to-br from-violet-950/40 via-slate-900 to-indigo-950/40 border border-violet-500/30 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-48 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-xl bg-violet-500/20 text-violet-300 border border-violet-500/30">
                            <ShieldCheck className="w-5 h-5" />
                          </span>
                          <h3 className="text-lg font-black text-white">
                            5-Pillar Solvency &amp; Moat X-Ray
                          </h3>
                        </div>
                        <p className="mt-1 text-xs text-slate-300 max-w-lg leading-relaxed">
                          Visual fundamental diagnostic replacing complex balance sheet tables with 1-sentence plain Hindi &amp; English analogies.
                        </p>
                      </div>

                      <div className="text-right bg-slate-900/90 border border-violet-500/30 rounded-2xl p-3 sm:px-4 sm:py-2.5 shrink-0">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Overall Health Score</span>
                        <div className="flex items-baseline justify-end gap-1 mt-0.5">
                          <span className="text-3xl font-black font-mono text-emerald-400">{overallScore}</span>
                          <span className="text-xs text-slate-400 font-bold">/ 100</span>
                        </div>
                        <span className="text-[10px] font-extrabold text-violet-300 uppercase">
                          {overallScore >= 80 ? 'Fortress Grade' : 'Solid Fundamentals'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    {/* Pillar 1 */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-mono font-black text-xs">
                            1
                          </span>
                          <div>
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                              Debt Safety &amp; Solvency (कर्ज सुरक्षा)
                            </h4>
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                              Can the company survive severe recession storms?
                            </span>
                          </div>
                        </div>

                        <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {p1Badge} • {p1Score}/100
                        </span>
                      </div>

                      <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${p1Score}%` }} />
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-2.5 text-xs text-slate-700 dark:text-slate-200 font-medium">
                        💡 <strong>Plain Analogy:</strong> {p1Analogy}
                      </div>
                    </div>

                    {/* Pillar 2 */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-mono font-black text-xs">
                            2
                          </span>
                          <div>
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                              Profit Engine &amp; Margins (मुनाफा इंजन)
                            </h4>
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                              Operating cash flow generation &amp; pricing power
                            </span>
                          </div>
                        </div>

                        <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          {p2Badge} • {p2Score}/100
                        </span>
                      </div>

                      <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full bg-indigo-500 transition-all duration-500" style={{ width: `${p2Score}%` }} />
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-2.5 text-xs text-slate-700 dark:text-slate-200 font-medium">
                        💡 <strong>Plain Analogy:</strong> {p2Analogy}
                      </div>
                    </div>

                    {/* Pillar 3 */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center font-mono font-black text-xs">
                            3
                          </span>
                          <div>
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                              Valuation Reasonableness (कीमत व वैल्यूएशन)
                            </h4>
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                              P/E Multiple: {pe ? pe.toFixed(1) : '—'}x
                            </span>
                          </div>
                        </div>

                        <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          {p3Badge} • {p3Score}/100
                        </span>
                      </div>

                      <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full bg-amber-500 transition-all duration-500" style={{ width: `${p3Score}%` }} />
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-2.5 text-xs text-slate-700 dark:text-slate-200 font-medium">
                        💡 <strong>Plain Analogy:</strong> {p3Analogy}
                      </div>
                    </div>

                    {/* Pillar 4 */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 flex items-center justify-center font-mono font-black text-xs">
                            4
                          </span>
                          <div>
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                              Capital Efficiency &amp; RoE (पूंजी की ताकत)
                            </h4>
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                              Return on Equity &amp; capital compounding vitality
                            </span>
                          </div>
                        </div>

                        <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                          {p4Badge} • {p4Score}/100
                        </span>
                      </div>

                      <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full bg-violet-500 transition-all duration-500" style={{ width: `${p4Score}%` }} />
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-2.5 text-xs text-slate-700 dark:text-slate-200 font-medium">
                        💡 <strong>Plain Analogy:</strong> {p4Analogy}
                      </div>
                    </div>

                    {/* Pillar 5 */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-mono font-black text-xs">
                            5
                          </span>
                          <div>
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                              Economic Moat &amp; Brand Power (आर्थिक किला)
                            </h4>
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                              Competitive barrier to entry &amp; consumer brand trust
                            </span>
                          </div>
                        </div>

                        <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {p5Badge} • {p5Score}/100
                        </span>
                      </div>

                      <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${p5Score}%` }} />
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-2.5 text-xs text-slate-700 dark:text-slate-200 font-medium">
                        💡 <strong>Plain Analogy:</strong> {p5Analogy}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* TAB 2: DEDICATED TECHNICAL ANALYSIS DASHBOARD */}
            {activeSubTab === 'TECHNICALS' && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-amber-300 bg-amber-50 p-3 text-xs font-semibold leading-relaxed text-amber-950" role="note">
                  <strong>Educational technical model:</strong> RSI, moving averages, MACD and bands are illustrative estimates unless a sourced value is explicitly shown. Confirm them with an exchange-authorised chart before making a decision.
                </div>
                
                {/* RSI Gauge Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Gauge className="w-4 h-4 text-emerald-600" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                        Relative Strength Index (RSI - 14 Periods)
                      </h4>
                    </div>
                    <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                      technicals.rsi14 > 70 
                        ? 'bg-rose-100 text-rose-800' 
                        : technicals.rsi14 < 30 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {technicals.rsiStatus}
                    </span>
                  </div>

                  {/* Visual RSI Slider */}
                  <div className="relative h-4 bg-slate-50 rounded-full overflow-hidden my-3 border border-slate-200">
                    <div className="absolute inset-0 flex">
                      <div className="w-[30%] bg-emerald-400/50 border-r border-emerald-500" title="Oversold Zone (<30)"></div>
                      <div className="w-[40%] bg-amber-400/40 border-r border-amber-500" title="Neutral Zone (30-70)"></div>
                      <div className="w-[30%] bg-rose-400/50" title="Overbought Zone (>70)"></div>
                    </div>
                    {/* RSI Marker */}
                    <div 
                      className="absolute top-0 bottom-0 w-2 bg-slate-900 rounded-full shadow-md -ml-1 transition-all"
                      style={{ left: `${Math.min(100, Math.max(0, technicals.rsi14))}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                    <span>0 (Extremely Oversold)</span>
                    <span className="text-slate-900 font-black text-xs font-mono">Current RSI: {technicals.rsi14}</span>
                    <span>100 (Extremely Overbought)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    💡 <strong>Teen Explanation:</strong> RSI measures how fast people are buying or selling. Below 30 means &apos;discount bargain hunt&apos;, above 70 means &apos;price overheated&apos;.
                  </p>
                </div>

                {/* Moving Averages Matrix */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-slate-900" />
                      Moving Averages (Trend Strength)
                    </h4>
                    <span className="text-[11px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                      Trend: {technicals.trend}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-200">
                      <div className="text-[10px] text-slate-500 font-bold uppercase">20-Day EMA (Short)</div>
                      <div className="text-base font-black text-slate-900 font-mono mt-0.5">₹{technicals.ema20}</div>
                      <div className="text-[10px] text-emerald-700 font-bold mt-1">
                        {stock.price >= technicals.ema20 ? '🟢 Trading Above' : '🔴 Trading Below'}
                      </div>
                    </div>

                    <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-200">
                      <div className="text-[10px] text-slate-500 font-bold uppercase">50-Day SMA (Medium)</div>
                      <div className="text-base font-black text-slate-900 font-mono mt-0.5">₹{technicals.sma50}</div>
                      <div className="text-[10px] text-emerald-700 font-bold mt-1">
                        {stock.price >= technicals.sma50 ? '🟢 Trading Above' : '🔴 Trading Below'}
                      </div>
                    </div>

                    <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-200">
                      <div className="text-[10px] text-slate-500 font-bold uppercase">200-Day SMA (Long)</div>
                      <div className="text-base font-black text-slate-900 font-mono mt-0.5">₹{technicals.sma200}</div>
                      <div className="text-[10px] text-emerald-700 font-bold mt-1">
                        {stock.price >= technicals.sma200 ? '🟢 Strong Bull Trend' : '🔴 Bearish Phase'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* MACD & Bollinger Bands Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* MACD Card */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-slate-900 uppercase tracking-wider">MACD (12, 26, 9)</span>
                      <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                        {technicals.macd.signal}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center my-2 text-xs">
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                        <div className="text-[10px] text-slate-500">MACD Line</div>
                        <div className="font-mono font-black text-slate-900">{technicals.macd.macdLine}</div>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                        <div className="text-[10px] text-slate-500">Signal Line</div>
                        <div className="font-mono font-black text-slate-500">{technicals.macd.signalLine}</div>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                        <div className="text-[10px] text-slate-500">Histogram</div>
                        <div className="font-mono font-black text-emerald-700">{technicals.macd.histogram}</div>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      When MACD line crosses above the Signal line, momentum is shifting to the buyers!
                    </p>
                  </div>

                  {/* Bollinger Bands Card */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-slate-900 uppercase tracking-wider">Bollinger Bands (20, 2)</span>
                      <span className="text-[10px] font-black text-blue-800 bg-blue-100 px-2 py-0.5 rounded-md">
                        Volatility Envelope
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center my-2 text-xs">
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                        <div className="text-[10px] text-rose-700 font-bold">Upper Band</div>
                        <div className="font-mono font-black text-slate-900">₹{technicals.bollingerBands.upper}</div>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                        <div className="text-[10px] text-slate-500 font-bold">Middle (20 SMA)</div>
                        <div className="font-mono font-black text-slate-900">₹{technicals.bollingerBands.middle}</div>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                        <div className="text-[10px] text-emerald-700 font-bold">Lower Band</div>
                        <div className="font-mono font-black text-slate-900">₹{technicals.bollingerBands.lower}</div>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      95% of price action stays within the upper & lower bands.
                    </p>
                  </div>
                </div>

                {/* Support & Resistance Pivot Levels */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-slate-900" />
                    Key Pivot Support & Resistance Levels
                  </h4>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-xl">
                      <div className="text-[10px] font-black text-rose-800 uppercase">Support 2 (S2)</div>
                      <div className="text-sm font-black text-rose-700 font-mono mt-0.5">₹{technicals.support2}</div>
                      <div className="text-[10px] text-slate-500">Major Floor</div>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl">
                      <div className="text-[10px] font-black text-emerald-800 uppercase">Support 1 (S1)</div>
                      <div className="text-sm font-black text-emerald-700 font-mono mt-0.5">₹{technicals.support1}</div>
                      <div className="text-[10px] text-slate-500">Immediate Dip Buy</div>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl">
                      <div className="text-[10px] font-black text-amber-800 uppercase">Resistance 1 (R1)</div>
                      <div className="text-sm font-black text-amber-700 font-mono mt-0.5">₹{technicals.resistance1}</div>
                      <div className="text-[10px] text-slate-500">Immediate Ceiling</div>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 p-2.5 rounded-xl">
                      <div className="text-[10px] font-black text-purple-800 uppercase">Resistance 2 (R2)</div>
                      <div className="text-sm font-black text-purple-700 font-mono mt-0.5">₹{technicals.resistance2}</div>
                      <div className="text-[10px] text-slate-500">Breakout Target</div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 3: VALUATION & FINANCIALS */}
            {activeSubTab === 'FINANCIALS' && (
              <div className="space-y-4">
                {/* KEY FINANCIAL RATIOS & VALUATION (P/E RATIO, EPS, MKT CAP) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                  <h3 className="text-sm font-extrabold text-slate-900 mb-3 flex items-center justify-between">
                    <span>Key Financial Ratios & Fundamentals</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-extrabold ${
                      isValuationCheap ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-600/20 text-indigo-600'
                    }`}>
                      {isValuationCheap ? 'Attractive P/E vs Industry' : 'Growth Premium Valuation'}
                    </span>
                  </h3>
                  <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 text-[10px] font-bold text-slate-600"><span className="rounded-full bg-slate-900 px-2 py-1 text-white">{nseMarketInfo.isNSEMarketOpen ? 'DELAYED / LATEST AVAILABLE' : 'LAST CLOSE'}</span><span>Source: {screenerMeta ? 'Screener.in snapshot + RupeeRookie company dataset' : 'RupeeRookie company dataset'}</span><span>· Viewed {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span></div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    {/* P/E Ratio */}
                    <div className="bg-slate-50/40 p-2.5 rounded-xl border border-slate-200 relative group">
                      <div className="text-slate-500 flex items-center gap-1 font-bold">
                        P/E Ratio <Info className="w-3 h-3 text-slate-500" />
                      </div>
                      <div className="text-base font-black text-slate-900 mt-0.5">{stock.peRatio}</div>
                      <div className="text-[10px] text-slate-500 font-medium">Industry: {stock.industryPe}</div>
                    </div>

                    {/* Market Cap */}
                    <div className="bg-slate-50/40 p-2.5 rounded-xl border border-slate-200 ">
                      <div className="text-slate-500 font-bold">Market Cap</div>
                      <div className="text-base font-black text-slate-900 mt-0.5">{formatIndianShort(stock.marketCapCr * 10000000)}</div>
                      <div className="text-[10px] text-slate-500 font-medium">₹{formatNumberIndian(stock.marketCapCr)} Cr</div>
                    </div>

                    {/* Earnings Per Share */}
                    <div className="bg-slate-50/40 p-2.5 rounded-xl border border-slate-200 ">
                      <div className="text-slate-500 font-bold">EPS (TTM)</div>
                      <div className="text-base font-black text-slate-900 mt-0.5 font-mono">₹{stock.eps.toFixed(2)}</div>
                      <div className="text-[10px] text-slate-500 font-medium">Net Profit / Share</div>
                    </div>

                    {/* Dividend Yield */}
                    <div className="bg-slate-50/40 p-2.5 rounded-xl border border-slate-200 ">
                      <div className="text-slate-500 font-bold">Dividend Yield</div>
                      <div className="text-base font-black text-emerald-700 mt-0.5 font-mono">{stock.dividendYield}%</div>
                      <div className="text-[10px] text-slate-500 font-medium">Annual Cash Return</div>
                    </div>

                    {/* Book Value */}
                    <div className="bg-slate-50/40 p-2.5 rounded-xl border border-slate-200 ">
                      <div className="text-slate-500 font-bold">Book Value</div>
                      <div className="text-base font-black text-slate-900 mt-0.5 font-mono">₹{stock.bookValue.toFixed(2)}</div>
                      <div className="text-[10px] text-slate-500 font-medium">Net Asset Worth</div>
                    </div>

                    {/* Return on Equity (ROE) */}
                    <div className="bg-slate-50/40 p-2.5 rounded-xl border border-slate-200 ">
                      <div className="text-slate-500 font-bold">ROE</div>
                      <div className="text-base font-black text-emerald-700 mt-0.5 font-mono">{stock.roe}%</div>
                      <div className="text-[10px] text-slate-500 font-medium">Profitability Quality</div>
                    </div>

                    {/* Daily Volume */}
                    <div className="bg-slate-50/40 p-2.5 rounded-xl border border-slate-200 ">
                      <div className="text-slate-500 font-bold">Today&apos;s Volume</div>
                      <div className="text-base font-black text-slate-900 mt-0.5 font-mono">{formatNumberIndian(stock.volume)}</div>
                      <div className="text-[10px] text-slate-500 font-medium">Shares Traded</div>
                    </div>

                    {/* Beta (Volatility) */}
                    <div className="bg-slate-50/40 p-2.5 rounded-xl border border-slate-200 ">
                      <div className="text-slate-500 font-bold">Beta (Volatility)</div>
                      <div className="text-base font-black text-indigo-600 mt-0.5 font-mono">{stock.beta}</div>
                      <div className="text-[10px] text-slate-500 font-medium">{stock.beta > 1 ? 'Higher swings' : 'Steady mover'}</div>
                    </div>
                  </div>
                </div>

                {/* Screener.in Live Extracted Ratios & Audited Insights (if available) */}
                
                  {/* Corporate Actions & Earnings Calendar */}
                  {stock.corporateActions && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs mt-4">
                      <h3 className="text-sm font-extrabold text-slate-900 mb-3 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-indigo-600" />
                        Corporate Actions & Earnings
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {stock.corporateActions.earnings && stock.corporateActions.earnings.earningsDate && (
                          <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-start gap-3">
                            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-700">
                               <TrendingUp className="w-4 h-4" />
                            </div>
                            <div>
                               <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">Earnings Date</div>
                               <div className="text-xs font-bold text-slate-900 mt-1">
                                  {stock.corporateActions.earnings.earningsDate.map((d: any) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })).join(' - ')}
                               </div>
                            </div>
                          </div>
                        )}
                        {stock.corporateActions.dividendDate && (
                          <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-start gap-3">
                            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
                               <Coins className="w-4 h-4" />
                            </div>
                            <div>
                               <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">Ex-Dividend Date</div>
                               <div className="text-xs font-bold text-slate-900 mt-1">
                                  {new Date(stock.corporateActions.dividendDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                               </div>
                            </div>
                          </div>
                        )}
                        {stock.corporateActions.exDividendDate && !stock.corporateActions.dividendDate && (
                          <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-start gap-3">
                            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
                               <Coins className="w-4 h-4" />
                            </div>
                            <div>
                               <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">Ex-Dividend Date</div>
                               <div className="text-xs font-bold text-slate-900 mt-1">
                                  {new Date(stock.corporateActions.exDividendDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                               </div>
                            </div>
                          </div>
                        )}
                        {!stock.corporateActions.earnings && !stock.corporateActions.dividendDate && !stock.corporateActions.exDividendDate && (
                          <div className="text-xs text-slate-500 italic p-2">No upcoming calendar events available.</div>
                        )}
                      </div>
                    </div>
                  )}


                  {screenerMeta && screenerMeta.ratios && Object.keys(screenerMeta.ratios).length > 0 && (
                  <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                        <h4 className="text-xs font-black uppercase tracking-wider text-emerald-950">
                          Screener.in Financial Highlights
                        </h4>
                      </div>
                      <a
                        href={screenerMeta.screenerUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline flex items-center gap-1"
                      >
                        Detailed Financials <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {Object.entries(screenerMeta.ratios).slice(0, 8).map(([key, val]) => (
                        <div key={key} className="bg-emerald-50/50 p-2 rounded-xl border border-emerald-100">
                          <span className="text-[10px] text-emerald-800 font-semibold block">{key}</span>
                          <span className="font-mono font-bold text-slate-900">{String(val)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Screener Pros & Cons */}
                    {((screenerMeta.pros && screenerMeta.pros.length > 0) || (screenerMeta.cons && screenerMeta.cons.length > 0)) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        {screenerMeta.pros && screenerMeta.pros.length > 0 && (
                          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3">
                            <span className="text-[11px] font-black text-emerald-900 block mb-1">
                              ✓ Screener Audited Pros
                            </span>
                            <ul className="text-[11px] text-emerald-900/90 space-y-1">
                              {screenerMeta.pros.slice(0, 3).map((pro: string, idx: number) => (
                                <li key={idx}>• {pro}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {screenerMeta.cons && screenerMeta.cons.length > 0 && (
                          <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3">
                            <span className="text-[11px] font-black text-rose-900 block mb-1">
                              ⚠ Screener Audited Cons
                            </span>
                            <ul className="text-[11px] text-rose-900/90 space-y-1">
                              {screenerMeta.cons.slice(0, 3).map((con: string, idx: number) => (
                                <li key={idx}>• {con}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Interactive DuPont 3-Step ROE Decomposition */}
                {(() => {
                  const dupont = calculateDuPontAnalysis(stock);
                  return (
                    <div className="bg-white border border-indigo-200 rounded-2xl p-4 shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                            <Layers className="w-4 h-4" />
                          </span>
                          <div>
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                              DuPont 3-Step ROE Analysis
                            </h4>
                            <p className="text-[11px] text-slate-500 font-medium">
                              Deconstructing Return on Equity into Margin, Efficiency, & Leverage
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-black text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-200">
                          Total ROE: {dupont.roe}%
                        </span>
                      </div>

                      {/* Formula Visual Bar */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                          <span className="text-[10px] text-slate-500 font-bold uppercase block">1. Profit Margin</span>
                          <span className="text-base font-black text-emerald-700 font-mono mt-0.5 block">{dupont.netProfitMargin}%</span>
                          <span className="text-[10px] text-slate-500">Pricing Power / Costs</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                          <span className="text-[10px] text-slate-500 font-bold uppercase block">2. Asset Turnover</span>
                          <span className="text-base font-black text-blue-700 font-mono mt-0.5 block">{dupont.assetTurnover}x</span>
                          <span className="text-[10px] text-slate-500">Capital Asset Utilization</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                          <span className="text-[10px] text-slate-500 font-bold uppercase block">3. Equity Multiplier</span>
                          <span className="text-base font-black text-amber-700 font-mono mt-0.5 block">{dupont.equityMultiplier}x</span>
                          <span className="text-[10px] text-slate-500">Financial Leverage & Debt</span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-950 font-medium leading-relaxed">
                        <strong>Chanakya Fundamental Insight:</strong> {dupont.summary}
                      </div>
                    </div>
                  );
                })()}

                {/* Company Description */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-2">
                    Company Operations & Background
                  </h4>
                  <p className="text-xs text-zinc-700 leading-relaxed font-medium">
                    {stock.description}
                  </p>
                </div>
              </div>
            )}

            {/* TAB 4: RISK & POSITION SIZING CALCULATOR */}
            {activeSubTab === 'RISK_CALC' && (() => {
              const portfolioRiskBudget = (portfolioValue * riskMaxPortfolioPct) / 100;
              const stopLossPrice = stock.price * (1 - riskStopLossPct / 100);
              const targetProfitPrice = stock.price * (1 + riskTargetProfitPct / 100);
              const riskPerShare = stock.price - stopLossPrice;
              const rewardPerShare = targetProfitPrice - stock.price;
              const rrRatio = rewardPerShare / (riskPerShare || 1);
              const recommendedShares = Math.max(1, Math.min(maxAffordableShares > 0 ? maxAffordableShares : 100, Math.floor(portfolioRiskBudget / (riskPerShare || 1))));
              const totalRequiredCapital = recommendedShares * stock.price;
              const totalPotentialLoss = recommendedShares * riskPerShare;
              const totalPotentialGain = recommendedShares * rewardPerShare;

              return (
                <div className="space-y-4">
                  {/* Top Rule Banner */}
                  <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-indigo-950 text-white p-4 sm:p-5 rounded-2xl border border-indigo-800 shadow-xs">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-800/60 border border-indigo-700 flex items-center justify-center shrink-0">
                        <ShieldAlert className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-sm sm:text-base text-white">Dalal Street 2% Capital Risk Rule</h4>
                          <span className="bg-amber-400/20 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-400/30">
                            PRO RISK RULE
                          </span>
                        </div>
                        <p className="text-xs text-indigo-200 mt-1 leading-relaxed">
                          Never risk more than <strong>2%</strong> of your total portfolio on any single stock trade. This keeps your capital safe even during unexpected market corrections.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Sliders Grid */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                      <Calculator className="w-4 h-4 text-indigo-600" />
                      Adjust Your Trade Risk Parameters
                    </h4>

                    {/* Stop Loss Slider */}
                    <div>
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="font-bold text-zinc-700">Stop-Loss Cutoff:</span>
                        <span className="font-black text-rose-700 font-mono">
                          {riskStopLossPct}% (Exit at ₹{stopLossPrice.toFixed(2)})
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="20"
                        step="0.5"
                        value={riskStopLossPct}
                        onChange={(e) => setRiskStopLossPct(parseFloat(e.target.value))}
                        className="w-full h-2 bg-rose-100 rounded-lg appearance-none cursor-pointer accent-rose-600"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                        <span>Tight (1%)</span>
                        <span>Standard (5%)</span>
                        <span>Wide (20%)</span>
                      </div>
                    </div>

                    {/* Target Profit Slider */}
                    <div>
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="font-bold text-zinc-700">Target Profit Goal:</span>
                        <span className="font-black text-emerald-700 font-mono">
                          {riskTargetProfitPct}% (Target ₹{targetProfitPrice.toFixed(2)})
                        </span>
                      </div>
                      <input
                        type="range"
                        min="2"
                        max="50"
                        step="1"
                        value={riskTargetProfitPct}
                        onChange={(e) => setRiskTargetProfitPct(parseFloat(e.target.value))}
                        className="w-full h-2 bg-emerald-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                        <span>Conservative (5%)</span>
                        <span>Optimal (15%)</span>
                        <span>Multi-Bagger (50%)</span>
                      </div>
                    </div>

                    {/* Max Portfolio Risk Slider */}
                    <div>
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="font-bold text-zinc-700">Max Portfolio Risk per Trade:</span>
                        <span className="font-black text-indigo-700 font-mono">
                          {riskMaxPortfolioPct}% of Net Worth ({formatINR(portfolioRiskBudget)})
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="5"
                        step="0.5"
                        value={riskMaxPortfolioPct}
                        onChange={(e) => setRiskMaxPortfolioPct(parseFloat(e.target.value))}
                        className="w-full h-2 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                    </div>
                  </div>

                  {/* Calculated Output Matrix */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-xl text-center">
                      <span className="text-[10px] text-indigo-800 font-bold uppercase block">Risk:Reward</span>
                      <span className="text-base font-black text-indigo-950 font-mono mt-0.5 block">
                        1 : {rrRatio.toFixed(1)}
                      </span>
                      <span className={`text-[10px] font-bold ${rrRatio >= 2 ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {rrRatio >= 2 ? 'Excellent Ratio' : 'High Risk Ratio'}
                      </span>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-center">
                      <span className="text-[10px] text-emerald-800 font-bold uppercase block">Recommended Sizing</span>
                      <span className="text-base font-black text-emerald-950 font-mono mt-0.5 block">
                        {recommendedShares} Shares
                      </span>
                      <span className="text-[10px] text-slate-500">Safe Allocation</span>
                    </div>

                    <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-center">
                      <span className="text-[10px] text-rose-800 font-bold uppercase block">Max Loss in Trade</span>
                      <span className="text-base font-black text-rose-700 font-mono mt-0.5 block">
                        -{formatINR(totalPotentialLoss)}
                      </span>
                      <span className="text-[10px] text-rose-600 font-medium">If Stop-Loss Hit</span>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-center">
                      <span className="text-[10px] text-emerald-800 font-bold uppercase block">Potential Profit</span>
                      <span className="text-base font-black text-emerald-700 font-mono mt-0.5 block">
                        +{formatINR(totalPotentialGain)}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-medium">If Target Reached</span>
                    </div>
                  </div>

                  {/* Apply to Order Form Action Button */}
                  <div className="bg-white border border-slate-200 p-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                    <div className="text-xs text-zinc-700">
                      <span className="font-bold">Required Capital:</span> {formatINR(totalRequiredCapital)} for {recommendedShares} shares
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setQuantity(recommendedShares);
                        setTradeMessage({
                          text: `Applied calculated safe size of ${recommendedShares} shares to your order!`,
                          isError: false
                        });
                      }}
                      className="w-full sm:w-auto px-4 py-2 bg-indigo-900 hover:bg-indigo-950 text-white text-xs font-black rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Target className="w-3.5 h-3.5 text-amber-400" />
                      <span>Apply Safe Quantity ({recommendedShares} Shares)</span>
                    </button>
                  </div>
                </div>
              );
            })()}

          </div>

          {/* Right Column: Live Order Book & Instant Buy/Sell Execution Terminal */}
          <div className="space-y-6">
            
            {/* User Position in this Stock */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">Your Holdings</span>
                {currentHolding ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Active Holding
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-slate-400">
                    No open positions
                  </span>
                )}
              </div>

              {currentHolding ? (
                (() => {
                  const curVal = currentHolding.quantity * stock.price;
                  const totalGain = curVal - currentHolding.totalInvested;
                  const totalGainPct = currentHolding.totalInvested > 0 ? (totalGain / currentHolding.totalInvested) * 100 : 0;
                  const isTotalGain = totalGain >= 0;
                  
                  const stockDayChange = typeof stock.change === 'number' && !isNaN(stock.change) ? stock.change : (stock.price - stock.previousClose);
                  const stockDayChangePct = stock.previousClose > 0 ? (stockDayChange / stock.previousClose) * 100 : (stock.changePercent || 0);
                  const dayGain = stockDayChange * currentHolding.quantity;
                  const isDayGain = dayGain >= 0;

                  return (
                    <div className="mt-2 space-y-2.5">
                      <div className="flex justify-between items-baseline">
                        <span className="text-lg font-black text-slate-900">{currentHolding.quantity} Shares Owned</span>
                        <span className="text-xs font-extrabold text-slate-900 font-mono">
                          Avg: ₹{currentHolding.avgBuyPrice.toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 pt-1 pb-1 border-y border-slate-100 text-xs">
                        <div>
                          <span className="text-slate-500 block text-[10px]">Total Invested</span>
                          <span className="font-extrabold text-slate-900 font-mono">
                            {formatINR(currentHolding.totalInvested)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-500 block text-[10px]">Current Market Value</span>
                          <span className="font-extrabold text-slate-900 font-mono">
                            {formatINR(curVal)}
                          </span>
                        </div>
                      </div>

                      {/* Today's P&L and Total Unrealized P&L */}
                      <div className="space-y-1.5 pt-0.5 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-medium text-[11px]">Today&apos;s P&L (1-Day):</span>
                          <span className={`font-black font-mono text-xs ${isDayGain ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {isDayGain ? '+' : ''}{formatINR(dayGain)} ({formatPercent(stockDayChangePct)})
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-medium text-[11px]">Total Unrealized P&L:</span>
                          <span className={`font-black font-mono text-xs ${isTotalGain ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {isTotalGain ? '+' : ''}{formatINR(totalGain)} ({formatPercent(totalGainPct)})
                          </span>
                        </div>
                      </div>

                      {/* Direct Buy More & Sell Action Buttons */}
                      <div className="pt-2 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setOrderAction('BUY');
                            setTradeMessage(null);
                          }}
                          className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            orderAction === 'BUY'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>Buy More</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOrderAction('SELL');
                            setQuantity(currentHolding.quantity);
                            setTradeMessage(null);
                          }}
                          className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            orderAction === 'SELL'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          <TrendingDown className="w-3.5 h-3.5" />
                          <span>Sell Shares</span>
                        </button>
                      </div>

                      {/* Quick Quantity Shortcuts when selling */}
                      {orderAction === 'SELL' && (
                        <div className="pt-1.5 flex items-center gap-1">
                          <span className="text-[10px] text-slate-400 font-bold mr-1">Quick Sell:</span>
                          {[25, 50, 75, 100].map((pct) => {
                            const sellQty = Math.max(1, Math.floor((currentHolding.quantity * pct) / 100));
                            return (
                              <button
                                key={pct}
                                type="button"
                                onClick={() => {
                                  setQuantity(sellQty);
                                  setInvestmentAmount(Math.round(sellQty * executionPrice));
                                }}
                                className="flex-1 py-0.5 text-[10px] font-bold bg-slate-100 hover:bg-rose-100 hover:text-rose-800 rounded text-slate-700 transition-colors cursor-pointer"
                              >
                                {pct === 100 ? 'All' : `${pct}%`}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div className="mt-2 text-xs text-slate-500 italic font-medium">
                  You currently own 0 shares of {stock.symbol}. Use the form below to place your first buy order!
                </div>
              )}
            </div>

            {/* TRADE EXECUTION TERMINAL */}
            <div className="bg-white dark:bg-[#0c161d] border border-slate-200/90 dark:border-white/10 rounded-3xl p-5 sm:p-6 shadow-sm relative overflow-hidden space-y-4">
              {/* Header: Terminal Title & Available Margin */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-2xs ${
                    orderAction === 'BUY' ? 'bg-emerald-600' : 'bg-rose-600'
                  }`}>
                    {orderAction === 'BUY' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">Order Execution</h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Instant simulated NSE order routing</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Available Margin</div>
                  <div className="text-xs font-black font-mono text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/80 px-2.5 py-0.5 rounded-lg border border-slate-200 dark:border-white/10 mt-0.5">
                    {formatINR(cashBalance)}
                  </div>
                </div>
              </div>

              {/* REAL-TIME NSE MARKET HOURS STATUS & MODE TOGGLE */}
              <div className={`p-3 rounded-2xl border text-xs transition-all ${
                nseMarketInfo.isNSEMarketOpen 
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                  : marketHoursMode === 'STRICT_NSE_HOURS'
                    ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                    : 'bg-amber-50/80 border-amber-200 text-amber-950'
              }`}>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        nseMarketInfo.isNSEMarketOpen ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}></span>
                      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                        nseMarketInfo.isNSEMarketOpen ? 'bg-emerald-600' : 'bg-rose-600'
                      }`}></span>
                    </span>
                    <span className="font-extrabold uppercase tracking-wide text-[11px]">
                      {nseMarketInfo.statusLabel}
                    </span>
                  </div>

                  <span className="font-mono text-[10px] font-black bg-white/80 px-2 py-0.5 rounded-lg border border-black/10 text-slate-800">
                    {nseMarketInfo.nextSessionCountdown}
                  </span>
                </div>

                <div className="text-[10px] text-slate-600 flex flex-wrap items-center justify-between gap-1 mb-2">
                  <span>NSE Hours: <strong>09:15 AM – 03:30 PM IST (Mon–Fri)</strong></span>
                  <span className="font-mono text-slate-600 font-bold">IST: {nseMarketInfo.istTimeString}</span>
                </div>

                {/* Session Mode Selector Pill */}
                <div className="pt-2 border-t border-black/5 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-600 font-medium truncate">
                    {marketHoursMode === 'STRICT_NSE_HOURS'
                      ? '🔒 Strict NSE Trading Window'
                      : '⚡ 24/7 Practice Session'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const nextMode = marketHoursMode === 'STRICT_NSE_HOURS' ? 'PRACTICE_24x7' : 'STRICT_NSE_HOURS';
                      setMarketHoursMode(nextMode);
                      setTradeMessage(null);
                    }}
                    className={`text-[10px] font-black px-2.5 py-1 rounded-xl border transition-all cursor-pointer shrink-0 ${
                      marketHoursMode === 'STRICT_NSE_HOURS'
                        ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                        : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-900 shadow-2xs'
                    }`}
                  >
                    {marketHoursMode === 'STRICT_NSE_HOURS' 
                      ? 'Switch to 24/7 Practice' 
                      : 'Enforce Strict Hours'}
                  </button>
                </div>
              </div>

              {/* BUY / SELL Switch Tabs */}
              <div className="grid grid-cols-2 gap-2 bg-slate-100/80 dark:bg-slate-800/60 p-1 rounded-2xl border border-slate-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setOrderAction('BUY');
                    setTradeMessage(null);
                  }}
                  className={`py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    orderAction === 'BUY'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>BUY (Long)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOrderAction('SELL');
                    setTradeMessage(null);
                  }}
                  className={`py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    orderAction === 'SELL'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>SELL (Exit)</span>
                </button>
              </div>

              <form onSubmit={handleInitiateTrade} className="space-y-4">
                {/* Product Type (CNC vs MIS) */}
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
                    <span className="font-bold text-slate-700">Product Mode</span>
                    <span className="text-[10px] font-semibold text-amber-600">
                      {productType === 'CNC' ? 'Cash & Carry (Delivery 1x)' : 'Intraday MIS (5x Leverage)'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setProductType('CNC')}
                      className={`py-2 px-3 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                        productType === 'CNC'
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-white hover:text-slate-900'
                      }`}
                    >
                      CNC (Delivery 1x)
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductType('MIS')}
                      className={`py-2 px-3 rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        productType === 'MIS'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-white hover:text-slate-900'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>MIS (Intraday 5x)</span>
                    </button>
                  </div>
                  {productType === 'MIS' && (
                    <div className="mt-2 p-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 font-medium flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span><strong>5x Buying Power:</strong> Auto square-off at 3:20 PM IST.</span>
                    </div>
                  )}
                </div>

                {/* Order Type (Market vs Limit vs GTT) */}
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
                    <span className="font-bold text-slate-700">Order Execution Type</span>
                    <span className="text-[10px] font-semibold text-indigo-600">
                      {isGttOrder ? 'GTT Triggered Order' : orderType === 'MARKET' ? 'Market (Instant LTP)' : 'Limit Price'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsGttOrder(false);
                        setOrderType('MARKET');
                        setTradeMessage(null);
                      }}
                      className={`py-2 px-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                        !isGttOrder && orderType === 'MARKET'
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-white hover:text-slate-900'
                      }`}
                    >
                      Market
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsGttOrder(false);
                        setOrderType('LIMIT');
                        setTradeMessage(null);
                      }}
                      className={`py-2 px-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                        !isGttOrder && orderType === 'LIMIT'
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-white hover:text-slate-900'
                      }`}
                    >
                      Limit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsGttOrder(true);
                        setTradeMessage(null);
                      }}
                      className={`py-2 px-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                        isGttOrder
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-white hover:text-slate-900'
                      }`}
                    >
                      GTT Order
                    </button>
                  </div>
                </div>

                {/* GTT Trigger Price Input */}
                {isGttOrder && (
                  <div className="bg-indigo-50/50 p-3 rounded-2xl border border-indigo-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <label className="text-indigo-950 font-bold flex items-center gap-1">
                        <Target className="w-3.5 h-3.5 text-indigo-600" />
                        GTT Trigger Price (₹)
                      </label>
                      <span className="text-[10px] text-slate-500 font-mono">LTP: ₹{stock.price.toFixed(2)}</span>
                    </div>
                    <input
                      type="number"
                      step="0.05"
                      min="0.05"
                      value={gttTriggerPrice}
                      onChange={(e) => setGttTriggerPrice(Number(e.target.value))}
                      className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2 text-slate-900 font-black text-sm font-mono focus:outline-none focus:border-indigo-600"
                    />
                    <div className="text-[10px] text-indigo-800 font-medium">
                      Order stays active across simulated days until trigger price is reached.
                    </div>
                  </div>
                )}

                {/* Limit Price Input if Limit Order */}
                {!isGttOrder && orderType === 'LIMIT' && (
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <label className="text-slate-700 font-bold">
                        Target Limit Price
                      </label>
                      <span className="text-[10px] text-slate-500 font-mono">Current LTP: ₹{stock.price.toFixed(2)}</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                      <input
                        type="number"
                        step="0.05"
                        min="0.05"
                        value={limitPrice}
                        onChange={(e) => setLimitPrice(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-slate-900 font-black text-sm focus:outline-none focus:border-slate-900 font-mono shadow-2xs"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setLimitPrice(Number((stock.price * 0.98).toFixed(2)))}
                        className="flex-1 py-1 rounded-lg bg-white border border-slate-200 text-[10px] font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                      >
                        -2% Dip
                      </button>
                      <button
                        type="button"
                        onClick={() => setLimitPrice(stock.price)}
                        className="flex-1 py-1 rounded-lg bg-white border border-slate-200 text-[10px] font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                      >
                        Reset to LTP
                      </button>
                      <button
                        type="button"
                        onClick={() => setLimitPrice(Number((stock.price * 1.02).toFixed(2)))}
                        className="flex-1 py-1 rounded-lg bg-white border border-slate-200 text-[10px] font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                      >
                        +2% Target
                      </button>
                    </div>
                  </div>
                )}

                {/* Bracket Order (SL & Target) Toggle */}
                <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                      Attach Bracket Order (SL & Target)
                    </span>
                    <input
                      type="checkbox"
                      checked={isBracketOrder}
                      onChange={(e) => setIsBracketOrder(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </label>

                  {isBracketOrder && (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-700 block">Target Profit (%)</span>
                        <div className="flex items-center gap-1 mt-1">
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={bracketTargetPct}
                            onChange={(e) => setBracketTargetPct(Number(e.target.value))}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-900 font-bold font-mono text-xs"
                          />
                          <span className="text-slate-400 font-bold">%</span>
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">
                          ₹{(stock.price * (1 + bracketTargetPct / 100)).toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-rose-700 block">Stop-Loss (%)</span>
                        <div className="flex items-center gap-1 mt-1">
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={bracketStopLossPct}
                            onChange={(e) => setBracketStopLossPct(Number(e.target.value))}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-900 font-bold font-mono text-xs"
                          />
                          <span className="text-slate-400 font-bold">%</span>
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">
                          ₹{(stock.price * (1 - bracketStopLossPct / 100)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Investment Input Mode Switcher (By Quantity vs By Amount) */}
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
                    <span className="font-bold text-slate-700">Order Sizing Mode</span>
                    <span className="text-[10px] text-indigo-600 font-bold">
                      {tradeInputMode === 'QUANTITY' ? 'By Share Count' : 'By Target Budget (₹)'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200 mb-2.5">
                    <button
                      type="button"
                      onClick={() => setTradeInputMode('QUANTITY')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        tradeInputMode === 'QUANTITY'
                          ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>By Quantity</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTradeInputMode('AMOUNT')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        tradeInputMode === 'AMOUNT'
                          ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>By Amount (₹)</span>
                    </button>
                  </div>

                  {/* MODE 1: QUANTITY INPUT */}
                  {tradeInputMode === 'QUANTITY' ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                        <span className="font-bold text-slate-700">Number of Shares</span>
                        {orderAction === 'BUY' ? (
                          <span className="text-[11px] text-slate-800 font-bold bg-slate-100 px-2 py-0.5 rounded-md">
                            Max Buyable: <strong className="font-mono text-slate-900">{maxAffordableShares}</strong>
                          </span>
                        ) : (
                          <span className="text-[11px] text-rose-800 font-bold bg-rose-50 px-2 py-0.5 rounded-md">
                            Max Sellable: <strong className="font-mono text-rose-900">{maxSellableShares}</strong>
                          </span>
                        )}
                      </div>

                      {/* Stepper Input */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(Math.max(1, quantity - 1))}
                          className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 font-black text-base flex items-center justify-center cursor-pointer transition-colors shadow-2xs shrink-0"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={quantity || ''}
                          onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 0)}
                          placeholder="Shares"
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-center text-slate-900 font-black text-sm focus:outline-none focus:border-slate-900 focus:bg-white font-mono shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(quantity + 1)}
                          className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 font-black text-base flex items-center justify-center cursor-pointer transition-colors shadow-2xs shrink-0"
                        >
                          +
                        </button>
                      </div>

                      {/* Quick Quantity Preset Chips */}
                      <div className="flex items-center gap-1.5 pt-1">
                        {orderAction === 'SELL' && maxSellableShares > 0 ? (
                          <>
                            {[0.25, 0.5, 0.75].map((fraction) => {
                              const calculatedShares = Math.max(1, Math.floor(maxSellableShares * fraction));
                              return (
                                <button
                                  key={fraction}
                                  type="button"
                                  onClick={() => handleQuantityChange(calculatedShares)}
                                  className={`flex-1 py-1 rounded-lg border text-[11px] font-black transition-all cursor-pointer ${
                                    quantity === calculatedShares
                                      ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                                      : 'bg-rose-50/60 hover:bg-rose-100 border-rose-200 text-rose-800'
                                  }`}
                                >
                                  {fraction * 100}% ({calculatedShares})
                                </button>
                              );
                            })}
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(maxSellableShares)}
                              className={`py-1 px-2.5 rounded-lg border text-[11px] font-black transition-all cursor-pointer ${
                                quantity === maxSellableShares
                                  ? 'bg-rose-700 text-white border-rose-700 shadow-2xs'
                                  : 'bg-rose-600 hover:bg-rose-700 text-white border-rose-600'
                              }`}
                            >
                              SELL ALL ({maxSellableShares})
                            </button>
                          </>
                        ) : (
                          <>
                            {[1, 5, 10, 25, 50].map((qty) => (
                              <button
                                key={qty}
                                type="button"
                                onClick={() => handleQuantityChange(qty)}
                                className={`flex-1 py-1 rounded-lg border text-[11px] font-black transition-all cursor-pointer ${
                                  quantity === qty
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                                    : 'bg-slate-50 hover:bg-white border-slate-200 text-slate-700'
                                }`}
                              >
                                {qty}
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(Math.max(1, maxAffordableShares))}
                              className="py-1 px-2.5 rounded-lg bg-amber-100 hover:bg-amber-200 border border-amber-300 text-[11px] font-black text-amber-900 transition-colors cursor-pointer"
                            >
                              MAX
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* MODE 2: INVESTMENT AMOUNT INPUT */
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                        <span className="font-bold text-slate-700">Target Investment (₹)</span>
                        <span className="text-[11px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          Buys {quantity} Share(s)
                        </span>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                        <input
                          type="number"
                          min="1"
                          step="100"
                          value={investmentAmount}
                          onChange={(e) => handleAmountChange(e.target.value)}
                          placeholder="e.g. 10000"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-slate-900 font-black text-sm focus:outline-none focus:border-slate-900 focus:bg-white font-mono shadow-2xs"
                        />
                      </div>

                      {/* Quick Investment Amount Preset Chips */}
                      <div className="grid grid-cols-3 gap-1.5 pt-1">
                        {[5000, 10000, 25000, 50000, 100000].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => handleAmountChange(amt)}
                            className={`py-1 px-1.5 rounded-lg border text-[10px] font-black transition-all truncate cursor-pointer ${
                              Number(investmentAmount) === amt
                                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                                : 'bg-slate-50 hover:bg-white border-slate-200 text-slate-700'
                            }`}
                          >
                            ₹{amt >= 100000 ? `${amt / 100000} Lakh` : `${amt / 1000}k`}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => handleAmountChange(orderAction === 'BUY' ? Math.floor(cashBalance) : Math.floor(maxSellableShares * executionPrice))}
                          className="py-1 px-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 border border-amber-300 text-[10px] font-black text-amber-900 transition-colors cursor-pointer truncate"
                        >
                          MAX {orderAction === 'BUY' ? 'CASH' : 'HOLDINGS'}
                        </button>
                      </div>

                      {/* Amount to Quantity Live Calculation Note */}
                      <div className="text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-slate-700 font-medium">
                        <span>Calculated: <strong className="text-slate-900 font-black">{quantity} Shares</strong> @ ₹{executionPrice.toFixed(2)}</span>
                        <span className="font-mono text-emerald-800 font-black">{formatINR(totalTradeAmount)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {orderAction === 'BUY' && (
                  <fieldset className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-3.5">
                    <legend className="px-1 text-xs font-black text-indigo-950">Your trade plan · required</legend>
                    <p className="mb-3 text-[10px] leading-relaxed text-indigo-800">Define the risk before the order. These notes stay on this device and feed your journal reflection.</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="text-[11px] font-bold text-slate-700">Stop-loss / invalidation level (₹)<input type="number" min="0.05" step="0.05" value={invalidationLevel} onChange={(event) => setInvalidationLevel(Number(event.target.value))} className="mt-1 w-full rounded-xl border border-indigo-200 bg-white px-3 py-2 font-mono text-sm font-black outline-none focus:border-indigo-600" /></label>
                      <label className="text-[11px] font-bold text-slate-700">Maximum portfolio allocation<select value={maximumAllocationPct} onChange={(event) => setMaximumAllocationPct(Number(event.target.value))} className="mt-1 w-full rounded-xl border border-indigo-200 bg-white px-3 py-2 text-sm font-black outline-none focus:border-indigo-600"><option value={5}>5% · cautious</option><option value={10}>10% · standard cap</option><option value={15}>15% · elevated</option><option value={20}>20% · concentrated</option></select></label>
                    </div>
                    <label className="mt-3 block text-[11px] font-bold text-slate-700">Expected catalyst<textarea value={expectedCatalyst} onChange={(event) => setExpectedCatalyst(event.target.value)} maxLength={180} placeholder="Example: quarterly margin improvement, product launch, or debt reduction" className="mt-1 min-h-20 w-full resize-none rounded-xl border border-indigo-200 bg-white p-3 text-xs outline-none focus:border-indigo-600" /></label>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-bold"><span className="rounded-lg bg-white px-2 py-1">Planned allocation: {portfolioValue > 0 ? ((totalTradeAmount / portfolioValue) * 100).toFixed(1) : '0'}%</span><span className={`rounded-lg px-2 py-1 ${totalTradeAmount / (portfolioValue || 1) * 100 <= maximumAllocationPct ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>{totalTradeAmount / (portfolioValue || 1) * 100 <= maximumAllocationPct ? 'Within your cap' : 'Above your cap'}</span><button type="button" onClick={saveTradePlanDraft} className="ml-auto flex min-h-9 items-center gap-1.5 rounded-xl border border-indigo-300 bg-white px-3 text-indigo-800 hover:bg-indigo-100"><Save className="h-3.5 w-3.5" />Save draft</button>{draftMessage && <span role="status" className="w-full text-right text-emerald-700">{draftMessage}</span>}</div>
                  </fieldset>
                )}

                {/* Total Estimated Cost Breakdown */}
                <div className="bg-slate-50/90 p-3.5 rounded-2xl border border-slate-200 space-y-1.5 text-xs font-medium">
                  <div className="flex justify-between text-slate-500">
                    <span>Gross Order Value ({quantity} × ₹{executionPrice.toFixed(2)}):</span>
                    <span className="font-extrabold text-slate-900 font-mono">{formatINR(totalTradeAmount)}</span>
                  </div>
                  {productType === 'MIS' && (
                    <div className="flex justify-between text-amber-700 font-bold bg-amber-50 p-1.5 rounded-lg border border-amber-200">
                      <span className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-600" />
                        5x Intraday MIS Leverage:
                      </span>
                      <span>80% Margin Funded (₹{formatINR(totalTradeAmount * 0.8)})</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-500">
                    <span>Brokerage & Statutory Charges:</span>
                    <span className="text-emerald-700 font-bold">₹0.00 (Zero Fee)</span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 flex justify-between items-center font-bold">
                    <span className="text-slate-900 font-black">
                      {orderAction === 'BUY' 
                        ? (productType === 'MIS' ? 'Required 20% Cash Margin:' : 'Total Required Margin:') 
                        : 'Estimated Sale Proceeds:'}
                    </span>
                    <span className="text-slate-900 text-sm font-black font-mono">
                      {formatINR(orderAction === 'BUY' && productType === 'MIS' ? totalTradeAmount / 5 : totalTradeAmount)}
                    </span>
                  </div>
                </div>

                {/* Trade Execution Feedback Message */}
                {tradeMessage && (
                  <div className={`p-3 rounded-2xl text-xs font-bold ${
                    tradeMessage.isError
                      ? 'bg-rose-50 border border-rose-200 text-rose-800'
                      : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  }`}>
                    {tradeMessage.text}
                  </div>
                )}

                {/* CHANAKYA PRE-FLIGHT SAFETY TRADE CHECK */}
                {(() => {
                  const allocationPct = portfolioValue > 0 ? (totalTradeAmount / portfolioValue) * 100 : 0;
                  const sizingPass = allocationPct <= 15;
                  const rsiVal = technicals.rsi14 || 55;
                  const rsiPass = rsiVal <= 75;
                  const stopLossPass = isBracketOrder || invalidationLevel < stock.price;
                  const peVal = stock.peRatio || 25;
                  const moatPass = peVal <= 65;

                  const passCount = (sizingPass ? 1 : 0) + (rsiPass ? 1 : 0) + (stopLossPass ? 1 : 0) + (moatPass ? 1 : 0);

                  return (
                    <div className="rounded-2xl border border-violet-200 dark:border-violet-800/60 bg-violet-50/50 dark:bg-violet-950/20 p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setShowPreFlightAudit(!showPreFlightAudit)}
                          className="flex items-center gap-1.5 text-xs font-black text-violet-900 dark:text-violet-300 cursor-pointer"
                        >
                          <Zap className="w-3.5 h-3.5 text-amber-500" />
                          <span>Chanakya Pre-Flight Trade Check</span>
                          <span className={`text-[10px] font-mono px-2 py-0.2 rounded-full border ${
                            passCount === 4
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300'
                              : passCount === 3
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300'
                              : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-300'
                          }`}>
                            {passCount}/4 Safety Pass
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowPreFlightAudit(!showPreFlightAudit)}
                          className="text-[10px] font-bold text-violet-700 dark:text-violet-400 hover:underline cursor-pointer"
                        >
                          {showPreFlightAudit ? 'Hide' : 'Audit'}
                        </button>
                      </div>

                      {showPreFlightAudit && (
                        <div className="space-y-2 pt-1 border-t border-violet-100 dark:border-violet-900/40 text-[11px]">
                          {/* 4 Safety Badges Grid */}
                          <div className="grid grid-cols-2 gap-1.5">
                            {/* Check 1: Sizing */}
                            <div className={`p-2 rounded-xl border flex items-center gap-1.5 ${
                              sizingPass 
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200' 
                                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                            }`}>
                              <span className="font-mono text-xs">{sizingPass ? '✓' : '⚠'}</span>
                              <span className="truncate">
                                <strong>Sizing:</strong> {allocationPct.toFixed(1)}% {sizingPass ? '(≤15% safe)' : '(>15% heavy)'}
                              </span>
                            </div>

                            {/* Check 2: RSI */}
                            <div className={`p-2 rounded-xl border flex items-center gap-1.5 ${
                              rsiPass 
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200' 
                                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                            }`}>
                              <span className="font-mono text-xs">{rsiPass ? '✓' : '⚠'}</span>
                              <span className="truncate">
                                <strong>RSI:</strong> {rsiVal.toFixed(1)} {rsiPass ? '(Healthy)' : '(Overbought)'}
                              </span>
                            </div>

                            {/* Check 3: Stop-Loss */}
                            <div className={`p-2 rounded-xl border flex items-center gap-1.5 ${
                              stopLossPass 
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200' 
                                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                            }`}>
                              <span className="font-mono text-xs">{stopLossPass ? '✓' : '⚠'}</span>
                              <span className="truncate">
                                <strong>Protection:</strong> {stopLossPass ? 'SL Attached' : 'No Stop-Loss'}
                              </span>
                            </div>

                            {/* Check 4: Valuation Moat */}
                            <div className={`p-2 rounded-xl border flex items-center gap-1.5 ${
                              moatPass 
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200' 
                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                            }`}>
                              <span className="font-mono text-xs">{moatPass ? '✓' : 'ℹ'}</span>
                              <span className="truncate">
                                <strong>P/E:</strong> {peVal.toFixed(1)}x {moatPass ? '(Reasonable)' : '(Premium)'}
                              </span>
                            </div>
                          </div>

                          {/* Chanakya Verdict Banner */}
                          <div className={`p-2 rounded-xl text-[10px] font-bold leading-tight ${
                            passCount === 4
                              ? 'bg-emerald-100/70 dark:bg-emerald-950/70 text-emerald-950 dark:text-emerald-200'
                              : passCount === 3
                              ? 'bg-amber-100/70 dark:bg-amber-950/70 text-amber-950 dark:text-amber-200'
                              : 'bg-rose-100/70 dark:bg-rose-950/70 text-rose-950 dark:text-rose-200'
                          }`}>
                            {passCount === 4 && '🟢 Chanakya Verdict: Clear for takeoff! Position sizing and downside protection follow optimal risk rules.'}
                            {passCount === 3 && '🟡 Chanakya Verdict: Moderate risk profile. Ensure you attach a stop-loss or keep allocation below 15%.'}
                            {passCount < 3 && '🔴 Chanakya Verdict: High risk trade! You have heavy position sizing without a stop-loss buffer.'}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Action Submit Button (Opens Confirmation Detail Pop-up) */}
                <button
                  type="submit"
                  id="execute-trade-submit"
                  className={`w-full py-3.5 rounded-2xl font-black text-sm transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 ${
                    orderAction === 'BUY'
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 active:scale-[0.99]'
                      : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20 active:scale-[0.99]'
                  }`}
                >
                  {orderAction === 'BUY' ? (
                    <>
                      <TrendingUp className="w-4 h-4" />
                      <span>Buy {quantity} {quantity === 1 ? 'Share' : 'Shares'} • {formatINR(totalTradeAmount)}</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-4 h-4" />
                      <span>Sell {quantity} {quantity === 1 ? 'Share' : 'Shares'} • {formatINR(totalTradeAmount)}</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* LIVE MARKET DEPTH / ORDER BOOK */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs font-extrabold text-slate-900 mb-2">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-slate-900 " />
                  Simulated NSE Market Depth (Bids vs Asks)
                </span>
                <span className="text-[10px] text-slate-500 font-medium">SIMULATED · {nseMarketInfo.isNSEMarketOpen ? 'latest available' : 'market closed'}</span>
              </div>

              {orderBook ? (
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {/* Bids Column */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-black text-emerald-700 border-b border-slate-200 pb-1">
                      <span>BID (BUY)</span>
                      <span>QTY</span>
                    </div>
                    {orderBook.bids.map((b, i) => (
                      <div key={i} className="flex justify-between items-center text-zinc-700 font-medium">
                        <span className="font-extrabold text-emerald-700 font-mono">₹{b.price.toFixed(2)}</span>
                        <span className="text-slate-500 font-mono">{b.qty.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>

                  {/* Asks Column */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-black text-rose-700 border-b border-slate-200 pb-1">
                      <span>ASK (SELL)</span>
                      <span>QTY</span>
                    </div>
                    {orderBook.asks.map((a, i) => (
                      <div key={i} className="flex justify-between items-center text-zinc-700 font-medium">
                        <span className="font-extrabold text-rose-700 font-mono">₹{a.price.toFixed(2)}</span>
                        <span className="text-slate-500 font-mono">{a.qty.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-xs text-slate-500 font-medium">Preparing simulated order book...</div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* TRADE CONFIRMATION DETAIL POP-UP MODAL */}
      {showConfirmModal && (
        <div 
          id="trade-confirmation-modal-backdrop"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowConfirmModal(false)}
        >
          <div 
            id="trade-confirmation-modal-card"
            className="bg-white border-2 border-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 text-slate-900 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-2xl ${orderAction === 'BUY' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                  {orderAction === 'BUY' ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Confirm {orderAction === 'BUY' ? 'Buy Order' : 'Sell Order'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    NSE Virtual Simulator • Order Verification
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Prompt Notice */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs text-zinc-700 font-medium">
              Are you sure you want to <strong className={orderAction === 'BUY' ? 'text-emerald-700 font-black' : 'text-rose-700 font-black'}>
                {orderAction === 'BUY' ? 'BUY' : 'SELL'} {quantity} share(s)
              </strong> of <strong className="text-slate-900 font-black">{stock.name} ({stock.symbol})</strong> at the price of <strong className="text-slate-900 font-black">₹{executionPrice.toFixed(2)}</strong>?
            </div>

            {/* Order Breakdown Details */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60 font-medium">
                <span className="text-slate-500">Stock Asset</span>
                <span className="font-extrabold text-slate-900 text-right">
                  {stock.symbol} <span className="text-slate-500 font-normal">• {stock.sector}</span>
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60 font-medium">
                <span className="text-slate-500">Order Type</span>
                <span className="font-extrabold text-slate-900 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200">
                  {orderType === 'MARKET' ? 'Market (Instant LTP)' : `Limit (@ ₹${limitPrice.toFixed(2)})`}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60 font-medium">
                <span className="text-slate-500">Quantity</span>
                <span className="font-extrabold text-slate-900 font-mono text-sm">
                  {quantity} Shares
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60 font-medium">
                <span className="text-slate-500">Execution Price</span>
                <span className="font-extrabold text-slate-900 font-mono text-sm">
                  ₹{executionPrice.toFixed(2)} / share
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60 font-medium">
                <span className="text-slate-500">Order Execution State</span>
                <span className={`font-extrabold text-[11px] px-2 py-0.5 rounded-lg border ${
                  nseMarketInfo.isNSEMarketOpen || marketHoursMode === 'PRACTICE_24x7'
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    : 'bg-amber-100 text-amber-900 border-amber-300'
                }`}>
                  {nseMarketInfo.isNSEMarketOpen || marketHoursMode === 'PRACTICE_24x7'
                    ? '🟢 Immediate Execution'
                    : '⏳ Queued in Pending List (Executes 09:15 AM IST)'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 font-bold">
                <span className="text-sm text-slate-900 font-black">Total Investment / Value</span>
                <span className="text-base font-black font-mono text-slate-900">
                  {formatINR(totalTradeAmount)}
                </span>
              </div>
              {orderAction === 'BUY' && <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-[11px]"><p className="font-black text-indigo-950">Plan check</p><div className="mt-1 grid grid-cols-2 gap-2"><span>Invalid below <strong>₹{invalidationLevel.toFixed(2)}</strong></span><span>Max allocation <strong>{maximumAllocationPct}%</strong></span></div><p className="mt-2 leading-relaxed"><strong>Catalyst:</strong> {expectedCatalyst}</p></div>}
            </div>

            {/* Balance Impact / Post-Trade Projection */}
            <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-200 text-xs space-y-1.5 font-medium">
              <div className="flex justify-between text-slate-500">
                <span>Current Cash Balance:</span>
                <span className="font-bold text-slate-900 font-mono">{formatINR(cashBalance)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>{orderAction === 'BUY' ? 'Cash Balance After Trade:' : 'Cash Balance After Sale Proceeds:'}</span>
                <span className="font-extrabold text-slate-900 font-mono">
                  {formatINR(orderAction === 'BUY' ? cashBalance - totalTradeAmount : cashBalance + totalTradeAmount)}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Simulated Brokerage & STT:</span>
                <span className="text-emerald-700 font-bold">₹0.00 (Zero Fee)</span>
              </div>
            </div>

            {/* Confirmation Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="py-3 px-4 rounded-2xl bg-slate-50 hover:bg-slate-200 text-slate-900 font-extrabold text-xs border border-slate-200 transition-colors cursor-pointer"
              >
                Back & Edit
              </button>
              <button
                type="button"
                id="confirm-trade-execute"
                onClick={handleConfirmAndExecuteTrade}
                className={`py-3 px-4 rounded-2xl font-black text-xs text-white shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  orderAction === 'BUY'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                    : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Yes, Confirm & Place</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
