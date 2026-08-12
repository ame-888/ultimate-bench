import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
const bundle = `/tmp/ultimate-bench-progression-${process.pid}.mjs`;
execFileSync('node_modules/.bin/esbuild', ['test/progression-api.ts','--bundle','--platform=node','--format=esm',`--outfile=${bundle}`]);
const { buildProgression, buildCapabilitySeries, buildLeaderboard, benchmarks, getModelReleaseDate } = await import(pathToFileURL(bundle));

test('frontier is chronological, grouped, monotonic, and deterministic', () => {
  const result = buildProgression([
    {name:'later low',releaseDate:'2025-03-01',score:12},
    {name:'z tie',releaseDate:'2025-02-01',score:15},
    {name:'first',releaseDate:'2025-01-01',score:10},
    {name:'a tie',releaseDate:'2025-02-01',score:15},
    {name:'later high',releaseDate:'2025-04-01',score:25},
  ]);
  assert.deepEqual(result.dates.map(point => point.date), ['2025-01-01','2025-02-01','2025-03-01','2025-04-01']);
  assert.deepEqual(result.dates.map(point => point.frontierScore), [10,15,15,25]);
  assert.deepEqual(result.dates[1].recordModels, ['a tie','z tie']);
  assert.equal(result.dates[2].observations[0].isRecord, false);
});

test('equal later scores do not manufacture a new record and malformed inputs are excluded', () => {
  const result = buildProgression([{name:'record',releaseDate:'2025-01-01',score:10},{name:'later tie',releaseDate:'2025-02-01',score:10},{name:'missing',score:99},{name:'invalid',releaseDate:'not-a-date',score:99}]);
  assert.deepEqual(result.dates.map(point => point.recordModels), [['record'],[]]);
  assert.deepEqual(result.excluded, ['invalid','missing']);
});

test('canonical selectors exclude provisional arenas and use actual globally-qualified Ultimate scores', () => {
  const leaderboard = buildLeaderboard(benchmarks);
  const dates = new Map(benchmarks.models.map(row => [row.name,getModelReleaseDate(row.name)]));
  const series = buildCapabilitySeries(leaderboard.arenaRows, leaderboard.rows, name => dates.get(name));
  const provisional = leaderboard.arenaRows['data-retrieval'].find(row => row.rank === null);
  assert.ok(provisional);
  assert.equal(series['data-retrieval'].dates.flatMap(day => day.observations).some(point => point.name === provisional.name), false);
  const ultimatePoints = series.ultimate.dates.flatMap(day => day.observations);
  assert.equal(ultimatePoints.length + series.ultimate.excluded.length, leaderboard.rows.length);
  for (const point of ultimatePoints) assert.equal(point.score, leaderboard.rows.find(row => row.name === point.name).score);
  const arenaMaxAverage = ['visual','data-retrieval','chess'].reduce((sum, key) => sum + series[key].dates.at(-1).frontierScore, 0) / 3;
  assert.notEqual(series.ultimate.dates.at(-1).frontierScore, arenaMaxAverage);
});

test('selected metric domain is rounded, headed, and supports full scale', async () => {
  const { capabilityTimeWindow, progressionYDomain } = await import(pathToFileURL(bundle));
  const leaderboard = buildLeaderboard(benchmarks);
  const dates = new Map(benchmarks.models.map(row => [row.name,getModelReleaseDate(row.name)]));
  const series = buildCapabilitySeries(leaderboard.arenaRows, leaderboard.rows, name => dates.get(name));
  const window = capabilityTimeWindow(series, 'recent');
  const zoomed = progressionYDomain(series.ultimate, window, 'zoomed');
  const high = Math.max(...series.ultimate.dates.filter(day => day.timestamp >= window.min).flatMap(day => day.observations).map(point=>point.score));
  assert.equal(zoomed[0], 0); assert.ok(zoomed[1] >= high); assert.equal(zoomed[1] % 5, 0); assert.ok(zoomed[1] >= Math.min(100, high * 1.1));
  assert.deepEqual(progressionYDomain(series.ultimate, window, 'full'), [0,100]);
});

test('time windows and point visibility are deterministic', async () => {
  const { capabilityTimeWindow, progressionInWindow, visibleObservations } = await import(pathToFileURL(bundle));
  const progression = buildProgression([{name:'old',releaseDate:'2023-01-01',score:2},{name:'record',releaseDate:'2025-06-01',score:10},{name:'ordinary',releaseDate:'2025-12-01',score:7},{name:'latest',releaseDate:'2026-01-01',score:11}]);
  const series = {visual:progression,'data-retrieval':progression,chess:progression,ultimate:progression};
  const recent = capabilityTimeWindow(series,'recent');
  assert.equal(new Date(recent.max).toISOString().slice(0,10),'2026-01-01');
  assert.equal(new Date(recent.min).toISOString().slice(0,10),'2024-07-01');
  assert.deepEqual(progressionInWindow(progression,recent).map(day=>day.date),['2023-01-01','2025-06-01','2025-12-01','2026-01-01']);
  assert.deepEqual(visibleObservations(progression,recent,false).map(point=>point.name),['record','latest']);
  assert.deepEqual(visibleObservations(progression,recent,true).map(point=>point.name),['record','ordinary','latest']);
  const full=capabilityTimeWindow(series,'full'); assert.equal(full.min,Date.parse('2023-01-01T00:00:00Z'));
});

test('release resolver prefers record dates, permits exact metadata, and rejects fuzzy names', async()=>{
  const {resolveReleaseDate}=await import(pathToFileURL(bundle)); const metadata=new Map([['Exact Model','2025-02-02']]);
  assert.equal(resolveReleaseDate('Exact Model','2025-01-01',metadata),'2025-01-01');
  assert.equal(resolveReleaseDate('Exact Model',undefined,metadata),'2025-02-02');
  assert.equal(resolveReleaseDate('Exact Model Preview',undefined,metadata),undefined);
});

test('frontier SVG geometry is an open horizontal-vertical step path',async()=>{
  const {frontierStepPath}=await import(pathToFileURL(bundle)); const path=frontierStepPath([{x:1,y:9},{x:4,y:6},{x:8,y:6}]);
  assert.equal(path,'M 1 9 H 4 V 6 H 8 V 6'); assert.equal(/[Zz]/.test(path),false);
});
