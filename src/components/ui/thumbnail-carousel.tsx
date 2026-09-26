"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, Play, Pause, ArrowRight, Sparkles, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "../../lib/utils";

export interface CarouselSlideItem {
  id: string;
  title: string;
  subtitle?: string;
  tag?: string;
  description: string;
  badge?: string;
  badgeType?: "positive" | "negative" | "neutral" | "highlight";
  stats?: { label: string; value: string; isPositive?: boolean }[];
  icon?: React.ReactNode;
  bgGradient?: string;
  accentColor?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export type CarouselSlide = CarouselSlideItem;

export interface ThumbnailCarouselProps {
  items?: CarouselSlideItem[];
  slides?: CarouselSlideItem[];
  autoplayInterval?: number;
  autoPlayInterval?: number;
  autoPlay?: boolean;
  className?: string;
  onSlideChange?: (index: number) => void;
}

export const ThumbnailCarousel: React.FC<ThumbnailCarouselProps> = ({
  items,
  slides,
  autoplayInterval = 4500,
  autoPlayInterval,
  autoPlay: initialAutoPlay = true,
  className,
  onSlideChange,
}) => {
  const activeList = items || slides || [];
  const effectiveInterval = autoPlayInterval || autoplayInterval;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isPlaying, setIsPlaying] = useState(initialAutoPlay);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => {
      const count = activeList.length || 1;
      const next = (prev + 1) % count;
      onSlideChange?.(next);
      return next;
    });
  }, [activeList.length, onSlideChange]);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => {
      const count = activeList.length || 1;
      const next = (prev - 1 + count) % count;
      onSlideChange?.(next);
      return next;
    });
  }, [activeList.length, onSlideChange]);

  const goToSlide = (idx: number) => {
    setDirection(idx > currentIndex ? 1 : -1);
    setCurrentIndex(idx);
    onSlideChange?.(idx);
  };

  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(nextSlide, effectiveInterval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, nextSlide, effectiveInterval]);

  const currentItem = activeList[currentIndex] || activeList[0];
  if (!currentItem) return null;

  return (
    <div className={cn("flex flex-col gap-4 w-full select-none", className)}>
      {/* Main Display Stage with Polymo Specular Card Treatment */}
      <div className="relative w-full overflow-hidden rounded-3xl border border-slate-200/90 dark:border-white/15 bg-white/95 dark:bg-[#071018]/95 backdrop-blur-2xl shadow-xl shadow-slate-900/5 dark:shadow-black/60 transition-all p-6 sm:p-7 min-h-[220px] flex flex-col justify-between">
        {/* Specular Bevel Sheen */}
        <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-mint/60 to-transparent pointer-events-none" />

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentItem.id}
            custom={direction}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -direction * 40 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="flex flex-col md:flex-row md:items-center justify-between gap-6"
          >
            {/* Left Content Area */}
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                {currentItem.tag && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-mint border border-emerald-500/30">
                    {currentItem.tag}
                  </span>
                )}
                {currentItem.badge && (
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black border",
                    currentItem.badgeType === "positive" ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700" :
                    currentItem.badgeType === "negative" ? "bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700" :
                    "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700"
                  )}>
                    {currentItem.badge}
                  </span>
                )}
                <span className="text-xs text-slate-400 font-mono font-bold">
                  {currentIndex + 1} / {activeList.length}
                </span>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  {currentItem.title}
                </h3>
                {currentItem.subtitle && (
                  <p className="text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                    {currentItem.subtitle}
                  </p>
                )}
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium max-w-2xl">
                {currentItem.description}
              </p>

              {/* Action Button */}
              {currentItem.actionLabel && (
                <div className="pt-2">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={currentItem.onAction}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-black shadow-md shadow-indigo-500/25 transition-all cursor-pointer"
                  >
                    <span>{currentItem.actionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </motion.button>
                </div>
              )}
            </div>

            {/* Right Metrics / Stats Card */}
            {currentItem.stats && currentItem.stats.length > 0 && (
              <div className="grid grid-cols-2 gap-2.5 p-4 rounded-2xl bg-slate-50/80 dark:bg-black/40 border border-slate-200/80 dark:border-white/10 shrink-0 min-w-[220px]">
                {currentItem.stats.map((st, i) => (
                  <div key={i} className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">
                      {st.label}
                    </span>
                    <span className={cn(
                      "font-mono text-sm sm:text-base font-black flex items-center gap-1",
                      st.isPositive !== undefined
                        ? st.isPositive ? "text-emerald-600 dark:text-mint" : "text-rose-600"
                        : "text-slate-900 dark:text-white"
                    )}>
                      {st.isPositive !== undefined && (
                        st.isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />
                      )}
                      {st.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Carousel Floating Controls (Left, Right, Play/Pause) */}
        <div className="flex items-center justify-between mt-5 pt-3 border-t border-slate-100 dark:border-white/10 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prevSlide}
              className="p-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              title="Previous Slide"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              className="p-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              title="Next Slide"
              aria-label="Next slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer flex items-center gap-1.5 text-[11px] font-bold"
              title={isPlaying ? "Pause Autoplay" : "Resume Autoplay"}
            >
              {isPlaying ? <Pause className="w-3 h-3 text-amber-500" /> : <Play className="w-3 h-3 text-emerald-500" />}
              <span className="hidden sm:inline">{isPlaying ? "Autoplay On" : "Paused"}</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {activeList.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goToSlide(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === currentIndex ? 'true' : undefined}
                className="group flex h-6 min-w-6 items-center justify-center px-1 cursor-pointer"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === currentIndex
                      ? "w-6 bg-gradient-to-r from-indigo-600 to-violet-600"
                      : "w-2 bg-slate-200 dark:bg-white/20 group-hover:bg-slate-300"
                  )}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Clickable Thumbnail Rail
          On a phone a two-column grid truncates every title, so the rail
          becomes a single scrolling row of toggles that can show them in full. */}
      <div className="-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1 scrollbar-none sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-2.5 sm:overflow-visible sm:px-0 md:grid-cols-5">
        {activeList.map((item, idx) => {
          const isActive = idx === currentIndex;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => goToSlide(idx)}
              aria-pressed={isActive}
              className={cn(
                "relative flex shrink-0 snap-start flex-col justify-between overflow-hidden rounded-2xl border p-3 text-left transition-all cursor-pointer sm:shrink",
                isActive
                  ? "border-indigo-500 dark:border-mint bg-indigo-50/70 dark:bg-mint/10 shadow-md ring-1 ring-indigo-500/50 dark:ring-mint/40"
                  : "border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10"
              )}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-mono font-black text-slate-500 dark:text-slate-400">
                  0{idx + 1}
                </span>
                {item.badge && (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                    {item.badge}
                  </span>
                )}
              </div>
              <div className="mt-2">
                <div className={cn(
                  "text-xs font-black whitespace-nowrap sm:whitespace-normal sm:truncate",
                  isActive ? "text-indigo-900 dark:text-mint" : "text-slate-900 dark:text-white"
                )}>
                  {item.title}
                </div>
                {item.subtitle && (
                  <div className="mt-0.5 hidden text-[10px] text-slate-500 dark:text-slate-400 sm:block sm:truncate">
                    {item.subtitle}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
