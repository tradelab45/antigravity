import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  Search,
  Wallet, 
  Award, 
  Rocket, 
  RotateCcw, 
  Sparkles, 
  BookOpen, 
  BarChart3, 
  PieChart, 
  Zap, 
  ShieldCheck, 
  ShieldAlert,
  Clock,
  Menu,
  X,
  Terminal,
  User,
  LogOut,
  ChevronDown,
  Coins,
  Settings,
  UserCheck,
  Layers,
  History,
  Compass,
  HelpCircle,
  Dna,
  Trophy,
  Calculator,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Swords,
  Palette,
  Check
} from 'lucide-react';
import { useSimulator } from '../context/SimulatorContext';
import { useTheme } from '../context/ThemeContext';
import { formatINR, formatPercent } from '../utils/formatters';
import { isSoundEnabled, setSoundEnabled, playNseBellSound } from '../utils/soundEffects';
import { NotificationCenter } from './NotificationCenter';
import { AuthModal } from './AuthModal';
import { RiskCenterModal } from './RiskCenterModal';
import { AnimatedSearchBar } from './ui/animated-search-bar';
import { StockDetail } from '../types';

export type AppTabType = 'home' | 'screener' | 'watchlist' | 'portfolio' | 'replay' | 'review' | 'journal' | 'academy' | 'challenges' | 'calculator' | 'chanakya' | 'badges' | 'privacy' | 'help';

const MOBILE_MENU_HINT_KEY = 'rupeerookie-mobile-menu-hint-seen-v1';

