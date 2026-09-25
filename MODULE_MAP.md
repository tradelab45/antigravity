# Module map

RupeeRookie is segregated into **12 feature modules**. Each module has its own
branch named `module/<name>`, cut from `main`. On a module branch that one
module is relocated into `src/modules/<name>/` and its HTTP routes are split out
of `server.ts` into `src/server/routes/<name>.ts`; the rest of the app is left
untouched, so every branch still builds, still passes the test suite, and can be
merged back into `main` on its own.

Shared code (see the bottom of this file) is deliberately **not** moved on any
branch — that is what keeps the 12 branches independent of each other.

| Module | Branch | What it owns | Files | API routes |
| --- | --- | --- | --- | --- |
| **Investor Academy** | `module/academy` | Lessons, stage exams, progress tracking, Hindi summaries, historical case studies and cohort rankings. | 20 | `/api/academy`, `/api/auth/logout` |
| **Trading Simulator** | `module/trading-simulator` | Order entry, replay terminal, trade journal/review, challenges and head-to-head stock battles. | 6 | `/api/trades` |
| **Portfolio** | `module/portfolio` | Holdings, watchlist, risk heatmap, construction lab, thematic baskets and performance attribution. | 8 | — |
| **Market Data** | `module/market-data` | Upstox/Yahoo/Google Finance feeds, the stock catalogue, quotes, indices, options chain and technical calculations. | 15 | `/api/stocks`, `/api/upstox`, `/api/indian-stock-api`, `/api/google-finance`, `/api/market/stream`, `/api/market/summary` |
| **Screener** | `module/screener` | Advanced stock screening, benchmark indices, filter tokens and quick price alerts. | 5 | `/api/screener` |
| **Authentication** | `module/auth` | Sign-up, sign-in, Google identity, profile completion, data-privacy centre and auth rate limiting. | 7 | `/api/auth` |
| **Admin Console** | `module/admin` | Passkey-gated admin dashboard, user management, broadcasts and CSV/NotebookLM exports. | 1 | `/api/admin`, `/api/broadcast` |
| **Chanakya AI Copilot** | `module/ai-copilot` | Gemini-backed mentor chat, portfolio audit, stock analysis and the market pulse/news feeds. | 2 | `/api/gemini`, `/api/market-pulse`, `/api/market-news` |
| **Tax & Calculators** | `module/tax` | Tax centre, taxation lessons and the inflation/tax-aware compound calculator. | 3 | — |
| **Accessibility** | `module/accessibility` | Text sizing, high contrast, reduced motion and dyslexia-friendly reading preferences. | 2 | — |
| **Landing** | `module/landing` | Public landing pages, the 3D/spatial variant and the marketing footer. | 5 | — |
| **PWA & Platform** | `module/pwa-platform` | Installable PWA plumbing, service-worker registration and connection status. | 3 | — |

## Branch status

Every branch was built from `main` and verified on its own with
`tsc --noEmit`, `npm run build` and `npm test` (36/36). Branches that moved HTTP
routes were additionally verified at runtime by booting the server and
exercising the routes; what each one exercised is recorded in its commit message.

| Branch | Files changed | `server.ts` | Route file |
| --- | --- | --- | --- |
| `module/academy` | 32 | 3847 → 3849 | `routes/academy.ts` |
| `module/market-data` | 23 | 3847 → **1817** | `routes/market-data.ts` |
| `module/portfolio` | 15 | unchanged | — |
| `module/auth` | 14 | 3847 → 3488 | `routes/auth.ts` |
| `module/accessibility` | 12 | unchanged | — |
| `module/trading-simulator` | 12 | 3847 → 3788 | `routes/trading-simulator.ts` |
| `module/screener` | 11 | 3847 → 3822 | `routes/screener.ts` |
| `module/tax` | 8 | unchanged | — |
| `module/landing` | 8 | unchanged | — |
| `module/pwa-platform` | 8 | unchanged | — |
| `module/ai-copilot` | 7 | 3847 → 3318 | `routes/ai-copilot.ts` |
| `module/admin` | 6 | 3847 → 3483 | `routes/admin.ts` |

## Merging these branches

