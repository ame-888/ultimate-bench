# Website review — 23 October 2026

The review covered Ultimate Bench's source, production build, all 22 existing routes, and a new custom 404 page. Functional and accessibility repairs are implemented in this change. Canonical benchmark scores, protocols, and qualification rules retain their existing definitions.

The branch incorporates upstream commit `696ef0c`, including the latest GPT-6 Sol Visual results, before final verification.

## Findings and repairs

| Priority | Finding and effect | Repair |
| --- | --- | --- |
| High | The mobile leaderboard expanded to about 866px inside a 375px viewport. Headings, search, filters, and results were clipped by the page. An extra closing `div` also made the homepage structure malformed. | Corrected the markup, constrained the flex child, and kept horizontal scrolling inside the results table. Verified at 320, 375, and 1440px. |
| High | `npm audit` reported 20 dependency advisories, including high and critical severities. The dependency tree included an unused React integration. | Updated Astro 5 to 7.4.2 and affected tooling, removed React and its integration, and refreshed the lockfile. Final audit: zero reported vulnerabilities. The site remains a static build; the advisory count is not a count of demonstrated production exploits. |
| High | Cookie preferences could throw when storage was blocked or malformed. Revoking advertising consent left already-running advertising code on the current page. Saving an initial choice could also reset the scroll position. | Guarded storage reads and writes, retained an in-memory choice, removed unrelated scroll restoration, and reload after saving withdrawal. Verified withdrawal with a stub advertising script; it is absent after reload. |
| High | Dialogs left surrounding content interactive, trapped focus inconsistently, and relied on `transitionend` for arena cleanup even when reduced motion disables transitions. | Added shared dialog isolation, focus trapping, scroll locking, synchronous cleanup, and focus restoration. Verified all three arena dialogs and achievements with reduced motion. |
| Medium | Closed mobile navigation links remained keyboard-focusable. Escape did not close the menu, and JavaScript failure left mobile navigation inaccessible. | Make the collapsed menu inert, synchronize resize state, support Escape/outside dismissal, enlarge the toggle, and leave links visible without JavaScript. Removed obsolete homepage interception logic. |
| Medium | Automated WCAG checks found 152 element/rule findings across the existing routes, including low contrast, unsupported ARIA labels, and scrollable tables without keyboard access. | Improved text/link contrast; supplied table, row, header, and cell roles in arena details; made table regions focusable; corrected status-graphic semantics; and added arrow-key behavior to analysis tabs. Final automated page and arena-dialog checks report no violations for the tested rules. |
| Medium | The arcade high-score button had no listener; “Suggest a game” dispatched an event with no consumer; idle arcade code canceled page arrow-key scrolling. | Wired records and suggestions to working destinations, and restricted game input handling to active games. |
| Medium | Canvas games used mouse-only events. Invalid saved high scores could crash rendering or insert untrusted strings into HTML. The adventure UI claimed a save succeeded even when storage failed. | Added pointer events and capture, validated stored score shapes and values, and display save failures accurately. Verified game launch/return, board input, malformed scores, and blocked storage. |
| Medium | Relative release ages were not refreshed because the updater searched the model-name container while the age lived in a sibling cell. Exactly 30 days could display “0 months ago.” | Update the correct row cell and clamp the month count. Added a date-boundary regression test and verified with a future browser clock. |
| Medium | Analysis independently assigned sequential “official” ranks and broke ties. | Read official ranks from canonical output and use the shared tie-aware utility for exploratory ranks. Clarified the resilience sorter explanation and unknown-result treatment. |
| Medium | Articles emitted conflicting `og:type` tags. Missing pages lacked the site's navigation and recovery links. | Emit one correct Open Graph type, escape JSON-LD script content, and add a noindex 404 page excluded from the sitemap. |
| Medium | The default Node 24 test discovery tried to execute TypeScript API fixtures as tests. Tests also depended on a transitive esbuild installation. | Discover only `*.test.js`, declare esbuild directly, update the PDF parser cleanup API, and document Node 24/minimum 22.23.4. |
| Low | Focus treatment and reduced-motion behavior varied between pages. Deployment configuration lacked explicit MIME-sniffing, referrer, and framing protections. | Added shared focus/reduced-motion defaults and response-header configuration. Actual Vercel header delivery still needs a deployment check. |

## Verification

- `npm test`: **75 passed, 0 failed**, including canonical scoring, coverage, progression, metadata, analysis, malformed storage, date boundaries, and PDF publication checks.
- `npm run build`: **23 pages**, both methodology PDFs (9 pages), and a sitemap containing **21 indexable routes**. The consolidated publication and 404 remain excluded as intended.
- `npm run check`: **0 errors, 0 warnings**; 21 existing/nonblocking diagnostic hints remain.
- `npm audit`: **0 vulnerabilities** at review time.
- `npm run test:browser`: **69 route/viewport checks**, **11 interaction flows**, **0 failures**. All routes were exercised at 1440, 375, and 320px. WCAG 2 A/AA and 2.1 AA automated checks ran at 375px and inside the three arena dialogs. Internal route/anchor targets and duplicate IDs were checked.
- Browser flows cover consent dismissal and withdrawal, navigation, search/provider filters, sorting, dialog focus/cleanup, chart controls, arcade records and game input, worksheet download, browser-clock dates, blocked storage, and JavaScript disabled.
- Desktop and mobile leaderboard screenshots were inspected locally. `git diff --check` passes.

The browser audit is reproducible through `scripts/browser-audit.mjs`; setup is documented in the README. Detailed JSON output is written to ignored `work/browser-audit.json`.

## Remaining follow-up

| Priority | Follow-up | Reason |
| --- | --- | --- |
| High when serving personalized advertising | Verify the production consent/CMP configuration for the intended audience. | `CookieBanner.astro` already documents the Google-certified CMP requirement for relevant regions. The custom preference control and the local stub test do not establish that production advertising setup. |
| Medium | Recheck published prices and add verified prices for omitted configurations. | `PRICING_CHECKED_ON` is still 2026-07-27. Missing-price exclusions are explicit; no prices were invented during this review. |
| Medium | Measure production Core Web Vitals and compressed transfer sizes. | The homepage contains about 493KB of HTML before compression. All arena details are rendered up front, and styles are intentionally inlined to avoid previously documented deployment-cache failures. Real-user or production measurements should guide any lazy-loading or stylesheet-caching change. |
| Medium | Confirm Node 24 and response headers in Vercel after merge/deployment. | Local builds and configuration checks pass; deployment settings and production responses were not inspected. |
| Low | Consider on-screen direction controls for Snake, Tetris, and Breakout, and extract repeated arena markup into a component. | Pool and Tic-Tac-Toe now accept pointer input; the other action games remain keyboard-oriented. Repeated page markup increases future maintenance cost. |

## Review limits

Testing used the locally served production artifact in Chromium. External font and advertising requests were blocked; the consent-withdrawal test uses a deterministic local stub. Live hosting, real advertising behavior, external pricing sources, other browser engines, and field performance were not verified. Automated accessibility checks supplement manual keyboard and visual checks and do not establish complete WCAG conformance. Existing tests validate data shape and published arithmetic, not the truth of underlying evaluation records.
