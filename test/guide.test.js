import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
const bundle = `/tmp/ultimate-bench-guide-${process.pid}.mjs`;
execFileSync('node_modules/.bin/esbuild', ['test/guide-api.ts','--bundle','--platform=node','--format=esm',`--outfile=${bundle}`]);
const { ARENA_LIST, canonicalDenominator, operationalWeight, guideCapacity, guideComparisonRows, statusRows, benchmarks, buildLeaderboard } = await import(pathToFileURL(bundle));

test('guide capacity is derived from canonical benchmark specification', () => {
  assert.deepEqual(guideCapacity.map(({denominator, operational}) => ({denominator, operational})), ARENA_LIST.map(arena => ({denominator: canonicalDenominator(arena), operational: operationalWeight(arena)})));
});

test('comparison helper exactly reflects canonical globally-qualified leaderboard', () => {
  const canonical = buildLeaderboard(benchmarks);
  assert.equal(guideComparisonRows.length, canonical.rows.length);
  assert.deepEqual(guideComparisonRows.map(row => [row.name, row.rank, row.overall]), canonical.rows.map(row => [row.name, row.rank, row.score.toFixed(2)]));
});

test('status interpreter includes every required state and preserves distinct zero semantics', () => {
  for (const label of ['Positive numeric result','Numeric zero','INVALID','UNAVAILABLE','NOT_TESTED','PROVISIONAL','Complete coverage','Globally qualified']) assert.ok(statusRows.some(row => row.label === label), label);
  assert.notEqual(statusRows.find(row => row.label === 'Numeric zero').meaning, statusRows.find(row => row.label === 'INVALID').meaning);
});

test('primary navigation and footer separate Guide from Articles', async () => {
  const nav = await readFile(new URL('../src/components/Navbar.astro', import.meta.url), 'utf8');
  const footer = await readFile(new URL('../src/components/Footer.astro', import.meta.url), 'utf8');
  assert.match(nav, /href: '\/guide', label: 'Guide'/);
  assert.doesNotMatch(nav, /label: 'Guides'/);
  assert.match(footer, /href="\/guide">Guide/);
  assert.match(footer, /href="\/blog">Articles/);
});

test('analysis destinations used by Guide exist', async () => {
  const analysis = await readFile(new URL('../src/pages/analysis.astro', import.meta.url), 'utf8');
  for (const id of ['transfer','failure','configuration','tradeoffs','robustness']) assert.match(analysis, new RegExp(`id="${id}"`));
});
