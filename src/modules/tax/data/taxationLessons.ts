import { Lesson } from '../../../types';

/**
 * Taxation modules for the Investor Academy.
 *
 * Every rate, slab, threshold and due date below is stated for
 * FY 2025-26 (Assessment Year 2026-27). Indian tax law is rewritten by the
 * Finance Act every year, so the Academy shows TAX_REFERENCE_AS_OF beside this
 * material and tells learners to confirm current numbers on incometax.gov.in
 * before acting. This is educational content, not tax advice.
 */
export const TAX_REFERENCE_AS_OF = 'FY 2025-26 (Assessment Year 2026-27)';

export interface TaxSlabRow {
  range: string;
  rate: string;
}

/** New (default) regime slabs under Section 115BAC for FY 2025-26. */
export const NEW_REGIME_SLABS: TaxSlabRow[] = [
  { range: 'Up to ₹4,00,000', rate: 'Nil' },
  { range: '₹4,00,001 – ₹8,00,000', rate: '5%' },
  { range: '₹8,00,001 – ₹12,00,000', rate: '10%' },
  { range: '₹12,00,001 – ₹16,00,000', rate: '15%' },
  { range: '₹16,00,001 – ₹20,00,000', rate: '20%' },
  { range: '₹20,00,001 – ₹24,00,000', rate: '25%' },
  { range: 'Above ₹24,00,000', rate: '30%' },
];

/** Old regime slabs for an individual below 60 years of age. */
export const OLD_REGIME_SLABS: TaxSlabRow[] = [
  { range: 'Up to ₹2,50,000', rate: 'Nil' },
  { range: '₹2,50,001 – ₹5,00,000', rate: '5%' },
  { range: '₹5,00,001 – ₹10,00,000', rate: '20%' },
  { range: 'Above ₹10,00,000', rate: '30%' },
];

export interface CapitalGainRow {
  asset: string;
  holdingPeriod: string;
  shortTerm: string;
  longTerm: string;
  note: string;
}

/** Capital gains treatment after the 23 July 2024 rationalisation. */
export const CAPITAL_GAINS_MATRIX: CapitalGainRow[] = [
  {
    asset: 'Listed equity shares (STT paid)',
    holdingPeriod: '12 months',
    shortTerm: '20% (Sec 111A)',
    longTerm: '12.5% (Sec 112A)',
    note: 'First ₹1,25,000 of long-term gains each year is exempt.',
  },
  {
    asset: 'Equity-oriented mutual funds / ETFs',
    holdingPeriod: '12 months',
    shortTerm: '20% (Sec 111A)',
    longTerm: '12.5% (Sec 112A)',
    note: 'Shares the same ₹1,25,000 annual long-term exemption.',
  },
  {
    asset: 'Debt mutual funds bought on or after 1 Apr 2023',
    holdingPeriod: 'No long-term benefit',
    shortTerm: 'Your slab rate',
    longTerm: 'Your slab rate',
    note: 'Specified mutual funds under Section 50AA are always taxed at slab rates.',
  },
  {
    asset: 'Gold, unlisted shares, property',
    holdingPeriod: '24 months',
    shortTerm: 'Your slab rate',
    longTerm: '12.5% without indexation',
    note: 'Resident individuals may choose 20% with indexation for property bought before 23 Jul 2024.',
  },
  {
    asset: 'Intraday equity trades',
    holdingPeriod: 'Not capital gains',
    shortTerm: 'Your slab rate',
    longTerm: '—',
    note: 'Treated as speculative business income, not capital gains.',
  },
  {
    asset: 'Equity F&O',
    holdingPeriod: 'Not capital gains',
    shortTerm: 'Your slab rate',
    longTerm: '—',
    note: 'Treated as non-speculative business income.',
  },
];

export interface TransactionChargeRow {
  charge: string;
  delivery: string;
  intraday: string;
  derivatives: string;
}

