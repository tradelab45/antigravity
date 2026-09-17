import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown,
  ShieldCheck, 
  Sparkles, 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Phone, 
  GraduationCap, 
  BookOpen, 
  Zap, 
  CheckCircle2, 
  ArrowRight, 
  Clock, 
  Award, 
  PieChart, 
  AlertCircle,
  BarChart3,
  RotateCcw,
  ShoppingBag,
  Layers,
  ChevronRight,
  HelpCircle,
  Flame,
  Lightbulb,
  ArrowDown
} from 'lucide-react';
import { useSimulator } from '../context/SimulatorContext';
import { AuthFormData, UserAccount } from '../types';
import { AuthLaunchTransition } from './AuthLaunchTransition';
import { SpotlightCard } from './ui/spotlight-card';
import { ExpandableTabs } from './ui/expandable-tabs';
import { RupeeSpatialBackground } from './ui/rupee-spatial-background';
import { LiquidButton } from './ui/liquid-glass-button';
import { LiquidGlassLogo } from './ui/LiquidGlassLogo';

interface SampleStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  sector: string;
  sparkline: number[];
  chanakyaInsight: string;
}

const SAMPLE_STOCKS: SampleStock[] = [
  {
    symbol: 'RELIANCE',
    name: 'Reliance Industries Ltd.',
    price: 2980.40,
    change: 1.84,
    sector: 'Energy & Telecom',
    sparkline: [2920, 2935, 2910, 2950, 2940, 2975, 2980],
    chanakyaInsight: "Reliance anchors portfolios with immense cash flow from oil-to-chemicals, Jio 5G, and national retail expansion.",
  },
  {
    symbol: 'TCS',
    name: 'Tata Consultancy Services',
    price: 4120.15,
    change: 0.92,
    sector: 'Information Tech',
    sparkline: [4080, 4095, 4110, 4100, 4130, 4115, 4120],
    chanakyaInsight: "TCS represents defensive IT leadership with superior ROCE > 50% and rock-solid global balance sheet governance.",
  },
  {
    symbol: 'HDFCBANK',
    name: 'HDFC Bank Limited',
    price: 1645.50,
    change: 1.25,
    sector: 'Banking & Financials',
    sparkline: [1620, 1630, 1625, 1640, 1638, 1642, 1645],
    chanakyaInsight: "Private banking giant! Credit expansion and stable CASA deposits make HDFC Bank the bedrock of Dalal Street.",
  },
  {
    symbol: 'TATAMOTORS',
    name: 'Tata Motors Limited',
    price: 985.20,
    change: -0.65,
    sector: 'Automobile & EV',
    sparkline: [995, 992, 988, 980, 984, 982, 985],
    chanakyaInsight: "Turnaround champion in EV passenger vehicles and JLR luxury! Auto cyclicality demands strict stop-loss rules.",
  },
  {
    symbol: 'ZOMATO',
    name: 'Zomato Limited',
    price: 245.80,
    change: 3.42,
    sector: 'Consumer Tech',
    sparkline: [236, 238, 240, 242, 241, 244, 245],
    chanakyaInsight: "Hyper-growth consumer platform turning profitable! Watch Blinkit quick commerce order velocity and margins.",
  },
  {
    symbol: 'INFY',
    name: 'Infosys Limited',
    price: 1780.00,
    change: -0.38,
    sector: 'Information Tech',
    sparkline: [1790, 1785, 1782, 1775, 1778, 1782, 1780],
    chanakyaInsight: "Digital transformation titan. Track large deal Total Contract Value (TCV) and BFSI vertical spending before sizing up.",
  },
];

const DALAL_SUTRAS = [
  {
    sanskrit: "जो धैर्य रखता है, बाजार उसका मित्र बन जाता है।",
    english: "In the stock market, money moves from the impatient to the patient. Discipline beats speculation every time.",
    author: "Dalal Street Proverb",
  },
  {
    sanskrit: "विविधीकरण आपका सबसे बड़ा कवच है।",
    english: "Never put all your eggs in one basket. Diversifying across defensive & cyclical sectors preserves your virtual capital.",
    author: "Chanakya Rule of Prudence",
  },
  {
    sanskrit: "ज्ञान के बिना निवेश केवल जुआ है।",
    english: "Investing without reading financial statements is like playing poker without looking at the cards.",
    author: "Teen Investor Creed",
  },
];

