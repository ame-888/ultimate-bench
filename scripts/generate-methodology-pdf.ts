import PDFDocument from 'pdfkit';
import { createWriteStream } from 'node:fs';
import { mkdir, copyFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { METHODOLOGY, METHODOLOGY_SECTIONS, methodologyFacts } from '../src/data/methodology';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
// Write only to Astro's ignored deployment directory. The production build runs
// Astro first so its clean step cannot remove these final artifacts.
const directory = join(root, 'dist', 'methodology');
const stable = join(directory, 'ultimate-bench-methodology.pdf');
const versioned = join(directory, `ultimate-bench-methodology-v${METHODOLOGY.version}.pdf`);
await mkdir(directory, { recursive: true });

const doc = new PDFDocument({ size: 'A4', margins: { top: 64, bottom: 58, left: 62, right: 62 }, bufferPages: true, compress: false,
  info: { Title: METHODOLOGY.title, Subject: METHODOLOGY.description, Author: 'Ultimate Bench', Creator: 'Ultimate Bench deterministic methodology builder', Keywords: 'AI benchmark methodology Visual Bench DATA Bench Chess Bench scoring coverage qualification' } });
const stream = createWriteStream(stable);
doc.pipe(stream);
const blue = '#2563a8', ink = '#172033', muted = '#526076', rule = '#d9e2ec';
const pageWidth = doc.page.width - 124;
const ensure = (height:number) => { if (doc.y + height > doc.page.height - 64) doc.addPage(); };
const heading = (text:string, size=17) => { ensure(size * 2.2); doc.moveDown(.45).font('Helvetica-Bold').fontSize(size).fillColor(ink).text(text).moveDown(.35); };
const para = (text:string) => doc.font('Helvetica').fontSize(10.2).fillColor(ink).text(text, { lineGap: 3.2, align: 'left', link: undefined }).moveDown(.75);

doc.rect(0, 0, doc.page.width, doc.page.height).fill('#f7fafc');
doc.rect(0, 0, 13, doc.page.height).fill(blue);
doc.y = 120;
doc.font('Helvetica-Bold').fontSize(12).fillColor(blue).text('ULTIMATE BENCH', { characterSpacing: 2 });
doc.moveDown(1.3).fontSize(31).fillColor(ink).text('Methodology and\nEvaluation Protocol', { lineGap: 6 });
doc.moveDown(1.3).font('Helvetica').fontSize(13).fillColor(muted).text(`Version ${METHODOLOGY.version}  •  Revised ${METHODOLOGY.revisionDate}`);
doc.moveDown(2.2).strokeColor(rule).moveTo(62, doc.y).lineTo(290, doc.y).stroke().moveDown(2);
doc.fontSize(11).fillColor(ink).text(METHODOLOGY_SECTIONS[0].paragraphs[0], { width: 390, lineGap: 4 });
doc.y = 745; doc.fontSize(10).fillColor(blue).text('ultimate-bench.vercel.app/methodology/full/', { link: 'https://ultimate-bench.vercel.app/methodology/full/' });

doc.addPage(); heading('Contents', 24);
METHODOLOGY_SECTIONS.forEach((section, index) => {
  ensure(18); doc.font('Helvetica').fontSize(10).fillColor(ink).text(`${index + 1}.  ${section.title}`, { continued: true, link: `#${section.id}` });
  doc.fillColor(muted).text('', { align: 'right' });
});

METHODOLOGY_SECTIONS.forEach((section, index) => {
  doc.addPage();
  doc.addNamedDestination(section.id);
  doc.font('Helvetica-Bold').fontSize(9).fillColor(blue).text(`SECTION ${String(index + 1).padStart(2, '0')}`);
  heading(`${index + 1}. ${section.title}`, 21);
  section.paragraphs.forEach(para);
  if (section.id === 'normalization') {
    ensure(78); doc.roundedRect(62, doc.y, pageWidth, 62, 5).fillAndStroke('#eef5fb', '#bfd4e6');
    doc.fillColor(ink).font('Helvetica-Bold').fontSize(12).text('Arena score = Σ(earned level result × level weight) / 63', 78, doc.y + 20, { width: pageWidth - 32, align: 'center' }); doc.y += 76;
  }
  if (section.id === 'weights') {
    methodologyFacts.forEach(fact => para(`${fact.name}: operational ${fact.operationalWeight}/${fact.permanentDenominator}; reserved ${fact.reservedWeight}/${fact.permanentDenominator}.`));
  }
  if (['visual-bench','data-bench','chess-bench'].includes(section.id)) {
    const key = section.id === 'visual-bench' ? 'visual' : section.id === 'data-bench' ? 'data-retrieval' : 'chess';
    const fact = methodologyFacts.find(item => item.id === key)!;
    heading('Canonical level structure', 13);
    fact.levels.forEach(level => para(`Level ${level.number} — ${level.name} • weight ${level.weight} • ${level.status}${level.unlockCondition ? ` • Unlock condition: ${level.unlockCondition}` : ''}`));
    para(`Permanent denominator: ${fact.permanentDenominator}. Operational weight: ${fact.operationalWeight}. Reserved weight: ${fact.reservedWeight}.`);
  }
});

const range = doc.bufferedPageRange();
for (let i = range.start; i < range.start + range.count; i++) {
  doc.switchToPage(i);
  if (i > 0) {
    const bottomMargin = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    doc.strokeColor(rule).moveTo(62, 800).lineTo(doc.page.width - 62, 800).stroke();
    doc.font('Helvetica').fontSize(8).fillColor(muted).text(`Ultimate Bench Methodology • v${METHODOLOGY.version}`, 62, 808, { width: 360, lineBreak: false });
    doc.text(`${i + 1}`, doc.page.width - 90, 808, { width: 28, align: 'right', lineBreak: false });
    doc.page.margins.bottom = bottomMargin;
  }
}
doc.end();
await new Promise<void>((resolve, reject) => stream.on('finish', resolve).on('error', reject));
await copyFile(stable, versioned);
console.log(`Generated ${stable} and version ${METHODOLOGY.version}.`);
