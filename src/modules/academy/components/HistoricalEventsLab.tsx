import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, History, RotateCcw, ShieldAlert } from 'lucide-react';
import { HISTORICAL_EVENTS } from '../data/historicalEventsData';
import { useAccessibility } from '../../../context/AccessibilityContext';

export function HistoricalEventsLab() {
  const [eventId, setEventId] = useState(HISTORICAL_EVENTS[0].id);
  const [choiceIndex, setChoiceIndex] = useState<number | null>(null);
  const { settings } = useAccessibility();
  const event = HISTORICAL_EVENTS.find((item) => item.id === eventId) || HISTORICAL_EVENTS[0];

  const changeEvent = (id: string) => { setEventId(id); setChoiceIndex(null); };
  return (
    <section className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]" aria-label="Interactive market history case studies">
      <aside className="rounded-3xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-3 px-2"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-indigo-600">Interactive case studies</p><h2 className="mt-1 text-lg font-black">Learn from market history</h2></div>
        <div className="space-y-2">{HISTORICAL_EVENTS.map((item) => <button key={item.id} type="button" onClick={() => changeEvent(item.id)} className={`w-full rounded-2xl border p-3 text-left ${item.id === event.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50' : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'}`}><span className="block text-[10px] font-black text-indigo-600 dark:text-indigo-300">{item.period}</span><span className="mt-1 block text-xs font-extrabold">{item.title}</span></button>)}</div>
      </aside>
      <article className="academy-reading overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <div className="bg-gradient-to-br from-slate-950 to-indigo-950 p-5 text-white sm:p-7"><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-indigo-200"><History className="h-4 w-4" /> Historical educational simulation</div><h2 className="mt-3 text-2xl font-black sm:text-3xl">{event.title}</h2><p className="mt-2 text-sm leading-7 text-slate-200">{settings.learningLanguage === 'HINDI' ? event.hindi : event.setup}</p></div>
        <div className="space-y-6 p-5 sm:p-7">
          <div role="img" aria-label={`Three-stage timeline for ${event.title}`} className="grid gap-2 sm:grid-cols-3">{event.timeline.map((step, index) => <div key={step.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800"><span className="text-[10px] font-black text-indigo-600">{index + 1}. {step.label}</span><p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{step.detail}</p></div>)}</div>
          <div><h3 className="text-sm font-black">Choose a response</h3><p className="mt-1 text-xs text-slate-500">There is no perfect hindsight answer. Compare the trade-offs.</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{event.choices.map((choice, index) => <button key={choice.label} type="button" onClick={() => setChoiceIndex(index)} className={`min-h-14 rounded-2xl border p-3 text-left text-xs font-extrabold ${choiceIndex === index ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50' : 'border-slate-200 dark:border-slate-700'}`}>{choice.label}<ArrowRight className="ml-2 inline h-3.5 w-3.5" /></button>)}</div></div>
          {choiceIndex !== null && <div className={`rounded-2xl border p-4 ${event.choices[choiceIndex].tone === 'GOOD' ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30' : 'border-amber-300 bg-amber-50 dark:bg-amber-950/30'}`} aria-live="polite"><div className="flex items-start gap-3">{event.choices[choiceIndex].tone === 'GOOD' ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" /> : <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600" />}<div><p className="text-sm font-black">What could happen</p><p className="mt-1 text-xs leading-relaxed">{event.choices[choiceIndex].outcome}</p><p className="mt-2 text-xs font-bold">Lesson: {event.choices[choiceIndex].lesson}</p></div></div></div>}
          <div className="rounded-2xl bg-slate-950 p-4 text-white"><p className="text-[10px] font-black uppercase tracking-wide text-indigo-300">Key takeaway</p><p className="mt-1 text-sm font-bold leading-relaxed">{event.takeaway}</p></div>
          <button type="button" onClick={() => setChoiceIndex(null)} className="flex min-h-11 items-center gap-2 text-xs font-black text-indigo-600"><RotateCcw className="h-4 w-4" /> Try another decision</button>
        </div>
      </article>
    </section>
  );
}
