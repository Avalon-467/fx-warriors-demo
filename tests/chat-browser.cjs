const {chromium}=require('/home/ubuntu/work2/ClawCross/node_modules/playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const recorded=fs.readFileSync('/tmp/fx-chat-real-events.ndjson','utf8').trim().split('\n').map(s=>JSON.parse(s));
 const real=recorded.find(e=>e.type==='result');assert.ok(real?.chart&&real.sources.length,'A successful real chart/search recording is required.');
 const executablePath=process.env.PLAYWRIGHT_CHROME||['/home/ubuntu/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome','/usr/bin/google-chrome','/usr/bin/chromium'].find(p=>fs.existsSync(p));
 const browser=await chromium.launch({...(executablePath?{executablePath}:{}),headless:true,args:['--no-sandbox']});
 try{
 const page=await browser.newPage({viewport:{width:1440,height:1050}}),errors=[],posts=[];let mode='combined';
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/chat',async route=>{
  if(route.request().method()==='GET')return route.fulfill({json:{configured:true,model:real.model,search:{available:true,provider:'Tavily'}}});
  posts.push(route.request().postDataJSON());
  if(mode==='failure')return route.fulfill({status:429,json:{error:'The shared demo usage limit has been reached.'}});
  if(mode==='slow'){await new Promise(resolve=>setTimeout(resolve,1000));return route.fulfill({contentType:'application/x-ndjson',body:JSON.stringify(real)+'\n'}).catch(()=>{});}
  let events=structuredClone(recorded);
  if(mode==='sources'){const final={...structuredClone(real),answer:'For EUR/USD, here are the sources [s1].',chart:null,context:{...real.context,pair:'EUR/USD'},trace:real.trace.filter(t=>t.name==='search_web')};events=[{type:'context',context:final.context},...events.filter(e=>['tool_start','tool_result'].includes(e.type)&&e.name==='search_web'),final];}
  const final=events.find(e=>e.type==='result');final.answer+='\n\n<img src=x onerror=alert(1)>';
  return route.fulfill({contentType:'application/x-ndjson',body:events.map(e=>JSON.stringify(e)).join('\n')+'\n'});
 });
 await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
 await page.waitForFunction(()=>!!document.querySelector('#chat-send')&&!document.querySelector('#chat-send').disabled);
 assert.equal(await page.locator('#view-agent').isVisible(),true);assert.equal(await page.locator('#view-desk').isVisible(),false);
 assert.equal(posts.length,0);assert.equal(await page.locator('#chat-message').isVisible(),true);
 await page.screenshot({path:'/tmp/fx-chat-landing-desktop.png',fullPage:true});
 await page.evaluate(()=>localStorage.setItem('private-budget-check','private tuition amount 987654'));
 await page.locator('#chat-message').fill('Show a USD/SGD chart and search the latest policy sources.');await page.locator('#chat-message').press('Enter');
 await page.waitForSelector('.chat-sources');
 assert.equal(posts.length,1);assert.equal(posts[0].history.length,0);assert.ok(!JSON.stringify(posts[0]).includes('987654'));
 assert.equal(await page.locator('.chat-chart svg').count(),1);assert.equal(await page.locator('.chat-source').count(),real.sources.length);
 assert.equal(await page.locator('.chat-turn-body img').count(),0);assert.ok(await page.locator('.chat-citation').count()>0);
 await page.locator('.chat-chart svg').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('.chat-chart-tooltip').isVisible(),true);
 await page.locator('.chat-turn-body').evaluate(el=>{el.lastElementChild?.textContent.includes('<img')&&el.lastElementChild.remove();});
 await page.screenshot({path:'/tmp/fx-chat-conversation-desktop.png',fullPage:true});
 mode='sources';await page.locator('#chat-message').fill('Now EUR/USD, sources only please.');await page.locator('#chat-send').click();
 await page.waitForFunction(()=>document.querySelectorAll('.chat-turn-sources .chat-sources').length===2);
 assert.equal(posts[1].history.length,2);assert.equal(posts[1].context.base,'USD');
 assert.equal(await page.locator('.chat-turn').nth(1).locator('.chat-turn-chart').isVisible(),false);
 assert.match(await page.locator('.chat-turn').nth(1).locator('.chat-turn-status').textContent(),/EUR\/USD/);
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
 await page.screenshot({path:'/tmp/fx-chat-conversation-mobile.png',fullPage:true});
 mode='failure';await page.locator('#chat-message').fill('Another question');await page.locator('#chat-send').click();await page.waitForSelector('.chat-error');assert.match(await page.locator('.chat-error').last().textContent(),/usage limit/);assert.equal(await page.locator('#chat-send').isEnabled(),true);
 mode='slow';await page.locator('#chat-message').fill('A message to cancel');await page.locator('#chat-send').click();await page.getByRole('button',{name:'Stop response',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.chat-turn:last-child .chat-turn-status').textContent==='Stopped');
 await page.locator('#new-chat').click();assert.equal(await page.locator('.chat-turn').count(),0);assert.equal(await page.locator('#chat-welcome').isVisible(),true);assert.equal(await page.evaluate(()=>localStorage.getItem('private-budget-check')),'private tuition amount 987654');
 await page.screenshot({path:'/tmp/fx-chat-landing-mobile.png',fullPage:true});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);assert.deepEqual(errors,[]);
 console.log('PASS: conversation-first landing, no automatic calls, inline charts/citations, chart keyboard inspection, follow-up history, dynamic source-only responses, privacy, escaping, mobile layouts, limits, cancellation and new chat.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
