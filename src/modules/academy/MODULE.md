# Investor Academy

Lessons, stage exams, progress tracking, Hindi summaries, historical case studies and cohort rankings.

## Layout

### `components/`

- `InvestorAcademy.tsx` — moved from `src/components/InvestorAcademy.tsx`
- `StageExam.tsx` — moved from `src/components/StageExam.tsx`
- `ExamHistory.tsx` — moved from `src/components/ExamHistory.tsx`
- `CohortLeaderboard.tsx` — moved from `src/components/CohortLeaderboard.tsx`
- `HistoricalEventsLab.tsx` — moved from `src/components/HistoricalEventsLab.tsx`
- `ContextualGlossary.tsx` — moved from `src/components/ContextualGlossary.tsx`
- `ResumeLearning.tsx` — moved from `src/components/ResumeLearning.tsx`
- `ProgressHub.tsx` — moved from `src/components/ProgressHub.tsx`
- `AchievementsView.tsx` — moved from `src/components/AchievementsView.tsx`
- `PracticeTaskBanner.tsx` — moved from `src/components/PracticeTaskBanner.tsx`

### `data/`

- `lessonsData.ts` — moved from `src/data/lessonsData.ts`
- `hindiLessons.ts` — moved from `src/data/hindiLessons.ts`
- `stageExams.ts` — moved from `src/data/stageExams.ts`
- `learningPath.ts` — moved from `src/data/learningPath.ts`
- `caseStudiesData.ts` — moved from `src/data/caseStudiesData.ts`
- `historicalEventsData.ts` — moved from `src/data/historicalEventsData.ts`
- `practiceActions.ts` — moved from `src/data/practiceActions.ts`

### `utils/`

- `academyProgress.ts` — moved from `src/utils/academyProgress.ts`

### `hooks/`

- `useExamHistory.ts` — moved from `src/hooks/useExamHistory.ts`

### `server/`

- `academyService.ts` — moved from `src/server/academyService.ts`

## HTTP routes

Extracted from the `server.ts` monolith into `src/server/routes/academy.ts`:

- `/api/academy`
- `/api/auth/logout`

The router is created by a factory that receives the shared server state it
needs, so `server.ts` remains the single owner of that state.

## Shared code this module depends on

These stay outside the module on purpose — they are used by most other modules
too, and moving them would make the `module/*` branches conflict with each
other. See `MODULE_MAP.md` for the full shared list.

- `src/types.ts` — app-wide types
- `src/context/SimulatorContext.tsx` — global simulator state
- `src/utils/formatters.ts` — currency and number formatting
- `src/components/ui/*`, `lib/utils.ts` — design-system primitives
