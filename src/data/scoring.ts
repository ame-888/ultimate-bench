import { activeLevels, ARENA_LIST, LEVEL_STATUSES, progressiveWeight, RESULT_STATUSES, type ArenaDefinition, type BenchmarkResult, type ArenaId } from './benchmarkSpec';

export interface ArenaScore {
  score: number | null;
  numerator: number;
  denominator: number;
  fullDenominator: number;
  included: number;
  active: number;
  unavailable: number;
  notTested: number;
  weightedCoverage: number;
  completeCoverage: boolean;
  rankEligible: boolean;
  computable: boolean;
  coverage: string;
  weightCoverage: string;
}

const knownResults = new Set<string>(Object.values(RESULT_STATUSES));

export function normalizeResult(value: unknown): BenchmarkResult {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100) return value;
  if (typeof value === 'string' && knownResults.has(value)) return value as BenchmarkResult;
  throw new TypeError(`Unknown or invalid benchmark result: ${String(value)}`);
}

/** The single source of truth for score, Active-level coverage, and rank eligibility. */
export function calculateArenaScore(arena: ArenaDefinition, scores: Record<string, unknown>): ArenaScore {
  let numerator = 0, denominator = 0, included = 0, unavailable = 0, notTested = 0;
  const active = activeLevels(arena);
  const fullDenominator = active.reduce((sum, item) => sum + item.weight, 0);
  for (const item of active) {
    if (!Object.hasOwn(scores, item.key) || scores[item.key] === undefined) throw new Error(`${arena.name} active ${item.name} result is missing.`);
    const result = normalizeResult(scores[item.key]);
    if (result === RESULT_STATUSES.UNAVAILABLE || result === RESULT_STATUSES.NOT_TESTED) {
      result === RESULT_STATUSES.UNAVAILABLE ? unavailable++ : notTested++;
      continue;
    }
    const value = result === RESULT_STATUSES.INVALID ? 0 : result;
    numerator += value * item.weight;
    denominator += item.weight;
    included++;
  }
  const score = denominator ? numerator / denominator : null;
  const completeCoverage = included === active.length;
  return {
    score, numerator, denominator, fullDenominator, included, active: active.length, unavailable, notTested,
    weightedCoverage: fullDenominator ? denominator / fullDenominator : 0,
    completeCoverage,
    rankEligible: score !== null && completeCoverage,
    computable: score !== null,
    coverage: `${included}/${active.length} active levels`,
    weightCoverage: `${denominator}/${fullDenominator} active weight`,
  };
}

export function calculateOverall(scores: number[]): number {
  if (scores.length !== ARENA_LIST.length || scores.some(score => typeof score !== 'number' || !Number.isFinite(score))) throw new Error('Overall requires three computable canonical arena scores.');
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

export function qualifiesGlobally(results: Record<ArenaId, ArenaScore>): boolean {
  return ARENA_LIST.every(arena => results[arena.id]?.rankEligible === true);
}

export function assignTiedRanks<T extends Record<string, unknown>>(rows: T[], scoreKey: keyof T = 'score' as keyof T): (T & {rank: number})[] {
  const sorted = [...rows].sort((a, b) => Number(b[scoreKey]) - Number(a[scoreKey]) || String(a.name).localeCompare(String(b.name)));
  let previous: number | undefined;
  const ranked: (T & {rank: number})[] = [];
  sorted.forEach((row, index) => {
    const score = Number(row[scoreKey]);
    const rank = index === 0 ? 1 : score === previous ? ranked[index - 1].rank : index + 1;
    ranked.push({...row, rank}); previous = score;
  });
  return ranked;
}

export function exploratorySort<T>(rows: T[], comparator: (a: T, b: T) => number): T[] { return [...rows].sort(comparator); }
export function validateArenaDefinition(arena: ArenaDefinition): void { for (const item of arena.levels) { if (!Object.values(LEVEL_STATUSES).includes(item.status)) throw new Error(`Unknown level status: ${item.status}`); if (item.weight !== progressiveWeight(item.number)) throw new Error(`${arena.name} Level ${item.number} has an invalid weight.`); if (item.status === LEVEL_STATUSES.LOCKED && !item.unlockCondition) throw new Error(`${arena.name} ${item.name} is Locked without an unlock condition.`); } }
export interface BenchmarkRecord {name: string; scores: Record<string, unknown>; releaseDate?: string}
export type BenchmarkCollections = Record<string, BenchmarkRecord[]>;
export function validateBenchmarkRecords(benchmarks: BenchmarkCollections): true { for (const arena of ARENA_LIST) { validateArenaDefinition(arena); const firstIndexByName = new Map<string, number>(); for (const [index, record] of (benchmarks[arena.dataKey] || []).entries()) { const firstIndex = firstIndexByName.get(record.name); if (firstIndex !== undefined) throw new Error(`${arena.name} contains duplicate model "${record.name}" at record indexes ${firstIndex} and ${index}.`); firstIndexByName.set(record.name, index); calculateArenaScore(arena, record.scores); for (const item of arena.levels.filter(entry => entry.status !== LEVEL_STATUSES.ACTIVE)) if (Object.hasOwn(record.scores, item.key)) throw new Error(`${arena.name} ${item.name} is ${item.status} but ${record.name} has a published result.`); } } return true; }
