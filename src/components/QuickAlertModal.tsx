import React, { useEffect, useMemo, useState } from 'react';
import { Bell, BookOpen, CheckCircle2, X } from 'lucide-react';
import type { Alert, StockDetail } from '../types';
import { useSimulator } from '../context/SimulatorContext';
import { formatINR } from '../utils/formatters';

interface QuickAlertModalProps { isOpen: boolean; onClose: () => void; stock: StockDetail | null; }
type SmartKind = NonNullable<Alert['kind']>;
const OPTIONS: Array<{ kind: SmartKind; label: string; reason: string; lesson: string }> = [
  { kind: 'PRICE', label: 'Price reaches ₹X', reason: 'A planned price level can prompt a review without encouraging constant checking.', lesson: 'Orders, stops and position sizing' },
  { kind: 'EARNINGS', label: 'Earnings date approaching', reason: 'Results can change expectations and increase short-term volatility.', lesson: 'Reading quarterly results' },
  { kind: 'WEEK_52', label: '52-week high breakout / low', reason: 'A yearly extreme is context—not an automatic buy or sell signal.', lesson: 'Momentum versus valuation' },
  { kind: 'EMA_200', label: 'Breaks 200-day EMA moving average', reason: 'The 200 EMA is the institutional benchmark separating bull from bear market regime.', lesson: 'Technical indicators & moving averages' },
  { kind: 'SUPPORT_BREAK', label: 'Drops below critical support', reason: 'A support breakdown signals institutional supply and potential acceleration downward.', lesson: 'Support, resistance & risk management' },
  { kind: 'MOVE_PERCENT', label: 'Price moves more than 5%', reason: 'A large move is a cue to check news and your thesis before reacting.', lesson: 'Volatility and emotional decisions' },
  { kind: 'PE_CHANGE', label: 'P/E changes materially', reason: 'Valuation can change because of price, earnings, or both.', lesson: 'P/E ratio in plain language' },
  { kind: 'SECTOR_CONCENTRATION', label: 'Sector allocation exceeds limit', reason: 'Too much exposure to one sector can make the whole portfolio depend on one story.', lesson: 'Diversification and concentration' },
  { kind: 'DRAWDOWN', label: 'Portfolio drawdown threshold', reason: 'A drawdown rule creates a calm review point before losses trigger panic.', lesson: 'Capital protection and drawdowns' },
];

export const QuickAlertModal: React.FC<QuickAlertModalProps> = ({ isOpen, onClose, stock }) => {
  const { addSmartAlert } = useSimulator();
  const [kind, setKind] = useState<SmartKind>('PRICE');
  const [direction, setDirection] = useState<'ABOVE' | 'BELOW'>('ABOVE');
  const [target, setTarget] = useState(0);
  const [threshold, setThreshold] = useState(5);
  const [eventDate, setEventDate] = useState('');
  const [saved, setSaved] = useState(false);
  const option = useMemo(() => OPTIONS.find((item) => item.kind === kind) || OPTIONS[0], [kind]);
  useEffect(() => { if (stock) setTarget(Number((stock.price * 1.05).toFixed(2))); setSaved(false); }, [stock]);
  if (!isOpen || !stock) return null;

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    addSmartAlert({ symbol: stock.symbol, kind, type: direction, targetPrice: kind === 'PRICE' ? target : undefined, threshold: ['MOVE_PERCENT','PE_CHANGE','SECTOR_CONCENTRATION','DRAWDOWN'].includes(kind) ? threshold : undefined, eventDate: kind === 'EARNINGS' ? eventDate : undefined, baselineValue: kind === 'PE_CHANGE' ? stock.peRatio : stock.price, sector: kind === 'SECTOR_CONCENTRATION' ? stock.sector : undefined, reason: option.reason, lessonTitle: option.lesson });
    setSaved(true); setTimeout(onClose, 900);
  };

  return <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="smart-alert-title" onClick={onClose}>
    <section className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-[28px] bg-white p-5 text-slate-900 shadow-2xl sm:rounded-[28px]" onClick={(event) => event.stopPropagation()}>
      <div className="flex items-start justify-between"><div className="flex gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-100 text-amber-800"><Bell className="h-5 w-5" /></span><div><h2 id="smart-alert-title" className="text-lg font-black">Create a learning alert</h2><p className="text-xs text-slate-500">{stock.symbol} · {formatINR(stock.price)} · delayed/last available</p></div></div><button type="button" onClick={onClose} aria-label="Close" className="rounded-xl border border-slate-200 p-2"><X className="h-5 w-5" /></button></div>
      <form onSubmit={save} className="mt-5 space-y-4">
        <label className="block text-xs font-black">Alert type<select value={kind} onChange={(event) => setKind(event.target.value as SmartKind)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold">{OPTIONS.map((item) => <option key={item.kind} value={item.kind}>{item.label}</option>)}</select></label>
        {kind === 'PRICE' && <div className="grid grid-cols-[120px_1fr] gap-2"><select aria-label="Price direction" value={direction} onChange={(event) => setDirection(event.target.value as 'ABOVE'|'BELOW')} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold"><option value="ABOVE">Above</option><option value="BELOW">Below</option></select><label className="relative"><span className="absolute left-3 top-3 text-xs font-black">₹</span><input aria-label="Target price" type="number" min="0.05" step="0.05" value={target} onChange={(event) => setTarget(Number(event.target.value))} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-7 pr-3 font-mono text-xs font-black" /></label></div>}
        {kind === 'EARNINGS' && <label className="block text-xs font-black">Expected earnings date<input type="date" required value={eventDate} onChange={(event) => setEventDate(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold" /></label>}
        {['MOVE_PERCENT','PE_CHANGE','SECTOR_CONCENTRATION','DRAWDOWN'].includes(kind) && <label className="block text-xs font-black">Threshold (%)<input type="number" min="1" max="80" step="1" value={threshold} onChange={(event) => setThreshold(Number(event.target.value))} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs font-black" /></label>}
        {kind === 'WEEK_52' && <div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setDirection('ABOVE')} className={`min-h-11 rounded-xl border text-xs font-black ${direction === 'ABOVE' ? 'border-emerald-500 bg-emerald-100' : 'border-slate-200'}`}>52-week high</button><button type="button" onClick={() => setDirection('BELOW')} className={`min-h-11 rounded-xl border text-xs font-black ${direction === 'BELOW' ? 'border-rose-500 bg-rose-100' : 'border-slate-200'}`}>52-week low</button></div>}
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4"><p className="text-[10px] font-black uppercase tracking-wide text-indigo-700">Why it matters</p><p className="mt-1 text-xs leading-relaxed text-indigo-950">{option.reason}</p><a href="?view=academy" className="mt-2 flex min-h-10 items-center gap-1.5 text-[11px] font-black text-indigo-700 underline"><BookOpen className="h-3.5 w-3.5" /> Open related lesson: {option.lesson}</a></div>
        {saved && <div className="flex items-center gap-2 rounded-xl bg-emerald-100 p-3 text-xs font-black text-emerald-900"><CheckCircle2 className="h-4 w-4" /> Alert saved on this device</div>}
        <div className="grid grid-cols-2 gap-2"><button type="button" onClick={onClose} className="min-h-12 rounded-xl border border-slate-200 text-xs font-black">Cancel</button><button type="submit" disabled={saved || (kind === 'PRICE' && target <= 0)} className="min-h-12 rounded-xl bg-slate-950 text-xs font-black text-white disabled:opacity-50">Save learning alert</button></div>
      </form>
    </section>
  </div>;
};
