import assert from 'node:assert/strict';
import fs from 'node:fs';
import {seriesFor,project,analyse,budget,backtest,businessDates} from '../dist/core.mjs';
const snapshot=JSON.parse(fs.readFileSync(new URL('../dist/rates.json',import.meta.url)));
const series=seriesFor(snapshot.rows,'USD','SGD');
assert.equal(series.length,64);
assert.equal(series.at(-1).date,'2026-11-03');
const inverse=seriesFor(snapshot.rows,'SGD','USD');
for(let i=0;i<series.length;i++)assert.ok(Math.abs(series[i].rate*inverse[i].rate-1)<1e-12);
for(const horizon of [5,10,20]){
 const neutral=project(series,horizon),up=project(series,horizon,35),down=project(series,horizon,-100);
 assert.equal(neutral.points.length,horizon);
 assert.ok(Math.abs(up.last.rate/neutral.last.rate-1.0035)<1e-12);
 assert.ok(Math.abs(down.last.rate/neutral.last.rate-.99)<1e-12);
 for(const p of neutral.points){assert.ok(p.lower<=p.rate&&p.rate<=p.upper);assert.ok(![0,6].includes(new Date(p.date+'T12:00:00Z').getUTCDay()));}
 assert.ok(neutral.points[0].upper-neutral.points[0].lower<neutral.last.upper-neutral.last.lower);
}
assert.deepEqual(businessDates('2026-11-06',2),['2026-11-09','2026-11-10']);
const inputs={amount:1000,mode:'send',spot:1.3,center:1.31,lower:1.2,upper:1.4,percent:1,flat:5};
const sent=budget(inputs);assert.equal(sent.current,1280.5);assert.equal(sent.fees,15);
const needed=budget({...inputs,amount:sent.current,mode:'receive'});assert.ok(Math.abs(needed.current-1000)<1e-10);assert.ok(needed.low<needed.high);
assert.throws(()=>budget({...inputs,amount:-1}));assert.throws(()=>budget({...inputs,amount:10,flat:20}));assert.throws(()=>budget({...inputs,percent:100}));assert.throws(()=>project(series,5,101));
assert.equal(analyse('The Fed signals a rate cut','USD','USD','SGD').bps,-35);
assert.equal(analyse('The Fed signals a rate cut','USD','EUR','USD').bps,35);
assert.equal(analyse('The Fed does not signal a rate cut','USD','USD','SGD').bps,0);
assert.equal(analyse('The Fed signals a rate cut','USD','EUR','GBP').bps,0);
assert.equal(analyse('A neutral headline','USD','USD','SGD').classified,false);
const test=backtest(series,5);assert.equal(test.n,29);assert.ok(test.mae>=0&&test.baseline>=0&&test.coverage>=0&&test.coverage<=1);
const constant=Array.from({length:45},(_,i)=>({date:new Date(Date.UTC(2026,0,i+1)).toISOString().slice(0,10),rate:2}));const zero=backtest(constant,5);assert.equal(zero.mae,0);assert.equal(zero.baseline,0);assert.equal(zero.direction,null);
console.log('PASS: ECB cross-rate consistency; projection intervals; exact scenario impact; weekday dates; send/receive fees; invalid inputs; signal sign/negation; rolling baseline checks.');