Each branch merges into `main` **cleanly on its own** — all twelve were tested
that way. They are not, however, independent of *each other*: merging a second
one after the first has landed conflicts, because they share `server.ts` and
`src/App.tsx`, and because a file one branch relocated is still edited at its old
path by the next. A sequential merge of all twelve conflicts on ten of them.

Two ways to land them:

- **Land them one at a time**, rebasing each remaining branch on the updated
  `main` before merging it. The conflicts are mechanical (a moved file edited at
  its old path, or an adjacent hunk in `server.ts`), but there are many.
- **Treat the branches as the review unit**, then apply the whole segregation in
  one commit on `main`. Reviewing twelve small, individually green branches is
  the cheaper path; replaying them one by one is not.

## Server route extraction

Each module that owns HTTP routes gets `src/server/routes/<name>.ts` exporting a
`create<Name>Router(deps)` factory. `server.ts` keeps ownership of shared state
and injects what a router needs, rather than each router reaching into the
monolith:

- Stateful setup stays **inside** the factory, not at module top level, because
  the Upstox feed and the stock catalogue read environment variables that
  `dotenv` only loads once `server.ts` starts.
- `market-data` hands back `getStocks()` (a getter, so callers never hold a stale
  snapshot) and `stopFeed()` for the shutdown handler.
- `academy` deliberately returns `logout` instead of mounting it, because
  `server.ts` registers it *after* the no-store `Cache-Control` middleware for
  `/api/auth`; mounting it inside the router would silently drop that header.
- Route modules declare only the record fields they actually read, so they do not
  depend on `server.ts` internals like `StoredUser`.

## Pre-existing issue found while verifying

`POST /api/gemini/analyze-stock` crashes the server process with
`TypeError: Cannot read properties of undefined (reading 'toLocaleString')` when
the posted `stock` object is missing numeric fields. The throw happens in an
async handler, so Express 4 never sees it and the unhandled rejection takes the
process down — one malformed request stops the server.

This reproduces identically on `main` and was left as-is, since fixing it is
outside the scope of segregating the modules.

## Per-module contents

### `module/academy` — Investor Academy

Lessons, stage exams, progress tracking, Hindi summaries, historical case studies and cohort rankings.

Relocated to `src/modules/academy/`:

- `components/`
  - `src/components/InvestorAcademy.tsx` → `src/modules/academy/components/InvestorAcademy.tsx`
  - `src/components/StageExam.tsx` → `src/modules/academy/components/StageExam.tsx`
  - `src/components/ExamHistory.tsx` → `src/modules/academy/components/ExamHistory.tsx`
  - `src/components/CohortLeaderboard.tsx` → `src/modules/academy/components/CohortLeaderboard.tsx`
  - `src/components/HistoricalEventsLab.tsx` → `src/modules/academy/components/HistoricalEventsLab.tsx`
  - `src/components/ContextualGlossary.tsx` → `src/modules/academy/components/ContextualGlossary.tsx`
  - `src/components/ResumeLearning.tsx` → `src/modules/academy/components/ResumeLearning.tsx`
  - `src/components/ProgressHub.tsx` → `src/modules/academy/components/ProgressHub.tsx`
  - `src/components/AchievementsView.tsx` → `src/modules/academy/components/AchievementsView.tsx`
  - `src/components/PracticeTaskBanner.tsx` → `src/modules/academy/components/PracticeTaskBanner.tsx`
- `data/`
  - `src/data/lessonsData.ts` → `src/modules/academy/data/lessonsData.ts`
  - `src/data/hindiLessons.ts` → `src/modules/academy/data/hindiLessons.ts`
  - `src/data/stageExams.ts` → `src/modules/academy/data/stageExams.ts`
  - `src/data/learningPath.ts` → `src/modules/academy/data/learningPath.ts`
  - `src/data/caseStudiesData.ts` → `src/modules/academy/data/caseStudiesData.ts`
  - `src/data/historicalEventsData.ts` → `src/modules/academy/data/historicalEventsData.ts`
  - `src/data/practiceActions.ts` → `src/modules/academy/data/practiceActions.ts`
- `utils/`
  - `src/utils/academyProgress.ts` → `src/modules/academy/utils/academyProgress.ts`
