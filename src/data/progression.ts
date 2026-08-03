import { ARENA_LIST, type ArenaId } from './benchmarkSpec';
import type { ArenaRow, LeaderboardRow } from './leaderboard';

export interface ProgressObservation { name: string; releaseDate?: string; score: number }
export interface ProgressPoint extends Required<ProgressObservation> {
  timestamp: number;
  frontierScore: number;
  isRecord: boolean;
}
export interface ProgressDate {
  date: string;
  timestamp: number;
  frontierScore: number;
  observations: ProgressPoint[];
  recordModels: string[];
}
export interface Progression {
  dates: ProgressDate[];
  excluded: string[];
}

/** Turns already-qualified canonical observations into a deterministic record timeline. */
export function buildProgression(observations: ProgressObservation[]): Progression {
  const excluded: string[] = [];
  const grouped = new Map<string, Array<Required<ProgressObservation> & { timestamp: number }>>();
  for (const observation of observations) {
    const date = observation.releaseDate;
    const validDate = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date);
    const timestamp = validDate ? Date.parse(`${date}T00:00:00Z`) : Number.NaN;
    if (!validDate || !Number.isFinite(timestamp) || typeof observation.score !== 'number' || !Number.isFinite(observation.score)) {
      excluded.push(observation.name);
      continue;
    }
    const item = { ...observation, releaseDate: date, timestamp } as Required<ProgressObservation> & { timestamp: number };
    grouped.set(date, [...(grouped.get(date) ?? []), item]);
  }

  let record = Number.NEGATIVE_INFINITY;
  const dates = [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, raw]) => {
    const observationsForDate = raw.sort((a, b) => a.name.localeCompare(b.name) || b.score - a.score);
    const dailyBest = Math.max(...observationsForDate.map(item => item.score));
    const isNewRecord = dailyBest > record;
    if (isNewRecord) record = dailyBest;
    const recordModels = isNewRecord
      ? observationsForDate.filter(item => item.score === dailyBest).map(item => item.name)
      : [];
    const observations = observationsForDate.map(item => ({
      ...item,
      frontierScore: record,
      isRecord: isNewRecord && item.score === dailyBest,
    }));
    return { date, timestamp: observationsForDate[0].timestamp, frontierScore: record, observations, recordModels };
  });
  return { dates, excluded: excluded.sort((a, b) => a.localeCompare(b)) };
}

export type CapabilitySeries = Record<ArenaId | 'ultimate', Progression>;

/** Selects only canonical rank-eligible arena rows and globally-qualified leaderboard rows. */
export function buildCapabilitySeries(
  arenaRows: Record<ArenaId, ArenaRow[]>,
  globalRows: LeaderboardRow[],
  releaseDateFor: (name: string, arena?: ArenaId) => string | undefined,
): CapabilitySeries {
  const arenaSeries = Object.fromEntries(ARENA_LIST.map(arena => [arena.id, buildProgression(
    arenaRows[arena.id].filter(row => row.canonical.rankEligible && row.rank !== null).map(row => ({
      name: row.name, releaseDate: releaseDateFor(row.name, arena.id), score: row.score,
    })),
  )])) as Record<ArenaId, Progression>;
  return {
    ...arenaSeries,
    ultimate: buildProgression(globalRows.map(row => ({
      name: row.name, releaseDate: releaseDateFor(row.name), score: row.score,
    }))),
  };
}
