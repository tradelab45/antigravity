import React, { useEffect, useId, useRef, useState } from 'react';
import { Table2 } from 'lucide-react';

interface ChartFigureProps {
  /** What the chart is, in a few words. Announced before the summary. */
  title: string;
  /** The measured description, built from the chart's own data. */
  summary: string;
  /** Column headings for the numbers behind the chart. */
  columns?: [string, string];
  /** The numbers themselves, as rows of already-formatted text. */
  rows?: string[][];
  children: React.ReactNode;
  className?: string;
}

/**
 * Wraps a chart in something a screen reader can read.
 *
 * Recharts draws an SVG with no accessible content at all, so a learner using
 * a screen reader was told a section existed and never what was in it. The
 * drawing is marked as decoration and the meaning is carried by text: a
 * summary built from the same array the chart plots, and the numbers
 * themselves in a table.
 *
 * The table is offered to everyone rather than hidden away. Reading a value
 * off a chart is guesswork, and this app's whole argument is that a figure
 * should be the measured one.
 */
export const ChartFigure: React.FC<ChartFigureProps> = ({
  title,
  summary,
  columns,
  rows,
  children,
  className = '',
}) => {
  const summaryId = useId();
  const drawing = useRef<HTMLDivElement | null>(null);
  const [showTable, setShowTable] = useState(false);
  const hasTable = Array.isArray(rows) && rows.length > 0 && Boolean(columns);

  /**
   * Takes the drawing out of the tab order.
   *
   * Recharts gives its SVG surface `tabindex="0"`, so marking the drawing as
   * decoration left an element a keyboard could land on and a screen reader
   * would announce as nothing — a silent stop on the way through the page,
   * which is worse than the silence this replaced. Done after each render
   * because the chart is rebuilt whenever its data changes.
   */
  useEffect(() => {
    const container = drawing.current;
    if (!container) return;
    const focusable = container.querySelectorAll<HTMLElement>(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    focusable.forEach((node) => node.setAttribute('tabindex', '-1'));
  });

  return (
    <figure className={`m-0 ${className}`} role="group" aria-labelledby={summaryId}>
      {/* The picture is decoration once the numbers are in the page as text. */}
      <div ref={drawing} aria-hidden="true">
        {children}
      </div>

      <figcaption>
        <p id={summaryId} className="sr-only">
          {title}. {summary}
        </p>

        {hasTable && (
          <>
            <button
              type="button"
              onClick={() => setShowTable((open) => !open)}
              aria-expanded={showTable}
              className="mt-1 inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-[11px] font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <Table2 className="h-3.5 w-3.5" aria-hidden="true" />
              {showTable ? 'Hide the numbers' : 'Show the numbers'}
            </button>

            {showTable && (
              <div className="mt-2 max-h-56 overflow-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left text-[11px]">
                  <caption className="sr-only">{title}</caption>
                  <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800">
                    <tr>
                      <th scope="col" className="px-2 py-1.5 font-black text-slate-800 dark:text-slate-100">
                        {columns![0]}
                      </th>
                      <th scope="col" className="px-2 py-1.5 text-right font-black text-slate-800 dark:text-slate-100">
                        {columns![1]}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows!.map((row, index) => (
                      <tr key={`${row[0]}-${index}`} className="border-t border-slate-100 dark:border-slate-800">
                        <th scope="row" className="px-2 py-1 font-semibold text-slate-700 dark:text-slate-200">
                          {row[0]}
                        </th>
                        <td className="px-2 py-1 text-right font-mono text-slate-900 dark:text-white">
                          {row[1]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </figcaption>
    </figure>
  );
};

export default ChartFigure;
