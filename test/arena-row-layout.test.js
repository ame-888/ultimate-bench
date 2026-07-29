import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [home, css, script] = await Promise.all([
  readFile('src/pages/index.astro', 'utf8'),
  readFile('src/styles/home.css', 'utf8'),
  readFile('src/scripts/home-page.js', 'utf8'),
]);

test('all three detailed arenas share an explicit model hierarchy', () => {
  assert.equal((home.match(/class="provider-badge"/g) ?? []).length, 3);
  assert.equal((home.match(/class="coverage-note" aria-label=/g) ?? []).length, 3);
  assert.equal((home.match(/role="region" aria-label="(?:Visual|Chess|DATA) Bench level results" tabindex="0"/g) ?? []).length, 3);
  assert.equal((home.match(/class="model-info" data-provider=/g) ?? []).length, 1, 'only the unrelated Global table keeps its pseudo-element provider');
  assert.match(home, /Grok 4\.20 Expert|item\.name/);
});

test('coverage is concise visually and preserves the complete accessible reason', () => {
  const summaries = home.match(/<small class="coverage-note"[^>]*>\{item\.coverage\} · \{item\.weightCoverage\}<\/small>/g) ?? [];
  assert.equal(summaries.length, 3);
  assert.equal((home.match(/aria-label=\{`Insufficient coverage for an official rank:/g) ?? []).length, 3);
  assert.doesNotMatch(home, /rank !== null && <small class="coverage-note"/);
});

test('arena header and rows use one synchronized, readable grid', () => {
  assert.match(css, /--arena-columns:\s*minmax\(20rem, 3fr\) repeat\(6, minmax\(5\.5rem, 1fr\)\)/);
  assert.match(css, /\.unified-header-row, \.unified-row\s*\{[\s\S]*?grid-template-columns:\s*var\(--arena-columns\)/);
  assert.match(css, /\.benchmark-content\s*\{[\s\S]*?grid-template-columns:\s*2rem minmax\(0, 1fr\)/);
  assert.match(css, /\.benchmark-scroll-container\s*\{[\s\S]*?overflow-x:\s*auto/);
  assert.doesNotMatch(css, /\.unified-header-row, \.unified-row\s*\{[\s\S]{0,160}minmax\(25px/);
});

test('provider and provisional content remain visible without layout hacks', () => {
  assert.match(css, /\.provider-badge/);
  assert.match(css, /\.model-name-line\s*\{[\s\S]*?flex-wrap:\s*wrap/);
  assert.match(css, /\.coverage-note\s*\{[^}]*display:block/);
  assert.doesNotMatch(css, /\.benchmark-content[^}]*position:\s*absolute/);
  assert.doesNotMatch(css, /\.coverage-note[^}]*margin-(?:left|right|top|bottom):\s*-/);
});

test('existing score precision, sorting, and show-more controls remain wired', () => {
  assert.match(home, /formatAggregateScore\(item\.score\)/);
  assert.match(home, /data-absolute-score=\{item\.ultimateScore\}/);
  assert.match(script, /getAttribute\('data-absolute-score'\)/);
  assert.match(home, /class="arena-toggle" type="button" aria-expanded="false"/);
  assert.match(script, /data-arena-toggle-label/);
});