- `hooks/`
  - `src/hooks/useExamHistory.ts` → `src/modules/academy/hooks/useExamHistory.ts`
- `server/`
  - `src/server/academyService.ts` → `src/modules/academy/server/academyService.ts`

Server routes extracted from `server.ts` into `src/server/routes/academy.ts`: `/api/academy`, `/api/auth/logout`

### `module/trading-simulator` — Trading Simulator

Order entry, replay terminal, trade journal/review, challenges and head-to-head stock battles.

Relocated to `src/modules/trading-simulator/`:

- `components/`
  - `src/components/OrderBookView.tsx` → `src/modules/trading-simulator/components/OrderBookView.tsx`
  - `src/components/ReplayTerminal.tsx` → `src/modules/trading-simulator/components/ReplayTerminal.tsx`
  - `src/components/TradeReviewHub.tsx` → `src/modules/trading-simulator/components/TradeReviewHub.tsx`
  - `src/components/TradingChallengesView.tsx` → `src/modules/trading-simulator/components/TradingChallengesView.tsx`
  - `src/components/StockBattleModal.tsx` → `src/modules/trading-simulator/components/StockBattleModal.tsx`
- `data/`
  - `src/data/replayData.ts` → `src/modules/trading-simulator/data/replayData.ts`

Server routes extracted from `server.ts` into `src/server/routes/trading-simulator.ts`: `/api/trades`

### `module/portfolio` — Portfolio

Holdings, watchlist, risk heatmap, construction lab, thematic baskets and performance attribution.

Relocated to `src/modules/portfolio/`:

- `components/`
  - `src/components/PortfolioHub.tsx` → `src/modules/portfolio/components/PortfolioHub.tsx`
  - `src/components/PortfolioView.tsx` → `src/modules/portfolio/components/PortfolioView.tsx`
  - `src/components/PortfolioReportModal.tsx` → `src/modules/portfolio/components/PortfolioReportModal.tsx`
  - `src/components/PortfolioConstructionLab.tsx` → `src/modules/portfolio/components/PortfolioConstructionLab.tsx`
  - `src/components/WatchlistView.tsx` → `src/modules/portfolio/components/WatchlistView.tsx`
  - `src/components/RiskCenterModal.tsx` → `src/modules/portfolio/components/RiskCenterModal.tsx`
  - `src/components/ThematicBasketsModal.tsx` → `src/modules/portfolio/components/ThematicBasketsModal.tsx`
- `utils/`
  - `src/utils/attribution.ts` → `src/modules/portfolio/utils/attribution.ts`

### `module/market-data` — Market Data

Upstox/Yahoo/Google Finance feeds, the stock catalogue, quotes, indices, options chain and technical calculations.

Relocated to `src/modules/market-data/`:

- `components/`
  - `src/components/StockDetailModal.tsx` → `src/modules/market-data/components/StockDetailModal.tsx`
  - `src/components/IndianStockApiModal.tsx` → `src/modules/market-data/components/IndianStockApiModal.tsx`
  - `src/components/IPOView.tsx` → `src/modules/market-data/components/IPOView.tsx`
  - `src/components/OptionsChainModal.tsx` → `src/modules/market-data/components/OptionsChainModal.tsx`
  - `src/components/BigQueryGraphView.tsx` → `src/modules/market-data/components/BigQueryGraphView.tsx`
- `data/`
  - `src/data/indianCompanies.ts` → `src/modules/market-data/data/indianCompanies.ts`
  - `src/data/psuStocks.ts` → `src/modules/market-data/data/psuStocks.ts`
- `utils/`
  - `src/utils/quoteState.ts` → `src/modules/market-data/utils/quoteState.ts`
  - `src/utils/marketHours.ts` → `src/modules/market-data/utils/marketHours.ts`
  - `src/utils/indexCalculator.ts` → `src/modules/market-data/utils/indexCalculator.ts`
  - `src/utils/technicalCalculator.ts` → `src/modules/market-data/utils/technicalCalculator.ts`
  - `src/utils/optionsCalculator.ts` → `src/modules/market-data/utils/optionsCalculator.ts`
