import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  TrendingUp, 
  Sparkles, 
  DollarSign, 
  Clock, 
  Layers, 
  ArrowUpRight, 
  Target, 
  Percent, 
  PieChart as PieIcon, 
  HelpCircle, 
  Flame, 
  Zap, 
  ChevronRight, 
  Calendar,
  CheckCircle2,
  Sliders,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { formatINR, formatPercent, formatIndianShort, formatNumberIndian } from '../../../utils/formatters';
import { ChartFigure } from '../../../components/ui/chart-figure';
import { describeSeries, seriesRows } from '../../../utils/chartSummary';
import { GrowthSnowballAreaChart } from '../../../components/ui/area-charts-2';

type CalcMode = 'SIP' | 'LUMPSUM' | 'STEP_UP' | 'GOAL';

interface PresetReturn {
  label: string;
  rate: number;
  description: string;
}

const PRESET_RETURNS: PresetReturn[] = [
  { label: 'Bank FD / Debt', rate: 7.0, description: 'Low risk fixed income' },
  { label: 'Conservative Hybrid', rate: 10.0, description: 'Debt + Equity blend' },
  { label: 'Nifty 50 Index', rate: 13.0, description: 'Historical 20-yr Indian Equity benchmark' },
  { label: 'Mid-Cap Growth', rate: 16.0, description: 'High growth quality mid-caps' },
  { label: 'Aggressive Alpha', rate: 20.0, description: 'Concentrated momentum/growth' },
];

