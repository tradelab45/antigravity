import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  Clock3,
  Download,
  GraduationCap,
  PieChart,
  ShieldCheck,
  Sparkles,
  Target,
  Wallet,
  Lightbulb,
  CalendarRange,
  MessageSquare,
  Megaphone,
  TrendingUp,
  ChevronDown,
} from 'lucide-react';
import { useSimulator } from '../context/SimulatorContext';
import { INITIAL_LESSONS } from '../data/lessonsData';
import { formatINR, formatPercent } from '../utils/formatters';
import type { AppTabType } from './Header';
import { useAccessibility } from '../context/AccessibilityContext';
import { ResumeLearning } from './ResumeLearning';
import { PwaInstall } from './PwaInstall';
import { SpatialCandlestickChart } from './ui/spatial-candlestick-chart';
import { SpotlightCard } from './ui/spotlight-card';
import { ThumbnailCarousel, CarouselSlide } from './ui/thumbnail-carousel';
import { StackSpread, StackCardItem } from './ui/stack-spread';
import { InteractiveListPreview, ListPreviewItem } from './ui/interactive-list-preview';

interface MissionState {
  checked: boolean[];
  takeaway: string;
  completed: boolean;
}

type MissionDifficulty = 'AUTO' | 'GENTLE' | 'STANDARD' | 'ADVANCED';

const getIstDateKey = () => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date());

