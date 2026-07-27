/** Published API token rates in USD per one million tokens.
 *
 * Thinking and code-execution variants inherit their base model's token rate.
 * Prices are kept here (rather than in the view) so the effective rate and the
 * date it was checked can be audited and updated independently of benchmark data.
 */
export const PRICING_CHECKED_ON = '2026-07-27';
export const COST_SENSITIVITY_ALPHA = 15;
export const IDEAL_BLENDED_COST = 1;

export const modelPricing = {
    'GPT-5.6 Sol (high)': { input: 2.50, output: 15.00, source: 'https://openai.com/api/pricing/' },
    'GPT-5.5': { input: 2.00, output: 14.00, source: 'https://openai.com/api/pricing/' },
    'GPT-5.5 Instant (0529)': { input: 0.25, output: 2.00, source: 'https://openai.com/api/pricing/' },
    'GPT-5.5 Instant (0505)': { input: 0.25, output: 2.00, source: 'https://openai.com/api/pricing/' },
    'Gemini 3.1 Pro Preview': { input: 2.00, output: 12.00, source: 'https://ai.google.dev/gemini-api/docs/pricing' },
    'Gemini 3.5 Flash': { input: 0.50, output: 3.00, source: 'https://ai.google.dev/gemini-api/docs/pricing' },
    'Gemini 3.0 Flash Preview': { input: 0.50, output: 3.00, source: 'https://ai.google.dev/gemini-api/docs/pricing' },
    'Gemini 3.1 Flashlite GA': { input: 0.10, output: 0.40, source: 'https://ai.google.dev/gemini-api/docs/pricing' },
    'Claude 5 Fable (high)': { input: 5.00, output: 25.00, source: 'https://docs.anthropic.com/en/docs/about-claude/pricing' },
    'Claude 4.6 Sonnet (max thinking)': { input: 3.00, output: 15.00, source: 'https://docs.anthropic.com/en/docs/about-claude/pricing' },
    'Claude 4.6 Sonnet (adaptive thinking)': { input: 3.00, output: 15.00, source: 'https://docs.anthropic.com/en/docs/about-claude/pricing' },
    'Grok 4.3 Fast': { input: 0.20, output: 0.50, source: 'https://docs.x.ai/docs/models' },
    'Muse Spark 1.1': { input: 0.20, output: 0.80, source: 'https://llama.developer.meta.com/docs/pricing/' },
    'Muse Spark (thinking)': { input: 0.20, output: 0.80, source: 'https://llama.developer.meta.com/docs/pricing/' }
} as const;

export function blendedCost({ input, output }: { input: number; output: number }) {
    return (0.75 * input) + (0.25 * output);
}

export function costEfficiencyScore(score: number, cost: number, alpha = COST_SENSITIVITY_ALPHA) {
    if (cost <= 0) throw new RangeError('Blended cost must be greater than zero.');
    const costPenalty = alpha * Math.max(0, Math.log10(cost / IDEAL_BLENDED_COST));
    return Math.max(0, Math.min(100, score - costPenalty));
}
