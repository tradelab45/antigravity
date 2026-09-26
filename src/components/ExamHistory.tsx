import React, { useMemo, useState } from 'react';
import { Award, Download, Share2, RefreshCw, ChevronDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { LEARNING_PATH } from '../data/learningPath';
import { EXAM_PASS_MARK } from '../data/stageExams';
import type { ExamAttempt } from '../utils/academyProgress';
import { ChartFigure } from './ui/chart-figure';
import { describeSeries } from '../utils/chartSummary';

async function certificateFile(attempt: ExamAttempt, name: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 1400; canvas.height = 900;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Certificate export is unavailable in this browser.');
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 1400, 900);
  ctx.strokeStyle = '#047857'; ctx.lineWidth = 8; ctx.strokeRect(32, 32, 1336, 836);
  ctx.textAlign = 'center';
  const line = (text: string, y: number, size: number, color = '#172033') => {
    ctx.fillStyle = color;
    ctx.font = `600 ${size}px system-ui, sans-serif`;
    while (ctx.measureText(text).width > 1220 && size > 14) ctx.font = `600 ${--size}px system-ui, sans-serif`;
    ctx.fillText(text, 700, y);
  };
  line('RupeeRookie Academy', 130, 34, '#047857');
  line('STAGE COMPLETION', 230, 48);
  line(name.trim() || 'Learner', 350, 46);
  line(`${LEARNING_PATH.find(stage => stage.id === attempt.stageId)?.name} stage`, 435, 36);
  line(`Score: ${attempt.score} / ${attempt.total}`, 515, 32, '#047857');
  line(new Date(attempt.completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' }), 580, 24);
  line('Unproctored educational assessment. Not an accredited qualification.', 710, 21);
  line('Learner-generated completion record. Not proof of investment competence.', 750, 19);
  line(`Record ID: ${attempt.id}`, 805, 17);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Export failed.')), 'image/png'));
  return new File([blob], `RupeeRookie-${attempt.stageId}-certificate.png`, { type: 'image/png' });
}

export function ExamHistory({ attempts, name, notice, onSync }: { attempts: ExamAttempt[]; name: string; notice: string; onSync: () => void }) {
  const [stage, setStage] = useState('ALL');
  const [visibleCount, setVisibleCount] = useState(20);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [certificateName, setCertificateName] = useState(name);
  const filtered = useMemo(() => attempts.filter(attempt => stage === 'ALL' || attempt.stageId === stage), [attempts, stage]);
  const latest = filtered.slice(-20);
  const download = async (attempt: ExamAttempt, share: boolean) => {
    setBusy(true); setMessage('');
    try {
      const file = await certificateFile(attempt, certificateName);
      if (share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'My RupeeRookie stage certificate' });
      } else {
        const url = URL.createObjectURL(file);
        const link = document.createElement('a'); link.href = url; link.download = file.name; link.click();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        setMessage(share ? 'Certificate downloaded. File sharing is not supported by this browser.' : 'Certificate downloaded.');
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) setMessage('Certificate export failed. Please try again.');
    } finally { setBusy(false); }
  };
  return <section className="border-t border-slate-200 py-5 text-slate-900 dark:border-slate-700 dark:text-white" aria-label="Exam history">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h3 className="flex items-center gap-2 text-base font-bold"><Award size={20} /> Exam history & certificates</h3>
      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor="history-stage">History stage</label>
        <select id="history-stage" value={stage} onChange={e => { setStage(e.target.value); setVisibleCount(20); }} className="max-w-full rounded border border-slate-300 bg-white p-2 text-xs dark:border-slate-600 dark:bg-slate-900">
          <option value="ALL">All stages</option>{LEARNING_PATH.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <button type="button" onClick={onSync} title="Sync scores" aria-label="Sync scores" className="p-2"><RefreshCw size={18} /></button>
      </div>
    </div>
    <p className="mt-2 text-xs text-slate-600 dark:text-slate-300" role="status">{notice}</p>
    {!filtered.length ? <p className="py-6 text-sm">No recorded attempts yet. Earlier best scores are preserved; new attempts appear here with their dates.</p> : <>
      {latest.length > 1 && (
        // The summary is built from the attempts the line plots, so it says
        // which way the scores went rather than only that a trend exists. The
        // exact scores are in the table below, so the figure offers no second
        // copy of them.
        <ChartFigure
          title="Score trend for the latest attempts"
          summary={describeSeries(
            `Exam scores out of ${latest[0]?.total ?? 20}`,
            latest.map((item, i) => ({ label: `attempt ${i + 1}`, value: item.score })),
          )}
          className="mt-4"
        >
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%"><LineChart data={latest.map((item, i) => ({ attempt: i + 1, score: item.score }))}>
              <XAxis dataKey="attempt" tick={{ fill: '#64748b', fontSize: 12 }} /><YAxis domain={[0, 20]} width={28} tick={{ fill: '#64748b', fontSize: 12 }} /><Tooltip />
              <Line type="linear" dataKey="score" stroke="#047857" strokeWidth={3} isAnimationActive={false} />
            </LineChart></ResponsiveContainer>
          </div>
        </ChartFigure>
      )}
      <label className="mt-4 block text-xs font-semibold">Name on certificate
        <input value={certificateName} maxLength={70} onChange={e => setCertificateName(e.target.value)} autoComplete="off" className="mt-1 block w-full max-w-md rounded border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900" />
      </label>
      <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-xs">
        <caption className="sr-only">Exam attempts, newest first</caption>
        <thead><tr className="border-b border-slate-300"><th className="py-2">Stage / date</th><th>Score</th><th className="text-right">Certificate</th></tr></thead>
        <tbody>{filtered.slice(-visibleCount).reverse().map(attempt => <tr key={attempt.id} className="border-b border-slate-200 dark:border-slate-700">
          <td className="py-3"><span className="font-semibold">{LEARNING_PATH.find(s => s.id === attempt.stageId)?.name}</span><time className="mt-1 block text-slate-600 dark:text-slate-300" dateTime={attempt.completedAt}>{new Date(attempt.completedAt).toLocaleString('en-IN')}</time></td>
          <td className="whitespace-nowrap px-2">{attempt.score}/{attempt.total}<span className="block text-[11px]">{attempt.score >= EXAM_PASS_MARK ? 'Passed' : 'Retry'}</span></td>
          <td className="text-right">{attempt.score >= EXAM_PASS_MARK ? <div className="flex justify-end gap-1">
            <button type="button" disabled={busy} aria-label="Download certificate" title="Download certificate" onClick={() => void download(attempt, false)} className="rounded p-2 hover:bg-emerald-50 dark:hover:bg-slate-800"><Download size={18} /></button>
            <button type="button" disabled={busy} aria-label="Share certificate" title="Share certificate" onClick={() => void download(attempt, true)} className="rounded p-2 hover:bg-emerald-50 dark:hover:bg-slate-800"><Share2 size={18} /></button>
          </div> : <span className="text-slate-600 dark:text-slate-300">Not yet</span>}</td>
        </tr>)}</tbody>
      </table></div>
      {filtered.length > visibleCount && <button type="button" onClick={() => setVisibleCount(count => count + 20)} className="mt-3 flex items-center gap-1 text-sm underline"><ChevronDown size={16} /> Older attempts ({filtered.length - visibleCount})</button>}
    </>}
    <p role="status" className="mt-2 text-xs">{message}</p>
  </section>;
}
