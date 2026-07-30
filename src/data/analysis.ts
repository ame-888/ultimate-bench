import { activeLevels, ARENA_LIST, RESULT_STATUSES, type ArenaDefinition, type ArenaId } from './benchmarkSpec';
import { calculateArenaScore, normalizeResult, type BenchmarkCollections, type BenchmarkRecord } from './scoring';
import type { LeaderboardRow } from './leaderboard';

export type ResultCategory = 'positive'|'zero'|'invalid'|'unavailable'|'not-tested';
export const resultCategory = (value: unknown): ResultCategory => {
  const result=normalizeResult(value);
  if(typeof result==='number') return result>0?'positive':'zero';
  return result===RESULT_STATUSES.INVALID?'invalid':result===RESULT_STATUSES.UNAVAILABLE?'unavailable':'not-tested';
};
export const exploratoryValue=(value:unknown, invalidAsZero=false):number|null=>{
  const result=normalizeResult(value);
  return typeof result==='number'?result:result===RESULT_STATUSES.INVALID&&invalidAsZero?0:null;
};
export function averageRanks(values:number[]):number[]{
  const order=values.map((value,index)=>({value,index})).sort((a,b)=>a.value-b.value); const ranks=Array(values.length);
  for(let i=0;i<order.length;){let end=i+1;while(end<order.length&&order[end].value===order[i].value)end++;const rank=(i+1+end)/2;for(let j=i;j<end;j++)ranks[order[j].index]=rank;i=end} return ranks;
}
export function spearman(x:number[],y:number[]):number|null{
  if(x.length!==y.length||x.length<2)return null;const rx=averageRanks(x),ry=averageRanks(y),mx=mean(rx),my=mean(ry);
  const top=rx.reduce((s,v,i)=>s+(v-mx)*(ry[i]-my),0),dx=Math.sqrt(rx.reduce((s,v)=>s+(v-mx)**2,0)),dy=Math.sqrt(ry.reduce((s,v)=>s+(v-my)**2,0));return dx&&dy?top/(dx*dy):null;
}
const mean=(v:number[])=>v.length?v.reduce((a,b)=>a+b,0)/v.length:0;
export function percentiles(values:number[]):number[]{
  if(!values.length)return []; if(values.length===1)return [0.5]; const ranks=averageRanks(values);return ranks.map(rank=>(rank-1)/(values.length-1));
}
export function failureAnatomy(arena:ArenaDefinition,records:BenchmarkRecord[]){return activeLevels(arena).map(level=>{
  const counts:Record<ResultCategory,number>={'positive':0,'zero':0,'invalid':0,'unavailable':0,'not-tested':0};const numeric:number[]=[];
  records.forEach(record=>{const value=record.scores[level.key];counts[resultCategory(value)]++;if(typeof value==='number')numeric.push(value)});
  return {level,represented:records.length,counts,median:median(numeric),numericCount:numeric.length};
})}
const median=(v:number[])=>{if(!v.length)return null;const s=[...v].sort((a,b)=>a-b),m=Math.floor(s.length/2);return s.length%2?s[m]:(s[m-1]+s[m])/2};
export function pareto(rows:LeaderboardRow[]){return rows.map(row=>{const dominators=rows.filter(other=>other!==row&&ARENA_LIST.every(a=>other.scores[a.id]>=row.scores[a.id])&&ARENA_LIST.some(a=>other.scores[a.id]>row.scores[a.id])).map(x=>x.name);return {...row,dominators,paretoOptimal:dominators.length===0}})}
export function profilePercentiles(rows:LeaderboardRow[]){const byArena=Object.fromEntries(ARENA_LIST.map(a=>[a.id,percentiles(rows.map(r=>r.scores[a.id]))])) as Record<ArenaId,number[]>;return rows.map((row,i)=>({name:row.name,values:Object.fromEntries(ARENA_LIST.map(a=>[a.id,byArena[a.id][i]])) as Record<ArenaId,number>}))}
export function archetypes(rows:LeaderboardRow[],toolSensitive=new Set<string>()){
 const profiles=profilePercentiles(rows),frontier=pareto(rows);return rows.map((row,i)=>{const p=Object.values(profiles[i].values),avg=mean(p),spread=Math.max(...p)-Math.min(...p),labels:string[]=[];
  if(p.every(v=>v>=2/3))labels.push('Broad high-performing'); if(Math.max(...p)>=.8&&spread>=.5)labels.push('Arena specialist'); if(p.every(v=>v<=.33))labels.push('Consistently weak'); if(toolSensitive.has(row.name))labels.push('Tool-sensitive'); labels.push(frontier[i].paretoOptimal?'Pareto-optimal':'Dominated'); return {...row,percentiles:profiles[i].values,percentileMean:avg,percentileSpread:spread,labels};})
}
export function matchedComparisons(benchmarks:BenchmarkCollections){return ARENA_LIST.flatMap(arena=>{const records=benchmarks[arena.dataKey]??[],groups=new Map<string,BenchmarkRecord[]>();records.filter(r=>r.comparison).forEach(r=>groups.set(r.comparison!.group,[...(groups.get(r.comparison!.group)??[]),r]));return [...groups].flatMap(([group,items])=>{const base=items.find(r=>r.comparison!.baseline),variants=items.filter(r=>!r.comparison!.baseline);if(!base)return [];return variants.map(variant=>({arena,group,condition:variant.comparison!.condition,baseline:base.name,comparison:variant.name,canonicalDelta:(calculateArenaScore(arena,variant.scores).score??0)-(calculateArenaScore(arena,base.scores).score??0),levels:activeLevels(arena).map(level=>{const before=normalizeResult(base.scores[level.key]),after=normalizeResult(variant.scores[level.key]);return {level,before,after,delta:typeof before==='number'&&typeof after==='number'?after-before:null,statusRegression:typeof before==='number'&&typeof after!=='number'}})}))})})}
export function flatAverage(record:BenchmarkRecord,arena:ArenaDefinition,invalidAsZero=false){const v=activeLevels(arena).map(l=>exploratoryValue(record.scores[l.key],invalidAsZero)).filter((x):x is number=>x!==null);return v.length?mean(v):null}
export function latestDatasetDate(benchmarks:BenchmarkCollections){const dates=Object.values(benchmarks).flat().map(r=>r.releaseDate).filter((x):x is string=>Boolean(x)).sort();return dates.at(-1)??null}
