import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { quoteLabel } from '../../../utils/quoteState';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpDown, 
  Heart,
  Sparkles, 
  Activity,
  ArrowRight,
  Zap,
  Globe,
  Flame,
  LayoutGrid,
  TableProperties,
  Compass,
  Layers,
  CheckCircle2,
  ShoppingBag,
  ListFilter,
  BarChart3,
  Building2,
  Cpu,
  Landmark,
  Car,
  Pill,
  ShieldCheck,
  Tag,
  Bell,
  SlidersHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  X,
  ChevronRight,
  ChevronDown,
  Rocket,
  HelpCircle,
  Swords,
  Languages
} from 'lucide-react';
import { useSimulator } from '../../../context/SimulatorContext';
import { StockDetail } from '../../../types';
import { formatINR, formatPercent, formatIndianShort, formatNumberIndian, getDynamicMarketSessionBadge } from '../../../utils/formatters';
import { ThematicBasketsModal, ANGEL_THEMATIC_BASKETS, ThematicBasket } from '../../../components/ThematicBasketsModal';
import { QuickAlertModal } from './QuickAlertModal';
import { SpotlightCard } from '../../../components/ui/spotlight-card';
import { AnimatedSearchBar } from '../../../components/ui/animated-search-bar';
import { ExpandableTabs } from '../../../components/ui/expandable-tabs';
import { FilterTokenBar, FilterToken } from '../../../components/ui/filter-token-bar';
import { ThumbnailCarousel, CarouselSlideItem } from '../../../components/ui/thumbnail-carousel';
import { ShareBoxAreaChart } from '../../../components/ui/area-charts-2';

const getBenchmarkGradient = (id: string) => {
  switch (id) {
    case 'NIFTY_50':
      return 'bg-gradient-to-br from-amber-500 via-orange-500 to-emerald-600 text-white shadow-amber-500/25 border-amber-300/40';
    case 'SENSEX_30':
      return 'bg-gradient-to-br from-blue-600 to-indigo-800 text-white shadow-blue-500/25 border-blue-400/30';
    case 'NIFTY_IT':
      return 'bg-gradient-to-br from-cyan-600 to-indigo-600 text-white shadow-cyan-500/25 border-cyan-400/30';
    case 'NIFTY_BANK':
      return 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-emerald-500/25 border-emerald-400/30';
    case 'NIFTY_AUTO':
      return 'bg-gradient-to-br from-amber-500 to-red-600 text-white shadow-orange-500/25 border-amber-400/30';
    case 'NIFTY_PHARMA':
      return 'bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-rose-500/25 border-rose-400/30';
    case 'NIFTY_DEFENCE_PSU':
      return 'bg-gradient-to-br from-slate-800 via-indigo-950 to-slate-900 text-amber-300 shadow-slate-900/30 border-amber-400/30';
    case 'NIFTY_CONSUMER':
      return 'bg-gradient-to-br from-fuchsia-600 to-purple-700 text-white shadow-fuchsia-500/25 border-fuchsia-400/30';
    case 'NIFTY_GREEN_ENERGY':
      return 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-green-500/25 border-green-400/30';
    case 'NIFTY_METALS':
      return 'bg-gradient-to-br from-yellow-600 to-amber-700 text-white shadow-yellow-500/25 border-yellow-400/30';
    default:
      return 'bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-indigo-500/25 border-indigo-400/30';
  }
};

interface MarketScreenerProps {
  onSelectStock: (stock: StockDetail) => void;
  onOpenApiModal?: () => void;
}

import { BENCHMARK_INDEX_SUBHEADINGS, BenchmarkIndexInfo } from '../data/benchmarkIndices';
export type { BenchmarkIndexInfo };

// Rich Synonym & Keyword Dictionary for Natural Language Stock Finding
export { CLIENT_KEYWORD_MAP } from '../constants/marketKeywords';
import { CLIENT_KEYWORD_MAP } from '../constants/marketKeywords';

// Popular Teen Search Chips for Instant Filtering
const POPULAR_BRAND_CHIPS = [
  { name: 'Maggi', query: 'Maggi' },
  { name: 'Zudio', query: 'Zudio' },
  { name: 'Nifty IT', query: 'Nifty IT' },
  { name: 'Sensex 30', query: 'Sensex' },
  { name: 'Bullet 350', query: 'Bullet' },
  { name: 'Blinkit', query: 'Blinkit' },
  { name: 'Vande Bharat', query: 'Vande Bharat' },
  { name: 'Tejas Jet', query: 'Tejas' },
  { name: 'Jio 5G', query: 'Jio' },
  { name: 'Nifty Auto', query: 'Nifty Auto' },
  { name: 'Nifty Bank', query: 'Nifty Bank' },
  { name: 'Domino\'s', query: 'Domino\'s' },
];