export const CompoundCalculator: React.FC = () => {
  const [calcMode, setCalcMode] = useState<CalcMode>('SIP');
  
  // SIP / Step-Up State
  const [monthlySip, setMonthlySip] = useState<number>(5000);
  const [stepUpPercent, setStepUpPercent] = useState<number>(10);
  
  // Lumpsum State
  const [lumpsumAmount, setLumpsumAmount] = useState<number>(100000);
  
  // Goal State
  const [targetGoal, setTargetGoal] = useState<number>(10000000); // 1 Crore default
  
  // Common State
  const [annualReturn, setAnnualReturn] = useState<number>(13.0); // 13% Nifty 50
  const [years, setYears] = useState<number>(15);
  const [startingAge, setStartingAge] = useState<number>(20);
  const [adjustInflation, setAdjustInflation] = useState<boolean>(false);
  const [inflationRate, setInflationRate] = useState<number>(6.0); // 6% Indian CPI
  const [taxRate, setTaxRate] = useState<number>(12.5);
  const [showFullSchedule, setShowFullSchedule] = useState<boolean>(false);

  // Computations
  const results = useMemo(() => {
    let totalInvested = 0;
    let maturityCorpus = 0;
    const schedule: Array<{
      year: number;
      age: number;
      monthlyInvestment: number;
      yearlyInvestment: number;
      cumulativeInvested: number;
      yearGains: number;
      endingCorpus: number;
      realValue: number;
    }> = [];

    const monthlyRate = annualReturn / 12 / 100;
    const yearlyInflationRate = inflationRate / 100;

    if (calcMode === 'SIP') {
      let currentCorpus = 0;
      let cumInvested = 0;

      for (let y = 1; y <= years; y++) {
        let yearStartCorpus = currentCorpus;
        for (let m = 1; m <= 12; m++) {
          currentCorpus = (currentCorpus + monthlySip) * (1 + monthlyRate);
          cumInvested += monthlySip;
        }
        const yearGains = (currentCorpus - yearStartCorpus) - (monthlySip * 12);
        const realValue = currentCorpus / Math.pow(1 + yearlyInflationRate, y);

        schedule.push({
          year: y,
          age: startingAge + y,
          monthlyInvestment: monthlySip,
          yearlyInvestment: monthlySip * 12,
          cumulativeInvested: cumInvested,
          yearGains: Math.max(0, yearGains),
          endingCorpus: currentCorpus,
          realValue
        });
      }

      totalInvested = cumInvested;
      maturityCorpus = currentCorpus;

    } else if (calcMode === 'STEP_UP') {
      let currentCorpus = 0;
      let cumInvested = 0;
      let currentMonthlySip = monthlySip;

      for (let y = 1; y <= years; y++) {
        let yearStartCorpus = currentCorpus;
        let yearInvestment = 0;

        for (let m = 1; m <= 12; m++) {
          currentCorpus = (currentCorpus + currentMonthlySip) * (1 + monthlyRate);
          cumInvested += currentMonthlySip;
          yearInvestment += currentMonthlySip;
        }

        const yearGains = (currentCorpus - yearStartCorpus) - yearInvestment;
        const realValue = currentCorpus / Math.pow(1 + yearlyInflationRate, y);

        schedule.push({
          year: y,
          age: startingAge + y,
          monthlyInvestment: Math.round(currentMonthlySip),
          yearlyInvestment: Math.round(yearInvestment),
          cumulativeInvested: Math.round(cumInvested),
          yearGains: Math.max(0, Math.round(yearGains)),
          endingCorpus: Math.round(currentCorpus),
          realValue: Math.round(realValue)
        });

        // Step up for next year
        currentMonthlySip = currentMonthlySip * (1 + stepUpPercent / 100);
      }

      totalInvested = cumInvested;
      maturityCorpus = currentCorpus;

    } else if (calcMode === 'LUMPSUM') {
      let currentCorpus = lumpsumAmount;
      totalInvested = lumpsumAmount;

      for (let y = 1; y <= years; y++) {
        const prev = currentCorpus;
        currentCorpus = currentCorpus * (1 + annualReturn / 100);
        const yearGains = currentCorpus - prev;
        const realValue = currentCorpus / Math.pow(1 + yearlyInflationRate, y);

        schedule.push({
          year: y,
          age: startingAge + y,
          monthlyInvestment: 0,
          yearlyInvestment: y === 1 ? lumpsumAmount : 0,
          cumulativeInvested: lumpsumAmount,
          yearGains: Math.round(yearGains),
          endingCorpus: Math.round(currentCorpus),
          realValue: Math.round(realValue)
        });
      }

      maturityCorpus = currentCorpus;

    } else if (calcMode === 'GOAL') {
      // Calculate required SIP to reach targetGoal in `years` years
      const n = years * 12;
      const i = monthlyRate;
      // FV = P * [((1 + i)^n - 1) / i] * (1 + i)
      const factor = ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
      const reqMonthlySip = targetGoal / factor;

      let currentCorpus = 0;
      let cumInvested = 0;

      for (let y = 1; y <= years; y++) {
        let yearStartCorpus = currentCorpus;
        for (let m = 1; m <= 12; m++) {
          currentCorpus = (currentCorpus + reqMonthlySip) * (1 + monthlyRate);
          cumInvested += reqMonthlySip;
        }
        const yearGains = (currentCorpus - yearStartCorpus) - (reqMonthlySip * 12);
        const realValue = currentCorpus / Math.pow(1 + yearlyInflationRate, y);

        schedule.push({
          year: y,
          age: startingAge + y,
          monthlyInvestment: Math.round(reqMonthlySip),
          yearlyInvestment: Math.round(reqMonthlySip * 12),
          cumulativeInvested: Math.round(cumInvested),
          yearGains: Math.max(0, Math.round(yearGains)),
          endingCorpus: Math.round(currentCorpus),
          realValue: Math.round(realValue)
        });
      }

      totalInvested = cumInvested;
      maturityCorpus = currentCorpus;
    }

    const wealthGained = Math.max(0, maturityCorpus - totalInvested);
    const multiplier = totalInvested > 0 ? (maturityCorpus / totalInvested) : 1;
    const realMaturityCorpus = maturityCorpus / Math.pow(1 + yearlyInflationRate, years);

    return {
      totalInvested: Math.round(totalInvested),
      wealthGained: Math.round(wealthGained),
      maturityCorpus: Math.round(maturityCorpus),
      realMaturityCorpus: Math.round(realMaturityCorpus),
      multiplier: Number(multiplier.toFixed(2)),
      schedule
    };
  }, [calcMode, monthlySip, stepUpPercent, lumpsumAmount, targetGoal, annualReturn, years, startingAge, inflationRate]);

  // Chart data
  const chartData = useMemo(() => {
    return results.schedule.map((item) => ({
      year: `Yr ${item.year}`,
      age: `Age ${item.age}`,
      invested: item.cumulativeInvested,
      wealth: item.endingCorpus,
      realValue: item.realValue
    }));
  }, [results]);

  // Pie chart data
  const pieData = useMemo(() => {
    return [
      { name: 'Your Invested Capital', value: results.totalInvested, color: '#4F46E5' },
      { name: 'Illustrative Growth from Returns', value: results.wealthGained, color: '#10B981' }
    ];
  }, [results]);

  // Milestones calculation
  const milestones = useMemo(() => {
    const goals = [
      { label: '₹10 Lakhs', value: 1000000, desc: 'First Major Financial Bedrock' },
      { label: '₹50 Lakhs', value: 5000000, desc: 'Half-Crore Wealth Velocity' },
      { label: '₹1 Crore', value: 10000000, desc: 'Official Crorepati Milestone' },
      { label: '₹5 Crores', value: 50000000, desc: 'Generational Financial Freedom' },
    ];

    return goals.map(g => {
      const found = results.schedule.find(s => s.endingCorpus >= g.value);
      return {
        ...g,
        achieved: !!found,
        achievedYear: found ? found.year : null,
        achievedAge: found ? found.age : null
      };
    });
  }, [results]);

  const assumptionSummary = useMemo(() => {
    const afterTaxCorpus = results.totalInvested + results.wealthGained * (1 - taxRate / 100);
    const realAfterTaxCorpus = afterTaxCorpus / Math.pow(1 + inflationRate / 100, years);
    const projectAtRate = (rate: number) => {
      const monthlyRate = rate / 12 / 100;
      if (calcMode === 'LUMPSUM') return lumpsumAmount * Math.pow(1 + rate / 100, years);
      const baseMonthly = calcMode === 'GOAL' ? results.schedule[0]?.monthlyInvestment || 0 : monthlySip;
      let corpus = 0;
      let contribution = baseMonthly;
      for (let year = 1; year <= years; year++) {
        for (let month = 0; month < 12; month++) corpus = (corpus + contribution) * (1 + monthlyRate);
        if (calcMode === 'STEP_UP') contribution *= 1 + stepUpPercent / 100;
      }
      return corpus;
    };
    return {
      afterTaxCorpus: Math.round(afterTaxCorpus),
      realAfterTaxCorpus: Math.round(realAfterTaxCorpus),
      scenarios: [
        { label: 'Conservative', rate: Math.max(1, annualReturn - 3), corpus: projectAtRate(Math.max(1, annualReturn - 3)) },
        { label: 'Base case', rate: annualReturn, corpus: projectAtRate(annualReturn) },
        { label: 'Optimistic', rate: annualReturn + 3, corpus: projectAtRate(annualReturn + 3) },
      ],
    };
  }, [annualReturn, calcMode, inflationRate, lumpsumAmount, monthlySip, results, stepUpPercent, taxRate, years]);

  return (
    <div className="rr-surfaces space-y-6">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                Wealth Engine
              </span>
              <span className="text-slate-400 text-xs font-semibold">
                Exponential Compound Interest Simulator
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              The 8th Wonder of the World: Compound Calculator
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl mt-1.5 leading-relaxed">
              Model your journey to ₹1 Crore and beyond. Explore the exponential power of Indian equities (13–16% CAGR), monthly SIPs, and annual step-up multipliers.
            </p>
          </div>

          {/* Top Quick Metric Pill */}
          <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-2xl shrink-0 min-w-[220px]">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Expected Maturity Corpus
            </span>
            <div className="font-mono text-2xl font-black text-emerald-400 mt-1">
              {formatINR(adjustInflation ? results.realMaturityCorpus : results.maturityCorpus, false)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-300">
              <span className="text-emerald-400 font-bold">{results.multiplier}x Multiplier</span>
              <span>•</span>
              <span className="text-slate-400">{years} Years</span>
            </div>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-slate-800 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setCalcMode('SIP')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              calcMode === 'SIP'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Monthly SIP</span>
          </button>

          <button
            onClick={() => setCalcMode('STEP_UP')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              calcMode === 'STEP_UP'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            <span>Step-Up SIP (+10%/yr)</span>
            <span className="bg-amber-400/20 text-amber-300 text-[9px] px-1.5 py-0.5 rounded-full font-bold">Fast-Track</span>
          </button>

          <button
            onClick={() => setCalcMode('LUMPSUM')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              calcMode === 'LUMPSUM'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Lumpsum (One-Time)</span>
          </button>

          <button
            onClick={() => setCalcMode('GOAL')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              calcMode === 'GOAL'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-emerald-400" />
            <span>Target Goal Roadmap (₹1 Cr)</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Calculator Engine Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive Inputs (5 cols) */}
        <div className="lg:col-span-5 space-y-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span>Investment Parameters</span>
            </h3>
            <span className="text-xs text-slate-500 font-bold">
              Mode: {calcMode}
            </span>
          </div>

          {/* SIP Monthly Input */}
          {(calcMode === 'SIP' || calcMode === 'STEP_UP') && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                <span>Monthly Investment</span>
                <span className="font-mono text-sm font-black text-indigo-600">
                  {formatINR(monthlySip, false)}/month
                </span>
              </div>
              <input
                type="range"
                min="500"
                max="100000"
                step="500"
                value={monthlySip}
                onChange={(e) => setMonthlySip(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>₹500</span>
                <span>₹25,000</span>
                <span>₹50,000</span>
                <span>₹1,00,000</span>
              </div>
            </div>
          )}

          {/* Step-Up Rate */}
          {calcMode === 'STEP_UP' && (
            <div className="space-y-2 bg-amber-50/70 border border-amber-200/80 p-3.5 rounded-2xl">
              <div className="flex justify-between items-center text-xs font-bold text-amber-950">
                <span>Annual Step-Up Rate (%)</span>
                <span className="font-mono text-sm font-black text-amber-700">
                  +{stepUpPercent}% per year
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="25"
                step="1"
                value={stepUpPercent}
                onChange={(e) => setStepUpPercent(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <p className="text-[10px] text-amber-800 leading-tight">
                Increasing your SIP with annual salary hikes drastically speeds up multi-Crore milestones.
              </p>
            </div>
          )}

          {/* Lumpsum Amount */}
          {calcMode === 'LUMPSUM' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                <span>Initial One-Time Capital</span>
                <span className="font-mono text-sm font-black text-indigo-600">
                  {formatINR(lumpsumAmount, false)}
                </span>
              </div>
              <input
                type="range"
                min="10000"
                max="2000000"
                step="10000"
                value={lumpsumAmount}
                onChange={(e) => setLumpsumAmount(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>₹10,000</span>
                <span>₹5,00,000</span>
                <span>₹10,00,000</span>
                <span>₹20,00,000</span>
              </div>
            </div>
          )}

          {/* Target Goal Input */}
          {calcMode === 'GOAL' && (
            <div className="space-y-2 bg-emerald-50/70 border border-emerald-200/80 p-3.5 rounded-2xl">
              <div className="flex justify-between items-center text-xs font-bold text-emerald-950">
                <span>Target Wealth Corpus</span>
                <span className="font-mono text-sm font-black text-emerald-700">
                  {formatINR(targetGoal, false)}
                </span>
              </div>
              <input
                type="range"
                min="1000000"
                max="50000000"
                step="1000000"
                value={targetGoal}
                onChange={(e) => setTargetGoal(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-emerald-800 font-mono">
                <span>₹10 Lakhs</span>
                <span>₹1 Crore</span>
                <span>₹3 Crores</span>
                <span>₹5 Crores</span>
              </div>
            </div>
          )}

          {/* Expected Return Rate (CAGR) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-700">
              <span>Expected Annual Return (CAGR)</span>
              <span className="font-mono text-sm font-black text-emerald-700">
                {annualReturn}% p.a.
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="25"
              step="0.5"
              value={annualReturn}
              onChange={(e) => setAnnualReturn(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            
            {/* Presets Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {PRESET_RETURNS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setAnnualReturn(p.rate)}
                  aria-pressed={annualReturn === p.rate}
                  className={`text-[10px] min-h-6 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    annualReturn === p.rate
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {p.label} ({p.rate}%)
                </button>
              ))}
            </div>
          </div>

          {/* Time Horizon (Years) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-700">
              <span>Time Horizon</span>
              <span className="font-mono text-sm font-black text-slate-900">
                {years} Years ({startingAge} → {startingAge + years} yrs old)
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="40"
              step="1"
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>1 Yr</span>
              <span>10 Yrs</span>
              <span>20 Yrs</span>
              <span>30 Yrs</span>
              <span>40 Yrs</span>
            </div>
          </div>

          {/* Starting Age Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-700">
              <span>Current Age</span>
              <span className="font-mono text-xs font-bold text-slate-800">
                {startingAge} Years Old
              </span>
            </div>
            <input
              type="range"
              min="15"
              max="60"
              step="1"
              value={startingAge}
              onChange={(e) => setStartingAge(Number(e.target.value))}
              className="w-full accent-slate-600 cursor-pointer"
            />
          </div>

          {/* Inflation Adjuster Switch */}
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">Adjust for Inflation</span>
                <span className="text-[10px] text-slate-500 font-mono">({inflationRate}% CPI)</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={adjustInflation} 
                  onChange={(e) => setAdjustInflation(e.target.checked)} 
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            {adjustInflation && (
              <div className="space-y-2 pt-2 border-t border-slate-200 text-[11px] text-slate-600">
                <div className="flex items-center justify-between"><span>Inflation assumption</span><strong className="font-mono">{inflationRate}%</strong></div>
                <input aria-label="Inflation rate assumption" type="range" min="2" max="10" step="0.5" value={inflationRate} onChange={(event) => setInflationRate(Number(event.target.value))} className="w-full accent-amber-500" />
                <p>Reflects real purchasing power in today's rupee terms.</p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800"><span>Illustrative tax on gains</span><span className="font-mono text-rose-700">{taxRate}%</span></div>
            <input aria-label="Tax rate assumption" type="range" min="0" max="30" step="0.5" value={taxRate} onChange={(event) => setTaxRate(Number(event.target.value))} className="mt-2 w-full accent-rose-500" />
            <p className="mt-1 text-[10px] leading-relaxed text-slate-500">A simplified assumption for comparison only. Actual Indian tax depends on product, holding period, income, rules, cess, and surcharge.</p>
          </div>

        </div>

        {/* Right Column: Visual Exponential Chart & Breakdown Cards (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Summary Metric Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="bg-white border border-slate-200 p-4.5 rounded-3xl shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Invested Cash
              </span>
              <div className="font-mono text-xl font-black text-indigo-700 mt-1">
                {formatINR(results.totalInvested, false)}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Your hard-earned savings
              </span>
            </div>

            <div className="bg-white border border-slate-200 p-4.5 rounded-3xl shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Wealth Gained (Interest)
              </span>
              <div className="font-mono text-xl font-black text-emerald-700 mt-1">
                +{formatINR(results.wealthGained, false)}
              </div>
              <span className="text-[10px] text-emerald-700 font-bold mt-0.5 block">
                Free money from compounding!
              </span>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-4.5 rounded-3xl shadow-xs">
              <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block">
                Expected Net Corpus
              </span>
              <div className="font-mono text-xl font-black text-emerald-950 mt-1">
                {formatINR(results.maturityCorpus, false)}
              </div>
              <span className="text-[10px] text-emerald-800 font-bold mt-0.5 block">
                {results.multiplier}x your investment
              </span>
            </div>
          </div>

          {/* Visual Exponential Snowball Chart - 21st.dev @sean0205 Area Chart 2 */}
          <ChartFigure
            title="Projected corpus, year by year"
            summary={describeSeries(
              adjustInflation ? 'Projected corpus in today\u2019s money' : 'Projected corpus',
              chartData.map((point) => ({
                label: point.year,
                value: adjustInflation ? point.realValue : point.wealth,
              })),
              (value) => formatINR(value, false),
            )}
            columns={['Year', adjustInflation ? 'In today\u2019s money' : 'Corpus']}
            rows={seriesRows(
              chartData.map((point) => ({
                label: point.year,
                value: adjustInflation ? point.realValue : point.wealth,
              })),
              (value) => formatINR(value, false),
            )}
          >
            <GrowthSnowballAreaChart
              data={chartData}
              adjustInflation={adjustInflation}
              multiplier={results.multiplier}
              height={280}
            />
          </ChartFigure>

        </div>

      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
        <div className="flex flex-col gap-1 border-b border-slate-100 pb-3 sm:flex-row sm:items-end sm:justify-between"><div><h3 className="text-sm font-black uppercase tracking-wider text-slate-900">Scenario comparison</h3><p className="text-xs text-slate-500">See how return, inflation, and the simplified tax assumption change the outcome.</p></div><span className="text-[10px] font-bold text-slate-400">Illustrative projections · not guaranteed returns</span></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {assumptionSummary.scenarios.map((scenario) => <div key={scenario.label} className={`rounded-2xl border p-4 ${scenario.label === 'Base case' ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-slate-50'}`}><span className="text-[10px] font-black uppercase tracking-wide text-slate-500">{scenario.label} · {scenario.rate}%</span><strong className="mt-1 block font-mono text-lg text-slate-900">{formatINR(scenario.corpus, false)}</strong></div>)}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4"><span className="text-[10px] font-black uppercase text-rose-800">After {taxRate}% illustrative tax on gains</span><strong className="mt-1 block font-mono text-xl text-rose-950">{formatINR(assumptionSummary.afterTaxCorpus, false)}</strong></div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><span className="text-[10px] font-black uppercase text-amber-800">After tax and {inflationRate}% inflation</span><strong className="mt-1 block font-mono text-xl text-amber-950">{formatINR(assumptionSummary.realAfterTaxCorpus, false)}</strong><span className="text-[10px] text-amber-800">Value in today’s purchasing power</span></div>
        </div>
      </section>

      {/* 3. Wealth Milestones Roadmap Grid */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-600" />
              <span>Your Multi-Crore Milestone Roadmap</span>
            </h3>
            <p className="text-xs text-slate-500">
              See when your investment plan hits major wealth milestones.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {milestones.map((m) => (
            <div 
              key={m.label}
              className={`p-4 rounded-2xl border transition-all ${
                m.achieved 
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' 
                  : 'bg-slate-50 border-slate-200 text-slate-400 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-lg font-black text-slate-900">
                  {m.label}
                </span>
                {m.achieved ? (
                  <span className="p-1 rounded-full bg-emerald-200 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4" />
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-200 dark:bg-slate-700 dark:text-slate-200 px-2 py-0.5 rounded-full">
                    Beyond {years}y
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">{m.desc}</p>
              
              {m.achieved && (
                <div className="mt-3 pt-2 border-t border-emerald-200/80 text-xs">
                  <span className="text-emerald-800 font-bold">
                    Hit at Year {m.achievedYear} (Age {m.achievedAge})
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 4. Year-by-Year Schedule Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>Year-by-Year Compounding Schedule</span>
            </h3>
            <p className="text-xs text-slate-500">
              Detailed annual snapshot of your deposits, interest earned, and closing portfolio balances.
            </p>
          </div>

          <button
            onClick={() => setShowFullSchedule(!showFullSchedule)}
            className="inline-flex min-h-6 items-center rounded-lg px-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
          >
            {showFullSchedule ? 'Show First 5 Years' : `View All ${years} Years →`}
          </button>
        </div>

        <div className="border border-slate-200 rounded-2xl overflow-x-auto shadow-2xs">
          <table className="w-full text-left text-xs border-collapse min-w-[650px]">
            <thead className="bg-slate-900 text-slate-200 font-extrabold uppercase text-[10px]">
              <tr>
                <th className="p-3">Year / Age</th>
                <th className="p-3 text-right">Monthly Deposit</th>
                <th className="p-3 text-right">Annual Deposit</th>
                <th className="p-3 text-right">Cumulative Invested</th>
                <th className="p-3 text-right">Gains Earned That Year</th>
                <th className="p-3 text-right">Ending Corpus</th>
                {adjustInflation && <th className="p-3 text-right">Real Value (Today's ₹)</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(showFullSchedule ? results.schedule : results.schedule.slice(0, 5)).map((row) => (
                <tr key={row.year} className="hover:bg-slate-50 transition-colors font-medium">
                  <td className="p-3">
                    <span className="font-bold text-slate-900">Year {row.year}</span>
                    <span className="text-[10px] text-slate-500 ml-1.5 font-mono">(Age {row.age})</span>
                  </td>
                  <td className="p-3 text-right font-mono text-slate-700">{formatINR(row.monthlyInvestment, false)}</td>
                  <td className="p-3 text-right font-mono text-slate-700">{formatINR(row.yearlyInvestment, false)}</td>
                  <td className="p-3 text-right font-mono font-bold text-indigo-700">{formatINR(row.cumulativeInvested, false)}</td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-700">+{formatINR(row.yearGains, false)}</td>
                  <td className="p-3 text-right font-mono font-black text-slate-900">{formatINR(row.endingCorpus, false)}</td>
                  {adjustInflation && (
                    <td className="p-3 text-right font-mono text-amber-700 font-bold">{formatINR(row.realValue, false)}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Compounding Superpower Secrets & Rules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-50 border border-slate-200 p-5 rounded-3xl space-y-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
            1
          </div>
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
            Time Exponent Rule
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            In compound interest ($A = P(1 + r)^t$), <strong>Time ($t$)</strong> is in the exponent. Starting 5 years earlier doubles or triples your final wealth without adding extra capital.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-5 rounded-3xl space-y-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            2
          </div>
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
            The Step-Up Multiplier
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            A standard ₹10,000/mo SIP at 13% CAGR yields ₹1.07 Cr in 20 yrs. Stepping up by just <strong>10% annually</strong> explodes that corpus to <strong>₹2.28 Crores</strong> (+113% extra)!
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-5 rounded-3xl space-y-2">
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            3
          </div>
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
            The 1st Crore Snowball
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Accumulating your first ₹1 Crore typically takes 12–15 years of discipline. But because of the compounding base, your <strong>2nd Crore takes only 3 to 4 years</strong>!
          </p>
        </div>
      </div>

    </div>
  );
};
