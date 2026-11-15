import assert from 'node:assert/strict';
import snapshot from '../public/rates.json' with {type:'json'};
import {detectBrowserLanguage,STRINGS,SCENARIOS_BY_LANG,t,localizeNotice,localizeStatus} from '../public/i18n.mjs';
import {analyse} from '../public/core.mjs';
import {validateChat,runFxChat} from '../lib/fx-chat.mjs';

// 1. Browser language auto-detection across priority lists
assert.equal(detectBrowserLanguage(['zh-CN','en-US']),'zh');
assert.equal(detectBrowserLanguage(['zh-SG','en']),'zh');
assert.equal(detectBrowserLanguage(['zh-TW']),'zh');
assert.equal(detectBrowserLanguage(['zh']),'zh');
assert.equal(detectBrowserLanguage(['en-US','zh-CN']),'en');
assert.equal(detectBrowserLanguage(['en-GB']),'en');
assert.equal(detectBrowserLanguage(['fr-FR','zh-HK']),'zh');
assert.equal(detectBrowserLanguage(['ja-JP','ko-KR']),'en');
assert.equal(detectBrowserLanguage('zh-Hans-CN'),'zh');

// 2. Bilingual dictionary key parity between English and Chinese
function collectKeys(obj,prefix=''){
 const keys=[];
 for(const [k,v] of Object.entries(obj)){
  const path=prefix?prefix+'.'+k:k;
  if(Array.isArray(v))keys.push(path+'['+v.length+']');
  else if(v&&typeof v==='object')keys.push(...collectKeys(v,path));
  else keys.push(path);
 }
 return keys.sort();
}
assert.deepEqual(collectKeys(STRINGS.en),collectKeys(STRINGS.zh));
assert.equal(SCENARIOS_BY_LANG.en.length,SCENARIOS_BY_LANG.zh.length);
assert.ok(t('method.raipTitle',null,'zh').includes('可解释性'));
assert.ok(t('method.raipTitle',null,'en').includes('Explainability'));

// 3. Status and notice localization
assert.equal(localizeStatus('Thinking about your question…','zh'),'正在分析您的问题…');
assert.ok(localizeNotice('No dedicated SGD central-bank feed is connected in this version.','zh').includes('SGD'));

// 4. Chinese keyword & negation support in Signals Lab analyser
assert.equal(analyse('美联储释放降息信号','USD','USD','SGD').bps,-35);
assert.equal(analyse('美国通胀超预期，美联储鹰派加息','USD','USD','SGD').bps,35);
assert.equal(analyse('美联储否认近期会降息','USD','USD','SGD').bps,0);

// 5. Chat locale validation & preferred_ui_language forwarding
assert.equal(validateChat({message:'USD/SGD',context:{base:'USD',quote:'SGD',horizon:10,scenarioBps:0},history:[],locale:'zh'}).locale,'zh');
assert.equal(validateChat({message:'USD/SGD',context:{base:'USD',quote:'SGD',horizon:10,scenarioBps:0},history:[]}).locale,'en');

const requests=[];
const data={...snapshot,source_url:'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist-90d.xml',mode:'test_reference_snapshot'};
const res=await runFxChat(
 {message:'USD/SGD',context:{base:'USD',quote:'SGD',horizon:10,scenarioBps:0},history:[],locale:'zh'},
 {url:'https://model.example/v1',key:'test-secret',model:'test-model'},
 {
  data,
  fetchImpl:async(url,init)=>{
   requests.push(JSON.parse(init.body));
   return Response.json({
    choices:[{message:{role:'assistant',content:null,tool_calls:[{id:'call_1',type:'function',function:{name:'present_fx_answer',arguments:JSON.stringify({answer:'美元兑新元参考汇率概览。',source_ids:[],follow_ups:['查看三个月走势图']})} }]}}],
    usage:{prompt_tokens:10,completion_tokens:10}
   });
  }
 }
);
assert.equal(JSON.parse(requests[0].messages.at(-1).content).preferred_ui_language,'zh-CN');
assert.ok(res.answer.includes('美元兑新元'));

console.log('PASS: browser language detection, EN/ZH key parity, Chinese signal keywords, and chat locale forwarding.');
