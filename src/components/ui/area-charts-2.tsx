import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { formatINR, formatIndianShort, formatPercent } from '../../utils/formatters';

// Re-exported so existing imports keep working. New code should import it
// from './share-box-area-chart' directly, which avoids pulling in Recharts.
export { ShareBoxAreaChart, type ShareBoxAreaChartProps } from './share-box-area-chart';

export interface GrowthDataPoint {
  year: string | number;
  wealth: number;
  invested: number;
  realValue?: number;
  multiplier?: number;
}

export interface GrowthSnowballAreaChartProps {
  data: GrowthDataPoint[];
  adjustInflation?: boolean;
  multiplier?: number | string;
  height?: number;
}

export const GrowthSnowballAreaChart: React.FC<GrowthSnowballAreaChartProps> = ({
  data,
  adjustInflation = false,
  multiplier = '1.0',
  height = 320,
}) => {
  return (
    <div className="rr-terminal-card relative w-full rounded-3xl border p-5 sm:p-6 overflow-hidden">
      {/* Specular Top Glow & Radial Wash */}
      <div className="rr-terminal-bevel absolute inset-x-0 top-0 h-[1.5px] pointer-events-none" />
      <div className="rr-terminal-wash pointer-events-none absolute inset-0" />

      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4 mb-4 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-mint animate-ping" />
            <h4 className="text-sm sm:text-base font-black text-white font-mono tracking-tight">
              Exponential Wealth Snowball Curve
            </h4>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Accumulated compound gains expanding exponentially beyond invested capital.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-mint bg-mint/15 px-3 py-1 rounded-xl border border-mint/30 font-mono shadow-xs">
            ⚡ {multiplier}x Wealth Multiplier
          </span>
        </div>
      </div>

      {/* Area Chart Container */}
      <div className="w-full relative z-10" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="growthWealthGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00f59b" stopOpacity={0.45} />
                <stop offset="50%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#00f59b" stopOpacity={0.0} />
              </linearGradient>

              <linearGradient id="growthInvestGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0.0} />
              </linearGradient>

              <linearGradient id="growthInflationGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.07)" vertical={false} />
            
            <XAxis 
              dataKey="year" 
              stroke="#64748b" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false} 
              tick={{ fill: '#94a3b8' }} 
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false} 
              tick={{ fill: '#94a3b8' }} 
              tickFormatter={(val) => formatIndianShort(val)} 
            />

            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const wealth = (payload.find(p => p.dataKey === 'wealth')?.value as number) || 0;
                const invested = (payload.find(p => p.dataKey === 'invested')?.value as number) || 0;
                const realVal = payload.find(p => p.dataKey === 'realValue')?.value as number;
                const gains = Math.max(0, wealth - invested);

                return (
                  <div className="rounded-2xl bg-slate-950/95 backdrop-blur-xl border border-white/20 p-3.5 shadow-2xl text-xs font-mono min-w-[210px]">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
                      <span className="text-slate-400 font-bold">{label}</span>
                      <span className="text-[10px] text-mint bg-mint/20 px-2 py-0.5 rounded-md font-extrabold">
                        +₹{formatIndianShort(gains)} Gains
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-mint" />
                          Maturity Wealth:
                        </span>
                        <span className="font-extrabold text-mint">{formatINR(wealth, false)}</span>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-indigo-500" />
                          Invested Principal:
                        </span>
                        <span className="font-bold text-indigo-300">{formatINR(invested, false)}</span>
                      </div>

                      {realVal !== undefined && (
                        <div className="flex items-center justify-between gap-4 pt-1 border-t border-white/10">
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            Real Value (Adj):
                          </span>
                          <span className="font-bold text-amber-300">{formatINR(realVal, false)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }}
            />

            <Area 
              type="natural" 
              dataKey="wealth" 
              name="Maturity Corpus" 
              stroke="#00f59b" 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#growthWealthGradient)" 
              activeDot={{ r: 6, fill: '#00f59b', stroke: '#ffffff', strokeWidth: 2 }} 
            />

            <Area 
              type="natural" 
              dataKey="invested" 
              name="Invested Principal" 
              stroke="#6366f1" 
              strokeWidth={2} 
              fillOpacity={1} 
              fill="url(#growthInvestGradient)" 
              activeDot={{ r: 5, fill: '#6366f1', stroke: '#ffffff', strokeWidth: 2 }} 
            />

            {adjustInflation && (
              <Area 
                type="natural" 
                dataKey="realValue" 
                name="Purchasing Power" 
                stroke="#f59e0b" 
                strokeWidth={2} 
                strokeDasharray="4 4" 
                fillOpacity={1} 
                fill="url(#growthInflationGradient)" 
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-slate-400 pt-4 border-t border-white/10 mt-3 font-mono">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-mint shadow-[0_0_8px_#00f59b]" />
          <span className="font-bold text-white">Maturity Corpus</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-indigo-500" />
          <span>Invested Principal</span>
        </div>
        {adjustInflation && (
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-b-2 border-dashed border-amber-400" />
            <span className="text-amber-400">Inflation Adjusted (Real)</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 3. PORTFOLIO EQUITY TREND AREA CHART
// Upgrades LineChart in PortfolioView.tsx
// ==========================================
export interface PortfolioTrendDataPoint {
  timeLabel: string;
  portfolioValue: number;
}

export interface PortfolioEquityAreaChartProps {
  data: PortfolioTrendDataPoint[];
  height?: number;
}

export const PortfolioEquityAreaChart: React.FC<PortfolioEquityAreaChartProps> = ({
  data,
  height = 260,
}) => {
  const values = data.map(d => d.portfolioValue);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const firstVal = values[0] || 0;
  const latestVal = values[values.length - 1] || 0;
  const isNetPositive = latestVal >= firstVal;

  const strokeColor = isNetPositive ? '#00f59b' : '#f43f5e';

  return (
    <div className="rr-terminal-card relative w-full rounded-2xl border p-4 overflow-hidden">
      {/* Top Specular Sheen */}
      <div className="rr-terminal-bevel absolute inset-x-0 top-0 h-[1.5px] pointer-events-none" />

      <div className="h-full w-full" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="portfolioEquityGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity={0.35} />
                <stop offset="60%" stopColor={strokeColor} stopOpacity={0.1} />
                <stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" vertical={false} />
            
            <XAxis 
              dataKey="timeLabel" 
              stroke="#64748B" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false} 
              minTickGap={24} 
              tick={{ fill: '#94a3b8' }} 
            />
            <YAxis 
              domain={[minVal - (maxVal - minVal) * 0.08, maxVal + (maxVal - minVal) * 0.08]} 
              stroke="#64748B" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false} 
              tick={{ fill: '#94a3b8' }} 
              tickFormatter={(val) => formatIndianShort(val)} 
            />

            {/* Peak High Water Mark Reference Line */}
            {maxVal > minVal && (
              <ReferenceLine 
                y={maxVal} 
                stroke="rgba(255, 255, 255, 0.2)" 
                strokeDasharray="3 3" 
                label={{ 
                  value: 'Peak ₹' + formatIndianShort(maxVal), 
                  fill: '#94a3b8', 
                  fontSize: 9, 
                  position: 'insideTopRight' 
                }} 
              />
            )}

            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const current = payload[0].value as number;
                const change = current - firstVal;
                const pct = firstVal > 0 ? (change / firstVal) * 100 : 0;

                return (
                  <div className="rounded-xl bg-slate-950/95 backdrop-blur-xl border border-white/20 p-3 shadow-xl text-xs font-mono">
                    <p className="text-slate-400 mb-1">{label}</p>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-white text-sm">{formatINR(current)}</span>
                      <span className={'text-[10px] px-1.5 py-0.5 rounded font-extrabold ' + (change >= 0 ? 'text-mint bg-emerald-500/20' : 'text-rose-400 bg-rose-500/20')}>
                        {change >= 0 ? '+' : ''}{formatPercent(pct)}
                      </span>
                    </div>
                  </div>
                );
              }}
            />

            <Area 
              type="natural" 
              dataKey="portfolioValue" 
              stroke={strokeColor} 
              strokeWidth={2.8} 
              fillOpacity={1} 
              fill="url(#portfolioEquityGrad)" 
              activeDot={{ r: 6, fill: strokeColor, stroke: '#ffffff', strokeWidth: 2 }} 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
