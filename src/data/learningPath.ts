export const LEARNING_PATH = [
  {
    id: 'beginner',
    name: 'Beginner',
    icon: '🌱',
    outcome: 'Shares, indices and basic risk',
    blurb: 'Start here if the market is new to you.',
    lessonIds: ['lesson-1', 'lesson-2'],
  },
  {
    id: 'explorer',
    name: 'Explorer',
    icon: '🧭',
    outcome: 'Valuation, trends and compounding',
    blurb: 'Learn what makes a price cheap or expensive.',
    lessonIds: ['lesson-3', 'lesson-4'],
  },
  {
    id: 'builder',
    name: 'Builder',
    icon: '🧱',
    outcome: 'Allocation, diversification and orders',
    blurb: 'Build a portfolio and place orders with intent.',
    lessonIds: ['lesson-5', 'lesson-6', 'lesson-7'],
  },
  {
    id: 'analyst',
    name: 'Analyst',
    icon: '🔍',
    outcome: 'Inflation, statements and planning',
    blurb: 'Read the numbers behind a business.',
    lessonIds: ['lesson-8', 'lesson-9', 'lesson-10'],
  },
  {
    id: 'responsible',
    name: 'Responsible Simulator',
    icon: '🧠',
    outcome: 'Behaviour, evidence and discipline',
    blurb: 'Manage the investor, not just the portfolio.',
    lessonIds: ['lesson-11', 'lesson-12'],
  },
  {
    id: 'taxation',
    name: 'Tax Smart',
    icon: '🧾',
    outcome: 'Slabs, capital gains, harvesting and filing',
    blurb: 'Keep more of what you earn, legally.',
    lessonIds: ['lesson-tax-1', 'lesson-tax-2', 'lesson-tax-3', 'lesson-tax-4', 'lesson-tax-5'],
  },
] as const;

export type LearningStageId = typeof LEARNING_PATH[number]['id'];

export const getStageForLesson = (lessonId: string): LearningStageId =>
  LEARNING_PATH.find((stage) => (stage.lessonIds as readonly string[]).includes(lessonId))?.id ?? LEARNING_PATH[0].id;
