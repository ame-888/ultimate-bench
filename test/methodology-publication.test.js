import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, rm, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { before } from 'node:test';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
before(async () => {
  await rm(new URL('../dist/', import.meta.url), { recursive: true, force: true });
  execFileSync('npm', ['run', 'build'], { cwd: new URL('..', import.meta.url), stdio: 'pipe' });
});
test('generated deployment contains a valid, substantial methodology PDF', async () => {
  const stablePath = new URL('../dist/methodology/ultimate-bench-methodology.pdf', import.meta.url);
  const versionedPath = new URL('../dist/methodology/ultimate-bench-methodology-v1.0.0.pdf', import.meta.url);
  const [pdf, versioned] = await Promise.all([readFile(stablePath), readFile(versionedPath)]);
  for (const artifact of [pdf, versioned]) { assert.equal(artifact.subarray(0, 5).toString(), '%PDF-'); assert.ok(artifact.length > 30_000); }
  assert.equal((await stat(versionedPath)).size, pdf.length);
  const extractedText = [...pdf.toString('latin1').matchAll(/<([0-9a-f]+)>/gi)]
    .map(([, hex]) => Buffer.from(hex, 'hex').toString('latin1')).join('');
  assert.match(extractedText, /Version 1\.0\.0/);
});
test('generated PDFs are not tracked source files', () => {
  const tracked = execFileSync('git', ['ls-files', '*.pdf'], { cwd: new URL('..', import.meta.url), encoding: 'utf8' });
  assert.equal(tracked, '');
});
test('publication is discoverable and shares canonical metadata', async () => {
  const [full, hub, home, footer, sitemap] = await Promise.all([read('dist/methodology/full/index.html'),read('dist/methodology/index.html'),read('dist/index.html'),read('src/components/Footer.astro'),read('dist/sitemap-0.xml')]);
  for (const phrase of ['Visual Bench protocol','DATA Bench protocol','Chess Bench protocol','Active-level coverage','Rank eligibility','Version 1.0.0','2026-07-29']) assert.match(full, new RegExp(phrase, 'i'));
  assert.match(full,/navigator\.share/); assert.match(full,/ultimate-bench-methodology\.pdf/); assert.match(full,/ultimate-bench-methodology-v1\.0\.0\.pdf/); assert.match(hub,/Download complete methodology/); assert.match(home,/How Ultimate Bench works/); assert.match(footer,/Methodology PDF/); assert.match(sitemap,/\/methodology\/full\//);
});
test('arena pages link to shared publication and canonical statuses remain protected', async () => {
  for (const arena of ['visual-bench','data-bench','chess-bench']) assert.match(await read(`dist/methodology/${arena}/index.html`), /Part of the complete Ultimate Bench methodology/);
  const spec=await read('src/data/benchmarkSpec.ts'); assert.match(spec,/['"]hydra['"],[\s\S]*LEVEL_STATUSES\.LOCKED/); assert.match(spec,/['"]raven['"],[\s\S]*LEVEL_STATUSES\.PLANNED/); assert.match(spec,/['"]athena['"],[\s\S]*LEVEL_STATUSES\.PLANNED/);
});
