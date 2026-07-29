import PDFDocument from 'pdfkit';
import { createWriteStream, mkdirSync, copyFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { METHODOLOGY, PUBLICATION_SECTIONS, methodologyArenas } from '../src/data/methodologyPublication';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const output = join(root, 'public', METHODOLOGY.pdfPath);
mkdirSync(dirname(output), { recursive: true });
const doc = new PDFDocument({ size: 'A4', margins: { top: 62, bottom: 62, left: 64, right: 64 }, bufferPages: true,
  info: { Title: METHODOLOGY.title, Subject: METHODOLOGY.description, Author: 'Ultimate Bench', Creator: 'Ultimate Bench deterministic PDF generator', Keywords: 'Ultimate Bench, methodology, Visual Bench, DATA Bench, Chess Bench, scoring, coverage, qualification', CreationDate: new Date(`${METHODOLOGY.revisionDate}T00:00:00Z`), ModDate: new Date(`${METHODOLOGY.revisionDate}T00:00:00Z`) } });
const stream = createWriteStream(output);
doc.pipe(stream);
const teal = '#0f766e', ink = '#172033', muted = '#586579', rule = '#d4dde5';

function ensure(space = 80) { if (doc.y + space > doc.page.height - 62) doc.addPage(); }
function heading(text: string, index: number, id: string) { ensure(110); doc.addNamedDestination(id); doc.fillColor(teal).font('Helvetica-Bold').fontSize(10).text(`SECTION ${String(index).padStart(2, '0')}`, { characterSpacing: 1.5 }); doc.moveDown(.35).fillColor(ink).fontSize(20).text(text); doc.moveDown(.5); }
function paragraph(text: string) { doc.fillColor(ink).font('Helvetica').fontSize(10.5).text(text, { lineGap: 4, paragraphGap: 8 }); }
function table(rows: string[][], widths: number[]) { ensure(52); const startX = doc.page.margins.left; for (const [ri,row] of rows.entries()) { const height = Math.max(...row.map((cell,i) => doc.heightOfString(cell,{width:widths[i]-12}))) + 12; ensure(height + 4); const rowY=doc.y; let x=startX; row.forEach((cell,i)=>{ doc.rect(x,rowY,widths[i],height).fillAndStroke(ri===0?'#e5f4f1':'#ffffff',rule); doc.fillColor(ink).font(ri===0?'Helvetica-Bold':'Helvetica').fontSize(8).text(cell,x+6,rowY+6,{width:widths[i]-12,height:height-8}); x+=widths[i]; }); doc.x = startX; doc.y = rowY + height; } doc.x = startX; doc.moveDown(); }

// Cover
doc.rect(0, 0, doc.page.width, doc.page.height).fill('#f7fafc');
doc.rect(0, 0, 14, doc.page.height).fill(teal);
doc.y=120; doc.x=76; doc.fillColor(teal).font('Helvetica-Bold').fontSize(11).text('ULTIMATE BENCH · PUBLIC SPECIFICATION',{characterSpacing:1.6});
doc.moveDown(2).fillColor(ink).fontSize(35).text('Methodology and\nEvaluation Protocol',{lineGap:8});
doc.moveDown(1.5).fillColor(muted).font('Helvetica').fontSize(13).text(PUBLICATION_SECTIONS[0].paragraphs[0],{width:430,lineGap:5});
doc.y=610; doc.fillColor(ink).font('Helvetica-Bold').fontSize(10).text(`Version ${METHODOLOGY.version}`); doc.moveDown(.4).font('Helvetica').text(`Revised ${METHODOLOGY.revisionDate}`); doc.moveDown(.4).fillColor(teal).text('ultimate-bench.vercel.app/methodology/full/',{link:'https://ultimate-bench.vercel.app/methodology/full/',underline:true});

// Contents
doc.addPage(); doc.fillColor(teal).font('Helvetica-Bold').fontSize(10).text('DOCUMENT NAVIGATION',{characterSpacing:1.5}); doc.moveDown(.5).fillColor(ink).fontSize(26).text('Table of contents'); doc.moveDown();
PUBLICATION_SECTIONS.forEach((section,index)=>{ if(doc.y>745) doc.addPage(); doc.fillColor(teal).font('Helvetica-Bold').fontSize(9).text(String(index+1).padStart(2,'0'),64,doc.y,{continued:true,width:30}); doc.fillColor(ink).font('Helvetica').text(section.title,94,doc.y,{goTo:section.id,underline:false}); doc.moveDown(.55); });

PUBLICATION_SECTIONS.forEach((section,index)=>{ doc.addPage(); heading(section.title,index+1,section.id); section.paragraphs.forEach(paragraph);
  if(section.id==='weights') table([['Arena','Active','Operational','Reserved','Denominator'],...methodologyArenas.map(a=>[a.name,String(a.activeCount),String(a.operationalWeight),String(a.reservedWeight),String(a.denominator)])],[170,55,78,70,80]);
  if(section.id==='result-states') methodologyArenas.forEach(arena=>{ ensure(250); doc.fillColor(ink).font('Helvetica-Bold').fontSize(13).text(arena.name); paragraph(arena.description); table([['Level / key','Name','Weight','Status'],...arena.levels.map(l=>[`${l.number} / ${l.key}`,l.name,String(l.weight),l.status])],[105,155,65,128]); if(arena.levels.some(l=>l.unlockCondition)) { doc.fillColor(teal).font('Helvetica-Bold').fontSize(9).text('LOCKED CONDITION'); paragraph(arena.levels.find(l=>l.unlockCondition)!.unlockCondition!); } });
  const links: Record<string,[string,string]>={ 'visual-bench':['Detailed Visual Bench methodology','https://ultimate-bench.vercel.app/methodology/visual-bench/'], 'data-bench':['Detailed DATA Bench methodology','https://ultimate-bench.vercel.app/methodology/data-bench/'], 'chess-bench':['Detailed Chess Bench methodology','https://ultimate-bench.vercel.app/methodology/chess-bench/']}; if(links[section.id]) { const [label,url]=links[section.id]; doc.moveDown().fillColor(teal).text(label,{link:url,underline:true}); }
});

const range = doc.bufferedPageRange();
for(let i=range.start;i<range.start+range.count;i++){ doc.switchToPage(i); doc.save(); doc.moveTo(64,doc.page.height-87).lineTo(doc.page.width-64,doc.page.height-87).strokeColor(rule).stroke(); doc.fillColor(muted).font('Helvetica').fontSize(8).text('ULTIMATE BENCH · METHODOLOGY AND EVALUATION PROTOCOL',64,doc.page.height-80,{width:380,lineBreak:false}); doc.text(`${i+1} / ${range.count}`,doc.page.width-130,doc.page.height-80,{width:66,align:'right',lineBreak:false}); doc.restore(); }
doc.end();
await new Promise<void>((resolve,reject)=>{stream.on('finish',resolve);stream.on('error',reject)});
const versioned=join(root,'public',METHODOLOGY.versionedPdfPath); copyFileSync(output,versioned);
const bytes=statSync(output).size; if(bytes<20_000) throw new Error(`Generated PDF is unexpectedly small (${bytes} bytes).`);
console.log(`Generated methodology PDF v${METHODOLOGY.version}: ${bytes} bytes`);
