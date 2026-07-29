import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
const bundle = `/tmp/ultimate-bench-scoring-${process.pid}.mjs`;
execFileSync('node_modules/.bin/esbuild', ['test/scoring-api.ts', '--bundle', '--platform=node', '--format=esm', `--outfile=${bundle}`]);
const api = await import(pathToFileURL(bundle));
const { ARENAS, ARENA_LIST, LEVEL_STATUSES, progressiveWeight, activeLevels, calculateArenaScore, calculateOverall, assignTiedRanks, exploratorySort, qualifiesGlobally, validateArenaDefinition, validateBenchmarkRecords, buildLeaderboard, benchmarks, validatePricing, createParetoChartDomain } = api;


const visualScores = { lvl1:86,lvl2:71,lvl3:65,lvl4:25,lvl5:0 };
test('universal progressive weights are generated as 2^(level - 1)',()=>assert.deepEqual([1,2,3,4,5,6].map(progressiveWeight),[1,2,4,8,16,32]));
test('invalid level numbers fail',()=>assert.throws(()=>progressiveWeight(0),/positive integer/));
test('ordinary progressively weighted aggregation retains full precision',()=>assert.equal(calculateArenaScore(ARENAS.visual,visualScores).score,688/31));
test('numeric zero is included with full weight',()=>{const r=calculateArenaScore(ARENAS.visual,{lvl1:0,lvl2:0,lvl3:0,lvl4:0,lvl5:0});assert.equal(r.denominator,31);assert.equal(r.included,5);assert.equal(r.score,0)});
test('INVALID contributes zero and retains weight',()=>{const r=calculateArenaScore(ARENAS.dataRetrieval,{worm:10,koala:'INVALID',crow:10,octopus:10});assert.equal(r.score,130/15);assert.equal(r.denominator,15)});
test('UNAVAILABLE and NOT_TESTED are excluded with reduced coverage',()=>{const r=calculateArenaScore(ARENAS.dataRetrieval,{worm:10,koala:'UNAVAILABLE',crow:10,octopus:'NOT_TESTED'});assert.equal(r.score,10);assert.equal(r.denominator,5);assert.equal(r.coverage,'2/4 active levels');assert.equal(r.weightCoverage,'5/15 active weight');assert.equal(r.rankEligible,false)});
test('missing active result fails validation',()=>assert.throws(()=>calculateArenaScore(ARENAS.dataRetrieval,{worm:1,koala:2,crow:3}),/Octopus result is missing/));
test('unknown result status fails validation',()=>assert.throws(()=>calculateArenaScore(ARENAS.dataRetrieval,{worm:1,koala:2,crow:3,octopus:'PENDING'}),/Unknown or invalid/));
test('planned and locked levels are excluded',()=>{const arena={name:'Test',levels:[{number:1,key:'a',name:'A',status:'Active',weight:1},{number:2,key:'b',name:'B',status:'Planned',weight:2},{number:3,key:'c',name:'C',status:'Locked',weight:4,unlockCondition:'A reaches 75'}]};const r=calculateArenaScore(arena,{a:50});assert.equal(r.score,50);assert.equal(r.denominator,1)});
test('locked definition requires explicit condition',()=>assert.throws(()=>validateArenaDefinition({name:'Test',levels:[{number:1,key:'a',name:'A',status:LEVEL_STATUSES.LOCKED,weight:1}]}),/without an unlock condition/));
test('planned result is rejected by record validation',()=>{const copy={models:[{name:'x',scores:{lvl1:1,lvl2:1,lvl3:1,lvl4:1,lvl5:1,lvl6:1}}],dataRetrieval:[],chessModels:[]};assert.throws(()=>validateBenchmarkRecords(copy),/Planned but x has a published result/)});
test('arena active structures are Visual 1–5, Data Retrieval 1–4, Chess 1–5',()=>assert.deepEqual(ARENA_LIST.map(a=>activeLevels(a).map(l=>l.number)),[[1,2,3,4,5],[1,2,3,4],[1,2,3,4,5]]));
test('Overall is exact arithmetic mean of three canonical arenas',()=>assert.equal(calculateOverall([688/31,311/15,469/31]),(688/31+311/15+469/31)/3));
test('Overall rejects incomplete inputs',()=>assert.throws(()=>calculateOverall([1,2]),/three computable/));
test('ties share a rank and stable order is not a performance tie-break',()=>assert.deepEqual(assignTiedRanks([{name:'B',score:5},{name:'A',score:5},{name:'C',score:4}]).map(x=>[x.name,x.rank]),[['A',1],['B',1],['C',3]]));
test('cost is absent from and cannot affect canonical score or rank',()=>{const a=assignTiedRanks([{name:'A',score:10,cost:100},{name:'B',score:9,cost:1}]);assert.deepEqual(a.map(x=>x.name),['A','B'])});
test('exploratory sorting does not mutate rows or canonical values',()=>{const rows=[{name:'A',score:1,flat:9},{name:'B',score:2,flat:1}];const sorted=exploratorySort(rows,(a,b)=>b.flat-a.flat);assert.notEqual(sorted,rows);assert.deepEqual(rows.map(x=>x.score),[1,2])});
test('GPT-5.6 Sol worked example matches all canonical values',()=>{const built=buildLeaderboard(benchmarks);const row=built.rows.find(x=>x.name==='GPT-5.6 Sol (high)');assert.equal(row.scores.visual,688/31);assert.equal(row.scores['data-retrieval'],311/15);assert.equal(row.scores.chess,469/31);assert.equal(row.score,(688/31+311/15+469/31)/3)});
test('global qualification requires rank eligibility in every arena',()=>{const eligible={rankEligible:true};assert.equal(qualifiesGlobally(Object.fromEntries(ARENA_LIST.map(a=>[a.id,eligible]))),true);const provisional={rankEligible:false};assert.equal(qualifiesGlobally(Object.fromEntries(ARENA_LIST.map(a=>[a.id,a.id==='visual'?provisional:eligible]))),false)});
test('all published benchmark records pass canonical validation',()=>assert.equal(validateBenchmarkRecords(benchmarks),true));
test('homepage exploratory sorting clones records and official mode is default', async()=>{const fs=await import('node:fs/promises');const [script,page]=await Promise.all([fs.readFile('src/scripts/home-page.js','utf8'),fs.readFile('src/pages/index.astro','utf8')]);assert.match(script,/rawList\.map\(item => \(\{ \.\.\.item \}\)\)/);assert.match(script,/method === 'canonical'/);assert.equal((page.match(/<option value="canonical">Progressive Level Weighting \(official\)<\/option>/g)||[]).length,3)});

