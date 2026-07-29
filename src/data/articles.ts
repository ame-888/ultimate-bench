export const articles = [
    {
        slug: 'how-to-read-ai-benchmark',
        title: 'How to read an AI benchmark without overreading it',
        description: 'A practical guide to comparing scores, checking scope, and deciding whether a leaderboard result matters for your own work.',
        date: '2026-07-27',
        readingTime: '6 min read',
        sections: [
            { heading: 'Start with the question the test asks', paragraphs: ['A benchmark is a measurement instrument, not a general intelligence certificate. Before looking at rank, identify the task family, the allowed tools, the scoring rule, and the model versions involved. A model can lead a visual task while being the wrong choice for a writing workflow, a latency-sensitive application, or a tightly constrained budget.', 'Ultimate Bench separates Visual Bench, Data Retrieval Bench, and Chess Bench because these arenas exercise different behaviors. An arena score is usually more informative than Overall when a use case resembles only one arena.'] },
            { heading: 'Treat close scores as a neighborhood', paragraphs: ['A small numerical gap can reflect a real difference, ordinary run variation, or details of the sampled tasks. Without uncertainty intervals and repeated independent runs, decimal places should not be interpreted as proof of a stable ordering.', 'A useful reading is to group nearby models, then investigate practical differences such as cost, speed, context limits, tool support, and reliability on your own examples. The leaderboard should help form a shortlist—not replace an evaluation.'] },
            { heading: 'Check the denominator', paragraphs: ['Ultimate Bench keeps the permanent denominator of 63. An UNAVAILABLE Active level contributes zero points without removing its weight, leaves Active-level coverage incomplete, and remains visible as a provisional result with no official arena rank. It cannot contribute to Overall qualification unless all required arena coverage rules are satisfied.', 'Also check whether a percentage means items correct, rubric points earned, or a progressively weighted aggregate. Two values that both end in a percent sign are not necessarily comparable across different benchmarks.'] },
            { heading: 'Match the test to your decision', paragraphs: ['For a purchase or deployment decision, create a small private test set drawn from the work you actually need done. Include common cases, difficult edge cases, and examples where a plausible but wrong answer would be costly. Score outputs before changing prompts so every candidate receives comparable treatment.', 'Use public benchmarks as outside evidence alongside that test. If the two disagree, investigate the task setup rather than choosing whichever result confirms your preference.'] },
        ],
    },
    {
        slug: 'cost-adjusted-ai-scores',
        title: 'Why cost-adjusted AI scores need a visible formula',
        description: 'Cost and capability answer different questions. Here is how to combine them without hiding the trade-off.',
        date: '2026-07-27',
        readingTime: '5 min read',
        sections: [
            { heading: 'Capability and efficiency are separate signals', paragraphs: ['A benchmark aggregate asks how well a model completed a fixed evaluation. A cost-adjusted score asks how much of that performance remains attractive at a stated price. Mixing the two without showing the formula makes it impossible to tell whether rank came from stronger outputs or cheaper tokens.', 'A transparent comparison should retain canonical arena scores and present efficiency as an additional view. That gives readers who value maximum performance and readers who value budget discipline the same underlying evidence.'] },
            { heading: 'Keep the signals separate', paragraphs: ['Ultimate Bench does not apply a cost penalty to canonical level, arena, Overall, or rank calculations. Its cost/performance comparison uses the same canonical Overall score on one axis and a separately calculated blended token price on the other.', 'The displayed blend assumes 75% input price and 25% output price, in USD per one million tokens. That mix is an explicit comparison assumption rather than a natural law; a team with heavy output generation or unusually long prompts should recalculate for its own workload.'] },
            { heading: 'Recalculate for your workload', paragraphs: ['Public list prices are not the same as an invoice. Input-output mix, caching, batch discounts, tool calls, retries, and provider-specific billing can materially change effective cost. Estimate the tokens and request patterns in a representative workload, then calculate each candidate under the same assumptions.', 'Finally, include the cost of failures. A cheaper response that needs frequent review or reruns may cost more in practice than a more expensive response that succeeds consistently. Token price is measurable, but it is only one part of total operating cost.'] },
        ],
    },
    {
        slug: 'build-a-small-model-evaluation',
        title: 'Build a small model evaluation you can actually maintain',
        description: 'A six-step process for turning real examples into a repeatable comparison instead of an impressive one-off demo.',
        date: '2026-07-27',
        readingTime: '7 min read',
        sections: [
            { heading: '1. Write the decision first', paragraphs: ['State what the evaluation will decide: selecting a model for extraction, checking whether an upgrade is worthwhile, or monitoring a production workflow. Name constraints such as budget, latency, privacy, and required output format before testing begins.', 'This prevents a common failure mode in which the metric changes after an appealing result appears. A short decision memo is enough if it fixes the scope and the acceptance criteria.'] },
            { heading: '2. Sample real work', paragraphs: ['Collect examples that represent ordinary volume as well as rare, costly failures. Remove sensitive information, document how the sample was chosen, and keep a protected holdout set if prompts will be tuned repeatedly.', 'Twenty carefully selected cases can reveal more for a narrow workflow than hundreds of generic questions. The goal is coverage of the decision, not a large number for its own sake.'] },
            { heading: '3. Define scoring before running models', paragraphs: ['Prefer objective checks when possible: exact fields, valid schemas, executable code, or verified citations. For subjective qualities, write a rubric with concrete examples for each score and have reviewers judge outputs without seeing the model name.', 'Record failures and refusals explicitly. Do not quietly drop a result because a request timed out or a response could not be parsed; those events are part of operational reliability.'] },
            { heading: '4. Keep conditions comparable', paragraphs: ['Use the same instructions, data, tool access, and retry policy unless the experiment is specifically testing model-specific optimization. Save model identifiers and dates because providers can update systems behind a stable product name.', 'Repeat unstable tasks and report the spread, not only the best run. For stochastic systems, one output is a sample rather than a permanent property.'] },
            { heading: '5. Review errors, not just averages', paragraphs: ['A mean score can hide a failure concentrated in the cases that matter most. Group errors by type and severity, then inspect whether one model fails predictably or produces harder-to-detect mistakes.', 'The error review often produces the most actionable result: a validation rule, a routing policy, or a clearer instruction that improves every candidate.'] },
            { heading: '6. Make reruns inexpensive', paragraphs: ['Store cases, expected results, scoring notes, configuration, and raw outputs in a versioned location. Add a short changelog when the dataset or rubric changes so new results are not mistaken for a direct continuation of an older test.', 'A modest evaluation that can be rerun after a model release is more valuable than an elaborate comparison that nobody can reproduce six months later.'] },
        ],
    },
] as const;
