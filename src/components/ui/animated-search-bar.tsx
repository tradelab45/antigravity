"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../lib/utils";

export interface SearchSuggestion {
  symbol: string;
  name: string;
  price?: number;
  changePercent?: number;
  sector?: string;
}

export interface AnimatedSearchBarProps {
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  onClear?: () => void;
  onSelectSuggestion?: (item: SearchSuggestion) => void;
  placeholders?: string[];
  suggestions?: SearchSuggestion[];
  className?: string;
  inputClassName?: string;
  autoFocus?: boolean;
  enableShortcut?: boolean;
  shortcutKey?: string;
  themeMode?: "light" | "dark" | "auto";
  collapsible?: boolean;
  collapsedWidth?: number | string;
  expandedWidth?: number | string;
}

const DEFAULT_PLACEHOLDERS = [
  "Search companies by brand (Maggi, Bullet 350, Zudio)...",
  "Search bluechips (Reliance, TCS, HDFC Bank, Infosys)...",
  "Search sectors (IT, Banking, Automotive & EV, Defence)...",
  "Search indices (Nifty 50, Sensex 30, Nifty Bank)...",
  "Press / to focus search instantly...",
];

export const AnimatedSearchBar: React.FC<AnimatedSearchBarProps> = ({
  value: controlledValue,
  onChange,
  onSubmit,
  onClear,
  onSelectSuggestion,
  placeholders = DEFAULT_PLACEHOLDERS,
  suggestions = [],
  className,
  inputClassName,
  autoFocus = false,
  enableShortcut = true,
  shortcutKey = "/",
  themeMode = "auto",
  collapsible = true,
  collapsedWidth = 190,
  expandedWidth = "100%",
}) => {
  const [internalValue, setInternalValue] = useState("");
  const isControlled = controlledValue !== undefined;
  const query = isControlled ? (controlledValue || "") : internalValue;

  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [mouseCoord, setMouseCoord] = useState({ x: 0, y: 0 });

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // When collapsible: expand if focused OR if non-empty query; otherwise compress into liquid glass pill
  const isExpanded = !collapsible || isFocused || Boolean(query && query.trim().length > 0);

  // Cycle through placeholders every 3.2s
  useEffect(() => {
    if (placeholders.length <= 1) return;
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [placeholders.length]);

  // Global keyboard shortcut trigger ('/' or 'cmd+k')
  useEffect(() => {
    if (!enableShortcut) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        if (target === inputRef.current && e.key === "Escape") {
          inputRef.current?.blur();
          setIsFocused(false);
        }
        return;
      }

      if (e.key === shortcutKey || (e.key === "k" && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        setIsFocused(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enableShortcut, shortcutKey]);

  // Outside click closes focus & collapses when query is empty
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePointerMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMouseCoord({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!isControlled) setInternalValue(val);
    onChange?.(val);
  };

  const handleClear = () => {
    if (!isControlled) setInternalValue("");
    onChange?.("");
    onClear?.();
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSubmit?.(query);
    } else if (e.key === "Escape") {
      inputRef.current?.blur();
      setIsFocused(false);
    }
  };

  const handleContainerClick = () => {
    if (!isExpanded) {
      setIsFocused(true);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  };

  // Filter matching suggestions
  const matchingSuggestions =
    query.trim().length > 0 && suggestions.length > 0
      ? suggestions
          .filter(
            (s) =>
              s.symbol.toLowerCase().includes(query.toLowerCase()) ||
              s.name.toLowerCase().includes(query.toLowerCase())
          )
          .slice(0, 5)
      : [];

  const isLight = themeMode === "light";
  const isDark = themeMode === "dark";

  return (
    <div
      ref={containerRef}
      onMouseMove={handlePointerMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn("relative transition-all duration-300", className)}
      style={{
        width: isExpanded ? expandedWidth : collapsedWidth,
        maxWidth: "100%",
      }}
    >
      {/* Liquid Glass Outer Shell */}
      <motion.div
        layout
        onClick={handleContainerClick}
        initial={false}
        animate={{
          scale: isFocused ? 1.01 : isHovered ? 1.015 : 1,
          boxShadow: isFocused
            ? "0 0 0 2px rgba(0, 245, 155, 0.55), 0 14px 35px -5px rgba(0, 245, 155, 0.22), inset 0 1.5px 1.5px rgba(255, 255, 255, 0.85)"
            : isHovered
            ? "0 8px 25px -4px rgba(0, 245, 155, 0.18), inset 0 1px 1px rgba(255, 255, 255, 0.7)"
            : "0 4px 18px -2px rgba(0, 0, 0, 0.06), inset 0 1px 1px rgba(255, 255, 255, 0.5)",
        }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        className={cn(
          "relative flex items-center h-11 rounded-2xl overflow-hidden cursor-pointer select-none transition-all duration-200",
          // Liquid Glass Frosted Aesthetic
          "backdrop-blur-2xl border",
          isLight
            ? "bg-gradient-to-r from-white/90 via-white/80 to-slate-50/90 border-white/70 text-slate-900 shadow-sm"
            : isDark
            ? "bg-gradient-to-r from-[#040906]/90 via-[#0a150e]/85 to-[#050c07]/90 border-white/15 text-white shadow-xl"
            : "bg-gradient-to-r from-white/90 via-white/80 to-slate-50/90 dark:from-[#040906]/90 dark:via-[#0a150e]/85 dark:to-[#050c07]/90 border-white/70 dark:border-white/15 text-slate-900 dark:text-white",
          isFocused
            ? "border-mint ring-1 ring-mint/40 cursor-text"
            : "hover:border-mint/50 hover:ring-1 hover:ring-mint/30"
        )}
      >
        {/* Liquid Glass Specular Reflection Highlight (top edge bevel) */}
        <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/80 dark:via-white/40 to-transparent pointer-events-none" />

        {/* Dynamic Specular Point-Light following pointer across the liquid glass */}
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(130px circle at ${mouseCoord.x}px ${mouseCoord.y}px, rgba(0, 245, 155, 0.16), transparent 70%)`,
          }}
        />

        {/* Left Search Icon with animated pulse & liquid glow */}
        <div className="pl-3.5 pr-2 flex items-center justify-center shrink-0">
          <motion.div
            animate={{
              scale: isFocused ? 1.15 : isHovered ? 1.08 : 1,
              rotate: isFocused ? 90 : 0,
            }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="relative"
          >
            <Search className="w-4 h-4 text-emerald-600 dark:text-mint" />
            {/* Ambient liquid glow behind icon */}
            <span className="absolute inset-0 rounded-full bg-mint/25 blur-sm -z-10" />
          </motion.div>
        </div>

        {/* Compressed Pill Label or Expanded Active Input Field */}
        <div className="relative flex-1 flex items-center min-w-0 py-2 h-full">
          {isExpanded ? (
            <>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                autoFocus={autoFocus}
                aria-label="Search Dalal Street companies and shares"
                className={cn(
                  "w-full bg-transparent text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white placeholder-transparent focus:outline-none pr-8 cursor-text",
                  inputClassName
                )}
              />

              {/* Animated Rotating Placeholder when empty */}
              {!query && (
                <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none overflow-hidden select-none pr-8">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={placeholderIndex}
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -10, opacity: 0 }}
                      transition={{ duration: 0.28, ease: "easeInOut" }}
                      className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold truncate"
                    >
                      {placeholders[placeholderIndex]}
                    </motion.span>
                  </AnimatePresence>
                </div>
              )}
            </>
          ) : (
            /* Compressed capsule state: inviting liquid glass label */
            <div className="flex items-center gap-1.5 w-full overflow-hidden">
              <span className="text-xs font-black text-slate-800 dark:text-white truncate">
                Search
              </span>
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 truncate hidden sm:inline">
                shares...
              </span>
            </div>
          )}
        </div>

        {/* Right Action Icons: Clear (X) or Liquid Glass Shortcut Chip */}
        <div className="pr-3 flex items-center gap-1.5 shrink-0">
          {query && isExpanded ? (
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </motion.button>
          ) : (
            enableShortcut && (
              <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-black text-slate-700 dark:text-slate-300 bg-white/70 dark:bg-white/10 border border-slate-200/80 dark:border-white/15 rounded-md shadow-2xs pointer-events-none">
                <span>{shortcutKey}</span>
              </kbd>
            )
          )}
        </div>

        {/* Bottom liquid meniscus accent bar on focus */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-mint to-transparent pointer-events-none"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: isFocused ? 1 : 0, scaleX: isFocused ? 1 : 0 }}
          transition={{ duration: 0.25 }}
        />
      </motion.div>

      {/* Autocomplete Suggestions Dropdown with Liquid Glass Design */}
      <AnimatePresence>
        {isFocused && matchingSuggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="absolute left-0 right-0 top-full mt-2 backdrop-blur-2xl bg-white/95 dark:bg-[#060e0a]/95 border border-white/60 dark:border-white/15 rounded-2xl shadow-2xl overflow-hidden z-50 text-left p-1.5 space-y-0.5"
          >
            <div className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-500" />
                <span>Matching Dalal Street Equities</span>
              </span>
              <span className="text-emerald-600 dark:text-mint font-mono">Live NSE</span>
            </div>
            {matchingSuggestions.map((item) => (
              <button
                key={item.symbol}
                type="button"
                onClick={() => {
                  onSelectSuggestion?.(item);
                  setIsFocused(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-emerald-500/10 dark:hover:bg-white/10 transition-colors cursor-pointer group"
              >
                <div>
                  <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className="group-hover:text-emerald-600 dark:group-hover:text-mint transition-colors">
                      {item.symbol}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal font-sans">
                      ({item.name})
                    </span>
                  </div>
                  {item.sector && (
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {item.sector}
                    </div>
                  )}
                </div>
                {item.price !== undefined && (
                  <div className="text-right font-mono">
                    <div className="text-xs font-black text-slate-900 dark:text-white">
                      ₹{item.price.toFixed(2)}
                    </div>
                    {item.changePercent !== undefined && (
                      <div
                        className={cn(
                          "text-[10px] font-bold",
                          item.changePercent >= 0
                            ? "text-emerald-600 dark:text-mint"
                            : "text-rose-600"
                        )}
                      >
                        {item.changePercent >= 0 ? "+" : ""}
                        {item.changePercent.toFixed(2)}%
                      </div>
                    )}
                  </div>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
