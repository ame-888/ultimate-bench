import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
const bundle = `/tmp/ultimate-bench-progression-${process.pid}.mjs`;
execFileSync('node_modules/.bin/esbuild', ['test/progression-api.ts','--bundle','--platform=node','--format=esm',`--outfile=${bundle}`]);
const { buildProgression, buildCapabilitySeries, buildLeaderboard, benchmarks } = await import(pathToFileURL(bundle));

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
  const dates = new Map(benchmarks.models.map(row => [row.name,row.releaseDate]));
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
