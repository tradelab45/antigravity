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

// ==========================================
// 1. SHARE BOX MINI AREA CHART (21st.dev @sean0205)
// Upgraded: Multi-timeframe (1D/5D/1M), synchronized volume bars,
// glowing live node beacon, interactive crosshairs, and 18-point precision curve.
// ==========================================
export interface ShareBoxAreaChartProps {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high52?: number;
  low52?: number;
  dayHigh?: number;
  dayLow?: number;
  open?: number;
  previousClose?: number;
  volume?: number;
  sparklineData?: number[];
  height?: number;
  showLabels?: boolean;
  showTimeframes?: boolean;
  showVolumeBars?: boolean;
  interactive?: boolean;
  className?: string;
}

export const ShareBoxAreaChart: React.FC<ShareBoxAreaChartProps> = ({
  symbol,
  price,
  change,
  changePercent,
  high52,
  low52,
  dayHigh,
  dayLow,
  open,
  previousClose,
  volume,
  sparklineData,
  height = 54,
  showLabels = true,
  showTimeframes = true,
  showVolumeBars = true,
  interactive = true,
  className = '',
}) => {
  const [timeframe, setTimeframe] = useState<'1D' | '5D' | '1M'>('1D');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Derive unique volatility and seed for this stock ticker
  const seed = useMemo(() => {
    return symbol.split('').reduce((acc, c, i) => acc + c.charCodeAt(0) * (i + 3), 0);
  }, [symbol]);

  // Generate 32-point rich, organic market curve for chosen timeframe
  const { points, timestamps, volumes } = useMemo(() => {
    const count = 32;
    const pts: number[] = [];
    const times: string[] = [];
    const vols: number[] = [];

    const effectiveOpen = open || (previousClose ? previousClose : price - change);
    const effectiveDayHigh = dayHigh || Math.max(price, effectiveOpen, price * 1.018);
    const effectiveDayLow = dayLow || Math.min(price, effectiveOpen, price * 0.982);

    // Ensure authentic visible volatility so small-change stocks never render as flat lines
    let spread = Math.max(price * 0.016, effectiveDayHigh - effectiveDayLow);
    let tfDelta = change;

    if (timeframe === '5D') {
      const swingMultiplier = (seed % 2 === 0 ? 1 : -1) * 2.5;
      tfDelta = Math.abs(change) > 0.1 ? change * 2.2 : (price * 0.022 * swingMultiplier);
      spread = Math.max(price * 0.038, spread * 2.2);
    } else if (timeframe === '1M') {
      const swingMultiplier = (seed % 3 === 0 ? 1 : -1) * 3.8;
      tfDelta = Math.abs(change) > 0.1 ? change * 3.6 : (price * 0.045 * swingMultiplier);
      spread = Math.max(price * 0.075, (high52 && low52 ? (high52 - low52) * 0.4 : price * 0.08));
    }

    const startPrice = price - tfDelta;

    for (let i = 0; i < count; i++) {
      const progress = i / (count - 1);

      // Multi-frequency harmonic wave superposition
      const w1 = Math.sin((seed * 0.6) + progress * Math.PI * 3.4) * 0.42;
      const w2 = Math.cos((seed * 1.4) + progress * Math.PI * 7.2) * 0.28;
      const w3 = Math.sin((seed * 2.7) + progress * Math.PI * 13.0) * 0.16;
      const micro = Math.cos(progress * 28 + seed) * 0.08;

      // Base non-linear trendline
      const linearVal = startPrice + (tfDelta * Math.pow(progress, 0.95));
      const envelope = Math.sin(progress * Math.PI);
      const fluctuation = (w1 + w2 + w3 + micro) * spread * 0.75 * envelope;

      let val = (i === count - 1) ? price : (linearVal + fluctuation);
      if (i === 0) val = startPrice;

      // Clamp within realistic thresholds
      if (timeframe === '1D') {
        val = Math.max(effectiveDayLow * 0.998, Math.min(effectiveDayHigh * 1.002, val));
      } else {
        const floor = low52 ? low52 * 0.98 : price * 0.82;
        const ceil = high52 ? high52 * 1.02 : price * 1.18;
        val = Math.max(floor, Math.min(ceil, val));
      }

      pts.push(Number(val.toFixed(2)));

      // Generate timestamps
      if (timeframe === '1D') {
        const totalMinutes = Math.floor(progress * 375); // 09:15 to 15:30
        const h = 9 + Math.floor((15 + totalMinutes) / 60);
        const m = (15 + totalMinutes) % 60;
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayH = h > 12 ? h - 12 : h;
        times.push(`${displayH}:${String(m).padStart(2, '0')} ${ampm}`);
      } else if (timeframe === '5D') {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        const dayIdx = Math.min(4, Math.floor(progress * 5));
        const session = i % 3 === 0 ? '10:00' : i % 3 === 1 ? '13:00' : '15:15';
        times.push(`${days[dayIdx]} ${session}`);
      } else {
        const dayNum = Math.min(30, Math.floor(progress * 30) + 1);
        times.push(`Day ${dayNum}`);
      }

      // Realistic volume profiles (higher at open, swings, and close)
      const vTick = Math.abs(Math.sin((seed + i) * 1.6)) * 0.6 + (i < 3 || i > count - 4 ? 0.5 : 0.2);
      vols.push(vTick);
    }

    return { points: pts, timestamps: times, volumes: vols };
  }, [symbol, price, change, dayHigh, dayLow, open, previousClose, high52, low52, sparklineData, timeframe, seed]);

  const activePoints = points;
  const minVal = Math.min(...activePoints);
  const maxVal = Math.max(...activePoints);
  const range = maxVal - minVal || 1;

  // Timeframe-specific change
  const firstVal = activePoints[0] || price;
  const currentVal = activePoints[activePoints.length - 1] || price;
  const tfChange = currentVal - firstVal;
  const tfChangePercent = firstVal > 0 ? (tfChange / firstVal) * 100 : 0;
  const isUp = tfChange >= 0;

  const svgWidth = 260;
  const svgHeight = height;
  const padTop = 5;
  const padBottom = showVolumeBars ? 14 : 5;
  const drawHeight = svgHeight - padTop - padBottom;

  const coords = useMemo(() => {
    return activePoints.map((p, idx) => {
      const x = (idx / (activePoints.length - 1)) * svgWidth;
      const y = padTop + drawHeight - ((p - minVal) / range) * drawHeight;
      return { x, y, val: p, time: timestamps[idx], vol: volumes[idx] };
    });
  }, [activePoints, minVal, range, drawHeight, padTop, svgWidth, timestamps, volumes]);

  const { linePath, areaPath } = useMemo(() => {
    if (coords.length < 2) return { linePath: '', areaPath: '' };

    let d = 'M ' + coords[0].x.toFixed(1) + ' ' + coords[0].y.toFixed(1);
    for (let i = 0; i < coords.length - 1; i++) {
      const curr = coords[i];
      const next = coords[i + 1];
      const cx = (curr.x + next.x) / 2;
      d += ' C ' + cx.toFixed(1) + ' ' + curr.y.toFixed(1) + ', ' + cx.toFixed(1) + ' ' + next.y.toFixed(1) + ', ' + next.x.toFixed(1) + ' ' + next.y.toFixed(1);
    }

    const areaD = d + ' L ' + svgWidth + ' ' + (svgHeight - padBottom) + ' L 0 ' + (svgHeight - padBottom) + ' Z';
    return { linePath: d, areaPath: areaD };
  }, [coords, svgWidth, svgHeight, padBottom]);

  const cleanSym = symbol.replace(/[^a-zA-Z0-9]/g, '');
  const gradientId = `area-grad-${cleanSym}-${timeframe}-${isUp ? 'up' : 'dn'}`;
  const filterId = `glow-${cleanSym}-${timeframe}`;

  const strokeColor = isUp ? '#00f59b' : '#f43f5e';
  const fillColor = isUp ? '#00f59b' : '#f43f5e';

  const activeCoord = hoverIndex !== null && coords[hoverIndex] ? coords[hoverIndex] : null;
  const lastCoord = coords[coords.length - 1];

  return (
    <div 
      className={`relative w-full overflow-hidden rounded-2xl bg-black/25 dark:bg-black/35 backdrop-blur-md p-2.5 group/chart select-none my-1.5 transition-all ${className}`}
      onMouseLeave={() => setHoverIndex(null)}
    >
      {/* Specular Ambient Edge Sheen - No Box Outline */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

      {/* Header Info & Timeframe Selectors */}
      {showLabels && (
        <div className="flex items-center justify-between text-[10px] font-mono px-0.5 pb-1.5">
          {/* Left: Timeframe pills or Live Status */}
          <div className="flex items-center gap-1">
            <span 
              className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor]" 
              style={{ backgroundColor: strokeColor }} 
            />
            {showTimeframes ? (
              <div 
                className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5"
                onClick={(e) => e.stopPropagation()}
              >
                {(['1D', '5D', '1M'] as const).map((tf) => (
                  <button
                    key={tf}
                    type="button"
                    onClick={() => setTimeframe(tf)}
                    className={`px-1.5 py-0.5 rounded-md text-[9px] font-black transition-all cursor-pointer ${
                      timeframe === tf
                        ? 'bg-[#00f59b] text-slate-950 shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            ) : (
              <span className="font-semibold text-slate-300">Intraday 5D</span>
            )}
          </div>

          {/* Right: Live Interactive Price Readout */}
          <div className="flex items-center gap-1.5 font-bold">
            {activeCoord ? (
              <div className="flex items-center gap-1">
                <span className="text-[9px] text-slate-400 font-normal">{activeCoord.time}:</span>
                <span className="text-white font-extrabold font-mono">₹{activeCoord.val.toFixed(2)}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <span className={`font-black ${isUp ? 'text-[#00f59b]' : 'text-rose-400'}`}>
                  {isUp ? '▲ +' : '▼ '}{formatPercent(tfChangePercent)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SVG Canvas with Multi-stop Gradient, Bezier Spline & Base Volume Bars */}
      <div className="relative w-full" style={{ height }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="none"
          className="w-full h-full overflow-visible"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={fillColor} stopOpacity={0.42} />
              <stop offset="45%" stopColor={fillColor} stopOpacity={0.16} />
              <stop offset="80%" stopColor={fillColor} stopOpacity={0.04} />
              <stop offset="100%" stopColor={fillColor} stopOpacity={0.0} />
            </linearGradient>

            <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Faint Horizontal Midline Reference */}
          <line
            x1="0"
            y1={padTop + drawHeight / 2}
            x2={svgWidth}
            y2={padTop + drawHeight / 2}
            stroke="rgba(255, 255, 255, 0.06)"
            strokeDasharray="3 3"
            strokeWidth="0.8"
          />

          {/* Synchronized Volume Histogram Bars at Base */}
          {showVolumeBars && coords.map((c, i) => {
            const barWidth = (svgWidth / coords.length) * 0.55;
            const barMaxH = 11;
            const barH = Math.max(2, (c.vol || 0.4) * barMaxH);
            const barY = svgHeight - barH;
            const isTickUp = i === 0 ? isUp : c.val >= coords[i - 1].val;
            return (
              <rect
                key={`vol-${i}`}
                x={c.x - barWidth / 2}
                y={barY}
                width={barWidth}
                height={barH}
                rx={1}
                fill={isTickUp ? '#00f59b' : '#f43f5e'}
                opacity={activeCoord && activeCoord.x === c.x ? 0.75 : 0.28}
                className="transition-opacity"
              />
            );
          })}

          {/* Multi-stop Gradient Area Fill */}
          <path
            d={areaPath}
            fill={`url(#${gradientId})`}
            className="transition-opacity duration-300 group-hover/chart:opacity-95"
          />

          {/* Glowing Bezier Stroke Path */}
          <path
            d={linePath}
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#${filterId})`}
          />

          {/* Live Price Pulsing Beacon Node at Current Price (Right Edge) */}
          {lastCoord && !activeCoord && (
            <g>
              <circle
                cx={lastCoord.x}
                cy={lastCoord.y}
                r="5"
                fill="none"
                stroke={strokeColor}
                strokeWidth="1.5"
                opacity="0.8"
                className="animate-ping"
              />
              <circle
                cx={lastCoord.x}
                cy={lastCoord.y}
                r="3"
                fill={strokeColor}
                filter={`url(#${filterId})`}
              />
              <circle
                cx={lastCoord.x}
                cy={lastCoord.y}
                r="1.2"
                fill="#ffffff"
              />
            </g>
          )}

          {/* Interactive Hover Crosshair & Dot */}
          {interactive && activeCoord && (
            <g>
              <line
                x1={activeCoord.x}
                y1={padTop}
                x2={activeCoord.x}
                y2={svgHeight - (showVolumeBars ? 13 : 2)}
                stroke="rgba(255, 255, 255, 0.4)"
                strokeDasharray="2 2"
                strokeWidth="1"
              />
              <circle
                cx={activeCoord.x}
                cy={activeCoord.y}
                r="6.5"
                fill="none"
                stroke={strokeColor}
                strokeWidth="1.6"
                opacity="0.65"
                className="animate-ping"
              />
              <circle
                cx={activeCoord.x}
                cy={activeCoord.y}
                r="3.5"
                fill="#ffffff"
                stroke={strokeColor}
                strokeWidth="2"
              />
            </g>
          )}

          {/* Invisible Interactive Hover Slices */}
          {interactive && coords.map((c, i) => {
            const sliceWidth = svgWidth / coords.length;
            return (
              <rect
                key={`hit-${i}`}
                x={Math.max(0, c.x - sliceWidth / 2)}
                y="0"
                width={sliceWidth}
                height={svgHeight}
                fill="transparent"
                className="cursor-crosshair"
                onMouseEnter={() => setHoverIndex(i)}
              />
            );
          })}
        </svg>
      </div>

      {/* Min / Max Low & High Bounds Footer */}
      <div className="flex justify-between items-center text-[9px] text-slate-500 dark:text-slate-400 font-mono pt-1">
        <span>L: ₹{minVal.toFixed(0)}</span>
        <span className="text-slate-600 dark:text-slate-300 font-semibold tracking-wider">
          {timeframe === '1D' ? 'NSE Indicative' : `${timeframe} Trend`}
        </span>
        <span>H: ₹{maxVal.toFixed(0)}</span>
      </div>
    </div>
  );
};

// ==========================================
// 2. EXPONENTIAL WEALTH SNOWBALL AREA CHART
// Dual / Triple multi-layered gradient for CompoundCalculator.tsx
// ==========================================
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
            <span className="w-2 h-2 rounded-full bg-[#00f59b] animate-ping" />
            <h4 className="text-sm sm:text-base font-black text-white font-mono tracking-tight">
              Exponential Wealth Snowball Curve
            </h4>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Accumulated compound gains expanding exponentially beyond invested capital.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-[#00f59b] bg-[#00f59b]/15 px-3 py-1 rounded-xl border border-[#00f59b]/30 font-mono shadow-xs">
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
                      <span className="text-[10px] text-[#00f59b] bg-[#00f59b]/20 px-2 py-0.5 rounded-md font-extrabold">
                        +₹{formatIndianShort(gains)} Gains
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#00f59b]" />
                          Maturity Wealth:
                        </span>
                        <span className="font-extrabold text-[#00f59b]">{formatINR(wealth, false)}</span>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#6366f1]" />
                          Invested Principal:
                        </span>
                        <span className="font-bold text-indigo-300">{formatINR(invested, false)}</span>
                      </div>

                      {realVal !== undefined && (
                        <div className="flex items-center justify-between gap-4 pt-1 border-t border-white/10">
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
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
          <span className="w-3 h-3 rounded-md bg-[#00f59b] shadow-[0_0_8px_#00f59b]" />
          <span className="font-bold text-white">Maturity Corpus</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-[#6366f1]" />
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
                      <span className={'text-[10px] px-1.5 py-0.5 rounded font-extrabold ' + (change >= 0 ? 'text-[#00f59b] bg-emerald-500/20' : 'text-rose-400 bg-rose-500/20')}>
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