# Ultimate Bench

Ultimate Bench is an independent experimental benchmark and static Astro site comparing recorded AI model results across **Visual Bench**, **Data Retrieval Bench**, and **Chess Bench**. It does not measure general intelligence or progress toward AGI.

## Canonical scoring and statuses

Ultimate Bench uses **Progressive Level Weighting** in every arena. Active Level `n` has weight `2^(n-1)`, producing weights `1, 2, 4, 8, 16, 32`. An arena score is `Σ(result × included active weight) / Σ(included active weights)`. Overall is the equal-weight arithmetic mean of the three full-precision arena scores. Values are rounded only for display. Token price never affects level results, arena scores, Overall, or canonical ranks; it appears only in a separate cost/performance comparison and Pareto frontier.

- **Visual Bench:** Levels 1–5 (Mole, Rhino, Chimpanzee, Owl, Eagle) Active; Level 6 (Beholder) Planned. Full-coverage denominator: 31.
- **Data Retrieval Bench:** Levels 1–4 (Worm, Koala, Crow, Octopus) Active; Levels 5–6 (Raven, Athena) Planned. Full-coverage denominator: 15.
- **Chess Bench:** Levels 1–5 (Mouse, Spider, Wolf, Hawk, Python) Active; Level 6 (Hydra) Planned. Full-coverage denominator: 31.

A numeric zero is valid and retains its weight. `INVALID` contributes zero and retains its weight. `UNAVAILABLE` is excluded with its weight and reduces displayed coverage. `NOT_TESTED` means not attempted, is excluded, and counts as incomplete coverage. Missing active results and unknown statuses are validation errors. Planned and Locked levels are excluded; a Locked level additionally requires a complete protocol and explicit unlock condition. No current level is Locked and no current record uses `NOT_TESTED`.

Global qualification requires computable scores in all three arenas, canonical status values for every active result, and no more than one `UNAVAILABLE` or `NOT_TESTED` active level in any arena. Equal full-precision scores share rank; alphabetical ordering between ties is presentation only.

Canonical definitions are in [`src/data/benchmarkSpec.ts`](src/data/benchmarkSpec.ts), calculations and validation in [`src/data/scoring.ts`](src/data/scoring.ts), and derived leaderboards in [`src/data/leaderboard.ts`](src/data/leaderboard.ts). Published level results remain in [`src/data/benchmarks.ts`](src/data/benchmarks.ts). The scoring migration audit is [`reports/scoring-migration.md`](reports/scoring-migration.md).

## Public and protected benchmark information

Public protocols may describe the evaluated construct, already-public prompt templates, administration count, transformation categories, scoring, validity rules, model configuration, limitations, and reproducibility expectations. Exact held-out stimuli, queried items or coordinates, answer keys, unreleased cases, and details that directly enable memorization or gaming remain protected. Visual Bench Levels 1–5 have public detailed protocols; Level 6 is Planned and not operationally defined.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Canonical leaderboard, arena results, status legend, and cost comparison |
| `/methodology/` | Canonical scoring, statuses, qualification, transparency, and limitations |
| `/methodology/visual-bench/` | Detailed Visual Bench Levels 1–5 and Planned Level 6 |
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
