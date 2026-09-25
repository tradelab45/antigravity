import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, ShieldCheck, Wallet, Zap, TrendingUp } from 'lucide-react';
import confetti from 'canvas-confetti';
import { playCoinLandingSound, playSuccessChime } from '../../../utils/soundEffects';
import type { UserAccount } from '../../../types';

interface AuthLaunchTransitionProps {
  user: UserAccount;
  kind: 'new' | 'returning';
  onEnter?: () => void;
}

type TransitionPhase = 'flight' | 'wobble' | 'reveal';

export const AuthLaunchTransition: React.FC<AuthLaunchTransitionProps> = ({
  user,
  kind,
  onEnter,
}) => {
  const [phase, setPhase] = useState<TransitionPhase>('flight');
  const [showConfettiDone, setShowConfettiDone] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const enteredRef = useRef(false);

  const firstName = user.fullName ? user.fullName.split(' ')[0] : 'Trader';

  // Handle immediate or automated transition to terminal
  const handleProceed = () => {
    if (enteredRef.current) return;
    enteredRef.current = true;
    if (onEnter) {
      onEnter();
    } else {
      window.location.reload();
    }
  };

  useEffect(() => {
    // 1. Phase flight -> wobble at 1300ms (Coin hits the pedestal)
    const timerWobble = window.setTimeout(() => {
      setPhase('wobble');
      playCoinLandingSound();
    }, 1300);

    // 2. Phase wobble -> reveal at 2450ms (Coin settles, "LET'S START INVESTING!" pops up)
    const timerReveal = window.setTimeout(() => {
      setPhase('reveal');
      playSuccessChime();
      if (!showConfettiDone) {
        setShowConfettiDone(true);
        try {
          confetti({
            particleCount: 65,
            spread: 75,
            origin: { y: 0.55 },
            colors: ['#00f59b', '#f59e0b', '#10b981', '#fbbf24', '#ffffff', '#38bdf8'],
            disableForReducedMotion: true,
          });
        } catch {
          // ignore if canvas unavailable
        }
      }
    }, 2450);

    // 3. Countdown timer in reveal phase
    const countdownInterval = window.setInterval(() => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : 1));
    }, 800);

    // 4. Automated seamless launch into main terminal at 4200ms
    const timerEnter = window.setTimeout(() => {
      handleProceed();
    }, 4200);

    return () => {
      window.clearTimeout(timerWobble);
      window.clearTimeout(timerReveal);
      window.clearInterval(countdownInterval);
      window.clearTimeout(timerEnter);
    };
  }, []);

  return (
    <main
      className="fixed inset-0 z-50 flex w-full flex-col items-center justify-center overflow-hidden bg-[#030704] px-4 py-8 text-white select-none"
      aria-labelledby="launch-phrase-title"
    >
      {/* 3D Perspective Grid Background */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,245,155,0.18) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,245,155,0.18) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          transform: 'perspective(650px) rotateX(65deg) scale(2.2) translateY(18%)',
          transformOrigin: 'center bottom',
        }}
      />

      {/* Dramatic Top Spotlight Cone Shining on Pedestal */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[450px] bg-gradient-to-b from-amber-400/10 via-mint/5 to-transparent blur-3xl pointer-events-none" />

      {/* Atmospheric Ambient Glow Orbs */}
      <motion.div
        className="absolute -left-28 top-16 h-96 w-96 rounded-full bg-mint/15 blur-3xl pointer-events-none"
        animate={{ x: [0, 40, 0], y: [0, 25, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -right-28 bottom-16 h-96 w-96 rounded-full bg-amber-500/15 blur-3xl pointer-events-none"
        animate={{ x: [0, -40, 0], y: [0, -25, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Center 3D Stage Container */}
      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center text-center">

        {/* ----------------------------------------------------------------- */}
        {/* 3D COIN & PEDESTAL ARENA */}
        {/* ----------------------------------------------------------------- */}
        <div className="relative flex h-64 sm:h-72 w-full items-center justify-center">

          {/* Glowing Cyber Dais / Floor Pedestal */}
          <div className="absolute bottom-6 flex items-center justify-center pointer-events-none">
            {/* Outer Rotating Dashed Ring */}
            <div
              className="h-56 w-56 sm:h-64 sm:w-64 rounded-full border border-dashed border-mint/35 animate-[spin_20s_linear_infinite]"
              style={{ transform: 'perspective(400px) rotateX(72deg)' }}
            />
            {/* Inner Concentric Glow Disc */}
            <div
              className="absolute h-44 w-44 sm:h-52 sm:w-52 rounded-full border border-amber-400/30 bg-gradient-to-t from-emerald-500/15 to-transparent shadow-[0_0_30px_rgba(0,245,155,0.25)]"
              style={{ transform: 'perspective(400px) rotateX(72deg)' }}
            />

            {/* Impact Shockwaves on landing */}
            <AnimatePresence>
              {(phase === 'wobble' || phase === 'reveal') && (
                <>
                  <motion.div
                    key="shockwave-1"
                    initial={{ scale: 0.3, opacity: 0.9 }}
                    animate={{ scale: 2.5, opacity: 0 }}
                    transition={{ duration: 0.85, ease: 'easeOut' }}
                    className="absolute h-36 w-36 rounded-full border-2 border-mint"
                    style={{ transform: 'perspective(400px) rotateX(72deg)' }}
                  />
                  <motion.div
                    key="shockwave-2"
                    initial={{ scale: 0.2, opacity: 0.8 }}
                    animate={{ scale: 2.1, opacity: 0 }}
                    transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
                    className="absolute h-36 w-36 rounded-full border border-amber-400"
                    style={{ transform: 'perspective(400px) rotateX(72deg)' }}
                  />
                </>
              )}
            </AnimatePresence>

            {/* Dynamic Ground Shadow that synchronizes with the Coin */}
            <motion.div
              className="absolute h-14 w-28 rounded-full bg-black/80 blur-md"
              style={{ transform: 'perspective(400px) rotateX(72deg)' }}
              animate={
                phase === 'flight'
                  ? {
                      scale: [0.35, 0.15, 1.05],
                      opacity: [0.3, 0.1, 0.85],
                    }
                  : phase === 'wobble'
                  ? {
                      scale: [1.15, 0.85, 1.08, 0.92, 1.04, 0.98, 1],
                      opacity: [0.9, 0.75, 0.88, 0.8, 0.86, 0.84, 0.85],
                    }
                  : { scale: 1, opacity: 0.8 }
              }
              transition={
                phase === 'flight'
                  ? { duration: 1.3, ease: [0.4, 0, 0.2, 1] }
                  : phase === 'wobble'
                  ? { duration: 1.15, ease: 'easeOut' }
                  : { duration: 0.3 }
              }
            />
          </div>

          {/* THE 3D GOLDEN RUPEE COIN */}
          <div
            className="relative z-10"
            style={{ perspective: 1100, transformStyle: 'preserve-3d' }}
          >
            <motion.div
              className="relative cursor-pointer"
              style={{
                width: 148,
                height: 148,
                transformStyle: 'preserve-3d',
              }}
              animate={
                phase === 'flight'
                  ? {
                      // Flight: High 3D toss in air, 3 rapid rotations across Y axis, slight X tilt
                      y: [-15, -145, 0],
                      rotateY: [0, 540, 1080],
                      rotateX: [-15, -25, 0],
                      rotateZ: [0, 10, 0],
                      scale: [0.9, 1.12, 1],
                    }
                  : phase === 'wobble'
                  ? {
                      // Wobble: Realistic damped harmonic oscillation upon landing on hard dais
                      y: [0, -10, 0, -5, 0, -2, 0],
                      rotateX: [0, 24, -18, 12, -7, 3, -1, 0],
                      rotateZ: [0, -20, 15, -10, 6, -3, 1, 0],
                      rotateY: [1080, 1080, 1080, 1080, 1080, 1080, 1080],
                      scale: [1, 1.02, 1],
                    }
                  : {
                      // Settled: Resting proudly with gentle floating shimmer
                      y: [0, -3, 0],
                      rotateX: [0, 2, 0],
                      rotateZ: 0,
                      rotateY: 1080,
                      scale: 1.03,
                    }
              }
              transition={
                phase === 'flight'
                  ? {
                      duration: 1.3,
                      ease: [0.25, 0.1, 0.25, 1],
                    }
                  : phase === 'wobble'
                  ? {
                      duration: 1.15,
                      ease: [0.22, 1, 0.36, 1],
                    }
                  : {
                      y: { duration: 2.6, repeat: Infinity, ease: 'easeInOut' },
                      rotateX: { duration: 2.6, repeat: Infinity, ease: 'easeInOut' },
                      scale: { duration: 0.4 },
                    }
              }
            >
              {/* 3D Extrusion Depth Layers (Simulating heavy minted coin thickness) */}
              {[1, 2, 3, 4, 5, 6].map((depth) => (
                <div
                  key={`coin-edge-${depth}`}
                  className="absolute inset-0 rounded-full border border-amber-600/80 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-800"
                  style={{
                    transform: `translateZ(-${depth}px)`,
                  }}
                  aria-hidden="true"
                />
              ))}

              {/* BACK FACE (Rotated 180deg) */}
              <div
                className="absolute inset-0 rounded-full border-4 border-amber-300/80 bg-gradient-to-br from-[#FFE082] via-[#FFB300] to-[#B26A00] p-1.5 shadow-[inset_0_3px_8px_rgba(255,255,255,0.7),inset_0_-4px_8px_rgba(120,53,15,0.9)]"
                style={{
                  transform: 'translateZ(-7px) rotateY(180deg)',
                  backfaceVisibility: 'hidden',
                }}
              >
                <div className="flex h-full w-full flex-col items-center justify-center rounded-full border-2 border-dotted border-amber-200/60 bg-gradient-to-b from-amber-400/80 to-amber-600/90 text-amber-950">
                  <TrendingUp className="h-9 w-9 text-amber-950/80 drop-shadow-sm" />
                  <span className="mt-1 text-[8px] font-black uppercase tracking-wider text-amber-950">
                    Dalal Street
                  </span>
                  <span className="text-[7px] font-bold text-amber-900">
                    GROWTH • DISCIPLINE
                  </span>
                </div>
              </div>

              {/* FRONT FACE (Main Golden Rupee Emblem) */}
              <div
                className="absolute inset-0 rounded-full border-4 border-amber-300/90 bg-gradient-to-br from-[#FFF3B0] via-amber-500 to-[#92400E] p-1.5 shadow-[0_10px_35px_rgba(245,158,11,0.5),inset_0_3px_8px_rgba(255,255,255,0.9),inset_0_-4px_8px_rgba(120,53,15,0.9)]"
                style={{
                  transform: 'translateZ(1px)',
                  backfaceVisibility: 'hidden',
                }}
              >
                {/* Specular Diagonal Reflection Sweep */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/40 to-transparent pointer-events-none" />

                {/* Inner Concentric Coin Rim with Dotted Coin Edge */}
                <div className="relative flex h-full w-full flex-col items-center justify-between rounded-full border-2 border-dotted border-amber-200/75 bg-gradient-to-b from-amber-400/95 via-amber-500/95 to-amber-600/95 p-2 text-amber-950 shadow-inner">
                  
                  {/* Top Arch Label */}
                  <div className="text-[7px] font-black tracking-[0.16em] uppercase text-amber-950/90">
                    ★ BHARAT • NSE ★
                  </div>

                  {/* Embossed ₹ Indian Rupee Centerpiece */}
                  <div className="relative flex items-center justify-center my-auto">
                    <span
                      className="text-6xl font-black font-mono tracking-tighter text-amber-950 select-none"
                      style={{
                        textShadow: `
                          0 2px 0 #FFF3B0,
                          0 -1.5px 0 #78350F,
                          0 4px 10px rgba(0,0,0,0.45)
                        `,
                      }}
                    >
                      ₹
                    </span>
                    {/* Tiny Shimmer Sparkle */}
                    <motion.div
                      className="absolute -top-1 -right-2"
                      animate={{ scale: [0.8, 1.3, 0.8], opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Sparkles className="h-3.5 w-3.5 text-amber-200 drop-shadow-[0_0_6px_#fff]" />
                    </motion.div>
                  </div>

                  {/* Bottom Arch Label */}
                  <div className="text-[7px] font-black tracking-widest uppercase text-amber-950/90">
                    ₹ 10,00,000 • 2026
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* ANIMATED PHRASE & TERMINAL ENTRANCE REVEAL */}
        {/* ----------------------------------------------------------------- */}
        <div className="mt-4 flex flex-col items-center">
          <AnimatePresence mode="wait">
            {phase !== 'reveal' ? (
              /* Phase: Flight & Wobble status telemetry */
              <motion.div
                key="telemetry-loading"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col items-center"
              >
                <div className="flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-1 text-[11px] font-black uppercase tracking-widest text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                  <Sparkles className="h-3.5 w-3.5 animate-spin" />
                  <span>
                    {phase === 'flight'
                      ? 'Minting Dalal Street Capital…'
                      : 'Coin Settling • Verifying Portfolio…'}
                  </span>
                </div>
                <p className="mt-2 text-xs font-semibold text-slate-400">
                  {kind === 'new'
                    ? 'Preparing your live ₹10,00,000 trading sandbox…'
                    : 'Syncing live candlesticks & Chanakya AI coach…'}
                </p>
              </motion.div>
            ) : (
              /* Phase: The Big Reveal - "LET'S START INVESTING!" */
              <motion.div
                key="reveal-phrase"
                initial={{ opacity: 0, scale: 0.85, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 260,
                  damping: 18,
                }}
                className="flex flex-col items-center"
              >
                {/* Floating Dalal Street Live Badge */}
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mb-2 flex items-center gap-1.5 rounded-full border border-mint/50 bg-mint/15 px-3.5 py-1 text-[10px] font-black uppercase tracking-widest text-mint shadow-[0_0_20px_rgba(0,245,155,0.35)]"
                >
                  <Zap className="h-3.5 w-3.5 text-mint" />
                  <span>Portfolio Ready • Dalal Street Live</span>
                </motion.div>

                {/* ANIMATED BIG PHRASE */}
                <h1
                  id="launch-phrase-title"
                  className="text-3xl sm:text-5xl font-black tracking-tight drop-shadow-[0_0_35px_rgba(0,245,155,0.5)]"
                >
                  <span className="bg-gradient-to-r from-emerald-400 via-teal-200 to-amber-300 bg-clip-text text-transparent animate-pulse">
                    LET&apos;S START INVESTING!
                  </span>
                </h1>

                {/* Sub-phrase with personal touch */}
                <p className="mt-2 max-w-lg text-sm sm:text-base font-semibold text-slate-200 leading-relaxed">
                  Welcome to the Dalal Street arena,{' '}
                  <span className="text-mint font-bold">{firstName}</span>!
                  Your <span className="text-amber-300 font-bold">₹10,00,000</span> virtual capital is primed and ready.
                </p>

                {/* Interactive Instant Entry Action */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-5 flex flex-col sm:flex-row items-center gap-3"
                >
                  <button
                    onClick={handleProceed}
                    className="group relative inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-mint via-emerald-400 to-teal-300 px-7 py-3 text-sm font-black text-slate-950 shadow-[0_0_30px_rgba(0,245,155,0.5)] hover:scale-105 active:scale-95 transition-all duration-150 cursor-pointer"
                  >
                    <span>Enter Terminal Now</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>

                  <div className="text-[11px] font-mono text-slate-400">
                    Auto-entering in <span className="text-mint font-bold">{countdown}s</span>…
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Pillars Footer */}
          <div className="mt-8 flex items-center justify-center gap-4 sm:gap-7 text-[11px] font-mono text-slate-400 border-t border-white/10 pt-4 max-w-md w-full">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <Wallet className="h-3.5 w-3.5" /> ₹10,00,000 Capital
            </span>
            <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
              <Zap className="h-3.5 w-3.5" /> Gemini 3.8 Flash
            </span>
            <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <ShieldCheck className="h-3.5 w-3.5" /> Zero Risk
            </span>
          </div>
        </div>
      </div>
    </main>
  );
};