export interface HeaderProps {
  activeTab: AppTabType;
  setActiveTab: (tab: AppTabType) => void;
  onOpenApiModal?: () => void;
  onStartWalkthrough?: () => void;
  onSelectStock?: (stock: StockDetail) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, onOpenApiModal, onStartWalkthrough, onSelectStock }) => {
  const { 
    currentUser,
    logoutUser,
    portfolioValue, 
    cashBalance, 
    totalPnL, 
    totalPnLPercent, 
    userXP, 
    userLevel, 
    marketIndices, 
    resetSimulator,
    nseMarketInfo,
    marketHoursMode,
    setMarketHoursMode,
    stocks,
  } = useSimulator();

  const { theme, isDark, toggleTheme, palette, setPalette, palettes } = useTheme();

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showSignoutConfirm, setShowSignoutConfirm] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [riskCenterOpen, setRiskCenterOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileMenuHintVisible, setMobileMenuHintVisible] = useState(false);
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());
  const [paletteMenuOpen, setPaletteMenuOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const paletteMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleSoundToggle = (e: Event) => {
      const detail = (e as CustomEvent<{ enabled: boolean }>).detail;
      if (typeof detail?.enabled === 'boolean') {
        setSoundOn(detail.enabled);
      }
    };
    window.addEventListener('rr_sound_toggle', handleSoundToggle);
    return () => window.removeEventListener('rr_sound_toggle', handleSoundToggle);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (paletteMenuRef.current && !paletteMenuRef.current.contains(event.target as Node)) {
        setPaletteMenuOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProfileDropdownOpen(false);
        setPaletteMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    const mobileLayout = window.matchMedia('(max-width: 1023px)');
    let revealTimer: number | undefined;

    const syncHintVisibility = () => {
      window.clearTimeout(revealTimer);
      if (mobileLayout.matches && window.localStorage.getItem(MOBILE_MENU_HINT_KEY) !== 'true') {
        revealTimer = window.setTimeout(() => setMobileMenuHintVisible(true), 700);
      } else {
        setMobileMenuHintVisible(false);
      }
    };

    syncHintVisibility();
    mobileLayout.addEventListener('change', syncHintVisibility);
    return () => {
      window.clearTimeout(revealTimer);
      mobileLayout.removeEventListener('change', syncHintVisibility);
    };
  }, []);

  const dismissMobileMenuHint = () => {
    window.localStorage.setItem(MOBILE_MENU_HINT_KEY, 'true');
    setMobileMenuHintVisible(false);
  };

  const isProfit = totalPnL >= 0;

  const navItems: {
    id: AppTabType;
    label: string;
    icon: React.ElementType;
    badge?: string;
    badgeColor?: string;
    highlight?: boolean;
  }[] = [
    { id: 'home', label: 'Home', icon: Compass },
    { id: 'screener', label: 'Markets', icon: BarChart3 },
    { id: 'portfolio', label: 'Portfolio', icon: PieChart },
    { id: 'replay', label: 'Replay OS', icon: History, badge: 'Blind Mode', badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300' },
    { id: 'review', label: 'Trader DNA', icon: Dna },
    { id: 'journal', label: 'Journal', icon: BookOpen },
    { id: 'academy', label: 'Learn', icon: BookOpen },
    { id: 'challenges', label: 'Progress', icon: Trophy },
    { id: 'calculator', label: 'Compound Calculator', icon: Calculator, badge: 'SIP & Lumpsum', badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
    { id: 'chanakya', label: 'AI Coach', icon: Zap, highlight: true },
    { id: 'privacy', label: 'Data & Privacy', icon: ShieldCheck }
  ];

  const renderIndexPill = (name: string, data?: { value: number; change: number; changePercent: number } | null, fallback?: { value: number; change: number; changePercent: number }) => {
    const item = data || fallback || { value: 0, change: 0, changePercent: 0 };
    const hasData = Boolean(data || fallback);
    const isUp = (item.change ?? 0) >= 0;
    return (
      <div className="flex items-center gap-1.5 font-mono text-[11px]">
        <span className="text-slate-400 font-sans font-bold">{name}</span>
        <span className="font-bold text-slate-100">
          {hasData && item.value ? item.value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
        </span>
        <span className={`text-[10px] font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
          {hasData ? `${isUp ? '+' : ''}${(item.change ?? 0).toFixed(2)} (${isUp ? '+' : ''}${(item.changePercent ?? 0).toFixed(2)}%)` : 'Awaiting feed'}
        </span>
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-40 w-full max-w-full overflow-x-clip bg-white/95 text-slate-900 shadow-xs backdrop-blur-md transition-colors duration-200 dark:bg-slate-900/95 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800">
      {/* Sleek Top Indices Ticker & Real-Time Status Bar */}
      <div className="bg-[#0B0F19] border-b border-slate-800 text-slate-100 py-1.5 px-3 text-xs overflow-hidden relative select-none">
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#0B0F19] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0B0F19] to-transparent z-10 pointer-events-none" />

        <div className="animate-marquee flex items-center gap-6 sm:gap-8 whitespace-nowrap">
          {/* Group 1 */}
          <div className="flex items-center gap-6 sm:gap-8 shrink-0">
            {/* Live NSE Real-Time Market Status Pill (Click to ring exchange gong) */}
            <button
              type="button"
              onClick={() => playNseBellSound()}
              title="Click to ring the Dalal Street exchange gong bell"
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black border cursor-pointer hover:scale-105 active:scale-95 transition-transform ${
                nseMarketInfo.isNSEMarketOpen
                  ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                  : 'bg-rose-500/20 border-rose-400/40 text-rose-300'
              }`}
            >
              <span className="flex h-2 w-2 relative">
                <span className={`${nseMarketInfo.isNSEMarketOpen ? 'animate-ping' : ''} absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  nseMarketInfo.isNSEMarketOpen ? 'bg-emerald-400' : 'bg-rose-400'
                }`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  nseMarketInfo.isNSEMarketOpen ? 'bg-emerald-400' : 'bg-rose-400'
                }`}></span>
              </span>
              <span>{nseMarketInfo.isNSEMarketOpen ? 'NSE OPEN 🔔' : 'NSE CLOSED 🔔'}</span>
              <span className="opacity-75 font-mono text-[9px]">({nseMarketInfo.nextSessionCountdown})</span>
            </button>

            {/* Current IST Time */}
            <div className="flex items-center gap-1.5 font-mono text-slate-400 text-[11px]">
              <Clock className="w-3 h-3 text-amber-400" />
              <span className="font-bold">IST:</span>
              <span className="text-slate-100 font-semibold">{nseMarketInfo.istTimeString}</span>
            </div>

            {/* Benchmark Indices */}
            {renderIndexPill('NIFTY 50', marketIndices?.nifty50)}
            {renderIndexPill('SENSEX', marketIndices?.sensex)}
            {renderIndexPill('BANK NIFTY', marketIndices?.niftyBank)}
            {renderIndexPill('NIFTY IT', marketIndices?.niftyIT)}

            <div className="flex items-center gap-1.5 text-amber-300 font-bold bg-amber-400/15 px-2.5 py-0.5 rounded-full border border-amber-400/30 text-[10px]">
              <span>💰 ₹10 Lakhs Virtual Capital</span>
            </div>
          </div>

          {/* Group 2 (Duplicate for smooth infinite marquee loop) */}
          <div className="flex items-center gap-6 sm:gap-8 shrink-0">
            <button
              type="button"
              onClick={() => playNseBellSound()}
              title="Click to ring the Dalal Street exchange gong bell"
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black border cursor-pointer hover:scale-105 active:scale-95 transition-transform ${
                nseMarketInfo.isNSEMarketOpen
                  ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                  : 'bg-rose-500/20 border-rose-400/40 text-rose-300'
              }`}
            >
              <span className="flex h-2 w-2 relative">
                <span className={`${nseMarketInfo.isNSEMarketOpen ? 'animate-ping' : ''} absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  nseMarketInfo.isNSEMarketOpen ? 'bg-emerald-400' : 'bg-rose-400'
                }`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  nseMarketInfo.isNSEMarketOpen ? 'bg-emerald-400' : 'bg-rose-400'
                }`}></span>
              </span>
              <span>{nseMarketInfo.isNSEMarketOpen ? 'NSE OPEN 🔔' : 'NSE CLOSED 🔔'}</span>
              <span className="opacity-75 font-mono text-[9px]">({nseMarketInfo.nextSessionCountdown})</span>
            </button>

            <div className="flex items-center gap-1.5 font-mono text-slate-400 text-[11px]">
              <Clock className="w-3 h-3 text-amber-400" />
              <span className="font-bold">IST:</span>
              <span className="text-slate-100 font-semibold">{nseMarketInfo.istTimeString}</span>
            </div>

            {/* Benchmark Indices */}
            {renderIndexPill('NIFTY 50', marketIndices?.nifty50)}
            {renderIndexPill('SENSEX', marketIndices?.sensex)}
            {renderIndexPill('BANK NIFTY', marketIndices?.niftyBank)}
            {renderIndexPill('NIFTY IT', marketIndices?.niftyIT)}

            <div className="flex items-center gap-1.5 text-amber-300 font-bold bg-amber-400/15 px-2.5 py-0.5 rounded-full border border-amber-400/30 text-[10px]">
              <span>💰 ₹10 Lakhs Virtual Capital</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main App Bar - Expansive Desktop & Tablet Layout */}
      <div className="mx-auto flex w-full max-w-[1640px] min-w-0 items-center justify-between gap-2 px-3 py-2.5 sm:gap-3 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16 sm:py-3.5">
        {/* Left: Brand Identity with Animated Liquid Glass Logo */}
        <button
          type="button"
          aria-label="Go to RupeeRookie home"
          className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group shrink-0 text-left rounded-2xl outline-none focus:outline-none"
          onClick={() => setActiveTab('home')}
        >
          {/* Liquid Glass Animated Logo Container */}
          <motion.div 
            whileHover={{ scale: 1.08, rotate: [0, -3, 3, 0] }}
            whileTap={{ scale: 0.94 }}
            className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl p-[1.5px] overflow-hidden shrink-0 shadow-[0_8px_25px_rgba(99,102,241,0.35),0_0_15px_rgba(0,245,155,0.2)] group"
          >
            {/* Liquid Glass Dynamic Iridescent Perimeter Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-indigo-500 to-mint rounded-2xl animate-[spin_6s_linear_infinite] opacity-80 blur-[2px]" />

            {/* Frosted Glass Body */}
            <div className="relative w-full h-full rounded-[14px] bg-slate-900/85 backdrop-blur-xl flex items-center justify-center overflow-hidden border border-white/30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5),inset_0_-1px_2px_rgba(0,0,0,0.6)]">
              {/* Liquid Specular Diagonal Light Sweep */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
              
              {/* Ambient radial center reflection */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.25),transparent_70%)] pointer-events-none" />

              {/* 3D Rupee & Trending Arrow Glyph with Pulse Animation */}
              <div className="relative z-10 flex items-center justify-center font-black font-mono">
                <span className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-200 to-amber-400 drop-shadow-[0_2px_8px_rgba(251,191,36,0.6)] animate-[pulse_3s_ease-in-out_infinite]">
                  ₹
                </span>
                <motion.div
                  animate={{ y: [-1, 1, -1], x: [0, 0.8, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  className="absolute -top-1 -right-2"
                >
                  <TrendingUp className="w-4 h-4 text-mint stroke-[3.5] drop-shadow-[0_0_6px_#00f59b]" />
                </motion.div>
              </div>
            </div>
          </motion.div>

          <div className="hidden sm:block">
            <div className="flex items-center gap-1.5">
              <h1 className="font-black text-base sm:text-lg tracking-tight text-slate-900 dark:text-white flex items-center">
                RUPEE<span className="text-indigo-600 dark:text-indigo-400">ROOKIE</span>
              </h1>
              <span className="bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700/80 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                SIMULATION
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block font-medium">
              Train like it's real. Risk nothing.
            </p>
          </div>
        </button>

        {/* Center: Consolidated Financial Metrics Card */}
        <div className="hidden min-[520px]:flex flex-1 sm:flex-none min-w-0 items-center gap-2 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-2xl p-1.5 sm:px-3 sm:py-1.5 shadow-xs">
          {/* Portfolio Net Value */}
          <div className="px-2 sm:px-2.5 py-0.5">
            <div className="flex items-center gap-1.5">
              <Wallet className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline text-[9px] sm:text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                Portfolio Value
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-mono text-[11px] sm:text-sm font-black text-slate-900 dark:text-slate-100 whitespace-nowrap">
                {formatINR(portfolioValue)}
              </span>
            </div>
          </div>

          <div className="w-[1px] h-7 bg-slate-200 dark:bg-slate-700 hidden md:block" />

          {/* Cash Balance */}
          <div className="px-2 sm:px-2.5 py-0.5 hidden md:block">
            <div className="flex items-center gap-1">
              <Coins className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                Available Cash
              </span>
            </div>
            <div className="font-mono text-xs sm:text-sm font-black text-emerald-700 dark:text-emerald-400 mt-0.5">
              {formatINR(cashBalance)}
            </div>
          </div>

          <div className="w-[1px] h-7 bg-slate-200 dark:bg-slate-700 hidden md:block" />

          {/* Total P&L */}
          <div className="px-2 sm:px-2.5 py-0.5 hidden md:block">
            <div className="flex items-center gap-1">
              {isProfit ? <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <TrendingDown className="w-3 h-3 text-rose-600 dark:text-rose-400" />}
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                Total P&L
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`font-mono text-xs sm:text-sm font-black ${isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {totalPnL > 0 ? '+' : ''}{formatINR(totalPnL)}
              </span>
              <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                isProfit ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
              }`}>
                {formatPercent(totalPnLPercent)}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Consolidated Controls Hub */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Strict vs 24/7 Hours Mode Toggle Pill */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              const next = marketHoursMode === 'STRICT_NSE_HOURS' ? 'PRACTICE_24x7' : 'STRICT_NSE_HOURS';
              setMarketHoursMode(next);
            }}
            className={`hidden 2xl:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[11px] font-black transition-all cursor-pointer shadow-xs ${
              marketHoursMode === 'STRICT_NSE_HOURS'
                ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800 text-indigo-950 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60'
                : 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60'
            }`}
            title={`Click to switch mode. Current: ${marketHoursMode === 'STRICT_NSE_HOURS' ? 'Strict NSE Hours (9:15-15:30 IST)' : '24x7 Open Practice Session'}`}
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                marketHoursMode === 'STRICT_NSE_HOURS' ? 'bg-indigo-500' : 'bg-amber-500'
              }`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                marketHoursMode === 'STRICT_NSE_HOURS' ? 'bg-indigo-600' : 'bg-amber-500'
              }`} />
            </span>
            <span className="font-mono">{marketHoursMode === 'STRICT_NSE_HOURS' ? 'Strict NSE' : '24x7 Mode'}</span>
          </motion.button>

          {/* XP & Level Chip */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('badges')}
            className="hidden 2xl:flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 transition-all cursor-pointer shadow-xs"
            title="View Achievements & Leaderboard"
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-[10px] font-black text-white shadow-2xs">
              L{userLevel.level}
            </div>
            <div className="hidden sm:block text-left">
              <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 font-mono leading-none block">
                {userXP} <span className="text-[9px] text-slate-500 dark:text-slate-400">XP</span>
              </span>
            </div>
          </motion.button>

          {/* Risk Center Guardrails Button */}
          <motion.button
            id="risk-center-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setRiskCenterOpen(true)}
            className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80 shadow-xs transition-all cursor-pointer font-bold text-[11px]"
            title="Risk Management & Guardrails Center"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span className="hidden sm:inline">Risk Guard</span>
          </motion.button>

          {/* App Walkthrough Tutorial Button */}
          {onStartWalkthrough && (
            <motion.button
              id="header-walkthrough-tour-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onStartWalkthrough}
              className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 shadow-xs transition-all cursor-pointer font-bold text-[11px]"
              title="Interactive App Walkthrough & Guide"
            >
              <Compass className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden md:inline">Tour</span>
            </motion.button>
          )}

          <motion.button
            id="help-support-btn"
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('help')}
            className="hidden md:flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-black text-emerald-800 shadow-xs transition-all hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900/60 cursor-pointer"
            title="Open Help & Support"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">Help</span>
          </motion.button>

          {/* Global Theme Toggle Button (Light / Dark Mode) with Spring Rotation */}
          <motion.button
            id="theme-toggle-btn"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={toggleTheme}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-amber-300 border border-slate-200 dark:border-slate-700 shadow-xs transition-all cursor-pointer"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <motion.div
              animate={{ rotate: isDark ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 20 }}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </motion.div>
            <span className="text-[10px] font-mono font-bold">{isDark ? 'Dark' : 'Light'}</span>
          </motion.button>

          {/* Background Colour Palette Picker */}
          <div className="relative hidden md:block" ref={paletteMenuRef}>
            <motion.button
              id="palette-picker-btn"
              type="button"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setPaletteMenuOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={paletteMenuOpen}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-slate-800 shadow-xs transition-all hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              title="Change background colour"
              aria-label="Change background colour"
            >
              <Palette className="h-4 w-4" style={{ color: 'var(--rr-app-accent)' }} />
              <span className="hidden text-[10px] font-mono font-bold xl:inline">Colour</span>
            </motion.button>

            <AnimatePresence>
              {paletteMenuOpen && (
                <motion.div
                  role="menu"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
                >
                  <p className="px-2 pb-1.5 pt-1 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Background colour
                  </p>
                  {palettes.map((option) => {
                    const selected = palette === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        role="menuitemradio"
                        aria-checked={selected}
                        onClick={() => {
                          setPalette(option.id);
                          setPaletteMenuOpen(false);
                        }}
                        className={`flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors ${selected ? 'bg-indigo-50 dark:bg-indigo-950/60' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                      >
                        <span aria-hidden="true" className="flex shrink-0 overflow-hidden rounded-md border border-slate-300/70 dark:border-slate-600">
                          {option.swatch.map((colour) => (
                            <span key={colour} className="block h-5 w-2.5" style={{ backgroundColor: colour }} />
                          ))}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-xs font-bold text-slate-800 dark:text-slate-100">{option.label}</span>
                        {selected && <Check className="h-3.5 w-3.5 shrink-0 text-indigo-600 dark:text-indigo-300" />}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => {
                      setPaletteMenuOpen(false);
                      window.dispatchEvent(new Event('open-accessibility-settings'));
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-2 py-2 text-[11px] font-black text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    More display settings
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Global Sound FX Audio Toggle */}
          <motion.button
            id="sound-fx-toggle-btn"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => {
              const next = !soundOn;
              setSoundOn(next);
              setSoundEnabled(next);
              if (next) {
                playNseBellSound();
              }
            }}
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border shadow-xs transition-all cursor-pointer ${
              soundOn
                ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
            }`}
            title={soundOn ? 'Sound Effects Active (Click to mute)' : 'Sound Effects Muted (Click to turn on sounds)'}
            aria-label="Toggle Sound Effects"
          >
            {soundOn ? (
              <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
            <span className="text-[10px] font-mono font-bold">{soundOn ? 'SFX ON' : 'MUTED'}</span>
          </motion.button>

          {/* Reset Simulator Button */}
          <motion.button
            id="reset-simulator-btn"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setShowResetConfirm(true)}
            className="hidden 2xl:flex p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 shadow-xs transition-all items-center justify-center cursor-pointer"
            title="Reset Simulator to ₹10,00,000 Cash"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="sr-only">Reset</span>
          </motion.button>

          {/* User Profile Component with Integrated Exit / Sign Out Option */}
          <div className="relative" ref={profileDropdownRef}>
            <button
              id="user-profile-btn"
              onClick={() => { setProfileDropdownOpen(false); setAuthModalOpen(true); }}
              aria-haspopup="dialog"
              className="flex items-center gap-1 px-1.5 sm:px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-xs transition-all cursor-pointer"
              title={currentUser ? `Investor Profile: ${currentUser.fullName}` : 'Account Settings'}
            >
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center font-black text-[11px] shadow-2xs">
                {currentUser ? currentUser.fullName.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
              </div>
              <span className="hidden xl:inline text-[11px] font-extrabold max-w-[80px] truncate text-slate-800 dark:text-slate-200">
                {currentUser ? currentUser.fullName.split(' ')[0] : 'Account'}
              </span>
              <UserCheck className="hidden sm:block w-3.5 h-3.5 text-indigo-500" />
            </button>

            {/* Interactive Profile Dropdown Popover */}
            <AnimatePresence>
              {profileDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden text-left"
                >
                  {/* Profile Header Banner */}
                  <div className="p-3.5 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-black text-white text-sm border border-white/20 shadow-xs">
                        {currentUser ? currentUser.fullName.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-extrabold text-xs text-white truncate">
                          {currentUser ? currentUser.fullName : 'Guest Investor'}
                        </div>
                        <div className="text-[10px] text-indigo-200 truncate">
                          {currentUser ? `@${currentUser.username}` : 'Virtual Practice Account'}
                        </div>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[10px]">
                      <span className="text-slate-300 font-medium">Virtual Capital:</span>
                      <span className="font-mono font-bold text-amber-300">{formatINR(portfolioValue)}</span>
                    </div>
                  </div>

                  {/* Profile Menu Actions */}
                  <div className="p-1.5 space-y-0.5">
                    {/* Theme toggle in dropdown */}
                    <button
                      id="profile-theme-toggle-btn"
                      onClick={() => {
                        toggleTheme();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                        <span>Appearance</span>
                      </div>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {isDark ? 'Dark Mode 🌙' : 'Light Mode ☀️'}
                      </span>
                    </button>

                    {/* Background colour swatches (works on mobile where the header picker is hidden) */}
                    <div className="px-3 py-2">
                      <p className="mb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Background colour</p>
                      <div className="flex flex-wrap gap-1.5">
                        {palettes.map((option) => {
                          const selected = palette === option.id;
                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => setPalette(option.id)}
                              aria-pressed={selected}
                              title={option.label}
                              aria-label={`Background colour: ${option.label}`}
                              className={`h-8 w-8 overflow-hidden rounded-lg border-2 transition-all ${selected ? 'border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-900' : 'border-slate-200 dark:border-slate-700'}`}
                            >
                              <span aria-hidden="true" className="flex h-full w-full">
                                {option.swatch.map((colour) => (
                                  <span key={colour} className="block h-full flex-1" style={{ backgroundColor: colour }} />
                                ))}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setAuthModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>{currentUser ? 'Manage Credentials' : 'Sign In / Register'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setActiveTab('badges');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Award className="w-4 h-4 text-amber-500" />
                      <span>My Badges & XP</span>
                      <span className="ml-auto text-[9px] bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 px-1.5 py-0.5 rounded font-black border border-amber-300 dark:border-amber-700">
                        L{userLevel.level}
                      </span>
                    </button>

                    {onStartWalkthrough && (
                      <button
                        id="profile-walkthrough-btn"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onStartWalkthrough();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer"
                      >
                        <Compass className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span>App Walkthrough Tour</span>
                        <span className="ml-auto text-[9px] bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded font-bold">
                          Guide
                        </span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setActiveTab('help');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <HelpCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Help &amp; Support</span>
                      <span className="ml-auto text-[9px] rounded bg-emerald-100 px-1.5 py-0.5 font-black text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Find anything</span>
                    </button>

                    <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                    {/* Exit / Sign Out Button Embedded in Profile Component */}
                    <button
                      id="profile-exit-btn"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setShowSignoutConfirm(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      <span>Exit / Sign Out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Far Right Corner: Notification Center Bell */}
          <div className="pl-0.5">
            <NotificationCenter />
          </div>

          {/* Mobile Navigation Toggle + one-time feature discovery hint */}
          <div className="relative flex lg:hidden">
            <button
              onClick={() => {
                if (!mobileMenuOpen) dismissMobileMenuHint();
                setMobileMenuOpen(!mobileMenuOpen);
              }}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-describedby={mobileMenuHintVisible ? 'mobile-menu-discovery-hint' : undefined}
              className="flex p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 cursor-pointer"
              title="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            <AnimatePresence>
              {mobileMenuHintVisible && !mobileMenuOpen && (
                <motion.div
                  id="mobile-menu-discovery-hint"
                  role="status"
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.96 }}
                  className="absolute right-0 top-full z-[60] mt-3 w-[min(18rem,calc(100vw-1.5rem))] rounded-2xl border border-indigo-300 bg-white p-4 text-left shadow-2xl dark:border-indigo-700 dark:bg-slate-900"
                >
                  <span className="absolute -top-2 right-3 h-4 w-4 rotate-45 border-l border-t border-indigo-300 bg-white dark:border-indigo-700 dark:bg-slate-900" aria-hidden="true" />
                  <div className="relative flex gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      <Menu className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-950 dark:text-white">More features are here</p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                        Tap this menu to find Watchlist, Replay OS, Trader DNA, Journal, Challenges, AI Coach and more.
                      </p>
                    </div>
                  </div>
                  <div className="relative mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={dismissMobileMenuHint}
                      className="min-h-11 flex-1 rounded-xl border border-slate-200 px-3 text-xs font-black text-slate-700 dark:border-slate-700 dark:text-slate-200"
                    >
                      Got it
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        dismissMobileMenuHint();
                        setMobileMenuOpen(true);
                      }}
                      className="min-h-11 flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3 text-xs font-black text-white shadow-lg shadow-indigo-500/20"
                    >
                      Explore now
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Desktop Primary Navigation Bar - Expanded Width */}
      <div className="hidden lg:block bg-slate-50/60 dark:bg-slate-900/60 backdrop-blur-xs px-4">
        <div className="max-w-[1640px] mx-auto flex items-center justify-end gap-4 md:gap-8 py-1.5 px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
          {/* Liquid Glass Animated Navigation Bar - Seamless Borderless Outline */}
          <nav className="relative flex min-w-0 flex-1 items-center justify-end gap-1.5 overflow-x-auto scrollbar-none py-1 px-1 rounded-2xl bg-transparent border-0 border-transparent shadow-none outline-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id || (item.id === 'challenges' && activeTab === 'badges');
              return (
                <motion.button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative flex shrink-0 items-center gap-2 whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer select-none overflow-hidden outline-none focus:outline-none focus:ring-0 border-0 ${
                    isActive
                      ? item.highlight
                        ? 'text-white shadow-md shadow-amber-500/25'
                        : 'text-white shadow-md shadow-indigo-500/25'
                      : item.highlight
                        ? 'text-amber-800 dark:text-amber-300 hover:bg-amber-100/60 dark:hover:bg-amber-950/40'
                        : 'text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200/50 dark:hover:bg-white/10'
                  }`}
                >
                  {/* Liquid Glass Animated Background Pill */}
                  {isActive ? (
                    <motion.div
                      layoutId="active-nav-pill"
                      className={`absolute inset-0 rounded-xl ${
                        item.highlight
                          ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600'
                          : 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700'
                      }`}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    >
                      {/* Top Bevel Specular Sheen */}
                      <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none" />
                      
                      {/* Tubelight Lamp Glow Effect */}
                      <div className={`absolute -bottom-1 inset-x-3 h-1 rounded-full blur-xs ${
                        item.highlight ? 'bg-amber-300' : 'bg-indigo-300'
                      }`} />
                    </motion.div>
                  ) : null}

                  {/* Icon & Label with relative z-index */}
                  <Icon className={`relative z-10 w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-110 ${
                    isActive 
                      ? 'text-white' 
                      : item.highlight 
                        ? 'text-amber-600 dark:text-amber-400' 
                        : 'text-slate-600 dark:text-slate-400'
                  }`} />
                  <span className="relative z-10">{item.label}</span>
                  {item.badge && (
                    <span className={`relative z-10 shrink-0 whitespace-nowrap text-[9px] font-black px-1.5 py-0.5 rounded-full border ${
                      isActive 
                        ? 'bg-white/20 text-white border-white/30' 
                        : item.badgeColor || 'bg-amber-100 text-amber-900 border-amber-300'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </nav>

          {/* Desktop Dalal Street Search Trigger Button - Sleek & Borderless */}
          <div className="hidden xl:flex items-center gap-2 shrink-0">
            <motion.button
              type="button"
              id="header-dalal-search-btn"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                window.dispatchEvent(new CustomEvent('open-app-search'));
              }}
              className="group relative flex items-center h-8.5 px-3 rounded-xl border-0 border-transparent bg-slate-200/50 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-white backdrop-blur-xl shadow-none hover:shadow-xs transition-all cursor-pointer select-none outline-none focus:outline-none"
              title="Search Dalal Street companies, brands, and app features (Press / or Ctrl+K)"
              aria-label="Open Dalal Street search dialog"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-emerald-600 dark:text-mint group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Search shares...</span>
              </div>
              <kbd className="ml-2.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/10 border border-slate-200/60 dark:border-white/10 rounded-md">
                /
              </kbd>
            </motion.button>
          </div>

          {/* 1v1 Stock Battle Arena Trigger */}
          <motion.button
            type="button"
            id="header-stock-battle-btn"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              window.dispatchEvent(new CustomEvent('open-stock-battle'));
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 text-white shadow-xs hover:shadow-md hover:from-violet-500 hover:to-indigo-500 cursor-pointer select-none"
            title="1v1 Blue-Chip Stock Battle Arena: Compare rival blue-chips in real-time tug-of-war"
          >
            <Swords className="w-3.5 h-3.5 text-amber-300" />
            <span>1v1 Battle Arena</span>
            <span className="bg-amber-400/30 text-amber-200 text-[9px] font-black px-1.5 py-0.5 rounded-full border border-amber-300/40 uppercase">
              VS
            </span>
          </motion.button>

          {/* Right auxiliary link: Indian Stock API */}
          {onOpenApiModal && (
            <button
              id="nav-api-explorer"
              onClick={onOpenApiModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 cursor-pointer shadow-2xs"
            >
              <Terminal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Indian Stock API</span>
              <span className="bg-emerald-200/80 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 text-[9px] font-mono font-bold px-1 rounded">
                0xramm
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Drawer Dropdown Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="max-h-[min(72vh,680px)] overflow-y-auto border-t border-slate-200 bg-slate-50 px-4 py-3 space-y-2 dark:border-slate-800 dark:bg-slate-900 lg:hidden"
          >
            {/* Mobile Animated Company Search */}
            <div className="pb-1">
              <AnimatedSearchBar
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
                  if (stock && onSelectStock) {
                    onSelectStock(stock);
                    setMobileMenuOpen(false);
                  } else {
                    setActiveTab('screener');
                    setMobileMenuOpen(false);
                  }
                }}
                onSubmit={(val) => {
                  const q = val.trim().toLowerCase();
                  const stock = stocks.find(s => s.symbol.toLowerCase() === q || s.name.toLowerCase().includes(q));
                  if (stock && onSelectStock) {
                    onSelectStock(stock);
                    setMobileMenuOpen(false);
                  } else {
                    setActiveTab('screener');
                    setMobileMenuOpen(false);
                  }
                }}
                placeholders={[
                  "Search Dalal Street (RELIANCE, TCS)...",
                  "Search company or brand...",
                ]}
                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-xs text-xs"
                inputClassName="text-slate-900 dark:text-white font-bold text-xs"
              />
            </div>
            {/* Quick stats on mobile drawer */}
            <div className="grid grid-cols-3 gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase block">Portfolio</span>
                <span className="font-mono text-[10px] sm:text-xs font-black text-slate-900 dark:text-slate-100 truncate">{formatINR(portfolioValue)}</span>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/60 p-2 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <span className="text-[9px] text-emerald-800 dark:text-emerald-300 font-bold uppercase block">Cash</span>
                <span className="font-mono text-[10px] sm:text-xs font-black text-emerald-900 dark:text-emerald-200 truncate">{formatINR(cashBalance)}</span>
              </div>
              <div className={`${isProfit ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800'} p-2 rounded-xl border`}>
                <span className={`text-[9px] ${isProfit ? 'text-emerald-800 dark:text-emerald-300' : 'text-rose-800 dark:text-rose-300'} font-bold uppercase block`}>Total P&L</span>
                <span className={`font-mono text-[10px] sm:text-xs font-black ${isProfit ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'} truncate block`}>
                  {totalPnL > 0 ? '+' : ''}{formatINR(totalPnL, false)}
                </span>
              </div>
            </div>

            {/* Mobile Theme & Sound FX Toggle Rows */}
            <div className="grid grid-cols-2 gap-2 py-1 px-1">
              <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Theme</span>
                <button
                  id="mobile-theme-toggle-btn"
                  onClick={toggleTheme}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-[10px] font-extrabold"
                >
                  {isDark ? <Sun className="w-3 h-3 text-amber-400" /> : <Moon className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />}
                  <span>{isDark ? 'Dark' : 'Light'}</span>
                </button>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Sound FX</span>
                <button
                  id="mobile-sound-toggle-btn"
                  onClick={() => {
                    const next = !soundOn;
                    setSoundOn(next);
                    setSoundEnabled(next);
                    if (next) playNseBellSound();
                  }}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-extrabold ${
                    soundOn ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-700'
                  }`}
                >
                  {soundOn ? <Volume2 className="w-3 h-3 text-emerald-600" /> : <VolumeX className="w-3 h-3 text-slate-400" />}
                  <span>{soundOn ? 'ON' : 'MUTED'}</span>
                </button>
              </div>
            </div>

            {/* Mobile 1v1 Battle Arena Banner Button */}
            <button
              type="button"
              id="mobile-stock-battle-btn"
              onClick={() => {
                setMobileMenuOpen(false);
                window.dispatchEvent(new CustomEvent('open-stock-battle'));
              }}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 text-white text-xs font-black shadow-sm cursor-pointer"
            >
              <Swords className="w-4 h-4 text-amber-300" />
              <span>Enter 1v1 Blue-Chip Stock Battle Arena</span>
              <span className="bg-amber-400/30 text-amber-200 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase">
                VS
              </span>
            </button>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => {
                  setMarketHoursMode(marketHoursMode === 'STRICT_NSE_HOURS' ? 'PRACTICE_24x7' : 'STRICT_NSE_HOURS');
                  setMobileMenuOpen(false);
                }}
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-3 text-xs font-black text-indigo-900 dark:border-indigo-800 dark:bg-slate-800 dark:text-indigo-200"
              >
                <Clock className="h-4 w-4" /> {marketHoursMode === 'STRICT_NSE_HOURS' ? 'Strict NSE Hours' : '24x7 Practice'}
              </button>
              <button
                type="button"
                onClick={() => { setMobileMenuOpen(false); setRiskCenterOpen(true); }}
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 text-xs font-black text-rose-800 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300"
              >
                <ShieldAlert className="h-4 w-4" /> Risk Guard
              </button>
              <button
                type="button"
                onClick={() => { setMobileMenuOpen(false); setShowResetConfirm(true); }}
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 text-xs font-black text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
              >
                <RotateCcw className="h-4 w-4" /> Reset Simulator
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id || (item.id === 'challenges' && activeTab === 'badges');
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-black transition-all text-left ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {onStartWalkthrough && (
              <button
                id="mobile-walkthrough-tour-btn"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onStartWalkthrough();
                }}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 text-xs font-black border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer"
              >
                <Compass className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Start App Walkthrough Tutorial</span>
              </button>
            )}

            {onOpenApiModal && (
              <button
                onClick={() => {
                  onOpenApiModal();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 text-xs font-black border border-emerald-300 dark:border-emerald-800"
              >
                <Terminal className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <span>Open Indian Stock API (0xramm)</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-left animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-4 border border-rose-200 dark:border-rose-800">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Reset Virtual Simulator?
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
              This will restore your portfolio back to the initial <strong>₹10,00,000</strong> virtual cash, clear all your simulated stock holdings, and reset order history. Your learned academy XP and unlocked badges will be preserved!
            </p>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-reset-btn"
                onClick={() => {
                  resetSimulator();
                  setShowResetConfirm(false);
                }}
                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 transition-all cursor-pointer"
              >
                Yes, Reset to ₹10 Lakhs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sign Out Confirmation Modal */}
      {showSignoutConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-left animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-4 border border-rose-200 dark:border-rose-800">
              <LogOut className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Sign Out of RupeeRookie?
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
              You are signed in as <strong>{currentUser?.fullName}</strong> ({currentUser?.email || `@${currentUser?.username}`}). Signing out will securely exit your session and return to the login screen.
            </p>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowSignoutConfirm(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Stay Logged In
              </button>
              <button
                type="button"
                id="confirm-signout-btn"
                onClick={() => {
                  setShowSignoutConfirm(false);
                  logoutUser();
                }}
                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>Yes, Sign Out Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login / Sign Up & Data Export Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />

      {/* Institutional Risk Center & Guardrails Modal */}
      <RiskCenterModal isOpen={riskCenterOpen} onClose={() => setRiskCenterOpen(false)} />
    </header>
  );
};
