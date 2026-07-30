import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [home, css, script] = await Promise.all([
  readFile('src/pages/index.astro', 'utf8'),
  readFile('src/styles/home.css', 'utf8'),
  readFile('src/scripts/home-page.js', 'utf8'),
]);

test('provider badges are absent while provider metadata and filters remain wired', () => {
  assert.doesNotMatch(home, /provider-badge/);
  assert.doesNotMatch(css, /provider-badge/);
  assert.doesNotMatch(css, /ultimate-model\s+\.model-info::before/);
  assert.doesNotMatch(css, /content:\s*attr\(data-provider\)/);
  assert.match(home, /function getModelProvider\(name\)/);
  assert.match(home, /data-provider=\{getModelProvider\(item\.name\)\.name\}/);
  assert.match(home, /data-provider-filter=\{provider\.name\}/);
  assert.match(script, /dataset\.provider/);
  assert.match(script, /provider-filter-btn/);
});

test('all leaderboard names use the shared single-line truncation treatment', () => {
  assert.match(css, /\.model-name\s*\{[^}]*overflow:\s*hidden[^}]*text-overflow:\s*ellipsis[^}]*white-space:\s*nowrap/s);
  assert.doesNotMatch(css, /\.model-name\s*\{[^}]*overflow-wrap:\s*anywhere/s);
  assert.match(css, /\.model-name-line\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) auto auto/s);
  assert.doesNotMatch(css, /\.model-name-line\s*\{[^}]*flex-wrap:\s*wrap/s);
  assert.doesNotMatch(css, /\.semantic-summary-table \.model-name\s*\{[^}]*white-space:\s*normal/s);
  assert.doesNotMatch(script, /adjustFontSizes|scrollWidth > el\.clientWidth/);
});

test('full model names stay in the DOM and title attributes', () => {
  assert.match(home, /class="model-name" title=\{item\.name\}[^>]*>\{item\.name\}<\/div>/);
  assert.match(home, /class="model-name" title=\{item\.name\}>\{item\.name\}<\/span>/);
  assert.match(home, /<strong class="model-name" title=\{item\.name\}[^>]*>\{item\.name\}<\/strong>/);
  assert.match(home, /<h3 class="model-name" title=\{item\.name\}>\{item\.name\}<\/h3>/);
});

test('NEW and PROVISIONAL stay separate while coverage retains its second line', () => {
  assert.match(home, /<span class="new-badge">NEW<\/span>/);
  assert.match(home, /<span class="provisional-badge">PROVISIONAL<\/span>/);
  assert.equal((home.match(/class="coverage-note" aria-label=/g) ?? []).length, 3);
  assert.equal((home.match(/<\/div>\s*\{item\.rank === null && <small class="coverage-note"/g) ?? []).length, 3);
  assert.match(css, /\.coverage-note\s*\{[^}]*display:block/);
  assert.match(css, /\.model-name-line > \.new-badge,[\s\S]*?white-space:\s*nowrap/);
});

test('summary rows give optional NEW badges space only when present', () => {
  assert.match(home, /<span class="model-name" title=\{item\.name\}>\{item\.name\}<\/span>\{isNew\(releaseDateByModel\.get\(item\.name\)\) && <span class="new-badge">NEW<\/span>}<\/th>/);
  assert.doesNotMatch(home, /class="benchmark-cell badge-cell"/);
  assert.match(css, /\.semantic-summary-table thead tr,[\s\S]*?grid-template-columns:\s*2\.45rem minmax\(0, 1fr\) 4\.1rem/);
  assert.match(css, /\.semantic-summary-table \.model-cell\s*\{[^}]*display:\s*flex[^}]*gap:\s*\.35rem[^}]*overflow:\s*hidden/s);
  assert.match(css, /\.semantic-summary-table \.model-name\s*\{[^}]*flex:\s*1 1 auto/s);
  assert.match(css, /\.semantic-summary-table \.new-badge\s*\{[^}]*flex:\s*none/s);
});

test('detailed tables retain aligned columns and contained keyboard scrolling', () => {
  assert.match(css, /--arena-columns:\s*minmax\(20rem, 3fr\) repeat\(6, minmax\(5\.5rem, 1fr\)\)/);
  assert.match(css, /\.unified-header-row, \.unified-row\s*\{[^}]*grid-template-columns:\s*var\(--arena-columns\)/s);
  assert.match(css, /\.benchmark-scroll-container\s*\{[^}]*max-width:\s*100%[^}]*overscroll-behavior-inline:\s*contain/s);
  assert.match(css, /@media \(max-width: 1100px\)\s*\{\s*\.benchmark-scroll-container \{ overflow-x: auto; \}/);
  assert.equal((home.match(/role="region" aria-label="(?:Visual|Chess|DATA) Bench level results" tabindex="0"/g) ?? []).length, 3);
});

test('existing score precision, sorting, and show-more controls remain wired', () => {
  assert.match(home, /formatAggregateScore\(item\.score\)/);
  assert.match(home, /data-absolute-score=\{item\.ultimateScore\}/);
  assert.match(script, /getAttribute\('data-absolute-score'\)/);
  assert.match(home, /class="arena-toggle" type="button" aria-expanded="false"/);
  assert.match(script, /data-arena-toggle-label/);
});
