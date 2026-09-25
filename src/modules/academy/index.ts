// Public surface of the Investor Academy module.
// See MODULE.md for what this module owns and what it borrows from shared code.

export { AchievementsView } from './components/AchievementsView';
export { CohortLeaderboard } from './components/CohortLeaderboard';
export { ContextualGlossary } from './components/ContextualGlossary';
export { ExamHistory } from './components/ExamHistory';
export { HistoricalEventsLab } from './components/HistoricalEventsLab';
export { InvestorAcademy } from './components/InvestorAcademy';
export { PracticeTaskBanner, clearPracticeTask, startPracticeTask } from './components/PracticeTaskBanner';
export { ProgressHub } from './components/ProgressHub';
export { ResumeLearning } from './components/ResumeLearning';
export { StageExam } from './components/StageExam';
export { CASE_STUDIES_DATA } from './data/caseStudiesData';
export type { CaseStudy, FinancialMetricComparison } from './data/caseStudiesData';
export { HINDI_LESSONS, localizeLesson } from './data/hindiLessons';
export { HISTORICAL_EVENTS } from './data/historicalEventsData';
export type { HistoricalEvent } from './data/historicalEventsData';
export { LEARNING_PATH, getStageForLesson } from './data/learningPath';
export type { LearningStageId } from './data/learningPath';
export { INITIAL_BADGES, INITIAL_LESSONS } from './data/lessonsData';
export { PRACTICE_ACTIONS, getPracticeAction } from './data/practiceActions';
export type { PracticeAction } from './data/practiceActions';
export { EXAM_LENGTH, EXAM_PASS_MARK, STAGE_EXAMS, buildExamAttempt, getStageExam } from './data/stageExams';
export type { ExamQuestion } from './data/stageExams';
// 'StageExam' is also exported by ./components/StageExam; import it from './data/stageExams' directly.
export { useExamHistory } from './hooks/useExamHistory';
export { academyStorageKey, parseAttempts, readResume, resolveResume } from './utils/academyProgress';
export type { ExamAttempt } from './utils/academyProgress';
