"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { TrendingUp, TrendingDown, ArrowUpRight, ShieldCheck, Zap } from "lucide-react";
import { cn } from "../../lib/utils";
import { ShareBoxAreaChart } from "./share-box-area-chart";

export interface ListPreviewItem {
  id: string;
  symbol: string;
  name: string;
  sector: string;
  price: number;
  changePercent: number;
  sparkline?: number[];
  high52?: number;
  low52?: number;
  peRatio?: number;
  marketCapCr?: number;
  summary?: string;
  badge?: string;
}

export interface InteractiveListPreviewProps {
  items: ListPreviewItem[];
  title?: string;
  subtitle?: string;
  onSelectItem?: (item: ListPreviewItem) => void;
  className?: string;
}

export const InteractiveListPreview: React.FC<InteractiveListPreviewProps> = ({
  items,
  title = "Dalal Street Active Watchlist",
  subtitle = "Hover over any company to see real-time preview & metrics",
  onSelectItem,
  className,
}) => {
  const [hoveredItem, setHoveredItem] = useState<ListPreviewItem | null>(items[0] || null);

  return (
    <div
      className={cn(
        "rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm select-none",
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-500" />
            {title}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            {subtitle}
          </p>
        </div>
        <span className="text-[11px] font-mono text-slate-400 font-bold">
          {items.length} Equities
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left column: Interactive list rows */}
        <div className="lg:col-span-7 space-y-1.5">
          {items.map((item) => {
            const isHovered = hoveredItem?.id === item.id;
            const isPositive = item.changePercent >= 0;

            return (
              <motion.div
                key={item.id}
                onMouseEnter={() => setHoveredItem(item)}
                onClick={() => onSelectItem?.(item)}
                whileHover={{ x: 4 }}
                className={cn(
                  "p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3",
                  isHovered
                    ? "bg-slate-900 text-white border-slate-900 dark:bg-slate-800 dark:text-white dark:border-slate-700 shadow-md"
                    : "bg-slate-50/70 hover:bg-slate-100 text-slate-800 border-slate-200/80 dark:bg-slate-850 dark:hover:bg-slate-800 dark:text-slate-200 dark:border-slate-750"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center font-mono font-black text-xs shrink-0 shadow-2xs border",
                      isHovered
                        ? "bg-white/10 text-emerald-300 border-white/20"
                        : "bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700"
                    )}
                  >
                    {item.symbol.slice(0, 3)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h5 className="font-black text-xs truncate leading-tight">
                        {item.symbol}
                      </h5>
                      {item.badge && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-[10px] truncate block font-medium",
                        isHovered ? "text-slate-300" : "text-slate-500 dark:text-slate-400"
                      )}
                    >
                      {item.name} • {item.sector}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono text-xs sm:text-sm font-black block">
                    ₹{item.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-bold font-mono flex items-center justify-end gap-0.5",
                      isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                    )}
                  >
                    {isPositive ? "+" : ""}
                    {item.changePercent.toFixed(2)}%
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Right column: Floating Dynamic Preview Card */}
        <div className="lg:col-span-5 sticky top-24">
          <AnimatePresence mode="wait">
            {hoveredItem && (
              <motion.div
                key={hoveredItem.id}
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -8 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50/50 to-slate-100/70 dark:from-slate-850 dark:via-slate-850 dark:to-slate-800 p-5 shadow-xl flex flex-col justify-between min-h-[300px]"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">
                        {hoveredItem.sector}
                      </span>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight mt-0.5">
                        {hoveredItem.name}
                      </h3>
                      <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        NSE: {hoveredItem.symbol}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-xl font-black text-slate-950 dark:text-white block">
                        ₹{hoveredItem.price.toFixed(2)}
                      </span>
                      <span
                        className={cn(
                          "text-xs font-black font-mono inline-flex items-center gap-0.5",
                          hoveredItem.changePercent >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                        )}
                      >
                        {hoveredItem.changePercent >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {hoveredItem.changePercent >= 0 ? "+" : ""}
                        {hoveredItem.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  {/* 21st.dev @sean0205 Area Chart Sparkline */}
                  <div className="my-3 w-full">
                    <ShareBoxAreaChart
                      symbol={hoveredItem.symbol}
                      price={hoveredItem.price}
                      change={hoveredItem.price * (hoveredItem.changePercent / 100)}
                      changePercent={hoveredItem.changePercent}
                      high52={hoveredItem.high52}
                      low52={hoveredItem.low52}
                      sparklineData={hoveredItem.sparkline}
                      height={58}
                      showLabels={true}
                    />
                  </div>

                  {/* Summary / Description */}
                  {hoveredItem.summary && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                      {hoveredItem.summary}
                    </p>
                  )}

                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-700/60 text-xs">
                    {hoveredItem.high52 && (
                      <div className="p-2 rounded-xl bg-slate-100/60 dark:bg-slate-800">
                        <span className="text-[10px] text-slate-400 font-bold block">52W High</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">₹{hoveredItem.high52}</span>
                      </div>
                    )}
                    {hoveredItem.low52 && (
                      <div className="p-2 rounded-xl bg-slate-100/60 dark:bg-slate-800">
                        <span className="text-[10px] text-slate-400 font-bold block">52W Low</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">₹{hoveredItem.low52}</span>
                      </div>
                    )}
                    {hoveredItem.peRatio && (
                      <div className="p-2 rounded-xl bg-slate-100/60 dark:bg-slate-800">
                        <span className="text-[10px] text-slate-400 font-bold block">P/E Ratio</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{hoveredItem.peRatio}</span>
                      </div>
                    )}
                    {hoveredItem.marketCapCr && (
                      <div className="p-2 rounded-xl bg-slate-100/60 dark:bg-slate-800">
                        <span className="text-[10px] text-slate-400 font-bold block">Market Cap</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">₹{hoveredItem.marketCapCr.toLocaleString("en-IN")} Cr</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom CTA Button */}
                <button
                  onClick={() => onSelectItem?.(hoveredItem)}
                  className="mt-4 w-full py-2.5 rounded-2xl bg-slate-900 hover:bg-black text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <span>Open Full Analysis & Trade</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
