import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { ArrowUpRight, ArrowRight, ArrowDown, BookOpen, RotateCcw, ShieldCheck, Sparkles, Pause, Play } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import type { AppTabType } from './Header';
import './landing.css';
import { LiquidButton, MetalButton } from './ui/liquid-glass-button';
import { LiquidGlassLogo } from './ui/LiquidGlassLogo';

const money = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
const features = [
  { name: 'Academy', number: '01', title: 'Make the market make sense.', body: 'Short lessons, Hindi summaries and real-world case studies. Build your understanding one idea at a time.', view: 'academy' as AppTabType, tags: ['Bite-sized lessons', 'Knowledge checks', 'Save your place'] },
  { name: 'Replay', number: '02', title: 'A second chance at a first decision.', body: 'Step through historical scenarios without seeing what happens next. Make a plan, reveal the outcome and reflect on your process.', view: 'replay' as AppTabType, tags: ['Blind replay', 'Your own pace', 'Process scorecards'] },
  { name: 'Risk lab', number: '03', title: 'See the downside before the decision.', body: 'Explore concentration, stress-test your virtual portfolio and learn how position size changes what is at stake.', view: 'portfolio' as AppTabType, tags: ['Concentration checks', 'What-if scenarios', 'Virtual portfolio'] },
];

