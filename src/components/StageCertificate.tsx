import React, { useRef, useState } from 'react';
import { Award, Download } from 'lucide-react';

interface StageCertificateProps {
  learnerName: string;
  stageName: string;
  stageNumber: number;
  /** The best score, out of `total`. */
  score: number;
  total: number;
  /** When the stage was first cleared, epoch ms. */
  passedAt: number;
  attempts: number;
}

const formatDate = (at: number) =>
  new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(at));

/**
 * A certificate for a stage the learner actually cleared.
 *
 * Every figure on it comes from their own attempt history — the score they
 * scored, the day they cleared it, how many papers it took. Nothing is
 * rounded up or filled in, because this is the artefact most likely to be
 * screenshotted and sent to somebody.
 *
 * The PNG is drawn on a canvas rather than rasterised from the DOM: no extra
 * dependency, it works offline, and the output does not depend on which fonts
 * the browser happened to load.
 */
export const StageCertificate: React.FC<StageCertificateProps> = ({
  learnerName,
  stageName,
  stageNumber,
  score,
  total,
  passedAt,
  attempts,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [saved, setSaved] = useState(false);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const width = 1200;
    const height = 750;
    canvas.width = width;
    canvas.height = height;

    context.fillStyle = '#0b1220';
    context.fillRect(0, 0, width, height);

    // A thin inner rule, the way a printed certificate is framed.
    context.strokeStyle = '#1fc392';
    context.lineWidth = 3;
    context.strokeRect(36, 36, width - 72, height - 72);
    context.strokeStyle = 'rgba(31, 195, 146, 0.35)';
    context.lineWidth = 1;
    context.strokeRect(52, 52, width - 104, height - 104);

    const centre = (text: string, y: number, font: string, colour: string) => {
      context.font = font;
      context.fillStyle = colour;
      context.textAlign = 'center';
      context.fillText(text, width / 2, y);
    };

    centre('RUPEEROOKIE INVESTOR ACADEMY', 140, 'bold 22px monospace', '#1fc392');
    centre('Certificate of completion', 205, '600 30px system-ui, sans-serif', '#94a3b8');

    centre('This certifies that', 285, '400 22px system-ui, sans-serif', '#cbd5e1');
    centre(learnerName, 355, 'bold 54px system-ui, sans-serif', '#ffffff');

    centre(`has completed Stage ${stageNumber} — ${stageName}`, 425, '400 24px system-ui, sans-serif', '#cbd5e1');
    centre(
      `passing the ${total}-question paper with ${score} of ${total}`,
      470,
      '600 24px system-ui, sans-serif',
      '#1fc392',
    );

    centre(
      `${formatDate(passedAt)}  ·  ${attempts} attempt${attempts === 1 ? '' : 's'}`,
      560,
      '400 20px monospace',
      '#94a3b8',
    );
    centre(
      'Educational simulation. No real money was invested.',
      640,
      '400 17px system-ui, sans-serif',
      '#64748b',
    );

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rupeerookie-stage-${stageNumber}-${learnerName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 4000);
    }, 'image/png');
  };

  return (
    <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/40">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
            <Award className="h-3.5 w-3.5" /> Stage {stageNumber} certificate
          </h4>
          <p className="mt-1 text-xs leading-relaxed text-emerald-900 dark:text-emerald-100">
            <strong>{learnerName}</strong> cleared <strong>{stageName}</strong> with{' '}
            <strong>{score}/{total}</strong> on {formatDate(passedAt)}, in {attempts} attempt
            {attempts === 1 ? '' : 's'}.
          </p>
        </div>

        <button
          type="button"
          onClick={download}
          className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-xl bg-emerald-700 px-3 text-[11px] font-black text-white transition-colors hover:bg-emerald-800"
        >
          <Download className="h-3.5 w-3.5" />
          {saved ? 'Saved' : 'Download PNG'}
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
    </div>
  );
};

export default StageCertificate;
