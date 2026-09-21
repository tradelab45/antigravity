"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

export interface TabItem {
  title: string;
  icon: LucideIcon;
  badge?: string | number;
  type?: "tab";
}

export interface SeparatorItem {
  type: "separator";
  title?: never;
  icon?: never;
  badge?: never;
}

export type Tab = TabItem | SeparatorItem;

export interface ExpandableTabsProps {
  tabs: Tab[];
  className?: string;
  activeColor?: string;
  onChange?: (index: number | null) => void;
  defaultSelected?: number | null;
  autoCollapseOnOutsideClick?: boolean;
  themeMode?: "light" | "dark" | "auto";
}

export const ExpandableTabs: React.FC<ExpandableTabsProps> = ({
  tabs,
  className,
  activeColor = "text-emerald-600 dark:text-[#00f59b]",
  onChange,
  defaultSelected = null,
  autoCollapseOnOutsideClick = true,
  themeMode = "auto",
}) => {
  const [selected, setSelected] = useState<number | null>(defaultSelected);
  const [hovered, setHovered] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync defaultSelected if updated externally
  useEffect(() => {
    if (defaultSelected !== undefined) {
      setSelected(defaultSelected);
    }
  }, [defaultSelected]);

  // Outside click auto-collapsing
  useEffect(() => {
    if (!autoCollapseOnOutsideClick) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setHovered(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [autoCollapseOnOutsideClick]);

  const handleSelect = (index: number) => {
    setSelected(index);
    onChange?.(index);
  };

  const isLight = themeMode === "light";
  const isDark = themeMode === "dark";

  return (
    <div
      ref={containerRef}
      className={cn(
        "inline-flex items-center gap-1.5 p-1.5 rounded-2xl border transition-colors isolate",
        // High contrast for the white app: dark slate text on light backgrounds
        isLight
          ? "bg-slate-100/90 border-slate-200 shadow-2xs"
          : isDark
          ? "bg-[#0c1410]/90 border-white/10 shadow-lg"
          : "bg-slate-100/90 dark:bg-[#0c1410]/90 border-slate-200 dark:border-white/10 shadow-2xs",
        className
      )}
    >
      {tabs.map((tab, idx) => {
        if (tab.type === "separator") {
          return (
            <div
              key={`sep-${idx}`}
              className="w-[1px] h-5 bg-slate-300 dark:bg-white/15 mx-1"
              aria-hidden="true"
            />
          );
        }

        const isSelected = selected === idx;
        const isHovered = hovered === idx;
        const isExpanded = isSelected || isHovered;
        const Icon = tab.icon;

        return (
          <motion.button
            key={tab.title}
            type="button"
            onClick={() => handleSelect(idx)}
            onMouseEnter={() => setHovered(idx)}
            onMouseLeave={() => setHovered(null)}
            className={cn(
              "relative flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer select-none outline-none",
              isSelected
                ? "bg-[#00f59b] text-slate-950 shadow-[0_0_15px_rgba(0,245,155,0.45)]"
                : "text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-white/80 dark:hover:bg-white/10"
            )}
            layout
            transition={{ type: "spring", stiffness: 450, damping: 32 }}
          >
            <Icon className={cn("w-4 h-4 shrink-0 transition-transform duration-200", isExpanded && !isSelected && activeColor)} />

            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.span
                  initial={{ width: 0, opacity: 0, scale: 0.95 }}
                  animate={{ width: "auto", opacity: 1, scale: 1 }}
                  exit={{ width: 0, opacity: 0, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                  className="whitespace-nowrap overflow-hidden font-black text-xs"
                >
                  {tab.title}
                </motion.span>
              )}
            </AnimatePresence>

            {tab.badge !== undefined && (
              <span className={cn(
                "px-1.5 py-0.5 text-[9px] rounded-md font-mono font-bold",
                isSelected
                  ? "bg-slate-950/25 text-slate-950"
                  : "bg-slate-200 dark:bg-white/15 text-slate-800 dark:text-[#00f59b]"
              )}>
                {tab.badge}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
};
