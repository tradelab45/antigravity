"use client";

import React, { useState, useRef } from "react";
import { cn } from "../../lib/utils";
import "./spatial-chart.css";

export interface SpatialCandlestickChartProps {
  variant?: "hero" | "card" | "loading" | "compact";
  interactive?: boolean;
  className?: string;
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
  interactive = true,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

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
      </div>
    </div>
  );
};
