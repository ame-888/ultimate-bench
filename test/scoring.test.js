import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
const bundle = `/tmp/ultimate-bench-scoring-${process.pid}.mjs`;
execFileSync('node_modules/.bin/esbuild', ['test/scoring-api.ts','--bundle','--platform=node','--format=esm',`--outfile=${bundle}`]);
const api = await import(pathToFileURL(bundle));
const {ARENAS,ARENA_LIST,LEVEL_STATUSES,RESULT_STATUSES,activeLevels,canonicalDenominator,operationalWeight,calculateArenaScore,calculateOverall,validateArenaDefinition,validateBenchmarkRecords,validateProgressionOrigins,buildLeaderboard,benchmarks}=api;

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
test('missing Active and non-Active model fields are rejected',()=>{
 assert.throws(()=>calculateArenaScore(ARENAS.visual,{lvl1:1}),/missing/);
 const copy=structuredClone(benchmarks);copy.models[0].scores.lvl6=0;assert.throws(()=>validateBenchmarkRecords(copy),/Planned/);
 const copy2=structuredClone(benchmarks);copy2.chessModels[0].scores.hydra=0;assert.throws(()=>validateBenchmarkRecords(copy2),/Locked/);
 const copy3=structuredClone(benchmarks);copy3.chessModels[0].origins.hydra='progression-gated';assert.throws(()=>validateBenchmarkRecords(copy3),/non-Active/);
});
test('attempted and gated zero score identically but origins validate distinctly',()=>{
 const scores={mouse:10,spider:0,wolf:0,hawk:0,python:0};
 const gated={name:'x',scores,origins:{wolf:'progression-gated',hawk:'progression-gated',python:'progression-gated'}};
 validateProgressionOrigins(ARENAS.chess,gated);assert.equal(calculateArenaScore(ARENAS.chess,scores).score,10/63);
 assert.throws(()=>validateProgressionOrigins(ARENAS.chess,{name:'x',scores:{...scores,wolf:1},origins:gated.origins}),/numeric zero/);
 assert.throws(()=>validateProgressionOrigins(ARENAS.chess,{name:'x',scores,origins:{mouse:'progression-gated'}}),/without a failed prerequisite/);
 assert.throws(()=>validateProgressionOrigins(ARENAS.chess,{name:'x',scores}),/resumes after a failed prerequisite/);
});
test('coverage and rank eligibility are independent from reserved capacity',()=>{
 const complete=calculateArenaScore(ARENAS.dataRetrieval,{worm:0,koala:'INVALID',crow:1,octopus:2});assert.equal(complete.rankEligible,true);assert.equal(complete.coverage,'4/4 active levels');assert.equal(complete.denominator,63);
});
test('published migration removes Hydra and preserves Active Chess fields/origins',()=>{
 for(const r of benchmarks.chessModels){assert.equal(Object.hasOwn(r.scores,'hydra'),false);assert.equal(Object.hasOwn(r.origins??{},'hydra'),false);for(const k of ['mouse','spider','wolf','hawk','python'])assert.equal(Object.hasOwn(r.scores,k),true)}
 for(const r of benchmarks.models)assert.equal(Object.hasOwn(r.scores,'lvl6'),false);
 for(const r of benchmarks.dataRetrieval)for(const k of ['raven','athena'])assert.equal(Object.hasOwn(r.scores,k),false);
 assert.equal(validateBenchmarkRecords(benchmarks),true);
});
test('Overall is equal mean and canonical leaderboard derives recalculated values',()=>{
 assert.equal(calculateOverall([31/63,15/63,31/63]),77/189);
 const built=buildLeaderboard(benchmarks),row=built.rows.find(x=>x.name==='GPT-5.6 Sol (high)');assert.equal(row.scores.visual,688/63);assert.equal(row.scores['data-retrieval'],311/63);assert.equal(row.scores.chess,469/63);assert.ok(Math.abs(row.score-(688+311+469)/63/3)<1e-12);
});
test('UI and methodology expose fixed scale and distinct zero/status labels',async()=>{
 const fs=await import('node:fs/promises');const [home,method,chess,visual,readme]=await Promise.all(['src/pages/index.astro','src/pages/methodology.astro','src/pages/methodology/chess-bench.astro','src/pages/methodology/visual-bench.astro','README.md'].map(x=>fs.readFile(x,'utf8')));
 assert.match(home,/LOCKED/);assert.match(home,/progression-gate-label/);assert.match(home,/Not administered: prerequisite level not passed/);assert.match(home,/Active-level coverage/);
 for(const text of [method,chess,visual,readme])assert.match(text,/denominator (?:of )?63|denominator 63|denominator `63`/i);
 assert.match(method,/reserved zero/i);assert.match(chess,/Hydra returned from Active to Locked/);assert.doesNotMatch(chess,/Position ID\s*[#:=-]?\s*\d{1,3}/i);
});