export function LandingPage({ onEnter }: { onEnter: (mode: 'LOGIN' | 'SIGNUP', view?: AppTabType) => void }) {
  const { settings, updateSetting } = useAccessibility();
  const osReduced = useReducedMotion();
  const reduced = settings.reducedMotion || !!osReduced;
  const { scrollYProgress } = useScroll();
  const coinTurn = useTransform(scrollYProgress, [0, 0.35], [-24, 28]);
  const coinLift = useTransform(scrollYProgress, [0, 0.35], [0, 90]);
  const scene = useRef<HTMLDivElement>(null);
  const cursor = useRef<HTMLDivElement>(null);
  const [feature, setFeature] = useState(0);
  const [sector, setSector] = useState('Technology');
  const [allocation, setAllocation] = useState(20);
  const [move, setMove] = useState(-10);
  const [answer, setAnswer] = useState<number | null>(null);
  const capital = 1000000;
  const position = capital * allocation / 100;
  const change = position * move / 100;
  const selected = features[feature];

  useEffect(() => {
    if (reduced) return;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    let frame = 0;
    const reset = () => {
      if (cursor.current) cursor.current.style.opacity = '0';
      scene.current?.style.setProperty('--tilt-x', '0deg');
      scene.current?.style.setProperty('--tilt-y', '0deg');
    };
    const pointer = (event: PointerEvent) => {
      if (!fine.matches || event.pointerType === 'touch') return reset();
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (cursor.current) {
          cursor.current.style.opacity = '1';
          cursor.current.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
          cursor.current.dataset.active = String(event.target instanceof Element && !!event.target.closest('a, button, input, select, summary'));
        }
        const rect = scene.current?.getBoundingClientRect();
        if (rect && rect.bottom > 0 && rect.top < innerHeight) {
          scene.current?.style.setProperty('--tilt-x', `${Math.max(-10, Math.min(10, (event.clientY - rect.top - rect.height / 2) / 30)) * -1}deg`);
          scene.current?.style.setProperty('--tilt-y', `${Math.max(-14, Math.min(14, (event.clientX - rect.left - rect.width / 2) / 30))}deg`);
        }
      });
    };
    window.addEventListener('pointermove', pointer, { passive: true });
    document.documentElement.addEventListener('pointerleave', reset);
    window.addEventListener('blur', reset);
    fine.addEventListener('change', reset);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', pointer);
      document.documentElement.removeEventListener('pointerleave', reset);
      window.removeEventListener('blur', reset);
      fine.removeEventListener('change', reset);
      reset();
    };
  }, [reduced]);

  const reveal = reduced ? {} : { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.1 }, transition: { duration: 0.5 } };

  return <div className="rr-landing" data-motion={reduced ? 'off' : 'on'}>
    <a className="skip-link" href="#rr-main">Skip to content</a>
    {!reduced && <div className="rr-cursor" ref={cursor} aria-hidden="true"><span /></div>}
    <motion.div className="rr-reading-progress" style={{ scaleX: scrollYProgress }} aria-hidden="true" />
    <header className="rr-nav">
      <a href="#rr-main" className="flex items-center gap-2" aria-label="RupeeRookie home"><LiquidGlassLogo size="sm" showText={true} /></a>
      <nav aria-label="Main navigation"><a href="#rr-learn">Learn</a><a href="#rr-practice">Practice</a><a href="#rr-explore">Explore</a></nav>
      <div className="rr-nav-actions"><button className="rr-motion" aria-pressed={!reduced} onClick={() => updateSetting('reducedMotion', !settings.reducedMotion)} aria-label={osReduced ? 'Your system has reduced motion enabled' : reduced ? 'Turn animation on' : 'Turn animation off'} disabled={!!osReduced}>{reduced ? <Play size={14} /> : <Pause size={14} />}<span>Motion {reduced ? 'off' : 'on'}</span></button><LiquidButton size="sm" onClick={() => onEnter('LOGIN')}>Sign in <ArrowUpRight size={16} /></LiquidButton></div>
    </header>

    <main id="rr-main">
      <section className="rr-hero">
        <div className="rr-hero-copy">
          <p className="rr-eyebrow"><span className="rr-live-dot" /> YOUR MONEY JOURNEY STARTS HERE</p>
          <h1>Your first<br />investment?<br /><em>In yourself.</em></h1>
          <p className="rr-intro">Big curiosity. Zero real-money risk. Learn the Indian markets, test your ideas and find your footing with ₹10 lakh in virtual money.</p>
          <div className="rr-hero-actions"><MetalButton variant="success" onClick={() => onEnter('SIGNUP', 'academy')}>Start learning <ArrowUpRight size={20} /></MetalButton><LiquidButton asChild size="lg"><a href="#rr-practice">Try the playground <ArrowRight size={17} /></a></LiquidButton></div>
          <p className="rr-small-note"><ShieldCheck size={15} /> Virtual money. Real learning. No brokerage account needed.</p>
        </div>
        <div className="rr-art" ref={scene} aria-hidden="true">
          <div className="rr-orbit rr-orbit-one" /><div className="rr-orbit rr-orbit-two" />
          <span className="rr-art-label">LEARN • PRACTISE • GROW</span>
          <motion.div className="rr-coin-scroll" style={reduced ? {} : { rotateZ: coinTurn, y: coinLift }}>
            <div className="rr-coin-tilt"><div className="rr-coin">
              {Array.from({ length: 16 }, (_, i) => <div key={i} className="rr-coin-edge" style={{ transform: `translateZ(${i * 2 - 16}px)` }} />)}
              <div className="rr-coin-face rr-coin-front"><span>₹</span><small>THE ROOKIE ADVANTAGE</small></div>
              <div className="rr-coin-face rr-coin-back"><span>₹</span></div>
            </div></div>
          </motion.div>
          <div className="rr-float-tag rr-capital"><span>YOUR PRACTICE CAPITAL</span><strong>₹10,00,000</strong><small>100% virtual. All yours to learn.</small></div>
          <div className="rr-float-tag rr-lesson-tag"><BookOpen size={19} /><div>Curiosity pays.<small>Start with one new idea.</small></div></div>
          <div className="rr-star rr-star-one">✳</div><div className="rr-star rr-star-two">✳</div>
          <span className="rr-art-coordinate">EST. YOUR FIRST CHAPTER ↗</span>
        </div>
        <a href="#rr-practice" className="rr-scroll-cue"><ArrowDown size={16} /> SCROLL TO EXPERIMENT</a>
      </section>

      <div className="rr-proof-strip"><span>MADE FOR THE CURIOUS</span><p>Indian markets</p><i>✳</i><p>Virtual capital</p><i>✳</i><p>Learn by doing</p><i>✳</i><p>Your own pace</p></div>

      <motion.section {...reveal} className="rr-section rr-playground" id="rr-practice">
        <div className="rr-section-heading"><p className="rr-eyebrow">01 / THE PLAYGROUND</p><h2>A little experiment.<br />A big <em>“aha”.</em></h2><p>What happens when one idea takes up too much of your portfolio? Move the sliders. See for yourself.</p><span className="rr-demo-label">Illustrative simulation · not live market data</span></div>
        <div className="rr-experiment">
          <div className="rr-experiment-top"><span className="rr-eyebrow">YOUR VIRTUAL SANDBOX</span><button className="rr-reset" onClick={() => { setAllocation(20); setMove(-10); setSector('Technology'); }}><RotateCcw size={14} /> Reset</button></div>
          <span className="mb-4 inline-flex items-center gap-1.5 rounded border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-900"><ShieldCheck size={14} /> No signup needed</span>
          <label className="rr-sector">Fictional company sector<select value={sector} onChange={e => setSector(e.target.value)}><option>Technology</option><option>Banking</option><option>Consumer goods</option></select></label>
          <div className="rr-slider-heading"><label htmlFor="rr-allocation">Position size</label><strong>{allocation}% of capital</strong></div>
          <input id="rr-allocation" type="range" min="5" max="100" step="5" value={allocation} onChange={e => setAllocation(Number(e.target.value))} aria-valuetext={`${allocation} percent, ${money(position)} virtual position`} />
          <div className="rr-slider-heading"><label htmlFor="rr-move">Hypothetical price change</label><strong>{move > 0 ? '+' : ''}{move}%</strong></div>
          <input id="rr-move" type="range" min="-40" max="40" step="1" value={move} onChange={e => setMove(Number(e.target.value))} aria-valuetext={`${move} percent`} />
          <div className="rr-result-grid" aria-live="polite" aria-atomic="true"><div><small>VIRTUAL POSITION</small><strong>{money(position)}</strong></div><div><small>HYPOTHETICAL {change < 0 ? 'LOSS' : 'GAIN'}</small><strong className={change < 0 ? 'rr-loss' : 'rr-gain'}>{change > 0 ? '+' : ''}{money(change)}</strong></div></div>
          <div className="rr-exposure" aria-hidden="true"><span style={{ width: `${allocation}%` }} /></div>
          <p className="rr-experiment-insight"><ShieldCheck size={18} /><span>{allocation > 35 ? `${allocation}% is tied to one fictional ${sector.toLowerCase()} company. One idea can move your whole portfolio.` : `This fictional ${sector.toLowerCase()} position changes your total capital by ${(allocation * move / 100).toFixed(1)}%. Smaller positions limit the impact of one idea.`}</span></p>
          <p className="rr-total">After this scenario: <strong>{money(capital + change)}</strong> total virtual value. No trade is placed.</p>
        </div>
      </motion.section>

      <motion.section {...reveal} className="rr-section rr-learning" id="rr-learn">
        <div className="rr-learning-heading"><div><p className="rr-eyebrow">02 / SMALL STEPS. BETTER QUESTIONS.</p><h2>From “what if?”<br />to <em>“I get it.”</em></h2></div><p>You don’t need to know everything to begin. Just bring your curiosity.</p></div>
        <div className="rr-paths">{[{ n: '01', title: 'Understand.', text: 'Meet the ideas behind the numbers.', icon: BookOpen, view: 'academy' }, { n: '02', title: 'Practise.', text: 'Test a plan with virtual money.', icon: Sparkles, view: 'screener' }, { n: '03', title: 'Reflect.', text: 'Turn your decisions into useful lessons.', icon: ShieldCheck, view: 'review' }].map(item => <button className="rr-path" key={item.n} onClick={() => onEnter('SIGNUP', item.view as AppTabType)}><span className="rr-path-top"><span>{item.n}</span><item.icon size={25} /></span><h3>{item.title}</h3><p>{item.text}</p><span className="rr-path-link">Explore this path <ArrowUpRight size={18} /></span></button>)}</div>
        <div className="rr-quiz"><div><p className="rr-eyebrow">A 20-SECOND KNOWLEDGE CHECK</p><h3>Five stocks. All from one sector.<br />Is that a diversified portfolio?</h3></div><div className="rr-quiz-answer"><div className="rr-quiz-buttons"><button aria-pressed={answer === 0} onClick={() => setAnswer(0)}>Yes, five is enough</button><button aria-pressed={answer === 1} onClick={() => setAnswer(1)}>Not necessarily</button></div><p aria-live="polite">{answer === null ? 'Choose an answer to reveal the idea.' : answer === 1 ? 'Exactly. A shared sector can expose all five companies to the same risk. Think about what drives each business.' : 'Company count is only part of the picture. Five companies in one sector may still share the same risks.'}</p></div></div>
      </motion.section>

      <motion.section {...reveal} className="rr-section rr-explore" id="rr-explore">
        <div><p className="rr-eyebrow">03 / ROOM TO GROW</p><h2>One playground.<br /><em>Many possibilities.</em></h2></div>
        <div className="rr-feature-tabs" aria-label="Explore app features">{features.map((item, index) => <button key={item.name} aria-pressed={feature === index} onClick={() => setFeature(index)}>{item.name}<ArrowUpRight size={16} /></button>)}</div>
        <div className="rr-feature-body"><span className="rr-feature-number" aria-hidden="true">{selected.number}</span><div><h3>{selected.title}</h3><p>{selected.body}</p><div className="rr-feature-tags">{selected.tags.map(tag => <span key={tag}>{tag}</span>)}</div><button className="rr-text-link" onClick={() => onEnter('SIGNUP', selected.view)}>Open {selected.name} after signup <ArrowRight size={18} /></button></div></div>
      </motion.section>

      <section className="rr-section rr-faq"><div><p className="rr-eyebrow">GOOD QUESTIONS</p><h2>Before you<br /><em>jump in.</em></h2></div><div>{[{ q: 'Am I investing real money?', a: 'No. RupeeRookie is an educational simulator. The ₹10 lakh practice capital is virtual and cannot be withdrawn.' }, { q: 'Do I need experience?', a: 'No. Start with the Academy and build up to practice, replay and reflection at your own pace.' }, { q: 'Are the prices here live?', a: 'This landing-page playground uses hypothetical changes. Inside the app, market data may be delayed, indicative or based on the last close. Check the displayed source and timestamp.' }, { q: 'Will it tell me what to buy?', a: 'The tools help you learn and question your ideas. They do not provide personalised investment advice or guarantee outcomes.' }].map(item => <details key={item.q}><summary>{item.q}<span>+</span></summary><p>{item.a}</p></details>)}</div></section>
      <section className="rr-final-cta"><span className="rr-eyebrow">YOUR NEXT CHAPTER</span><h2>Stay curious.<br /><em>Start small.</em></h2><MetalButton variant="success" onClick={() => onEnter('SIGNUP', 'academy')}>Let’s begin <ArrowUpRight size={21} /></MetalButton><span className="rr-cta-star" aria-hidden="true">✳</span></section>
    </main>
    <footer className="rr-footer"><a className="flex items-center gap-2" href="#rr-main"><LiquidGlassLogo size="sm" showText={true} /></a><p>Made for learning, one decision at a time.</p><span>Educational simulation · not investment advice</span></footer>
  </div>;
}
