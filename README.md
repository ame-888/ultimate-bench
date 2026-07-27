# Ultimate Bench

Ultimate Bench is an independent experimental benchmark and static Astro site for comparing AI model results across visual, data, and chess evaluations. It includes the benchmark leaderboard, supporting methodology and policy pages, a small blog placeholder, and an interactive arcade.

## Public routes

| Route | Purpose |
| --- | --- |
| `/` | Benchmark leaderboard |
| `/methodology/` | Methodology, aggregation, and interpretation notes |
| `/methodology/visual-bench/` | Detailed Visual Bench level protocols |
| `/about/` | Project overview |
| `/contact/` | Contact information |
| `/privacy/` | Privacy policy |
| `/terms/` | Terms of service (governing law is pending owner/legal review) |
| `/blog/` | Practical AI evaluation guides |
| `/arcade/` | Interactive arcade |

Visual Bench Levels 1 (Mole), 2 (Rhino), 3 (Chimpanzee), and 4 (Owl) are documented in full. Protocols for Levels 5–6 will be added progressively.

Astro generates these pages into `dist/`. The post-build sitemap generator discovers every generated HTML route rather than relying on a manually maintained route list. `robots.txt`, `sitemap-index.xml`, and `sitemap-0.xml` are served from the site root.

## Benchmark data and presentation

Published benchmark records live in [`src/data/benchmarks.ts`](src/data/benchmarks.ts). The leaderboard rendering and client-side sorting live in [`src/pages/index.astro`](src/pages/index.astro); shared rank labels are in [`src/data/RaritySystem.ts`](src/data/RaritySystem.ts). Update benchmark records deliberately and review score provenance before publication.

The site presents recorded experimental results. The repository does not currently include an automated evaluation runner, raw evaluation artifacts, statistical uncertainty analysis, or independent result-verification workflow. A successful site build validates rendering and types handled by Astro, but does **not** validate the accuracy, reproducibility, or representativeness of benchmark scores.

## Local development

Requires a current Node.js release supported by Astro 5 and npm.

```sh
npm ci
npm run dev       # development server, normally http://localhost:4321
npx astro check   # Astro diagnostics (requires optional @astrojs/check and TypeScript packages)
npm run build     # production build plus sitemap generation
npm run preview   # preview the generated dist/ build
```

After building, manually review every public route, canonical and social metadata, consent choices, `robots.txt`, and both sitemap files. Advertising code must remain absent until advertising consent is granted.

## Deployment

The canonical production origin is <https://ultimate-bench.vercel.app/>. Connect the repository to Vercel, use `npm run build` as the build command, and publish `dist/` (the Astro preset is static output). Each deployment should start from `npm ci`, pass the production build, and be smoke-tested at its deployment URL before promotion. Canonical metadata intentionally continues to point to the production origin on preview deployments.

## Legal and privacy review

The terms, privacy policy, and consent text should be reviewed for the operator's actual hosting, analytics, advertising configuration, audience, retention practices, and regulatory obligations before production use.
