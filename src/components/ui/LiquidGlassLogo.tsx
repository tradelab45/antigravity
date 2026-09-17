"use client";

import React from "react";
import { motion } from "motion/react";
import { TrendingUp } from "lucide-react";

interface LiquidGlassLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  subtitle?: string;
  className?: string;
  onClick?: () => void;
}

export const LiquidGlassLogo: React.FC<LiquidGlassLogoProps> = ({
  size = "md",
  showText = false,
  subtitle,
  className = "",
  onClick,
}) => {
  // Dimension mappings
  const containerSize = {
    sm: "w-9 h-9 rounded-xl",
    md: "w-11 h-11 sm:w-12 sm:h-12 rounded-2xl",
    lg: "w-14 h-14 sm:w-16 sm:h-16 rounded-2xl",
    xl: "w-20 h-20 sm:w-24 sm:h-24 rounded-3xl",
  }[size];

  const glyphSize = {
    sm: "text-lg",
    md: "text-xl sm:text-2xl",
    lg: "text-3xl sm:text-4xl",
    xl: "text-5xl sm:text-6xl",
  }[size];

  const arrowSize = {
    sm: "w-3 h-3 -top-0.5 -right-1 stroke-[3]",
    md: "w-4 h-4 -top-1 -right-2 stroke-[3.5]",
    lg: "w-5 h-5 -top-1.5 -right-2.5 stroke-[3.5]",
    xl: "w-7 h-7 -top-2 -right-3.5 stroke-[4]",
  }[size];

  const innerRadius = {
    sm: "rounded-[10px]",
    md: "rounded-[14px]",
    lg: "rounded-[18px]",
    xl: "rounded-[22px]",
  }[size];

  return (
    <div
      data-testid="liquid-glass-logo"
      onClick={onClick}
      className={`inline-flex items-center gap-3 select-none ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      {/* Liquid Glass Animated Outer Container */}
      <motion.div
        whileHover={{ scale: 1.08, rotate: [0, -2, 2, 0] }}
        whileTap={{ scale: 0.94 }}
        className={`relative ${containerSize} p-[1.5px] overflow-hidden shrink-0 shadow-[0_8px_25px_rgba(99,102,241,0.35),0_0_18px_rgba(0,245,155,0.25)] group`}
      >
        {/* Dynamic Iridescent Perimeter Sweep */}
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-indigo-500 to-[#00f59b] animate-[spin_6s_linear_infinite] opacity-85 blur-[2.5px]" />

        {/* Frosted Multi-Layer Glass Body */}
        <div
          className={`relative w-full h-full ${innerRadius} bg-slate-900/85 backdrop-blur-xl flex items-center justify-center overflow-hidden border border-white/30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5),inset_0_-1px_2px_rgba(0,0,0,0.6)]`}
        >
          {/* Specular Diagonal Light Reflection Sweep */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />

          {/* Center Radial Specular Flare */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.3),transparent_70%)] pointer-events-none" />

          {/* 3D Embossed Rupee & Animated Trending Arrow */}
          <div className="relative z-10 flex items-center justify-center font-black font-mono">
            <span
              className={`${glyphSize} font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-200 to-amber-400 drop-shadow-[0_2px_8px_rgba(251,191,36,0.6)] animate-[pulse_3s_ease-in-out_infinite]`}
            >
              ₹
            </span>
            <motion.div
              animate={{ y: [-1.2, 1.2, -1.2], x: [0, 0.8, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className={`absolute ${arrowSize}`}
            >
              <TrendingUp className="w-full h-full text-[#00f59b] drop-shadow-[0_0_8px_#00f59b]" />
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Brand Text (Optional) */}
      {showText && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Rupee<span className="text-[#00f59b]">Rookie</span>
            </span>
            <span className="bg-[#00f59b]/15 text-[#00f59b] border border-[#00f59b]/35 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
              NSE
            </span>
          </div>
          {subtitle && (
            <p className="text-[11px] sm:text-xs font-semibold text-slate-400 -mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
