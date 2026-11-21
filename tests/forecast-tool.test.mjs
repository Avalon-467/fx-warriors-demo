import assert from 'node:assert/strict';
import snapshot from '../public/rates.json' with {type:'json'};
import {runFxChat} from '../lib/fx-chat.mjs';
import {forecastContext,forecastExtras,meanReversion} from '../lib/fx-tools.mjs';
import {seriesFor} from '../public/core.mjs';

const data={...snapshot,source_url:'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist-90d.xml',mode:'test_reference_snapshot'};
const config={url:'https://model.example/v1',key:'test-secret',model:'test-model'};
const context={base:'USD',quote:'SGD',horizon:10,scenarioBps:0};
const series=seriesFor(data.rows,'USD','SGD');
const base=forecastContext(data,context);
const day=date=>new Date(date+'T12:00:00Z').getUTCDay();

// A no-argument call stays field-identical to the injected trusted context (backward compatible).
assert.deepEqual(forecastExtras(base,data,context,{}),base);
assert.equal(forecastExtras(base,data,context,{}).model_forecast,undefined);

// Unknown models are rejected server-side with an actionable message.
assert.throws(()=>forecastExtras(base,data,context,{model:'magic'}),/Choose a supported model/);

// Each closed-form model matches its formula; intervals are multiplicatively symmetric around the centre.
const noChange=forecastExtras(base,data,context,{model:'no_change'});
assert.equal(noChange.model_forecast.terminal_rate,base.current_reference_rate);
assert.ok(Math.abs(noChange.model_forecast.upper_80/noChange.model_forecast.terminal_rate-noChange.model_forecast.terminal_rate/noChange.model_forecast.lower_80)<1e-12);
const reversion=forecastExtras(base,data,context,{model:'mean_reversion'});
assert.ok(Math.abs(reversion.model_forecast.terminal_rate-meanReversion(series,10))<1e-12);
const ensemble=forecastExtras(base,data,context,{model:'ensemble'});
assert.ok(Math.abs(ensemble.model_forecast.terminal_rate-(base.traditional_model.central_rate+base.current_reference_rate+meanReversion(series,10))/3)<1e-12);
assert.equal(ensemble.model_forecast.components.length,3);
assert.ok(ensemble.model_forecast.weights.startsWith('equal'));

// include_path returns the scenario-free closed-form path; weekdays hold and the endpoint matches the model.
const withPath=forecastExtras(base,data,context,{include_path:true});
assert.equal(withPath.projection_path.points.length,10);
for(const p of withPath.projection_path.points){assert.ok(p.lower_80<=p.rate&&p.rate<=p.upper_80);assert.ok(day(p.date)!==0&&day(p.date)!==6);}
assert.ok(Math.abs(withPath.projection_path.points.at(-1).rate-base.traditional_model.central_rate)<1e-12);

// sensitivity grid: five assumptions, strictly monotone, +50 bps is exactly +0.50%.
const sens=forecastExtras(base,data,context,{sensitivity:true});
const byBps=new Map(sens.sensitivity_grid.rows.map(r=>[r.assumed_terminal_bps,r.terminal_rate]));
assert.equal(sens.sensitivity_grid.rows.length,5);
assert.ok(byBps.get(-100)<byBps.get(-50)&&byBps.get(-50)<byBps.get(0)&&byBps.get(0)<byBps.get(50)&&byBps.get(50)<byBps.get(100));
assert.ok(Math.abs(byBps.get(50)/byBps.get(0)-1.005)<1e-12);

// window_check reproduces the default 20-day drift and 60-day volatility exactly.
const win=forecastExtras(base,data,context,{window_check:true});
assert.deepEqual(win.window_check.windows.map(w=>w.return_observations),[20,40,60]);
assert.ok(Math.abs(win.window_check.windows[0].daily_drift-base.traditional_model.daily_drift)<1e-15);
assert.ok(Math.abs(win.window_check.windows[2].daily_volatility-base.traditional_model.daily_volatility)<1e-15);
assert.equal(typeof win.window_check.drift_sign_consistent,'boolean');

// move_decomposition is additive by construction for any scenario and matches the context rates.
for(const bps of [0,35,-100]){
 const c={...context,scenarioBps:bps},cx=forecastContext(data,c),ex=forecastExtras(cx,data,c,{model:'no_change'}),d=ex.move_decomposition;
 assert.ok(Math.abs(d.total_move-(d.drift_contribution+d.scenario_contribution))<1e-12);
 assert.ok(Math.abs(d.total_move-(cx.user_scenario.central_rate-cx.current_reference_rate))<1e-12);
 if(bps===0)assert.equal(d.scenario_contribution,0);
}
const pct=forecastExtras(base,data,context,{include_path:true}).spot_percentile_90d;
assert.ok(pct.percentile>=0&&pct.percentile<=100&&pct.observations===series.length);

// End-to-end through the agent loop: advertised schema, pair-override bookkeeping, no credential leakage.
const call=(name,args={})=>({id:'call_'+name+'_'+Math.random().toString(36).slice(2),type:'function',function:{name,arguments:JSON.stringify(args)}});
const reply=(...calls)=>({choices:[{message:{role:'assistant',content:null,tool_calls:calls}}],usage:{prompt_tokens:10,completion_tokens:10}});
const answer=()=>call('present_fx_answer',{answer:'A grounded answer.',source_ids:[],follow_ups:[]});
function fixture(responses){const requests=[];return {requests,fetchImpl:async(url,init)=>{if(url==='https://model.example/v1/chat/completions'){requests.push(JSON.parse(init.body));return Response.json(responses.shift());}throw new Error('Unexpected network target '+url);}};}
{
 const f=fixture([reply(call('get_traditional_forecast',{base:'EUR',quote:'JPY',model:'ensemble',sensitivity:true})),reply(answer())]);
 const result=await runFxChat({message:'Show an equal-weight ensemble projection with sensitivity.',context,history:[]},config,{...f,data});
 assert.equal(result.trace[0].name,'get_traditional_forecast');
 assert.equal(result.trace[0].result.model_forecast.model,'ensemble');
 assert.equal(result.trace[0].result.sensitivity_grid.rows.length,5);
 assert.deepEqual(result.trace[0].result.changed_keys,['base','quote']);
 assert.equal(result.trace[0].result.changed_from.base,'USD');
 assert.equal(result.context.pair,'EUR/JPY');
 const advertised=f.requests[0].tools.find(t=>t.function.name==='get_traditional_forecast').function.parameters;
 assert.deepEqual(advertised.properties.model.enum,['shrunk_drift','no_change','mean_reversion','ensemble']);
 assert.equal(advertised.properties.include_path.type,'boolean');
 assert.ok(!JSON.stringify(result).includes('test-secret'));
}
{
 const f=fixture([reply(call('get_traditional_forecast',{model:'magic'})),reply(call('get_traditional_forecast',{model:'no_change'})),reply(answer())]);
 const result=await runFxChat({message:'Show the no-change projection for this pair.',context,history:[]},config,{...f,data});
 assert.ok(/Choose a supported model/.test(result.trace[0].result.error));
 assert.equal(result.trace[1].result.model_forecast.model,'no_change');
 assert.equal(result.trace[1].result.changed_from,undefined);
 assert.equal(result.model_calls,3);
}
console.log('PASS: model selection (no_change/mean_reversion/ensemble), projection path, exact sensitivity grid, window consistency, additive move decomposition, spot percentile, changed_from bookkeeping and schema/error recovery.');
