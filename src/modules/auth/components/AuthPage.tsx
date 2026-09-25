import React, { useEffect, useState, useMemo } from 'react';
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
  ArrowLeft,
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
import { useSimulator } from '../../../context/SimulatorContext';
import { GoogleSignInButton, AuthOrDivider } from './GoogleSignInButton';
import { AuthFormData, UserAccount } from '../../../types';
import { AuthLaunchTransition } from './AuthLaunchTransition';
import { SpotlightCard } from '../../../components/ui/spotlight-card';
import { ExpandableTabs } from '../../../components/ui/expandable-tabs';
import { RupeeSpatialBackground } from '../../../components/ui/rupee-spatial-background';
import { LiquidButton } from '../../../components/ui/liquid-glass-button';
import { LiquidGlassLogo } from '../../../components/ui/LiquidGlassLogo';

interface SampleStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  sector: string;
  sparkline: number[];
  chanakyaInsight: string;
}

const BASE_SAMPLE_STOCKS: SampleStock[] = [
  {
    symbol: 'RELIANCE',
    name: 'Reliance Industries Ltd.',
    price: 1226.40,
    change: -1.41,
    sector: 'Energy & Telecom',
    sparkline: [1210, 1215, 1222, 1218, 1225, 1230, 1228, 1235, 1242, 1238, 1232, 1236, 1240, 1234, 1228, 1230, 1225, 1226.40],
    chanakyaInsight: "Reliance anchors portfolios with immense cash flow from oil-to-chemicals, Jio 5G, and national retail expansion.",
  },
  {
    symbol: 'TCS',
    name: 'Tata Consultancy Services',
    price: 2105.00,
    change: -3.88,
    sector: 'IT & Tech Services',
    sparkline: [2160, 2155, 2162, 2150, 2145, 2138, 2142, 2130, 2125, 2128, 2120, 2115, 2122, 2118, 2110, 2114, 2108, 2105.00],
    chanakyaInsight: "TCS represents defensive IT leadership with superior ROCE > 48% and rock-solid global balance sheet governance.",
  },
  {
    symbol: 'HDFCBANK',
    name: 'HDFC Bank Limited',
    price: 731.00,
    change: 2.52,
    sector: 'Banking & Financials',
    sparkline: [710, 712, 715, 714, 718, 722, 720, 725, 724, 728, 726, 730, 728, 732, 730, 734, 732, 731.00],
    chanakyaInsight: "Private banking giant! Credit expansion and stable CASA deposits make HDFC Bank the bedrock of Dalal Street.",
  },
  {
    symbol: 'TATAMOTORS',
    name: 'Tata Motors Limited',
    price: 303.80,
    change: -3.40,
    sector: 'Automobile & EV',
    sparkline: [312, 311, 313, 310, 308, 309, 307, 305, 306, 304, 305, 303, 304, 302, 303, 304, 303.5, 303.80],
    chanakyaInsight: "Turnaround champion in EV passenger vehicles and JLR luxury! Auto cyclicality demands strict stop-loss rules.",
  },
  {
    symbol: 'ZOMATO',
    name: 'Zomato Limited',
    price: 326.85,
    change: 1.40,
    sector: 'Consumer Internet',
    sparkline: [318, 319, 321, 320, 323, 322, 325, 324, 326, 325, 327, 326, 328, 327, 329, 328, 327, 326.85],
    chanakyaInsight: "Hyper-growth consumer platform turning profitable! Watch Blinkit quick commerce order velocity and margins.",
  },
  {
    symbol: 'INFY',
    name: 'Infosys Limited',
    price: 1051.40,
    change: -0.68,
    sector: 'IT & Tech Services',
    sparkline: [1060, 1058, 1062, 1059, 1055, 1057, 1053, 1050, 1052, 1048, 1050, 1046, 1048, 1052, 1049, 1053, 1050, 1051.40],
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

export const AuthPage: React.FC<{ initialMode?: 'LOGIN' | 'SIGNUP'; onBackToLanding?: () => void }> = ({ 
  initialMode = 'LOGIN',
  onBackToLanding,
}) => {
  const { loginUser, registerUser, loginWithGoogle, nseMarketInfo, marketIndices, stocks } = useSimulator();

  // Dynamically resolve live or context prices for sample stocks if available
  const sampleStocks: SampleStock[] = useMemo(() => {
    return BASE_SAMPLE_STOCKS.map((base) => {
      const match = stocks?.find((s) => s.symbol === base.symbol);
      if (match && typeof match.price === 'number' && match.price > 0) {
        const sparkline = [...base.sparkline];
        sparkline[sparkline.length - 1] = match.price;
        return {
          ...base,
          price: match.price,
          change: typeof match.changePercent === 'number' ? match.changePercent : base.change,
          sparkline,
        };
      }
      return base;
    });
  }, [stocks]);

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
    'RELIANCE': { qty: 10, avgPrice: 1215.00 },
    'TCS': { qty: 5, avgPrice: 2080.00 },
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
    const res = await loginUser('xyz@gmail.com', 'demo');
    if (res.success && res.user) {
      window.dispatchEvent(new CustomEvent('rr_auth_success', { detail: { kind: 'returning' } }));
      setLaunchState({ user: res.user, kind: 'returning' });
    } else {
      setLoading(false);
      setErrorMsg(res.message || 'Demo login failed');
    }
  };

  const handleGoogleCredential = async (credential: string) => {
    setErrorMsg('');
    setLoading(true);
    const res = await loginWithGoogle(credential);
    if (res.success && res.user) {
      const kind = res.isNew ? 'new' : 'returning';
      window.dispatchEvent(new CustomEvent('rr_auth_success', { detail: { kind } }));
      setLaunchState({ user: res.user, kind });
    } else {
      setLoading(false);
      setErrorMsg(res.message || 'Google sign-in failed. Please try again.');
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
  const activeStock = sampleStocks.find(s => s.symbol === selectedStockSymbol) || sampleStocks[0];
  const activeHolding = simulatedHoldings[activeStock.symbol] || { qty: 0, avgPrice: 0 };
  const tradeCost = activeStock.price * playgroundQty;

  const handleSimulateBuy = () => {
    if (playgroundCash < tradeCost) {
      setPlaygroundFeedback(`Insufficient virtual funds. You need ₹${tradeCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`);
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

    setPlaygroundFeedback(`Bought ${playgroundQty} shares of ${activeStock.symbol} at ₹${activeStock.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}! Virtual capital deducted: ₹${tradeCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`);
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

    setPlaygroundFeedback(`Sold ${playgroundQty} shares of ${activeStock.symbol} at ₹${activeStock.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}! ₹${saleProceeds.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} credited to cash.`);
    setTradeCelebration(true);
    window.setTimeout(() => setTradeCelebration(false), 1500);
  };

  const handleResetPlayground = () => {
    setPlaygroundCash(1000000);
    setSimulatedHoldings({
      'RELIANCE': { qty: 10, avgPrice: 2950.00 },
      'TCS': { qty: 5, avgPrice: 3920.00 },
    });
    setPlaygroundFeedback('Playground reset to ₹10,00,000 virtual capital!');
  };

  // Calculate simulated portfolio value
  const totalSimulatedHoldingsValue = Object.entries(simulatedHoldings).reduce((sum, [sym, hold]) => {
    const s = sampleStocks.find(st => st.symbol === sym);
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
    <div className="min-h-screen bg-[#050906] text-slate-100 flex flex-col font-sans selection:bg-mint selection:text-slate-950 relative overflow-y-auto overflow-x-hidden">
      {/* 1. 3D SPATIAL GRAVITATIONAL RUPEE & ACCRETION VORTEX BACKGROUND */}
      <RupeeSpatialBackground intensity="vivid" interactive={true} />

      {/* Ambient Cyber Lighting Orbs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-mint/10 blur-[150px] pointer-events-none rounded-full" />
      <div className="absolute top-[40%] right-1/4 w-[600px] h-[600px] bg-indigo-600/10 blur-[180px] pointer-events-none rounded-full" />
      <div className="absolute bottom-[10%] left-1/3 w-[500px] h-[500px] bg-emerald-600/10 blur-[160px] pointer-events-none rounded-full" />

      <a href="#main-content" className="skip-link">Skip to sign in</a>

      {/* 2. Top Ticker Bar with Back to Landing & Live NSE Status */}
      <div className="sticky top-0 bg-[#030604]/95 backdrop-blur-xl border-b border-white/10 text-white py-2 text-xs select-none z-30 shadow-md">
        <div className="max-w-[1640px] mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 overflow-hidden">
            {onBackToLanding && (
              <button
                type="button"
                onClick={onBackToLanding}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-white transition-all shrink-0 hover:border-mint/40 cursor-pointer shadow-sm active:scale-95"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-mint" />
                <span className="hidden sm:inline">Back to</span>
                <span>Landing</span>
              </button>
            )}

            <div className="flex items-center gap-3 sm:gap-6 whitespace-nowrap overflow-x-auto no-scrollbar py-0.5">
              <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black border shrink-0 ${
                nseMarketInfo.isNSEMarketOpen
                  ? 'bg-emerald-500/15 border-mint/40 text-mint'
                  : 'bg-rose-500/15 border-rose-400/40 text-rose-300'
              }`}>
                <span className={`h-2 w-2 rounded-full ${nseMarketInfo.isNSEMarketOpen ? 'bg-mint animate-pulse shadow-[0_0_8px_#00f59b]' : 'bg-rose-400'}`} />
                <span>{nseMarketInfo.isNSEMarketOpen ? 'NSE OPEN' : 'NSE CLOSED'}</span>
                <span className="opacity-70 font-mono text-[9px] sm:text-[10px] hidden md:inline">({nseMarketInfo.nextSessionCountdown})</span>
              </div>
              <div className="hidden md:flex items-center gap-1.5 font-mono text-slate-400 font-bold text-xs shrink-0">
                <span>🕒 IST:</span>
                <span className="text-white">{nseMarketInfo.istTimeString}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-mono shrink-0">
                <span className="text-slate-400 font-bold">NIFTY:</span>
                <span className="text-white font-bold">{marketIndices?.nifty50?.value ? marketIndices.nifty50.value.toLocaleString('en-IN') : '24,850.30'}</span>
                <span className="text-mint font-bold text-[10px]">+0.65%</span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono shrink-0">
                <span className="text-slate-400 font-bold">SENSEX:</span>
                <span className="text-white font-bold">{marketIndices?.sensex?.value ? marketIndices.sensex.value.toLocaleString('en-IN') : '81,520.10'}</span>
                <span className="text-mint font-bold text-[10px]">+0.58%</span>
              </div>
              <div className="hidden xl:flex items-center gap-1.5 text-xs font-mono shrink-0">
                <span className="text-slate-400 font-bold">BANK NIFTY:</span>
                <span className="text-white font-bold">{marketIndices?.niftyBank?.value ? marketIndices.niftyBank.value.toLocaleString('en-IN') : '51,480.60'}</span>
                <span className="text-mint font-bold text-[10px]">+0.82%</span>
              </div>
            </div>
          </div>

          {/* Jump Navigation Buttons */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            <a 
              href="#trade-playground"
              className="text-xs font-bold text-slate-300 hover:text-mint transition-colors flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-white/5"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-mint" />
              <span>Live Playground</span>
            </a>
            <a 
              href="#dalal-pillars"
              className="text-xs font-bold text-slate-300 hover:text-mint transition-colors flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-white/5"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Dalal Pillars</span>
            </a>
            <a 
              href="#teen-academy"
              className="text-xs font-bold text-slate-300 hover:text-mint transition-colors flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-white/5"
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
            className="order-2 lg:order-1 lg:col-span-6 space-y-6 sm:space-y-8 text-left" 
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
                    Rupee<span className="text-mint">Rookie</span>
                  </h1>
                  <span className="bg-mint/15 text-mint border border-mint/35 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
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
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-black text-mint uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Zero Financial Risk • 100% Educational Sandbox</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-[1.15]">
                Master Dalal Street with <span className="text-mint underline decoration-mint/40 underline-offset-4">₹10,00,000</span> Virtual Capital.
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal max-w-2xl">
                Practise with 75+ curated Indian equities, real-time interactive technical charts, historical replay engines, and Chanakya AI mentorship—without risking a single real rupee.
              </p>
            </div>

            {/* 4 Feature Badges with Dark Polymo Lighting */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <div className="bg-[#07110a]/85 border border-emerald-500/20 rounded-2xl p-4 shadow-sm hover:border-mint/40 transition-all flex items-start gap-3 backdrop-blur-md">
                <div className="p-2.5 rounded-xl bg-amber-400/15 text-amber-300 shrink-0 border border-amber-400/25">
                  <PieChart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white">₹10 Lakhs Virtual Fund</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Realistic order execution, stop loss, and limit orders</p>
                </div>
              </div>

              <div className="bg-[#07110a]/85 border border-emerald-500/20 rounded-2xl p-4 shadow-sm hover:border-mint/40 transition-all flex items-start gap-3 backdrop-blur-md">
                <div className="p-2.5 rounded-xl bg-mint/15 text-mint shrink-0 border border-mint/25">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white">75+ Indian Bluechips</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Indicative quotes, RSI, MACD & DuPont analysis</p>
                </div>
              </div>

              <div className="bg-[#07110a]/85 border border-emerald-500/20 rounded-2xl p-4 shadow-sm hover:border-mint/40 transition-all flex items-start gap-3 backdrop-blur-md">
                <div className="p-2.5 rounded-xl bg-indigo-400/15 text-indigo-300 shrink-0 border border-indigo-400/25">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white">12 Teen Masterclasses</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Gamified lessons, concept quizzes & unlockable badges</p>
                </div>
              </div>

              <div className="bg-[#07110a]/85 border border-emerald-500/20 rounded-2xl p-4 shadow-sm hover:border-mint/40 transition-all flex items-start gap-3 backdrop-blur-md">
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
                  <div className="w-10 h-10 rounded-xl bg-mint/20 border border-mint/40 text-mint flex items-center justify-center font-black text-base shrink-0">
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
                  className="shrink-0 bg-mint text-slate-950 font-black shadow-[0_0_20px_rgba(0,245,155,0.4)] hover:shadow-[0_0_30px_rgba(0,245,155,0.6)]"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>1-Click Demo Pass</span>
                </LiquidButton>
              </div>
            </div>

            {/* Safe Educational Notice & Scroll Indicator */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400 pt-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-mint shrink-0" />
                <span>100% Risk-Free. Indicative market quotes for educational simulation.</span>
              </div>
              <a 
                href="#trade-playground"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-mint hover:underline"
              >
                <span>Scroll to Trade Playground</span>
                <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
              </a>
            </div>
          </div>

          {/* RIGHT COLUMN: Dedicated 3D Tilt Login / Signup Card */}
          <div className="order-1 lg:order-2 lg:col-span-6">
            <SpotlightCard
              glowColor="green"
              spotlightSize={500}
              borderGlow={true}
              tiltEffect={true}
              className="bg-[#0c1410]/95 border border-white/15 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-[0_25px_60px_rgba(0,0,0,0.85)] text-left backdrop-blur-2xl relative"
            >
              {/* Top Specular Accent */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-mint/15 blur-3xl pointer-events-none rounded-full" />

              {/* Expandable Tab Selector: Sign In vs Create Student Account */}
              <div className="flex justify-center mb-6">
                <ExpandableTabs
                  tabs={[
                    { title: "Sign In", icon: Lock },
                    { title: "Create Student Account", icon: GraduationCap, badge: "₹10L FREE" },
                  ]}
                  /* Without this the tabs render icon-only until tapped, so on a
                     phone there is nothing saying which mode you are in. */
                  defaultSelected={mode === 'LOGIN' ? 0 : 1}
                  activeColor="text-mint"
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

              {/* Google Sign-In / Sign-Up (hidden when GOOGLE_CLIENT_ID is not configured) */}
              <GoogleSignInButton
                onCredential={handleGoogleCredential}
                text={mode === 'LOGIN' ? 'signin_with' : 'signup_with'}
                theme="filled_black"
              >
                <AuthOrDivider />
              </GoogleSignInButton>

              {/* MODE 1: SIGN IN FORM */}
              {mode === 'LOGIN' ? (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-mint" />
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
                        className="w-full px-4 py-3 bg-[#08100b] border border-white/15 focus:border-mint focus:ring-1 focus:ring-mint rounded-xl text-white text-sm outline-none transition-all placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-mint" />
                        <span>Password</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[11px] text-mint hover:underline flex items-center gap-1 cursor-pointer"
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
                        className="w-full px-4 py-3 bg-[#08100b] border border-white/15 focus:border-mint focus:ring-1 focus:ring-mint rounded-xl text-white text-sm outline-none transition-all placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <LiquidButton
                      type="submit"
                      id="login-submit-btn"
                      size="lg"
                      disabled={loading}
                      className="w-full bg-mint text-slate-950 font-black text-sm shadow-[0_0_25px_rgba(0,245,155,0.4)]"
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
                        className="text-mint font-black hover:underline cursor-pointer ml-1"
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
                      <User className="w-3.5 h-3.5 text-mint" />
                      <span>Full Name</span>
                    </label>
                    <input
                      type="text"
                      id="signup-fullname"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="e.g. Arjun Sharma"
                      className="w-full px-3.5 py-2.5 bg-[#08100b] border border-white/15 focus:border-mint rounded-xl text-white text-sm outline-none transition-all placeholder:text-slate-600"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-mint" />
                        <span>Email</span>
                      </label>
                      <input
                        type="email"
                        id="signup-email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="arjun@school.edu"
                        className="w-full px-3.5 py-2.5 bg-[#08100b] border border-white/15 focus:border-mint rounded-xl text-white text-sm outline-none transition-all placeholder:text-slate-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-mint" />
                        <span>Username</span>
                      </label>
                      <input
                        type="text"
                        id="signup-username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="arjun_investor"
                        className="w-full px-3.5 py-2.5 bg-[#08100b] border border-white/15 focus:border-mint rounded-xl text-white text-sm outline-none transition-all placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-mint" />
                        <span>Create Password</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[11px] text-mint hover:underline flex items-center gap-1 cursor-pointer"
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
                      className="w-full px-3.5 py-2.5 bg-[#08100b] border border-white/15 focus:border-mint rounded-xl text-white text-sm outline-none transition-all placeholder:text-slate-600"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-mint" />
                        <span>Age Category</span>
                      </label>
                      <select
                        id="signup-agegroup"
                        value={formData.ageGroup}
                        onChange={(e) => setFormData({ ...formData, ageGroup: e.target.value })}
                        className="w-full px-3 py-2.5 bg-[#08100b] border border-white/15 focus:border-mint rounded-xl text-white text-xs outline-none"
                      >
                        <option value="13-15 (Middle School)">13-15 (Middle School)</option>
                        <option value="16-18 (High School Teen)">16-18 (High School Teen)</option>
                        <option value="19-24 (College/Undergrad)">19-24 (College / Undergrad)</option>
                        <option value="25+ (Adult Learner)">25+ (Adult Beginner)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-mint" />
                        <span>Stock Market Experience</span>
                      </label>
                      <select
                        id="signup-experience"
                        value={formData.experienceLevel}
                        onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value as any })}
                        className="w-full px-3 py-2.5 bg-[#08100b] border border-white/15 focus:border-mint rounded-xl text-white text-xs outline-none"
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
                      className="mt-0.5 rounded border-white/20 text-mint focus:ring-mint bg-[#08100b] cursor-pointer"
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
                      className="w-full bg-mint text-slate-950 font-black text-sm shadow-[0_0_25px_rgba(0,245,155,0.4)]"
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
                        className="text-mint font-black hover:underline cursor-pointer ml-1"
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-mint/15 border border-mint/35 text-xs font-black text-mint uppercase tracking-wider mb-3">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Interactive Simulator Playground</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Try a Live Trade <span className="text-mint">Before</span> You Sign In.
          </h2>
          <p className="text-sm text-slate-300 mt-2">
            Select an Indian bluechip below, pick your quantity, and click Simulate Buy or Sell. See how virtual order execution feels in real time!
          </p>
        </div>

        {/* The Live Interactive Sandbox Terminal */}
        <div className="bg-[#09140e]/95 border border-emerald-500/25 rounded-3xl p-5 sm:p-8 lg:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl relative overflow-hidden">
          
          {/* Top Metric Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pb-6 border-b border-white/10">
            <div className="bg-[#0c1b13] p-3.5 sm:p-4 rounded-2xl border border-emerald-500/20 min-w-0">
              <span className="text-[11px] sm:text-xs text-slate-400 font-semibold block truncate">Virtual Cash Available</span>
              <div className="text-xl sm:text-2xl font-black text-mint font-mono mt-1 truncate">
                ₹{playgroundCash.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="bg-[#0c1b13] p-3.5 sm:p-4 rounded-2xl border border-emerald-500/20 min-w-0">
              <span className="text-[11px] sm:text-xs text-slate-400 font-semibold block truncate">Simulated Portfolio Value</span>
              <div className="text-xl sm:text-2xl font-black text-white font-mono mt-1 truncate">
                ₹{totalPortfolioWorth.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="bg-[#0c1b13] p-3.5 sm:p-4 rounded-2xl border border-emerald-500/20 flex items-center justify-between gap-2 min-w-0">
              <div className="min-w-0">
                <span className="text-[11px] sm:text-xs text-slate-400 font-semibold block truncate">Unrealized Demo P&L</span>
                <div className={`text-xl sm:text-2xl font-black font-mono mt-1 flex items-center gap-1.5 truncate ${
                  portfolioPnL >= 0 ? 'text-mint' : 'text-rose-400'
                }`}>
                  {portfolioPnL >= 0 ? '+' : ''}₹{portfolioPnL.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <button
                onClick={handleResetPlayground}
                title="Reset Playground Sandbox"
                aria-label="Reset Playground Sandbox"
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Stock Selector Chips */}
          <div className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
              <label className="text-xs sm:text-sm font-bold text-slate-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-mint animate-pulse" />
                <span>Choose Stock to Simulate:</span>
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                Click any share to load real-time order terminal
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
              {sampleStocks.map((st) => {
                const isSelected = st.symbol === selectedStockSymbol;
                const isUp = st.change >= 0;
                return (
                  <button
                    key={st.symbol}
                    type="button"
                    onClick={() => {
                      setSelectedStockSymbol(st.symbol);
                      setPlaygroundFeedback(`Selected ${st.symbol} (${st.sector}). Indicative price: ₹${st.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`);
                    }}
                    className={`p-2.5 sm:p-3 rounded-2xl border text-left transition-all min-w-0 ${
                      isSelected
                        ? 'bg-mint/20 border-mint shadow-[0_0_18px_rgba(0,245,155,0.3)] ring-1 ring-mint'
                        : 'bg-[#08120b] border-white/10 hover:border-emerald-500/40 text-slate-300 hover:bg-[#0c1811]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono font-black text-xs sm:text-sm text-white truncate">{st.symbol}</span>
                      <span className={`text-[10px] font-bold font-mono shrink-0 ${isUp ? 'text-mint' : 'text-rose-400'}`}>
                        {isUp ? '+' : ''}{st.change.toFixed(2)}%
                      </span>
                    </div>
                    <div className="text-xs sm:text-sm font-mono font-bold text-slate-100 mt-1 truncate">
                      ₹{st.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">{st.sector}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Stock Live Card & Action Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-center bg-[#070e09] rounded-2xl p-4 sm:p-6 border border-white/10">
            {/* Stock Meta & Mini Sparkline */}
            <div className="lg:col-span-6 space-y-3 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="text-base sm:text-lg font-black text-white flex items-center gap-2 truncate">
                    <span className="truncate">{activeStock.name}</span>
                    <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded text-slate-300 shrink-0">NSE EQ</span>
                  </h4>
                  <p className="text-xs text-slate-400 truncate">{activeStock.sector}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xl sm:text-2xl font-black font-mono text-white">
                    ₹{activeStock.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <span className={`text-xs font-mono font-bold inline-flex items-center gap-0.5 ${
                    activeStock.change >= 0 ? 'text-mint' : 'text-rose-400'
                  }`}>
                    {activeStock.change >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {activeStock.change >= 0 ? '+' : ''}{activeStock.change.toFixed(2)}% Today
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
                  {/* Generate smooth Bezier path points */}
                  {(() => {
                    const min = Math.min(...activeStock.sparkline);
                    const max = Math.max(...activeStock.sparkline);
                    const range = max - min || 1;
                    const coords = activeStock.sparkline.map((v, i) => {
                      const x = (i / (activeStock.sparkline.length - 1)) * 300;
                      const y = 60 - ((v - min) / range) * 50;
                      return { x, y };
                    });

                    let dLine = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
                    for (let i = 0; i < coords.length - 1; i++) {
                      const curr = coords[i];
                      const next = coords[i + 1];
                      const cx = (curr.x + next.x) / 2;
                      dLine += ` C ${cx.toFixed(1)} ${curr.y.toFixed(1)}, ${cx.toFixed(1)} ${next.y.toFixed(1)}, ${next.x.toFixed(1)} ${next.y.toFixed(1)}`;
                    }
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
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-300 bg-white/5 p-2.5 sm:p-3 rounded-xl">
                <span>Holdings in sandbox:</span>
                <span className="font-mono font-bold text-white">{activeHolding.qty} shares</span>
                {activeHolding.qty > 0 && (
                  <>
                    <span className="text-slate-500">•</span>
                    <span>Avg Buy: <strong className="font-mono text-emerald-400">₹{activeHolding.avgPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
                  </>
                )}
              </div>
            </div>

            {/* Trading Order Controls */}
            <div className="lg:col-span-6 space-y-4 bg-[#09150e] p-4 sm:p-5 rounded-xl border border-white/10">
              <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-300">Quantity (Shares):</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {[1, 5, 10, 25, 50].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setPlaygroundQty(q)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                        playgroundQty === q
                          ? 'bg-mint text-slate-950 shadow-sm'
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
                <span className="font-bold text-white text-sm">
                  ₹{tradeCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Buy & Sell Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <LiquidButton
                  size="default"
                  onClick={handleSimulateBuy}
                  className="w-full justify-center bg-mint text-slate-950 font-black shadow-[0_0_15px_rgba(0,245,155,0.3)]"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Simulate Buy</span>
                </LiquidButton>

                <LiquidButton
                  size="default"
                  onClick={handleSimulateSell}
                  disabled={activeHolding.qty === 0}
                  className={`w-full justify-center font-black ${
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
                <div className="space-y-0.5 min-w-0">
                  <div className="font-bold text-amber-300">Chanakya AI Wisdom:</div>
                  <p className="text-[11.5px] leading-relaxed text-amber-100/90">{activeStock.chanakyaInsight}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Live Action Feedback Notice */}
          <div className="mt-4 p-3 sm:p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-mint animate-ping shrink-0" />
              <span className="truncate">{playgroundFeedback}</span>
            </div>
            <a 
              href="#main-content"
              onClick={() => { setMode('SIGNUP'); }}
              className="text-mint font-black hover:underline inline-flex items-center gap-1 shrink-0"
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
            Four Pillars of the <span className="text-mint">RupeeRookie</span> Advantage
          </h2>
          <p className="text-sm text-slate-300 mt-2">
            Engineered with deep fintech fidelity, professional risk controls, and teenage pedagogy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Pillar 01 */}
          <div className="bg-[#07110a]/90 border border-emerald-500/20 rounded-3xl p-6 sm:p-7 relative overflow-hidden backdrop-blur-xl group hover:border-mint/50 transition-all shadow-lg flex flex-col justify-between">
            <div className="text-5xl font-black font-mono text-mint/20 absolute top-4 right-5 group-hover:text-mint/35 transition-colors select-none">
              01
            </div>
            <div className="space-y-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-mint/15 border border-mint/30 flex items-center justify-center text-mint">
                <PieChart className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white">₹10 Lakhs Virtual Sandbox</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Practice capital allocation across largecaps, midcaps, and dividend aristocrats with real slippage and zero wallet danger.
              </p>
            </div>
            <div className="pt-5 border-t border-white/10 mt-5 text-[11px] font-mono text-mint font-bold">
              • Market & Limit Orders • Real-time P&L
            </div>
          </div>

          {/* Pillar 02 */}
          <div className="bg-[#07110a]/90 border border-emerald-500/20 rounded-3xl p-6 sm:p-7 relative overflow-hidden backdrop-blur-xl group hover:border-mint/50 transition-all shadow-lg flex flex-col justify-between">
            <div className="text-5xl font-black font-mono text-mint/20 absolute top-4 right-5 group-hover:text-mint/35 transition-colors select-none">
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
          <div className="bg-[#07110a]/90 border border-emerald-500/20 rounded-3xl p-6 sm:p-7 relative overflow-hidden backdrop-blur-xl group hover:border-mint/50 transition-all shadow-lg flex flex-col justify-between">
            <div className="text-5xl font-black font-mono text-mint/20 absolute top-4 right-5 group-hover:text-mint/35 transition-colors select-none">
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
          <div className="bg-[#07110a]/90 border border-emerald-500/20 rounded-3xl p-6 sm:p-7 relative overflow-hidden backdrop-blur-xl group hover:border-mint/50 transition-all shadow-lg flex flex-col justify-between">
            <div className="text-5xl font-black font-mono text-mint/20 absolute top-4 right-5 group-hover:text-mint/35 transition-colors select-none">
              04
            </div>
            <div className="space-y-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-mint">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white">Chanakya 2.0 AI Coach</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Real-time conversational mentor offering risk critique, diversification analysis, and market history in English & Hindi.
              </p>
            </div>
            <div className="pt-5 border-t border-white/10 mt-5 text-[11px] font-mono text-mint font-bold">
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
                    btnStyle = "bg-emerald-500/20 border-mint text-mint";
                  } else if (isSelected && !opt.correct) {
                    btnStyle = "bg-rose-500/20 border-rose-500 text-rose-300";
                  }
                } else if (isSelected) {
                  btnStyle = "bg-mint/15 border-mint text-white";
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
                      <CheckCircle2 className="w-4 h-4 text-mint shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {quizSubmitted && (
              <div className="mt-4 p-3.5 rounded-xl bg-emerald-500/10 border border-mint/30 text-xs text-emerald-200 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-mint shrink-0 mt-0.5" />
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
                  <div className="text-[10px] font-mono text-mint font-semibold pt-1">
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
                <span className="text-[10px] bg-emerald-500/20 text-mint px-2 py-0.5 rounded-full font-mono font-bold">NSE SIMULATOR</span>
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
