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
export type ProgressRange = 'recent' | 'full';
export type ProgressScale = 'zoomed' | 'full';

export interface ProgressWindow { min: number; max: number }

/** A shared, real-time window. Recent is anchored to the data, never today's date. */
export function capabilityTimeWindow(series: CapabilitySeries | Progression, range: ProgressRange, recentMonths = 18): ProgressWindow | null {
  const progressions = 'dates' in series ? [series] : Object.values(series);
  const timestamps = progressions.flatMap(item => item.dates.map(day => day.timestamp)).filter(Number.isFinite);
  if (!timestamps.length) return null;
  const max = Math.max(...timestamps);
  if (range === 'full') return { min: Math.min(...timestamps), max };
  const start = new Date(max); start.setUTCMonth(start.getUTCMonth() - recentMonths);
  return { min: start.getTime(), max };
}

/** Returns dated observations in the window plus the last earlier frontier as a step-line anchor. */
export function progressionInWindow(progression: Progression, window: ProgressWindow | null): ProgressDate[] {
  if (!window) return [];
  const visible = progression.dates.filter(day => day.timestamp >= window.min && day.timestamp <= window.max);
  const anchor = [...progression.dates].reverse().find(day => day.timestamp < window.min);
  return anchor ? [anchor, ...visible] : visible;
}

/** One honest vertical domain shared by every small multiple. */
export function capabilityYDomain(series: CapabilitySeries, window: ProgressWindow | null, scale: ProgressScale): [number, number] {
  if (scale === 'full') return [0, 100];
  const highest = Math.max(0, ...Object.values(series).flatMap(item => progressionInWindow(item, window).map(day => day.frontierScore)));
  const headed = highest * 1.12;
  return [0, Math.min(100, Math.max(5, Math.ceil(headed / 5) * 5))];
}

/** Domain for the single selected metric. */
export function progressionYDomain(progression: Progression, window: ProgressWindow | null, scale: ProgressScale): [number, number] {
  if (scale === 'full') return [0, 100];
  const highest = Math.max(0, ...visibleObservations(progression, window, true).map(point => point.score));
  return [0, Math.min(100, Math.max(5, Math.ceil((highest * 1.12) / 5) * 5))];
}

export function frontierStepPath(points: Array<{x:number;y:number}>): string {
  return points.map((point, index) => index ? `H ${point.x} V ${point.y}` : `M ${point.x} ${point.y}`).join(' ');
}

export function resolveReleaseDate(name: string, recordDate: string | undefined, metadata: ReadonlyMap<string,string>, aliases: ReadonlyMap<string,string> = new Map()): string | undefined {
  const valid = (date: string | undefined) => typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(`${date}T00:00:00Z`));
  if (valid(recordDate)) return recordDate;
  const exact = metadata.get(name);
  if (valid(exact)) return exact;
  const canonicalName = aliases.get(name);
  const aliased = canonicalName ? metadata.get(canonicalName) : undefined;
  return valid(aliased) ? aliased : undefined;
}

export function classifyProvider(name: string): string {
  const value=name.toLowerCase();
  if(value.includes('gemini')) return 'Google'; if(value.includes('gpt')||value.includes('o3')||value.includes('o4')) return 'OpenAI';
  if(value.includes('claude')) return 'Anthropic'; if(value.includes('grok')) return 'xAI'; if(value.includes('llama')||value.includes('muse')) return 'Meta';
  if(value.includes('deepseek')) return 'DeepSeek'; return 'Other';
}

export function visibleObservations(progression: Progression, window: ProgressWindow | null, showAll: boolean): ProgressPoint[] {
  if (!window) return [];
  return progression.dates.filter(day => day.timestamp >= window.min && day.timestamp <= window.max)
    .flatMap(day => day.observations.filter(point => showAll || point.isRecord));
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
