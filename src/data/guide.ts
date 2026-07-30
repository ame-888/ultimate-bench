import { ARENA_LIST, LEVEL_STATUSES, RESULT_STATUSES, canonicalDenominator, operationalWeight } from './benchmarkSpec';
import { benchmarks } from './benchmarks';
import { buildLeaderboard } from './leaderboard';
import type { BenchmarkCollections, BenchmarkRecord } from './scoring';
import { formatAggregateScore } from './formatting';
import { modelPricing, validatePricing } from './modelPricing';

export const guideCapacity = ARENA_LIST.map(arena => {
  const denominator = canonicalDenominator(arena);
  const operational = operationalWeight(arena);
  return { id: arena.id, name: arena.name, denominator, operational, reserved: denominator - operational, maximum: operational / denominator * 100, levels: arena.levels };
});

export const statusRows = [
  { key: 'positive', label: 'Positive numeric result', meaning: 'The level was attempted and earned a score above zero.', points: 'Weighted numeric points', coverage: 'Yes', rank: 'Eligible if all Active levels are covered' },
  { key: 'zero', label: 'Numeric zero', meaning: 'The level was attempted validly but earned no points.', points: '0; weight retained', coverage: 'Yes', rank: 'Still eligible' },
  { key: 'gated', label: 'Progression-gated zero', meaning: 'A later Chess level was not administered after a prerequisite failed; origin metadata distinguishes it from an attempted zero.', points: '0; weight retained', coverage: 'Yes', rank: 'Still eligible' },
  { key: RESULT_STATUSES.INVALID.toLowerCase(), label: RESULT_STATUSES.INVALID, meaning: 'An attempt failed validity requirements. This is not the same event as a valid numeric zero.', points: '0; weight retained', coverage: 'Yes', rank: 'Still eligible' },
  { key: RESULT_STATUSES.UNAVAILABLE.toLowerCase(), label: RESULT_STATUSES.UNAVAILABLE, meaning: 'The evaluation could not be run.', points: '0; denominator unchanged', coverage: 'No', rank: 'Provisional; no official rank' },
  { key: RESULT_STATUSES.NOT_TESTED.toLowerCase(), label: RESULT_STATUSES.NOT_TESTED, meaning: 'The Active level was not attempted.', points: '0; denominator unchanged', coverage: 'No', rank: 'Provisional; no official rank' },
  { key: 'provisional', label: 'PROVISIONAL', meaning: 'A computable arena score has incomplete Active-level coverage.', points: 'Score remains visible', coverage: 'Incomplete', rank: 'No official arena rank or Overall' },
  { key: 'complete', label: 'Complete coverage', meaning: 'Every Active level is included (numeric or INVALID).', points: 'Canonical calculation', coverage: 'Complete', rank: 'Arena rank eligible' },
  { key: 'global', label: 'Globally qualified', meaning: 'The configuration is rank eligible in all three arenas.', points: 'Overall is calculated', coverage: 'Complete in all arenas', rank: 'Eligible for Overall rank' },
] as const;

const collections = benchmarks as unknown as BenchmarkCollections;
const leaderboard = buildLeaderboard(collections);
const releaseDates = new Map<string, string>();
for (const arena of ARENA_LIST) for (const row of (collections[arena.dataKey] ?? []) as BenchmarkRecord[]) if (row.releaseDate) releaseDates.set(row.name, row.releaseDate);

export const guideComparisonRows = leaderboard.rows.map(row => {
  const pricing = validatePricing(modelPricing[row.name as keyof typeof modelPricing]);
  return {
    name: row.name, rank: row.rank, overall: formatAggregateScore(row.score),
    arenas: Object.fromEntries(ARENA_LIST.map(arena => [arena.id, formatAggregateScore(row.scores[arena.id])])),
    coverage: Object.fromEntries(ARENA_LIST.map(arena => [arena.id, row.results[arena.id].coverage])),
    releaseDate: releaseDates.get(row.name) ?? 'Not recorded',
    pricing: pricing.valid ? `$${pricing.value.blendedCost.toFixed(2)} blended / 1M tokens` : 'Verified pricing unavailable',
  };
});

export const guideExample = leaderboard.rows[0] ?? null;
export const activeStatus = LEVEL_STATUSES.ACTIVE;
