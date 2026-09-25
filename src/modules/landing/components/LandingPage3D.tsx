import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { 
  ArrowUpRight, ArrowRight, ArrowDown, BookOpen, RotateCcw, 
  ShieldCheck, Sparkles, Pause, Play, TrendingUp, TrendingDown,
  Compass, CheckCircle2, Zap, BarChart3, Layers, Award, Activity
} from 'lucide-react';
import { useAccessibility } from '../../../context/AccessibilityContext';
import { useSimulator } from '../../../context/SimulatorContext';
import type { AppTabType } from '../../../components/Header';
import './landing-3d.css';
import { MetalButton } from '../../../components/ui/liquid-glass-button';
import { GlowCard, SpotlightCard } from '../../../components/ui/spotlight-card';
import { MotionFooter } from './MotionFooter';
import { SpatialCandlestickChart } from '../../../components/ui/spatial-candlestick-chart';

const money = (value: number) => 
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

interface PopularShare {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  sector: string;
  glow: 'green' | 'blue' | 'purple' | 'orange' | 'red';
  marketCap: string;
  peRatio: string;
}

const POPULAR_SHARES: PopularShare[] = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', price: 1226.40, change: -17.50, changePct: -1.41, sector: 'Energy & Telecom', glow: 'orange', marketCap: '₹16.6L Cr', peRatio: '22.5' },
  { symbol: 'TCS', name: 'Tata Consultancy Services', price: 2105.00, change: -85.00, changePct: -3.88, sector: 'IT & Cloud Services', glow: 'blue', marketCap: '₹7.6L Cr', peRatio: '15.9' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', price: 731.00, change: 18.00, changePct: 2.52, sector: 'Banking & Financials', glow: 'green', marketCap: '₹11.3L Cr', peRatio: '15.6' },
  { symbol: 'INFY', name: 'Infosys Limited', price: 1051.40, change: -7.20, changePct: -0.68, sector: 'IT & Tech Services', glow: 'purple', marketCap: '₹4.3L Cr', peRatio: '13.6' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors', price: 303.80, change: -10.70, changePct: -3.40, sector: 'Automotive & EV', glow: 'red', marketCap: '₹1.1L Cr', peRatio: '11.2' },
  { symbol: 'ZOMATO', name: 'Zomato Limited', price: 326.85, change: 4.50, changePct: 1.40, sector: 'Quick Commerce & Food', glow: 'green', marketCap: '₹3.0L Cr', peRatio: '710.5' },
];

const features = [
  { 
    name: 'Academy', 
    number: '01', 
    title: 'Make the market make sense.', 
    body: 'Short lessons, Hindi summaries and real-world case studies. Build your understanding one idea at a time.', 
    view: 'academy' as AppTabType, 
    tags: ['Bite-sized lessons', 'Knowledge checks', 'Save your place'],
    color: 'blue' as const
  },
  { 
    name: 'Replay', 
    number: '02', 
    title: 'A second chance at a first decision.', 
    body: 'Step through historical scenarios without seeing what happens next. Make a plan, reveal the outcome and reflect on your process.', 
    view: 'replay' as AppTabType, 
    tags: ['Blind replay', 'Your own pace', 'Process scorecards'],
    color: 'purple' as const
  },
  { 
    name: 'Risk lab', 
    number: '03', 
    title: 'See the downside before the decision.', 
    body: 'Explore concentration, stress-test your virtual portfolio and learn how position size changes what is at stake.', 
    view: 'portfolio' as AppTabType, 
    tags: ['Concentration checks', 'What-if scenarios', 'Virtual portfolio'],
    color: 'green' as const
  },
];

export function LandingPage3D({ onEnter }: { onEnter: (mode: 'LOGIN' | 'SIGNUP', view?: AppTabType) => void }) {
  const { settings, updateSetting } = useAccessibility();
  const osReduced = useReducedMotion();
  const reduced = settings.reducedMotion || !!osReduced;
  const { scrollYProgress } = useScroll();
  const coinTurn = useTransform(scrollYProgress, [0, 0.35], [-24, 28]);
  const coinLift = useTransform(scrollYProgress, [0, 0.35], [0, 90]);

  const scene = useRef<HTMLDivElement>(null);
  const landingRef = useRef<HTMLDivElement>(null);

  const { stocks } = useSimulator();
  const [selectedStockSymbol, setSelectedStockSymbol] = useState<string>('RELIANCE');
  const [feature, setFeature] = useState(0);
  const [allocation, setAllocation] = useState(25);
  const [answer, setAnswer] = useState<number | null>(null);
  const [coinFlipped, setCoinFlipped] = useState(false);

  // Directly derive live shares from SimulatorContext stocks so landing and signup pages are 100% in sync
  const liveShares = useMemo<PopularShare[]>(() => {
    return POPULAR_SHARES.map(share => {
      const match = stocks?.find(s => s.symbol === share.symbol);
      if (match && typeof match.price === 'number' && match.price > 0) {
        return {
          ...share,
          price: match.price,
          change: typeof match.change === 'number' ? match.change : share.change,
          changePct: typeof match.changePercent === 'number' ? match.changePercent : share.changePct,
          peRatio: match.peRatio ? match.peRatio.toString() : share.peRatio,
          marketCap: match.marketCapCr ? `₹${(match.marketCapCr / 100000).toFixed(1)}L Cr` : share.marketCap,
        };
      }
      return share;
    });
  }, [stocks]);

  const hasLivePrices = useMemo(() => {
    return Boolean(stocks && stocks.length > 0);
  }, [stocks]);

  const selectedStock = useMemo<PopularShare>(() => {
    return liveShares.find(s => s.symbol === selectedStockSymbol) || liveShares[0];
  }, [liveShares, selectedStockSymbol]);

  const [move, setMove] = useState(selectedStock.changePct);

  useEffect(() => {
    setMove(selectedStock.changePct);
  }, [selectedStock.symbol, selectedStock.changePct]);

  // Immediate fetch to seed freshest quotes if app was opened on landing page directly
  useEffect(() => {
    fetch('/api/stocks')
      .then(res => res.json())
      .then((data: any) => {
        const stockList = Array.isArray(data) ? data : data?.stocks;
        if (Array.isArray(stockList) && stockList.length > 0) {
          window.dispatchEvent(new CustomEvent('rr_stocks_updated', { detail: { stocks: stockList } }));
        }
      })
      .catch(() => {});
  }, []);

  const capital = 1000000;
  const position = capital * allocation / 100;
  const sharesQuantity = Math.max(1, Math.floor(position / selectedStock.price));
  const exactCost = sharesQuantity * selectedStock.price;
  const cashResidual = position - exactCost;
  const change = exactCost * move / 100;
  const selected = features[feature];

  // Dynamic glow color based on hypothetical scenario result
  const playgroundGlow: 'green' | 'red' | 'blue' = 
    change > 0 ? 'green' : change < 0 ? 'red' : 'blue';

  useEffect(() => {
    if (reduced) return;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    // If not a fine pointer (e.g. mobile/touchscreen phone), do not attach pointermove at all!
    if (!fine.matches) {
      if (scene.current) {
        scene.current.style.setProperty('--tilt-x', '0deg');
        scene.current.style.setProperty('--tilt-y', '0deg');
      }
      return;
    }

    let frame = 0;

    const reset = () => {
      if (scene.current) {
        scene.current.style.setProperty('--tilt-x', '0deg');
        scene.current.style.setProperty('--tilt-y', '0deg');
      }
    };

    const pointer = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const x = event.clientX;
        const y = event.clientY;

        // Update ambient spotlight coordinates & screen lighting
        if (landingRef.current) {
          landingRef.current.style.setProperty('--mouse-x', `${x}px`);
          landingRef.current.style.setProperty('--mouse-y', `${y}px`);
          landingRef.current.style.setProperty('--mouse-xp', (x / window.innerWidth).toFixed(3));
          landingRef.current.style.setProperty('--mouse-yp', (y / window.innerHeight).toFixed(3));
        }

        // 3D Scene perspective tilt
        const rect = scene.current?.getBoundingClientRect();
        if (rect && rect.bottom > 0 && rect.top < window.innerHeight) {
          const deltaX = (x - rect.left - rect.width / 2) / (rect.width / 2);
          const deltaY = (y - rect.top - rect.height / 2) / (rect.height / 2);
          const tiltX = Math.max(-16, Math.min(16, deltaY * -16));
          const tiltY = Math.max(-20, Math.min(20, deltaX * 20));
          scene.current?.style.setProperty('--tilt-x', `${tiltX.toFixed(2)}deg`);
          scene.current?.style.setProperty('--tilt-y', `${tiltY.toFixed(2)}deg`);
          scene.current?.style.setProperty('--specular-x', `${(50 + deltaX * 30).toFixed(1)}%`);
          scene.current?.style.setProperty('--specular-y', `${(50 + deltaY * 30).toFixed(1)}%`);
        }
      });
    };

    window.addEventListener('pointermove', pointer, { passive: true });
    document.documentElement.addEventListener('pointerleave', reset);
    window.addEventListener('blur', reset);

    const onMediaChange = (e: MediaQueryListEvent) => {
      if (!e.matches) reset();
    };
    fine.addEventListener('change', onMediaChange);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', pointer);
      document.documentElement.removeEventListener('pointerleave', reset);
      window.removeEventListener('blur', reset);
      fine.removeEventListener('change', onMediaChange);
      reset();
    };
  }, [reduced]);

  const reveal = reduced ? {} : { 
    initial: { opacity: 0, y: 24 }, 
    whileInView: { opacity: 1, y: 0 }, 
    viewport: { once: true, amount: 0.1 }, 
    transition: { duration: 0.5 } 
  };

  return (
    <div ref={landingRef} className="rr-landing" data-motion={reduced ? 'off' : 'on'}>
      <a className="skip-link" href="#rr-main">Skip to content</a>



      {/* Ambient Cursor Spotlight overlay across the 3D plane */}
      <div className="rr-ambient-spotlight" aria-hidden="true" />

      {/* Reading Progress indicator */}
      <motion.div className="rr-reading-progress" style={{ scaleX: scrollYProgress }} aria-hidden="true" />

      {/* Header Navigation */}
      <header className="rr-nav">
        <a href="#rr-main" className="rr-brand" aria-label="RupeeRookie home">
          <span className="rr-brand-mark">₹</span>
          <span className="font-extrabold tracking-tight">RupeeRookie</span>
        </a>

        <nav aria-label="Main navigation">
          <a href="#rr-shares-box">Shares</a>
          <a href="#rr-practice">3D Sandbox</a>
          <a href="#rr-learn">Academy</a>
          <a href="#rr-explore">Explore</a>
        </nav>

        <div className="rr-nav-actions">
          <button 
            className="rr-motion" 
            aria-pressed={!reduced} 
            onClick={() => updateSetting('reducedMotion', !settings.reducedMotion)} 
            aria-label={osReduced ? 'Your system has reduced motion enabled' : reduced ? 'Turn animation on' : 'Turn animation off'} 
            disabled={!!osReduced}
          >
            {reduced ? <Play size={14} /> : <Pause size={14} />}
            <span>Motion {reduced ? 'off' : 'on'}</span>
          </button>

          <MetalButton variant="graphite" onClick={() => onEnter('LOGIN')} className="h-9 px-4 text-xs">
            Sign in <ArrowUpRight size={16} />
          </MetalButton>
        </div>
      </header>

      <main id="rr-main">
        {/* Hero Section with Interactive 3D Coin Canvas */}
        <section className="rr-hero">
          <div className="rr-hero-copy">
            <p className="rr-eyebrow">
              <span className="rr-live-dot" /> NEO-INDIAN MARKET SIMULATION · ZERO FINANCIAL RISK
            </p>
            <h1>Your first<br />investment?<br /><em>In yourself.</em></h1>
            <p className="rr-intro">
              Master the psychology of Indian markets, trade bluechip shares risk-free, and stress-test your strategy with ₹10 lakh in virtual practice capital.
            </p>

            <div className="rr-hero-actions">
              <MetalButton variant="chrome" onClick={() => onEnter('SIGNUP', 'academy')}>
                Start learning <ArrowUpRight size={20} />
              </MetalButton>
              <MetalButton variant="graphite" onClick={() => { document.getElementById('rr-shares-box')?.scrollIntoView({ behavior: 'smooth' }); }}>
                Explore live shares <ArrowRight size={17} />
              </MetalButton>
            </div>

            <p className="rr-small-note">
              <ShieldCheck size={16} className="text-mint" />
              <span>₹10,00,000 Virtual Capital · Spotlights on Live Shares · 100% Educational Sandbox</span>
            </p>
          </div>

          {/* 3D Spatial Canvas */}
          <div className="rr-art" ref={scene} aria-label="3D Candlestick Graph & Moving Rupee Arena">
            <div className="rr-grid-plane" />
            <div className="rr-orbit rr-orbit-one" />
            <div className="rr-orbit rr-orbit-two" />
            <div className="rr-orbit rr-orbit-three" />

            <span className="rr-art-label">3D CANDLESTICKS · DALAL STREET ARENA</span>

            {/* Interactive 3D Candlestick Graph & Rotating Rupee Symbol */}
            <div className="absolute inset-0 flex items-center justify-center pt-8">
              <SpatialCandlestickChart variant="hero" showRupee={true} showBadges={true} />
            </div>

            <div className="rr-star rr-star-one">✳</div>
            <div className="rr-star rr-star-two">✳</div>
            <span className="rr-art-coordinate">3D PERSPECTIVE: ACTIVE</span>
          </div>

          <a href="#rr-shares-box" className="rr-scroll-cue">
            <ArrowDown size={16} /> SCROLL TO SHARES
          </a>
        </section>

        {/* Proof Strip */}
        <div className="rr-proof-strip">
          <span>BUILT FOR LEARNERS</span>
          <p>Indian equity markets</p>
          <i>✳</i>
          <p>₹10L virtual capital</p>
          <i>✳</i>
          <p>Spotlight shares analytics</p>
          <i>✳</i>
          <p>Zero financial anxiety</p>
        </div>

        {/* THE SHARES BOX SECTION: Full Spotlight Cards on Indian Shares */}
        <motion.section {...reveal} className="rr-section rr-shares-section" id="rr-shares-box">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div className="rr-section-heading mb-0">
              <p className="rr-eyebrow">SPOTLIGHT SHARES & MARKET MOVERS</p>
              <h2>Interactive <em>Shares Box</em>.<br />Tracked by pointer spotlights.</h2>
              <p>
                Hover across the shares to activate dynamic radial spotlights. Click any share to load its parameters into the Sandbox or jump directly to Dalal Street.
              </p>
            </div>
            
            <button
              type="button"
              id="go-to-shares-btn"
              onClick={() => onEnter('LOGIN', 'screener')}
              className="px-6 py-3.5 bg-gradient-to-r from-mint to-emerald-500 hover:brightness-110 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-[0_0_20px_rgba(0,245,155,0.4)] flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0 hover:scale-102"
            >
              <BarChart3 className="w-4 h-4 text-slate-950" />
              <span>Go to Shares (75+ Equities)</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveShares.map((stock) => {
              const isSelected = selectedStock.symbol === stock.symbol;
              const isGain = stock.changePct >= 0;

              return (
                <div 
                  key={stock.symbol}
                  onClick={() => {
                    setSelectedStockSymbol(stock.symbol);
                    setMove(stock.changePct);
                  }}
                  className="rr-share-card cursor-pointer"
                >
                  <GlowCard 
                    glowColor={stock.glow} 
                    customSize 
                    className={`w-full min-h-[210px] p-6 transition-all duration-300 relative overflow-hidden isolate ${
                      isSelected 
                        ? 'ring-2 ring-mint bg-gradient-to-br from-[#020503] via-[#08150c] to-[#010402] shadow-[0_0_35px_rgba(0,245,155,0.35),inset_0_1px_1.5px_rgba(255,255,255,0.25)] scale-[1.02]' 
                        : 'bg-gradient-to-br from-[#020503] via-[#050f09] to-[#010302] border border-emerald-950/80 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.16),0_20px_45px_-12px_rgba(0,0,0,0.9)] hover:border-mint/40 hover:shadow-[0_20px_40px_-10px_rgba(0,245,155,0.2)] hover:scale-[1.01]'
                    }`}
                  >
                    {/* Polymo Lighting Specular Top Bevel & Ambient Gradient Wash */}
                    <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-mint/60 to-transparent pointer-events-none z-10" />
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(0,245,155,0.2),transparent_70%),radial-gradient(ellipse_at_100%_100%,rgba(16,185,129,0.12),transparent_50%)] -z-10" />

                    <div className="flex flex-col justify-between h-full relative z-[1]">
                      <div>
                        {/* Card Header: Symbol & Sector */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-lg text-slate-900">{stock.symbol}</span>
                            {isSelected && (
                              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-mint/20 text-mint border border-mint/30">
                                ACTIVE
                              </span>
                            )}
                            {hasLivePrices && (
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-mint border border-emerald-500/30">
                                LIVE
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-mono text-slate-500 bg-slate-800/80 px-2 py-0.5 rounded-md">
                            {stock.sector}
                          </span>
                        </div>

                        {/* Company Name */}
                        <p className="text-xs text-slate-500 font-medium mb-4">{stock.name}</p>

                        {/* Price & Change Pill */}
                        <div className="flex items-baseline justify-between pt-2 border-t border-slate-800/80">
                          <div>
                            <span className="text-[10px] font-mono text-slate-500 uppercase">Share Price</span>
                            <div className="text-2xl font-bold font-mono text-slate-900">
                              ₹{stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </div>
                          </div>

                          <div className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1 ${
                            isGain 
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}>
                            {isGain ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            <span>{isGain ? '+' : ''}{stock.changePct}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Micro Stats & Action Buttons */}
                      <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-2 text-slate-500">
                          <span>M-Cap: {stock.marketCap}</span>
                          <span className="text-slate-500">P/E: {stock.peRatio}x</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEnter('LOGIN', 'screener');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-mint/20 hover:bg-mint text-mint hover:text-slate-950 border border-mint/40 font-sans font-bold text-[11px] transition-all flex items-center gap-1 cursor-pointer"
                            title="Open in live Dalal Street screener"
                          >
                            <span>Go to Shares</span>
                            <ArrowRight size={11} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </GlowCard>
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* The 3D Interactive Playground encased in GlowCard */}
        <motion.section {...reveal} className="rr-section rr-playground" id="rr-practice">
          <div className="rr-section-heading">
            <p className="rr-eyebrow">01 / THE 3D RISK SANDBOX</p>
            <span className="mt-2 inline-flex items-center gap-1.5 rounded border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-900"><ShieldCheck size={14} /> No signup needed</span>
            <h2>Stress-test your <em>shares</em>.<br />Discover your downside.</h2>
            <p>
              Selected Share: <strong className="text-slate-900 font-mono">{selectedStock.name} ({selectedStock.symbol})</strong>.
              Move the sliders to see how concentration and volatility impact your virtual ₹10 Lakh portfolio.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rr-demo-label">Share: ₹{selectedStock.price.toFixed(2)}</span>
              <span className="rr-demo-label">Glow: {playgroundGlow.toUpperCase()}</span>
            </div>
          </div>

          <GlowCard glowColor={playgroundGlow} customSize className="w-full p-6 md:p-8">
            <div className="rr-experiment-content">
              <div className="rr-experiment-top">
                <div>
                  <span className="rr-eyebrow flex items-center gap-2 text-mint">
                    <Layers size={14} />
                    LIVE SHARES ALLOCATION SIMULATOR
                  </span>
                  <p className="text-xs text-slate-500 mt-0.5">Total Practice Capital: {money(capital)}</p>
                </div>
                <MetalButton
                  variant="chrome"
                  className="h-8 px-3 text-xs"
                  onClick={() => { setAllocation(25); setMove(selectedStock.changePct); }}
                >
                  <RotateCcw size={14} /> Reset
                </MetalButton>
              </div>

              {/* SHARES SPOTLIGHT BOX: Inside the Sandbox */}
              <div className="my-4">
                <GlowCard glowColor={selectedStock.glow} customSize className="p-4 bg-slate-900/60 border border-slate-700/60">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase">Active Share in Focus</span>
                      <div className="text-base font-bold text-slate-900 font-mono flex items-center gap-2">
                        <span>{selectedStock.symbol}</span>
                        <span className="text-xs text-slate-500 font-sans font-normal">({selectedStock.name})</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-mono text-slate-500 uppercase">Purchasable Quantity</span>
                      <div className="text-base font-bold text-mint font-mono">
                        {sharesQuantity} Shares
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800 text-xs font-mono">
                    <div>
                      <span className="text-slate-500 text-[10px] block">PER SHARE</span>
                      <span className="text-slate-900 font-semibold">₹{selectedStock.price.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">TOTAL COST</span>
                      <span className="text-slate-900 font-semibold">{money(exactCost)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">CASH LEFTOVER</span>
                      <span className="text-slate-600 font-semibold">{money(cashResidual)}</span>
                    </div>
                  </div>
                </GlowCard>
              </div>

              {/* Quick Allocation Presets */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="text-xs font-semibold text-slate-500">Presets:</span>
                {[10, 25, 50, 75].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setAllocation(pct)}
                    className={`text-xs px-2.5 py-1 rounded-md border transition-all ${
                      allocation === pct 
                        ? 'bg-mint text-slate-950 border-mint font-bold shadow-md' 
                        : 'border-slate-700 hover:bg-slate-800 text-slate-600'
                    }`}
                  >
                    {pct}% Capital
                  </button>
                ))}
              </div>

              {/* Position Size Slider */}
              <div className="rr-slider-heading">
                <label htmlFor="rr-allocation">Capital allocation to {selectedStock.symbol}</label>
                <strong className="text-base text-mint">{allocation}% ({money(position)})</strong>
              </div>
              <input 
                id="rr-allocation" 
                type="range" 
                min="5" 
                max="100" 
                step="5" 
                value={allocation} 
                onChange={e => setAllocation(Number(e.target.value))} 
                aria-valuetext={`${allocation} percent, ${money(position)} virtual position`} 
              />

              {/* Hypothetical Price Change Slider */}
              <div className="rr-slider-heading">
                <label htmlFor="rr-move">Hypothetical share swing</label>
                <strong className={`text-base ${move > 0 ? 'text-emerald-400' : move < 0 ? 'text-rose-400' : ''}`}>
                  {move > 0 ? '+' : ''}{move}%
                </strong>
              </div>
              <input 
                id="rr-move" 
                type="range" 
                min="-40" 
                max="40" 
                step="1" 
                value={move} 
                onChange={e => setMove(Number(e.target.value))} 
                aria-valuetext={`${move} percent`} 
              />

              {/* Result Grid with Dynamic Visual Impact */}
              <div className="rr-result-grid" aria-live="polite" aria-atomic="true">
                <div>
                  <small>SHARES PURCHASED</small>
                  <strong className="text-slate-900">{sharesQuantity} shares</strong>
                </div>
                <div>
                  <small>HYPOTHETICAL {change < 0 ? 'DRAWDOWN' : 'GAIN'}</small>
                  <strong className={change < 0 ? 'rr-loss' : 'rr-gain'}>
                    {change > 0 ? '+' : ''}{money(change)}
                  </strong>
                </div>
              </div>

              {/* 3D Visual Exposure Bar */}
              <div className="rr-exposure" aria-hidden="true">
                <span 
                  style={{ 
                    width: `${allocation}%`,
                    backgroundColor: change < 0 ? '#f43f5e' : '#00f59b'
                  }} 
                />
              </div>

              {/* Insight Callout */}
              <div className="rr-experiment-insight">
                <ShieldCheck size={20} className={change < 0 ? 'text-rose-400' : 'text-mint'} />
                <span>
                  {allocation > 35 
                    ? `Caution: ${allocation}% is concentrated in ${selectedStock.symbol}. If this share drops by ${Math.abs(move)}%, your total virtual net worth suffers a ${money(Math.abs(change))} hit.` 
                    : `Balanced risk profile. By limiting ${selectedStock.symbol} to ${allocation}%, a ${move}% swing only affects overall net worth by ${(allocation * move / 100).toFixed(1)}%.`}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs text-slate-500 font-mono">
                  Portfolio balance: <strong className="text-slate-900">{money(capital + change)}</strong>
                </span>
                <MetalButton
                  variant="chrome"
                  onClick={() => onEnter('SIGNUP', 'portfolio')}
                  className="text-xs h-8 px-4"
                >
                  Simulate in Portfolio Hub <ArrowRight size={14} />
                </MetalButton>
              </div>
            </div>
          </GlowCard>
        </motion.section>

        {/* Learning Paths with GlowCards */}
        <motion.section {...reveal} className="rr-section rr-learning" id="rr-learn">
          <div className="rr-learning-heading">
            <div>
              <p className="rr-eyebrow">02 / STRUCTURED LEARNING</p>
              <h2>Master the markets,<br /><em>step by step.</em></h2>
            </div>
            <p>From company fundamentals to stop-loss risk management. Clean, actionable lessons.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            {[
              { n: '01', title: 'Understand.', text: 'Demystify balance sheets, P/E multiples, and Indian market indices without boring math.', icon: BookOpen, view: 'academy', glow: 'blue' as const },
              { n: '02', title: 'Practise.', text: 'Execute mock buy and sell orders on live Indian NSE/BSE charts with virtual money.', icon: Sparkles, view: 'screener', glow: 'purple' as const },
              { n: '03', title: 'Reflect.', text: 'Review win-rates, evaluate emotional habits, and turn drawdowns into masterclasses.', icon: Award, view: 'review', glow: 'green' as const },
            ].map(item => (
              <GlowCard 
                key={item.n} 
                glowColor={item.glow} 
                customSize 
                className="w-full min-h-[250px] p-6 flex flex-col justify-between cursor-pointer hover:translate-y-[-4px] transition-transform"
              >
                <div>
                  <div className="flex justify-between items-center mb-6 font-mono text-xs">
                    <span className="font-bold text-slate-500">{item.n} / STAGE</span>
                    <item.icon size={26} className="text-mint" />
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight mb-2 text-slate-900">{item.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.text}</p>
                </div>
                <div className="pt-4 border-t border-slate-800/80">
                  <MetalButton
                    variant="graphite"
                    className="w-full justify-between h-9 px-4 text-xs"
                    onClick={() => onEnter('SIGNUP', item.view as AppTabType)}
                  >
                    <span>Explore this path</span>
                    <ArrowUpRight size={16} />
                  </MetalButton>
                </div>
              </GlowCard>
            ))}
          </div>

          {/* 20-Second Knowledge Check in a GlowCard */}
          <div className="mt-12">
            <GlowCard glowColor="orange" customSize className="w-full p-6 md:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <p className="rr-eyebrow flex items-center gap-1.5 text-amber-400">
                    <Zap size={14} /> 20-SECOND KNOWLEDGE CHECK
                  </p>
                  <h3 className="text-2xl font-bold tracking-tight mt-2 mb-3 text-slate-900">
                    Five stocks. All from one sector.<br />Is that a diversified portfolio?
                  </h3>
                  <p className="text-xs text-slate-500">
                    Interactive concept check. Tap an option to explore the mental model.
                  </p>
                </div>

                <div className="rr-quiz-answer">
                  <div className="flex gap-3 flex-wrap">
                    <button 
                      type="button"
                      aria-pressed={answer === 0} 
                      onClick={() => setAnswer(0)}
                      className={`px-4 py-2.5 text-xs font-semibold rounded-lg border transition-all ${
                        answer === 0 
                          ? 'bg-mint text-slate-950 border-mint font-bold shadow-md' 
                          : 'border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-600'
                      }`}
                    >
                      Yes, five companies is plenty
                    </button>
                    <button 
                      type="button"
                      aria-pressed={answer === 1} 
                      onClick={() => setAnswer(1)}
                      className={`px-4 py-2.5 text-xs font-semibold rounded-lg border transition-all ${
                        answer === 1 
                          ? 'bg-mint text-slate-950 border-mint font-bold shadow-md' 
                          : 'border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-600'
                      }`}
                    >
                      Not necessarily
                    </button>
                  </div>

                  <div 
                    className="mt-4 p-3.5 rounded-xl bg-slate-900/80 text-xs text-slate-600 leading-relaxed border border-slate-800" 
                    aria-live="polite"
                  >
                    {answer === null ? (
                      <span className="text-slate-500 italic">Choose an answer above to reveal the insight.</span>
                    ) : answer === 1 ? (
                      <span className="flex items-start gap-2">
                        <CheckCircle2 size={16} className="text-mint shrink-0 mt-0.5" />
                        <span><strong>Spot on!</strong> Company count alone is not diversification. If all five belong to one sector, a single regulatory shift strikes all five simultaneously. True diversification seeks uncorrelated revenue engines.</span>
                      </span>
                    ) : (
                      <span><strong>Think again:</strong> Company count is only part of the equation. If all five operate in the same industry, they share common risks. Sector diversity protects capital across market cycles.</span>
                    )}
                  </div>
                </div>
              </div>
            </GlowCard>
          </div>
        </motion.section>

        {/* Feature Explorer Showcase with GlowCard */}
        <motion.section {...reveal} className="rr-section rr-explore" id="rr-explore">
          <div>
            <p className="rr-eyebrow">03 / SIMULATION TOOLKIT</p>
            <h2>One platform.<br /><em>Endless learning.</em></h2>
          </div>

          {/* Feature Navigation Tabs */}
          <div className="rr-feature-tabs" aria-label="Explore app features">
            {features.map((item, index) => (
              <button 
                key={item.name} 
                aria-pressed={feature === index} 
                onClick={() => setFeature(index)}
              >
                <span>{item.name}</span>
                <ArrowUpRight size={16} />
              </button>
            ))}
          </div>

          {/* Active Feature Showcase inside GlowCard */}
          <div className="mt-8">
            <GlowCard glowColor={selected.color} customSize className="w-full p-8 min-h-[300px]">
              <div className="rr-feature-body">
                <span className="rr-feature-number" aria-hidden="true">
                  {selected.number}
                </span>

                <div>
                  <span className="text-xs font-mono uppercase tracking-widest text-mint">
                    MODULE {selected.number} OF 03
                  </span>
                  <h3 className="text-3xl font-bold tracking-tight mt-1 mb-3 text-slate-900">
                    {selected.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-6">
                    {selected.body}
                  </p>

                  <div className="rr-feature-tags mb-6">
                    {selected.tags.map(tag => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>

                  <MetalButton 
                    variant="graphite" 
                    onClick={() => onEnter('SIGNUP', selected.view)}
                  >
                    Open {selected.name} after signup <ArrowRight size={18} />
                  </MetalButton>
                </div>
              </div>
            </GlowCard>
          </div>
        </motion.section>

        {/* FAQ Section */}
        <section className="rr-section rr-faq">
          <div>
            <p className="rr-eyebrow">FREQUENT QUESTIONS</p>
            <h2>Before you<br /><em>jump in.</em></h2>
          </div>

          <div>
            {[
              { 
                q: 'Am I buying real shares with real money?', 
                a: 'No. RupeeRookie is an educational simulator. The ₹10 lakh practice capital is entirely virtual and cannot be withdrawn or converted to real fiat.' 
              },
              { 
                q: 'Do I need prior trading experience?', 
                a: 'Not at all. Start with the Academy lessons, then advance to market screening, historical replay, and portfolio stress-testing at your own comfortable pace.' 
              },
              { 
                q: 'Are the stock prices live or simulated?', 
                a: 'Inside the platform, market prices mirror real Indian NSE/BSE tickers with realistic delay and historical close series.' 
              },
              { 
                q: 'Does RupeeRookie recommend specific stocks to buy?', 
                a: 'No. We provide educational frameworks, risk analytics, and simulation tools. We never offer personalized investment advice or guaranteed return schemes.' 
              }
            ].map(item => (
              <details key={item.q}>
                <summary>
                  <span>{item.q}</span>
                  <span className="rr-faq-indicator">+</span>
                </summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Final Call to Action */}
        <section className="rr-final-cta">
          <span className="rr-eyebrow">YOUR JOURNEY AWAITS</span>
          <h2>Stay curious.<br /><em>Start small.</em></h2>
          <p className="text-sm text-slate-600 max-w-lg mb-6 leading-relaxed">
            Join thousands of curious Indian learners mastering portfolio construction and trading psychology without financial anxiety.
          </p>

          <div className="flex gap-4 items-center flex-wrap z-10">
            <MetalButton variant="chrome" onClick={() => onEnter('SIGNUP', 'academy')}>
              Let’s begin <ArrowUpRight size={21} />
            </MetalButton>
            <MetalButton variant="graphite" onClick={() => onEnter('LOGIN')}>
              Existing user? Sign in
            </MetalButton>
          </div>

        </section>
      </main>

      {/* Modern Motion Footer */}
      <MotionFooter 
        onEnterAuth={(m) => onEnter(m)} 
        onNavigate={(v) => onEnter('LOGIN', v)} 
      />
    </div>
  );
}

export default LandingPage3D;
export { LandingPage3D as LandingPage };
