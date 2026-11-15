import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const {chromium}=require('/home/ubuntu/work2/ClawCross/node_modules/playwright');

(async()=>{
 const snapshot=JSON.parse(fs.readFileSync(new URL('../public/rates.json',import.meta.url),'utf8'));
 const series=snapshot.rows.map(r=>({date:r.date,rate:r.rates.SGD/r.rates.USD}));
 const chartEvent={
  pair:'USD/SGD',
  base:'USD',
  quote:'SGD',
  history:series,
  forecast:[
   {date:'2026-11-04',rate:series.at(-1).rate*1.001,lower:series.at(-1).rate*0.996,upper:series.at(-1).rate*1.006},
   {date:'2026-11-05',rate:series.at(-1).rate*1.002,lower:series.at(-1).rate*0.995,upper:series.at(-1).rate*1.009},
  ],
  horizon:5,
  reference_date:series.at(-1).date,
  source:'European Central Bank',
  source_mode:'bundled_reference_snapshot',
 };
 const resultEvent={
  type:'result',
  answer:'美元兑新元目前处于观察区间 [s1]。',
  sources:[{id:'s1',title:'MAS Monetary Policy Statement',url:'https://www.mas.gov.sg/news/monetary-policy',published_at:'2026-10-14',retrieval_mode:'web_search'}],
  follow_ups:['对比不同预测模型'],
  context:{pair:'USD/SGD',horizon_weekdays:10},
  chart:chartEvent,
  model_calls:2,
  notices:['No dedicated SGD central-bank feed is connected in this version.'],
 };

 const executablePath=process.env.PLAYWRIGHT_CHROME||['/home/ubuntu/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome','/usr/bin/google-chrome','/usr/bin/chromium'].find(p=>fs.existsSync(p));
 const browser=await chromium.launch({...(executablePath?{executablePath}:{}),headless:true,args:['--no-sandbox']});
 try{
  const zhCtx=await browser.newContext({locale:'zh-CN',viewport:{width:1440,height:1050}});
  const page=await zhCtx.newPage();
  const errors=[],posts=[];let mode='normal';
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/api/chat',async route=>{
   if(route.request().method()==='GET')return route.fulfill({json:{configured:true,model:'test-model',search:{available:true,provider:'Tavily'}}});
   posts.push(route.request().postDataJSON());
   if(mode==='slow'){await new Promise(r=>setTimeout(r,1000));return route.fulfill({contentType:'application/x-ndjson',body:JSON.stringify(resultEvent)+'\n'}).catch(()=>{});}
   const events=[
    {type:'status',message:'Thinking about your question…'},
    {type:'tool_start',name:'show_fx_chart',arguments:{base:'USD',quote:'SGD'}},
    {type:'tool_result',name:'show_fx_chart',arguments:{base:'USD',quote:'SGD'},result:{ok:true},duration_ms:12},
    {type:'chart',chart:chartEvent},
    resultEvent,
   ];
   return route.fulfill({contentType:'application/x-ndjson',body:events.map(e=>JSON.stringify(e)).join('\n')+'\n'});
  });

  await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>!!document.querySelector('#chat-send')&&!document.querySelector('#chat-send').disabled);

  assert.equal(await page.locator('html').getAttribute('lang'),'zh-CN');
  assert.match(await page.locator('#chat-welcome h1').textContent(),/外汇研究智能助手/);
  assert.match(await page.locator('#lang-toggle').textContent(),/EN/);

  await page.locator('#chat-examples button').first().click();
  await page.waitForSelector('.chat-sources');
  assert.equal(posts[0].locale,'zh');
  assert.match(await page.locator('.chat-chart-heading').textContent(),/历史走势/);
  assert.match(await page.locator('.chat-source').textContent(),/搜索结果摘要/);
  assert.match(await page.locator('.chat-data-notices summary').textContent(),/数据与可用性说明/);

  mode='slow';
  await page.locator('#chat-message').fill('测试取消');
  await page.locator('#chat-send').click();
  await page.getByRole('button',{name:'停止生成',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('.chat-turn:last-child .chat-turn-status').textContent==='已停止');
  mode='normal';

  await page.locator('nav [data-view="desk"]').click();
  await page.waitForFunction(()=>document.querySelector('#spot-rate').textContent!=='—');
  assert.match(await page.locator('#desk-title').textContent(),/预测台/);
  assert.match(await page.locator('#forecast-description').textContent(),/个工作日预计变化/);

  await page.locator('nav [data-view="signals"]').click();
  await page.locator('#headline').fill('美联储释放降息信号');
  await page.locator('#analyse').click();
  assert.equal(await page.locator('#impact-slider').inputValue(),'-35');
  assert.match(await page.locator('#signal-label').textContent(),/USD/);

  await page.locator('nav [data-view="budget"]').click();
  await page.waitForFunction(()=>document.querySelector('#budget-projection').textContent!=='—');
  assert.match(await page.locator('#budget-title').textContent(),/预算规划/);
  await page.locator('#save-budget').click();
  assert.match(await page.locator('.saved-row').textContent(),/加载/);

  await page.locator('nav [data-view="method"]').click();
  assert.match(await page.locator('.raip-card').textContent(),/可解释性与透明性/);
  assert.match(await page.locator('.raip-card').textContent(),/公平性与无障碍访问/);
  assert.match(await page.locator('.raip-card').textContent(),/隐私保护/);

  await page.setViewportSize({width:390,height:844});
  for(const view of ['agent','desk','signals','budget','method']){
   await page.locator('nav [data-view="'+view+'"]').click();
   await page.waitForTimeout(80);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Mobile overflow in zh for '+view);
  }

  await page.locator('#lang-toggle').click();
  assert.equal(await page.locator('html').getAttribute('lang'),'en');
  assert.match(await page.locator('#method-title').textContent(),/Behind the forecast/);
  await page.reload({waitUntil:'networkidle'});
  assert.equal(await page.locator('html').getAttribute('lang'),'en');

  await page.locator('#lang-toggle').click();
  assert.equal(await page.locator('html').getAttribute('lang'),'zh-CN');
  assert.equal(await page.evaluate(()=>localStorage.getItem('fx-warriors-lang-v1')),null);
  assert.deepEqual(errors,[]);
  await zhCtx.close();

  const enCtx=await browser.newContext({locale:'en-US',viewport:{width:1440,height:1050}});
  const enPage=await enCtx.newPage();
  await enPage.route('**/api/chat',async route=>route.fulfill({json:{configured:true,model:'test-model',search:{available:true}}}));
  await enPage.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
  assert.equal(await enPage.locator('html').getAttribute('lang'),'en');
  assert.match(await enPage.locator('#chat-welcome h1').textContent(),/AI for currency research/);
  await enCtx.close();

  console.log('PASS: browser auto-language (zh-CN & en-US), live toggle, Chinese signals/budget/chat/RAIP card, and mobile zero-overflow checks.');
 }finally{
  await browser.close();
 }
})().catch(e=>{console.error(e);process.exit(1);});