test('duplicate names fail with arena, model, and conflicting indexes',()=>{const copy=structuredClone(benchmarks);copy.dataRetrieval.push(structuredClone(copy.dataRetrieval[3]));assert.throws(()=>validateBenchmarkRecords(copy),/Data Retrieval Bench contains duplicate model "GPT-5\.5 Instant \(0529\)" at record indexes 3 and 18/)});
test('production data has no duplicate names in any arena',()=>ARENA_LIST.forEach(arena=>{const names=benchmarks[arena.dataKey].map(x=>x.name);assert.equal(new Set(names).size,names.length)}));
test('canonical leaderboard contains no silent deduplication path',async()=>{const source=await (await import('node:fs/promises')).readFile('src/data/leaderboard.ts','utf8');assert.doesNotMatch(source,/uniqueRecords|new Map\(records/)});
test('qualified unpriced fixture remains canonical and cannot change existing ranks',()=>{const copy=structuredClone(benchmarks);const name='Qualified Without Pricing';for(const arena of ARENA_LIST){const template=copy[arena.dataKey][0];copy[arena.dataKey].push({...structuredClone(template),name})}const before=buildLeaderboard(benchmarks),after=buildLeaderboard(copy);assert.ok(after.rows.some(row=>row.name===name));assert.equal(after.rows.length,15);for(const row of before.rows){const next=after.rows.find(x=>x.name===row.name);assert.equal(next.score,row.score)}assert.equal(validatePricing(undefined).valid,false)});
test('pricing requires finite non-negative components and positive blended cost',()=>{assert.equal(validatePricing({input:1,output:2}).valid,true);for(const pricing of [{input:0,output:0},{input:-1,output:2},{input:1,output:-2},{input:NaN,output:1},{input:Infinity,output:1},{input:1,output:-Infinity}])assert.equal(validatePricing(pricing).valid,false)});
test('Pareto domains handle empty, one-point, equal-cost, and same-power inputs finitely',()=>{for(const costs of [[],[2],[2,2],[2,3,8]]){const domain=createParetoChartDomain(costs);for(const cost of costs.length?costs:[1])assert.ok(Number.isFinite(domain.x(cost)));assert.ok(domain.maxPower>domain.minPower)}});
test('homepage uses canonical arena rows and separates canonical from priced models',async()=>{const page=await (await import('node:fs/promises')).readFile('src/pages/index.astro','utf8');assert.doesNotMatch(page,/computeGlobalScores|visualGlobalList|dataGlobalList|chessGlobalList/);assert.match(page,/canonicalModels = canonicalLeaderboard\.rows/);assert.match(page,/pricedModels = canonicalModels\.flatMap/);assert.match(page,/visualArenaRows\.map|dataArenaRows\.map|chessArenaRows\.map/)});
test('official client mode consumes server metadata without recomputing weights',async()=>{const script=await (await import('node:fs/promises')).readFile('src/scripts/home-page.js','utf8');assert.doesNotMatch(script,/2 \*\*|Math\.pow\s*\(/);assert.match(script,/return item\.canonicalScore/);assert.match(script,/rank: item\.canonicalRank/);assert.match(script,/rawList\.map\(item => \(\{ \.\.\.item \}\)\)/)});
test('cookie dialog exposes modal labels and focus management hooks',async()=>{const source=await (await import('node:fs/promises')).readFile('src/components/CookieBanner.astro','utf8');assert.match(source,/role="region" aria-labelledby="cookie-notice-title"/);assert.match(source,/role="dialog" aria-modal="true" aria-labelledby="cookie-dialog-title"/);assert.match(source,/event\.key!=='Tab'/);assert.match(source,/event\.key==='Escape'/);assert.match(source,/lastOpener\.focus/)});
test('global canonical standings use native table semantics and sortable metadata',async()=>{const page=await (await import('node:fs/promises')).readFile('src/pages/index.astro','utf8');for(const token of ['<table','<caption','<thead','<tbody','<th scope="col"','<th scope="row"','<td'])assert.match(page,new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));const script=await (await import('node:fs/promises')).readFile('src/scripts/home-page.js','utf8');assert.match(script,/setAttribute\('aria-sort', ascending \? 'ascending' : 'descending'\)/)});
test('tooltip controls have contextual names and stable relationships',async()=>{const page=await (await import('node:fs/promises')).readFile('src/pages/index.astro','utf8');assert.doesNotMatch(page,/aria-label="Show explanation"/);assert.match(page,/Show Mole Level 1 explanation/);assert.match(page,/Show Data Retrieval Crow Level 3 explanation/);assert.match(page,/Show Chess Python Level 5 explanation/);assert.match(page,/aria-controls="tooltip-explanation-/)});

test('every Active Visual level has one complete, anchored public protocol',async()=>{
  const page=await (await import('node:fs/promises')).readFile('src/pages/methodology/visual-bench.astro','utf8');
  for(const level of activeLevels(ARENAS.visual)){
    const anchor=`level-${level.number}-${level.name.toLowerCase()}`;
    assert.equal((page.match(new RegExp(`id="${anchor}"`,'g'))||[]).length,1,`${level.name} must have one stable protocol anchor`);
    const article=page.match(new RegExp(`<article id="${anchor}"[\\s\\S]*?</article>`))?.[0];
    assert.ok(article,`${level.name} protocol article is missing`);
    for(const marker of [`<h2 id="${anchor}-title">${level.name}</h2>`,'<h3>Task</h3>','<h3>Administration and scoring</h3>','<h3>Interpretation and limitations</h3>']) assert.match(article,new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
    assert.match(page,new RegExp(`anchor: '${anchor}'`));
  }
  assert.equal((page.match(/data-visual-protocol=/g)||[]).length,5);
  assert.match(page,/href={`#\${protocol\.anchor}`}/);
  assert.match(page,/id="level-6-beholder"[\s\S]*data-level-status="Planned"/);
  assert.doesNotMatch(page,/data-visual-protocol="6"/);
});

test('Visual methodology weights and denominator derive from canonical configuration',async()=>{
  const page=await (await import('node:fs/promises')).readFile('src/pages/methodology/visual-bench.astro','utf8');
  const levels=activeLevels(ARENAS.visual);
  assert.deepEqual(levels.map(level=>level.weight),[1,2,4,8,16]);
  assert.equal(levels.reduce((sum,level)=>sum+level.weight,0),31);
  assert.match(page,/visualLevels\.map\(level =>/);
  assert.match(page,/data-complete-weight={fullWeight}/);
  assert.match(page,/16×Eagle\) \/ 31/);
});

test('Visual public copy states repeated-item and product-interface boundaries consistently',async()=>{
  const fs=await import('node:fs/promises');
  const methodology=await fs.readFile('src/pages/methodology/visual-bench.astro','utf8');
  const home=await fs.readFile('src/pages/index.astro','utf8');
  assert.match(methodology,/not 100 independent (?:test )?items/);
  assert.match(methodology,/fresh, isolated conversation/);
  assert.match(methodology,/accessible product configuration/);
  assert.match(methodology,/active test contents remain confidential|remain confidential/);
  assert.match(home,/not 100 independent items/);
  assert.doesNotMatch(home,/randomly mixed|increasingly difficult scenarios|measure the visual capabilities of an AI model/i);
});

test('Visual methodology exposes no stimulus links and private records cannot enter the public source tree',async()=>{
  const fs=await import('node:fs/promises');
  const page=await fs.readFile('src/pages/methodology/visual-bench.astro','utf8');
  assert.doesNotMatch(page,/<(?:img|source)\b|(?:src|href)=["'][^"']+\.(?:png|jpe?g|webp|gif|avif|json)/i);
  const walk=async dir=>(await fs.readdir(dir,{withFileTypes:true})).flatMap(entry=>entry.isDirectory()?[]:[`${dir}/${entry.name}`]);
  for(const root of ['src','public']){
    const pending=[root];
    while(pending.length){const dir=pending.pop();for(const entry of await fs.readdir(dir,{withFileTypes:true})){const path=`${dir}/${entry.name}`;if(entry.isDirectory())pending.push(path);else assert.doesNotMatch(path,/private[\\/](?:evaluations|stimuli)|visual[-_](?:stimulus|answer[-_]?key)/i)}}
  }
  const ignore=await fs.readFile('.gitignore','utf8');
  assert.match(ignore,/private\/evaluations\//);assert.match(ignore,/private\/stimuli\//);
});


test('complete numeric coverage exposes full canonical metadata and eligibility',()=>{const r=calculateArenaScore(ARENAS.dataRetrieval,{worm:1,koala:2,crow:3,octopus:4});assert.deepEqual({fullDenominator:r.fullDenominator,included:r.included,active:r.active,weightedCoverage:r.weightedCoverage,completeCoverage:r.completeCoverage,rankEligible:r.rankEligible,coverage:r.coverage,weightCoverage:r.weightCoverage},{fullDenominator:15,included:4,active:4,weightedCoverage:1,completeCoverage:true,rankEligible:true,coverage:'4/4 active levels',weightCoverage:'15/15 active weight'})});
test('zero and INVALID both complete coverage and retain full denominator',()=>{for(const value of [0,'INVALID']){const r=calculateArenaScore(ARENAS.dataRetrieval,{worm:value,koala:2,crow:3,octopus:4});assert.equal(r.denominator,15);assert.equal(r.completeCoverage,true);assert.equal(r.rankEligible,true)}});
test('UNAVAILABLE and NOT_TESTED each make a computable score provisional',()=>{for(const status of ['UNAVAILABLE','NOT_TESTED']){const r=calculateArenaScore(ARENAS.dataRetrieval,{worm:1,koala:2,crow:3,octopus:status});assert.notEqual(r.score,null);assert.equal(r.completeCoverage,false);assert.equal(r.rankEligible,false)}});
test('multiple excluded levels are computable but provisional while no included levels are null',()=>{const partial=calculateArenaScore(ARENAS.dataRetrieval,{worm:24,koala:'UNAVAILABLE',crow:'NOT_TESTED',octopus:'UNAVAILABLE'});assert.equal(partial.score,24);assert.equal(partial.rankEligible,false);const none=calculateArenaScore(ARENAS.dataRetrieval,{worm:'UNAVAILABLE',koala:'NOT_TESTED',crow:'UNAVAILABLE',octopus:'NOT_TESTED'});assert.equal(none.score,null);assert.equal(none.computable,false);assert.equal(none.rankEligible,false)});
test('planned levels have no effect on complete Active coverage',()=>{const r=calculateArenaScore({name:'Test',levels:[{number:1,key:'a',name:'A',status:'Active',weight:1},{number:2,key:'b',name:'B',status:'Planned',weight:2}]},{a:7});assert.equal(r.completeCoverage,true);assert.equal(r.fullDenominator,1)});
test('arena ranks exclude provisional rows and preserve competition ties',()=>{const fixture={models:[{name:'A',scores:{lvl1:10,lvl2:10,lvl3:10,lvl4:10,lvl5:10}},{name:'B',scores:{lvl1:9,lvl2:9,lvl3:9,lvl4:9,lvl5:9}},{name:'C',scores:{lvl1:9,lvl2:9,lvl3:9,lvl4:9,lvl5:9}},{name:'D',scores:{lvl1:8,lvl2:8,lvl3:8,lvl4:8,lvl5:8}},{name:'P',scores:{lvl1:99,lvl2:'UNAVAILABLE',lvl3:99,lvl4:99,lvl5:99}}]};const rows=api.buildArenaRows(fixture,ARENAS.visual);assert.deepEqual(rows.map(r=>[r.name,r.rank]),[['A',1],['B',2],['C',2],['D',4],['P',null]])});
test('provisional presentation order uses coverage weight, included count, score, then name',()=>{const fixture={dataRetrieval:[{name:'Low weight',scores:{worm:99,koala:'UNAVAILABLE',crow:'UNAVAILABLE',octopus:'UNAVAILABLE'}},{name:'Zed',scores:{worm:9,koala:9,crow:'UNAVAILABLE',octopus:9}},{name:'Alpha',scores:{worm:10,koala:10,crow:'UNAVAILABLE',octopus:10}},{name:'More included',scores:{worm:20,koala:20,crow:20,octopus:'UNAVAILABLE'}}]};assert.deepEqual(api.buildArenaRows(fixture,ARENAS.dataRetrieval).map(r=>r.name),['Alpha','Zed','More included','Low weight'])});
test('current Data leader correction preserves scores and Overall population',()=>{const built=buildLeaderboard(benchmarks);const grok=built.arenaRows['data-retrieval'].find(r=>r.name==='Grok 4.20 Expert');const sol=built.arenaRows['data-retrieval'].find(r=>r.name==='GPT-5.6 Sol (high)');assert.equal(grok.score,24);assert.equal(grok.rank,null);assert.equal(grok.canonical.coverage,'1/4 active levels');assert.equal(grok.canonical.weightCoverage,'1/15 active weight');assert.equal(sol.score,311/15);assert.equal(sol.rank,1);assert.equal(built.arenaLeaders['data-retrieval'].name,'GPT-5.6 Sol (high)');assert.equal(built.rows.length,14);assert.equal(built.rows.some(r=>r.name==='Grok 4.20 Expert'),false)});
test('client sorting preserves canonical null ranks in official and exploratory modes',async()=>{const script=await (await import('node:fs/promises')).readFile('src/scripts/home-page.js','utf8');assert.match(script,/rank: item\.canonicalRank/);assert.match(script,/provisional rows stay unranked/);assert.doesNotMatch(script,/item\.rank = currentRank/)});
test('achievements consume canonical server-generated rank-eligible leaders',async()=>{const [page,script]=await Promise.all([(await import('node:fs/promises')).readFile('src/pages/index.astro','utf8'),(await import('node:fs/promises')).readFile('src/scripts/home-page.js','utf8')]);assert.match(page,/canonicalLeaderboard\.arenaLeaders\['data-retrieval'\]/);assert.match(script,/canonicalLeaders\?\.data/)});
