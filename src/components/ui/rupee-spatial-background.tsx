"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { TrendingUp, TrendingDown } from "lucide-react";

export interface RupeeSpatialBackgroundProps {
  className?: string;
  intensity?: "subtle" | "medium" | "vivid";
  interactive?: boolean;
}

interface OrbitingSatellite {
  symbol: string;
  price: string;
  change: string;
  isUp: boolean;
  angleDeg: number;
  radiusPx: number;
  depthZ: number;
  speedSec: number;
}

const SATELLITES: OrbitingSatellite[] = [
  { symbol: "RELIANCE", price: "₹2,980.40", change: "+1.8%", isUp: true, angleDeg: 0, radiusPx: 310, depthZ: 40, speedSec: 42 },
  { symbol: "TCS", price: "₹4,120.15", change: "+0.9%", isUp: true, angleDeg: 60, radiusPx: 270, depthZ: -30, speedSec: 36 },
  { symbol: "HDFCBANK", price: "₹1,645.50", change: "+1.2%", isUp: true, angleDeg: 120, radiusPx: 330, depthZ: 60, speedSec: 48 },
  { symbol: "INFY", price: "₹1,780.00", change: "-0.4%", isUp: false, angleDeg: 180, radiusPx: 280, depthZ: -50, speedSec: 39 },
  { symbol: "NIFTY 50", price: "24,850.30", change: "+0.65%", isUp: true, angleDeg: 240, radiusPx: 350, depthZ: 80, speedSec: 54 },
  { symbol: "ZOMATO", price: "₹245.80", change: "+3.4%", isUp: true, angleDeg: 300, radiusPx: 290, depthZ: 10, speedSec: 44 },
];

