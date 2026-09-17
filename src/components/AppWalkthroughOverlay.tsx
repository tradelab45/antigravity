import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft, 
  X, 
  CheckCircle2, 
  Coins, 
  Layers, 
  Search, 
  Zap, 
  Target, 
  SlidersHorizontal, 
  BookOpen, 
  Award, 
  HelpCircle,
  Play,
  RotateCcw,
  Check
} from 'lucide-react';
import { AppTabType } from './Header';
import { useSimulator } from '../context/SimulatorContext';
import { formatINR } from '../utils/formatters';

export interface AppWalkthroughStep {
  id: string;
  tab: AppTabType;
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  icon: React.ElementType;
  description: string;
  bulletPoints: {
    title: string;
    desc: string;
    icon: React.ElementType;
  }[];
  proTip: string;
  targetFocusId?: string;
}

interface AppWalkthroughOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: AppTabType;
  setActiveTab: (tab: AppTabType) => void;
  onSelectSampleStock?: () => void;
}

export const AppWalkthroughOverlay: React.FC<AppWalkthroughOverlayProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  onSelectSampleStock
}) => {
  const { portfolioValue, currentUser, earnXP, notifyUser } = useSimulator();
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [hasCompleted, setHasCompleted] = useState<boolean>(false);

  const steps: AppWalkthroughStep[] = [
    {
      id: 'welcome',
      tab: 'screener',
      title: 'Welcome to RupeeRookie',
      subtitle: 'Indian paper trading & investor learning workspace',
      badge: 'Virtual ₹10,00,000 Capital',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
      icon: Sparkles,
      description: 'Explore market dynamics with virtual capital and zero real-money risk. Practise trading workflows, portfolio building, and risk management in one guided workspace.',
      bulletPoints: [
        {
          title: '₹10 Lakh Virtual Balance',
          desc: 'Trade with realistic margin requirements, brokerage, STT, and slippage calculations.',
          icon: Coins
        },
        {
          title: 'Indian Equities & Indices',
          desc: 'Follow available Nifty 50, Sensex, Bank Nifty, and large- and mid-cap market quotes. Feeds may be delayed.',
          icon: TrendingUp
        },
        {
          title: 'Full Risk Protection',
          desc: 'Test risky setups without risking personal capital. Perfect your strategy before going live.',
          icon: ShieldCheck
        }
      ],
      proTip: 'You can toggle between Normal Market Hours and 24/7 Simulator mode from the header bar at any time.'
    },
    {
      id: 'screener',
      tab: 'screener',
      title: 'Market Screener & Sector Discovery',
      subtitle: 'Filter 75+ Stocks by Momentum, Valuations & Technicals',
      badge: 'Step 2: Stock Discovery',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30',
      icon: BarChart3,
      description: 'Discover companies using clear filters, latest-available search, and educational thematic baskets.',
      bulletPoints: [
        {
          title: 'Sector & Index Filters',
          desc: 'Filter by Nifty 50, Nifty Bank, IT, Auto, Pharma, Defence PSUs, and Smallcaps with one click.',
          icon: Layers
        },
        {
          title: 'Momentum & Technical Presets',
          desc: 'Spot Top Gainers, Top Losers, 52-Week High Breakouts, and Oversold RSI reversals.',
          icon: Target
        },
        {
          title: 'Curated Thematic Baskets',
          desc: 'Explore pre-built collections like "Digital India", "Green Energy", and "Defence Renaissance".',
          icon: Search
        }
      ],
      proTip: 'Click on any stock card or row to open its detailed Trading Terminal and interactive candlestick charts.'
    },
    {
      id: 'trading',
      tab: 'screener',
      title: 'Order Terminal & Trading Functionality',
      subtitle: 'CNC Delivery vs. MIS 5x Intraday with Bracket & GTT Orders',
      badge: 'Step 3: Execution Power',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
      icon: Zap,
      description: 'Execute orders with exact exchange-style precision. Choose between long-term equity delivery and high-leverage intraday trading with automated risk rules.',
      bulletPoints: [
        {
          title: 'CNC (Delivery) vs. MIS (Intraday 5x)',
          desc: 'Hold positions overnight with CNC (1x capital), or amplify buying power with MIS (5x intraday leverage).',
          icon: SlidersHorizontal
        },
        {
          title: 'Bracket & Stop-Loss (SL) Orders',
          desc: 'Automate risk control with pre-set Stop-Loss and Profit Target price levels calculated on the fly.',
          icon: Target
        },
        {
          title: 'GTT (Good-Till-Triggered) Rules',
          desc: 'Set conditional entry orders that stay active until your target entry price is triggered.',
          icon: ShieldCheck
        }
      ],
      proTip: 'Always define your risk before entering a trade. Aim for a minimum 1:2 Risk-to-Reward ratio.'
    },
    {
      id: 'portfolio',
      tab: 'portfolio',
      title: 'Portfolio Tracking & Positions Book',
      subtitle: 'Real-Time Unrealized/Realized P&L & Order Audit',
      badge: 'Step 4: Portfolio & Risk',
      badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-400/30',
      icon: PieChart,
      description: 'Monitor your open positions, track day P&L swings, manage margin utilization, and review your executed order history in one place.',
      bulletPoints: [
        {
          title: 'Real-Time P&L & Margins',
          desc: 'Review profit/loss using the latest available or last-close prices, with timestamps, cash balance, and margin used.',
          icon: TrendingUp
        },
        {
          title: '1-Click Position Square-Off',
          desc: 'Quickly exit or partially book profits on active intraday and delivery holdings.',
          icon: CheckCircle2
        },
        {
          title: 'Order Book & Trade History',
          desc: 'Review executed, pending, and cancelled orders with complete timestamp and price audit trails.',
          icon: Layers
        }
      ],
      proTip: 'Keep your single-stock exposure under 15% of your total capital to protect your downside.'
    },
    {
      id: 'mentor_and_review',
      tab: 'review',
      title: 'AI Coach & Trader DNA Analytics',
      subtitle: 'Chanakya AI Mentorship & Post-Trade Review Hub',
      badge: 'Step 5: Continuous Mastery',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-400/30',
      icon: Award,
      description: 'Level up your market psychology. Consult Chanakya AI for stock analysis, unlock milestone achievement badges, and analyze your Trader DNA stats.',
      bulletPoints: [
        {
          title: 'Chanakya AI Mentor',
          desc: 'Get instant stock evaluations, risk checks, and trade rationale based on technicals and fundamentals.',
          icon: Zap
        },
        {
          title: 'Trader DNA Radar',
          desc: 'Discover your unique trading archetype, discipline score, win rate, and profit factor.',
          icon: Target
        },
        {
          title: 'XP Badges & Leagues',
          desc: 'Earn experience points (XP) for disciplined trading, finish challenges, and climb the Leaderboard.',
          icon: Award
        }
      ],
      proTip: 'Check your Trade Review Hub after every trading session to identify emotional trading patterns.'
    }
  ];

  const currentStep = steps[currentStepIndex];

  // Sync the app's active tab with the tutorial step
  useEffect(() => {
    if (isOpen && currentStep) {
      if (activeTab !== currentStep.tab) {
        setActiveTab(currentStep.tab);
      }
    }
  }, [isOpen, currentStepIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleFinishOrClose();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      handleCompleteWalkthrough();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleCompleteWalkthrough = () => {
    const userKey = currentUser ? currentUser.id : 'guest';
    localStorage.setItem(`rupeerookie_walkthrough_completed_${userKey}`, 'true');
    setHasCompleted(true);
    
    // Reward XP for completing the app tour
    earnXP(100, 'Completed RupeeRookie platform walkthrough');
    notifyUser(
      'Tutorial Completed! 🎓', 
      'You earned +100 XP! You are all set to start paper trading with ₹10,00,000 virtual capital.',
      'SUCCESS'
    );
    
    // Return to screener tab for active trading
    setActiveTab('screener');
    onClose();
  };

  const handleFinishOrClose = () => {
    const userKey = currentUser ? currentUser.id : 'guest';
    localStorage.setItem(`rupeerookie_walkthrough_completed_${userKey}`, 'true');
    onClose();
  };

  const StepIcon = currentStep.icon;

  return (
    <div 
      id="app-walkthrough-overlay-container" 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      {/* Dimmed backdrop with subtle blur to spotlight content */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleFinishOrClose}
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
      />

      {/* Main Walkthrough Card Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden z-10 text-white my-auto"
      >
        {/* Top Gradient Header Accent */}
        <div className="h-2 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400" />

        <div className="p-6 sm:p-8 space-y-6">
          {/* Header Controls: Step Pill, Progress Indicator & Close Button */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-3 py-1 rounded-full text-xs font-black border flex items-center gap-1.5 uppercase tracking-wider ${currentStep.badgeColor}`}>
                <StepIcon className="w-3.5 h-3.5" />
                <span>{currentStep.badge}</span>
              </span>
              <span className="text-xs font-mono font-bold text-slate-400">
                Step {currentStepIndex + 1} of {steps.length}
              </span>
            </div>

            <button
              id="walkthrough-close-btn"
              type="button"
              onClick={handleFinishOrClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60 transition-colors cursor-pointer"
              title="Close Tutorial (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Step Title & Subtitle */}
          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>{currentStep.title}</span>
            </h2>
            <p className="text-xs sm:text-sm text-indigo-300 font-semibold">
              {currentStep.subtitle}
            </p>
            <p className="text-xs text-slate-300 leading-relaxed pt-1">
              {currentStep.description}
            </p>
          </div>

          {/* Interactive Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {currentStep.bulletPoints.map((point, idx) => {
              const PointIcon = point.icon;
              return (
                <div 
                  key={idx}
                  className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 space-y-1.5 hover:border-indigo-500/40 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <PointIcon className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-white">
                    {point.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    {point.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Pro-Tip Box */}
          <div className="bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-500/30 rounded-2xl p-3.5 flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-xs text-slate-300">
              <strong className="text-indigo-300 font-bold mr-1">Pro Tip:</strong>
              {currentStep.proTip}
            </div>
          </div>

          {/* Step Progress Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Tutorial Progress</span>
              <span>{Math.round(((currentStepIndex + 1) / steps.length) * 100)}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex gap-1">
              {steps.map((_, idx) => (
                <div 
                  key={idx}
                  className={`h-full flex-1 rounded-full transition-all duration-300 ${
                    idx <= currentStepIndex ? 'bg-indigo-500' : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
            {/* Left: Step Stepper Navigation Dots */}
            <div className="flex items-center gap-1.5 order-2 sm:order-1">
              {steps.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                    idx === currentStepIndex 
                      ? 'w-6 bg-indigo-500' 
                      : idx < currentStepIndex 
                      ? 'bg-indigo-400/60 hover:bg-indigo-400' 
                      : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                  title={`Go to step ${idx + 1}`}
                />
              ))}
            </div>

            {/* Right: Previous / Next / Finish Controls */}
            <div className="flex items-center gap-2 w-full sm:w-auto order-1 sm:order-2">
              {currentStepIndex > 0 ? (
                <button
                  id="walkthrough-prev-btn"
                  type="button"
                  onClick={handlePrev}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer flex-1 sm:flex-none justify-center"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
              ) : (
                <button
                  id="walkthrough-skip-btn"
                  type="button"
                  onClick={handleFinishOrClose}
                  className="px-3.5 py-2.5 text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer flex-1 sm:flex-none text-center"
                >
                  Skip Tour
                </button>
              )}

              <button
                id="walkthrough-next-btn"
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex-1 sm:flex-none justify-center"
              >
                {currentStepIndex < steps.length - 1 ? (
                  <>
                    <span>Next Feature</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Got It! Start Trading (+100 XP)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
