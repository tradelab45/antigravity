# Working in this repository

RupeeRookie is an Indian-market paper-trading simulator and investor academy.
The README covers what it does and how to run it. This file covers the things
that are easy to get wrong here, most of which were found the hard way.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Express + Vite on port 3005. |
| `npm run lint` | `tsc --noEmit`. There is no ESLint. |
| `npm test` | Unit tests in `tests/*.test.ts` under `node:test`. |
| `npm run build` | Vite bundle plus `dist/server.cjs`. |
| `npm run test:visual` | Drives the built app in Chromium, one file at a time. **Needs `npm run build` first.** |
| `npm run test:all` | All of the above, in order. |

Playwright needs a Chromium. Set `CHROMIUM_PATH` to use one you already have.

The visual suite runs with `--test-concurrency=1` on purpose. Each file starts
its own preview server and its own Chromium; run in parallel on a machine with
no GPU they starve each other and the screener render loses the race, which
showed up as a test that passed alone and failed in a full run.

## Layout

- `src/components/` — views and modals, flat. `src/components/ui/` — reusable pieces.
- `src/context/` — `SimulatorContext` (market data, orders, portfolio) and
  `AccessibilityContext` (text scale, contrast, motion, language, touch targets).
- `src/data/` — lesson content and the stage exam banks.
- `src/hooks/` — shared behaviour. `useModalDialog` is the one most new code needs.
- `src/i18n/` — the shell copy in English and Hindi, plus `useTranslation`.
- `server.ts` — Express API, bundled to `dist/server.cjs`.
- `tests/visual/` — the contrast audit and the dialog checks.

## Styling

Tailwind v4 (`@theme`, `@custom-variant dark`), no config file — everything
lives in `src/index.css`.

### Dark mode is a remap, not a variant

Several views were authored with light surfaces only. Rather than adding a
`dark:` variant to several hundred class names, `src/index.css` remaps the
light surface utilities inside `.rr-surfaces` to tokens each palette tints.
Two consequences:

- **An element that declares its own `dark:` variant is left alone.** The
  remap rules carry `:not([class*="dark:bg-"])` guards, so opting out is just
  a matter of writing the variant.
- **Opacity modifiers are separate classes.** `bg-white/70` is not `.bg-white`,
  so it needs its own rule. There are rules for the opacity variants now, but
  they are anchored to the start of the class list or a space so a `hover:`
  variant is not caught. A new translucent surface shade needs adding to both
  the opaque and the opacity blocks.

This is the single most common source of invisible text in this app. A 70%
emerald-50 wash on the calculator's milestone card sat there for a while
measuring 1.27:1 in dark mode.

### The landing page is its own theme

`.rr-landing` in `src/components/landing-3d.css` defines its own tokens
(`--ink`, `--line`, `--lime`, `--brand`) and does not use `.rr-surfaces`. Do
not reach for app tokens there, and do not assume a Tailwind slate shade will
read correctly — the page is light and was converted from a dark design, so
`bg-slate-900/60` left in place means dark-on-dark.

### Don't nest `GlowCard`

`src/components/ui/spotlight-card.tsx` paints its blurred halo through a
sibling element marked `data-glow-halo`. That used to be selected with a
descendant combinator, so a `GlowCard` inside a `GlowCard` became the halo:
absolutely positioned, blurred 30px, background stripped, pointer events off.
The attribute is scoped now, but nesting is still not a layout these cards
were designed for.

## Modals

Use `useModalDialog` from `src/hooks/useModalDialog.ts`. Spread `dialogProps`
on the overlay element and give it the `ref`. It supplies `role="dialog"`,
`aria-modal`, an accessible name, focus in on open and back to the opener on
close, a Tab trap, a body scroll lock and Escape to close.

- Pass `open` for a modal that stays mounted and returns `null` while closed —
  most of them do — so the hook stays inert until it is on screen.
- Pass `closeOnEscape: false` if the component already binds Escape.
- Pass `autoFocus: false` if it focuses a particular field itself.