export const RupeeSpatialBackground: React.FC<RupeeSpatialBackgroundProps> = ({
  className = "",
  intensity = "medium",
  interactive = true,
}) => {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!interactive) return;

    const handlePointerMove = (e: PointerEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setTilt({
        x: -y * 14,
        y: x * 18,
      });
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [interactive]);

  const opacityClass =
    intensity === "subtle"
      ? "opacity-20 dark:opacity-15"
      : intensity === "vivid"
      ? "opacity-60 dark:opacity-45"
      : "opacity-40 dark:opacity-30";

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none z-0 overflow-hidden select-none ${className}`}
      style={{ perspective: "1400px" }}
    >
      {/* 1. Deep Atmospheric Spatial Mesh & Radial Cyber Light */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_50%_35%,rgba(0,245,155,0.09),transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_60%,rgba(99,102,241,0.06),transparent_80%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00f59b08_1px,transparent_1px),linear-gradient(to_bottom,#00f59b08_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_75%_75%_at_50%_50%,#000_75%,transparent_100%)]" />

      {/* 2. Floating 3D Spatial Canvas (Reacts to Gyroscopic Tilt) */}
      <motion.div
        animate={{
          rotateX: tilt.x,
          rotateY: tilt.y,
        }}
        transition={{ type: "spring", stiffness: 50, damping: 22 }}
        style={{ transformStyle: "preserve-3d" }}
        className="absolute inset-0 flex items-center justify-center"
      >
        {/* Giant Concentric Orbital Rings */}
        <div
          className="absolute w-[640px] h-[640px] rounded-full border border-emerald-500/20 animate-[spin_60s_linear_infinite]"
          style={{ transform: "translateZ(-140px) rotateX(65deg)" }}
        />
        <div
          className="absolute w-[840px] h-[840px] rounded-full border border-dashed border-mint/15 animate-[spin_90s_linear_infinite_reverse]"
          style={{ transform: "translateZ(-180px) rotateX(65deg)" }}
        />
        <div
          className="absolute w-[1050px] h-[1050px] rounded-full border border-indigo-500/10 animate-[spin_120s_linear_infinite]"
          style={{ transform: "translateZ(-220px) rotateX(65deg)" }}
        />

        {/* Floating Japanese Candlesticks across Z-Space */}
        <div
          className="absolute inset-0 flex items-center justify-around max-w-6xl mx-auto px-6 sm:px-12"
          style={{ transform: "translateZ(-90px)" }}
        >
          {/* Candle Left (Red Dip) */}
          <div className="hidden sm:flex flex-col items-center opacity-35 animate-[pulse_4.5s_ease-in-out_infinite]">
            <div className="w-0.5 h-16 bg-rose-500/50" />
            <div className="w-8 h-28 rounded-md bg-gradient-to-b from-rose-600/35 to-rose-950/50 border border-rose-500/35 shadow-[0_0_20px_rgba(244,63,94,0.25)]" />
            <div className="w-0.5 h-12 bg-rose-500/50" />
          </div>

          {/* Candle Center-Left (Green Accumulation) */}
          <div className="flex flex-col items-center opacity-40 animate-[pulse_3.5s_ease-in-out_infinite]">
            <div className="w-0.5 h-14 bg-emerald-500/50" />
            <div className="w-9 h-36 rounded-md bg-gradient-to-b from-emerald-500/35 to-emerald-950/50 border border-emerald-400/35 shadow-[0_0_25px_rgba(0,245,155,0.25)]" />
            <div className="w-0.5 h-16 bg-emerald-500/50" />
          </div>

          {/* Candle Right (Massive Breakout Green) */}
          <div className="flex flex-col items-center opacity-45 animate-[pulse_5.2s_ease-in-out_infinite]">
            <div className="w-0.5 h-20 bg-mint/60" />
            <div className="w-10 h-44 rounded-md bg-gradient-to-b from-mint/40 to-emerald-900/50 border border-mint/45 shadow-[0_0_35px_rgba(0,245,155,0.35)]" />
            <div className="w-0.5 h-10 bg-mint/60" />
          </div>

          {/* Candle Far Right (Indigo Tech Rally) */}
          <div className="hidden md:flex flex-col items-center opacity-30 animate-[pulse_4s_ease-in-out_infinite]">
            <div className="w-0.5 h-14 bg-indigo-500/50" />
            <div className="w-8 h-32 rounded-md bg-gradient-to-b from-indigo-500/35 to-indigo-950/50 border border-indigo-400/30 shadow-[0_0_25px_rgba(99,102,241,0.25)]" />
            <div className="w-0.5 h-12 bg-indigo-500/50" />
          </div>
        </div>

        {/* 3. Orbiting 3D Stock Satellites Around the Rupee Vortex */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ transformStyle: "preserve-3d" }}
        >
          {SATELLITES.map((sat, idx) => {
            const rad = (sat.angleDeg * Math.PI) / 180;
            const x = Math.cos(rad) * sat.radiusPx;
            const y = Math.sin(rad) * (sat.radiusPx * 0.45); // Elliptical projection

            return (
              <motion.div
                key={sat.symbol}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: [0.65, 0.95, 0.65],
                  y: [y - 6, y + 6, y - 6],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 4 + idx * 0.6,
                  ease: "easeInOut",
                }}
                style={{
                  transform: `translateX(${x}px) translateY(${y}px) translateZ(${sat.depthZ}px)`,
                  transformStyle: "preserve-3d",
                }}
                className="absolute hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#09140e]/85 border border-mint/30 shadow-[0_8px_20px_rgba(0,0,0,0.7),0_0_15px_rgba(0,245,155,0.15)] backdrop-blur-md whitespace-nowrap"
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    sat.isUp ? "bg-mint shadow-[0_0_8px_#00f59b]" : "bg-rose-500 shadow-[0_0_8px_#f43f5e]"
                  }`}
                />
                <span className="text-[11px] font-mono font-black text-white">{sat.symbol}</span>
                <span className="text-[10px] font-mono text-slate-300">{sat.price}</span>
                <span
                  className={`text-[10px] font-mono font-bold flex items-center gap-0.5 ${
                    sat.isUp ? "text-mint" : "text-rose-400"
                  }`}
                >
                  {sat.isUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                  {sat.change}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* 4. Centerpiece: Giant Rotating Metallic 3D Rupee Gravitational Vortex */}
        <div
          className={`relative transition-transform duration-700 ${opacityClass}`}
          style={{ transform: "translateZ(-40px)" }}
        >
          {/* Ambient Glow Aura */}
          <div className="absolute -inset-28 rounded-full bg-gradient-to-tr from-mint/25 via-emerald-500/15 to-indigo-600/15 blur-3xl pointer-events-none" />

          {/* Orbiting 3D Coin Mesh */}
          <div
            className="w-72 h-72 sm:w-96 sm:h-96 rounded-full relative flex items-center justify-center animate-[spin_28s_linear_infinite] hover:animate-[spin_10s_linear_infinite]"
            style={{
              transformStyle: "preserve-3d",
              boxShadow: "0 0 110px rgba(0,245,155,0.28), inset 0 0 45px rgba(0,245,155,0.2)",
            }}
          >
            {/* Coin Rim Layers */}
            <div className="absolute inset-0 rounded-full border-4 border-mint/30 [transform:translateZ(-18px)]" />
            <div className="absolute inset-0 rounded-full border-2 border-emerald-400/40 [transform:translateZ(-10px)]" />
            <div className="absolute inset-0 rounded-full border-4 border-mint/55 [transform:translateZ(0px)]" />
            <div className="absolute inset-0 rounded-full border-2 border-emerald-300/45 [transform:translateZ(10px)]" />
            <div className="absolute inset-0 rounded-full border-4 border-mint/70 [transform:translateZ(18px)]" />

            {/* Embossed Huge Rupee Symbol */}
            <div
              className="absolute inset-2 rounded-full flex flex-col items-center justify-center text-center"
              style={{
                transform: "translateZ(24px)",
                background:
                  "radial-gradient(circle at 35% 30%, rgba(0,245,155,0.22) 0%, rgba(5,150,105,0.14) 50%, rgba(2,44,34,0.35) 100%)",
              }}
            >
              <span
                className="text-8xl sm:text-9xl font-black font-mono leading-none text-transparent bg-clip-text bg-gradient-to-b from-white via-emerald-100 to-mint/75"
                style={{
                  filter: "drop-shadow(0 0 35px rgba(0,245,155,0.65)) drop-shadow(0 4px 14px rgba(0,0,0,0.95))",
                }}
              >
                ₹
              </span>
              <span className="text-[11px] font-mono tracking-[0.35em] text-emerald-300/85 font-black uppercase mt-1">
                DALAL STREET
              </span>
              <span className="text-[9px] font-mono text-emerald-400/60 tracking-widest">
                VIRTUAL CAPITAL • ₹10,00,000
              </span>
            </div>
          </div>
        </div>

      </motion.div>
    </div>
  );
};
