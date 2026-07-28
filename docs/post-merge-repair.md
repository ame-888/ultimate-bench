# Post-merge repair report

This follow-up to PR #332 removes two redundant Data Retrieval records while preserving every legitimate benchmark result and the canonical Progressive Level Weighting methodology.

## Invariants and baseline comparison

The pre-repair and post-repair canonical global leaderboard both contain 14 qualified models. Every model retains the same full-precision arena scores, Overall score, and competition rank. GPT-5.6 Sol remains first with Visual `688 / 31`, Data Retrieval `311 / 15`, Chess `469 / 31`, and Overall `19.351971326164875`.

The canonical model collection is now independent of the validated pricing subset. Pricing can omit a point from the cost comparison, but cannot affect visibility, qualification, SOTA, achievements, scores, or ranks.

## Repairs

- Duplicate names now fail canonical validation with the arena, model name, and both record indexes; silent last-record-wins behavior was removed.
- Homepage arena summaries and expanded official ordering consume server-generated leaderboard scores and ranks.
- Pricing validation rejects missing, malformed, non-finite, negative, and zero-blended-cost inputs; logarithmic domains safely handle empty, singleton, and degenerate sets.
- The initial consent notice is non-modal. Its preference UI is a labelled modal with focus trapping, focus restoration, Escape handling for reopened settings, inert fallback, and scroll restoration.
- Global and collapsed canonical standings use native table elements, sortable headers expose `aria-sort`, tooltip labels are contextual, and reduced-motion rules cover non-essential motion.
- The MIT copyright holder is the public operator identity, Ame-888.

## Remaining review

No browser runtime is installed in the repair environment, so desktop/mobile visual regression, live keyboard interaction, network interception, and a browser accessibility audit remain manual checks. Final legal language still requires owner and professional review, as already stated by the project.