`tests/visual/dialogs.test.ts` reads the source of every `*Modal.tsx` and
fails if one neither declares `role="dialog"` nor uses the hook.

## Sign-in

The server owns the decision. Both client sign-in paths keep an offline branch
for a build hosted with no backend, and the Google one reads the ID token
**without verifying its signature**, because checking a Google signature needs
a server. So the rule is: any answer from the server is final, and the offline
branch runs only on a real network failure. Loosening that turns every refusal
— a wrong password, a rate limit, a demand for a verification code — into a
second chance at signing in unverified.

`REQUIRE_LOGIN_OTP` puts a six-digit emailed code between the first factor and
the account. Codes are stored as salted scrypt hashes, generated with
`crypto.randomInt`, expire in ten minutes, allow five wrong guesses and are
consumed on first use. Delivery is a webhook the operator configures; with
codes required and no delivery set up, sign-in **fails closed** rather than
skipping the step. `OTP_DEV_ECHO` returns the code to the browser for local
work and is refused outright under `NODE_ENV=production`.

`src/server/rateLimit.ts` throttles the auth routes on the caller's address and
on the identifier being tried. `trust proxy` is deliberately off, so `req.ip`
is the socket address and `X-Forwarded-For` cannot mint a fresh identity.

## Numbers must be measured, not plausible

The README has the full rule and it is the most important convention here: a
figure presented as evidence about the learner — a Sharpe ratio, an execution
score, an R-multiple — must come from their actual trades or not be shown. An
unavailable number is omitted, or replaced with what is missing
(`0/8 closed trades needed`). Never a stand-in.

Two places this shapes the design rather than just the copy:

- **Order costs.** `src/utils/tradeCharges.ts` models what an order would cost
  at a real broker. The ticket shows it and says plainly that the simulator
  charges none of it. It replaced a line reading "₹0.00 (Zero Fee)", which was
  true of the simulator and false about investing.
- **The class board.** Trades execute on the device; the server never sees an
  order. So its fields are named `reported`, the response carries
  `verified: false`, and the panel tells the reader the figures are not
  checked. Do not quietly start ranking on them as though they were measured.

## Accessibility is gated, not aspirational

- **Contrast.** `npm run test:visual` measures every text node in every view,
  in both themes and all seven palettes, against the colour actually painted
  behind it. Translucent layers are composited, because that is what the
  browser does. New routed views go in `VIEWS` in `tests/visual/contrastAudit.ts`.
- **Target size.** 24×24 CSS px is the floor on any pointer. A visual dot or
  pill smaller than that goes inside a button that meets it, rather than being
  the button.
- **The comfort setting.** `largeTouchTargets` raises controls to 44px, but
  only under `(pointer: coarse)`. A narrow desktop viewport does not match
  that media query, so measuring targets in a resized desktop browser tells
  you nothing about phones — emulate a touch device.

## Density

`data-rr-density` on `<html>` scales card padding, stacked-block rhythm and
table rows from `src/index.css`. It deliberately leaves type size and controls
alone: the first version let the padding rules reach buttons and put thirty
controls on the screener under the 24px floor.

## SVG ids must be unique per instance

Charts render more than once on a page. Build gradient and filter ids with
`React.useId()`. Ids derived from the data alone collide, and `url(#id)`
resolves to whichever the document declares first, so the second chart is
painted with the first one's fill.

## Security

- `ADMIN_PASSKEY` has no default. The admin API accepts it in the
  `x-admin-key` header only — never a query string, never an email allowlist.
- `DEMO_ACCOUNT_PASSWORD` likewise has no default; without it a random one is
  generated per boot.
- Client-side checks are for UX. The server decides, and `res.ok` is the only
  authority on whether an admin request succeeded.

## Git

Commit messages are prose, not bullet dumps: what was wrong, how it presented,
what fixed it. The reasoning belongs in the message and in comments, not in
the chat that produced it.
