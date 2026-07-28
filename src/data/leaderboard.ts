import { ARENA_LIST, type ArenaDefinition, type ArenaId } from './benchmarkSpec';
import { assignTiedRanks, calculateArenaScore, calculateOverall, qualifiesGlobally, validateBenchmarkRecords, type ArenaScore, type BenchmarkCollections, type BenchmarkRecord } from './scoring';

export interface ArenaRow extends BenchmarkRecord { canonical: ArenaScore; score: number; rank: number | null }
export interface LeaderboardRow { name: string; results: Record<ArenaId, ArenaScore>; scores: Record<ArenaId, number>; score: number; rank: number }

type ProvisionalRow = BenchmarkRecord & {canonical: ArenaScore; score: number};
export function provisionalOrder(a: ProvisionalRow, b: ProvisionalRow): number {
  return b.canonical.weightedCoverage - a.canonical.weightedCoverage
    || b.canonical.included - a.canonical.included
    || b.score - a.score
    || a.name.localeCompare(b.name);
}

export function buildArenaRows(benchmarks: BenchmarkCollections, arena: ArenaDefinition): ArenaRow[] {
  const computable = (benchmarks[arena.dataKey] || []).flatMap(record => {
    const canonical = calculateArenaScore(arena, record.scores);
    return canonical.score === null ? [] : [{...record, canonical, score: canonical.score}];
  });
  const eligible = assignTiedRanks(computable.filter(row => row.canonical.rankEligible));
  const provisional = computable.filter(row => !row.canonical.rankEligible).sort(provisionalOrder).map(row => ({...row, rank: null}));
  return [...eligible, ...provisional] as ArenaRow[];
}

export function arenaLeader(rows: ArenaRow[]): ArenaRow | null { return rows.find(row => row.rank === 1 && row.canonical.rankEligible) ?? null; }

export function buildLeaderboard(benchmarks: BenchmarkCollections): {arenaRows: Record<ArenaId, ArenaRow[]>; rows: LeaderboardRow[]; arenaLeaders: Record<ArenaId, ArenaRow | null>} {
  validateBenchmarkRecords(benchmarks);
  const arenaRows = Object.fromEntries(ARENA_LIST.map(arena => [arena.id, buildArenaRows(benchmarks, arena)])) as Record<ArenaId, ArenaRow[]>;
  const arenaLeaders = Object.fromEntries(ARENA_LIST.map(arena => [arena.id, arenaLeader(arenaRows[arena.id])])) as Record<ArenaId, ArenaRow | null>;
  const names = arenaRows.visual.map(({name}) => name).filter(name => ARENA_LIST.every(arena => arenaRows[arena.id].some(row => row.name === name)));
  const rows = names.flatMap(name => {
    const results = Object.fromEntries(ARENA_LIST.map(arena => [arena.id, arenaRows[arena.id].find(row => row.name === name)!.canonical])) as Record<ArenaId, ArenaScore>;
    if (!qualifiesGlobally(results)) return [];
    const scores = Object.fromEntries(ARENA_LIST.map(arena => [arena.id, results[arena.id].score!])) as Record<ArenaId, number>;
    return [{name, results, scores, score: calculateOverall(Object.values(scores))}];
  });
  return {arenaRows, arenaLeaders, rows: assignTiedRanks(rows) as LeaderboardRow[]};
}
