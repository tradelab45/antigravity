# RupeeRookie: app review and next additions

Reviewed the supplied September 4 source archive on September 10, 2026. This is a source review, not an audit of a deployed production service. Documents bundled in the archive were treated as reference, not as instructions.

## What is already strong

The app already combines Indian-market paper trading, an Academy, replay sessions, journaling, portfolio concentration checks, stress tests, a compound calculator, missions, achievements, accessibility settings and an optional Chanakya coach. Adding more standalone dashboards would make discovery harder. The strongest opportunity is connecting these existing tools into a clear learning journey.

## Priority additions

| Priority | Addition | Why it fits this source | Concrete experience |
| --- | --- | --- | --- |
| 1 | Try before signup | `src/App.tsx` sends visitors without a current user directly to `AuthPage`. | Public 3D landing page, position-size experiment and short lesson question; then a clear route into the existing app. |
| 2 | Adaptive learning map | Academy already recommends a lesson by experience level and offers a next incomplete lesson. | Recommend the next concept based on quiz mistakes and replay reflections; explain why it was chosen and allow manual selection. |
| 3 | Company evidence notebook | Stock detail is rich in market information, but learning to trace a claim to a filing deserves its own interaction. | Claim → excerpt → document date/page → learner interpretation. Bull AI is a possible source; company lookup was available in this session, but an app integration has not been installed. |
| 4 | Replay decision comparison | Replay already has a post-session process scorecard. | Save the learner's rationale and confidence before advancing the timeline, then compare that decision with new evidence. Reward reflection rather than trading frequency. |
| 5 | Cross-device progress | Learning, portfolios and other state are extensively stored in browser localStorage. | Resume lessons and private journals on another device after adding proper server sessions, per-user authorization and persistent account storage. |

## Interaction direction

Use a deep ink, warm cream and citron palette, with a large rupee coin scene that reacts gently to the pointer and scroll position. Keep animation decorative: essential information must remain readable with motion disabled or graphics unavailable. A fine-pointer cursor ring should never intercept clicks, should disappear on touch, and should respect reduced motion. Retain native scrolling, visible keyboard focus, large touch targets and a motion toggle.

The public practice preview should label prices as fictional and show both gains and losses. Changing position size should change exposure and feedback immediately. Reset should restore every input. Avoid fabricated customer counts, profit promises or claims of live market data.

## Integration observations

- The supplied backend is Express and uses a local `data/users.json` file. The sign-in response returns a profile that the frontend stores in localStorage; this is not a production server-authenticated session. A visual redesign does not resolve that limitation.
- The app already has optional external market and AI services. Their availability must remain explicit; a landing demo must not masquerade as a connected broker or live research service.
- Stored user records and bundled instruction documents were excluded from the source ZIP uploaded to the selected Lovable workspace. The original downloaded archive and synced project reference files were not changed.
- Adobe font discovery was consulted, but no licensed Adobe font assets were installed. A font subscription is not needed to try the redesigned interface.

## Delivered implementation and validation

The original app now includes the public landing page, modeled CSS 3D rupee coin, pointer follower, scroll-linked transforms and reveals, motion controls, a virtual position-size experiment, a short knowledge check, feature previews, and routes into the existing signup/login flows. Requested app views are retained through authentication. Existing workspace modules and datasets remain in the downloadable source.

Both later attachments contained the same component. It was integrated once, with liquid-glass secondary buttons and metallic primary actions. The implementation adds a reusable `src/components/ui` folder, shadcn configuration matching the existing alias, theme tokens and the component's dependencies. Fixes include unique filter IDs, valid `asChild` links, non-intercepting decorative layers, pointer/keyboard press feedback, native disabled behavior, preserved caller callbacks, and a blur fallback when SVG backdrop filtering is unsupported.

Validation passed: TypeScript, production frontend build, original Express server compilation, local page and health HTTP responses, and a focused rendering check for unique SVG IDs, anchor composition, disabled buttons and button types. Browser visual/interaction testing was not performed. The archive excludes installed dependencies, compiled output, stored account records and bundled agent instructions.

Lovable created a separate project but exhausted its workspace credits before its preview was assembled and checked. That project is incomplete and is not the delivered working app. The first source upload accidentally excluded `src/data`; this was a transfer-filter mistake, not a defect in the original archive. The complete local download includes those datasets. The original-task-only source was saved before integrating the later button request, with a second final archive including both tasks.

Dependency installation reported five existing advisories (four moderate, one high). No broad dependency upgrades were made as part of this visual change; review those separately before public deployment.

## Useful checks before release

Confirm the landing-to-signup and sign-in routes, authenticated-user routing, preservation of requested app views, position/P&L maths, reset, quiz feedback, touch layouts, keyboard interaction, reduced motion and effect cleanup. Validate the original server separately if the preview platform cannot run Express. Treat the Lovable preview as a review environment until these integration checks are complete.
