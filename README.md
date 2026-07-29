# Ultimate Bench

Ultimate Bench is an independent experimental benchmark and static Astro site comparing recorded AI model results across **Visual Bench**, **Data Retrieval Bench**, and **Chess Bench**. It does not measure general intelligence or progress toward AGI.

## Canonical scoring and statuses

Ultimate Bench uses **fixed six-level normalization**. Every arena defines exactly six weights (`1, 2, 4, 8, 16, 32`), and derives the permanent full-ladder denominator `63` from those definitions. The canonical formula is `Σ(earned result × level weight) / 63`; Overall is the equal arithmetic mean of the three full-precision arena scores.

- **Visual:** Mole, Rhino, Chimpanzee, Owl, Eagle Active; Beholder Planned. Operational weight 31/63; current maximum 49.21%.
- **Data Retrieval:** Worm, Koala, Crow, Octopus Active; Raven and Athena Planned. Operational weight 15/63; current maximum 23.81%.
- **Chess:** Mouse, Spider, Wolf, Hawk, Python Active; Hydra Locked. Operational weight 31/63; current maximum 49.21%. Hydra may become Active, by deliberate benchmark-version decision, after an evaluated model obtains a numeric score above 0 on Python.

Numeric results and `INVALID` provide Active-level coverage; `INVALID` earns zero. `UNAVAILABLE` and `NOT_TESTED` preserve their textual status, earn zero without shrinking denominator 63, and make coverage incomplete and the score provisional. Planned and Locked levels reserve capacity without model score or origin fields and do not affect Active-level coverage. Attempted zero is numeric `0`; progression-gated zero is numeric `0` with explicit origin metadata; reserved zero is derived globally and displayed as `PLANNED` or `LOCKED`, never `0%`.

Official arena rank requires complete Active-level coverage. Overall qualification requires eligibility in all three arenas. Corresponding weights now have equal potential influence across arenas; no arena multiplier is used.

**Migration · 29 July 2026:** Hydra returned from Active to Locked because no model had passed Python; Hydra result and origin fields were removed. All arenas now reserve all six weights. Visual, Data Retrieval, Chess, and Overall scores changed, and former active-only-denominator scores are not directly comparable.

Canonical definitions are in [`src/data/benchmarkSpec.ts`](src/data/benchmarkSpec.ts), calculations and validation in [`src/data/scoring.ts`](src/data/scoring.ts), and derived leaderboards in [`src/data/leaderboard.ts`](src/data/leaderboard.ts).

## Public and protected benchmark information

Public protocols describe the evaluated construct, administration count, transformation categories, scoring, validity rules, product/interface configuration, limitations, and audit expectations. Active images, exact questions, character layouts, answer keys, and reconstructable transformation details remain confidential to reduce contamination and benchmark-specific optimization. Visual Bench Levels 1–5 and Chess Bench Levels 1–5 have Active public protocols. Visual Level 6 is Planned; the existing Hydra protocol is Locked and has no model results. DATA Bench now has a dedicated protocol page for Active Levels 1–4, the proposed Raven structure while it remains Planned, and Planned Athena without an inferred task.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Canonical leaderboard, arena results, status legend, and cost comparison |
| `/methodology/` | Canonical scoring, statuses, qualification, transparency, and limitations |
| `/methodology/visual-bench/` | Visual Bench administration, security, scoring, Active Levels 1–5, and Planned Level 6 |
| `/methodology/data-bench/` | DATA Bench administration, exact-answer adjudication, Active Levels 1–4, and Planned Levels 5–6 |
| `/methodology/chess-bench/` | Chess Bench match rules, progression, scoring, and five Active protocols and the Locked Hydra protocol |
| `/analysis/` | Canonical findings and clearly labeled exploratory statistics |
| `/about/`, `/contact/` | Project and contact information |
| `/privacy/`, `/terms/` | Implementation-specific policy and rights terms |
| `/blog/` | Evaluation guides |
| `/arcade/` | Optional local browser games |

Contact for general inquiries, corrections, result disputes, and privacy requests: **ultimatebench.contact@gmail.com**.

## Development and verification

```sh
npm ci
npm test
npm run build
npm run check
npm run dev
```

The build validates benchmark records before rendering and then generates sitemaps from every generated HTML route. The repository does not include an evaluation runner, raw evaluation artifacts, uncertainty analysis, or independent result verification. A successful build validates data shape and presentation, not the accuracy or representativeness of recorded results.

## Licensing and review

Original software code is licensed under the [MIT License](LICENSE), permitting inspection, forks, modification, and redistribution under its terms. The MIT License does not cover branding, editorial content, benchmark prompts or protocols, protected test materials, benchmark datasets or result records, or non-code assets; see [RIGHTS-NOTICE.md](RIGHTS-NOTICE.md). Public results may be referenced or quoted with attribution, but there is no general open-data license.

The content-rights notice, Terms, Privacy Policy, consent language, hosting configuration, retention practices, and regulatory obligations require final owner and professional legal review.