- `server/`
  - `src/server/upstoxService.ts` → `src/modules/market-data/server/upstoxService.ts`
  - `src/server/googleFinanceService.ts` → `src/modules/market-data/server/googleFinanceService.ts`
  - `src/server/stockCatalog.ts` → `src/modules/market-data/server/stockCatalog.ts`

Server routes extracted from `server.ts` into `src/server/routes/market-data.ts`: `/api/stocks`, `/api/upstox`, `/api/indian-stock-api`, `/api/google-finance`, `/api/market/stream`, `/api/market/summary`

### `module/screener` — Screener

Advanced stock screening, benchmark indices, filter tokens and quick price alerts.

Relocated to `src/modules/screener/`:

- `components/`
  - `src/components/MarketScreener.tsx` → `src/modules/screener/components/MarketScreener.tsx`
  - `src/components/QuickAlertModal.tsx` → `src/modules/screener/components/QuickAlertModal.tsx`
- `data/`
  - `src/data/benchmarkIndices.ts` → `src/modules/screener/data/benchmarkIndices.ts`
- `constants/`
  - `src/constants/marketKeywords.ts` → `src/modules/screener/constants/marketKeywords.ts`
- `server/`
  - `src/server/screenerService.ts` → `src/modules/screener/server/screenerService.ts`

Server routes extracted from `server.ts` into `src/server/routes/screener.ts`: `/api/screener`

### `module/auth` — Authentication

Sign-up, sign-in, Google identity, profile completion, data-privacy centre and auth rate limiting.

Relocated to `src/modules/auth/`:

- `components/`
  - `src/components/AuthPage.tsx` → `src/modules/auth/components/AuthPage.tsx`
  - `src/components/AuthModal.tsx` → `src/modules/auth/components/AuthModal.tsx`
  - `src/components/AuthLaunchTransition.tsx` → `src/modules/auth/components/AuthLaunchTransition.tsx`
  - `src/components/GoogleSignInButton.tsx` → `src/modules/auth/components/GoogleSignInButton.tsx`
  - `src/components/CompleteProfileModal.tsx` → `src/modules/auth/components/CompleteProfileModal.tsx`
  - `src/components/DataPrivacyCenter.tsx` → `src/modules/auth/components/DataPrivacyCenter.tsx`
- `server/`
  - `src/server/authRateLimit.ts` → `src/modules/auth/server/authRateLimit.ts`

Server routes extracted from `server.ts` into `src/server/routes/auth.ts`: `/api/auth`

### `module/admin` — Admin Console

Passkey-gated admin dashboard, user management, broadcasts and CSV/NotebookLM exports.

Relocated to `src/modules/admin/`:

- `components/`
  - `src/components/AdminDashboard.tsx` → `src/modules/admin/components/AdminDashboard.tsx`

Server routes extracted from `server.ts` into `src/server/routes/admin.ts`: `/api/admin`, `/api/broadcast`

### `module/ai-copilot` — Chanakya AI Copilot

Gemini-backed mentor chat, portfolio audit, stock analysis and the market pulse/news feeds.

Relocated to `src/modules/ai-copilot/`:

- `components/`
  - `src/components/ChanakyaMentor.tsx` → `src/modules/ai-copilot/components/ChanakyaMentor.tsx`
  - `src/components/ChanakyaCopilotBanner.tsx` → `src/modules/ai-copilot/components/ChanakyaCopilotBanner.tsx`

Server routes extracted from `server.ts` into `src/server/routes/ai-copilot.ts`: `/api/gemini`, `/api/market-pulse`, `/api/market-news`

### `module/tax` — Tax & Calculators

Tax centre, taxation lessons and the inflation/tax-aware compound calculator.

Relocated to `src/modules/tax/`:

- `components/`
  - `src/components/TaxCentre.tsx` → `src/modules/tax/components/TaxCentre.tsx`
  - `src/components/CompoundCalculator.tsx` → `src/modules/tax/components/CompoundCalculator.tsx`
- `data/`
  - `src/data/taxationLessons.ts` → `src/modules/tax/data/taxationLessons.ts`

### `module/accessibility` — Accessibility

Text sizing, high contrast, reduced motion and dyslexia-friendly reading preferences.

Relocated to `src/modules/accessibility/`:

