"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Plus, Filter, RotateCcw, Check } from "lucide-react";
import { cn } from "../../lib/utils";

export interface FilterToken {
  id: string;
  field: string;
  operator: "=" | ">" | "<" | "contains";
  value: string;
  label?: string;
}

export interface FilterTokenBarProps {
  tokens: FilterToken[];
  onRemoveToken: (tokenId: string) => void;
  onAddToken?: (token: FilterToken) => void;
  onClearAll?: () => void;
  quickChips?: { label: string; token: FilterToken }[];
  className?: string;
}

export const FilterTokenBar: React.FC<FilterTokenBarProps> = ({
  tokens,
  onRemoveToken,
  onAddToken,
  onClearAll,
  quickChips = [
    { label: "Banking Titans", token: { id: "sec-bank", field: "Sector", operator: "=", value: "Banking" } },
    { label: "P/E < 25", token: { id: "pe-low", field: "P/E", operator: "<", value: "25" } },
    { label: "Top Gainers > 2%", token: { id: "gain-2", field: "Gain", operator: ">", value: "+2%" } },
    { label: "Tech Innovators", token: { id: "sec-it", field: "Sector", operator: "=", value: "IT" } },
  ],
  className,
}) => {
  const activeIds = new Set(tokens.map((t) => t.id));

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs select-none",
        className
      )}
    >
      <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 dark:text-slate-200 pl-1 shrink-0">
        <Filter className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
        <span>Filters:</span>
      </div>

      {/* Active Filter Tokens */}
      <AnimatePresence mode="popLayout">
        {tokens.map((token) => (
          <motion.div
            key={token.id}
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white shadow-2xs font-mono"
          >
            <span className="text-slate-500 dark:text-slate-400">{token.field}</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-black">{token.operator}</span>
            <span>{token.value}</span>
            <button
              onClick={() => onRemoveToken(token.id)}
              aria-label={`Remove filter ${token.field}`}
              className="ml-0.5 flex h-5 w-5 items-center justify-center rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      {tokens.length === 0 && (
        <span className="text-xs text-slate-400 font-medium italic">
          No filters active. Click preset chips below:
        </span>
      )}

      {/* Quick Add Chips */}
      {quickChips && quickChips.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap ml-auto">
          {quickChips.map((chip) => {
            const isSelected = activeIds.has(chip.token.id) || tokens.some(t => t.field === chip.token.field && t.value === chip.token.value);
            return (
              <button
                key={chip.label || chip.token.id}
                onClick={() => {
                  if (isSelected) onRemoveToken(chip.token.id);
                  else onAddToken?.(chip.token);
                }}
                className={cn(
                  "inline-flex min-h-6 items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer",
                  isSelected
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 dark:text-slate-400 dark:border-slate-750"
                )}
              >
                {isSelected ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Plus className="w-2.5 h-2.5 text-slate-400" />}
                <span>{chip.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {tokens.length > 0 && onClearAll && (
        <button
          onClick={onClearAll}
          className="text-[10px] font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-0.5 ml-1 cursor-pointer"
        >
          <RotateCcw className="w-2.5 h-2.5" />
          <span>Clear</span>
        </button>
      )}
    </div>
  );
};
