import React, { useMemo, useState } from 'react';
import { AlertTriangle, BarChart3, GitCompareArrows, ShieldCheck } from 'lucide-react';
import { useSimulator } from '../context/SimulatorContext';
import { formatINR } from '../utils/formatters';

const MODELS = {
  CONSERVATIVE: { Cash: 30, FMCG: 20, Banking: 15, Pharma: 15, IT: 10, Energy: 5, Auto: 5 },
  BALANCED: { Cash: 15, FMCG: 15, Banking: 20, Pharma: 10, IT: 20, Energy: 10, Auto: 10 },
  GROWTH: { Cash: 5, FMCG: 5, Banking: 20, Pharma: 5, IT: 35, Energy: 10, Auto: 20 },
} as const;
type ModelName = keyof typeof MODELS;

const SCENARIOS = [
  { id: 'IT_10', label: 'What if IT falls 10%?', sector: 'IT', shock: -10 },
  { id: 'BANK_15', label: 'What if Banking drops 15%?', sector: 'Banking', shock: -15 },
  { id: 'BROAD_12', label: 'What if equities fall 12%?', sector: 'ALL', shock: -12 },
] as const;

export function PortfolioConstructionLab() {
  const { holdings, stocks, portfolioValue } = useSimulator();
  const [model, setModel] = useState<ModelName>('BALANCED');
  const [scenarioId, setScenarioId] = useState<(typeof SCENARIOS)[number]['id']>('IT_10');
  const selectedScenario = SCENARIOS.find((item) => item.id === scenarioId) || SCENARIOS[0];
  const allocation = MODELS[model];

  const actualWeights = useMemo(() => {
    const values: Record<string, number> = {};
    let total = 0;
    Object.values(holdings).forEach((holding) => {
      const stock = stocks.find((item) => item.symbol === holding.symbol);
      const value = holding.quantity * (stock?.price || holding.avgBuyPrice);
      const sector = stock?.sector || 'Other';
      values[sector] = (values[sector] || 0) + value;
      total += value;
    });
    return { values, total };
  }, [holdings, stocks]);

  const modelImpactPct = selectedScenario.sector === 'ALL'
    ? ((100 - allocation.Cash) / 100) * selectedScenario.shock
    : ((allocation[selectedScenario.sector as keyof typeof allocation] || 0) / 100) * selectedScenario.shock;
  const actualSectorValue = selectedScenario.sector === 'ALL'
    ? actualWeights.total
    : Object.entries(actualWeights.values).filter(([name]) => name.toLowerCase().includes(selectedScenario.sector.toLowerCase())).reduce((sum, [,value]) => sum + value, 0);
  const actualImpact = actualSectorValue * (selectedScenario.shock / 100);

  return (
    <section className="rounded-3xl border border-indigo-200 bg-white p-4 shadow-sm dark:border-indigo-900 dark:bg-slate-900 sm:p-5" aria-labelledby="portfolio-lab-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-2"><GitCompareArrows className="h-5 w-5 text-indigo-600" /><h2 id="portfolio-lab-title" className="text-sm font-black">Portfolio model & stress-test lab</h2></div><p className="mt-1 text-[11px] leading-relaxed text-slate-500">Compare educational allocation models. They are examples, not recommendations or promised returns.</p></div><span className="w-fit rounded-full bg-indigo-100 px-2.5 py-1 text-[9px] font-black text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200">SIMULATED</span></div>
      <div className="mt-4 grid grid-cols-3 gap-2">{(Object.keys(MODELS) as ModelName[]).map((name) => <button key={name} type="button" onClick={() => setModel(name)} className={`min-h-11 rounded-xl border px-2 text-[10px] font-black ${model === name ? 'border-indigo-500 bg-indigo-600 text-white' : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'}`}>{name[0] + name.slice(1).toLowerCase()}</button>)}</div>
      <div role="img" aria-label={`${model.toLowerCase()} educational allocation model by sector`} className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{Object.entries(allocation).map(([sector, weight]) => <div key={sector} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800"><div className="flex justify-between gap-2 text-xs"><span className="font-extrabold">{sector}</span><span className="font-mono font-black">{weight}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${weight}%` }} /></div></div>)}</div>
      <div className="mt-5 rounded-2xl border border-slate-200 p-4 dark:border-slate-700"><div className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-amber-600" /><h3 className="text-xs font-black">Ask “what happens if?”</h3></div><div className="mt-3 flex gap-2 overflow-x-auto pb-1">{SCENARIOS.map((scenario) => <button key={scenario.id} type="button" onClick={() => setScenarioId(scenario.id)} className={`min-h-11 shrink-0 rounded-xl border px-3 text-[10px] font-black ${scenario.id === scenarioId ? 'border-amber-500 bg-amber-100 text-amber-950' : 'border-slate-200 dark:border-slate-700'}`}>{scenario.label}</button>)}</div><div className="mt-3 grid gap-2 sm:grid-cols-2"><div className="rounded-xl bg-slate-950 p-3 text-white"><p className="text-[9px] font-black uppercase text-slate-400">{model.toLowerCase()} model impact</p><p className="mt-1 font-mono text-xl font-black text-rose-300">{modelImpactPct.toFixed(1)}%</p></div><div className="rounded-xl bg-slate-100 p-3 dark:bg-slate-800"><p className="text-[9px] font-black uppercase text-slate-500">Your current holdings impact</p><p className="mt-1 font-mono text-xl font-black text-rose-600">{actualWeights.total > 0 ? formatINR(actualImpact) : 'No exposure yet'}</p></div></div></div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2"><div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/20"><div className="flex gap-2"><ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" /><p className="text-xs leading-relaxed"><strong>Correlation, simply:</strong> two investments are correlated when they often move together. Owning five stocks driven by the same IT spending cycle may still behave like one big bet.</p></div></div><div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/20"><div className="flex gap-2"><AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" /><p className="text-xs leading-relaxed"><strong>Concentration, simply:</strong> too much of your money depends on one stock, sector or economic story. A normal setback can then hurt the whole portfolio.</p></div></div></div>
    </section>
  );
}