export const HomeDashboard: React.FC<{ setActiveTab: (tab: AppTabType) => void }> = ({ setActiveTab }) => {
  const { settings } = useAccessibility();
  const {
    currentUser,
    portfolioValue,
    cashBalance,
    totalPnL,
    totalPnLPercent,
    holdings,
    orders,
    completedLessonIds,
    userXP,
    userLevel,
    nseMarketInfo,
    earnXP,
    stocks,
  } = useSimulator();

  const carouselSlides: CarouselSlide[] = useMemo(() => [
    {
      id: 'slide-1',
      tag: 'FLAGSHIP INDEX',
      title: 'NIFTY 50 Bluechip Leaders',
      subtitle: '50 Titans driving 60%+ of India’s Equity Market Cap',
      description: 'The foundation of India’s wealth creation. Features Reliance, TCS, HDFC Bank, Infosys, and Tata Motors with zero speculative leverage.',
      metric: '₹24,850',
      metricLabel: 'NIFTY 50',
      metricChange: '+1.14%',
      isPositive: true,
      ctaText: 'Open Markets Screener',
      onCtaClick: () => setActiveTab('screener')
    },
    {
      id: 'slide-2',
      tag: 'WEALTH ENGINE',
      title: 'The Eighth Wonder: SIP Compounding',
      subtitle: 'Simulate long-term wealth accumulation',
      description: 'See how ₹10,000/month at 13.5% CAGR turns into ₹1.2 Crore with mathematical discipline and inflation-adjusted scenarios.',
      metric: '₹1.2 Cr',
      metricLabel: 'Target Corpus (15y)',
      metricChange: '13.5% CAGR',
      isPositive: true,
      ctaText: 'Launch Compound Calculator',
      onCtaClick: () => setActiveTab('calculator')
    },
    {
      id: 'slide-3',
      tag: 'SIMULATOR LAB',
      title: 'Replay OS: Blind Market Tape',
      subtitle: 'Practice price action on historical candles without hindsight bias',
      description: 'Step bar-by-bar through past Dalal Street events like Union Budget breakouts, COVID recoveries, and earnings gap-ups.',
      metric: '100% Blind',
      metricLabel: 'Practice Tape',
      metricChange: 'Zero Risk',
      isPositive: true,
      ctaText: 'Enter Replay OS',
      onCtaClick: () => setActiveTab('replay')
    },
    {
      id: 'slide-4',
      tag: 'ACADEMY',
      title: `Teen Investor Academy (${INITIAL_LESSONS.length} Lessons)`,
      subtitle: 'From Demat basics and valuation to Indian taxation',
      description: 'Master Dalal Street with interactive bilingual Hindi/English lessons, audio readouts, and gamified quiz checkpoints.',
      metric: `${INITIAL_LESSONS.length} Lessons`,
      metricLabel: 'Bilingual Course',
      metricChange: '+500 XP',
      isPositive: true,
      ctaText: 'Start Learning',
      onCtaClick: () => setActiveTab('academy')
    }
  ], [setActiveTab]);

  const stackCards: StackCardItem[] = useMemo(() => {
    const defaultSymbols = ['RELIANCE', 'TCS', 'HDFCBANK', 'TATAMOTORS'];
    return defaultSymbols.map(sym => {
      const st = stocks.find(s => s.symbol === sym);
      return {
        id: sym,
        symbol: sym,
        title: st ? st.name : sym,
        subtitle: st ? st.sector : 'Bluechip Titan',
        badge: st ? `${st.changePercent >= 0 ? '+' : ''}${st.changePercent.toFixed(2)}%` : '+1.2%',
        badgeType: (st && st.changePercent < 0) ? 'negative' : 'positive',
        value: st ? `₹${st.price.toFixed(2)}` : '₹2,500.00',
        change: st ? `${st.changePercent >= 0 ? '+' : ''}${st.changePercent.toFixed(2)}%` : '+1.2%',
        numericPrice: st ? st.price : 2500,
        numericChange: st ? st.change : 15,
        numericChangePercent: st ? st.changePercent : 1.2,
        isPositive: !st || st.changePercent >= 0,
        description: st?.teenSummary || 'India premier corporate titan with robust balance sheet and long-term earnings track record.',
      };
    });
  }, [stocks]);

  const listPreviewItems: ListPreviewItem[] = useMemo(() => {
    return stocks.slice(0, 5).map(s => ({
      id: s.symbol,
      symbol: s.symbol,
      name: s.name,
      sector: s.sector,
      price: s.price,
      changePercent: s.changePercent,
      high52: s.high52,
      low52: s.low52,
      peRatio: s.peRatio,
      marketCapCr: s.marketCapCr,
      summary: s.teenSummary || s.description,
      badge: s.changePercent > 1.5 ? 'Trending' : undefined,
    }));
  }, [stocks]);

  const missionKey = `rr_daily_mission:${currentUser?.id || 'guest'}:${getIstDateKey()}`;
  const [mission, setMission] = useState<MissionState>(() => {
    try {
      return JSON.parse(localStorage.getItem(missionKey) || '') as MissionState;
    } catch {
      return { checked: [false, false, false], takeaway: '', completed: false };
    }
  });
  // Mobile defaults to a simple view. The 3D market showcase is rich but heavy
  // on a phone, so it is opt-in there and always shown on large screens.
  const [showcaseOpen, setShowcaseOpen] = useState<boolean>(() => localStorage.getItem('rr_home_showcase') === 'open');
  const [missionDifficulty, setMissionDifficulty] = useState<MissionDifficulty>(() => (localStorage.getItem(`rr_mission_difficulty:${currentUser?.id || 'guest'}`) as MissionDifficulty) || 'AUTO');
  const [feedback, setFeedback] = useState<'HELPFUL' | 'NOT_YET' | null>(() => localStorage.getItem(`rr_home_feedback:${currentUser?.id || 'guest'}:${getIstDateKey()}`) as 'HELPFUL' | 'NOT_YET' | null);

  useEffect(() => { localStorage.setItem(`rr_mission_difficulty:${currentUser?.id || 'guest'}`, missionDifficulty); }, [missionDifficulty, currentUser?.id]);
  useEffect(() => { localStorage.setItem('rr_home_showcase', showcaseOpen ? 'open' : 'closed'); }, [showcaseOpen]);

  useEffect(() => {
    localStorage.setItem(missionKey, JSON.stringify(mission));
  }, [mission, missionKey]);

  // completeLesson() is shared with the daily quiz, so the raw id list can hold
  // quiz ids as well; only real Academy modules are counted here.
  const completedModuleCount = useMemo(
    () => INITIAL_LESSONS.filter((lesson) => completedLessonIds.includes(lesson.id)).length,
    [completedLessonIds],
  );
  const missionProgress = mission.checked.filter(Boolean).length;
  const greetingName = currentUser?.fullName?.split(' ')[0] || 'Investor';
  const executedTrades = orders.filter((order) => order.status === 'EXECUTED').length;
  const dayIndex = useMemo(() => Math.abs([...getIstDateKey()].reduce((total, character) => total + character.charCodeAt(0), 0)), []);
  const dailyConcepts = [
    { title: 'Diversification is about causes, not count', detail: 'Five companies can still be concentrated if they depend on the same sector, customer or economic event.' },
    { title: 'A price and a value are different', detail: 'Market price is what participants agree today; value depends on future cash flows, risk and expectations.' },
    { title: 'Doing nothing can be a decision', detail: 'A calm investor can observe, learn and wait. Activity is not the same as progress.' },
    { title: 'Risk begins with position size', detail: 'A good idea can still hurt a portfolio when one position is allowed to become too large.' },
    { title: 'A thesis needs an invalidation rule', detail: 'Write what evidence would prove an idea wrong before emotions and price movement take over.' },
  ];
  const dailyConcept = dailyConcepts[dayIndex % dailyConcepts.length];
  const weeklySummary = useMemo(() => {
    const executed = orders.filter((order) => order.status === 'EXECUTED');
    const recent = executed.filter((order) => Date.now() - new Date(order.timestamp).getTime() <= 7 * 24 * 60 * 60 * 1000);
    const activity = recent.length === 0
      ? 'No trades this week—and that is completely fine. Your learning activity still counts.'
      : `${recent.length} simulated trade${recent.length === 1 ? '' : 's'} this week. Review the journal before repeating a setup.`;
    return { activity, lessons: completedModuleCount, riskReviews: Object.keys(holdings).length ? 'Portfolio exposure is ready for a concentration review.' : 'No portfolio exposure is currently active.' };
  }, [completedModuleCount, holdings, orders]);

  const saveFeedback = (value: 'HELPFUL' | 'NOT_YET') => {
    setFeedback(value);
    localStorage.setItem(`rr_home_feedback:${currentUser?.id || 'guest'}:${getIstDateKey()}`, value);
  };

  const concentrationNote = useMemo(() => {
    const holdingValues = Object.values(holdings).map((holding) => {
      const value = holding.quantity * holding.avgBuyPrice;
      return { symbol: holding.symbol, value };
    });
    const total = holdingValues.reduce((sum, holding) => sum + holding.value, 0);
    if (total === 0) return 'No portfolio risk yet. Learn the basics before making your first simulated decision.';
    const largest = [...holdingValues].sort((a, b) => b.value - a.value)[0];
    const weight = (largest.value / total) * 100;
    return weight > 35
      ? `${largest.symbol} is about ${weight.toFixed(0)}% of invested value. Review concentration before adding exposure.`
      : 'No single holding currently exceeds the 35% concentration warning level.';
  }, [holdings]);

  const toggleMissionStep = (index: number) => {
    if (index === 2 && mission.takeaway.trim().length < 8) return;
    setMission((previous) => {
      if (previous.completed) return previous;
      const checked = [...previous.checked];
      checked[index] = !checked[index];
      const completed = checked.every(Boolean);
      if (completed) earnXP(25, `Completed daily learning mission ${getIstDateKey()}`);
      return { ...previous, checked, completed };
    });
  };

  const resolvedDifficulty = missionDifficulty === 'AUTO'
    ? currentUser?.experienceLevel === 'ADVANCED' ? 'ADVANCED' : currentUser?.experienceLevel === 'INTERMEDIATE' ? 'STANDARD' : 'GENTLE'
    : missionDifficulty;
  const missionStepsByDifficulty = {
    GENTLE: [
      { title: 'Learn one idea', detail: 'Read the recommended first Academy concept.', time: '2 min', action: () => setActiveTab('academy') },
      { title: 'Find one risk', detail: 'Notice which holding or sector could dominate.', time: '2 min', action: () => setActiveTab('portfolio') },
      { title: 'Explain it simply', detail: 'Write one sentence in your own words. No trade required.', time: '1 min', action: undefined },
    ],
    STANDARD: [
      { title: 'Compare two ideas', detail: 'Read a lesson and one historical case.', time: '2 min', action: () => setActiveTab('academy') },
      { title: 'Run a risk check', detail: 'Test a sector fall and review concentration.', time: '2 min', action: () => setActiveTab('portfolio') },
      { title: 'Record a rule', detail: 'Write one rule you could follow next time.', time: '1 min', action: undefined },
    ],
    ADVANCED: [
      { title: 'Challenge a thesis', detail: 'List what evidence could make an idea wrong.', time: '2 min', action: () => setActiveTab('academy') },
      { title: 'Stress the portfolio', detail: 'Compare concentration and scenario impact.', time: '2 min', action: () => setActiveTab('portfolio') },
      { title: 'Define a decision rule', detail: 'Write a specific, testable rule. No trade required.', time: '1 min', action: undefined },
    ],
  } as const;
  const hindiMissionSteps = {
    GENTLE: [
      { title: 'एक विचार समझें', detail: 'अकादमी में सुझाया गया छोटा पाठ पढ़ें।', time: '2 मिनट', action: () => setActiveTab('academy') },
      { title: 'एक जोखिम पहचानें', detail: 'देखें कि कौन-सा स्टॉक या सेक्टर पोर्टफोलियो पर अधिक प्रभाव डाल सकता है।', time: '2 मिनट', action: () => setActiveTab('portfolio') },
      { title: 'अपने शब्दों में लिखें', detail: 'केवल एक वाक्य लिखें। ट्रेड करना आवश्यक नहीं है।', time: '1 मिनट', action: undefined },
    ],
    STANDARD: [
      { title: 'दो विचारों की तुलना करें', detail: 'एक पाठ और एक ऐतिहासिक केस स्टडी देखें।', time: '2 मिनट', action: () => setActiveTab('academy') },
      { title: 'जोखिम जाँच करें', detail: 'सेक्टर में गिरावट का परीक्षण करके एकाग्रता समझें।', time: '2 मिनट', action: () => setActiveTab('portfolio') },
      { title: 'एक नियम लिखें', detail: 'अगली बार पालन करने के लिए सरल नियम बनाएँ।', time: '1 मिनट', action: undefined },
    ],
    ADVANCED: [
      { title: 'निवेश विचार को चुनौती दें', detail: 'कौन-सा प्रमाण आपके निवेश विचार को गलत सिद्ध करेगा?', time: '2 मिनट', action: () => setActiveTab('academy') },
      { title: 'पोर्टफोलियो का दबाव परीक्षण करें', detail: 'एकाग्रता और परिदृश्य के प्रभाव की तुलना करें।', time: '2 मिनट', action: () => setActiveTab('portfolio') },
      { title: 'निर्णय का नियम बनाएँ', detail: 'स्पष्ट और जाँचने योग्य नियम लिखें। ट्रेड आवश्यक नहीं है।', time: '1 मिनट', action: undefined },
    ],
  } as const;
  const missionSteps = settings.learningLanguage === 'HINDI' ? hindiMissionSteps[resolvedDifficulty] : missionStepsByDifficulty[resolvedDifficulty];

  return (
    <div className="space-y-4 pb-4 sm:space-y-6">
      <section className="overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-5 text-white shadow-xl sm:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-300">Today at RupeeRookie</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight">Namaste, {greetingName}</h1>
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-300">{settings.learningLanguage === 'HINDI' ? 'केवल 5 शांत मिनटों में बेहतर निर्णय क्षमता बनाएँ। सीखने की प्रगति, ट्रेड की संख्या से अधिक महत्वपूर्ण है।' : 'Build judgment in five calm minutes. Learning progress matters more than trade count.'}</p>
          </div>
          <div className="flex shrink-0 items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/10 px-3 py-2 backdrop-blur sm:flex-col sm:items-end sm:gap-0 sm:text-right">
            <p className="text-[9px] font-bold uppercase text-slate-400">Level {userLevel.level}</p>
            <p className="font-mono text-sm font-black text-amber-300">{userXP} XP</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/8 p-3">
            <Wallet className="h-4 w-4 text-indigo-300" />
            <p className="mt-2 text-[9px] font-bold uppercase text-slate-400">Portfolio</p>
            <p className="truncate font-mono text-sm font-black">{formatINR(portfolioValue)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/8 p-3">
            <BarChart3 className="h-4 w-4 text-emerald-300" />
            <p className="mt-2 text-[9px] font-bold uppercase text-slate-400">Net P&amp;L</p>
            <p className={`font-mono text-sm font-black ${totalPnL >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{formatPercent(totalPnLPercent)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/8 p-3">
            <GraduationCap className="h-4 w-4 text-amber-300" />
            <p className="mt-2 text-[9px] font-bold uppercase text-slate-400">Lessons</p>
            <p className="font-mono text-sm font-black">{completedModuleCount} complete</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/8 p-3">
            <Clock3 className={`h-4 w-4 ${nseMarketInfo.isNSEMarketOpen ? 'text-emerald-300' : 'text-slate-300'}`} />
            <p className="mt-2 text-[9px] font-bold uppercase text-slate-400">NSE status</p>
            <p className="text-sm font-black">{nseMarketInfo.isNSEMarketOpen ? 'Open' : 'Closed'}</p>
          </div>
        </div>
      </section>

      <ResumeLearning userId={currentUser?.id} onResume={() => setActiveTab('academy')} />

      {/* Mobile keeps a simple view by default: the 3D market showcase below is
          opt-in on small screens and always visible from lg upwards. */}
      <button
        type="button"
        onClick={() => setShowcaseOpen((open) => !open)}
        aria-expanded={showcaseOpen}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:hidden"
      >
        <span className="min-w-0">
          <span className="block text-xs font-black text-slate-900 dark:text-white">
            {showcaseOpen ? 'Hide market visuals' : 'Show market visuals'}
          </span>
          <span className="mt-0.5 block text-[11px] text-slate-500 dark:text-slate-400">
            3D candlesticks, the flagship deck and the live movers radar
          </span>
        </span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-indigo-600 transition-transform ${showcaseOpen ? 'rotate-180' : ''}`} />
      </button>

      <div className={`space-y-4 sm:space-y-6 ${showcaseOpen ? '' : 'hidden lg:block'}`}>
      {/* 3D Candlestick & Moving Rupee Live Market Pulse Card */}
      <SpotlightCard
        glowColor="green"
        spotlightSize={500}
        borderGlow={true}
        tiltEffect={true}
        className="rounded-3xl border border-emerald-900/40 bg-gradient-to-br from-[#061009] via-[#0b1710] to-[#040805] p-5 sm:p-6 text-white shadow-xl relative overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-mint shadow-[0_0_8px_#00f59b] animate-pulse" />
              <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-mint">
                Dalal Street 3D Arena · Live Spatial Simulation
              </p>
            </div>
            <h2 className="mt-1 text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Interactive Candlestick Breakout</span>
              <span className="text-xs text-mint bg-mint/15 px-2 py-0.5 rounded-full border border-mint/30 font-mono">
                MOVE IT 3D
              </span>
            </h2>
            <p className="mt-0.5 text-xs text-slate-300">
              Observe Japanese candlestick price momentum and spatial 3D physics with zero financial risk.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('screener')}
            className="self-start sm:self-center px-4 py-2 rounded-xl bg-mint hover:bg-mint/90 text-slate-950 font-black text-xs transition-all shadow-[0_0_15px_rgba(0,245,155,0.3)] flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <span>Go to Screener (75+ Equities)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Embedded Spatial Candlestick Chart */}
        <div className="w-full">
          <SpatialCandlestickChart variant="card" showRupee={true} showBadges={true} />
        </div>
      </SpotlightCard>

      {/* 21st.dev Thumbnail Carousel: Market Pillars & Actionable Signals */}
      <ThumbnailCarousel
        slides={carouselSlides}
        autoPlayInterval={6000}
        className="w-full"
      />

      {/* 21st.dev Stack Spread & Interactive List Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Stack Spread */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800 font-mono">
                STACK SPREAD 3D
              </span>
              <span className="text-xs font-bold text-slate-400">Hover deck</span>
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Dalal Street Flagship Deck
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Hover over the card stack to fan out India’s most capitalized leaders with real-time valuations.
            </p>
          </div>

          <div className="py-2">
            <StackSpread
              items={stackCards}
              onCardClick={() => setActiveTab('screener')}
            />
          </div>

          {/* The deck is a single card on screen at a time, so the panel used
              to be mostly empty space around it while the column next door set
              the height. Naming the four it holds fills that with something
              worth reading, and the live price is the point of the deck. */}
          <ul className="mt-3 grid grid-cols-2 gap-1.5">
            {stackCards.map((card) => (
              <li key={card.id}>
                <button
                  type="button"
                  onClick={() => setActiveTab('screener')}
                  className="flex min-h-9 w-full items-center justify-between gap-2 rounded-xl border border-slate-200 px-2.5 py-1.5 text-left transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-mono text-[11px] font-black text-slate-900 dark:text-white">
                      {card.symbol}
                    </span>
                    <span className="block truncate font-mono text-[10px] text-slate-500 dark:text-slate-400">
                      {card.value}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 font-mono text-[10px] font-black ${
                      card.isPositive
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {card.change}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">{stackCards.length} core holdings</span>
            <button
              onClick={() => setActiveTab('screener')}
              className="inline-flex min-h-6 items-center gap-1 rounded-lg px-1 font-bold text-emerald-600 hover:underline dark:text-emerald-400 cursor-pointer"
            >
              <span>Explore full 75+ screener</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Interactive List Preview */}
        <div className="lg:col-span-7">
          <InteractiveListPreview
            items={listPreviewItems}
            title="Live Dalal Street Movers Radar"
            subtitle="Hover any equity to inspect live metrics & sparkline momentum"
            onSelectItem={() => setActiveTab('screener')}
            className="h-full"
          />
        </div>
      </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section className="rounded-3xl border border-indigo-200 bg-white p-5 shadow-sm dark:border-indigo-900 dark:bg-slate-900 lg:col-span-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 shrink-0 text-indigo-600" />
                <h2 className="text-base font-black text-slate-950 dark:text-white">{settings.learningLanguage === 'HINDI' ? 'आज का 5-मिनट मिशन' : 'Your five-minute mission'}</h2>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{settings.learningLanguage === 'HINDI' ? 'एक पाठ, एक जोखिम जाँच और एक चिंतन। कोई ट्रेड आवश्यक नहीं है।' : 'One lesson, one risk check, one reflection. Zero trades required.'}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2"><label className="sr-only" htmlFor="mission-difficulty">Mission difficulty</label><select id="mission-difficulty" value={missionDifficulty} onChange={(event) => setMissionDifficulty(event.target.value as MissionDifficulty)} disabled={mission.completed} className="rounded-xl border border-indigo-200 bg-indigo-50 px-2 py-1 text-[10px] font-black text-indigo-900 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-200"><option value="AUTO">Auto · {resolvedDifficulty.toLowerCase()}</option><option value="GENTLE">Gentle</option><option value="STANDARD">Standard</option><option value="ADVANCED">Advanced</option></select><span className="rounded-full bg-indigo-100 px-2.5 py-1 text-[10px] font-black text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">{missionProgress}/3</span></div>
          </div>

          <div className="mt-4 space-y-2.5">
            {missionSteps.map((step, index) => (
              <div key={step.title} className={`rounded-2xl border p-3 ${mission.checked[index] ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30' : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'}`}>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => toggleMissionStep(index)}
                    aria-label={`${mission.checked[index] ? 'Mark incomplete' : 'Mark complete'}: ${step.title}`}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${mission.checked[index] ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 bg-white text-slate-400 dark:border-slate-600 dark:bg-slate-900'}`}
                  >
                    {mission.checked[index] ? <Check className="h-4 w-4" /> : <span className="text-[11px] font-black">{index + 1}</span>}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-xs font-extrabold text-slate-900 dark:text-white">{step.title}</h3>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{step.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{step.detail}</p>
                  </div>
                  {step.action && !mission.checked[index] && (
                    <button type="button" onClick={step.action} className="rounded-xl p-2 text-indigo-600" aria-label={`Open ${step.title}`}><ArrowRight className="h-4 w-4" /></button>
                  )}
                </div>
                {index === 2 && (
                  <textarea
                    value={mission.takeaway}
                    onChange={(event) => setMission((previous) => ({ ...previous, takeaway: event.target.value }))}
                    disabled={mission.completed}
                    placeholder={settings.learningLanguage === 'HINDI' ? 'आज मैंने सीखा कि…' : 'Today I learned that…'}
                    maxLength={180}
                    className="mt-3 min-h-20 w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-xs outline-none focus:border-indigo-500 disabled:opacity-70 dark:border-slate-700 dark:bg-slate-900"
                  />
                )}
              </div>
            ))}
          </div>
          {mission.completed && (
            <div className="mt-3 flex items-center gap-2 rounded-2xl bg-emerald-100 p-3 text-xs font-extrabold text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
              <CheckCircle2 className="h-4 w-4" /> {settings.learningLanguage === 'HINDI' ? 'मिशन पूरा · +25 XP · आज अतिरिक्त ट्रेड की आवश्यकता नहीं' : 'Mission complete · +25 XP · no extra trading needed today'}
            </div>
          )}
        </section>

        <div className="space-y-4 lg:col-span-5">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-600" /><h2 className="text-sm font-black">Portfolio risk check</h2></div>
            <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{concentrationNote}</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-slate-50 p-2 dark:bg-slate-800"><p className="text-[9px] uppercase text-slate-500 dark:text-slate-400">Holdings</p><p className="font-mono tabular-nums text-sm font-black">{Object.keys(holdings).length}</p></div>
              <div className="rounded-xl bg-slate-50 p-2 dark:bg-slate-800"><p className="text-[9px] uppercase text-slate-500 dark:text-slate-400">Trades</p><p className="font-mono tabular-nums text-sm font-black">{executedTrades}</p></div>
              <div className="rounded-xl bg-slate-50 p-2 dark:bg-slate-800"><p className="text-[9px] uppercase text-slate-500 dark:text-slate-400">Cash</p><p className="truncate font-mono tabular-nums text-xs sm:text-sm font-black">{formatINR(cashBalance, false)}</p></div>
            </div>
            <button type="button" onClick={() => setActiveTab('portfolio')} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black text-white dark:bg-indigo-600">Open risk heatmap <ArrowRight className="h-3.5 w-3.5" /></button>
          </section>

          <PwaInstall />
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-12" aria-label="Daily insight and weekly report">
        <article className="rounded-3xl border border-violet-200 bg-gradient-to-br from-white to-violet-50 p-5 shadow-sm dark:border-violet-900 dark:from-slate-900 dark:to-violet-950/30 lg:col-span-7">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-violet-100 p-2.5 text-violet-700 dark:bg-violet-950 dark:text-violet-300"><Lightbulb className="h-5 w-5" /></div>
            <div className="min-w-0"><p className="text-xs font-black uppercase tracking-wide text-violet-700 dark:text-violet-300">Today&apos;s market concept</p><h2 className="mt-1 text-base font-black text-slate-950 dark:text-white">{dailyConcept.title}</h2><p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{dailyConcept.detail}</p></div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-violet-200 pt-3 dark:border-violet-900">
            <p className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300"><MessageSquare className="h-4 w-4" /> Was this explanation useful?</p>
            <div className="flex gap-2"><button type="button" onClick={() => saveFeedback('HELPFUL')} aria-pressed={feedback === 'HELPFUL'} className={`min-h-10 rounded-xl border px-3 text-xs font-black ${feedback === 'HELPFUL' ? 'border-emerald-500 bg-emerald-100 text-emerald-900' : 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'}`}>Yes, helpful</button><button type="button" onClick={() => saveFeedback('NOT_YET')} aria-pressed={feedback === 'NOT_YET'} className={`min-h-10 rounded-xl border px-3 text-xs font-black ${feedback === 'NOT_YET' ? 'border-amber-500 bg-amber-100 text-amber-950' : 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'}`}>Needs clarity</button></div>
          </div>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-5">
          <div className="flex items-center gap-2"><CalendarRange className="h-5 w-5 text-emerald-600" /><h2 className="text-sm font-black">Your weekly learning report</h2></div>
          <div className="mt-3 space-y-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300"><p>{weeklySummary.activity}</p><p><strong>{weeklySummary.lessons}</strong> Academy lesson{weeklySummary.lessons === 1 ? '' : 's'} completed overall.</p><p>{weeklySummary.riskReviews}</p></div>
          <button type="button" onClick={() => setActiveTab('journal')} className="mt-4 min-h-11 w-full rounded-xl bg-slate-900 px-4 text-xs font-black text-white dark:bg-indigo-600">Open weekly reflection</button>
        </article>
      </section>

      <details className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-100"><Megaphone className="h-4 w-4 text-indigo-600" /> What&apos;s new in RupeeRookie</summary>
        <ul className="mt-2 grid gap-2 border-t border-slate-100 pt-3 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-300 sm:grid-cols-3"><li>• Faster page loading with route-shaped skeletons.</li><li>• Clearer quote sources and educational-model labels.</li><li>• Improved Hindi summaries, risk checks and genuine progress.</li></ul>
      </details>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { title: 'Markets', detail: 'Discover companies', icon: BarChart3, tab: 'screener' as AppTabType },
          { title: 'Portfolio', detail: 'Review allocation', icon: PieChart, tab: 'portfolio' as AppTabType },
          { title: 'Academy', detail: 'Continue lessons', icon: BookOpen, tab: 'academy' as AppTabType },
          { title: 'Progress', detail: 'XP and badges', icon: GraduationCap, tab: 'badges' as AppTabType },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.title} type="button" onClick={() => setActiveTab(item.tab)} className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-transform active:scale-[0.98] dark:border-slate-800 dark:bg-slate-900">
              <Icon className="h-5 w-5 text-indigo-600" />
              <p className="mt-3 text-xs font-black text-slate-900 dark:text-white">{item.title}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">{item.detail}</p>
            </button>
          );
        })}
      </section>
    </div>
  );
};
