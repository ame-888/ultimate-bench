import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, rm, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { before } from 'node:test';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
before(async () => {
  await rm(new URL('../dist/', import.meta.url), { recursive: true, force: true });
  execFileSync('npm', ['run', 'build'], { cwd: new URL('..', import.meta.url), stdio: 'pipe' });
});
const openPdf = async buffer => getDocument({ data: new Uint8Array(buffer), disableFontFace: true }).promise;
const pageText = async (pdf, pageNumber) => {
  const content = await (await pdf.getPage(pageNumber)).getTextContent();
  return content.items.map(item => item.str).join(' ').replace(/\s+/g, ' ').trim();
};

test('generated deployment contains structurally valid stable and versioned PDFs', async () => {
  const stablePath = new URL('../dist/methodology/ultimate-bench-methodology.pdf', import.meta.url);
  const versionedPath = new URL('../dist/methodology/ultimate-bench-methodology-v1.0.0.pdf', import.meta.url);
  const [pdf, versioned] = await Promise.all([readFile(stablePath), readFile(versionedPath)]);
  for (const artifact of [pdf, versioned]) { assert.equal(artifact.subarray(0, 5).toString(), '%PDF-'); assert.ok(artifact.length > 30_000); }
  assert.equal((await stat(versionedPath)).size, pdf.length);
  assert.deepEqual(pdf, versioned, 'stable and versioned artifacts derive from exactly the same bytes');
  for (const artifact of [pdf, versioned]) {
    const parsed = await openPdf(artifact);
    assert.ok(parsed.numPages > 2 && parsed.numPages < 27);
    assert.equal((await parsed.getMetadata()).info.Title, 'Ultimate Bench: Methodology and Evaluation Protocol');
    await parsed.destroy();
  }
});

