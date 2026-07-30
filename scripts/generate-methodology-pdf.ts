import PDFDocument from 'pdfkit';
import { createWriteStream } from 'node:fs';
import { mkdir, copyFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { METHODOLOGY, METHODOLOGY_SECTIONS, methodologyFacts } from '../src/data/methodology';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
// Astro empties dist before this script runs, so generated publications belong here,
// after the site build, and never in the source tree.
const directory = join(root, 'dist', 'methodology');
const stable = join(directory, 'ultimate-bench-methodology.pdf');
const versioned = join(directory, `ultimate-bench-methodology-v${METHODOLOGY.version}.pdf`);
await mkdir(directory, { recursive: true });

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 62, bottom: 64, left: 62, right: 62 },
  bufferPages: true,
  compress: true,
  displayTitle: true,
  info: {
    Title: METHODOLOGY.title,
    Subject: METHODOLOGY.description,
    Author: 'Ultimate Bench',
    Creator: 'Ultimate Bench deterministic methodology builder',
    Keywords: 'AI benchmark methodology Visual Bench DATA Bench Chess Bench scoring coverage qualification',
  },
});
const stream = createWriteStream(stable);
doc.pipe(stream);

const blue = '#2563a8';
const paleBlue = '#eef5fb';
const ink = '#172033';
const muted = '#526076';
const rule = '#d9e2ec';
const pageLeft = 62;
const pageRight = doc.page.width - 62;
const pageWidth = pageRight - pageLeft;
const contentBottom = 770;

const ensure = (height: number) => {
  if (doc.y + height > contentBottom) doc.addPage();
};
const pdfText = (text: string) => text
  // The PDF base fonts use WinAnsi, which cannot encode mathematical Sigma.
  // Use an explicit, copy-safe semantic rendering instead of lossy glyph substitution.
  .replace('Σ(result × level weight) / 63', 'sum of (result times level weight) divided by 63')
  .replaceAll('×', ' x ')
  .replaceAll('…', '...')
  .replaceAll('—', '-')
  .replaceAll('•', '|');
const para = (text: string) => {
  doc.x = pageLeft;
  doc.font('Helvetica').fontSize(10.25).fillColor(ink)
    .text(pdfText(text), { width: pageWidth, lineGap: 2.8, paragraphGap: 7 });
};
const sectionHeading = (number: number, title: string, id: string) => {
  ensure(82);
  doc.x = pageLeft;
  if (doc.y > 75) doc.moveDown(.65);
  doc.addNamedDestination(id, 'FitH', doc.y);
  doc.outline.addItem(`${number}. ${title}`);
  doc.font('Helvetica-Bold').fontSize(8.2).fillColor(blue)
    .text(`SECTION ${String(number).padStart(2, '0')}`, { characterSpacing: 1.25 });
  doc.moveDown(.25).font('Helvetica-Bold').fontSize(17.5).fillColor(ink)
    .text(`${number}. ${title}`, { width: pageWidth, lineGap: 2 });
  doc.moveDown(.4);
};
const subheading = (text: string) => {
  ensure(54);
  doc.x = pageLeft;
  doc.moveDown(.35).font('Helvetica-Bold').fontSize(12).fillColor(ink).text(text);
  doc.moveDown(.35);
};

// Cover: intentionally isolated and visually consistent with the web publication.
doc.rect(0, 0, doc.page.width, doc.page.height).fill('#f7fafc');
doc.rect(0, 0, 13, doc.page.height).fill(blue);
doc.y = 120;
doc.font('Helvetica-Bold').fontSize(12).fillColor(blue).text('ULTIMATE BENCH', { characterSpacing: 2 });
doc.moveDown(1.3).fontSize(31).fillColor(ink).text('Methodology and\nEvaluation Protocol', { lineGap: 6 });
doc.moveDown(1.3).font('Helvetica').fontSize(13).fillColor(muted)
  .text(`Version ${METHODOLOGY.version}  |  Revised ${METHODOLOGY.revisionDate}`);
doc.moveDown(2.2).strokeColor(rule).moveTo(pageLeft, doc.y).lineTo(290, doc.y).stroke().moveDown(2);
doc.fontSize(11).fillColor(ink).text(pdfText(METHODOLOGY_SECTIONS[0].paragraphs[0]), { width: 390, lineGap: 4 });
doc.y = 745;
doc.fontSize(10).fillColor(blue).text('ultimate-bench.vercel.app/methodology/full/', {
  link: 'https://ultimate-bench.vercel.app/methodology/full/', underline: true,
});

let pageNumber = 1;
doc.on('pageAdded', () => {
  pageNumber += 1;
  const bodyX = doc.page.margins.left;
  const bodyY = doc.page.margins.top;
  const bottomMargin = doc.page.margins.bottom;
  doc.save();
  doc.page.margins.bottom = 0;
  // A single unobtrusive folio is robust even when PDFKit creates a page from
  // inside an overflowing text operation; running text in that callback can be
  // discarded by PDFKit's stream reset on those automatically-created pages.
  doc.font('Helvetica').fontSize(8).fillColor(muted);
  doc.text(String(pageNumber), pageRight - 28, 808, { width: 28, height: 10, align: 'right' });
  doc.page.margins.bottom = bottomMargin;
  doc.restore();
  doc.x = bodyX;
  doc.y = bodyY;
});

