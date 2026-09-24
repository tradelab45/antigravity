"use client";

import React, { useState, useEffect, useRef } from "react";
import { TrendingUp, Zap, Sparkles, Activity, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../../lib/utils";
import "./spatial-chart.css";

export interface SpatialCandlestickChartProps {
  variant?: "hero" | "card" | "loading" | "compact";
  showRupee?: boolean;
  showBadges?: boolean;
  interactive?: boolean;
  className?: string;
  onCoinClick?: () => void;
}

interface CandleData {
  id: number;
  open: number;
  high: number;
  low: number;
  close: number;
  time: string;
  isBullish: boolean;
  zDepth: number;
}

const BASE_CANDLES: CandleData[] = [
  { id: 1, open: 120, high: 135, low: 115, close: 130, time: "10:00", isBullish: true, zDepth: 10 },
  { id: 2, open: 130, high: 145, low: 126, close: 142, time: "10:30", isBullish: true, zDepth: 20 },
  { id: 3, open: 142, high: 148, low: 133, close: 136, time: "11:00", isBullish: false, zDepth: 30 },
  { id: 4, open: 136, high: 160, low: 134, close: 156, time: "11:30", isBullish: true, zDepth: 40 },
  { id: 5, open: 156, high: 172, low: 152, close: 168, time: "12:00", isBullish: true, zDepth: 55 },
  { id: 6, open: 168, high: 173, low: 160, close: 164, time: "12:30", isBullish: false, zDepth: 45 },
  { id: 7, open: 164, high: 188, low: 162, close: 184, time: "13:00", isBullish: true, zDepth: 65 },
  { id: 8, open: 184, high: 205, low: 180, close: 202, time: "13:30", isBullish: true, zDepth: 80 },
];

export const SpatialCandlestickChart: React.FC<SpatialCandlestickChartProps> = ({
  variant = "hero",
  showRupee = true,
  showBadges = true,
  interactive = true,
  className,
  onCoinClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [coinFlipped, setCoinFlipped] = useState(false);
  const [livePrice] = useState(23346.40);
  const [liveChange] = useState(0.33);

  // Gyroscopic 3D Parallax Tilt Handler (Desktop pointer only, ignore touch swipes)
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive || !containerRef.current || e.pointerType === 'touch') return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5
    setTilt({
      x: -y * 22, // Tilt around X-axis
      y: x * 26,  // Tilt around Y-axis
    });
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
  };

  const handleCoinClickInternal = () => {
    setCoinFlipped(!coinFlipped);
    onCoinClick?.();
  };

  const isHero = variant === "hero";
  const isCompact = variant === "compact";
  const isLoading = variant === "loading";

  // Dimension scaling
  const chartHeight = isHero ? 360 : isCompact ? 220 : isLoading ? 280 : 300;
  const maxPrice = 210;
  const minPrice = 110;
  const priceRange = maxPrice - minPrice;

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerEnter={(e) => { if (e.pointerType !== 'touch') setIsHovered(true); }}
      onPointerLeave={handlePointerLeave}
      style={{ touchAction: 'pan-y' }}
      className={cn(
        "spatial-scene relative w-full flex items-center justify-center overflow-visible select-none",
        isHero ? "min-h-[460px] md:min-h-[520px]" : isCompact ? "min-h-[260px]" : "min-h-[380px]",
        className
      )}
    >
      {/* Ambient Radial Lighting */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-700"
        style={{
          background: "radial-gradient(ellipse at 50% 55%, rgba(0, 245, 155, 0.18) 0%, rgba(16, 185, 129, 0.06) 45%, transparent 70%)",
          filter: "blur(30px)",
        }}
      />

      {/* Grid Ground Plane in 3D */}
      <div
        className="absolute inset-x-0 bottom-4 h-48 pointer-events-none"
        style={{
          transform: "rotateX(68deg) translateZ(-40px)",
          backgroundImage: `
            linear-gradient(to right, rgba(0, 245, 155, 0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 245, 155, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: "28px 28px",
          maskImage: "radial-gradient(ellipse at 50% 50%, black 25%, transparent 70%)",
        }}
      />

      {/* 3D Moving Stage */}
      <div
        className="spatial-stage relative w-full max-w-2xl flex items-center justify-center"
        style={{
          transform: `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(${isHovered ? 1.02 : 1}, ${isHovered ? 1.02 : 1}, 1)`,
        }}
      >
        {/* CANDLESTICKS GRAPH STAGE */}
        <div
          className="relative w-full px-6 flex items-end justify-between"
          style={{
            height: `${chartHeight}px`,
            transformStyle: "preserve-3d",
          }}
        >
          {/* Animated Connecting Glowing Trendline Spline */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-10"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="spatialTrendGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00f59b" stopOpacity="0.3" />
                <stop offset="60%" stopColor="#00f59b" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="1" />
              </linearGradient>
              <filter id="spatialGlow">
                <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Glowing trajectory curve */}
            <path
              d="M 6,78 Q 20,70 32,74 T 56,48 T 80,28 T 94,12"
              fill="none"
              stroke="url(#spatialTrendGrad)"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeDasharray="6 4"
              filter="url(#spatialGlow)"
              className="spatial-trendline-flow"
              style={{
                filter: "drop-shadow(0 0 8px rgba(0, 245, 155, 0.7))",
              }}
            />

            {/* Pulsing leading node at apex */}
            <circle cx="94" cy="12" r="4.5" fill="#00f59b" filter="url(#spatialGlow)" />
            <circle cx="94" cy="12" r="8" fill="none" stroke="#00f59b" strokeWidth="1.2" opacity="0.6" className="animate-ping" />
          </svg>

          {/* 8 Japanese Candlesticks with 3D Depth */}
          {BASE_CANDLES.map((candle, idx) => {
            const bodyTop = Math.min(candle.open, candle.close);
            const bodyBottom = Math.max(candle.open, candle.close);
            const bodyHeightPct = ((bodyBottom - bodyTop) / priceRange) * 100;
            const wickHeightPct = ((candle.high - candle.low) / priceRange) * 100;
            const bottomPct = ((bodyTop - minPrice) / priceRange) * 100;
            const wickBottomPct = ((candle.low - minPrice) / priceRange) * 100;

            const isGreen = candle.isBullish;
            const colorGlow = isGreen ? "rgba(0, 245, 155, 0.85)" : "rgba(244, 63, 94, 0.85)";
            const colorHex = isGreen ? "#00f59b" : "#f43f5e";
            const colorDark = isGreen ? "#064e3b" : "#881337";

            return (
              <div
                key={candle.id}
                className="relative flex flex-col items-center group cursor-pointer"
                style={{
                  height: "100%",
                  width: `${100 / BASE_CANDLES.length}%`,
                  transformStyle: "preserve-3d",
                  transform: `translateZ(${candle.zDepth}px)`,
                }}
              >
                {/* Wick (Vertical Line) */}
                <div
                  className="absolute w-[2px] rounded-full transition-all duration-300"
                  style={{
                    bottom: `${wickBottomPct}%`,
                    height: `${wickHeightPct}%`,
                    background: colorHex,
                    boxShadow: `0 0 10px ${colorGlow}`,
                    transform: "translateZ(2px)",
                  }}
                />

                {/* 3D Candlestick Real Body */}
                <div
                  className={cn(
                    "absolute w-7 sm:w-9 rounded-sm transition-all duration-300 spatial-candle-breathe",
                    isGreen ? "spatial-candle-glow" : ""
                  )}
                  style={{
                    bottom: `${bottomPct}%`,
                    height: `${Math.max(bodyHeightPct, 6)}%`,
                    background: isGreen
                      ? "linear-gradient(135deg, #00f59b 0%, #059669 100%)"
                      : "linear-gradient(135deg, #fb7185 0%, #e11d48 100%)",
                    border: `1px solid ${colorHex}`,
                    boxShadow: `
                      0 4px 14px ${colorGlow},
                      inset 0 1px 2px rgba(255,255,255,0.4),
                      inset 0 -1px 2px rgba(0,0,0,0.5)
                    `,
                    transformStyle: "preserve-3d",
                    animationDelay: `${idx * 0.35}s`,
                  }}
                >
                  {/* Specular 3D Reflection Highlight */}
                  <div
                    className="absolute inset-x-1 top-0.5 h-[3px] bg-white/40 rounded-full"
                    style={{ transform: "translateZ(4px)" }}
                  />

                  {/* Right Extrusion Edge for 3D Box Effect */}
                  <div
                    className="absolute top-0 -right-2 w-2 h-full rounded-r-sm opacity-70"
                    style={{
                      background: colorDark,
                      transform: "rotateY(70deg) origin-left",
                      transformOrigin: "left center",
                    }}
                  />
                </div>

                {/* Base Volume Pedestal in 3D */}
                <div
                  className="absolute bottom-0 w-5 h-1.5 rounded-full opacity-40 blur-[1px]"
                  style={{
                    background: colorHex,
                    boxShadow: `0 0 12px ${colorHex}`,
                    transform: "rotateX(75deg) translateZ(-6px)",
                  }}
                />

                {/* Micro Hover Price Tooltip */}
                <div
                  className="absolute -top-6 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#061009]/90 border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30"
                  style={{ transform: "translateZ(30px)" }}
                >
                  ₹{candle.close}
                </div>
              </div>
            );
          })}
        </div>

        {/* CENTRAL FLOATING 3D METALLIC RUPEE COIN */}
        {showRupee && (
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer z-20"
            style={{
              transformStyle: "preserve-3d",
              transform: "translateZ(65px)",
            }}
            onClick={handleCoinClickInternal}
            title="Click to flip the 3D Rupee symbol"
          >
            {/* Spinning & Floating 3D Coin Body */}
            <div
              className={cn(
                "relative w-28 h-28 sm:w-36 sm:h-36 rounded-full transition-transform duration-700",
                coinFlipped ? "rotate-y-180" : "spatial-rupee-spin"
              )}
              style={{
                transformStyle: "preserve-3d",
              }}
            >
              {/* Outer Radiant Glow Rings */}
              <div
                className="absolute -inset-4 rounded-full border border-mint/30 animate-pulse pointer-events-none"
                style={{ transform: "translateZ(-10px)" }}
              />
              <div
                className="absolute -inset-8 rounded-full border border-mint/15 pointer-events-none"
                style={{ transform: "translateZ(-20px)" }}
              />

              {/* 3D Coin Extrusion Slices (Metallic Edge) */}
              {Array.from({ length: 16 }, (_, i) => (
                <div
                  key={i}
                  className="absolute inset-0 rounded-full"
                  style={{
                    transform: `translateZ(${i * 1.6 - 12}px)`,
                    background: "linear-gradient(135deg, #10b981 0%, #064e3b 50%, #022c22 100%)",
                    border: "1.5px solid #00f59b",
                    boxShadow: i === 15 ? "0 0 25px rgba(0, 245, 155, 0.4)" : "none",
                  }}
                />
              ))}

              {/* FRONT FACE: Embossed ₹ Rupee Symbol */}
              <div
                className="absolute inset-0 rounded-full flex flex-col items-center justify-center p-3 text-center"
                style={{
                  transform: "translateZ(14px)",
                  background: "radial-gradient(circle at 35% 30%, #00f59b 0%, #059669 45%, #064e3b 85%, #022c22 100%)",
                  boxShadow: "inset 0 2px 6px rgba(255, 255, 255, 0.6), inset 0 -4px 10px rgba(0,0,0,0.8), 0 0 20px rgba(0,245,155,0.4)",
                  border: "2px solid #00f59b",
                }}
              >
                {/* Sunburst radial lines */}
                <div
                  className="absolute inset-2 rounded-full border border-white/20 pointer-events-none"
                  style={{
                    backgroundImage: "repeating-conic-gradient(from 0deg, rgba(255,255,255,0.15) 0deg 10deg, transparent 10deg 20deg)",
                    maskImage: "radial-gradient(circle at center, black 40%, transparent 80%)",
                  }}
                />

                {/* 3D Rupee Symbol */}
                <span
                  className="text-4xl sm:text-5xl font-black text-slate-900 font-mono leading-none select-none"
                  style={{
                    textShadow: "0 2px 0 #064e3b, 0 4px 12px rgba(0, 0, 0, 0.8), 0 0 16px rgba(255, 255, 255, 0.7)",
                  }}
                >
                  ₹
                </span>
                <span className="text-[8px] sm:text-[9px] font-mono tracking-widest text-emerald-950 font-bold mt-1 uppercase">
                  Dalal Street
                </span>
                <span className="text-[7px] font-mono text-emerald-950/80 tracking-tighter">
                  EST. 2026
                </span>
              </div>

              {/* BACK FACE: Chanakya Wisdom Motto */}
              <div
                className="absolute inset-0 rounded-full flex flex-col items-center justify-center p-3 text-center"
                style={{
                  transform: "rotateY(180deg) translateZ(14px)",
                  background: "radial-gradient(circle at 35% 30%, #38bdf8 0%, #0284c7 45%, #0369a1 85%, #082f49 100%)",
                  boxShadow: "inset 0 2px 6px rgba(255, 255, 255, 0.6), inset 0 -4px 10px rgba(0,0,0,0.8), 0 0 20px rgba(56, 189, 248, 0.4)",
                  border: "2px solid #38bdf8",
                }}
              >
                <span
                  className="text-4xl sm:text-5xl font-black text-slate-900 font-mono leading-none select-none"
                  style={{
                    textShadow: "0 2px 0 #0369a1, 0 4px 12px rgba(0, 0, 0, 0.8)",
                  }}
                >
                  ₹
                </span>
                <span className="text-[8px] sm:text-[9px] font-mono tracking-widest text-sky-950 font-bold mt-1 uppercase">
                  Gyan • Dhan
                </span>
                <span className="text-[7px] font-mono text-sky-950/80 tracking-tighter">
                  Rupee Rookie Labs
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 3D PARALLAX TELEMETRY BADGES */}
        {showBadges && (
          <>
            {/* Top Left: NIFTY 50 Breakout */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-3 left-4 sm:left-8 px-3 py-2 rounded-xl bg-[#09140e]/90 border border-mint/30 backdrop-blur-md shadow-[0_8px_20px_rgba(0,0,0,0.4)] z-30 pointer-events-none"
              style={{ transform: "translateZ(75px)" }}
            >
              <div className="flex items-center gap-1.5 text-mint text-[10px] font-mono font-bold tracking-wide">
                <Activity size={12} className="animate-pulse" />
                <span>NIFTY 50 BREAKOUT</span>
              </div>
              <div className="text-sm sm:text-base font-extrabold text-white font-mono mt-0.5">
                ₹{livePrice.toLocaleString("en-IN")}
                <span className="text-xs text-mint font-bold ml-1.5">
                  ▲ +{liveChange}%
                </span>
              </div>
            </motion.div>

            {/* Bottom Right: Virtual Capital Badge */}
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -bottom-2 right-4 sm:right-8 px-3 py-2 rounded-xl bg-[#09140e]/90 border border-white/15 backdrop-blur-md shadow-[0_8px_20px_rgba(0,0,0,0.4)] z-30 pointer-events-none"
              style={{ transform: "translateZ(85px)" }}
            >
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-mono font-bold tracking-wide">
                <ShieldCheck size={12} className="text-mint" />
                <span>PRACTICE PORTFOLIO</span>
              </div>
              <div className="text-sm sm:text-base font-extrabold text-mint font-mono mt-0.5">
                ₹10,00,000
                <span className="text-[10px] text-slate-400 font-normal ml-1">
                  100% Risk-Free
                </span>
              </div>
            </motion.div>
          </>
        )}
      </div>

      {/* Interactive Flip Hint */}
      {showRupee && (
        <div className="absolute bottom-0 inset-x-0 flex items-center justify-center pointer-events-none">
          <span className="text-[10px] font-mono text-slate-500/80 tracking-wider uppercase flex items-center gap-1 bg-black/40 px-2.5 py-0.5 rounded-full border border-white/5">
            <Sparkles size={11} className="text-mint" />
            Click coin to flip · Hover to orbit in 3D
          </span>
        </div>
      )}
    </div>
  );
};
