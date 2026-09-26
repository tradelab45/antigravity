import type { AppTabType } from '../../../components/Header';

/**
 * What to go and do once a lesson's checkpoint is passed.
 *
 * The Academy and the simulator were separate destinations that never referred
 * to each other, so a lesson ended with nothing to apply it to. Each entry
 * names one small, concrete task and the view it belongs in.
 */
export interface PracticeAction {
  /** Button text in the Academy. */
  label: string;
  /** Where the task is carried out. */
  tab: AppTabType;
  /** The task itself, shown as a banner on arrival. */
  task: string;
  /** Why it is worth doing, shown under the task. */
  reason: string;
}

export const PRACTICE_ACTIONS: Record<string, PracticeAction> = {
  'lesson-1': {
    label: 'Find a company you already know',
    tab: 'screener',
    task: 'Find one listed company whose products you used this week.',
    reason: 'Owning a share means owning part of a real business. Starting from a business you already understand makes that concrete.',
  },
  'lesson-2': {
    label: 'Compare two P/E ratios',
    tab: 'screener',
    task: 'Open two companies in the same sector and compare their P/E ratios.',
    reason: 'A number only means something next to a comparable one. Same sector keeps the comparison fair.',
  },
  'lesson-3': {
    label: 'Check a 52-week range',
    tab: 'screener',
    task: 'Find a stock near its 52-week high and one near its low, and read what each business does.',
    reason: 'A position in the range is context, not a signal. Reading the business is what turns it into information.',
  },
  'lesson-4': {
    label: 'Run your own compounding numbers',
    tab: 'calculator',
    task: 'Set a monthly amount you could actually save, then change the time horizon and watch what moves most.',
    reason: 'Time affects the result more than the amount does. Seeing it beats being told it.',
  },
  'lesson-5': {
    label: 'Check your concentration',
    tab: 'portfolio',
    task: 'Open the risk heatmap and find your largest single exposure.',
    reason: 'Allocation decides how much one wrong idea can cost you. That is a number you should be able to state.',
  },
  'lesson-6': {
    label: 'Read a real chart',
    tab: 'replay',
    task: 'Step through a few candles and say out loud what buyers and sellers did in each one.',
    reason: 'Replay hides what comes next, so you practise reading rather than remembering.',
  },
  'lesson-7': {
    label: 'Place a limit order',
    tab: 'screener',
    task: 'Open any company, switch the order type from Market to Limit, and set a price below the current one.',
    reason: 'A limit order is where you choose price over certainty of execution. Doing it once makes the trade-off obvious.',
  },
  'lesson-8': {
    label: 'Turn on inflation',
    tab: 'calculator',
    task: 'Run a projection, then switch on the inflation adjustment and compare the two figures.',
    reason: 'The gap between the two is the part of a return that never reaches your purchasing power.',
  },
  'lesson-9': {
    label: 'Read a balance sheet',
    tab: 'screener',
    task: 'Open a company and find its debt and cash figures before looking at the share price.',
    reason: 'Financial strength explains why two companies with similar profits can be valued very differently.',
  },
  'lesson-10': {
    label: 'Size a monthly plan',
    tab: 'calculator',
    task: 'Work out what 20% of a realistic monthly income would compound to over ten years.',
    reason: 'A budget is only real once it has a number attached to it.',
  },
  'lesson-11': {
    label: 'Write one rule down',
    tab: 'journal',
    task: 'Record one rule you would follow next time, and what evidence would tell you the idea was wrong.',
    reason: 'A written rule is the only thing that survives contact with a moving price.',
  },
  'lesson-12': {
    label: 'Look past the label',
    tab: 'screener',
    task: 'Pick a company that markets itself as sustainable and look for what actually earns its revenue.',
    reason: 'A green label is a claim. Revenue is evidence.',
  },
  'lesson-tax-1': {
    label: 'See your slab in context',
    tab: 'calculator',
    task: 'Set the illustrative tax rate to your expected slab and watch what it does to the final corpus.',
    reason: 'Tax is a cost like any other. It belongs in the projection, not as an afterthought.',
  },
  'lesson-tax-2': {
    label: 'Check your holding periods',
    tab: 'portfolio',
    task: 'Open the tax ledger and find which positions are under twelve months old.',
    reason: 'Those are the ones taxed at 20% rather than 12.5% if you sell today.',
  },
  'lesson-tax-3': {
    label: 'Look for a harvestable loss',
    tab: 'portfolio',
    task: 'Find any position below your cost and work out what booking it would offset.',
    reason: 'Only a realised loss counts, and only before 31 March.',
  },
  'lesson-tax-4': {
    label: 'Read a contract note',
    tab: 'journal',
    task: 'Open a completed trade and add up the charges against the profit.',
    reason: 'Costs scale with how often you trade, not with how well you trade.',
  },
  'lesson-tax-5': {
    label: 'Check what is on record',
    tab: 'privacy',
    task: 'Export your trade records and confirm you could reconcile them against a broker statement.',
    reason: 'Filing depends on records you can actually produce.',
  },
};

export const getPracticeAction = (lessonId: string): PracticeAction | undefined =>
  PRACTICE_ACTIONS[lessonId];