// Contents: two fixed columns with independent rows. Each row is a PDF GoTo
// annotation; no hard-coded page numbers can become stale.
doc.addPage();
doc.font('Helvetica-Bold').fontSize(8.5).fillColor(blue).text('PUBLICATION MAP', { characterSpacing: 1.4 });
doc.moveDown(.45).fontSize(24).fillColor(ink).text('Contents');
doc.moveDown(.35).font('Helvetica').fontSize(9.2).fillColor(muted)
  .text('Select any entry to navigate directly to that numbered section.');
const contentsTop = doc.y + 19;
const columnGap = 25;
const columnWidth = (pageWidth - columnGap) / 2;
const rowHeight = 43;
METHODOLOGY_SECTIONS.forEach((section, index) => {
  const column = index < 13 ? 0 : 1;
  const row = column === 0 ? index : index - 13;
  const x = pageLeft + column * (columnWidth + columnGap);
  const y = contentsTop + row * rowHeight;
  doc.font('Helvetica-Bold').fontSize(8).fillColor(blue)
    .text(String(index + 1).padStart(2, '0'), x, y, { width: 23, goTo: section.id });
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(ink)
    .text(section.title, x + 26, y - 1, { width: columnWidth - 26, height: 31, lineGap: 1, goTo: section.id });
  doc.strokeColor(rule).lineWidth(.5).moveTo(x, y + 34).lineTo(x + columnWidth, y + 34).stroke();
});

// Body sections flow continuously. Only compact semantic units are protected
// from splitting; sections themselves are deliberately allowed to paginate.
doc.addPage();
METHODOLOGY_SECTIONS.forEach((section, index) => {
  sectionHeading(index + 1, section.title, section.id);
  section.paragraphs.forEach(para);

  if (section.id === 'normalization') {
    ensure(78);
    const boxY = doc.y + 4;
    doc.roundedRect(pageLeft, boxY, pageWidth, 58, 5).fillAndStroke(paleBlue, '#bfd4e6');
    doc.fillColor(ink).font('Helvetica-Bold').fontSize(11.5)
      .text('Arena score = sum of (level result times level weight) divided by 63.', pageLeft + 16, boxY + 19, {
        width: pageWidth - 32, align: 'center', lineGap: 2,
      });
    doc.y = boxY + 69;
  }

  if (section.id === 'weights') {
    ensure(90);
    methodologyFacts.forEach(fact => para(`${fact.name}: operational ${fact.operationalWeight}/${fact.permanentDenominator}; reserved ${fact.reservedWeight}/${fact.permanentDenominator}.`));
  }

  if (['visual-bench', 'data-bench', 'chess-bench'].includes(section.id)) {
    const key = section.id === 'visual-bench' ? 'visual' : section.id === 'data-bench' ? 'data-retrieval' : 'chess';
    const fact = methodologyFacts.find(item => item.id === key)!;
    subheading('Canonical level structure');
    ensure(29 * (fact.levels.length + 1) + 45);
    const tableTop = doc.y;
    const widths = [45, 196, 55, pageWidth - 296];
    const headers = ['Level', 'Name', 'Weight', 'Status'];
    let x = pageLeft;
    doc.rect(pageLeft, tableTop, pageWidth, 25).fill(paleBlue);
    headers.forEach((header, cell) => {
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(ink).text(header, x + 7, tableTop + 8, { width: widths[cell] - 14 });
      x += widths[cell];
    });
    let y = tableTop + 25;
    fact.levels.forEach(level => {
      doc.strokeColor(rule).lineWidth(.5).moveTo(pageLeft, y).lineTo(pageRight, y).stroke();
      x = pageLeft;
      const values = [String(level.number), level.name, String(level.weight), level.status.toUpperCase()];
      values.forEach((value, cell) => {
        const statusCell = cell === 3;
        doc.font(statusCell ? 'Helvetica-Bold' : 'Helvetica').fontSize(statusCell ? 7.8 : 8.8)
          .fillColor(statusCell ? (level.status === 'Active' ? '#176b51' : level.status === 'Locked' ? '#7a3e16' : '#64449a') : ink)
          .text(value, x + 7, y + 9, { width: widths[cell] - 14, height: 12 });
        x += widths[cell];
      });
      y += 29;
    });
    doc.rect(pageLeft, tableTop, pageWidth, y - tableTop).stroke(rule);
    doc.x = pageLeft;
    doc.y = y + 9;
    const locked = fact.levels.find(level => level.unlockCondition);
    if (locked) para(`${locked.name} - ${locked.status}. Unlock condition: ${locked.unlockCondition}`);
    para(`Permanent denominator: ${fact.permanentDenominator}. Operational weight: ${fact.operationalWeight}. Reserved weight: ${fact.reservedWeight}.`);
  }
});

ensure(72);
const fingerprintY = doc.y + 10;
doc.roundedRect(pageLeft, fingerprintY, pageWidth, 42, 5).fillAndStroke('#f7fafc', rule);
doc.font('Helvetica').fontSize(9).fillColor(muted)
  .text('Document fingerprint:', pageLeft + 14, fingerprintY + 15, { continued: true })
  .font('Courier-Bold').fillColor(ink).text(' UB-PDF-20260730-N8V4');
doc.y = fingerprintY + 52;

const range = doc.bufferedPageRange();

doc.end();
await new Promise<void>((resolve, reject) => stream.on('finish', resolve).on('error', reject));
await copyFile(stable, versioned);
console.log(`Generated ${stable} and version ${METHODOLOGY.version} (${range.count} pages).`);