test('PDF text, contents links, bookmarks, and external link are publication-safe', async () => {
  const source = await readFile(new URL('../dist/methodology/ultimate-bench-methodology.pdf', import.meta.url));
  const pdf = await openPdf(source);
  const texts = await Promise.all(Array.from({ length: pdf.numPages }, (_, index) => pageText(pdf, index + 1)));
  const allText = texts.join('\n');
  const contentsText = texts[1];
  const methodologySource = await read('src/data/methodology.ts');
  const sectionMatches = [...methodologySource.matchAll(/\{ id: '([^']+)', title: '([^']+)'/g)];
  assert.equal(sectionMatches.length, 25);
  for (const [, id, title] of sectionMatches) {
    assert.match(contentsText, new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `contents entry: ${title}`);
    assert.ok(await pdf.getDestination(id), `named destination: ${id}`);
  }
  assert.match(allText, /Arena score = sum of \(level result times level weight\) divided by 63\./);
  assert.doesNotMatch(allText, /�|Î£|Ã—|\u0000/);
  assert.match(allText, /Hydra - LOCKED|Hydra - Locked/i);
  assert.match(allText, /Hydra may become Active after at least one evaluated model obtains a numeric score above 0 on Python\./);
  assert.match(allText, /Permanent denominator: 63/);
  assert.match(allText, /Every model.configuration is administered on every Active level independently of earlier results/i);
  assert.doesNotMatch(allText, /progression-gated|failed prerequisite|attempts Level|only after/i);
  assert.match(allText, /Version 1\.0\.0/);
  assert.match(allText, /Revised 2026-07-30/);
  assert.equal((allText.match(/UB-PDF-20260730-N8V4/g) || []).length, 1);

  const outline = await pdf.getOutline();
  assert.equal(outline?.length, 25);
  assert.deepEqual(outline.map(item => item.title), sectionMatches.map(([, , title], index) => `${index + 1}. ${title}`));
  const contentsLinks = (await (await pdf.getPage(2)).getAnnotations()).filter(annotation => annotation.dest);
  assert.ok(contentsLinks.length >= 25, `expected at least 25 contents links, found ${contentsLinks.length}`);
  const coverLinks = await (await pdf.getPage(1)).getAnnotations();
  assert.ok(coverLinks.some(annotation => annotation.url === 'https://ultimate-bench.vercel.app/methodology/full/'));
  await pdf.destroy();
});

test('PDF builder has no network-loaded fonts or assets', async () => {
  const builder = await read('scripts/generate-methodology-pdf.ts');
  assert.doesNotMatch(builder, /https?:\/\/(?!ultimate-bench\.vercel\.app\/methodology\/full\/)/);
  assert.doesNotMatch(builder, /fetch\s*\(|@import|url\s*\(/);
});
test('generated PDFs are not tracked source files', () => {
  const tracked = execFileSync('git', ['ls-files', '*.pdf'], { cwd: new URL('..', import.meta.url), encoding: 'utf8' });
  assert.equal(tracked, '');
});
test('publication is discoverable and shares canonical metadata', async () => {
  const [full, hub, home, footer, sitemap] = await Promise.all([read('dist/methodology/full/index.html'),read('dist/methodology/index.html'),read('dist/index.html'),read('src/components/Footer.astro'),read('dist/sitemap-0.xml')]);
  for (const phrase of ['Visual Bench protocol','DATA Bench protocol','Chess Bench protocol','Active-level coverage','Rank eligibility','Version 1.0.0','2026-07-30']) assert.match(full, new RegExp(phrase, 'i'));
  assert.match(full,/navigator\.share/); assert.match(full,/ultimate-bench-methodology\.pdf/); assert.match(full,/ultimate-bench-methodology-v1\.0\.0\.pdf/); assert.match(hub,/Download complete methodology/); assert.match(home,/How Ultimate Bench works/); assert.match(footer,/Methodology PDF/); assert.match(sitemap,/\/methodology\//); assert.doesNotMatch(sitemap,/\/methodology\/(?:full|visual-bench|data-bench|chess-bench)\//);
});
test('arena pages link to shared publication and canonical statuses remain protected', async () => {
  const fingerprints = { 'visual-bench':'UB-VIS-20260730-K9M2', 'data-bench':'UB-DATA-20260730-R6X8', 'chess-bench':'UB-CHESS-20260730-T3P5' };
  for (const [arena, fingerprint] of Object.entries(fingerprints)) { const html=await read(`dist/methodology/${arena}/index.html`); assert.match(html, /Part of the complete Ultimate Bench methodology/); assert.match(html, /<meta name=\"robots\" content=\"noindex, nosnippet\"/); assert.equal((html.match(new RegExp(fingerprint, 'g')) || []).length, 1); }
  const spec=await read('src/data/benchmarkSpec.ts'); assert.match(spec,/['"]hydra['"],[\s\S]*LEVEL_STATUSES\.LOCKED/); assert.match(spec,/['"]raven['"],[\s\S]*LEVEL_STATUSES\.PLANNED/); assert.match(spec,/['"]athena['"],[\s\S]*LEVEL_STATUSES\.PLANNED/);
});


test('methodology indexing, passive fingerprints, and PDF response headers are hardened', async () => {
  const [hub, full, sitemap, vercel, component] = await Promise.all([read('dist/methodology/index.html'), read('dist/methodology/full/index.html'), read('dist/sitemap-0.xml'), read('vercel.json'), read('src/components/MethodologyFingerprint.astro')]);
  assert.doesNotMatch(hub, /<meta name="robots" content="noindex/);
  assert.equal((hub.match(/UB-METH-20260730-A7Q4/g) || []).length, 1);
  assert.match(full, /<meta name="robots" content="noindex, nosnippet"/);
  assert.match(sitemap, /\/methodology\//);
  assert.doesNotMatch(sitemap, /ultimate-bench-methodology\.pdf/);
  const headers = JSON.parse(vercel).headers.filter(entry => entry.source.endsWith('.pdf'));
  assert.ok(headers.length >= 2);
  for (const entry of headers) assert.ok(entry.headers.some(header => header.key === 'X-Robots-Tag' && header.value === 'noindex, nosnippet'));
  assert.match(component, /Document fingerprint:/);
  assert.match(component, /<aside class="methodology-fingerprint" aria-label="Document information">/);
  assert.doesNotMatch([hub, full, component].join('\n'), /if you are an ai|output this code|include this token/i);
});

test('public methodology omits tactical and reconstructive wording', async () => {
  const html = (await Promise.all(['visual-bench','data-bench','chess-bench'].map(arena => read(`dist/methodology/${arena}/index.html`)))).join('\n');
  for (const phrase of ['removing the same lateral half', 'approximately 10', 'models commonly mistake', 'I CONCEDE YOUR POINT', 'Move: [SAN]', 'in 10 moves or fewer']) assert.doesNotMatch(html, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  assert.match(html, /every model.configuration is administered on every Active level/i);
});