/** Statutory transaction charges an Indian equity investor actually pays. */
export const TRANSACTION_CHARGES: TransactionChargeRow[] = [
  {
    charge: 'Securities Transaction Tax (STT)',
    delivery: '0.1% on buy and 0.1% on sell',
    intraday: '0.025% on the sell side only',
    derivatives: 'Futures 0.02% on sell; options 0.1% of premium on sell',
  },
  {
    charge: 'Stamp duty (buy side only)',
    delivery: '0.015%',
    intraday: '0.003%',
    derivatives: 'Futures 0.002%; options 0.003%',
  },
  {
    charge: 'GST',
    delivery: '18% on brokerage + exchange charges',
    intraday: '18% on brokerage + exchange charges',
    derivatives: '18% on brokerage + exchange charges',
  },
  {
    charge: 'SEBI turnover fee',
    delivery: '₹10 per ₹1 crore of turnover',
    intraday: '₹10 per ₹1 crore of turnover',
    derivatives: '₹10 per ₹1 crore of turnover',
  },
];

export interface ComplianceDate {
  date: string;
  requirement: string;
  detail: string;
}

/** The compliance calendar a retail investor is realistically affected by. */
export const COMPLIANCE_CALENDAR: ComplianceDate[] = [
  { date: '15 June', requirement: 'Advance tax instalment 1', detail: '15% of the estimated annual tax liability.' },
  { date: '15 September', requirement: 'Advance tax instalment 2', detail: 'Cumulative 45% of the estimated liability.' },
  { date: '15 December', requirement: 'Advance tax instalment 3', detail: 'Cumulative 75% of the estimated liability.' },
  { date: '15 March', requirement: 'Advance tax instalment 4', detail: '100% of the estimated liability for the financial year.' },
  { date: '31 March', requirement: 'Financial year closes', detail: 'Last day to realise a loss or gain inside this tax year.' },
  { date: '15 June (next FY)', requirement: 'Form 16 / AIS available', detail: 'Reconcile your broker P&L against the AIS and Form 26AS.' },
  { date: '31 July', requirement: 'ITR due date (no audit)', detail: 'File on time or you lose the right to carry losses forward.' },
  { date: '31 October', requirement: 'ITR due date (audit cases)', detail: 'Applies when a tax audit under Section 44AB is required.' },
];