export const AuthPage: React.FC<{ initialMode?: 'LOGIN' | 'SIGNUP' }> = ({ initialMode = 'LOGIN' }) => {
  const { loginUser, registerUser, nseMarketInfo, marketIndices } = useSimulator();

  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [cardTilt, setCardTilt] = useState({ x: 0, y: 0 });
  const [launchState, setLaunchState] = useState<{ user: UserAccount; kind: 'new' | 'returning' } | null>(null);
  const [sessionNotice] = useState(() => {
    const reason = localStorage.getItem('rr_logout_reason');
    if (reason) localStorage.removeItem('rr_logout_reason');
    return reason === 'inactive' ? 'For your privacy, you were signed out after seven days without activity. Sign in again to continue.' : '';
  });

  // Interactive Live Trade Playground State
  const [playgroundCash, setPlaygroundCash] = useState<number>(1000000);
  const [selectedStockSymbol, setSelectedStockSymbol] = useState<string>('RELIANCE');
  const [playgroundQty, setPlaygroundQty] = useState<number>(5);
  const [simulatedHoldings, setSimulatedHoldings] = useState<{ [symbol: string]: { qty: number; avgPrice: number } }>({
    'RELIANCE': { qty: 10, avgPrice: 2940.00 },
    'TCS': { qty: 5, avgPrice: 4090.00 },
  });
  const [playgroundFeedback, setPlaygroundFeedback] = useState<string>('Try virtual buying or selling to experience real-time execution!');
  const [tradeCelebration, setTradeCelebration] = useState<boolean>(false);

  // Interactive Quiz State
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);

  useEffect(() => {
    if (!launchState) return;
    const timer = window.setTimeout(() => window.location.reload(), 5000);
    return () => window.clearTimeout(timer);
  }, [launchState]);

  const handleAuthPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setCardTilt({ 
      x: ((event.clientY - rect.top) / rect.height - 0.5) * -4, 
      y: ((event.clientX - rect.left) / rect.width - 0.5) * 4 
    });
  };

  // Sign In state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Sign Up state
  const [formData, setFormData] = useState<AuthFormData>({
    fullName: '',
    email: '',
    username: '',
    password: '',
    phone: '',
    ageGroup: '16-18 (High School Teen)',
    experienceLevel: 'BEGINNER',
  });

  const [agreedTerms, setAgreedTerms] = useState(false);

  // Quick Demo Login helper
  const handleQuickDemoLogin = async () => {
    setErrorMsg('');
    setLoading(true);
    const res = await loginUser('xyz@gmail.com', 'RookiePass@2026');
    if (res.success && res.user) {
      window.dispatchEvent(new CustomEvent('rr_auth_success', { detail: { kind: 'returning' } }));
      setLaunchState({ user: res.user, kind: 'returning' });
    } else {
      setLoading(false);
      setErrorMsg(res.message || 'Demo login failed');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim()) {
      setErrorMsg('Please enter your email address or username');
      return;
    }
    if (!loginPassword) {
      setErrorMsg('Please enter your password');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    const res = await loginUser(loginIdentifier.trim(), loginPassword);
    if (res.success && res.user) {
      window.dispatchEvent(new CustomEvent('rr_auth_success', { detail: { kind: 'returning' } }));
      setLaunchState({ user: res.user, kind: 'returning' });
    } else {
      setLoading(false);
      setErrorMsg(res.message || 'Invalid credentials. Please try again.');
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      setErrorMsg('Please enter your full name');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setErrorMsg('Please provide a valid email address');
      return;
    }
    if (!formData.username.trim()) {
      setErrorMsg('Please choose a username');
      return;
    }
    if (!formData.password || formData.password.length < 8) {
      setErrorMsg('Create a password with at least 8 characters');
      return;
    }
    if (!agreedTerms) {
      setErrorMsg('Please agree to the educational simulator terms');
      return;
    }

    setErrorMsg('');
    setLoading(true);
    const res = await registerUser(formData);
    if (res.success && res.user) {
      setSuccessMsg('Account created successfully! Welcome to Dalal Street.');
      window.dispatchEvent(new CustomEvent('rr_auth_success', { detail: { kind: 'new' } }));
      setLaunchState({ user: res.user, kind: 'new' });
    } else {
      setLoading(false);
      setErrorMsg(res.message || 'Failed to create account. Please try again.');
    }
  };

  // Playground simulation functions
  const activeStock = SAMPLE_STOCKS.find(s => s.symbol === selectedStockSymbol) || SAMPLE_STOCKS[0];
  const activeHolding = simulatedHoldings[activeStock.symbol] || { qty: 0, avgPrice: 0 };
  const tradeCost = activeStock.price * playgroundQty;

  const handleSimulateBuy = () => {
    if (playgroundCash < tradeCost) {
      setPlaygroundFeedback(`Insufficient virtual funds. You need ₹${tradeCost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}.`);
      return;
    }

    const newCash = playgroundCash - tradeCost;
    const currentQty = activeHolding.qty;
    const currentCost = currentQty * activeHolding.avgPrice;
    const totalQty = currentQty + playgroundQty;
    const newAvg = (currentCost + tradeCost) / totalQty;

    setPlaygroundCash(newCash);
    setSimulatedHoldings(prev => ({
      ...prev,
      [activeStock.symbol]: { qty: totalQty, avgPrice: newAvg }
    }));

    setPlaygroundFeedback(`Bought ${playgroundQty} shares of ${activeStock.symbol} at ₹${activeStock.price.toFixed(2)}! Virtual capital deducted: ₹${tradeCost.toLocaleString('en-IN')}.`);
    setTradeCelebration(true);
    window.setTimeout(() => setTradeCelebration(false), 1500);
  };

  const handleSimulateSell = () => {
    if (activeHolding.qty < playgroundQty) {
      setPlaygroundFeedback(`You only hold ${activeHolding.qty} shares of ${activeStock.symbol}. Cannot sell ${playgroundQty}.`);
      return;
    }

    const saleProceeds = activeStock.price * playgroundQty;
    const newCash = playgroundCash + saleProceeds;
    const remainingQty = activeHolding.qty - playgroundQty;

    setPlaygroundCash(newCash);
    setSimulatedHoldings(prev => ({
      ...prev,
      [activeStock.symbol]: {
        qty: remainingQty,
        avgPrice: remainingQty > 0 ? activeHolding.avgPrice : 0
      }
    }));

    setPlaygroundFeedback(`Sold ${playgroundQty} shares of ${activeStock.symbol} at ₹${activeStock.price.toFixed(2)}! ₹${saleProceeds.toLocaleString('en-IN')} credited to cash.`);
    setTradeCelebration(true);
    window.setTimeout(() => setTradeCelebration(false), 1500);
  };

  const handleResetPlayground = () => {
    setPlaygroundCash(1000000);
    setSimulatedHoldings({
      'RELIANCE': { qty: 10, avgPrice: 2940.00 },
      'TCS': { qty: 5, avgPrice: 4090.00 },
    });
    setPlaygroundFeedback('Playground reset to ₹10,00,000 virtual capital!');
  };

  // Calculate simulated portfolio value
  const totalSimulatedHoldingsValue = Object.entries(simulatedHoldings).reduce((sum, [sym, hold]) => {
    const s = SAMPLE_STOCKS.find(st => st.symbol === sym);
    return sum + (s ? s.price * hold.qty : 0);
  }, 0);
  const totalPortfolioWorth = playgroundCash + totalSimulatedHoldingsValue;
  const portfolioPnL = totalPortfolioWorth - 1000000;

  if (launchState) {
    return (
      <AuthLaunchTransition
        user={launchState.user}
        kind={launchState.kind}
        onEnter={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#050906] text-slate-100 flex flex-col font-sans selection:bg-[#00f59b] selection:text-slate-950 relative overflow-y-auto overflow-x-hidden">
      {/* 1. 3D SPATIAL GRAVITATIONAL RUPEE & ACCRETION VORTEX BACKGROUND */}
      <RupeeSpatialBackground intensity="vivid" interactive={true} />

      {/* Ambient Cyber Lighting Orbs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#00f59b]/10 blur-[150px] pointer-events-none rounded-full" />
      <div className="absolute top-[40%] right-1/4 w-[600px] h-[600px] bg-indigo-600/10 blur-[180px] pointer-events-none rounded-full" />
      <div className="absolute bottom-[10%] left-1/3 w-[500px] h-[500px] bg-emerald-600/10 blur-[160px] pointer-events-none rounded-full" />

      <a href="#main-content" className="skip-link">Skip to sign in</a>

      {/* 2. Top Ticker Marquee Bar with Live NSE Status */}
      <div className="sticky top-0 bg-[#030604]/90 backdrop-blur-xl border-b border-white/10 text-white py-2 text-xs overflow-hidden select-none z-30 shadow-md">
        <div className="max-w-[1640px] mx-auto px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="animate-marquee flex items-center gap-8 whitespace-nowrap overflow-hidden">
            <div className="flex items-center gap-6 sm:gap-8 shrink-0">
              <div className={`flex items-center gap-2 px-3 py-0.5 rounded-full text-[11px] font-black border ${
                nseMarketInfo.isNSEMarketOpen
                  ? 'bg-emerald-500/15 border-[#00f59b]/40 text-[#00f59b]'
                  : 'bg-rose-500/15 border-rose-400/40 text-rose-300'
              }`}>
                <span className={`h-2 w-2 rounded-full ${nseMarketInfo.isNSEMarketOpen ? 'bg-[#00f59b] animate-pulse shadow-[0_0_8px_#00f59b]' : 'bg-rose-400'}`} />
                <span>{nseMarketInfo.isNSEMarketOpen ? 'NSE MARKET OPEN' : 'NSE MARKET CLOSED'}</span>
                <span className="opacity-70 font-mono text-[10px]">({nseMarketInfo.nextSessionCountdown})</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-slate-400 font-bold">
                <span>🕒 IST:</span>
                <span className="text-white">{nseMarketInfo.istTimeString}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <span className="text-slate-400 font-bold">NIFTY 50:</span>
                <span className="text-white font-bold">{marketIndices?.nifty50?.value ? marketIndices.nifty50.value.toLocaleString('en-IN') : '24,850.30'}</span>
                <span className="text-[#00f59b] font-bold text-[10px]">+0.65%</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <span className="text-slate-400 font-bold">SENSEX:</span>
                <span className="text-white font-bold">{marketIndices?.sensex?.value ? marketIndices.sensex.value.toLocaleString('en-IN') : '81,520.10'}</span>
                <span className="text-[#00f59b] font-bold text-[10px]">+0.58%</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <span className="text-slate-400 font-bold">BANK NIFTY:</span>
                <span className="text-white font-bold">{marketIndices?.niftyBank?.value ? marketIndices.niftyBank.value.toLocaleString('en-IN') : '51,480.60'}</span>
                <span className="text-[#00f59b] font-bold text-[10px]">+0.82%</span>
              </div>
            </div>
          </div>

          {/* Jump Navigation Buttons */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            <a 
              href="#trade-playground"
              className="text-xs font-bold text-slate-300 hover:text-[#00f59b] transition-colors flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-white/5"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-[#00f59b]" />
              <span>Live Playground</span>
            </a>
            <a 
              href="#dalal-pillars"
              className="text-xs font-bold text-slate-300 hover:text-[#00f59b] transition-colors flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-white/5"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Dalal Pillars</span>
            </a>
            <a 
              href="#teen-academy"
              className="text-xs font-bold text-slate-300 hover:text-[#00f59b] transition-colors flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-white/5"
            >
              <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
              <span>Teen Quiz</span>
            </a>
          </div>
        </div>
      </div>

      {/* Inactive Session Notice */}
      {sessionNotice && (
        <div className="bg-amber-950/70 border-b border-amber-500/40 text-amber-200 px-4 py-2.5 text-xs text-center font-medium z-20 backdrop-blur-md">
          {sessionNotice}
        </div>
      )}

      {/* 3. HERO SECTION: Interactive 3D Auth Terminal & Brand Story */}
      <main id="main-content" tabIndex={-1} className="w-full max-w-[1640px] mx-auto px-4 sm:px-8 xl:px-12 2xl:px-16 py-8 sm:py-12 lg:py-16 outline-none z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* LEFT COLUMN: Brand Hero, Liquid Glass Logo & Value Highlights */}
          <div 
            className="lg:col-span-6 space-y-6 sm:space-y-8 text-left" 
            onPointerMove={handleAuthPointerMove} 
            onPointerLeave={() => setCardTilt({ x: 0, y: 0 })}
            style={{ transform: `rotateX(${cardTilt.x * 0.4}deg) rotateY(${cardTilt.y * 0.4}deg)`, transition: 'transform 0.15s ease' }}
          >
            {/* Animated Liquid Glass Logo Header */}
            <div className="flex items-center gap-4">
              <LiquidGlassLogo size="lg" />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
                    Rupee<span className="text-[#00f59b]">Rookie</span>
                  </h1>
                  <span className="bg-[#00f59b]/15 text-[#00f59b] border border-[#00f59b]/35 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    NSE DALAL STREET
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-400 mt-0.5">
                  National Paper Trading Simulator & Teen Investor Academy
                </p>
              </div>
            </div>

            {/* Hero Headline & Mission */}
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-black text-[#00f59b] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Zero Financial Risk • 100% Educational Sandbox</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-[1.15]">
                Master Dalal Street with <span className="text-[#00f59b] underline decoration-[#00f59b]/40 underline-offset-4">₹10,00,000</span> Virtual Capital.
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal max-w-2xl">
                Practise with 75+ curated Indian equities, real-time interactive technical charts, historical replay engines, and Chanakya AI mentorship—without risking a single real rupee.
              </p>
            </div>

            {/* 4 Feature Badges with Dark Polymo Lighting */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <div className="bg-[#07110a]/85 border border-emerald-500/20 rounded-2xl p-4 shadow-sm hover:border-[#00f59b]/40 transition-all flex items-start gap-3 backdrop-blur-md">
                <div className="p-2.5 rounded-xl bg-amber-400/15 text-amber-300 shrink-0 border border-amber-400/25">
                  <PieChart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white">₹10 Lakhs Virtual Fund</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Realistic order execution, stop loss, and limit orders</p>
                </div>
              </div>

              <div className="bg-[#07110a]/85 border border-emerald-500/20 rounded-2xl p-4 shadow-sm hover:border-[#00f59b]/40 transition-all flex items-start gap-3 backdrop-blur-md">
                <div className="p-2.5 rounded-xl bg-[#00f59b]/15 text-[#00f59b] shrink-0 border border-[#00f59b]/25">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white">75+ Indian Bluechips</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Indicative quotes, RSI, MACD & DuPont analysis</p>
                </div>
              </div>

              <div className="bg-[#07110a]/85 border border-emerald-500/20 rounded-2xl p-4 shadow-sm hover:border-[#00f59b]/40 transition-all flex items-start gap-3 backdrop-blur-md">
                <div className="p-2.5 rounded-xl bg-indigo-400/15 text-indigo-300 shrink-0 border border-indigo-400/25">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white">12 Teen Masterclasses</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Gamified lessons, concept quizzes & unlockable badges</p>
                </div>
              </div>

              <div className="bg-[#07110a]/85 border border-emerald-500/20 rounded-2xl p-4 shadow-sm hover:border-[#00f59b]/40 transition-all flex items-start gap-3 backdrop-blur-md">
                <div className="p-2.5 rounded-xl bg-emerald-400/15 text-emerald-300 shrink-0 border border-emerald-400/25">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white">Chanakya 2.0 AI Coach</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Bilingual trade feedback & portfolio health scores</p>
                </div>
              </div>
            </div>

            {/* Quick Demo Access Box with Liquid Glass Highlight */}
            <div className="bg-[#07120a]/90 border border-amber-400/30 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden backdrop-blur-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#00f59b]/20 border border-[#00f59b]/40 text-[#00f59b] flex items-center justify-center font-black text-base shrink-0">
                    ⚡
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
                      <span>Instant Demo Trader Pass</span>
                      <span className="text-[9px] bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded font-mono font-bold uppercase">
                        NO SIGNUP NEEDED
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Ready demo pass: <strong className="text-slate-200">xyz@gmail.com</strong> (@rookie_trader)
                    </div>
                  </div>
                </div>
                <LiquidButton
                  id="quick-demo-login-btn"
                  size="default"
                  onClick={handleQuickDemoLogin}
                  disabled={loading}
                  className="shrink-0 bg-[#00f59b] text-slate-950 font-black shadow-[0_0_20px_rgba(0,245,155,0.4)] hover:shadow-[0_0_30px_rgba(0,245,155,0.6)]"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>1-Click Demo Pass</span>
                </LiquidButton>
              </div>
            </div>

            {/* Safe Educational Notice & Scroll Indicator */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400 pt-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#00f59b] shrink-0" />
                <span>100% Risk-Free. Indicative market quotes for educational simulation.</span>
              </div>
              <a 
                href="#trade-playground"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00f59b] hover:underline"
              >
                <span>Scroll to Trade Playground</span>
                <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
              </a>
            </div>
          </div>

          {/* RIGHT COLUMN: Dedicated 3D Tilt Login / Signup Card */}
          <div className="lg:col-span-6">
            <SpotlightCard
              glowColor="green"
              spotlightSize={500}
              borderGlow={true}
              tiltEffect={true}
              className="bg-[#0c1410]/95 border border-white/15 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-[0_25px_60px_rgba(0,0,0,0.85)] text-left backdrop-blur-2xl relative"
            >
              {/* Top Specular Accent */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#00f59b]/15 blur-3xl pointer-events-none rounded-full" />

              {/* Expandable Tab Selector: Sign In vs Create Student Account */}
              <div className="flex justify-center mb-6">
                <ExpandableTabs
                  tabs={[
                    { title: "Sign In", icon: Lock },
                    { title: "Create Student Account", icon: GraduationCap, badge: "₹10L FREE" },
                  ]}
                  activeColor="text-[#00f59b]"
                  className="border-white/10 bg-slate-950/80 shadow-inner"
                  onChange={(index) => {
                    setMode(index === 0 ? 'LOGIN' : 'SIGNUP');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                />
              </div>

              {/* Error Message Display */}
              {errorMsg && (
                <div className="mb-5 p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2.5 animate-shake shadow-sm">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Success Message Display */}
              {successMsg && (
                <div className="mb-5 p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2.5 shadow-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* MODE 1: SIGN IN FORM */}
              {mode === 'LOGIN' ? (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#00f59b]" />
                      <span>Email Address or Username</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="login-identifier"
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        placeholder="e.g. xyz@gmail.com or rookie_trader"
                        autoComplete="username"
                        className="w-full px-4 py-3 bg-[#08100b] border border-white/15 focus:border-[#00f59b] focus:ring-1 focus:ring-[#00f59b] rounded-xl text-white text-sm outline-none transition-all placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-[#00f59b]" />
                        <span>Password</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[11px] text-[#00f59b] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showPassword ? 'Hide' : 'Show'}</span>
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="login-password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        className="w-full px-4 py-3 bg-[#08100b] border border-white/15 focus:border-[#00f59b] focus:ring-1 focus:ring-[#00f59b] rounded-xl text-white text-sm outline-none transition-all placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <LiquidButton
                      type="submit"
                      id="login-submit-btn"
                      size="lg"
                      disabled={loading}
                      className="w-full bg-[#00f59b] text-slate-950 font-black text-sm shadow-[0_0_25px_rgba(0,245,155,0.4)]"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Enter Dalal Street Simulator</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </LiquidButton>
                  </div>

                  <div className="pt-3 border-t border-white/10 text-center">
                    <p className="text-xs text-slate-400">
                      New to RupeeRookie?{' '}
                      <button
                        type="button"
                        onClick={() => { setMode('SIGNUP'); setErrorMsg(''); }}
                        className="text-[#00f59b] font-black hover:underline cursor-pointer ml-1"
                      >
                        Create Free Student Account
                      </button>
                    </p>
                  </div>
                </form>
              ) : (
                /* MODE 2: SIGN UP FORM */
                <form onSubmit={handleSignupSubmit} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#00f59b]" />
                      <span>Full Name</span>
                    </label>
                    <input
                      type="text"
                      id="signup-fullname"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="e.g. Arjun Sharma"
                      className="w-full px-3.5 py-2.5 bg-[#08100b] border border-white/15 focus:border-[#00f59b] rounded-xl text-white text-sm outline-none transition-all placeholder:text-slate-600"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#00f59b]" />
                        <span>Email</span>
                      </label>
                      <input
                        type="email"
                        id="signup-email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="arjun@school.edu"
                        className="w-full px-3.5 py-2.5 bg-[#08100b] border border-white/15 focus:border-[#00f59b] rounded-xl text-white text-sm outline-none transition-all placeholder:text-slate-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#00f59b]" />
                        <span>Username</span>
                      </label>
                      <input
                        type="text"
                        id="signup-username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="arjun_investor"
                        className="w-full px-3.5 py-2.5 bg-[#08100b] border border-white/15 focus:border-[#00f59b] rounded-xl text-white text-sm outline-none transition-all placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-[#00f59b]" />
                        <span>Create Password</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[11px] text-[#00f59b] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showPassword ? 'Hide' : 'Show'}</span>
                      </button>
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="signup-password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="At least 8 characters"
                      className="w-full px-3.5 py-2.5 bg-[#08100b] border border-white/15 focus:border-[#00f59b] rounded-xl text-white text-sm outline-none transition-all placeholder:text-slate-600"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-[#00f59b]" />
                        <span>Age Category</span>
                      </label>
                      <select
                        id="signup-agegroup"
                        value={formData.ageGroup}
                        onChange={(e) => setFormData({ ...formData, ageGroup: e.target.value })}
                        className="w-full px-3 py-2.5 bg-[#08100b] border border-white/15 focus:border-[#00f59b] rounded-xl text-white text-xs outline-none"
                      >
                        <option value="13-15 (Middle School)">13-15 (Middle School)</option>
                        <option value="16-18 (High School Teen)">16-18 (High School Teen)</option>
                        <option value="19-24 (College/Undergrad)">19-24 (College / Undergrad)</option>
                        <option value="25+ (Adult Learner)">25+ (Adult Beginner)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-[#00f59b]" />
                        <span>Stock Market Experience</span>
                      </label>
                      <select
                        id="signup-experience"
                        value={formData.experienceLevel}
                        onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value as any })}
                        className="w-full px-3 py-2.5 bg-[#08100b] border border-white/15 focus:border-[#00f59b] rounded-xl text-white text-xs outline-none"
                      >
                        <option value="BEGINNER">Absolute Beginner (Newbie)</option>
                        <option value="INTERMEDIATE">Intermediate (Knows P/E, Nifty)</option>
                        <option value="ADVANCED">Advanced (Technicals & Options)</option>
                      </select>
                    </div>
                  </div>

                  {/* Terms Checkbox */}
                  <div className="flex items-start gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="signup-terms"
                      checked={agreedTerms}
                      onChange={(e) => setAgreedTerms(e.target.checked)}
                      className="mt-0.5 rounded border-white/20 text-[#00f59b] focus:ring-[#00f59b] bg-[#08100b] cursor-pointer"
                    />
                    <label htmlFor="signup-terms" className="text-[11px] text-slate-400 cursor-pointer">
                      I understand that RupeeRookie is an educational paper trading simulator with ₹10,00,000 virtual funds and zero real financial risk.
                    </label>
                  </div>

                  <div className="pt-2">
                    <LiquidButton
                      type="submit"
                      id="signup-submit-btn"
                      size="lg"
                      disabled={loading}
                      className="w-full bg-[#00f59b] text-slate-950 font-black text-sm shadow-[0_0_25px_rgba(0,245,155,0.4)]"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Create Account & Claim ₹10,00,000</span>
                        </>
                      )}
                    </LiquidButton>
                  </div>

                  <div className="pt-2 border-t border-white/10 text-center">
                    <p className="text-xs text-slate-400">
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => { setMode('LOGIN'); setErrorMsg(''); }}
                        className="text-[#00f59b] font-black hover:underline cursor-pointer ml-1"
                      >
                        Sign In here
                      </button>
                    </p>
                  </div>
                </form>
              )}

            </SpotlightCard>
          </div>

        </div>
      </main>

      {/* 4. SECTION 1: "TRY BEFORE YOU SIGN IN" INTERACTIVE TRADE PLAYGROUND */}
      <section id="trade-playground" className="w-full max-w-[1640px] mx-auto px-4 sm:px-8 xl:px-12 2xl:px-16 py-12 sm:py-16 border-t border-white/10 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00f59b]/15 border border-[#00f59b]/35 text-xs font-black text-[#00f59b] uppercase tracking-wider mb-3">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Interactive Simulator Playground</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Try a Live Trade <span className="text-[#00f59b]">Before</span> You Sign In.
          </h2>
          <p className="text-sm text-slate-300 mt-2">
            Select an Indian bluechip below, pick your quantity, and click Simulate Buy or Sell. See how virtual order execution feels in real time!
          </p>
        </div>

        {/* The Live Interactive Sandbox Terminal */}
        <div className="bg-[#09140e]/95 border border-emerald-500/25 rounded-3xl p-5 sm:p-8 lg:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl relative overflow-hidden">
          
          {/* Top Metric Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-6 border-b border-white/10">
            <div className="bg-[#0c1b13] p-4 rounded-2xl border border-emerald-500/20">
              <span className="text-xs text-slate-400 font-semibold">Virtual Cash Available</span>
              <div className="text-xl sm:text-2xl font-black text-[#00f59b] font-mono mt-1">
                ₹{playgroundCash.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="bg-[#0c1b13] p-4 rounded-2xl border border-emerald-500/20">
              <span className="text-xs text-slate-400 font-semibold">Simulated Portfolio Value</span>
              <div className="text-xl sm:text-2xl font-black text-white font-mono mt-1">
                ₹{totalPortfolioWorth.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="bg-[#0c1b13] p-4 rounded-2xl border border-emerald-500/20 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-semibold">Unrealized Demo P&L</span>
                <div className={`text-xl sm:text-2xl font-black font-mono mt-1 flex items-center gap-1.5 ${
                  portfolioPnL >= 0 ? 'text-[#00f59b]' : 'text-rose-400'
                }`}>
                  {portfolioPnL >= 0 ? '+' : ''}₹{portfolioPnL.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <button
                onClick={handleResetPlayground}
                title="Reset Playground Sandbox"
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Stock Selector Chips */}
          <div className="pt-6">
            <label className="text-xs font-bold text-slate-300 mb-3 block">Choose Stock to Simulate:</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
              {SAMPLE_STOCKS.map((st) => {
                const isSelected = st.symbol === selectedStockSymbol;
                const isUp = st.change >= 0;
                return (
                  <button
                    key={st.symbol}
                    type="button"
                    onClick={() => {
                      setSelectedStockSymbol(st.symbol);
                      setPlaygroundFeedback(`Selected ${st.symbol} (${st.sector}). Indicative price: ₹${st.price.toFixed(2)}.`);
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-[#00f59b]/20 border-[#00f59b] shadow-[0_0_18px_rgba(0,245,155,0.3)]'
                        : 'bg-[#08120b] border-white/10 hover:border-emerald-500/40 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-sm text-white">{st.symbol}</span>
                      <span className={`text-[10px] font-bold font-mono ${isUp ? 'text-[#00f59b]' : 'text-rose-400'}`}>
                        {isUp ? '+' : ''}{st.change}%
                      </span>
                    </div>
                    <div className="text-xs font-mono text-slate-200 mt-1">₹{st.price.toFixed(2)}</div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">{st.sector}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Stock Live Card & Action Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-center bg-[#070e09] rounded-2xl p-4 sm:p-6 border border-white/10">
            {/* Stock Meta & Mini Sparkline */}
            <div className="lg:col-span-6 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-black text-white flex items-center gap-2">
                    <span>{activeStock.name}</span>
                    <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded text-slate-300">NSE EQ</span>
                  </h4>
                  <p className="text-xs text-slate-400">{activeStock.sector}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black font-mono text-white">₹{activeStock.price.toFixed(2)}</div>
                  <span className={`text-xs font-mono font-bold inline-flex items-center gap-0.5 ${
                    activeStock.change >= 0 ? 'text-[#00f59b]' : 'text-rose-400'
                  }`}>
                    {activeStock.change >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {activeStock.change >= 0 ? '+' : ''}{activeStock.change}% Today
                  </span>
                </div>
              </div>

              {/* Interactive SVG Sparkline with Gradient Fill */}
              <div className="h-20 w-full relative">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 300 70" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="sampleSparkGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00f59b" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#00f59b" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {/* Generate path points */}
                  {(() => {
                    const min = Math.min(...activeStock.sparkline);
                    const max = Math.max(...activeStock.sparkline);
                    const range = max - min || 1;
                    const pts = activeStock.sparkline.map((v, i) => {
                      const x = (i / (activeStock.sparkline.length - 1)) * 300;
                      const y = 60 - ((v - min) / range) * 50;
                      return `${x},${y}`;
                    });
                    const dLine = `M ${pts.join(' L ')}`;
                    const dArea = `${dLine} L 300,70 L 0,70 Z`;
                    return (
                      <>
                        <path d={dArea} fill="url(#sampleSparkGradient)" />
                        <path d={dLine} fill="none" stroke="#00f59b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </>
                    );
                  })()}
                </svg>
              </div>

              {/* Current Holding Status */}
              <div className="flex items-center gap-3 text-xs text-slate-300 bg-white/5 p-2.5 rounded-xl">
                <span>Holdings in sandbox:</span>
                <span className="font-mono font-bold text-white">{activeHolding.qty} shares</span>
                {activeHolding.qty > 0 && (
                  <>
                    <span>•</span>
                    <span>Avg Buy: <strong className="font-mono text-emerald-400">₹{activeHolding.avgPrice.toFixed(2)}</strong></span>
                  </>
                )}
              </div>
            </div>

            {/* Trading Order Controls */}
            <div className="lg:col-span-6 space-y-4 bg-[#09150e] p-4 sm:p-5 rounded-xl border border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Quantity (Shares):</span>
                <div className="flex items-center gap-1.5">
                  {[1, 5, 10, 25, 50].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setPlaygroundQty(q)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                        playgroundQty === q
                          ? 'bg-[#00f59b] text-slate-950 shadow-sm'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-300 font-mono">
                <span>Estimated Trade Value:</span>
                <span className="font-bold text-white text-sm">₹{tradeCost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>

              {/* Buy & Sell Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <LiquidButton
                  size="default"
                  onClick={handleSimulateBuy}
                  className="bg-[#00f59b] text-slate-950 font-black shadow-[0_0_15px_rgba(0,245,155,0.3)]"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Simulate Buy</span>
                </LiquidButton>

                <LiquidButton
                  size="default"
                  onClick={handleSimulateSell}
                  disabled={activeHolding.qty === 0}
                  className={`font-black ${
                    activeHolding.qty > 0
                      ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                      : 'bg-white/10 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <TrendingDown className="w-4 h-4" />
                  <span>Simulate Sell</span>
                </LiquidButton>
              </div>

              {/* Chanakya Mentor Speech Toast */}
              <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/25 flex items-start gap-2.5 text-xs text-amber-200">
                <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-bold text-amber-300">Chanakya AI Wisdom:</div>
                  <p className="text-[11.5px] leading-relaxed text-amber-100/90">{activeStock.chanakyaInsight}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Live Action Feedback Notice */}
          <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00f59b] animate-ping" />
              <span>{playgroundFeedback}</span>
            </div>
            <a 
              href="#main-content"
              onClick={() => { setMode('SIGNUP'); }}
              className="text-[#00f59b] font-black hover:underline inline-flex items-center gap-1"
            >
              <span>Keep this portfolio (Sign up free)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

        </div>
      </section>

      {/* 5. SECTION 2: THE 4 DALAL STREET PILLARS (RANKED 01 - 04) */}
      <section id="dalal-pillars" className="w-full max-w-[1640px] mx-auto px-4 sm:px-8 xl:px-12 2xl:px-16 py-12 sm:py-16 border-t border-white/10 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/35 text-xs font-black text-indigo-300 uppercase tracking-wider mb-3">
            <Layers className="w-3.5 h-3.5" />
            <span>Built for Modern Indian Traders</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Four Pillars of the <span className="text-[#00f59b]">RupeeRookie</span> Advantage
          </h2>
          <p className="text-sm text-slate-300 mt-2">
            Engineered with deep fintech fidelity, professional risk controls, and teenage pedagogy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Pillar 01 */}
          <div className="bg-[#07110a]/90 border border-emerald-500/20 rounded-3xl p-6 sm:p-7 relative overflow-hidden backdrop-blur-xl group hover:border-[#00f59b]/50 transition-all shadow-lg flex flex-col justify-between">
            <div className="text-5xl font-black font-mono text-[#00f59b]/20 absolute top-4 right-5 group-hover:text-[#00f59b]/35 transition-colors select-none">
              01
            </div>
            <div className="space-y-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-[#00f59b]/15 border border-[#00f59b]/30 flex items-center justify-center text-[#00f59b]">
                <PieChart className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white">₹10 Lakhs Virtual Sandbox</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Practice capital allocation across largecaps, midcaps, and dividend aristocrats with real slippage and zero wallet danger.
              </p>
            </div>
            <div className="pt-5 border-t border-white/10 mt-5 text-[11px] font-mono text-[#00f59b] font-bold">
              • Market & Limit Orders • Real-time P&L
            </div>
          </div>

          {/* Pillar 02 */}
          <div className="bg-[#07110a]/90 border border-emerald-500/20 rounded-3xl p-6 sm:p-7 relative overflow-hidden backdrop-blur-xl group hover:border-[#00f59b]/50 transition-all shadow-lg flex flex-col justify-between">
            <div className="text-5xl font-black font-mono text-[#00f59b]/20 absolute top-4 right-5 group-hover:text-[#00f59b]/35 transition-colors select-none">
              02
            </div>
            <div className="space-y-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white">75+ Indian Bluechips</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Indicative quotes, interactive 16-point SVG curves, sector rotations, 52-week high/low trackers, and DuPont 3-way breakdown.
              </p>
            </div>
            <div className="pt-5 border-t border-white/10 mt-5 text-[11px] font-mono text-indigo-300 font-bold">
              • Nifty 50 • Bank Nifty • IT Leaders
            </div>
          </div>

          {/* Pillar 03 */}
          <div className="bg-[#07110a]/90 border border-emerald-500/20 rounded-3xl p-6 sm:p-7 relative overflow-hidden backdrop-blur-xl group hover:border-[#00f59b]/50 transition-all shadow-lg flex flex-col justify-between">
            <div className="text-5xl font-black font-mono text-[#00f59b]/20 absolute top-4 right-5 group-hover:text-[#00f59b]/35 transition-colors select-none">
              03
            </div>
            <div className="space-y-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white">Teen Investor Academy</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                12 bite-sized lessons covering compound interest, P/E valuations, balance sheet hygiene, and behavioral psychology with XP levels.
              </p>
            </div>
            <div className="pt-5 border-t border-white/10 mt-5 text-[11px] font-mono text-amber-300 font-bold">
              • Gamified Quizzes • Level 1-5 XP
            </div>
          </div>

          {/* Pillar 04 */}
          <div className="bg-[#07110a]/90 border border-emerald-500/20 rounded-3xl p-6 sm:p-7 relative overflow-hidden backdrop-blur-xl group hover:border-[#00f59b]/50 transition-all shadow-lg flex flex-col justify-between">
            <div className="text-5xl font-black font-mono text-[#00f59b]/20 absolute top-4 right-5 group-hover:text-[#00f59b]/35 transition-colors select-none">
              04
            </div>
            <div className="space-y-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-[#00f59b]">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white">Chanakya 2.0 AI Coach</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Real-time conversational mentor offering risk critique, diversification analysis, and market history in English & Hindi.
              </p>
            </div>
            <div className="pt-5 border-t border-white/10 mt-5 text-[11px] font-mono text-[#00f59b] font-bold">
              • Instant Risk Audits • Indian Context
            </div>
          </div>
        </div>
      </section>

      {/* 6. SECTION 3: INTERACTIVE TEEN ACADEMY QUIZ & CHANAKYA SUTRAS */}
      <section id="teen-academy" className="w-full max-w-[1640px] mx-auto px-4 sm:px-8 xl:px-12 2xl:px-16 py-12 sm:py-16 border-t border-white/10 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Interactive Mini-Quiz */}
          <div className="lg:col-span-6 bg-[#08120b]/95 border border-white/15 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="p-2 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30">
                <HelpCircle className="w-4 h-4" />
              </span>
              <div>
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">TEEN FINANCIAL LITERACY CHECK</span>
                <h3 className="text-lg font-black text-white">Quick Dalal Street Quiz</h3>
              </div>
            </div>

            <p className="text-sm font-semibold text-slate-200 mb-4">
              "What does a Return on Capital Employed (ROCE) of 35% typically mean for a company like TCS or Reliance?"
            </p>

            <div className="space-y-2.5">
              {[
                { id: 0, text: "The company generates ₹35 in operating profit for every ₹100 of capital employed in the business.", correct: true },
                { id: 1, text: "The stock price will automatically decline by 35% in the upcoming quarterly results.", correct: false },
                { id: 2, text: "The company borrows 35% of its revenues from commercial banks.", correct: false },
              ].map((opt) => {
                const isSelected = quizAnswer === opt.id;
                let btnStyle = "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10";
                if (quizSubmitted) {
                  if (opt.correct) {
                    btnStyle = "bg-emerald-500/20 border-[#00f59b] text-[#00f59b]";
                  } else if (isSelected && !opt.correct) {
                    btnStyle = "bg-rose-500/20 border-rose-500 text-rose-300";
                  }
                } else if (isSelected) {
                  btnStyle = "bg-[#00f59b]/15 border-[#00f59b] text-white";
                }

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setQuizAnswer(opt.id);
                      setQuizSubmitted(true);
                    }}
                    className={`w-full p-3.5 rounded-2xl border text-left text-xs font-medium transition-all flex items-center justify-between gap-3 ${btnStyle}`}
                  >
                    <span>{opt.text}</span>
                    {quizSubmitted && opt.correct && (
                      <CheckCircle2 className="w-4 h-4 text-[#00f59b] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {quizSubmitted && (
              <div className="mt-4 p-3.5 rounded-xl bg-emerald-500/10 border border-[#00f59b]/30 text-xs text-emerald-200 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-[#00f59b] shrink-0 mt-0.5" />
                <p>
                  <strong>Great job!</strong> ROCE measures how efficiently a company allocates its capital to generate profits. Superior ROCE (&gt; 20%) is a hallmark of high-quality Indian compounders.
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Chanakya's Dalal Street Sutras */}
          <div className="lg:col-span-6 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/35 text-xs font-black text-amber-300 uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5" />
              <span>Timeless Dalal Street Sutras</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Wisdom passed down by Indian Market Mentors
            </h3>
            
            <div className="space-y-3 pt-2">
              {DALAL_SUTRAS.map((sutra, idx) => (
                <div key={idx} className="p-4 sm:p-5 rounded-2xl bg-[#08120b]/90 border border-emerald-500/20 backdrop-blur-xl space-y-1.5">
                  <div className="text-sm font-bold text-amber-300 font-serif">
                    "{sutra.sanskrit}"
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {sutra.english}
                  </p>
                  <div className="text-[10px] font-mono text-[#00f59b] font-semibold pt-1">
                    — {sutra.author}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* 7. EXPANDED TRUST & COMPLIANCE FOOTER */}
      <footer className="border-t border-white/10 bg-[#040705] py-8 text-xs text-slate-400 z-10">
        <div className="max-w-[1640px] mx-auto px-4 sm:px-8 xl:px-12 2xl:px-16 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <LiquidGlassLogo size="sm" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">RupeeRookie</span>
                <span className="text-[10px] bg-emerald-500/20 text-[#00f59b] px-2 py-0.5 rounded-full font-mono font-bold">NSE SIMULATOR</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Educational paper trading simulator designed for high school & university students across India.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-[11.5px] text-slate-400">
            <span>🛡️ 100% Client-Side Sandbox</span>
            <span>•</span>
            <span>Virtual ₹10,00,000 Capital</span>
            <span>•</span>
            <span>Zero Financial Liability</span>
            <span>•</span>
            <span>Not SEBI Advisory</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
