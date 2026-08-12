import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
const bundle = `/tmp/ultimate-bench-scoring-${process.pid}.mjs`;
execFileSync('node_modules/.bin/esbuild', ['test/scoring-api.ts','--bundle','--platform=node','--format=esm',`--outfile=${bundle}`]);
const api = await import(pathToFileURL(bundle));
const {ARENAS,ARENA_LIST,LEVEL_STATUSES,RESULT_STATUSES,activeLevels,canonicalDenominator,operationalWeight,calculateArenaScore,calculateOverall,validateArenaDefinition,validateBenchmarkRecords,buildLeaderboard,benchmarks,formatAggregateScore,assignTiedRanks}=api;

test('canonical six-position structures and statuses are exact',()=>{
 for(const arena of ARENA_LIST){assert.equal(arena.levels.length,6);assert.deepEqual(arena.levels.map(x=>x.weight),[1,2,4,8,16,32]);assert.equal(canonicalDenominator(arena),63);validateArenaDefinition(arena)}
 assert.deepEqual(ARENAS.visual.levels.map(x=>x.status),['Active','Active','Active','Active','Active','Planned']);
 assert.deepEqual(ARENAS.dataRetrieval.levels.map(x=>x.status),['Active','Active','Active','Active','Planned','Planned']);
 assert.deepEqual(ARENAS.chess.levels.map(x=>x.status),['Active','Active','Active','Active','Active','Locked']);
 assert.match(ARENAS.chess.levels[5].unlockCondition,/at least one evaluated model obtains a numeric score above 0 on Python/);
 assert.deepEqual(ARENA_LIST.map(operationalWeight),[31,15,31]);
});
test('definition validation prevents structural and denominator drift',()=>{
 assert.throws(()=>validateArenaDefinition({...ARENAS.visual,levels:ARENAS.visual.levels.slice(0,5)}),/exactly six/);
 const bad=structuredClone(ARENAS.chess);bad.levels[5].unlockCondition=undefined;assert.throws(()=>validateArenaDefinition(bad),/unlock condition/);
 bad.levels[5].unlockCondition='x';bad.levels[5].weight=31;assert.throws(()=>validateArenaDefinition(bad),/invalid weight/);
});
test('fixed denominator arithmetic covers all result states',()=>{
 const base={worm:10,koala:10,crow:10,octopus:10};
 assert.equal(calculateArenaScore(ARENAS.dataRetrieval,base).score,150/63);
 for(const v of [0,'INVALID','UNAVAILABLE','NOT_TESTED']){const r=calculateArenaScore(ARENAS.dataRetrieval,{...base,koala:v});assert.equal(r.denominator,63);assert.equal(r.fullDenominator,63)}
 for(const v of ['UNAVAILABLE','NOT_TESTED']){const r=calculateArenaScore(ARENAS.dataRetrieval,{...base,koala:v});assert.equal(r.score,130/63);assert.equal(r.rankEligible,false);assert.equal(r.coverage,'3/4 active levels')}
 const none=calculateArenaScore(ARENAS.dataRetrieval,{worm:'UNAVAILABLE',koala:'NOT_TESTED',crow:'UNAVAILABLE',octopus:'NOT_TESTED'});assert.equal(none.score,0);assert.equal(none.computable,true);
});
test('current perfect Active results reserve future capacity',()=>{
 assert.equal(calculateArenaScore(ARENAS.visual,{lvl1:100,lvl2:100,lvl3:100,lvl4:100,lvl5:100}).score,3100/63);
 assert.equal(calculateArenaScore(ARENAS.dataRetrieval,{worm:100,koala:100,crow:100,octopus:100}).score,1500/63);
 assert.equal(calculateArenaScore(ARENAS.chess,{mouse:100,spider:100,wolf:100,hawk:100,python:100}).score,3100/63);
 const future=structuredClone(ARENAS.visual);future.levels[5].status='Active';assert.equal(canonicalDenominator(future),63);
});
test('Active fields remain required, non-Active fields and origins are rejected',()=>{
 assert.throws(()=>calculateArenaScore(ARENAS.visual,{lvl1:1}),/missing/);
 const planned=structuredClone(benchmarks);planned.models[0].scores.lvl6=0;assert.throws(()=>validateBenchmarkRecords(planned),/Planned/);
 const locked=structuredClone(benchmarks);locked.chessModels[0].scores.hydra=0;assert.throws(()=>validateBenchmarkRecords(locked),/Locked/);
 const metadata=structuredClone(benchmarks);metadata.chessModels[0].origins={python:'legacy'};assert.throws(()=>validateBenchmarkRecords(metadata),/unsupported metadata field/);
});
test('Chess Active levels are independent after numeric zero and INVALID',()=>{
 const zeros={name:'zero sequence',scores:{mouse:0,spider:0,wolf:0,hawk:0,python:0}};
 const mixed={name:'mixed sequence',scores:{mouse:'INVALID',spider:12,wolf:0,hawk:'INVALID',python:4}};
 for(const record of [zeros,mixed])assert.equal(validateBenchmarkRecords({models:[],dataRetrieval:[],chessModels:[record]}),true);
 assert.equal(calculateArenaScore(ARENAS.chess,zeros.scores).score,0);
 assert.equal(calculateArenaScore(ARENAS.chess,mixed.scores).included,5);
});
test('former Chess gated values are direct observed numeric zeroes',()=>{
 const record=benchmarks.chessModels.find(row=>row.name==='Gemini 3.6 Flash');assert.ok(record);
 assert.deepEqual(record.scores,{mouse:65,spider:34,wolf:22,hawk:0,python:0});
 assert.equal(Object.hasOwn(record,'origins'),false);assert.equal(Object.hasOwn(record.scores,'hydra'),false);
 const result=calculateArenaScore(ARENAS.chess,record.scores);
 assert.equal(result.numerator,221);assert.equal(result.score,221/63);assert.equal(result.coverage,'5/5 active levels');assert.equal(result.rankEligible,true);
 assert.equal(formatAggregateScore(result.score),'3.51');
 const built=buildLeaderboard(benchmarks),overall=built.rows.find(row=>row.name===record.name);assert.ok(overall);assert.equal(overall.scores.chess,221/63);
});
test('new release metadata is canonical and inherited by arena presentation',()=>{
 const gemini=benchmarks.models.find(row=>row.name==='Gemini 3.6 Flash');
 const grok=benchmarks.models.find(row=>row.name==='Grok 4.5 Fast');
 assert.equal(gemini?.releaseDate,'2026-07-21');assert.equal(grok?.releaseDate,'2026-07-22');
 assert.equal(benchmarks.dataRetrieval.find(row=>row.name==='Grok 4.5 Fast')?.releaseDate,undefined);
 assert.equal(benchmarks.chessModels.some(row=>row.name==='Grok 4.5 Fast'),false);
});
test('Claude Opus release metadata and Chess results feed the canonical leaderboard',()=>{
 const claude48=benchmarks.models.find(row=>row.name==='Claude 4.8 Opus (high)');
 assert.equal(claude48?.releaseDate,'2026-05-28');
 const name='Claude 5 Opus (high)',record=benchmarks.chessModels.find(row=>row.name===name);assert.ok(record);
 assert.deepEqual(record.scores,{mouse:62,spider:28,wolf:43,hawk:0,python:0});
 const built=buildLeaderboard(benchmarks),row=built.rows.find(item=>item.name===name);assert.ok(row);
 assert.equal(row.scores.chess,(62+2*28+4*43)/63);
 assert.equal(row.score,(row.scores.visual+row.scores['data-retrieval']+row.scores.chess)/3);
 assert.ok(row.rank>0);
});
test('Grok 4.5 Fast DATA results are complete, official, and do not qualify for Overall',()=>{
 const record=benchmarks.dataRetrieval.find(row=>row.name==='Grok 4.5 Fast');assert.ok(record);
 assert.deepEqual(record.scores,{worm:21,koala:12,crow:7,octopus:0});
 assert.equal(Object.hasOwn(record.scores,'raven'),false);assert.equal(Object.hasOwn(record.scores,'athena'),false);
 const result=calculateArenaScore(ARENAS.dataRetrieval,record.scores);
 assert.equal(result.numerator,73);assert.equal(result.denominator,63);assert.equal(result.score,73/63);
 assert.equal(formatAggregateScore(result.score),'1.16');assert.equal(result.coverage,'4/4 active levels');
 assert.equal(result.completeCoverage,true);assert.equal(result.rankEligible,true);
 const built=buildLeaderboard(benchmarks),row=built.arenaRows['data-retrieval'].find(item=>item.name===record.name);
 assert.ok(row?.rank);assert.equal(built.rows.some(item=>item.name===record.name),false);
});
test('GPT-5.6 Sol August Visual and DATA results do not qualify for Overall without Chess',()=>{
 const name='GPT-5.6 Sol (high) - AUGUST';
 const visualRecords=benchmarks.models.filter(row=>row.name===name);assert.equal(visualRecords.length,1);
 assert.deepEqual(visualRecords[0].scores,{lvl1:92,lvl2:84,lvl3:85,lvl4:50,lvl5:0});
 assert.equal(benchmarks.chessModels.some(row=>row.name===name),false);
 const record=benchmarks.dataRetrieval.find(row=>row.name===name);assert.ok(record);
 assert.deepEqual(record.scores,{worm:57,koala:49,crow:33,octopus:16});
 assert.equal(Object.hasOwn(record.scores,'raven'),false);assert.equal(Object.hasOwn(record.scores,'athena'),false);
 const built=buildLeaderboard(benchmarks);
 assert.ok(built.arenaRows['data-retrieval'].some(row=>row.name===name));
 assert.ok(built.arenaRows.visual.some(row=>row.name===name));
 assert.equal(built.arenaRows.chess.some(row=>row.name===name),false);
 assert.equal(built.rows.some(row=>row.name===name),false);
});
test('Gemini 3.1 Pro Preview with code execution has complete DATA results',()=>{
 const name='Gemini 3.1 Pro Preview (with code execution)';
 const record=benchmarks.dataRetrieval.find(row=>row.name===name);assert.ok(record);
 assert.deepEqual(record.scores,{worm:21,koala:'INVALID',crow:14,octopus:0});
 const result=calculateArenaScore(ARENAS.dataRetrieval,record.scores);
 assert.equal(result.numerator,77);assert.equal(result.score,77/63);
 assert.equal(result.coverage,'4/4 active levels');assert.equal(result.rankEligible,true);
 const built=buildLeaderboard(benchmarks),row=built.arenaRows['data-retrieval'].find(item=>item.name===name);
 assert.ok(row?.rank);assert.equal(built.rows.some(item=>item.name===name),false);
});
test('Gemini 3.6 Flash with code execution has complete DATA results',()=>{
 const name='Gemini 3.6 Flash (with code execution)';
 const record=benchmarks.dataRetrieval.find(row=>row.name===name);assert.ok(record);
 assert.deepEqual(record.scores,{worm:24,koala:'INVALID',crow:'INVALID',octopus:'INVALID'});
 const result=calculateArenaScore(ARENAS.dataRetrieval,record.scores);
 assert.equal(result.numerator,24);assert.equal(result.score,24/63);
 assert.equal(result.coverage,'4/4 active levels');assert.equal(result.rankEligible,true);
 const built=buildLeaderboard(benchmarks),row=built.arenaRows['data-retrieval'].find(item=>item.name===name);
 assert.ok(row?.rank);assert.equal(built.rows.some(item=>item.name===name),false);
});
test('aggregate formatting is display-only and tied ranks retain full precision',()=>{
 assert.equal(formatAggregateScore(73/63),'1.16');assert.equal(formatAggregateScore(221/63),'3.51');
 assert.throws(()=>formatAggregateScore(Number.NaN),/finite/);
 const distinct=assignTiedRanks([{name:'lower',score:1.141},{name:'higher',score:1.144}]);
 assert.deepEqual(distinct.map(row=>[row.name,row.rank]),[['higher',1],['lower',2]]);
 assert.equal(formatAggregateScore(distinct[0].score),formatAggregateScore(distinct[1].score));
 const tied=assignTiedRanks([{name:'Zulu',score:1.149},{name:'Alpha',score:1.149},{name:'Other',score:1.1}]);
 assert.deepEqual(tied.map(row=>[row.name,row.rank]),[['Alpha',1],['Zulu',1],['Other',3]]);
});
test('homepage formats aggregates to two decimals and keeps raw sort attributes',async()=>{
 const fs=await import('node:fs/promises');
 const [home,script]=await Promise.all(['src/pages/index.astro','src/scripts/home-page.js'].map(path=>fs.readFile(path,'utf8')));
 assert.match(home,/formatAggregateScore\(Number\(score\)\)/);assert.match(home,/formatAggregateScore\(item\.ultimateScore\)/);
 assert.match(home,/formatAggregateScore\(item\.score\)/);assert.match(home,/formatAggregateScore\(sotaScore\)/);
 assert.match(home,/data-absolute-score=\{item\.ultimateScore\}/);assert.doesNotMatch(home,/data-absolute-score=\{[^}]*toFixed/);
 assert.match(script,/getAttribute\('data-absolute-score'\)/);assert.doesNotMatch(script,/cellA \? parseFloat\(cellA\.textContent\)/);
});
test('coverage and rank eligibility are independent from reserved capacity',()=>{
 const complete=calculateArenaScore(ARENAS.dataRetrieval,{worm:0,koala:'INVALID',crow:1,octopus:2});assert.equal(complete.rankEligible,true);assert.equal(complete.coverage,'4/4 active levels');assert.equal(complete.denominator,63);
});
test('published migration preserves Active fields and excludes all non-Active fields',()=>{
 for(const r of benchmarks.chessModels){assert.equal(Object.hasOwn(r.scores,'hydra'),false);assert.equal(Object.hasOwn(r,'origins'),false);for(const k of ['mouse','spider','wolf','hawk','python'])assert.equal(Object.hasOwn(r.scores,k),true)}
 for(const r of benchmarks.models)assert.equal(Object.hasOwn(r.scores,'lvl6'),false);
 for(const r of benchmarks.dataRetrieval)for(const k of ['raven','athena'])assert.equal(Object.hasOwn(r.scores,k),false);
 assert.equal(validateBenchmarkRecords(benchmarks),true);
});
test('Overall is equal mean and canonical leaderboard derives recalculated values',()=>{
 assert.equal(calculateOverall([31/63,15/63,31/63]),77/189);
 const built=buildLeaderboard(benchmarks),row=built.rows.find(x=>x.name==='GPT-5.6 Sol (high) - JULY');assert.equal(row.scores.visual,688/63);assert.equal(row.scores['data-retrieval'],311/63);assert.equal(row.scores.chess,469/63);assert.ok(Math.abs(row.score-(688+311+469)/63/3)<1e-12);
});
test('UI and methodology expose fixed scale and distinct zero/status labels',async()=>{
 const fs=await import('node:fs/promises');const [home,method,chess,visual,readme]=await Promise.all(['src/pages/index.astro','src/pages/methodology.astro','src/pages/methodology/chess-bench.astro','src/pages/methodology/visual-bench.astro','README.md'].map(x=>fs.readFile(x,'utf8')));
 assert.match(home,/LOCKED/);assert.doesNotMatch(home,/progression-gate-label|prerequisite level not passed/);assert.match(home,/Active-level coverage/);
 for(const text of [method,chess,visual,readme])assert.match(text,/denominator (?:of )?63|denominator 63|denominator `63`/i);
 assert.match(method,/reserved zero/i);assert.match(method,/Every model\/configuration is administered on every Active level/);assert.match(chess,/Hydra returned from Active to Locked/);assert.doesNotMatch(chess,/Position ID\s*[#:=-]?\s*\d{1,3}/i);
});

test('public guidance preserves UNAVAILABLE weight, denominator, and provisional status',async()=>{
 const fs=await import('node:fs/promises');const articles=await fs.readFile('src/data/articles.ts','utf8');
 assert.match(articles,/UNAVAILABLE Active level contributes zero points without removing its weight/);
 assert.match(articles,/permanent denominator of 63/);assert.match(articles,/coverage incomplete/);
 assert.match(articles,/provisional result with no official arena rank/);assert.match(articles,/cannot contribute to Overall qualification/);
 assert.doesNotMatch(articles,/excludes? an? Unavailable active level and its weight/i);
 assert.doesNotMatch(articles,/UNAVAILABLE[^.]{0,120}(?:level|weight)[^.]{0,40}(?:excluded|removed)|(?:excludes?|removes?)[^.]{0,120}UNAVAILABLE/i);
});

test('Chess level navigation uses stable canonical keys that match protocol IDs',async()=>{
 const fs=await import('node:fs/promises');const source=await fs.readFile('src/pages/methodology/chess-bench.astro','utf8');
 assert.match(source,/href=\{`#level-\$\{level\.number\}-\$\{level\.key\}`\}/);
 assert.doesNotMatch(source,/level\.name\.toLowerCase\(\)/);
 for(const level of ARENAS.chess.levels){
  const fragment=`level-${level.number}-${level.key}`;
  assert.ok(source.includes('id={`level-${'+level.key+'.number}-${'+level.key+'.key}`}'));
  assert.equal(fragment,`level-${level.number}-${level.key}`);
 }
 const renamed={number:7,key:'stable-key',name:'Renamed Level! (v2)'};
 assert.equal(`level-${renamed.number}-${renamed.key}`,'level-7-stable-key');
 assert.notEqual(`level-${renamed.number}-${renamed.key}`,`level-${renamed.number}-${renamed.name.toLowerCase()}`);
});

test('DATA methodology route documents canonical structure without exposing reserved results',async()=>{
 const fs=await import('node:fs/promises');
 const [data,method,home,readme]=await Promise.all(['src/pages/methodology/data-bench.astro','src/pages/methodology.astro','src/pages/index.astro','README.md'].map(path=>fs.readFile(path,'utf8')));
 assert.match(method,/href="\/methodology\/data-bench\/"/);assert.match(home,/href="\/methodology\/data-bench\/"/);assert.match(readme,/`\/methodology\/data-bench\/`/);
 for(const [number,name] of [[1,'worm'],[2,'koala'],[3,'crow'],[4,'octopus'],[5,'raven'],[6,'athena']])assert.match(data,new RegExp(`id="level-${number}-${name}"`));
 assert.match(data,/data-level-status="Planned"[^>]*aria-labelledby="athena-title"/);assert.match(data,/Athena is Planned and not properly designed/);
 assert.match(data,/Permanent denominator/);assert.match(data,/canonicalDenominator\(arena\)/);assert.match(data,/const formula=active\.map/);
 assert.match(data,/100 administrations/);assert.match(data,/10 conversations/);assert.match(data,/same ten questions as Worm/);
 assert.match(data,/numerical context that may be misleading/);assert.doesNotMatch(data,/deliberately incorrect suggested number|models commonly mistake/);
 assert.match(data,/Raven is intended to combine difficult retrieval, answer binding, and arithmetic synthesis/);assert.doesNotMatch(data,/10 sections of text|multiply those two numbers together|Only the product scores/);
 assert.doesNotMatch(data,/Position ID\s*[#:=-]?\s*\d{1,3}/i);
 for(const result of benchmarks.dataRetrieval)assert.equal(Object.hasOwn(result.scores,'athena'),false);
});

test('methodology semantics derive from canonical statuses and metadata',async()=>{
 const fs=await import('node:fs/promises');
 const [general,visual,data,chess,spec]=await Promise.all(['src/pages/methodology.astro','src/pages/methodology/visual-bench.astro','src/pages/methodology/data-bench.astro','src/pages/methodology/chess-bench.astro','src/data/benchmarkSpec.ts'].map(path=>fs.readFile(path,'utf8')));
 assert.match(general,/Active, Planned, and Locked levels/);
 assert.match(visual,/Eagle contributes 16\/63 and Owl 8\/63 of the permanent complete six-level Visual ladder/);
 assert.match(visual,/currently operational Visual weight of 31[\s\S]*16\/31 and 8\/31 respectively/);
 assert.doesNotMatch(visual,/(?:16\/31|8\/31)[^.]*complete score/i);
 assert.match(data,/Raven is <strong>Planned<\/strong>[\s\S]*no finalized operational protocol/);
 assert.match(spec,/Raven'[\s\S]*LEVEL_STATUSES\.PLANNED[\s\S]*no finalized operational protocol exists/);
 assert.match(chess,/import \{ ARENAS, LEVEL_STATUSES \}/);
 assert.match(chess,/const arena = ARENAS\.chess/);
 assert.doesNotMatch(chess,/name:\s*'Mouse'|name:\s*'Hydra'|status:\s*'Locked'/);
 assert.match(chess,/` \(\$\{level\.status\}\)`/);
 assert.doesNotMatch(chess,/\(Planned\)/);
 assert.match(chess,/id="auditability"/);
 assert.match(chess,/private Chess960 position identifier/);
 assert.match(chess,/Object\.keys\(opponentSettings\)\.length !== levels\.length/);
 assert.match(chess,/const \[mouse, spider, wolf, hawk, python, hydra\] = levels/);
 for(const variable of ['mouse','spider','wolf','hawk','python','hydra'])assert.match(chess,new RegExp(`level-\\$\\{${variable}\\.number\\}`));
 for(const arena of ARENA_LIST)for(const level of arena.levels.filter(x=>x.status!==LEVEL_STATUSES.ACTIVE))for(const record of benchmarks[arena.dataKey])assert.equal(Object.hasOwn(record.scores,level.key),false);
});

test('methodology source navigation targets sections and sitemap generation covers every route',async()=>{
 const fs=await import('node:fs/promises');
 for(const path of ['src/pages/methodology/visual-bench.astro','src/pages/methodology/data-bench.astro','src/pages/methodology/chess-bench.astro']){
  const source=await fs.readFile(path,'utf8');
  const staticLinks=[...source.matchAll(/href="#([a-z0-9-]+)"/g)].map(match=>match[1]);
  for(const id of staticLinks)assert.match(source,new RegExp(`id="${id}"`),`${path} missing #${id}`);
 }
 const generator=await fs.readFile('scripts/generate-sitemap.mjs','utf8');
 assert.match(generator,/findHtml\(outputDirectory\)/);
 assert.equal(await fs.stat('public/sitemap-0.xml').then(()=>true,()=>false),false);
 assert.equal(await fs.stat('public/sitemap-index.xml').then(()=>true,()=>false),false);
 for(const route of ['methodology.astro','methodology/visual-bench.astro','methodology/data-bench.astro','methodology/chess-bench.astro'])assert.equal(await fs.stat(`src/pages/${route}`).then(()=>true,()=>false),true);
});

test('current user-facing sources contain no obsolete gate language',async()=>{
 const fs=await import('node:fs/promises');
 const files=['src/pages/index.astro','src/pages/analysis.astro','src/pages/methodology.astro','src/pages/methodology/visual-bench.astro','src/pages/methodology/data-bench.astro','src/pages/methodology/chess-bench.astro','src/data/guide.ts','src/data/methodology.ts'];
 for(const file of files){const text=await fs.readFile(file,'utf8');assert.doesNotMatch(text,/progression-gated|failed prerequisite|passesProgressionGate|PROGRESSION_GATED|attempts Level|only after/i,file)}
});
