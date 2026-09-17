"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { TrendingUp, TrendingDown, ArrowRight, Sparkles, ExternalLink } from "lucide-react";
import { cn } from "../../lib/utils";
import { ShareBoxAreaChart } from "./area-charts-2";

export interface StackCardItem {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeType?: "positive" | "negative" | "neutral" | "highlight";
  value?: string;
  change?: string;
  isPositive?: boolean;
  description?: string;
  icon?: React.ReactNode;
  bgGradient?: string;
  accentColor?: string;
  symbol?: string;
  numericPrice?: number;
  numericChange?: number;
  numericChangePercent?: number;
}

export interface StackSpreadProps {
  items: StackCardItem[];
  title?: string;
  subtitle?: string;
  onCardClick?: (item: StackCardItem) => void;
  className?: string;
  spreadDistance?: number;
  spreadAngle?: number;
}

export const StackSpread: React.FC<StackSpreadProps> = ({
  items,
  title,
  subtitle,
  onCardClick,
  className,
  spreadDistance = 75,
  spreadAngle = 6,
}) => {
  const [isSpread, setIsSpread] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Default display up to 4 cards in stack
  const displayItems = items.slice(0, 4);

  return (
    <div className={cn("flex flex-col items-center select-none", className)}>
      {(title || subtitle) && (
        <div className="mb-4 text-center">
          {title && (
            <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              {title}
            </h4>
          )}
          {subtitle && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Interactive Container */}
      <div
        className="relative h-64 w-full max-w-sm flex items-center justify-center cursor-pointer py-4"
        onMouseEnter={() => setIsSpread(true)}
        onMouseLeave={() => {
          setIsSpread(false);
          setHoveredIndex(null);
        }}
        onClick={() => setIsSpread(!isSpread)}
      >
        <div className="relative w-72 h-44">
          {displayItems.map((item, index) => {
            const count = displayItems.length;
            const mid = (count - 1) / 2;
            const offset = index - mid;

            // When spread, distribute horizontally with slight tilt
            const targetX = isSpread ? offset * spreadDistance : offset * 6;
            const targetY = isSpread ? Math.abs(offset) * 6 : index * 4;
            const targetRotate = isSpread ? offset * spreadAngle : offset * 2.5;
            const targetScale = isSpread
              ? hoveredIndex === index ? 1.05 : 1
              : 1 - Math.abs(offset) * 0.04;
            const zIndex = hoveredIndex === index ? 40 : count - index;

            return (
              <motion.div
                key={item.id}
                className={cn(
                  "absolute inset-0 rounded-3xl p-4 shadow-xl border transition-colors flex flex-col justify-between overflow-hidden",
                  "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700",
                  hoveredIndex === index
                    ? "ring-2 ring-emerald-500/80 shadow-2xl"
                    : "hover:border-slate-400 dark:hover:border-slate-600"
                )}
                style={{
                  zIndex,
                  transformOrigin: "bottom center",
                }}
                animate={{
                  x: targetX,
                  y: targetY,
                  rotate: targetRotate,
                  scale: targetScale,
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 24,
                }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  onCardClick?.(item);
                }}
              >
                {/* Background decorative tint */}
                <div
                  className="absolute inset-0 opacity-15 pointer-events-none"
                  style={{
                    background: item.bgGradient || "radial-gradient(circle at top right, #00f59b, transparent)",
                  }}
                />

                {/* Top: Badges & Icon */}
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-1.5">
                    {item.icon && <span className="text-base">{item.icon}</span>}
                    <div>
                      <h5 className="font-black text-sm text-slate-900 dark:text-white leading-tight">
                        {item.title}
                      </h5>
                      {item.subtitle && (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">
                          {item.subtitle}
                        </span>
                      )}
                    </div>
                  </div>

                  {item.badge && (
                    <span
                      className={cn(
                        "text-[10px] font-black px-2 py-0.5 rounded-full border font-mono",
                        item.badgeType === "positive" && "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
                        item.badgeType === "negative" && "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800",
                        item.badgeType === "highlight" && "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
                        (!item.badgeType || item.badgeType === "neutral") && "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>

                {/* Middle: Price / Metrics */}
                <div className="relative z-10 my-1">
                  {item.value && (
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-xl font-black text-slate-950 dark:text-white">
                        {item.value}
                      </span>
                      {item.change && (
                        <span
                          className={cn(
                            "text-xs font-bold font-mono flex items-center gap-0.5",
                            item.isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                          )}
                        >
                          {item.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {item.change}
                        </span>
                      )}
                    </div>
                  )}
                  {item.symbol && item.numericPrice && (
                    <div className="my-0.5">
                      <ShareBoxAreaChart
                        symbol={item.symbol}
                        price={item.numericPrice}
                        change={item.numericChange ?? 0}
                        changePercent={item.numericChangePercent ?? 0}
                        height={26}
                        showLabels={false}
                        showTimeframes={false}
                        showVolumeBars={false}
                      />
                    </div>
                  )}
                  {item.description && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 mt-1 leading-snug font-medium">
                      {item.description}
                    </p>
                  )}
                </div>

                {/* Bottom: Action link */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] relative z-10 font-bold text-slate-500 dark:text-slate-400">
                  <span>Click to view analysis</span>
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                    <span>Trade</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono text-center">
        {isSpread ? "Hover individual cards to inspect" : "Hover or tap deck to fan out"}
      </p>
    </div>
  );
};