export const TAXATION_LESSONS: Lesson[] = [
  {
    id: 'lesson-tax-1',
    title: 'Income Tax Foundations: Slabs, Regimes & How Your Tax Is Actually Computed',
    tagline: 'Understand why a ₹12,10,000 income is not taxed at a flat 15%',
    category: 'Taxation',
    readTime: '7 min read',
    xpReward: 150,
    iconName: 'Receipt',
    summary: 'Learn how India\'s slab system works, how the new and old regimes differ, and why the marginal rate you hear about is never the rate you actually pay on your whole income.',
    sections: [
      {
        heading: 'Slabs Are Layers, Not a Single Rate',
        content: `India taxes individuals using **progressive slabs**. Your income is sliced into layers and each layer is taxed at its own rate. Nobody pays 30% on their entire income the moment they cross a threshold.\n\nUnder the **new regime** (the default since FY 2023-24, governed by Section 115BAC) the layers for FY 2025-26 are:\n- Up to ₹4,00,000 — Nil\n- ₹4,00,001 to ₹8,00,000 — 5%\n- ₹8,00,001 to ₹12,00,000 — 10%\n- ₹12,00,001 to ₹16,00,000 — 15%\n- ₹16,00,001 to ₹20,00,000 — 20%\n- ₹20,00,001 to ₹24,00,000 — 25%\n- Above ₹24,00,000 — 30%\n\nOn top of the computed tax, a **Health and Education Cess of 4%** is added. High incomes also attract a surcharge.`,
        exampleBox: {
          title: 'The Staircase Analogy 🪜',
          description: 'Think of your income climbing a staircase. Each step has its own toll. Stepping onto the 15% step does not make you re-pay the lower steps at 15%.',
          analogy: 'On ₹14,00,000 of income you pay nothing on the first ₹4L, 5% on the next ₹4L (₹20,000), 10% on the next ₹4L (₹40,000) and 15% on only the final ₹2L (₹30,000) — ₹90,000 plus cess, not ₹2,10,000.'
        }
      },
      {
        heading: 'The Section 87A Rebate: Why ₹12 Lakh Can Mean Zero Tax',
        content: `The **Section 87A rebate** wipes out the computed tax for modest incomes. For FY 2025-26 under the new regime, a resident individual with normal income up to **₹12,00,000** gets a rebate of up to ₹60,000, which cancels the tax entirely.\n\nA salaried person also gets a **standard deduction of ₹75,000** under the new regime, so salary up to roughly **₹12,75,000** can end up with no tax.\n\n**Three traps students miss:**\n1. The rebate applies to income taxed at *normal* slab rates. Capital gains taxed at special rates under Sections 111A and 112A are **excluded** from the rebate — your ₹12L "tax-free" headline does not cover your trading profits.\n2. The rebate is for **resident** individuals only.\n3. Marginal relief softens the cliff just above ₹12,00,000, so the extra tax cannot exceed the extra income.`
      },
      {
        heading: 'New Regime vs Old Regime: A Genuine Trade-Off',
        content: `The **old regime** keeps higher slab rates (Nil to ₹2.5L, 5% to ₹5L, 20% to ₹10L, 30% above) but lets you claim deductions: Section 80C up to ₹1,50,000, Section 80D health insurance, HRA, home-loan interest, and more.\n\nThe **new regime** has wider, gentler slabs but removes almost all of those deductions.\n\nThe honest answer to "which is better" is: **it depends on how much you genuinely deduct.**\n- If you actually invest in ELSS, pay a home loan and claim HRA, the old regime can still win.\n- If you do not have large deductions, the new regime is usually cheaper and much simpler.\n\nSalaried taxpayers can switch regimes each year at the time of filing. Taxpayers with business income (including F&O traders) face restrictions on switching back and forth.`
      },
      {
        heading: 'Why This Matters Before You Trade',
        content: `Your slab rate is not trivia — it directly prices several of your investing decisions:\n- **Intraday and F&O profits** are business income taxed at your slab rate, so a 30% slab makes short-term trading far more expensive than a 12.5% long-term equity holding.\n- **Debt fund gains** are taxed at your slab rate, which is why they suit lower-slab investors.\n- **Dividends** are added to your total income and taxed at your slab rate.\n\nBefore comparing two strategies, compare them **after tax**. A strategy earning 14% taxed at 30% leaves less than one earning 12% taxed at 12.5%.`
      }
    ],
    keyTakeaways: [
      'Slabs are layers: crossing a threshold only taxes the amount above it at the higher rate.',
      'The Section 87A rebate can make normal income up to ₹12,00,000 tax-free, but it does not cover capital gains at special rates.',
      'The new regime trades deductions for wider slabs; the old regime only wins if you genuinely claim large deductions.',
      'Your slab rate directly determines the real cost of intraday, F&O, debt-fund and dividend income.'
    ],
    quiz: {
      question: 'Under the new regime for FY 2025-26, a resident with ₹13,00,000 of salary income moves into the 15% slab. What does that mean?',
      options: [
        {
          id: 'tax1-opt-1',
          text: 'Only the income above ₹12,00,000 is taxed at 15%; the lower layers keep their own lower rates',
          isCorrect: true,
          explanation: 'Correct. India uses progressive slabs, so each layer of income is taxed at that layer\'s rate.'
        },
        {
          id: 'tax1-opt-2',
          text: 'The entire ₹13,00,000 is taxed at a flat 15%',
          isCorrect: false,
          explanation: 'That would be a flat tax. India taxes each slab layer separately.'
        },
        {
          id: 'tax1-opt-3',
          text: 'Crossing ₹12,00,000 means the whole income loses the basic exemption',
          isCorrect: false,
          explanation: 'The nil-rate first layer always applies. Only the Section 87A rebate is withdrawn, and marginal relief limits that shock.'
        },
        {
          id: 'tax1-opt-4',
          text: 'Salary above ₹12,00,000 is tax-free because of Section 87A',
          isCorrect: false,
          explanation: 'The rebate applies up to ₹12,00,000 of normal income; above that, tax is computed slab by slab.'
        }
      ]
    }
  },
  {
    id: 'lesson-tax-2',
    title: 'Capital Gains on Shares: STCG, LTCG and the ₹1.25 Lakh Exemption',
    tagline: 'The single most important tax rule for anyone holding equity',
    category: 'Taxation',
    readTime: '8 min read',
    xpReward: 170,
    iconName: 'TrendingUp',
    summary: 'Master how long-term and short-term equity gains are taxed after the July 2024 rationalisation, how the annual exemption works, and how grandfathering protects pre-2018 holdings.',
    sections: [
      {
        heading: 'The Clock Decides the Rate',
        content: `For **listed equity shares and equity-oriented mutual funds on which STT is paid**, one number decides your tax rate: how many months you held the investment.\n\n- Sold **within 12 months** → **Short-Term Capital Gain (STCG)**, taxed at **20%** under Section 111A.\n- Sold **after 12 months** → **Long-Term Capital Gain (LTCG)**, taxed at **12.5%** under Section 112A.\n\nThese rates apply from 23 July 2024. Before that date STCG was 15% and LTCG was 10%.\n\nThe holding period is counted from the **date of purchase to the date of sale**, and Indian brokers apply **FIFO** (first-in, first-out) when you sell part of a position built over several purchases.`,
        exampleBox: {
          title: 'One Day Can Cost You Thousands 📅',
          description: 'You buy 100 shares at ₹1,000 on 10 April and they are worth ₹1,400 the following 5 April.',
          analogy: 'Selling on 5 April (within 12 months) makes ₹40,000 short-term: ₹8,000 of tax at 20%. Waiting five more days makes it long-term: it falls inside the ₹1,25,000 annual exemption and the tax is zero.'
        }
      },
      {
        heading: 'The ₹1,25,000 Annual Long-Term Exemption',
        content: `Every financial year, the **first ₹1,25,000 of long-term capital gains** from listed equity and equity mutual funds is exempt. Only the gain above that is taxed at 12.5%.\n\n$$\\text{LTCG tax} = (\\text{Total LTCG} - 125000) \\times 12.5\\%$$\n\nThis exemption is:\n- **Per person, per financial year** — it does not carry forward if unused.\n- **Pooled across all your equity and equity-MF long-term gains**, not per stock.\n- **Not available** for short-term gains or for gains on debt funds.\n\n**Practical use:** an investor sitting on large long-term profits can realise roughly ₹1,25,000 of gain each year — sometimes reinvesting immediately — and legally step up their cost base without paying tax. This is called *exemption harvesting*, and it is the mirror image of loss harvesting.`
      },
      {
        heading: 'Grandfathering: Your Pre-2018 Cost Is Protected',
        content: `LTCG on equity was reintroduced on 1 February 2018. To avoid taxing gains that had already accrued, Section 112A **grandfathers** older holdings.\n\nFor shares bought **before 31 January 2018**, your cost of acquisition is taken as:\n\n**the higher of** (a) the actual purchase price, and (b) **the lower of** the fair market value on 31 January 2018 and the actual sale price.\n\nIn plain terms: appreciation up to 31 January 2018 is not taxed. If you inherited a family portfolio bought decades ago, this rule can remove a very large notional gain.`
      },
      {
        heading: 'Other Instruments, Other Rules',
        content: `Not everything is taxed like listed equity:\n- **Debt mutual funds purchased on or after 1 April 2023** are "specified mutual funds" under Section 50AA. There is **no long-term benefit** — gains are added to income and taxed at your slab rate however long you hold.\n- **Gold, unlisted shares and property** have a **24-month** holding period. Long-term gains are 12.5% without indexation; resident individuals may instead choose 20% with indexation for property acquired before 23 July 2024.\n- **Dividends** are not capital gains at all. They are added to your total income and taxed at your slab rate, with 10% TDS deducted by the company once dividends from it cross ₹10,000 in a financial year.\n- **Intraday trading** is speculative business income and **F&O** is non-speculative business income. Neither is a capital gain, and both are taxed at your slab rate.`
      }
    ],
    keyTakeaways: [
      'Listed equity: 20% short-term under 12 months, 12.5% long-term beyond 12 months (rates effective 23 July 2024).',
      'The first ₹1,25,000 of long-term equity gains each financial year is exempt, pooled across all holdings and not carried forward.',
      'Shares bought before 31 January 2018 are grandfathered, so pre-2018 appreciation is not taxed.',
      'Debt funds bought after 1 April 2023, intraday profits and F&O profits are all taxed at your slab rate, not at capital-gains rates.'
    ],
    quiz: {
      question: 'You realise ₹1,80,000 of long-term capital gains on listed shares in one financial year and nothing else. What is the long-term tax?',
      options: [
        {
          id: 'tax2-opt-1',
          text: '12.5% on ₹55,000, because the first ₹1,25,000 is exempt — about ₹6,875 plus cess',
          isCorrect: true,
          explanation: 'Correct. Only the gain above the ₹1,25,000 annual exemption is taxed, at 12.5%.'
        },
        {
          id: 'tax2-opt-2',
          text: '12.5% on the whole ₹1,80,000',
          isCorrect: false,
          explanation: 'The annual ₹1,25,000 exemption applies first; only the excess is taxed.'
        },
        {
          id: 'tax2-opt-3',
          text: 'Nothing, because long-term equity gains are fully exempt',
          isCorrect: false,
          explanation: 'Long-term equity gains have been taxable since 1 April 2018. Only the first ₹1,25,000 each year is exempt.'
        },
        {
          id: 'tax2-opt-4',
          text: '20%, the short-term rate',
          isCorrect: false,
          explanation: '20% under Section 111A applies to holdings sold within 12 months, not to long-term gains.'
        }
      ]
    }
  },
  {
    id: 'lesson-tax-3',
    title: 'Tax-Loss Harvesting: Turning a Losing Position Into a Legal Deduction',
    tagline: 'Set-off and carry-forward rules that quietly decide your real return',
    category: 'Taxation',
    readTime: '8 min read',
    xpReward: 170,
    iconName: 'Scissors',
    summary: 'Learn how capital losses offset gains, which losses can offset which, how to carry losses forward for eight years, and where harvesting crosses from smart planning into avoidance.',
    sections: [
      {
        heading: 'What Harvesting Actually Means',
        content: `**Tax-loss harvesting** is deliberately selling an investment that is below your cost before the financial year ends, so the realised loss reduces the gains you are taxed on.\n\nThe important word is **realised**. A position that is 30% down on screen does nothing for your tax bill. Only a completed sale creates a loss the Income Tax Act recognises.\n\n$$\\text{Taxable gain} = \\text{Realised gains} - \\text{Realised losses}$$\n\nIf you booked ₹2,00,000 of short-term gains and you are also sitting on a ₹70,000 unrealised loss, selling that position before 31 March reduces your taxable short-term gains to ₹1,30,000 — saving ₹14,000 of tax at 20%.`,
        exampleBox: {
          title: 'The Shopping Bill Analogy 🧾',
          description: 'Think of your realised gains as the bill and realised losses as discount coupons. A coupon only works if you hand it over at the counter before the shop closes on 31 March.',
          analogy: 'Two coupons left unused in your pocket — unrealised losses — do not lower the bill, no matter how large they are.'
        }
      },
      {
        heading: 'The Set-Off Rules: Which Loss Cancels Which Gain',
        content: `The Act is specific about what can offset what (Sections 70 and 71):\n\n- A **short-term capital loss** can be set off against **both short-term and long-term** capital gains. It is the more flexible of the two.\n- A **long-term capital loss** can be set off **only against long-term** capital gains.\n- Capital losses **cannot** be set off against salary income.\n- **Speculative losses** (intraday equity) can be set off **only against speculative income**.\n- **F&O losses** are non-speculative business losses and can be set off against most heads of income other than salary in the same year.\n\nThe ordering matters in practice: because a short-term loss is more flexible, many investors deliberately use short-term losses against short-term gains, which are taxed at the higher 20% rate rather than 12.5%.`
      },
      {
        heading: 'Carry Forward: Eight Years, One Condition',
        content: `A loss you cannot use this year is not wasted. Unabsorbed **capital losses can be carried forward for eight assessment years** and set off against future capital gains of the same character (Section 74). Speculative losses carry forward for **four** years.\n\n**The condition everyone forgets:** you must **file your income tax return on or before the due date under Section 139(1)**. File late and the right to carry the loss forward is lost permanently. For most retail investors that deadline is **31 July**.\n\nThis single rule is why a student with no taxable income should still file a return in a year they lost money in the market — it banks the loss against gains they may make years later.`
      },
      {
        heading: 'Where Harvesting Stops Being Smart',
        content: `India has **no formal "wash sale" rule** of the kind the United States uses, so repurchasing the same stock is not automatically disallowed. That does **not** make every manoeuvre safe:\n\n- Selling and rebuying within the same day purely to manufacture a loss, with no change in your economic position, can be challenged as a sham or under the **General Anti-Avoidance Rules (GAAR)**.\n- Every harvest costs real money: STT, brokerage, stamp duty, GST and the **bid-ask spread**. Harvesting a ₹5,000 loss to save ₹1,000 of tax is not worth ₹1,200 of friction.\n- Selling a quality long-term holding only for a tax benefit can be an expensive way to lose a compounding position.\n\n**A sound discipline:** harvest when the loss is genuine, the position no longer fits your thesis, and the tax saved clearly exceeds the transaction cost. Never let the tax tail wag the investment dog.`
      }
    ],
    keyTakeaways: [
      'Only realised losses reduce tax; an unrealised loss on screen does nothing before 31 March.',
      'Short-term losses offset both short-term and long-term gains; long-term losses offset only long-term gains.',
      'Capital losses carry forward eight assessment years, but only if the return is filed by the Section 139(1) due date.',
      'Harvesting has real costs — STT, brokerage, spread — so harvest only when the tax saved clearly exceeds them.'
    ],
    quiz: {
      question: 'You had a loss-making year and no taxable income. Why should you still file your ITR by 31 July?',
      options: [
        {
          id: 'tax3-opt-1',
          text: 'Filing on time is what preserves the right to carry the capital loss forward for eight years',
          isCorrect: true,
          explanation: 'Correct. Section 139(1) timing is the condition for carrying losses forward under Section 74.'
        },
        {
          id: 'tax3-opt-2',
          text: 'Losses are automatically carried forward whether or not you file',
          isCorrect: false,
          explanation: 'Carry-forward is conditional on filing the return by the due date.'
        },
        {
          id: 'tax3-opt-3',
          text: 'Filing converts the loss into an immediate cash refund',
          isCorrect: false,
          explanation: 'A capital loss offsets capital gains; it is not refunded in cash.'
        },
        {
          id: 'tax3-opt-4',
          text: 'It lets you set the loss off against next year\'s salary',
          isCorrect: false,
          explanation: 'Capital losses can never be set off against salary income.'
        }
      ]
    }
  },
  {
    id: 'lesson-tax-4',
    title: 'STT, Stamp Duty & GST: The Taxes You Pay on Every Single Trade',
    tagline: 'The charges that quietly decide whether an active strategy can ever work',
    category: 'Taxation',
    readTime: '6 min read',
    xpReward: 140,
    iconName: 'Coins',
    summary: 'Break down Securities Transaction Tax, stamp duty, GST, exchange and SEBI charges, and see why transaction taxes hurt high-frequency strategies far more than patient ones.',
    sections: [
      {
        heading: 'Your Contract Note Is a Tax Document',
        content: `The price you see on the screen is never the price you pay. Every executed order carries statutory charges that are collected whether the trade makes money or not.\n\nFor **delivery equity** trades in FY 2025-26:\n- **STT (Securities Transaction Tax):** 0.1% on the buy **and** 0.1% on the sell.\n- **Stamp duty:** 0.015% on the buy side only.\n- **GST:** 18% on brokerage plus exchange transaction charges.\n- **SEBI turnover fee:** ₹10 per ₹1 crore of turnover.\n- **Exchange transaction charges:** a small percentage set by NSE or BSE.\n- **DP charges:** a flat per-scrip fee on the sell side, charged by the depository participant.\n\nFor **intraday** equity, STT falls to 0.025% and is charged on the sell side only, and stamp duty falls to 0.003%. For **F&O**, futures carry STT of 0.02% on the sell side and options 0.1% of the premium on the sell side.`,
        exampleBox: {
          title: 'The Toll Booth Analogy 🛣️',
          description: 'STT is a toll booth on the market\'s road. A long-distance traveller crosses it twice. A driver doing laps crosses it on every lap.',
          analogy: 'Hold a stock for three years and you pay the toll twice. Trade the same stock twice a week for three years and you pay it over 600 times — the road did not get better, only the tolls added up.'
        }
      },
      {
        heading: 'Why Transaction Taxes Punish Activity',
        content: `Transaction costs scale with **turnover**, not with returns. That asymmetry is why the same strategy can be profitable before costs and loss-making after.\n\nA rough model of the drag:\n\n$$\\text{Annual cost drag} \\approx \\text{Round trips per year} \\times \\text{Cost per round trip}$$\n\nIf one delivery round trip costs roughly 0.25% of the value traded once STT, stamp duty, brokerage, GST and spread are included, then:\n- 2 round trips a year ≈ 0.5% drag\n- 25 round trips a year ≈ 6.25% drag\n- 100 round trips a year ≈ 25% drag\n\nA strategy would have to beat the index by 25 percentage points before the last investor sees a single rupee of advantage. SEBI's own studies of individual F&O traders have repeatedly shown the great majority losing money once these costs are counted.`
      },
      {
        heading: 'Dividend TDS and Other Deductions at Source',
        content: `Dividends have been taxable in the investor's hands since FY 2020-21. Two things follow:\n- The company deducts **TDS at 10% under Section 194** once dividends paid to you by that company cross **₹10,000** in a financial year (the threshold was raised from ₹5,000 with effect from 1 April 2025).\n- The **gross** dividend, not the amount credited, is added to your income and taxed at your slab rate. The TDS is then adjusted against your final liability.\n\nIf your total income is below the taxable limit, you can file **Form 15G** (or **15H** if you are a senior citizen) with the company or registrar so that TDS is not deducted in the first place.`
      },
      {
        heading: 'What You Can and Cannot Deduct',
        content: `When computing capital gains you may deduct **expenses wholly and exclusively in connection with the transfer** — brokerage, stamp duty, exchange charges and GST on those charges.\n\n**STT is the exception.** For gains taxed under Sections 111A and 112A, STT paid is **not** allowed as a deduction against capital gains.\n\nIf your activity is treated as **business income** (intraday or F&O), the position flips: STT, brokerage, internet, advisory fees, depreciation on your computer and other genuine business expenses are deductible against that business income, provided you maintain books and supporting records.`
      }
    ],
    keyTakeaways: [
      'Delivery equity pays STT on both legs (0.1% each) plus stamp duty, GST, SEBI and exchange charges.',
      'Costs scale with turnover, so frequent trading multiplies the drag while returns do not multiply with it.',
      'Dividends attract 10% TDS beyond ₹10,000 per company per year and are then taxed at your slab rate on the gross amount.',
      'Brokerage and stamp duty are deductible against capital gains; STT is not, unless your activity is taxed as business income.'
    ],
    quiz: {
      question: 'Two investors earn the same 14% gross return. One holds for three years, the other trades the position 40 times a year. What is the main reason their after-tax outcomes differ so much?',
      options: [
        {
          id: 'tax4-opt-1',
          text: 'Transaction taxes and charges scale with turnover, so the active trader pays them dozens of times over and also pays the higher short-term rate',
          isCorrect: true,
          explanation: 'Correct. Costs follow turnover, not returns, and short-term gains are taxed at 20% rather than 12.5%.'
        },
        {
          id: 'tax4-opt-2',
          text: 'STT is charged as a percentage of profits, so the profitable trader pays more',
          isCorrect: false,
          explanation: 'STT is charged on the transaction value, not on profits. It is payable even on losing trades.'
        },
        {
          id: 'tax4-opt-3',
          text: 'Active traders are barred from the ₹1,25,000 exemption by SEBI',
          isCorrect: false,
          explanation: 'The exemption applies to long-term gains. Short-term trades simply never qualify for it.'
        },
        {
          id: 'tax4-opt-4',
          text: 'There is no real difference once GST is refunded',
          isCorrect: false,
          explanation: 'GST on brokerage is a cost to a retail investor, not a refundable input credit.'
        }
      ]
    }
  },
  {
    id: 'lesson-tax-5',
    title: 'Tax Laws, Filing & Compliance: ITR Forms, AIS and the Investor Calendar',
    tagline: 'The paperwork that protects your losses, your refunds and your peace of mind',
    category: 'Taxation',
    readTime: '7 min read',
    xpReward: 160,
    iconName: 'FileCheck',
    summary: 'Know which ITR form fits your activity, how the AIS reports your trades to the department, when advance tax falls due, and what records to keep.',
    sections: [
      {
        heading: 'The Department Already Has Your Trades',
        content: `Since the **Annual Information Statement (AIS)** was introduced, the Income Tax Department receives structured reports of your financial life directly from banks, brokers, depositories, registrars and mutual funds.\n\nThree documents matter:\n- **Form 26AS** — tax deducted and deposited against your PAN.\n- **AIS** — a detailed statement of securities transactions, dividends, interest, and more.\n- **TIS (Taxpayer Information Summary)** — the department's simplified summary of the AIS.\n\nBefore filing, reconcile your broker's capital-gains statement against the AIS. Mismatches are the single most common cause of a notice under Section 143(1). If the AIS contains an error, you can submit **feedback** on the portal rather than silently filing a different number.`
      },
      {
        heading: 'Choosing the Right ITR Form',
        content: `The form follows the nature of your income:\n- **ITR-1 (Sahaj):** salary, one house property and interest income only. **Not** valid if you have capital gains.\n- **ITR-2:** salary plus **capital gains** from shares and mutual funds, with no business income. This is the standard form for a delivery investor.\n- **ITR-3:** required if you have **business income** — which includes **intraday** (speculative) and **F&O** (non-speculative) activity, even alongside a salary.\n- **ITR-4 (Sugam):** presumptive business income; generally not suitable once you hold capital assets.\n\nUsing ITR-1 when you have capital gains makes the return **defective** under Section 139(9), and you will be asked to file a corrected return.`,
        exampleBox: {
          title: 'One F&O Trade Changes Your Form 📄',
          description: 'A salaried investor who normally files ITR-2 tries a single index option trade during the year.',
          analogy: 'That one trade creates business income, so the correct form becomes ITR-3 and the bookkeeping expectations rise with it. It is worth knowing before you place the trade, not in July.'
        }
      },
      {
        heading: 'Advance Tax: Paying As You Earn',
        content: `If your total tax liability for the year after TDS is **₹10,000 or more**, you are expected to pay **advance tax** in instalments rather than a lump sum at filing:\n- By **15 June** — 15% of the estimated liability\n- By **15 September** — 45% cumulative\n- By **15 December** — 75% cumulative\n- By **15 March** — 100%\n\nShortfalls attract interest under **Section 234B** (for underpayment) and **Section 234C** (for deferment). Capital gains are unpredictable, so the law is reasonable here: where the gain arises late in the year, the instalment is payable in the remaining instalments after the gain actually accrues.\n\nA practical habit: whenever you book a large gain, set aside the tax on it the same week rather than discovering the liability in July.`
      },
      {
        heading: 'Records, Deadlines and Penalties',
        content: `**Deadlines**\n- **31 July** — due date for individuals not subject to audit.\n- **31 October** — due date where a tax audit under Section 44AB applies.\n- **31 December** — belated or revised return (with a late fee under Section 234F: ₹1,000 if income is under ₹5,00,000, otherwise ₹5,000).\n- An **updated return (ITR-U)** can correct omissions later, with additional tax.\n\n**Records worth keeping for at least eight years** (as long as a loss can be carried forward):\n- Contract notes and the broker's annual capital-gains statement\n- Demat holding statements and transaction statements\n- Dividend credit advices and TDS certificates\n- Bank statements showing the money trail\n\n**One clear boundary:** reducing tax using the reliefs the law provides is **avoidance and legal** — using the ₹1,25,000 exemption, harvesting a genuine loss, choosing the regime that suits you. Concealing income, backdating contracts or fabricating losses is **evasion**, prosecutable under Section 276C. The line between them is honesty about what actually happened.`
      }
    ],
    keyTakeaways: [
      'Reconcile your broker statement with the AIS and Form 26AS before filing; mismatches trigger notices.',
      'Capital gains need ITR-2, while any intraday or F&O activity pushes you to ITR-3.',
      'Advance tax is due in four instalments once your liability after TDS crosses ₹10,000, with interest under Sections 234B and 234C for shortfalls.',
      'Keep contract notes and statements for at least eight years, the same period a capital loss can be carried forward.'
    ],
    quiz: {
      question: 'A salaried investor holds shares for the long term and also placed a few intraday trades this year. Which ITR form should they file?',
      options: [
        {
          id: 'tax5-opt-1',
          text: 'ITR-3, because intraday activity is speculative business income',
          isCorrect: true,
          explanation: 'Correct. Any business income — including speculative intraday activity — requires ITR-3.'
        },
        {
          id: 'tax5-opt-2',
          text: 'ITR-1, because their main income is salary',
          isCorrect: false,
          explanation: 'ITR-1 cannot be used once there are capital gains, let alone business income.'
        },
        {
          id: 'tax5-opt-3',
          text: 'ITR-2, because intraday trades are just short-term capital gains',
          isCorrect: false,
          explanation: 'Intraday equity is speculative business income, not capital gains, so ITR-2 is not sufficient.'
        },
        {
          id: 'tax5-opt-4',
          text: 'No return is needed if tax was already deducted from salary',
          isCorrect: false,
          explanation: 'TDS on salary does not cover capital gains or business income, and filing is what preserves loss carry-forward.'
        }
      ]
    }
  }
];
