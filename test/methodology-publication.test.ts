import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { PDFParse } from 'pdf-parse';
import { ARENAS, ARENA_LIST, canonicalDenominator, LEVEL_STATUSES, operationalWeight } from '../src/data/benchmarkSpec';
import { METHODOLOGY, PUBLICATION_SECTIONS, methodologyArenas } from '../src/data/methodologyPublication';

const root = new URL('../', import.meta.url);
test('publication derives every level and weight from the canonical benchmark specification', () => {
  assert.equal(methodologyArenas.length, ARENA_LIST.length);
  for (const arena of methodologyArenas) {
    assert.equal(arena.denominator, canonicalDenominator(arena));
    assert.equal(arena.operationalWeight, operationalWeight(arena));
    assert.equal(arena.reservedWeight, arena.denominator - arena.operationalWeight);
    for (const level of arena.levels) assert.deepEqual(level, ARENA_LIST.find(item => item.id === arena.id)?.levels[level.number - 1]);
  }
  assert.equal(ARENAS.chess.levels[5].status, LEVEL_STATUSES.LOCKED);
  assert.equal(ARENAS.dataRetrieval.levels[4].status, LEVEL_STATUSES.PLANNED);
  assert.equal(ARENAS.dataRetrieval.levels[5].status, LEVEL_STATUSES.PLANNED);
});

test('actual generated PDF is valid, substantial, and contains canonical publication text', async () => {
  const url = new URL(`public${METHODOLOGY.pdfPath}`, root);
  const bytes = await readFile(url);
  assert.equal(bytes.subarray(0, 5).toString(), '%PDF-');
  assert.ok((await stat(url)).size > 20_000);
  const parser = new PDFParse({ data: bytes });
  const { text } = await parser.getText(); await parser.destroy();
  for (const phrase of ['Methodology and', 'Evaluation Protocol', METHODOLOGY.version, METHODOLOGY.revisionDate, 'Visual Bench', 'DATA Bench', 'Chess Bench', 'Active-level coverage', 'not officially ranked', 'Limitations']) assert.match(text, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  for (const arena of ARENA_LIST) for (const level of arena.levels) assert.match(text, new RegExp(`${level.name}\\s+${level.weight}\\s+${level.status}`, 'i'));
});

test('web discovery, share, and publication routes remain wired', async () => {
  const files = await Promise.all(['src/pages/index.astro','src/pages/methodology.astro','src/pages/methodology/full.astro','src/components/Footer.astro',...['visual-bench','data-bench','chess-bench'].map(x=>`src/pages/methodology/${x}.astro`)].map(async path => [path, await readFile(new URL(path, root),'utf8')] as const));
  const all = files.map(([,text])=>text).join('\n');
  assert.match(files[0][1], /How Ultimate Bench works/);
  assert.match(files[1][1], /Download complete methodology/);
  assert.match(files[2][1], /navigator\.share/); assert.match(files[2][1], /navigator\.clipboard/);
  assert.match(files[3][1], /Methodology PDF/);
  for (const [,text] of files.slice(4)) assert.match(text, /MethodologyNotice/);
  assert.ok(PUBLICATION_SECTIONS.length >= 26);
  assert.match(all, /ultimate-bench-methodology\.pdf|METHODOLOGY\.pdfPath/);
});
