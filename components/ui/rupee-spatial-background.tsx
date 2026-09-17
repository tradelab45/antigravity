"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

export interface RupeeSpatialBackgroundProps {
  className?: string;
  intensity?: "subtle" | "medium" | "vivid";
  interactive?: boolean;
}

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
        x: -y * 18,
        y: x * 22,
      });
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [interactive]);

  const opacityClass =
    intensity === "subtle"
      ? "opacity-15 dark:opacity-10"
      : intensity === "vivid"
      ? "opacity-45 dark:opacity-35"
      : "opacity-30 dark:opacity-25";

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none z-0 overflow-hidden select-none ${className}`}
      style={{ perspective: "1200px" }}
    >
      {/* 1. Deep Atmospheric Spatial Mesh & Radial Cyber Light */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_50%_40%,rgba(0,245,155,0.08),transparent_70%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00f59b06_1px,transparent_1px),linear-gradient(to_bottom,#00f59b06_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />

      {/* 2. Floating 3D Spatial Canvas (Reacts to Gyroscopic Tilt) */}
      <motion.div
        animate={{
          rotateX: tilt.x,
          rotateY: tilt.y,
        }}
        transition={{ type: "spring", stiffness: 60, damping: 20 }}
        style={{ transformStyle: "preserve-3d" }}
        className="absolute inset-0 flex items-center justify-center"
      >
        {/* Giant Concentric Orbital Rings */}
        <div 
          className="absolute w-[680px] h-[680px] rounded-full border border-emerald-500/15 animate-[spin_60s_linear_infinite]"
          style={{ transform: "translateZ(-120px) rotateX(65deg)" }}
        />
        <div 
          className="absolute w-[860px] h-[860px] rounded-full border border-dashed border-[#00f59b]/10 animate-[spin_90s_linear_infinite_reverse]"
          style={{ transform: "translateZ(-160px) rotateX(65deg)" }}
        />

        {/* Floating Japanese Candlesticks across Z-Space */}
        <div className="absolute inset-0 flex items-center justify-around max-w-5xl mx-auto px-10" style={{ transform: "translateZ(-80px)" }}>
          
          {/* Candle A (Left Red Dip) */}
          <div className="flex flex-col items-center opacity-40 animate-[pulse_4s_ease-in-out_infinite]">
            <div className="w-0.5 h-16 bg-rose-500/40" />
            <div className="w-8 h-28 rounded-md bg-gradient-to-b from-rose-600/30 to-rose-950/40 border border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.2)]" />
            <div className="w-0.5 h-12 bg-rose-500/40" />
          </div>

          {/* Candle B (Green Accumulation) */}
          <div className="flex flex-col items-center opacity-45 animate-[pulse_3.2s_ease-in-out_infinite]">
            <div className="w-0.5 h-14 bg-emerald-500/40" />
            <div className="w-9 h-36 rounded-md bg-gradient-to-b from-emerald-500/30 to-emerald-950/40 border border-emerald-400/30 shadow-[0_0_25px_rgba(0,245,155,0.2)]" />
            <div className="w-0.5 h-16 bg-emerald-500/40" />
          </div>

          {/* Candle C (Right Massive Breakout Bar) */}
          <div className="flex flex-col items-center opacity-50 animate-[pulse_5s_ease-in-out_infinite]">
            <div className="w-0.5 h-20 bg-[#00f59b]/50" />
            <div className="w-10 h-48 rounded-md bg-gradient-to-b from-[#00f59b]/35 to-emerald-900/40 border border-[#00f59b]/40 shadow-[0_0_35px_rgba(0,245,155,0.3)]" />
            <div className="w-0.5 h-10 bg-[#00f59b]/50" />
          </div>

        </div>

        {/* 3. Centerpiece: Giant Rotating Metallic 3D Rupee Watermark Glyph */}
        <div 
          className={`relative transition-transform duration-700 ${opacityClass}`}
          style={{ transform: "translateZ(-40px)" }}
        >
          {/* Ambient Glow Aura */}
          <div className="absolute -inset-24 rounded-full bg-gradient-to-tr from-[#00f59b]/25 via-emerald-500/10 to-transparent blur-3xl pointer-events-none" />

          {/* Orbiting 3D Coin Mesh */}
          <div
            className="w-80 h-80 sm:w-96 sm:h-96 rounded-full relative flex items-center justify-center animate-[spin_24s_linear_infinite] hover:animate-[spin_8s_linear_infinite]"
            style={{
              transformStyle: "preserve-3d",
              boxShadow: "0 0 100px rgba(0,245,155,0.25), inset 0 0 40px rgba(0,245,155,0.2)",
            }}
          >
            {/* Coin Rim Layers */}
            <div className="absolute inset-0 rounded-full border-4 border-[#00f59b]/30 [transform:translateZ(-15px)]" />
            <div className="absolute inset-0 rounded-full border-2 border-emerald-400/40 [transform:translateZ(-8px)]" />
            <div className="absolute inset-0 rounded-full border-4 border-[#00f59b]/50 [transform:translateZ(0px)]" />
            <div className="absolute inset-0 rounded-full border-2 border-emerald-300/40 [transform:translateZ(8px)]" />
            <div className="absolute inset-0 rounded-full border-4 border-[#00f59b]/60 [transform:translateZ(15px)]" />

            {/* Embossed Huge Rupee Symbol */}
            <div
              className="absolute inset-2 rounded-full flex flex-col items-center justify-center text-center"
              style={{
                transform: "translateZ(20px)",
                background: "radial-gradient(circle at 35% 30%, rgba(0,245,155,0.2) 0%, rgba(5,150,105,0.12) 50%, rgba(2,44,34,0.3) 100%)",
              }}
            >
              <span
                className="text-8xl sm:text-9xl font-black font-mono leading-none text-transparent bg-clip-text bg-gradient-to-b from-white via-emerald-100 to-[#00f59b]/70"
                style={{
                  filter: "drop-shadow(0 0 30px rgba(0,245,155,0.6)) drop-shadow(0 4px 12px rgba(0,0,0,0.9))",
                }}
              >
                ₹
              </span>
              <span className="text-[11px] font-mono tracking-[0.35em] text-emerald-300/80 font-black uppercase mt-1">
                DALAL STREET
              </span>
              <span className="text-[9px] font-mono text-emerald-400/50 tracking-widest">
                VIRTUAL CAPITAL • ₹10,00,000
              </span>
            </div>
          </div>
        </div>

      </motion.div>
    </div>
  );
};