export const MarketScreener: React.FC<MarketScreenerProps> = ({ onSelectStock, onOpenApiModal }) => {
  const { stocks, watchlist, toggleWatchlist, marketIndices, marketNews, executeBuyOrder, cashBalance, nseMarketInfo, isMarketLive, lastHoldingsSyncTime } = useSimulator();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBenchmark, setSelectedBenchmark] = useState<string>('ALL'); // 'ALL' or benchmark ID
  const [groupBySubheadings, setGroupBySubheadings] = useState<boolean>(true);
  const [selectedSector, setSelectedSector] = useState('ALL');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'GAINERS' | 'LOSERS' | '52W_HIGH' | '52W_LOW' | 'WATCHLIST'>('ALL');
  const [strategyPreset, setStrategyPreset] = useState<'ALL' | 'GOLDEN_CROSS' | 'HIGH_DIVIDEND' | 'HIGH_ROE' | 'RSI_DIP' | 'PSU_GIANTS' | 'MOMENTUM'>('ALL');
  const [sortBy, setSortBy] = useState<'POPULAR' | 'PRICE_HIGH' | 'PRICE_LOW' | 'GAIN_HIGH' | 'LOSS_HIGH' | 'PE_LOW' | 'MCAP_HIGH'>('POPULAR');
  const [viewMode, setViewMode] = useState<'CARDS' | 'TABLE'>('CARDS');
  const [visibleCount, setVisibleCount] = useState(100);
  const [catalogOffset, setCatalogOffset] = useState(100);
  const [hasMoreCatalog, setHasMoreCatalog] = useState(true);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const catalogBusy = useRef(false);

  const [isHindiMode, setIsHindiMode] = useState<boolean>(() => {
    try { return localStorage.getItem('rr_lang_hindi') === 'true'; } catch { return false; }
  });

  const toggleHindiMode = () => {
    setIsHindiMode(prev => {
      const next = !prev;
      try { localStorage.setItem('rr_lang_hindi', String(next)); } catch {}
      return next;
    });
  };

  const marketSession = getDynamicMarketSessionBadge();

  const fetchCatalogPage = useCallback(async (offset: number, limit: number) => {
    if (catalogBusy.current) return false;
    catalogBusy.current = true;
    setLoadingCatalog(true);
    try {
      const response = await fetch(`/api/stocks/catalog?offset=${offset}&limit=${limit}`);
      if (!response.ok) throw new Error('Catalog unavailable');
      const data = await response.json();
      if (!data.success || !Array.isArray(data.stocks)) throw new Error('Invalid catalog');
      window.dispatchEvent(new CustomEvent('rr_stocks_updated', { detail: { stocks: data.stocks } }));
      setCatalogOffset(data.nextOffset);
      setHasMoreCatalog(data.hasMore);
      return true;
    } catch (err) {
      console.warn('Could not load more catalog stocks:', err);
      return false;
    } finally {
      catalogBusy.current = false;
      setLoadingCatalog(false);
    }
  }, []);

  const [activeMarketSection, setActiveMarketSection] = useState<'EQUITIES' | 'BASKETS' | 'HEATMAP' | 'MOVERS'>('EQUITIES');

  // Angel One Modal & Interactive State
  const [selectedThematicBasket, setSelectedThematicBasket] = useState<ThematicBasket | null>(null);
  const [isBasketModalOpen, setIsBasketModalOpen] = useState(false);
  const [quickAlertStock, setQuickAlertStock] = useState<StockDetail | null>(null);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [activeIndexTab, setActiveIndexTab] = useState<'NIFTY50' | 'SENSEX' | 'BANKNIFTY' | 'NIFTYIT' | 'NIFTYAUTO' | 'NIFTYPHARMA' | 'DEFENCE'>('NIFTY50');

  const [liveSearchResults, setLiveSearchResults] = useState<{symbol: string, name: string}[]>([]);
  const [isSearchingLive, setIsSearchingLive] = useState(false);
  const [marketPulse, setMarketPulse] = useState<string>("Bulls leading Dalal Street with strong retail momentum in tech, EV, and quick commerce.");
  const [basketOrderMessage, setBasketOrderMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [collapsedBenchmarks, setCollapsedBenchmarks] = useState<Record<string, boolean>>({});

  const toggleBenchmarkCollapse = (id: string) => {
    setCollapsedBenchmarks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleQuickBasketInvest = (benchmarkName: string, stocksList: StockDetail[], amount: number = 25000) => {
    if (!stocksList.length) return;
    const perStockAmt = amount / stocksList.length;
    let count = 0;
    stocksList.forEach(s => {
      const qty = Math.max(1, Math.floor(perStockAmt / (s.price || 1)));
      if (qty > 0) {
        executeBuyOrder(s.symbol, qty, 'MARKET');
        count++;
      }
    });
    setBasketOrderMessage({
      text: `🎉 Successfully invested ${formatINR(amount)} evenly across ${count} equities in "${benchmarkName}"!`,
      isError: false
    });
    setTimeout(() => setBasketOrderMessage(null), 5000);
  };

  // Active Filter Tokens for Linear Composable Filter Token Bar
  const activeTokens: FilterToken[] = useMemo(() => {
    const list: FilterToken[] = [];
    if (selectedBenchmark !== 'ALL') {
      const bName = BENCHMARK_INDEX_SUBHEADINGS.find(b => b.id === selectedBenchmark)?.shortName || selectedBenchmark;
      list.push({ id: 'bench-token', field: 'Index', operator: '=', value: bName });
    }
    if (selectedSector !== 'ALL') {
      list.push({ id: 'sector-token', field: 'Sector', operator: '=', value: selectedSector });
    }
    if (selectedFilter !== 'ALL') {
      list.push({ id: 'filter-token', field: 'Filter', operator: '=', value: selectedFilter });
    }
    if (strategyPreset !== 'ALL') {
      list.push({ id: 'strat-token', field: 'Preset', operator: '=', value: strategyPreset });
    }
    if (searchQuery.trim()) {
      list.push({ id: 'search-token', field: 'Search', operator: 'contains', value: searchQuery.trim() });
    }
    return list;
  }, [selectedBenchmark, selectedSector, selectedFilter, strategyPreset, searchQuery]);

  const handleRemoveToken = (tokenId: string) => {
    if (tokenId === 'bench-token') setSelectedBenchmark('ALL');
    if (tokenId === 'sector-token') setSelectedSector('ALL');
    if (tokenId === 'filter-token') setSelectedFilter('ALL');
    if (tokenId === 'strat-token') setStrategyPreset('ALL');
    if (tokenId === 'search-token') setSearchQuery('');
  };

  const handleClearAllTokens = () => {
    setSelectedBenchmark('ALL');
    setSelectedSector('ALL');
    setSelectedFilter('ALL');
    setStrategyPreset('ALL');
    setSearchQuery('');
  };

  // Keep the request stable while streaming prices change.
  const trackedSymbols = stocks.map(stock => stock.symbol).join(',');
  useEffect(() => {
    const controller = new AbortController();
    if (searchQuery.trim().length < 2) {
      setLiveSearchResults([]);
      setIsSearchingLive(false);
      return;
    }
    setIsSearchingLive(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(searchQuery.trim())}`, { signal: controller.signal });
        if (!res.ok) throw new Error('Search unavailable');
        const data = await res.json();
        const existing = new Set(trackedSymbols.split(','));
        setLiveSearchResults((data.results || []).filter((stock: any) => !existing.has(stock.symbol)));
      } catch {
        if (!controller.signal.aborted) setLiveSearchResults([]);
      } finally {
        if (!controller.signal.aborted) setIsSearchingLive(false);
      }
    }, 400);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [searchQuery, trackedSymbols]);

  useEffect(() => {
    fetch('/api/market-pulse')
      .then(r => r.json())
      .then(d => {
        if (d.success) setMarketPulse(d.pulse);
      })
      .catch(() => setMarketPulse("Dalal Street trading with high liquidity & teen participation today!"));
  }, []);

  const handleTrackLiveStock = async (symbol: string) => {
    try {
      const res = await fetch('/api/stocks/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol })
      });
      const data = await res.json();
      if (data.success && data.stock) {
        window.dispatchEvent(new CustomEvent('rr_stocks_updated', { detail: { stocks: [data.stock] } }));
        onSelectStock(data.stock);
        setSearchQuery('');
        setLiveSearchResults([]);
      } else {
        console.warn(data.error || 'Quote unavailable.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helper to determine which benchmark indices a stock belongs to
  const getStockIndices = useMemo(() => {
    return (symbol: string): string[] => {
      const matched: string[] = [];
      BENCHMARK_INDEX_SUBHEADINGS.forEach(b => {
        if (b.symbols.includes(symbol)) {
          matched.push(b.shortName);
        }
      });
      return matched;
    };
  }, []);

  // Sectors list
  const sectors = useMemo(() => {
    const set = new Set<string>();
    stocks.forEach((s) => set.add(s.sector));
    return ['ALL', ...Array.from(set)];
  }, [stocks]);

  // Market Highlights
  const topGainer = useMemo(() => {
    if (stocks.length === 0) return null;
    return [...stocks].sort((a, b) => b.changePercent - a.changePercent)[0];
  }, [stocks]);

  const topLoser = useMemo(() => {
    if (stocks.length === 0) return null;
    return [...stocks].sort((a, b) => a.changePercent - b.changePercent)[0];
  }, [stocks]);

  const mostActive = useMemo(() => {
    if (stocks.length === 0) return null;
    return [...stocks].sort((a, b) => b.volume - a.volume)[0];
  }, [stocks]);

  const near52WHighStock = useMemo(() => {
    if (stocks.length === 0) return null;
    return [...stocks].sort((a, b) => {
      const aDiff = Math.abs(a.price - (a.high52 || a.price));
      const bDiff = Math.abs(b.price - (b.high52 || b.price));
      return aDiff - bDiff;
    })[0];
  }, [stocks]);

  // Market Breadth (Advances vs Declines)
  const marketBreadth = useMemo(() => {
    let advances = 0;
    let declines = 0;
    let neutral = 0;
    stocks.forEach((s) => {
      if (s.changePercent > 0.05) advances++;
      else if (s.changePercent < -0.05) declines++;
      else neutral++;
    });
    const total = advances + declines + neutral || 1;
    return {
      advances,
      declines,
      neutral,
      advancePct: Math.round((advances / total) * 100),
      declinePct: Math.round((declines / total) * 100)
    };
  }, [stocks]);

  // Live Sector Heatmap & Money Flow Stats
  const sectorHeatmapStats = useMemo(() => {
    const map: Record<string, { totalGain: number; count: number; bestStock: StockDetail }> = {};
    stocks.forEach((s) => {
      if (!map[s.sector]) {
        map[s.sector] = { totalGain: 0, count: 0, bestStock: s };
      }
      map[s.sector].totalGain += s.changePercent;
      map[s.sector].count += 1;
      if (s.changePercent > map[s.sector].bestStock.changePercent) {
        map[s.sector].bestStock = s;
      }
    });
    return Object.entries(map).map(([sec, data]) => ({
      sector: sec,
      avgChange: data.totalGain / (data.count || 1),
      count: data.count,
      bestStock: data.bestStock
    })).sort((a, b) => b.avgChange - a.avgChange);
  }, [stocks]);

  // Matching reason lookup for search results
  const getStockMatchReason = useMemo(() => {
    return (stock: StockDetail, query: string): string | null => {
      const q = query.toLowerCase().trim();
      if (!q) return null;
      if (stock.symbol.toLowerCase() === q) return `Exact Symbol Match`;
      if (stock.name.toLowerCase().includes(q)) return `Matched Company Name`;
      if (stock.popularBrands?.some(b => b.toLowerCase().includes(q))) {
        const found = stock.popularBrands.find(b => b.toLowerCase().includes(q));
        return `Brand: ${found}`;
      }
      for (const [key, symbols] of Object.entries(CLIENT_KEYWORD_MAP)) {
        if ((q.includes(key) || key.includes(q)) && symbols.includes(stock.symbol)) {
          return `Keyword: "${key}"`;
        }
      }
      return null;
    };
  }, []);

  // Filtered and Sorted Stocks List
  const filteredStocks = useMemo(() => {
    return stocks.filter((stock) => {
      // 1. Natural Language & Keyword Search Match
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchesSymbol = stock.symbol.toLowerCase().includes(q);
        const matchesName = stock.name.toLowerCase().includes(q);
        const matchesSector = stock.sector.toLowerCase().includes(q);
        const matchesBrands = stock.popularBrands?.some(b => b.toLowerCase().includes(q));
        const matchesTeenSummary = stock.teenSummary?.toLowerCase().includes(q);
        const matchesDescription = stock.description?.toLowerCase().includes(q);

        // Check if query matches keyword map
        let matchesKeywordMap = false;
        for (const [key, symbols] of Object.entries(CLIENT_KEYWORD_MAP)) {
          if ((q.includes(key) || key.includes(q)) && symbols.includes(stock.symbol)) {
            matchesKeywordMap = true;
            break;
          }
        }

        if (!matchesSymbol && !matchesName && !matchesSector && !matchesBrands && !matchesTeenSummary && !matchesDescription && !matchesKeywordMap) {
          return false;
        }
      }

      // 2. Selected Benchmark Index Filter
      if (selectedBenchmark !== 'ALL') {
        const benchmarkDef = BENCHMARK_INDEX_SUBHEADINGS.find(b => b.id === selectedBenchmark);
        if (benchmarkDef && !benchmarkDef.symbols.includes(stock.symbol)) {
          return false;
        }
      }

      // 3. Sector filter
      if (selectedSector !== 'ALL' && stock.sector !== selectedSector) return false;

      // 4. Highlight Filter Tabs
      if (selectedFilter === 'GAINERS' && stock.changePercent <= 0) return false;
      if (selectedFilter === 'LOSERS' && stock.changePercent >= 0) return false;
      if (selectedFilter === '52W_HIGH' && (stock.price / stock.high52) < 0.90) return false;
      if (selectedFilter === '52W_LOW' && ((stock.price - stock.low52) / (stock.low52 || 1)) > 0.25) return false;
      if (selectedFilter === 'WATCHLIST' && !watchlist.includes(stock.symbol)) return false;

      // 5. Strategy Screener Presets
      if (strategyPreset === 'GOLDEN_CROSS') {
        const ema50 = stock.ema50 || stock.price * 1.01;
        const ema200 = stock.ema200 || stock.price * 0.97;
        if (ema50 < ema200) return false;
      }
      if (strategyPreset === 'HIGH_DIVIDEND') {
        if (stock.dividendYield < 2.0 || stock.peRatio > 26) return false;
      }
      if (strategyPreset === 'HIGH_ROE') {
        if ((stock.roe || 12) < 16) return false;
      }
      if (strategyPreset === 'RSI_DIP') {
        const rsi = stock.rsi14 || 50;
        if (rsi > 46 && stock.changePercent > -1.0) return false;
      }
      if (strategyPreset === 'PSU_GIANTS') {
        const psuSymbols = ['SBIN', 'HAL', 'BEL', 'RVNL', 'IRFC', 'IRCTC', 'NTPC', 'ONGC', 'POWERGRID', 'COALINDIA', 'SAIL', 'IOC', 'BPCL', 'GAIL', 'PFC', 'RECLTD', 'IREDA', 'BANKBARODA', 'PNB', 'NHPC', 'SJVN'];
        if (!psuSymbols.includes(stock.symbol)) return false;
      }
      if (strategyPreset === 'MOMENTUM') {
        if (stock.price < (stock.high52 * 0.93)) return false;
      }

      return true;
    }).sort((a, b) => {
      // If searching, prioritize stocks that directly match keyword
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const aExact = a.symbol.toLowerCase() === q ? 2 : (a.popularBrands?.some(br => br.toLowerCase().includes(q)) ? 1 : 0);
        const bExact = b.symbol.toLowerCase() === q ? 2 : (b.popularBrands?.some(br => br.toLowerCase().includes(q)) ? 1 : 0);
        if (aExact !== bExact) return bExact - aExact;
      }

      if (sortBy === 'PRICE_HIGH') return b.price - a.price;
      if (sortBy === 'PRICE_LOW') return a.price - b.price;
      if (sortBy === 'GAIN_HIGH') return b.changePercent - a.changePercent;
      if (sortBy === 'LOSS_HIGH') return a.changePercent - b.changePercent;
      if (sortBy === 'PE_LOW') return a.peRatio - b.peRatio;
      if (sortBy === 'MCAP_HIGH') return b.marketCapCr - a.marketCapCr;
      return 0;
    });
  }, [stocks, searchQuery, selectedBenchmark, selectedSector, selectedFilter, strategyPreset, sortBy, watchlist]);

  useEffect(() => {
    setVisibleCount(100);
  }, [searchQuery, selectedBenchmark, selectedSector, selectedFilter, strategyPreset, sortBy, viewMode]);

  const displayedStocks = useMemo(() => filteredStocks.slice(0, visibleCount), [filteredStocks, visibleCount]);

  const unfiltered = !searchQuery.trim() && selectedBenchmark === 'ALL' && selectedSector === 'ALL' &&
    selectedFilter === 'ALL' && strategyPreset === 'ALL';
  const canLoadMore = displayedStocks.length < filteredStocks.length || (unfiltered && hasMoreCatalog);
  const loadMoreStocks = useCallback(async () => {
    if (catalogBusy.current) return;
    if (visibleCount < filteredStocks.length) {
      setVisibleCount(count => Math.min(count + 10, filteredStocks.length));
      return;
    }
    if (unfiltered && hasMoreCatalog) {
      const ok = await fetchCatalogPage(catalogOffset, 10);
      if (ok) {
        setVisibleCount(count => count + 10);
      }
    }
  }, [visibleCount, filteredStocks.length, unfiltered, hasMoreCatalog, fetchCatalogPage, catalogOffset]);

  // Grouped Stocks under each Benchmark Subheading
  const benchmarkGroupedSections = useMemo(() => {
    if (selectedBenchmark !== 'ALL') {
      const b = BENCHMARK_INDEX_SUBHEADINGS.find(item => item.id === selectedBenchmark);
      if (!b) return [];
      const groupStocks = displayedStocks.filter(s => b.symbols.includes(s.symbol));
      return groupStocks.length > 0 ? [{ benchmark: b, stocks: groupStocks }] : [];
    }

    const sections: Array<{ benchmark: BenchmarkIndexInfo; stocks: StockDetail[] }> = [];
    BENCHMARK_INDEX_SUBHEADINGS.forEach((b) => {
      const groupStocks = displayedStocks.filter(s => b.symbols.includes(s.symbol));
      if (groupStocks.length > 0) {
        sections.push({
          benchmark: b,
          stocks: groupStocks
        });
      }
    });

    // Also include other listed equities not in the predefined benchmark baskets
    const allBenchmarkSymbols = new Set(BENCHMARK_INDEX_SUBHEADINGS.flatMap(b => b.symbols));
    const unassignedStocks = displayedStocks.filter(s => !allBenchmarkSymbols.has(s.symbol));
    if (unassignedStocks.length > 0) {
      sections.push({
        benchmark: {
          id: 'OTHER_EQUITIES',
          name: 'OTHER DALAL STREET EQUITIES',
          shortName: 'MID & SMALLCAP',
          icon: '✨',
          tagline: 'High Growth Emerging Leaders',
          description: 'Specialized mid-cap and emerging market leaders with strong retail interest.',
          symbols: []
        },
        stocks: unassignedStocks
      });
    }

    return sections;
  }, [displayedStocks, selectedBenchmark]);

  // Curated Market Opportunities & Thematic Baskets for ThumbnailCarousel
  const marketOpportunitySlides: CarouselSlideItem[] = useMemo(() => [
    {
      id: 'slide-nifty50',
      title: "NIFTY 50 Bluechip Core",
      subtitle: "India's 50 Most Liquid Market Leaders",
      tag: "FLAGSHIP BENCHMARK",
      badge: "50 Bluechips",
      badgeType: "positive",
      description: "Anchor your portfolio with India's largest conglomerates: Reliance Industries, TCS, HDFC Bank, Infosys, and Tata Motors. Low systemic volatility and steady compounding.",
      stats: [
        { label: "Index P/E", value: "21.8x" },
        { label: "Avg Div Yield", value: "1.42%" },
        { label: "Total MCap", value: "₹185L Cr" },
        { label: "1Y Return", value: "+18.4%", isPositive: true }
      ],
      actionLabel: "Focus NIFTY 50",
      onAction: () => {
        setSelectedBenchmark('NIFTY_50');
        setSelectedSector('ALL');
      }
    },
    {
      id: 'slide-auto-ev',
      title: "Automotive & Electric Mobility",
      subtitle: "Clean Tech & EV Transition Champions",
      tag: "HIGH MOMENTUM",
      badge: "16 Equities",
      badgeType: "highlight",
      description: "Capture the green mobility revolution across Tata Motors, Mahindra & Mahindra, Maruti Suzuki, TVS Motor, and Ola Electric as EV penetration accelerates across India.",
      stats: [
        { label: "Segment CAGR", value: "24.5%" },
        { label: "Top Mover", value: "TATAMOTORS" },
        { label: "Avg Gain", value: "+2.8%", isPositive: true },
        { label: "EV Share", value: "14%+" }
      ],
      actionLabel: "Focus NIFTY AUTO",
      onAction: () => {
        setSelectedBenchmark('NIFTY_AUTO');
        setSelectedSector('ALL');
      }
    },
    {
      id: 'slide-defence-psu',
      title: "Defence & Strategic Maharatnas",
      subtitle: "Vande Bharat, Tejas & Sovereign Infra",
      tag: "SOVEREIGN ORDERBOOK",
      badge: "25 PSU Titans",
      badgeType: "positive",
      description: "State-backed industrial fortresses: HAL, Bharat Electronics, RVNL, IRFC, and NTPC with multi-year government orderbooks, robust balance sheets, and high dividend payouts.",
      stats: [
        { label: "Orderbook", value: "₹4.8L Cr" },
        { label: "Div Yield", value: "3.1%" },
        { label: "Govt Share", value: "51-75%" },
        { label: "ROE", value: "19.2%", isPositive: true }
      ],
      actionLabel: "Focus Defence & PSU",
      onAction: () => {
        setSelectedBenchmark('NIFTY_DEFENCE_PSU');
        setSelectedSector('ALL');
      }
    },
    {
      id: 'slide-consumer-qcom',
      title: "Quick Commerce & Retail Brands",
      subtitle: "10-Minute Deliveries & Gen-Z Fashion",
      tag: "CONSUMPTION BOOM",
      badge: "23 Consumer Plays",
      badgeType: "highlight",
      description: "Indian urban consumption superstars: Zomato (Blinkit), Swiggy, Trent (Zudio), Titan, and Nestle (Maggi) powering modern everyday Indian consumer habits.",
      stats: [
        { label: "Order Velocity", value: "10-min" },
        { label: "Retail Base", value: "1.4B" },
        { label: "Top Gainer", value: "TRENT" },
        { label: "Growth YoY", value: "+32%", isPositive: true }
      ],
      actionLabel: "Focus Consumer & Retail",
      onAction: () => {
        setSelectedBenchmark('NIFTY_CONSUMER');
        setSelectedSector('ALL');
      }
    },
    {
      id: 'slide-banking',
      title: "Banking Fortress & NBFCs",
      subtitle: "Credit Expansion & Retail Lending Giants",
      tag: "ECONOMIC ENGINE",
      badge: "18 Lenders",
      badgeType: "positive",
      description: "The credit pulse of corporate and consumer India: HDFC Bank, ICICI Bank, State Bank of India, and Axis Bank with pristine asset quality and multi-decade ROAs.",
      stats: [
        { label: "Credit Growth", value: "14.2%" },
        { label: "NIMs", value: "3.85%" },
        { label: "Net NPA", value: "< 0.8%" },
        { label: "Capital Adequacy", value: "16.8%", isPositive: true }
      ],
      actionLabel: "Focus Banking Titans",
      onAction: () => {
        setSelectedSector('Banking');
        setSelectedBenchmark('ALL');
      }
    }
  ], []);

  return (
    <div className="rr-surfaces space-y-6 min-w-0 max-w-full overflow-hidden">
      {/* 1. DYNAMIC MARKET CONTEXT & QUICK TOOLS HEADER */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black border shadow-2xs ${marketSession.style}`}>
            <span>{marketSession.dot}</span>
            <span>{marketSession.label}</span>
          </span>
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 font-bold">
            IST: {nseMarketInfo.istTimeString}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:justify-end">
          {/* Bilingual Hindi/English Toggle */}
          <button
            type="button"
            onClick={toggleHindiMode}
            className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
              isHindiMode 
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-black' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 font-bold'
            }`}
            title="Toggle Hindi/English terms (Bhav, Labh/Hani, Tiraskrit)"
          >
            <Languages className="w-3.5 h-3.5" />
            <span>{isHindiMode ? '🌐 हिंदी (Hindi Active)' : '🌐 English / हिंदी'}</span>
          </button>

          {/* Quick-action button: Head-to-Head Stock Battle */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-stock-battle'))}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-xs shadow-md shadow-violet-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
            title="1v1 Head-to-Head Stock Battle Mode"
          >
            <Swords className="w-3.5 h-3.5 text-amber-300" />
            <span>⚔️ Stock Battle</span>
          </button>

          {/* Quick-action button: Options Chain & Greeks */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-options-chain'))}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
            title="Options Chain Greek & IV Smile Visualizer"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>⚡ Options Chain</span>
          </button>
        </div>
      </div>

      <div className={`flex flex-col gap-2 rounded-2xl border p-3 text-xs sm:flex-row sm:items-center sm:justify-between ${isMarketLive ? 'border-emerald-200 bg-emerald-50 text-emerald-950' : 'border-amber-200 bg-amber-50 text-amber-950'}`} role="status">
        <div className="flex items-center gap-2"><span className={`rounded-full px-2 py-1 text-[9px] font-black ${isMarketLive ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-slate-950 dark:text-slate-950'}`}>{isMarketLive ? 'LATEST' : nseMarketInfo.isNSEMarketOpen ? 'DELAYED' : 'LAST CLOSE'}</span><span className="font-bold">{isMarketLive ? 'Latest available provider quote; exchange data may be delayed.' : nseMarketInfo.isNSEMarketOpen ? 'The feed may be delayed. Confirm important figures with an exchange-authorised source.' : 'Market is closed. Figures show the last available session; live-style language is disabled.'}</span></div><span className="shrink-0 font-mono text-[10px]">Updated {lastHoldingsSyncTime} IST · RupeeRookie market feed</span>
      </div>
      {/* 2. DEDICATED VIEW SECTIONS (SHOWN BASED ON ACTIVE TAB) */}

      {/* A. THEMATIC BASKETS SECTION */}
      {activeMarketSection === 'BASKETS' && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-sm space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-400 text-slate-950 dark:text-slate-950 flex items-center justify-center text-xl shadow-sm font-black shrink-0">
                🎯
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-black text-white">Curated Thematic Baskets</h4>
                  <span className="bg-amber-400/20 text-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border border-amber-400/30">
                    Smart Portfolios
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium">Research-backed thematic portfolios with instant 1-click allocation</p>
              </div>
            </div>

            <button
              onClick={() => setActiveMarketSection('EQUITIES')}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <span>Back to All Equities</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {ANGEL_THEMATIC_BASKETS.map((b) => (
              <div
                key={b.id}
                onClick={() => {
                  setSelectedThematicBasket(b);
                  setIsBasketModalOpen(true);
                }}
                className="bg-white/10 hover:bg-white/15 backdrop-blur-xs border border-white/10 hover:border-amber-400/60 rounded-2xl p-5 transition-all cursor-pointer flex flex-col justify-between group shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{b.icon}</span>
                    <span className="bg-emerald-500/20 text-emerald-300 text-xs font-black px-2.5 py-0.5 rounded-full border border-emerald-400/30 font-mono">
                      {b.cagr3Y}
                    </span>
                  </div>
                  <h5 className="font-black text-sm text-white mt-3 group-hover:text-amber-300 transition-colors">
                    {b.title}
                  </h5>
                  <p className="text-xs text-slate-300 mt-1 font-medium leading-relaxed">
                    {b.subtitle}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-2 font-normal line-clamp-2">
                    {b.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-mono font-bold">{b.symbols.length} Equities Included</span>
                  <span className="text-amber-300 font-black flex items-center gap-1 text-xs group-hover:translate-x-1 transition-transform">
                    <span>1-Click Invest</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* B. SECTOR HEATMAP SECTION */}
      {activeMarketSection === 'HEATMAP' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Activity className="w-5 h-5 text-indigo-600" />
              <div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Sector Heatmap & Institutional Money Flow
                </h4>
                <p className="text-xs text-slate-500 font-medium">Click any sector card to filter the full screener list</p>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedSector('ALL');
                setActiveMarketSection('EQUITIES');
              }}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
            >
              Reset Filters
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {sectorHeatmapStats.map((stat) => {
              const isSelected = selectedSector === stat.sector;
              const isPositive = stat.avgChange >= 0;
              return (
                <button
                  key={stat.sector}
                  onClick={() => {
                    setSelectedSector(isSelected ? 'ALL' : stat.sector);
                    setActiveMarketSection('EQUITIES');
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : isPositive
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950 hover:bg-emerald-100 hover:border-emerald-300'
                        : 'bg-rose-50/70 border-rose-200 text-rose-950 hover:bg-rose-100 hover:border-rose-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider truncate block">{stat.sector}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/70 border border-slate-200 text-slate-700">
                      {stat.count} stocks
                    </span>
                  </div>
                  <span className={`font-mono text-base font-black ${
                    isSelected ? 'text-amber-300' : isPositive ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {isPositive ? '+' : ''}{stat.avgChange.toFixed(2)}%
                  </span>
                  <div className="pt-2 border-t border-black/5 flex items-center justify-between text-[10px]">
                    <span className={isSelected ? 'text-slate-300' : 'text-slate-500'}>Top Leader:</span>
                    <span className={`font-bold ${isSelected ? 'text-white' : 'text-slate-900'}`}>{stat.bestStock.symbol} (+{stat.bestStock.changePercent}%)</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* C. MARKET MOVERS SECTION */}
      {activeMarketSection === 'MOVERS' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Activity className="w-5 h-5 text-emerald-600" />
              <div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  {isMarketLive ? 'Live Market Movers & Drivers' : 'Last-session Movers & Drivers'}
                </h4>
                <p className="text-xs text-slate-500 font-medium">Top gainers, value dips, high volume breakouts and 52W extremes</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Top Gainer */}
            {topGainer && (
              <SpotlightCard 
                glowColor="green"
                onClick={() => onSelectStock(topGainer)}
                className="bg-gradient-to-br from-[#020904] via-[#05170b] to-[#010402] border border-emerald-500/30 hover:border-mint/60 rounded-2xl p-4 shadow-[inset_0_1px_1.5px_rgba(0,245,155,0.35),0_15px_30px_-10px_rgba(0,0,0,0.85)] cursor-pointer transition-all hover:shadow-[0_15px_35px_-8px_rgba(0,245,155,0.3)] flex flex-col justify-between group relative overflow-hidden text-white"
              >
                <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-mint/60 to-transparent pointer-events-none" />
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs text-mint font-black">
                      <TrendingUp className="w-4 h-4 text-mint group-hover:scale-110 transition-transform" /> 
                      <span>TOP GAINER</span>
                    </span>
                    <span className="text-[10px] font-black text-mint bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/40">
                      +{topGainer.changePercent}%
                    </span>
                  </div>
                  <div className="font-black text-base text-white mt-2">{topGainer.name}</div>
                  <div className="text-xs text-slate-300">{topGainer.sector} • ₹{topGainer.price.toFixed(2)}</div>
                </div>
                <div className="mt-4 pt-3 border-t border-emerald-900/60 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">High: ₹{topGainer.high52}</span>
                  <span className="text-mint font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">Trade <ChevronRight className="w-3 h-3" /></span>
                </div>
              </SpotlightCard>
            )}

            {/* Top Value Dip */}
            {topLoser && (
              <SpotlightCard 
                glowColor="red"
                onClick={() => onSelectStock(topLoser)}
                className="bg-gradient-to-br from-[#0c0305] via-[#1a060a] to-[#060102] border border-rose-500/30 hover:border-rose-400/60 rounded-2xl p-4 shadow-[inset_0_1px_1.5px_rgba(244,63,94,0.35),0_15px_30px_-10px_rgba(0,0,0,0.85)] cursor-pointer transition-all hover:shadow-[0_15px_35px_-8px_rgba(244,63,94,0.3)] flex flex-col justify-between group relative overflow-hidden text-white"
              >
                <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-rose-500/60 to-transparent pointer-events-none" />
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs text-rose-400 font-black">
                      <TrendingDown className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" /> 
                      <span>VALUE DIP</span>
                    </span>
                    <span className="text-[10px] font-black text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-500/40">
                      {topLoser.changePercent}%
                    </span>
                  </div>
                  <div className="font-black text-base text-white mt-2">{topLoser.name}</div>
                  <div className="text-xs text-slate-300">P/E: {topLoser.peRatio} • ₹{topLoser.price.toFixed(2)}</div>
                </div>
                <div className="mt-4 pt-3 border-t border-rose-900/60 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Low: ₹{topLoser.low52}</span>
                  <span className="text-rose-400 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">Trade <ChevronRight className="w-3 h-3" /></span>
                </div>
              </SpotlightCard>
            )}

            {/* Most Active Volume */}
            {mostActive && (
              <SpotlightCard 
                glowColor="blue"
                onClick={() => onSelectStock(mostActive)}
                className="bg-gradient-to-br from-[#030612] via-[#061026] to-[#01030a] border border-indigo-500/30 hover:border-indigo-400/60 rounded-2xl p-4 shadow-[inset_0_1px_1.5px_rgba(99,102,241,0.35),0_15px_30px_-10px_rgba(0,0,0,0.85)] cursor-pointer transition-all hover:shadow-[0_15px_35px_-8px_rgba(99,102,241,0.3)] flex flex-col justify-between group relative overflow-hidden text-white"
              >
                <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent pointer-events-none" />
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs text-indigo-300 font-black">
                      <Zap className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" /> 
                      <span>VOLUME SURGE</span>
                    </span>
                    <span className="text-[10px] font-black text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-500/40">
                      {mostActive.changePercent >= 0 ? '+' : ''}{mostActive.changePercent}%
                    </span>
                  </div>
                  <div className="font-black text-base text-white mt-2">{mostActive.name}</div>
                  <div className="text-xs text-slate-300">{formatNumberIndian(mostActive.volume)} shares traded</div>
                </div>
                <div className="mt-4 pt-3 border-t border-indigo-900/60 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">{mostActive.sector}</span>
                  <span className="text-indigo-400 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">Trade <ChevronRight className="w-3 h-3" /></span>
                </div>
              </SpotlightCard>
            )}
          </div>
        </div>
      )}

      {/* Featured Market Opportunities & Thematic Rails Carousel */}
      <ThumbnailCarousel
        items={marketOpportunitySlides}
        autoplayInterval={4800}
        autoPlay={true}
        className="mb-2"
      />

      {/* 3. UNIFIED FILTER & SCREENER COMMAND CENTER */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-sm space-y-4 min-w-0 max-w-full overflow-hidden">
        {/* Main Search & Control Bar */}
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Animated 21st.dev Search Bar with Live Company Suggestions */}
          <div className="flex-1 min-w-0">
            <AnimatedSearchBar
              value={searchQuery}
              onChange={(val) => setSearchQuery(val)}
              onClear={() => setSearchQuery('')}
              collapsible={true}
              collapsedWidth={220}
              expandedWidth="100%"
              themeMode="light"
              suggestions={stocks.map(s => ({
                symbol: s.symbol,
                name: s.name,
                price: s.price,
                changePercent: s.changePercent,
                sector: s.sector,
              }))}
              onSelectSuggestion={(item) => {
                const stock = stocks.find(s => s.symbol === item.symbol);
                if (stock) onSelectStock(stock);
              }}
              onSubmit={(val) => {
                const q = val.trim().toLowerCase();
                const stock = stocks.find(s => s.symbol.toLowerCase() === q || s.name.toLowerCase().includes(q));
                if (stock) onSelectStock(stock);
              }}
              placeholders={[
                "Search stocks by Brand (Maggi, Bullet 350, Zudio, Blinkit)...",
                "Search by Symbol (RELIANCE, TCS, HDFCBANK, INFY, TATAMOTORS)...",
                "Search by Sector (IT, Banking, Automotive & EV, Defence)...",
                "Search by Index (Nifty 50, Sensex 30, Nifty Bank, Nifty IT)...",
                "Press / to focus search instantly...",
              ]}
              inputClassName="text-slate-900 dark:text-white placeholder-transparent text-xs font-bold"
            />
          </div>

          {/* Clean Controls: Sector Dropdown, Index Dropdown, Sort Dropdown, View Switcher */}
          {/* On a phone these were a two-column grid of boxes stacked above the
              list; a single scrolling row keeps the shares in view. */}
          <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1 scrollbar-none sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 min-w-0">
            {/* Sector Dropdown */}
            <div className="flex shrink-0 items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 min-w-0">
              <label htmlFor="screener-sector-select" className="text-[10px] text-slate-500 font-bold uppercase cursor-pointer">Sector:</label>
              <select
                id="screener-sector-select"
                name="sector"
                aria-label="Filter by sector"
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer py-1 min-w-0 w-[104px] sm:w-full sm:max-w-[110px]"
              >
                {sectors.map(sec => (
                  <option key={sec} value={sec}>{sec === 'ALL' ? 'All Sectors' : sec}</option>
                ))}
              </select>
            </div>

            {/* Benchmark Index Dropdown */}
            <div className="flex shrink-0 items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 min-w-0">
              <label htmlFor="screener-index-select" className="text-[10px] text-slate-500 font-bold uppercase cursor-pointer">Index:</label>
              <select
                id="screener-index-select"
                name="index"
                aria-label="Filter by market index"
                value={selectedBenchmark}
                onChange={(e) => setSelectedBenchmark(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer py-1 min-w-0 w-[104px] sm:w-full sm:max-w-[120px]"
              >
                <option value="ALL">All Indices</option>
                {BENCHMARK_INDEX_SUBHEADINGS.map(b => (
                  <option key={b.id} value={b.id}>{b.shortName}</option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="hidden items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 min-w-0">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <select
                id="screener-sort-select"
                name="sortBy"
                aria-label="Sort stocks"
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer py-1 min-w-0 w-full"
              >
                <option value="POPULAR">Most Popular</option>
                <option value="PRICE_HIGH">Price: High to Low</option>
                <option value="PRICE_LOW">Price: Low to High</option>
                <option value="GAIN_HIGH">Top Gainers (%)</option>
                <option value="LOSS_HIGH">Top Losers (%)</option>
                <option value="PE_LOW">Lowest P/E</option>
                <option value="MCAP_HIGH">Market Cap</option>
              </select>
            </div>

            {/* Benchmark Subheading Grouping Toggle */}
            <label htmlFor="screener-group-subheadings" className="hidden items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 cursor-pointer hover:bg-slate-100 transition-colors">
              <input
                id="screener-group-subheadings"
                name="groupSubheadings"
                type="checkbox"
                checked={groupBySubheadings}
                onChange={(e) => setGroupBySubheadings(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-600 cursor-pointer"
              />
              <span className="hidden sm:inline">Group</span>
            </label>

            {/* View Mode Toggle */}
            <div className="hidden items-center bg-slate-50 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('CARDS')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'CARDS' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-900'}`}
                title="Visual Cards View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('TABLE')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'TABLE' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-900'}`}
                title="Pro Terminal Table View"
              >
                <TableProperties className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setAdvancedFiltersOpen(true)}
              className="flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-800 hover:border-indigo-400"
            >
              <SlidersHorizontal className="h-4 w-4 text-indigo-600" /> Advanced screeners
              {strategyPreset !== 'ALL' && <span className="h-2 w-2 rounded-full bg-amber-500" />}
            </button>
          </div>
        </div>

        {/* 21st.dev Composable Linear Filter Token Bar */}
        <FilterTokenBar
          tokens={activeTokens}
          onRemoveToken={handleRemoveToken}
          onClearAll={handleClearAllTokens}
          quickChips={[
            { label: "Banking Titans", token: { id: "sector-token-banking", field: "Sector", operator: "=", value: "Banking" } },
            { label: "NIFTY 50", token: { id: "bench-token", field: "Index", operator: "=", value: "NIFTY 50" } },
            { label: "Top Gainers", token: { id: "filter-token", field: "Filter", operator: "=", value: "GAINERS" } },
            { label: "Golden Cross", token: { id: "strat-token", field: "Preset", operator: "=", value: "GOLDEN_CROSS" } },
            { label: "Tech Giants", token: { id: "sector-token-tech", field: "Sector", operator: "=", value: "Information Technology" } },
          ]}
          onAddToken={(tok) => {
            if (tok.field === 'Sector') setSelectedSector(tok.value);
            if (tok.field === 'Index') setSelectedBenchmark(tok.value === 'NIFTY 50' ? 'NIFTY_50' : tok.value);
            if (tok.field === 'Filter') setSelectedFilter(tok.value as any);
            if (tok.field === 'Preset') setStrategyPreset(tok.value as any);
          }}
          className="bg-slate-50/80 dark:bg-slate-850/80 border-slate-200/80 dark:border-slate-750"
        />

        {/* 21st.dev Expandable Benchmark Index Bar */}
        <div className="pt-1 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase shrink-0">
              Benchmark:
            </span>
            <ExpandableTabs
              tabs={[
                { title: "All", icon: Layers },
                { title: "NIFTY 50", icon: Landmark, badge: "50" },
                { title: "SENSEX 30", icon: Building2, badge: "30" },
                { title: "NIFTY IT", icon: Cpu, badge: "14" },
                { title: "NIFTY BANK", icon: Landmark, badge: "18" },
                { title: "NIFTY AUTO", icon: Car, badge: "16" },
                { title: "NIFTY PHARMA", icon: Pill, badge: "15" },
              ]}
              defaultSelected={
                selectedBenchmark === 'ALL' ? 0 :
                selectedBenchmark === 'NIFTY_50' ? 1 :
                selectedBenchmark === 'SENSEX_30' ? 2 :
                selectedBenchmark === 'NIFTY_IT' ? 3 :
                selectedBenchmark === 'NIFTY_BANK' ? 4 :
                selectedBenchmark === 'NIFTY_AUTO' ? 5 :
                selectedBenchmark === 'NIFTY_PHARMA' ? 6 : 0
              }
              onChange={(idx) => {
                const benchmarkList = ['ALL', 'NIFTY_50', 'SENSEX_30', 'NIFTY_IT', 'NIFTY_BANK', 'NIFTY_AUTO', 'NIFTY_PHARMA'];
                if (idx !== null && benchmarkList[idx]) {
                  setSelectedBenchmark(benchmarkList[idx]);
                }
              }}
              className="bg-slate-100/90 border-slate-200"
              activeColor="text-emerald-600"
            />
          </div>
        </div>

        {/* Quick Filter Tabs Row */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 scrollbar-none text-xs pt-1">
          <button
            onClick={() => setSelectedFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl font-black transition-all shrink-0 ${
              selectedFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-white'
            }`}
          >
            All Stocks ({filteredStocks.length})
          </button>

          <button
            onClick={() => setSelectedFilter('GAINERS')}
            className={`px-3 py-1.5 rounded-xl font-black transition-all shrink-0 flex items-center gap-1.5 ${
              selectedFilter === 'GAINERS'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" /> Top Gainers
          </button>

          <button
            onClick={() => setSelectedFilter('LOSERS')}
            className={`px-3 py-1.5 rounded-xl font-black transition-all shrink-0 flex items-center gap-1.5 ${
              selectedFilter === 'LOSERS'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" /> Value Dips
          </button>

          <button
            onClick={() => setSelectedFilter('52W_HIGH')}
            className={`px-3 py-1.5 rounded-xl font-black transition-all shrink-0 flex items-center gap-1.5 ${
              selectedFilter === '52W_HIGH'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Near 52W High
          </button>

          <button
            onClick={() => setSelectedFilter('52W_LOW')}
            className={`px-3 py-1.5 rounded-xl font-black transition-all shrink-0 ${
              selectedFilter === '52W_LOW'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            52W Discount 🏷️
          </button>

          <button
            onClick={() => setSelectedFilter('WATCHLIST')}
            className={`px-3 py-1.5 rounded-xl font-black transition-all shrink-0 flex items-center gap-1.5 ${
              selectedFilter === 'WATCHLIST'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
            }`}
          >
            <Heart className="w-3.5 h-3.5 fill-rose-600 text-rose-600" /> Favorites ({watchlist.length})
          </button>
        </div>

        <AnimatePresence>
          {advancedFiltersOpen && (
            <div className="fixed inset-0 z-[95] flex justify-end bg-slate-950/55 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Advanced market screeners">
              <button type="button" className="flex-1 cursor-default" onClick={() => setAdvancedFiltersOpen(false)} aria-label="Close advanced screeners" />
              <motion.aside initial={{ x: 420 }} animate={{ x: 0 }} exit={{ x: 420 }} transition={{ duration: 0.2 }} className="h-full w-full max-w-md overflow-y-auto bg-white p-5 shadow-2xl sm:p-6">
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
                  <div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-indigo-600">Optional tools</p><h3 className="text-xl font-black text-slate-900">Advanced screeners</h3><p className="mt-1 text-xs text-slate-500">Refine the list only when you need deeper screening.</p></div>
                  <button type="button" onClick={() => setAdvancedFiltersOpen(false)} className="rounded-xl border border-slate-200 p-2 text-slate-600" aria-label="Close advanced screeners"><X className="h-4 w-4" /></button>
                </div>

                <div className="mt-5 space-y-5">
                  <label className="block"><span className="text-xs font-black text-slate-700">Sort results</span><select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-900 outline-none"><option value="POPULAR">Most popular</option><option value="PRICE_HIGH">Price: high to low</option><option value="PRICE_LOW">Price: low to high</option><option value="GAIN_HIGH">Top gainers</option><option value="LOSS_HIGH">Top decliners</option><option value="PE_LOW">Lowest P/E</option><option value="MCAP_HIGH">Market cap</option></select></label>

                  <div><span className="text-xs font-black text-slate-700">Display</span><div className="mt-2 grid grid-cols-2 gap-2"><button type="button" onClick={() => setViewMode('CARDS')} className={`rounded-xl border px-3 py-2.5 text-xs font-black ${viewMode === 'CARDS' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600'}`}><LayoutGrid className="mr-1.5 inline h-4 w-4" />Cards</button><button type="button" onClick={() => setViewMode('TABLE')} className={`rounded-xl border px-3 py-2.5 text-xs font-black ${viewMode === 'TABLE' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600'}`}><TableProperties className="mr-1.5 inline h-4 w-4" />Table</button></div><label className="mt-2 flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-xs font-bold text-slate-700"><input type="checkbox" checked={groupBySubheadings} onChange={(event) => setGroupBySubheadings(event.target.checked)} /> Group companies by index</label></div>

                  <div><span className="text-xs font-black text-slate-700">Strategy presets</span><div className="mt-2 grid grid-cols-2 gap-2">{([
                    ['GOLDEN_CROSS', 'Golden crossover'], ['HIGH_DIVIDEND', 'Dividend value'], ['HIGH_ROE', 'High ROE quality'], ['RSI_DIP', 'RSI pullback'], ['PSU_GIANTS', 'Maharatna PSUs'], ['MOMENTUM', 'Momentum breakout']
                  ] as const).map(([value, label]) => <button key={value} type="button" onClick={() => setStrategyPreset(strategyPreset === value ? 'ALL' : value)} className={`rounded-xl border px-3 py-2.5 text-left text-xs font-black ${strategyPreset === value ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-700'}`}>{label}</button>)}</div></div>

                  <button type="button" onClick={() => { setSortBy('POPULAR'); setGroupBySubheadings(true); setViewMode('CARDS'); setStrategyPreset('ALL'); }} className="w-full rounded-xl border border-slate-300 py-2.5 text-xs font-black text-slate-700">Reset advanced options</button>
                  <button type="button" onClick={() => setAdvancedFiltersOpen(false)} className="w-full rounded-xl bg-slate-900 py-3 text-xs font-black text-white">Show results</button>
                </div>
              </motion.aside>
            </div>
          )}
        </AnimatePresence>

        {/* Pre-Built Strategy Screeners Row */}
        <div className="hidden items-center gap-1.5 overflow-x-auto max-w-full pb-1 scrollbar-none text-xs pt-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider shrink-0 flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3 text-indigo-600" /> Screeners:
          </span>
          <button
            onClick={() => setStrategyPreset(strategyPreset === 'GOLDEN_CROSS' ? 'ALL' : 'GOLDEN_CROSS')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-black border transition-all shrink-0 flex items-center gap-1 ${
              strategyPreset === 'GOLDEN_CROSS'
                ? 'bg-amber-500 text-slate-950 dark:text-slate-950 border-amber-500 shadow-2xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
            title="50 EMA crossing above 200 EMA bullish signal"
          >
            <span>⚡ Golden Crossover</span>
          </button>
          <button
            onClick={() => setStrategyPreset(strategyPreset === 'HIGH_DIVIDEND' ? 'ALL' : 'HIGH_DIVIDEND')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-black border transition-all shrink-0 flex items-center gap-1 ${
              strategyPreset === 'HIGH_DIVIDEND'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
            title="Dividend Yield > 2% with attractive P/E"
          >
            <span>💰 High Dividend & Value</span>
          </button>
          <button
            onClick={() => setStrategyPreset(strategyPreset === 'HIGH_ROE' ? 'ALL' : 'HIGH_ROE')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-black border transition-all shrink-0 flex items-center gap-1 ${
              strategyPreset === 'HIGH_ROE'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
            title="High ROE > 16% Quality Compounding"
          >
            <span>🚀 High ROE Quality</span>
          </button>
          <button
            onClick={() => setStrategyPreset(strategyPreset === 'RSI_DIP' ? 'ALL' : 'RSI_DIP')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-black border transition-all shrink-0 flex items-center gap-1 ${
              strategyPreset === 'RSI_DIP'
                ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
            title="RSI < 45 Oversold pullback setup"
          >
            <span>🎯 RSI Dip Rebound</span>
          </button>
          <button
            onClick={() => setStrategyPreset(strategyPreset === 'PSU_GIANTS' ? 'ALL' : 'PSU_GIANTS')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-black border transition-all shrink-0 flex items-center gap-1 ${
              strategyPreset === 'PSU_GIANTS'
                ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
            title="Maharatna & Navratna PSU Giants"
          >
            <span>🏛️ Maharatna PSUs</span>
          </button>
          <button
            onClick={() => setStrategyPreset(strategyPreset === 'MOMENTUM' ? 'ALL' : 'MOMENTUM')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-black border transition-all shrink-0 flex items-center gap-1 ${
              strategyPreset === 'MOMENTUM'
                ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
            title="Trading within 7% of 52-week all-time highs"
          >
            <span>🔥 Momentum Breakout</span>
          </button>
          {strategyPreset !== 'ALL' && (
            <button
              onClick={() => setStrategyPreset('ALL')}
              className="text-[10px] font-bold text-rose-600 hover:underline px-1 shrink-0"
            >
              Reset Screener
            </button>
          )}
        </div>

        {/* Quick Brand Search Suggestions */}
        <div className="hidden items-center gap-1.5 overflow-x-auto max-w-full pb-1 scrollbar-none text-xs border-t border-slate-100 pt-2.5">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Tag className="w-3 h-3 text-slate-500" /> Suggestions:
          </span>
          {POPULAR_BRAND_CHIPS.map((chip) => (
            <button
              key={chip.name}
              onClick={() => setSearchQuery(chip.query)}
              className={`px-2 py-0.5 rounded-md border transition-all shrink-0 font-bold text-[10px] cursor-pointer ${
                searchQuery.toLowerCase() === chip.query.toLowerCase()
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-800'
              }`}
            >
              {chip.name}
            </button>
          ))}
        </div>

        {/* 1-Click Thematic Index Basket Investment Bar (when benchmark selected) */}
        {selectedBenchmark !== 'ALL' && (
          <div className="mt-3 pt-3 border-t border-slate-200 bg-indigo-50/70 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 p-4 sm:p-5 rounded-b-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-dashed border-indigo-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base">{BENCHMARK_INDEX_SUBHEADINGS.find(b => b.id === selectedBenchmark)?.icon}</span>
                <span className="text-xs font-black text-indigo-950">
                  1-Click Invest in {BENCHMARK_INDEX_SUBHEADINGS.find(b => b.id === selectedBenchmark)?.name} Basket ({filteredStocks.length} Stocks)
                </span>
                <span className="bg-indigo-200 text-indigo-900 text-[9px] font-black px-2 py-0.5 rounded-full">
                  BENCHMARK BASKET
                </span>
              </div>
              <p className="text-[11px] text-indigo-900/80 mt-0.5 font-medium">
                {BENCHMARK_INDEX_SUBHEADINGS.find(b => b.id === selectedBenchmark)?.description}
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-[10px] text-indigo-900 font-bold uppercase hidden md:inline">Allocate:</span>
              {[10000, 25000, 50000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => {
                    if (filteredStocks.length === 0) return;
                    if (amt > cashBalance) {
                      setBasketOrderMessage({
                        text: `Insufficient virtual cash. Required: ${formatINR(amt)}, Available: ${formatINR(cashBalance)}`,
                        isError: true
                      });
                      return;
                    }
                    const perStockAmt = amt / filteredStocks.length;
                    let count = 0;
                    filteredStocks.forEach(s => {
                      const qty = Math.max(1, Math.floor(perStockAmt / (s.price || 1)));
                      if (qty > 0) {
                        executeBuyOrder(s.symbol, qty, 'MARKET');
                        count++;
                      }
                    });
                    const bName = BENCHMARK_INDEX_SUBHEADINGS.find(b => b.id === selectedBenchmark)?.name;
                    setBasketOrderMessage({
                      text: `🎉 Successfully invested ${formatINR(amt)} across ${count} stocks in the "${bName}" basket!`,
                      isError: false
                    });
                    setTimeout(() => setBasketOrderMessage(null), 5000);
                  }}
                  className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-indigo-900 hover:bg-indigo-950 text-white text-xs font-black shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <ShoppingBag className="w-3 h-3 text-amber-400" />
                  <span>{formatIndianShort(amt)}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Basket Order Feedback Banner */}
      {basketOrderMessage && (
        <div className={`p-4 rounded-2xl text-xs font-bold border flex items-center gap-2.5 shadow-sm ${
          basketOrderMessage.isError
            ? 'bg-rose-50 border-rose-200 text-rose-800'
            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
        }`}>
          {basketOrderMessage.isError ? (
            <span className="text-rose-600">❌</span>
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{basketOrderMessage.text}</span>
        </div>
      )}

      {/* Live Search Results from Network */}
      {searchQuery.length > 2 && (liveSearchResults.length > 0 || isSearchingLive) && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-5 h-5 text-slate-900 animate-pulse" />
            <h3 className="text-sm font-extrabold text-slate-900">NSE Market Discovery</h3>
          </div>
          {isSearchingLive ? (
            <div className="text-xs text-slate-500 font-bold px-2">Scanning National Stock Exchange with verified quote sync...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3.5">
              {liveSearchResults.map(res => (
                <div key={res.symbol} className="bg-white rounded-xl p-3 flex justify-between items-center shadow-sm border border-slate-200 hover:border-slate-200 transition-colors">
                  <div className="overflow-hidden">
                    <div className="font-bold text-slate-900 text-sm truncate">{res.symbol}</div>
                    <div className="text-[10px] text-slate-500 truncate">{res.name}</div>
                  </div>
                  <button onClick={() => handleTrackLiveStock(res.symbol)} className="shrink-0 ml-2 bg-slate-900 hover:bg-slate-800 text-white text-[10px] px-3 py-1.5 rounded-lg font-bold shadow-sm transition-all">
                    Load & Trade
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE 1: VISUAL STOCK CARDS (EITHER GROUPED BY SUBHEADINGS OR FLAT) */}
      {viewMode === 'CARDS' && filteredStocks.length > 0 && (
        <div className="space-y-8">
          {groupBySubheadings ? (
            /* GROUPED BY BENCHMARK INDEX SUBHEADINGS */
            benchmarkGroupedSections.map(({ benchmark, stocks: groupStocks }) => {
              const avgChange = groupStocks.reduce((sum, s) => sum + s.changePercent, 0) / (groupStocks.length || 1);
              const isAvgUp = avgChange >= 0;
              const advances = groupStocks.filter(s => s.changePercent > 0).length;
              const declines = groupStocks.filter(s => s.changePercent < 0).length;
              const isFocused = selectedBenchmark === benchmark.id;
              const isCollapsed = Boolean(collapsedBenchmarks[benchmark.id]);

              return (
                <div key={benchmark.id} className="space-y-4">
                  {/* INTERACTIVE BENCHMARK INDEX COMMAND BAR */}
                  <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 dark:border-white/15 bg-white/95 dark:bg-[#071018]/95 backdrop-blur-2xl shadow-md p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all">
                    {/* Top Edge Specular Bevel */}
                    <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-mint/60 to-transparent pointer-events-none" />

                    {/* Left: Benchmark Identity & Live Stats */}
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      <motion.div
                        whileHover={{ scale: 1.08, rotate: 4 }}
                        className={`w-12 h-12 rounded-2xl ${getBenchmarkGradient(benchmark.id)} text-2xl flex items-center justify-center shadow-lg border shrink-0`}
                      >
                        {benchmark.icon}
                      </motion.div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                            {benchmark.name}
                          </h2>
                          <span className="text-[10px] font-black bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-200 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-white/10">
                            {benchmark.tagline}
                          </span>
                          <span className="text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 px-2 py-0.5 rounded-full">
                            {groupStocks.length} Constituents
                          </span>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            isAvgUp 
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-mint border border-emerald-500/30' 
                              : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                          }`}>
                            {isAvgUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            <span>Avg {isAvgUp ? '+' : ''}{avgChange.toFixed(2)}%</span>
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 line-clamp-1">
                          {benchmark.description}
                        </p>
                      </div>
                    </div>

                    {/* Right: Interactive Action Controls */}
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
                      {/* Market Breadth Pill */}
                      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300">
                        <span className="text-emerald-600 dark:text-mint font-black">{advances}▲</span>
                        <span aria-hidden="true" className="text-slate-400 dark:text-slate-500">·</span>
                        <span className="text-rose-600 dark:text-rose-400 font-black">{declines}▼</span>
                      </div>

                      {/* 1-Click Quick Basket Invest Button */}
                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => handleQuickBasketInvest(benchmark.name, groupStocks, 25000)}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-black shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                        title={`Invest ₹25,000 evenly across all ${groupStocks.length} constituents in ${benchmark.name}`}
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-300" />
                        <span>Invest ₹25k Basket</span>
                      </motion.button>

                      {/* Focus This Index Toggle Button */}
                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => {
                          if (selectedBenchmark === benchmark.id) {
                            setSelectedBenchmark('ALL');
                          } else {
                            setSelectedBenchmark(benchmark.id);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                          isFocused
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                            : 'border-slate-200/90 dark:border-white/15 bg-slate-50 hover:bg-white dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {isFocused && <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />}
                        <span>{isFocused ? 'Focused ✓' : 'Focus Index'}</span>
                      </motion.button>

                      {/* Expand / Collapse Section Toggle Button */}
                      <button
                        type="button"
                        onClick={() => toggleBenchmarkCollapse(benchmark.id)}
                        className="p-1.5 rounded-xl border border-slate-200/90 dark:border-white/15 bg-slate-50 hover:bg-white dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                        title={isCollapsed ? "Expand constituents" : "Collapse constituents"}
                        aria-label={isCollapsed ? "Expand constituents" : "Collapse constituents"}
                      >
                        <motion.div
                          animate={{ rotate: isCollapsed ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </motion.div>
                      </button>
                    </div>
                  </div>

                  {/* Grid of Stocks under this Subheading */}
                  {!isCollapsed && (
                    <>
                    {/* Phones get a scannable row list; cards return at sm. */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 sm:hidden">
                      {groupStocks.map((stock) => (
                        <StockRowItem
                          key={stock.symbol}
                          stock={stock}
                          onSelectStock={onSelectStock}
                          watchlist={watchlist}
                          toggleWatchlist={toggleWatchlist}
                          searchQuery={searchQuery}
                          matchReason={getStockMatchReason(stock, searchQuery)}
                          indices={getStockIndices(stock.symbol)}
                          onOpenAlert={(s) => {
                            setQuickAlertStock(s);
                            setIsAlertModalOpen(true);
                          }}
                          onQuickBuy={(s) => {
                            executeBuyOrder(s.symbol, 1, 'MARKET');
                          }}
                        />
                      ))}
                    </div>
                    <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5 sm:gap-6">
                      {groupStocks.map((stock) => (
                        <StockCardItem
                          key={stock.symbol}
                          stock={stock}
                          onSelectStock={onSelectStock}
                          watchlist={watchlist}
                          toggleWatchlist={toggleWatchlist}
                          searchQuery={searchQuery}
                          matchReason={getStockMatchReason(stock, searchQuery)}
                          indices={getStockIndices(stock.symbol)}
                          onOpenAlert={(s) => {
                            setQuickAlertStock(s);
                            setIsAlertModalOpen(true);
                          }}
                          onQuickBuy={(s) => {
                            executeBuyOrder(s.symbol, 1, 'MARKET');
                          }}
                        />
                      ))}
                    </div>
                    </>
                  )}
                </div>
              );
            })
          ) : (
            /* FLAT GRID OF ALL FILTERED STOCKS */
            <>
            {/* Phones get a scannable row list; cards return at sm. */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 sm:hidden">
              {displayedStocks.map((stock) => (
                <StockRowItem
                  key={stock.symbol}
                  stock={stock}
                  onSelectStock={onSelectStock}
                  watchlist={watchlist}
                  toggleWatchlist={toggleWatchlist}
                  searchQuery={searchQuery}
                  matchReason={getStockMatchReason(stock, searchQuery)}
                  indices={getStockIndices(stock.symbol)}
                  onOpenAlert={(s) => {
                    setQuickAlertStock(s);
                    setIsAlertModalOpen(true);
                  }}
                  onQuickBuy={(s) => {
                    executeBuyOrder(s.symbol, 1, 'MARKET');
                  }}
                />
              ))}
            </div>
            <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5 sm:gap-6">
              {displayedStocks.map((stock) => (
                <StockCardItem
                  key={stock.symbol}
                  stock={stock}
                  onSelectStock={onSelectStock}
                  watchlist={watchlist}
                  toggleWatchlist={toggleWatchlist}
                  searchQuery={searchQuery}
                  matchReason={getStockMatchReason(stock, searchQuery)}
                  indices={getStockIndices(stock.symbol)}
                  onOpenAlert={(s) => {
                    setQuickAlertStock(s);
                    setIsAlertModalOpen(true);
                  }}
                  onQuickBuy={(s) => {
                    executeBuyOrder(s.symbol, 1, 'MARKET');
                  }}
                />
              ))}
            </div>
            </>
          )}
        </div>
      )}

      {/* VIEW MODE 2: PRO TERMINAL TABLE VIEW */}
      {viewMode === 'TABLE' && filteredStocks.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-4">Symbol / Company</th>
                  <th className="p-4">Benchmark Subheading</th>
                  <th className="p-4 text-right">Price (₹)</th>
                  <th className="p-4 text-right">24h Change</th>
                  <th className="p-4 text-center">Trend (Area)</th>
                  <th className="p-4 text-right">P/E Ratio</th>
                  <th className="p-4 text-right">Market Cap</th>
                  <th className="p-4">Famous Brands</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {displayedStocks.map((stock) => {
                  const isUp = stock.change >= 0;
                  const indices = getStockIndices(stock.symbol);
                  return (
                    <tr
                      key={stock.symbol}
                      onClick={() => onSelectStock(stock)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-slate-900 text-sm">{stock.symbol}</span>
                          {stock.psuStatus && (
                            <span className="text-[9px] font-black bg-blue-100 text-blue-900 border border-blue-200 px-1 py-0.5 rounded">
                              {stock.psuStatus}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[200px]">{stock.name}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {indices.map(idx => (
                            <span key={idx} className="bg-indigo-50 text-indigo-900 border border-indigo-200 text-[9px] px-1.5 py-0.5 rounded font-bold">
                              {idx}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 text-right font-black font-mono tabular-nums text-sm text-slate-900">
                        {formatINR(stock.price)}
                      </td>
                      <td className="p-4 text-right">
                        <span className={`inline-block font-black font-mono tabular-nums px-2 py-0.5 rounded-md text-[11px] ${
                          isUp ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%
                        </span>
                      </td>
                      <td className="p-2 w-36 text-center">
                        <div className="mx-auto w-32 flex justify-center">
                          <ShareBoxAreaChart
                            symbol={stock.symbol}
                            price={stock.price}
                            change={stock.change}
                            changePercent={stock.changePercent}
                            high52={stock.high52}
                            low52={stock.low52}
                            dayHigh={stock.dayHigh}
                            dayLow={stock.dayLow}
                            open={stock.open}
                            previousClose={stock.previousClose}
                            volume={stock.volume}
                            height={30}
                            showLabels={false}
                            showTimeframes={false}
                          />
                        </div>
                      </td>
                      <td className="p-4 text-right font-mono tabular-nums font-bold text-slate-900">
                        {stock.peRatio}x
                      </td>
                      <td className="p-4 text-right font-mono tabular-nums font-bold text-slate-500">
                        {formatIndianShort(stock.marketCapCr * 10000000)}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {stock.popularBrands?.slice(0, 2).map((b, idx) => (
                            <span key={idx} className="bg-amber-50 text-amber-900 border border-amber-200 text-[10px] px-2 py-0.5 rounded-md font-semibold">
                              {b}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setQuickAlertStock(stock);
                              setIsAlertModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-amber-100 text-slate-500 hover:text-amber-800"
                            title="Set Price Trigger Alert"
                          >
                            <Bell className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onSelectStock(stock)}
                            className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 shadow-xs"
                          >
                            Trade
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredStocks.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 px-4 py-3">
          <p className="text-xs font-semibold text-slate-600">
            Showing {Math.min(displayedStocks.length, filteredStocks.length)} of {filteredStocks.length} matching companies
          </p>
          {canLoadMore && (
            <button
              type="button"
              onClick={() => void loadMoreStocks()}
              disabled={loadingCatalog}
              className="w-full sm:w-auto rounded-xl bg-slate-900 px-4 py-2 text-xs font-black text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {loadingCatalog ? 'Loading...' : 'Load more'}
            </button>
          )}
        </div>
      )}

      {/* Empty Filter State */}
      {filteredStocks.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 shadow-sm">
          {selectedFilter === 'WATCHLIST' ? (
            <>
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-rose-200">
                <Heart className="w-8 h-8 text-rose-600 fill-rose-600" />
              </div>
              <p className="text-lg font-bold text-slate-900">Your Favorites List is Empty</p>
              <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                Pin your favorite stocks from the catalog by clicking the heart icon to curate a focused watchlist.
              </p>
              <button
                onClick={() => setSelectedFilter('ALL')}
                className="mt-6 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-extrabold shadow-md transition-all cursor-pointer"
              >
                Explore Market Catalog
              </button>
            </>
          ) : (
            <>
              <p className="text-base font-bold text-slate-900">No stocks match "{searchQuery || 'your criteria'}"</p>
              <p className="text-xs text-slate-500 mt-1">Try searching for keywords like "Maggi", "Bullet", "Zudio", "Nifty IT", "Sensex", or clear your filter.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedBenchmark('ALL');
                  setSelectedSector('ALL');
                  setSelectedFilter('ALL');
                }}
                className="mt-4 px-5 py-2.5 rounded-xl bg-slate-900 text-xs font-extrabold text-white shadow-md hover:bg-slate-800 cursor-pointer"
              >
                Reset All Filters
              </button>
            </>
          )}
        </div>
      )}

      {/* ANGEL ONE THEMATIC BASKETS MODAL */}
      <ThematicBasketsModal
        isOpen={isBasketModalOpen}
        onClose={() => setIsBasketModalOpen(false)}
        selectedBasket={selectedThematicBasket}
        onSelectBasket={(basket) => setSelectedThematicBasket(basket)}
        onSelectStock={(stock) => {
          setIsBasketModalOpen(false);
          onSelectStock(stock);
        }}
      />

      {/* ANGEL ONE PRICE ALERT MODAL */}
      <QuickAlertModal
        isOpen={isAlertModalOpen}
        onClose={() => {
          setIsAlertModalOpen(false);
          setQuickAlertStock(null);
        }}
        stock={quickAlertStock}
      />

    </div>
  );
};

// Reusable Individual Stock Card Component with Angel One Quick Actions & Price Alerts
/**
 * Compact one-line row used on phones in place of the full stock card.
 *
 * The card carries a chart, a 52-week meter, ratio tiles and brand chips,
 * which at 390px means roughly one company per screen. A broker-style row puts
 * symbol, price and change on a single line so a list can be scanned.
 */
const StockRowItem: React.FC<StockCardItemProps> = ({
  stock,
  onSelectStock,
  watchlist,
  toggleWatchlist,
  indices,
}) => {
  const isUp = stock.change >= 0;
  const isWatchlisted = watchlist.includes(stock.symbol);
  const moveClass = isUp
    ? 'text-[#047857] dark:text-emerald-400'
    : 'text-[#be123c] dark:text-rose-400';

  return (
    <div className="flex items-center border-b border-slate-200 last:border-b-0 dark:border-slate-800">
      <button
        type="button"
        onClick={() => onSelectStock(stock)}
        className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-4 pr-2 text-left active:bg-slate-50 dark:active:bg-slate-800"
      >
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate font-mono text-sm font-black text-slate-900 dark:text-white">
              {stock.symbol}
            </span>
            {stock.psuStatus && (
              <span className="shrink-0 rounded bg-blue-100 px-1 py-0.5 text-[9px] font-black text-blue-900 dark:bg-blue-950 dark:text-blue-200">
                {stock.psuStatus}
              </span>
            )}
          </span>
          <span className="mt-0.5 block truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {indices[0] ? `${indices[0]} · ` : ''}{stock.name}
          </span>
        </span>

        <span className="shrink-0 text-right">
          <span className="block font-mono text-sm font-black text-slate-900 dark:text-white">
            {formatINR(stock.price)}
          </span>
          <span 
            aria-live="polite"
            aria-atomic="true"
            className={`mt-0.5 block font-mono text-[11px] font-bold ${moveClass}`}
          >
            {isUp ? '+' : ''}{stock.change.toFixed(2)} ({isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%)
          </span>
        </span>
      </button>

      <button
        type="button"
        onClick={() => toggleWatchlist(stock.symbol)}
        aria-label={`${isWatchlisted ? 'Remove' : 'Add'} ${stock.symbol} (${stock.name}) ${isWatchlisted ? 'from' : 'to'} watchlist`}
        aria-pressed={isWatchlisted}
        className="shrink-0 p-3 pr-4 text-slate-400 active:text-rose-500 dark:text-slate-500 min-h-[48px] min-w-[48px] flex items-center justify-center cursor-pointer"
      >
        <Heart className={`h-4 w-4 ${isWatchlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
      </button>
    </div>
  );
};

interface StockCardItemProps {
  stock: StockDetail;
  onSelectStock: (stock: StockDetail) => void;
  watchlist: string[];
  toggleWatchlist: (symbol: string) => void;
  searchQuery: string;
  matchReason: string | null;
  indices: string[];
  onOpenAlert: (stock: StockDetail) => void;
  onQuickBuy: (stock: StockDetail) => void;
}

const StockCardItem: React.FC<StockCardItemProps> = ({
  stock,
  onSelectStock,
  watchlist,
  toggleWatchlist,
  matchReason,
  indices,
  onOpenAlert,
  onQuickBuy
}) => {
  const isUp = stock.change >= 0;
  const isWatchlisted = watchlist.includes(stock.symbol);
  const rangeSpan = stock.high52 - stock.low52;
  const currentPosPercent = Math.min(100, Math.max(0, ((stock.price - stock.low52) / (rangeSpan || 1)) * 100));
  const isLowPe = stock.peRatio < stock.industryPe;
  const isNear52Low = currentPosPercent <= 25;
  const isBreakout = stock.changePercent >= 2.0;
  const quoteTimeLabel = stock.quoteAsOf
    ? new Date(stock.quoteAsOf).toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: -1000, y: -1000 });
  const [isHovered, setIsHovered] = useState(false);
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handlePointerMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });
    setIsHovered(true);
    const xPercent = (x / rect.width) - 0.5;
    const yPercent = (y / rect.height) - 0.5;
    setTilt({ x: -yPercent * 3.5, y: xPercent * 3.5 });
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
    setMousePos({ x: -1000, y: -1000 });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      onMouseMove={handlePointerMove}
      onMouseLeave={handlePointerLeave}
      style={{
        transform: isHovered 
          ? `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(-2px)` 
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)',
        transition: isHovered ? 'transform 0.12s ease-out, box-shadow 0.25s ease' : 'transform 0.35s ease-out, box-shadow 0.25s ease',
        contentVisibility: 'auto',
        containIntrinsicSize: '180px',
      }}
      className="rr-terminal-card relative rounded-3xl border border-slate-700/50 backdrop-blur-md bg-slate-900/60 p-6 flex flex-col justify-between group cursor-pointer overflow-hidden isolate transition-all shadow-xl"
      onClick={() => onSelectStock(stock)}
    >
      {/* 0. Polymo Lighting Specular Top Bevel & Ambient Gradient Wash */}
      <div className="rr-terminal-bevel absolute inset-x-0 top-0 h-[1.5px] pointer-events-none z-10" />
      <div className="rr-terminal-wash pointer-events-none absolute inset-0 -z-10" />

      {/* 1. Dynamic Radial Spotlight Beam */}
      <div 
        className="pointer-events-none absolute inset-0 rounded-3xl transition-opacity duration-300 z-0"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(380px circle at ${mousePos.x}px ${mousePos.y}px, ${
            isUp ? 'rgba(0, 245, 155, 0.22)' : 'rgba(244, 63, 94, 0.22)'
          }, transparent 75%)`,
        }}
      />

      {/* 2. Interactive Glowing Spotlight Border Mask */}
      <div 
        className="pointer-events-none absolute -inset-[1px] rounded-[inherit] transition-opacity duration-300 z-10"
        style={{
          opacity: isHovered ? 1 : 0,
          padding: '1.5px',
          background: `radial-gradient(280px circle at ${mousePos.x}px ${mousePos.y}px, ${
            isUp ? 'rgba(0, 245, 155, 0.95)' : 'rgba(244, 63, 94, 0.95)'
          }, transparent 70%)`,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />

      {/* Card Content Relative Layer */}
      <div className="relative z-[1] flex flex-col justify-between h-full text-white">
      {/* Header with Symbol, Name, Star */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center font-black text-white text-sm shadow-2xs group-hover:scale-105 transition-transform font-mono">
              {stock.symbol.substring(0, 3)}
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-black text-white text-base group-hover:text-mint transition-colors font-mono">
                  {stock.symbol}
                </h3>
                <span className="text-[10px] text-slate-300 bg-white/10 font-bold px-1.5 py-0.5 rounded-md border border-white/15 font-mono">
                  NSE
                </span>
                {stock.psuStatus && (
                  <span className="text-[9px] font-black bg-blue-100 dark:bg-blue-500/20 text-blue-900 dark:text-blue-300 border border-blue-300 dark:border-blue-500/40 px-1.5 py-0.5 rounded-md">
                    🏛️ {stock.psuStatus}
                  </span>
                )}
                {isBreakout && (
                  <span className="text-[9px] font-black bg-emerald-500/20 text-mint border border-emerald-500/40 px-1.5 py-0.5 rounded-md">
                    🔥 Breakout
                  </span>
                )}
                {isNear52Low && (
                  <span className="text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded-md">
                    🏷️ Sale
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 font-medium line-clamp-1 mt-0.5">{stock.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => onOpenAlert(stock)}
              className="p-2 rounded-full border bg-white/10 border-white/15 text-slate-300 hover:text-amber-400 hover:border-amber-400/50 hover:bg-white/20 transition-all shadow-2xs cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Set Price Alert Trigger"
              aria-label={`Set price alert trigger for ${stock.symbol} (${stock.name})`}
            >
              <Bell className="w-4 h-4" />
            </button>
            <button
              onClick={() => toggleWatchlist(stock.symbol)}
              aria-label={`${isWatchlisted ? 'Remove' : 'Add'} ${stock.symbol} (${stock.name}) ${isWatchlisted ? 'from' : 'to'} watchlist`}
              aria-pressed={isWatchlisted}
              className={`transition-all p-2 rounded-full border shadow-2xs cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center ${isWatchlisted ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 hover:bg-rose-500/30' : 'bg-white/10 border-white/15 text-slate-300 hover:text-rose-400 hover:bg-white/20'}`}
              title={isWatchlisted ? 'Remove from Favorites' : 'Add to Favorites'}
            >
              <Heart className={`w-4 h-4 ${isWatchlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* Index Badges & Keyword Match Indicator */}
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {indices.map(idx => (
            <span key={idx} className="bg-white/5 text-slate-300 border border-white/10 text-[9px] px-2 py-0.5 rounded-md font-bold font-mono">
              {idx}
            </span>
          ))}
          {matchReason && (
            <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[9px] px-2 py-0.5 rounded-md font-black flex items-center gap-0.5">
              <span>🎯</span>
              <span>{matchReason}</span>
            </span>
          )}
        </div>

        {/* Price & Today's Change with aria-live */}
        <div className="mt-3.5 flex items-baseline justify-between">
          <div>
            <span className="text-2xl font-black text-white tracking-tight font-mono">
              {formatINR(stock.price)}
            </span>
          </div>
          <div 
            aria-live="polite"
            aria-atomic="true"
            className={`flex items-center text-xs font-black px-2.5 py-1 rounded-xl shadow-2xs font-mono ${
              isUp ? 'bg-emerald-500/20 text-[#047857] dark:text-emerald-400 border border-emerald-500/40' : 'bg-rose-500/20 text-[#be123c] dark:text-rose-400 border border-rose-500/40'
            }`}
          >
            {isUp ? '+' : ''}{stock.change.toFixed(2)} ({formatPercent(stock.changePercent)})
          </div>
        </div>
        {quoteTimeLabel && (
          <p className="mt-1.5 text-[9px] font-bold text-slate-400" title={`Market quote source: ${stock.quoteSource || 'NSE quote provider'}`}>
            {quoteLabel(stock)} · {quoteTimeLabel} IST · {stock.quoteSource || 'Catalog data'}
          </p>
        )}

        {/* 52-Week Range Slider Bar */}
        <div className="mt-3 bg-black/40 p-2.5 rounded-2xl border border-white/10" title="The position between the lowest and highest traded prices recorded over the previous 52 weeks. It is context, not a buy or sell signal.">
          <div className="flex justify-between text-[10px] text-slate-400 font-bold mb-1 font-mono">
            <span>52W L: ₹{stock.low52.toFixed(0)}</span>
            <span className="text-slate-200 font-black">{currentPosPercent.toFixed(0)}% of 52W High</span>
            <span>52W H: ₹{stock.high52.toFixed(0)}</span>
          </div>
          <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-rose-500 via-amber-400 to-mint rounded-full"
              style={{ width: `${currentPosPercent}%` }}
            />
          </div>
        </div>

        {/* 21st.dev @sean0205 Upgraded Area Chart inside Share Box */}
        <div className="mt-2.5">
          <ShareBoxAreaChart
            symbol={stock.symbol}
            price={stock.price}
            change={stock.change}
            changePercent={stock.changePercent}
            high52={stock.high52}
            low52={stock.low52}
            dayHigh={stock.dayHigh}
            dayLow={stock.dayLow}
            open={stock.open}
            previousClose={stock.previousClose}
            volume={stock.volume}
            height={58}
            showTimeframes={true}
          />
        </div>

        {/* Valuation & Fundamentals Row with ELI16 Educational Tooltips */}
        <div className="grid grid-cols-2 gap-2 mt-3 text-[11px]">
          <div 
            className="bg-white/5 p-2.5 rounded-xl border border-white/10 cursor-help"
            title={`Explain Like I'm 16: If P/E is ${stock.peRatio}, you are paying ₹${stock.peRatio} for every ₹1 the company earns each year.`}
          >
            <span className="text-slate-400 font-semibold flex items-center gap-1 text-[10px] uppercase font-mono">
              <abbr className="no-underline">P/E Ratio</abbr>
              <span className="text-[8px] px-1 py-0.5 rounded bg-indigo-100 dark:bg-indigo-500/30 text-indigo-900 dark:text-indigo-300 font-black">ELI16</span>
              <HelpCircle className="h-3 w-3 text-slate-400" aria-hidden="true" />
            </span>
            <div className="flex items-center justify-between mt-0.5">
              <span className="font-extrabold text-white font-mono">{stock.peRatio}</span>
              <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md font-mono ${
                isLowPe ? 'text-[#047857] dark:text-emerald-400 bg-emerald-500/20 border border-emerald-500/30' : 'text-slate-300 bg-white/10'
              }`}>
                Ind: {stock.industryPe}
              </span>
            </div>
          </div>

          <div 
            className="bg-white/5 p-2.5 rounded-xl border border-white/10 cursor-help"
            title="Explain Like I'm 16: DuPont Breakdown separates luck from skill: is profit coming from high margins, fast inventory turns, or debt? RoE shows how many paise of pure profit the company generates for every ₹1 of shareholder money."
          >
            <span className="text-slate-400 font-semibold flex items-center gap-1 text-[10px] uppercase font-mono">
              <abbr className="no-underline">Market Cap</abbr>
              <span className="text-[8px] px-1 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/30 text-emerald-950 dark:text-emerald-300 font-black">ELI16</span>
              <HelpCircle className="h-3 w-3 text-slate-400" aria-hidden="true" />
            </span>
            <span className="font-extrabold text-white font-mono block mt-0.5">{formatIndianShort(stock.marketCapCr * 10000000)}</span>
          </div>
        </div>

        {/* Famous Brands Tags for Teens */}
        {stock.popularBrands && stock.popularBrands.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {stock.popularBrands.slice(0, 3).map((brand, bIdx) => (
              <span key={bIdx} className="bg-amber-400/15 text-amber-300 border border-amber-400/30 text-[10px] px-2.5 py-0.5 rounded-lg font-bold">
                {brand}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Action Buttons */}
      <div className="mt-4 pt-3.5 border-t border-white/10 flex items-center justify-between gap-2">
        <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wide truncate max-w-[100px] font-mono">
          {stock.sector}
        </span>
        
        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => onQuickBuy(stock)}
            className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-mint border border-mint/40 font-black text-xs shadow-xs transition-all flex items-center gap-1 cursor-pointer"
            title="Instant 1-Click Buy 1 Share"
          >
            <Zap className="w-3 h-3 text-amber-300" />
            <span>Buy 1</span>
          </button>
          
          <button
            id={`trade-btn-${stock.symbol}`}
            onClick={() => onSelectStock(stock)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-mint hover:bg-mint/90 text-slate-950 font-black text-xs shadow-[0_0_15px_rgba(0,245,155,0.3)] transition-all group-hover:scale-102 cursor-pointer"
          >
            <span>Trade</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      </div>

    </motion.div>
  );
};

// Helper for top highlights brand fallback
function stockHasBrand(s: StockDetail): string | undefined {
  return s.popularBrands && s.popularBrands.length > 0 ? s.popularBrands[0] : undefined;
}