- `components/`
  - `src/components/AccessibilityCenter.tsx` → `src/modules/accessibility/components/AccessibilityCenter.tsx`
- `context/`
  - `src/context/AccessibilityContext.tsx` → `src/modules/accessibility/context/AccessibilityContext.tsx`

### `module/landing` — Landing

Public landing pages, the 3D/spatial variant and the marketing footer.

Relocated to `src/modules/landing/`:

- `components/`
  - `src/components/LandingPage.tsx` → `src/modules/landing/components/LandingPage.tsx`
  - `src/components/LandingPage3D.tsx` → `src/modules/landing/components/LandingPage3D.tsx`
  - `src/components/MotionFooter.tsx` → `src/modules/landing/components/MotionFooter.tsx`
  - `src/components/landing.css` → `src/modules/landing/components/landing.css`
  - `src/components/landing-3d.css` → `src/modules/landing/components/landing-3d.css`

### `module/pwa-platform` — PWA & Platform

Installable PWA plumbing, service-worker registration and connection status.

Relocated to `src/modules/pwa-platform/`:

- `components/`
  - `src/components/PwaInstall.tsx` → `src/modules/pwa-platform/components/PwaInstall.tsx`
  - `src/components/ConnectionStatus.tsx` → `src/modules/pwa-platform/components/ConnectionStatus.tsx`
- `utils/`
  - `src/utils/pwa.ts` → `src/modules/pwa-platform/utils/pwa.ts`

## Shared code (unmoved on every branch)

These files are used across many modules, so they stay where they are. Moving
them would make the module branches conflict with one another.

- **project root / shared packages** — `animated-search-bar.tsx`, `expandable-tabs.tsx`, `filter-token-bar.tsx`, `interactive-list-preview.tsx`, `liquid-glass-button.tsx`, `rupee-spatial-background.tsx`, `spatial-candlestick-chart.tsx`, `spotlight-card.tsx`, `stack-spread.tsx`, `thumbnail-carousel.tsx`, `db.js`, `utils.ts`, `server.ts`, `App.tsx`, `index.css`, `utils.ts`, `main.tsx`, `types.ts`, `vite-env.d.ts`
- **src/components** — `AppWalkthroughOverlay.tsx`, `CommandPalette.tsx`, `DailyTipOverlay.tsx`, `ErrorBoundary.tsx`, `FloatingQuickDock.tsx`, `Header.tsx`, `HelpSupportCenter.tsx`, `HomeDashboard.tsx`, `KeyboardShortcutsModal.tsx`, `MobileBottomNav.tsx`, `NotificationCenter.tsx`, `PageSkeleton.tsx`, `ToastNotifier.tsx`, `LiquidGlassLogo.tsx`, `animated-search-bar.tsx`, `area-charts-2.tsx`, `expandable-tabs.tsx`, `filter-token-bar.tsx`, `interactive-list-preview.tsx`, `liquid-glass-button.css`, `liquid-glass-button.tsx`, `rupee-spatial-background.tsx`, `spatial-candlestick-chart.tsx`, `spatial-chart.css`, `spotlight-card.tsx`, `stack-spread.tsx`, `thumbnail-carousel.tsx`
- **src/context** — `SimulatorContext.tsx`, `ThemeContext.tsx`
- **src/utils** — `formatters.ts`, `soundEffects.ts`

Notably shared on purpose:

- `src/context/SimulatorContext.tsx` — global simulator state, imported by 31 files.
- `src/utils/formatters.ts` — currency/number formatting, imported by 23 files.
- `src/components/Header.tsx` — app shell chrome, imported by 14 files.
- `src/types.ts`, `src/App.tsx`, `src/main.tsx` — app-wide composition and types.
- `src/components/ui/*` and `lib/utils.ts` — the design-system primitives.

## Unreferenced components

These five components are not imported anywhere (statically or lazily) on `main`.
They are relocated with their module rather than deleted, since removing them is
outside the scope of this segregation:

- `IPOView.tsx`, `IndianStockApiModal.tsx` (market-data)
- `OrderBookView.tsx` (trading-simulator)
- `ChanakyaCopilotBanner.tsx` (ai-copilot)
- `KeyboardShortcutsModal.tsx` (shared, unmoved)
