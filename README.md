# RupeeRookie

RupeeRookie is a responsive Indian-market paper-trading simulator and investor academy for teenagers and first-time investors. It combines simulated investing, structured learning, risk controls and reflective journaling without encouraging excessive trading.

> **Education only:** RupeeRookie uses virtual money. Market information can be delayed, indicative, simulated or based on the last available close. Nothing in the app is investment advice.

## Features

- ₹10,00,000 simulated starting capital
- Indian stock search, sectors, indices and advanced screeners
- Labelled market status, timestamps and data availability
- Portfolio, watchlist, risk heatmap and concentration warnings
- What-if stress tests and drawdown monitoring
- Required trade plans with saved per-stock drafts
- Trade journal, screenshots, annotations and weekly reflections
- Replay OS and post-session scorecards
- Trader DNA, genuine-activity XP, challenges and achievements
- Academy lessons, bookmarks, Hindi summaries and historical case studies
- Conservative, balanced and growth portfolio models
- Optional Chanakya AI Coach with availability and safety notices
- Compound calculator with inflation, tax and scenario comparisons
- Installable PWA with offline-friendly Academy content
- Text sizing, high contrast, reduced motion and dyslexia-friendly reading
- Responsive desktop, tablet and mobile navigation
- Universal search using `Ctrl/Command + K` or `/`

## Requirements

- Node.js 20 or newer
- npm 10 or newer recommended
- Internet access for fresh external market information and optional AI responses

## Run locally

1. Extract the source ZIP and open a terminal in the `rupeerookie` folder.
2. Install and start the app:

   ```bash
   npm install
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000).

Use the one-click demo account shown on the sign-in screen, or create a local student account. Keep the terminal open while using the app.

### Windows PowerShell

```powershell
Set-Location "path\to\rupeerookie"
npm install
npm run dev
```

## Optional configuration

Copy `.env.example` to `.env` and configure only the services you need:

```env
GEMINI_API_KEY=""
APP_URL="http://localhost:3000"
GOOGLE_SHEETS_WEBHOOK_URL=""
ADMIN_EXPORT_TOKEN=""
```

| Variable | Required | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | No | Enables Chanakya AI. The simulator works without it. |
| `APP_URL` | No locally | Public URL for hosted environments. |
| `GOOGLE_SHEETS_WEBHOOK_URL` | No | Sends signup records to an explicitly configured webhook. |
| `ADMIN_EXPORT_TOKEN` | Recommended for exports | Protects administrative export routes. |
| `PORT` | No | Changes the default server port from `3000`. |

Never commit a real `.env` file or API key.

## Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Runs the Express API and Vite development app. |
| `npm run lint` | Performs TypeScript validation. |
| `npm run build` | Builds the optimized frontend and production server. |
| `npm start` | Runs the previously built production server. |
| `npm run preview` | Previews the Vite frontend build. |

### Production

```bash
npm run lint
npm run build
npm start
```

Production files are generated in `dist/`. Health endpoints are available at `/api/health`, `/healthz` and `/livez`.

## Navigation

Desktop uses the main navigation bar. Smaller devices use Home, Markets, Portfolio, Learn and More. More groups the remaining tools under Discover, Practice, Learn, Progress and Support. Universal search opens any major section or company without navigating through menus.

## Market-data rules

Every market figure should be identified as one of the following:

- **Live:** actively updating while the market is open
- **Delayed:** provider data that may lag the latest trade
- **Last close:** the latest completed session
- **Simulated:** generated only for an educational exercise

The server attempts external market retrieval and uses safe fallbacks if a provider is unavailable. Price change is calculated consistently from price and previous close. Offline or cached information must never be presented as live.

## Accounts, privacy and local data

Simulator state, accessibility settings, notes, plans and learning records remain in the browser unless an external integration is explicitly configured. They may not automatically appear on another device.

- New users receive the walkthrough.
- Returning users receive a rotating daily learning tip.
- Inactive sessions are signed out after the configured inactivity period.
- Trade-plan drafts are scoped to the signed-in user and stock symbol.
- Export and reset controls are available from the relevant app sections.

Do not enter brokerage credentials or confidential financial information.

## Accessibility

The Accessibility panel includes text sizing, English/Hindi summaries, high contrast, reduced motion, dyslexia-friendly Academy reading and larger touch controls. The app also provides keyboard-friendly dialogs, status announcements, responsive touch targets and a skip link.

## Offline and PWA use

Install the app using a supported browser's Install App option. Prepared Academy material and locally stored learning records can remain available offline. Fresh quotes, AI requests and server actions require a connection. A banner explains disconnections and confirms recovery.

## Project structure

```text
rupeerookie/
├── public/             PWA and static assets
├── src/
│   ├── components/     Pages, dialogs and reusable UI
│   ├── context/        Simulator, accessibility and theme state
│   ├── data/           Company and learning data
│   ├── server/         Market-data service adapters
│   ├── utils/          Formatting and calculation helpers
│   ├── App.tsx         Routing and global controls
│   └── types.ts        Shared TypeScript models
├── server.ts           Express server and API routes
├── vite.config.ts      Frontend build configuration
├── package.json        Commands and dependencies
└── .env.example        Optional environment settings
```

Major pages load as separate bundles. Markets, Portfolio and Academy show page-specific skeletons during loading.

## Troubleshooting

### Unable to reach the local server

1. Confirm `npm run dev` is still running.
2. Check the terminal for an error.
3. Ensure another program is not using port 3000.
4. Open `http://localhost:3000` directly and reload.
5. Run `npm install` again if dependencies are missing.

### AI Coach is unavailable

This is expected without a valid `GEMINI_API_KEY`. The app reports AI as unavailable instead of claiming to perform live AI or Google searches.

### Quotes are stale or unavailable

Providers may be delayed or temporarily unreachable. Check the status label and timestamp. The app keeps educational content available while disabling live-style wording.

### Local records disappeared

Private browsing, clearing site data or changing browser profiles can remove browser storage. Export important records before clearing browser data.

## Quality checklist

Before distribution, run:

```bash
npm run lint
npm run build
```

Review at least 390px mobile, 768px tablet, 1024px laptop and 1440px desktop widths. Test keyboard navigation, reduced motion, high contrast, offline messaging, market timestamps and genuine new-user empty states.

## Responsible use

RupeeRookie teaches process, patience and risk awareness. XP, badges and rankings should reward verified learning and reflection—not trading frequency or fictional activity. Simulated results do not predict future returns.
