import { activeLevels, ARENA_LIST, canonicalDenominator, LEVEL_STATUSES, operationalWeight, progressiveWeight, RESULT_STATUSES, type ArenaDefinition, type BenchmarkResult, type ArenaId } from './benchmarkSpec';

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
  const fullDenominator = canonicalDenominator(arena);
  denominator = fullDenominator;
  for (const item of active) {
    if (!Object.hasOwn(scores, item.key) || scores[item.key] === undefined) throw new Error(`${arena.name} active ${item.name} result is missing.`);
    const result = normalizeResult(scores[item.key]);
    if (result === RESULT_STATUSES.UNAVAILABLE || result === RESULT_STATUSES.NOT_TESTED) {
      result === RESULT_STATUSES.UNAVAILABLE ? unavailable++ : notTested++;
      continue;
    }
    const value = result === RESULT_STATUSES.INVALID ? 0 : result;
    numerator += value * item.weight;
    included++;
  }
  const score = denominator ? numerator / denominator : null;
  const completeCoverage = included === active.length;
  return {
    score, numerator, denominator, fullDenominator, included, active: active.length, unavailable, notTested,
    weightedCoverage: operationalWeight(arena) ? active.filter(item => {
      const value=scores[item.key]; return value !== RESULT_STATUSES.UNAVAILABLE && value !== RESULT_STATUSES.NOT_TESTED;
    }).reduce((sum,item)=>sum+item.weight,0) / operationalWeight(arena) : 0,
    completeCoverage,
    rankEligible: score !== null && completeCoverage,
    computable: score !== null,
    coverage: `${included}/${active.length} active levels`,
    weightCoverage: `${active.filter(item => scores[item.key] !== RESULT_STATUSES.UNAVAILABLE && scores[item.key] !== RESULT_STATUSES.NOT_TESTED).reduce((sum,item)=>sum+item.weight,0)}/${operationalWeight(arena)} active weight`,
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
export function validateArenaDefinition(arena: ArenaDefinition): void { if(arena.levels.length!==6) throw new Error(`${arena.name} must define exactly six levels.`); for (const [index,item] of arena.levels.entries()) { if(item.number!==index+1) throw new Error(`${arena.name} has an invalid level position.`); if (!Object.values(LEVEL_STATUSES).includes(item.status)) throw new Error(`Unknown level status: ${item.status}`); if (item.weight !== progressiveWeight(index+1)) throw new Error(`${arena.name} Level ${item.number} has an invalid weight.`); if (item.status === LEVEL_STATUSES.LOCKED && !item.unlockCondition) throw new Error(`${arena.name} ${item.name} is Locked without an unlock condition.`); } if(canonicalDenominator(arena)!==63) throw new Error(`${arena.name} canonical denominator drifted from 63.`); }
export const RESULT_ORIGINS = { PROGRESSION_GATED: 'progression-gated' } as const;
export type ResultOrigin = typeof RESULT_ORIGINS[keyof typeof RESULT_ORIGINS];
export interface ComparisonMetadata { group: string; condition: string; baseline?: boolean }
export interface BenchmarkRecord {name: string; scores: Record<string, unknown>; origins?: Record<string, ResultOrigin>; releaseDate?: string; comparison?: ComparisonMetadata}

/** Only a positive numeric result passes the canonical progression gate. */
export function passesProgressionGate(result: unknown): boolean {
  return typeof result === 'number' && Number.isFinite(result) && result > 0;
}

/** Validates origin metadata without changing the arithmetic score value. */
export function validateProgressionOrigins(arena: ArenaDefinition, record: BenchmarkRecord): void {
  const active = activeLevels(arena);
  const origins = record.origins ?? {};
  let progressionFailed = false;
  for (const [index, level] of active.entries()) {
    const result = normalizeResult(record.scores[level.key]);
    const origin = origins[level.key];
    if (origin !== undefined && origin !== RESULT_ORIGINS.PROGRESSION_GATED) throw new Error(`${arena.name} ${record.name} has an unknown result origin for ${level.name}.`);
    if (origin === RESULT_ORIGINS.PROGRESSION_GATED) {
      if (index === 0) throw new Error(`${arena.name} ${record.name} ${level.name} is gated without a failed prerequisite.`);
      if (result !== 0) throw new Error(`${arena.name} ${record.name} gated ${level.name} result must be numeric zero.`);
      if (!progressionFailed) throw new Error(`${arena.name} ${record.name} ${level.name} is gated without a failed prerequisite.`);
    } else if (progressionFailed && result !== RESULT_STATUSES.UNAVAILABLE && result !== RESULT_STATUSES.NOT_TESTED) {
      throw new Error(`${arena.name} ${record.name} ${level.name} resumes after a failed prerequisite without a supported exception.`);
    }
    if (index < active.length - 1 && !passesProgressionGate(result) && result !== RESULT_STATUSES.UNAVAILABLE && result !== RESULT_STATUSES.NOT_TESTED) progressionFailed = true;
  }
  for (const key of Object.keys(origins)) if (!active.some(level => level.key === key)) throw new Error(`${arena.name} ${record.name} has origin metadata for non-Active result ${key}.`);
}

export type BenchmarkCollections = Record<string, BenchmarkRecord[]>;
export function validateBenchmarkRecords(benchmarks: BenchmarkCollections): true { for (const arena of ARENA_LIST) { validateArenaDefinition(arena); const firstIndexByName = new Map<string, number>(); for (const [index, record] of (benchmarks[arena.dataKey] || []).entries()) { const firstIndex = firstIndexByName.get(record.name); if (firstIndex !== undefined) throw new Error(`${arena.name} contains duplicate model "${record.name}" at record indexes ${firstIndex} and ${index}.`); firstIndexByName.set(record.name, index); calculateArenaScore(arena, record.scores); if (arena.id === 'chess') validateProgressionOrigins(arena, record); for (const item of arena.levels.filter(entry => entry.status !== LEVEL_STATUSES.ACTIVE)) if (Object.hasOwn(record.scores, item.key)) throw new Error(`${arena.name} ${item.name} is ${item.status} but ${record.name} has a published result.`); } } return true; }
