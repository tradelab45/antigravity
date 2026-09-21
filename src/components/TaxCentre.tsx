import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Calculator,
  Coins,
  FileCheck,
  Receipt,
  Scissors,
  TrendingUp,
} from 'lucide-react';
import {
  CAPITAL_GAINS_MATRIX,
  COMPLIANCE_CALENDAR,
  NEW_REGIME_SLABS,
  OLD_REGIME_SLABS,
  TAXATION_LESSONS,
  TAX_REFERENCE_AS_OF,
  TRANSACTION_CHARGES,
} from '../data/taxationLessons';
import { formatINR } from '../utils/formatters';

const STCG_RATE = 0.20;
const LTCG_RATE = 0.125;
const LTCG_EXEMPTION = 125000;
const CESS_RATE = 0.04;

interface TaxCentreProps {
  /** Opens the matching Academy lesson in the Lessons tab. */
  onOpenLesson: (lessonId: string) => void;
}

const parseAmount = (value: string): number => {
  const parsed = Number(value.replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

const SectionCard: React.FC<{
  icon: React.ElementType;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}> = ({ icon: Icon, title, subtitle, children }) => (
  <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs sm:p-6">
    <div className="flex items-start gap-3 border-b border-slate-100 pb-4">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-indigo-600">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <h3 className="text-sm font-black text-slate-900 sm:text-base">{title}</h3>
        <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500 sm:text-xs">{subtitle}</p>
      </div>
    </div>
    <div className="pt-4">{children}</div>
  </section>
);

export const TaxCentre: React.FC<TaxCentreProps> = ({ onOpenLesson }) => {
  const [regime, setRegime] = useState<'NEW' | 'OLD'>('NEW');

  // Harvesting calculator inputs, kept as strings so the fields can be cleared.
  const [shortTermGain, setShortTermGain] = useState('200000');
  const [longTermGain, setLongTermGain] = useState('150000');
  const [harvestableLoss, setHarvestableLoss] = useState('70000');

  const harvest = useMemo(() => {
    const stcg = Math.max(0, parseAmount(shortTermGain));
    const ltcg = Math.max(0, parseAmount(longTermGain));
    const loss = Math.max(0, parseAmount(harvestableLoss));

    const taxOn = (shortTerm: number, longTerm: number) => {
      const shortTermTax = shortTerm * STCG_RATE;
      const longTermTax = Math.max(0, longTerm - LTCG_EXEMPTION) * LTCG_RATE;
      const base = shortTermTax + longTermTax;
      return base * (1 + CESS_RATE);
    };

    const taxBefore = taxOn(stcg, ltcg);

    // A short-term loss offsets short-term gains first, because those are taxed
    // at the higher 20% rate; anything left over then reduces long-term gains.
    const appliedToShortTerm = Math.min(loss, stcg);
    const appliedToLongTerm = Math.min(loss - appliedToShortTerm, ltcg);
    const carriedForward = loss - appliedToShortTerm - appliedToLongTerm;

    const taxAfter = taxOn(stcg - appliedToShortTerm, ltcg - appliedToLongTerm);

    return {
      stcg,
      ltcg,
      loss,
      taxBefore,
      taxAfter,
      saving: Math.max(0, taxBefore - taxAfter),
      appliedToShortTerm,
      appliedToLongTerm,
      carriedForward,
    };
  }, [harvestableLoss, longTermGain, shortTermGain]);

  const slabs = regime === 'NEW' ? NEW_REGIME_SLABS : OLD_REGIME_SLABS;

  return (
    <div className="rr-learn space-y-5">
      {/* Accuracy disclaimer — tax rules are rewritten every Finance Act. */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
        <div>
          <p className="text-xs font-black uppercase tracking-wider">Educational reference · {TAX_REFERENCE_AS_OF}</p>
          <p className="mt-1 text-[11px] leading-relaxed sm:text-xs">
            Every rate, slab and due date here is stated for {TAX_REFERENCE_AS_OF}. Indian tax law changes with each
            Finance Act, and your own position depends on your total income and residential status. Confirm current
            numbers on incometax.gov.in and speak to a qualified chartered accountant before filing. This is learning
            material, not tax advice.
          </p>
        </div>
      </div>

      {/* Tax modules */}
      <SectionCard
        icon={Receipt}
        title="Taxation modules"
        subtitle="Five lessons covering slabs, capital gains, harvesting, transaction taxes and filing."
      >
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-3">
          {TAXATION_LESSONS.map((lesson, index) => (
            <button
              key={lesson.id}
              type="button"
              onClick={() => onOpenLesson(lesson.id)}
              className="flex h-full flex-col rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition-all hover:border-indigo-300 hover:bg-white"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-indigo-700">
                  Module {index + 1}
                </span>
                <span className="text-[10px] font-bold text-slate-400">{lesson.readTime}</span>
              </div>
              <h4 className="mt-2 text-xs font-black leading-snug text-slate-900">{lesson.title.split(':')[0]}</h4>
              <p className="mt-1.5 flex-1 text-[11px] leading-relaxed text-slate-600">{lesson.tagline}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-black text-indigo-700">
                Open module <ArrowRight className="h-3 w-3" />
              </span>
            </button>
          ))}
        </div>
      </SectionCard>

      {/* Income tax slabs */}
      <SectionCard
        icon={Calculator}
        title="Income tax slabs"
        subtitle="Progressive layers — each slice of income is taxed at its own rate, plus 4% health and education cess."
      >
        <div className="mb-4 grid grid-cols-2 gap-2 sm:max-w-sm">
          <button
            type="button"
            aria-pressed={regime === 'NEW'}
            onClick={() => setRegime('NEW')}
            className={`min-h-11 rounded-xl border px-3 text-xs font-black transition-all ${regime === 'NEW' ? 'border-slate-900 bg-slate-900 text-white dark:border-indigo-500 dark:bg-indigo-600' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
          >
            New regime
          </button>
          <button
            type="button"
            aria-pressed={regime === 'OLD'}
            onClick={() => setRegime('OLD')}
            className={`min-h-11 rounded-xl border px-3 text-xs font-black transition-all ${regime === 'OLD' ? 'border-slate-900 bg-slate-900 text-white dark:border-indigo-500 dark:bg-indigo-600' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
          >
            Old regime
          </button>
        </div>

        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200">
          {slabs.map((slab) => (
            <li key={slab.range} className="flex items-center justify-between gap-3 bg-white px-4 py-3">
              <span className="text-xs font-bold text-slate-800">{slab.range}</span>
              <span className={`shrink-0 rounded-lg px-2.5 py-1 font-mono text-xs font-black ${slab.rate === 'Nil' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-900'}`}>
                {slab.rate}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {regime === 'NEW' ? (
            <>
              <p className="rounded-xl bg-emerald-50 p-3 text-[11px] leading-relaxed font-medium text-emerald-950">
                <strong className="font-black">Section 87A rebate:</strong> resident individuals with normal income up to
                ₹12,00,000 pay no tax. Salaried people also get a ₹75,000 standard deduction, so salary up to about
                ₹12,75,000 can be tax-free.
              </p>
              <p className="rounded-xl bg-rose-50 p-3 text-[11px] leading-relaxed font-medium text-rose-950">
                <strong className="font-black">The trap:</strong> the rebate covers income taxed at normal slab rates. It
                does <em>not</em> cover capital gains taxed at special rates under Sections 111A and 112A.
              </p>
            </>
          ) : (
            <>
              <p className="rounded-xl bg-indigo-50 p-3 text-[11px] leading-relaxed font-medium text-indigo-950">
                <strong className="font-black">Deductions survive here:</strong> Section 80C up to ₹1,50,000, Section 80D
                for health insurance, HRA and home-loan interest, plus a ₹50,000 standard deduction on salary.
              </p>
              <p className="rounded-xl bg-slate-50 p-3 text-[11px] leading-relaxed font-medium text-slate-700">
                <strong className="font-black">Worth it only if you claim:</strong> the old regime wins when your genuine
                deductions are large. With few deductions, the new regime is usually cheaper and simpler.
              </p>
            </>
          )}
        </div>
      </SectionCard>

      {/* Capital gains matrix */}
      <SectionCard
        icon={TrendingUp}
        title="Capital gains at a glance"
        subtitle="Rates effective from 23 July 2024. The holding period decides which rate applies."
      >
        {/* Cards on mobile, table from md up — no sideways scrolling on a phone. */}
        <div className="space-y-2.5 md:hidden">
          {CAPITAL_GAINS_MATRIX.map((row) => (
            <div key={row.asset} className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
              <h4 className="text-xs font-black text-slate-900">{row.asset}</h4>
              <dl className="mt-2 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-white p-2">
                  <dt className="text-[9px] font-black uppercase tracking-wide text-slate-400">Holding</dt>
                  <dd className="mt-0.5 text-[11px] font-bold text-slate-800">{row.holdingPeriod}</dd>
                </div>
                <div className="rounded-lg bg-white p-2">
                  <dt className="text-[9px] font-black uppercase tracking-wide text-slate-400">Short term</dt>
                  <dd className="mt-0.5 font-mono text-[11px] font-black text-rose-700">{row.shortTerm}</dd>
                </div>
                <div className="rounded-lg bg-white p-2">
                  <dt className="text-[9px] font-black uppercase tracking-wide text-slate-400">Long term</dt>
                  <dd className="mt-0.5 font-mono text-[11px] font-black text-emerald-700">{row.longTerm}</dd>
                </div>
              </dl>
              <p className="mt-2 text-[11px] leading-relaxed text-slate-600">{row.note}</p>
            </div>
          ))}
        </div>

        <div className="hidden overflow-hidden rounded-2xl border border-slate-200 md:block">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/80 font-black text-slate-700">
                  <th className="p-3.5">Asset</th>
                  <th className="p-3.5">Long-term after</th>
                  <th className="p-3.5 text-right">Short term</th>
                  <th className="p-3.5 text-right">Long term</th>
                  <th className="p-3.5 min-w-[220px]">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {CAPITAL_GAINS_MATRIX.map((row) => (
                  <tr key={row.asset} className="transition-colors hover:bg-slate-50/80">
                    <td className="p-3.5 font-bold text-slate-900">{row.asset}</td>
                    <td className="p-3.5 font-medium">{row.holdingPeriod}</td>
                    <td className="p-3.5 text-right font-mono font-black text-rose-700">{row.shortTerm}</td>
                    <td className="p-3.5 text-right font-mono font-black text-emerald-700">{row.longTerm}</td>
                    <td className="p-3.5 text-[11px] leading-relaxed text-slate-600">{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </SectionCard>

      {/* Harvesting calculator */}
      <SectionCard
        icon={Scissors}
        title="Tax-loss harvesting calculator"
        subtitle="See what booking an existing loss before 31 March would do to this year's capital-gains tax."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {([
            { label: 'Short-term gains realised', value: shortTermGain, setter: setShortTermGain, hint: 'Taxed at 20%' },
            { label: 'Long-term gains realised', value: longTermGain, setter: setLongTermGain, hint: '12.5% above ₹1.25L' },
            { label: 'Loss you could book', value: harvestableLoss, setter: setHarvestableLoss, hint: 'Unrealised, before 31 Mar' },
          ] as const).map((field) => (
            <label key={field.label} className="block">
              <span className="block text-[11px] font-black uppercase tracking-wide text-slate-500">{field.label}</span>
              <span className="mt-1.5 flex items-center rounded-xl border border-slate-200 bg-white focus-within:border-indigo-400">
                <span className="pl-3 font-mono text-sm font-black text-slate-400">₹</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={field.value}
                  onChange={(event) => field.setter(event.target.value)}
                  className="w-full bg-transparent px-2 py-2.5 font-mono text-sm font-bold text-slate-900 outline-none"
                />
              </span>
              <span className="mt-1 block text-[10px] font-bold text-slate-400">{field.hint}</span>
            </label>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">Tax without harvesting</p>
            <p className="mt-1 font-mono text-xl font-black text-slate-900">{formatINR(harvest.taxBefore, false)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">Tax after harvesting</p>
            <p className="mt-1 font-mono text-xl font-black text-slate-900">{formatINR(harvest.taxAfter, false)}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-wide text-emerald-700">Tax deferred this year</p>
            <p className="mt-1 font-mono text-xl font-black text-emerald-800">{formatINR(harvest.saving, false)}</p>
          </div>
        </div>

        <ul className="mt-4 space-y-1.5 text-[11px] leading-relaxed text-slate-600">
          <li>
            <strong className="font-black text-slate-900">How the loss was applied:</strong>{' '}
            {formatINR(harvest.appliedToShortTerm, false)} against short-term gains (the higher 20% rate first),{' '}
            {formatINR(harvest.appliedToLongTerm, false)} against long-term gains
            {harvest.carriedForward > 0 && `, and ${formatINR(harvest.carriedForward, false)} carried forward for up to eight assessment years`}.
          </li>
          <li>
            <strong className="font-black text-slate-900">Carry-forward condition:</strong> file your return by the
            Section 139(1) due date, otherwise the unused loss is lost permanently.
          </li>
          <li>
            <strong className="font-black text-slate-900">Net it against costs:</strong> STT, brokerage, stamp duty, GST
            and the bid-ask spread all apply to the harvest trade. Harvest only when the tax saved clearly exceeds them.
          </li>
          <li>
            This calculator covers capital gains only. It ignores other income, surcharge, and any set-off from earlier
            years. Includes 4% cess.
          </li>
        </ul>
      </SectionCard>

      {/* Transaction charges */}
      <SectionCard
        icon={Coins}
        title="Taxes on every trade"
        subtitle="These are charged on the transaction value, whether the trade wins or loses."
      >
        <div className="space-y-2.5 lg:hidden">
          {TRANSACTION_CHARGES.map((row) => (
            <div key={row.charge} className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
              <h4 className="text-xs font-black text-slate-900">{row.charge}</h4>
              <dl className="mt-2 space-y-1.5 text-[11px]">
                <div className="flex justify-between gap-3"><dt className="font-bold text-slate-500">Delivery</dt><dd className="text-right font-medium text-slate-800">{row.delivery}</dd></div>
                <div className="flex justify-between gap-3"><dt className="font-bold text-slate-500">Intraday</dt><dd className="text-right font-medium text-slate-800">{row.intraday}</dd></div>
                <div className="flex justify-between gap-3"><dt className="font-bold text-slate-500">F&amp;O</dt><dd className="text-right font-medium text-slate-800">{row.derivatives}</dd></div>
              </dl>
            </div>
          ))}
        </div>

        <div className="hidden overflow-hidden rounded-2xl border border-slate-200 lg:block">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/80 font-black text-slate-700">
                <th className="p-3.5">Charge</th>
                <th className="p-3.5">Delivery equity</th>
                <th className="p-3.5">Intraday equity</th>
                <th className="p-3.5">Equity F&amp;O</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {TRANSACTION_CHARGES.map((row) => (
                <tr key={row.charge} className="transition-colors hover:bg-slate-50/80">
                  <td className="p-3.5 font-bold text-slate-900">{row.charge}</td>
                  <td className="p-3.5 font-medium">{row.delivery}</td>
                  <td className="p-3.5 font-medium">{row.intraday}</td>
                  <td className="p-3.5 font-medium">{row.derivatives}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 rounded-xl bg-slate-50 p-3 text-[11px] leading-relaxed font-medium text-slate-700">
          Brokerage, stamp duty and exchange charges are deductible against capital gains. <strong className="font-black">STT is
          not</strong> deductible against gains taxed under Sections 111A and 112A — unless your activity is assessed as
          business income, where it becomes a business expense.
        </p>
      </SectionCard>

      {/* Compliance calendar */}
      <SectionCard
        icon={CalendarDays}
        title="Investor tax calendar"
        subtitle="Advance tax instalments and filing deadlines an individual investor is affected by."
      >
        <ol className="space-y-2">
          {COMPLIANCE_CALENDAR.map((entry) => (
            <li key={`${entry.date}-${entry.requirement}`} className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 sm:flex-row sm:items-center sm:gap-4">
              <span className="w-full shrink-0 rounded-lg bg-slate-900 px-2.5 py-1 text-center font-mono text-[11px] font-black text-white dark:bg-indigo-700 sm:w-36">
                {entry.date}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-black text-slate-900">{entry.requirement}</span>
                <span className="mt-0.5 block text-[11px] leading-relaxed text-slate-600">{entry.detail}</span>
              </span>
            </li>
          ))}
        </ol>
      </SectionCard>

      {/* Legal boundary */}
      <SectionCard
        icon={FileCheck}
        title="Planning vs evasion"
        subtitle="Where legitimate tax planning ends and prosecutable evasion begins."
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <h4 className="text-xs font-black uppercase tracking-wide text-emerald-900">Legal planning</h4>
            <ul className="mt-2 space-y-1.5 text-[11px] leading-relaxed font-medium text-emerald-950">
              <li>• Using the ₹1,25,000 annual long-term exemption each year</li>
              <li>• Booking a genuine loss before 31 March to offset real gains</li>
              <li>• Holding past 12 months so the 12.5% rate applies instead of 20%</li>
              <li>• Choosing the regime that genuinely costs you less</li>
              <li>• Filing on time so losses carry forward for eight years</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <h4 className="text-xs font-black uppercase tracking-wide text-rose-900">Evasion — prosecutable</h4>
            <ul className="mt-2 space-y-1.5 text-[11px] leading-relaxed font-medium text-rose-950">
              <li>• Leaving capital gains out of your return when the AIS reports them</li>
              <li>• Fabricating losses or backdating contract notes</li>
              <li>• Routing trades through another person's account to split income</li>
              <li>• Claiming deductions for payments never made</li>
            </ul>
            <p className="mt-2 text-[11px] font-black text-rose-900">Concealment is punishable under Section 276C.</p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
};
