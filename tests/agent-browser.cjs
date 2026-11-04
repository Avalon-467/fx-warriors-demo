const {chromium}=require('/home/ubuntu/work2/ClawCross/node_modules/playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const events=fs.readFileSync('/tmp/fx-real-agent-events.ndjson','utf8').trim().split('\n').map(s=>JSON.parse(s));
 const result=events.find(e=>e.type==='result');assert.ok(result,'A successful real agent recording is required.');
 result.report.headline+=' <img src=x onerror=alert(1)>';
 const browser=await chromium.launch({executablePath:'/home/ubuntu/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',headless:true,args:['--no-sandbox']});
 try{
 const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[],posts=[];let fail=false;
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/agent',async route=>{
  if(route.request().method()==='GET')return route.fulfill({json:{configured:true,model:result.model}});
  posts.push(route.request().postDataJSON());
  return route.fulfill({status:fail?429:200,contentType:fail?'application/json':'application/x-ndjson',body:fail?JSON.stringify({error:'The shared demo usage limit has been reached.'}):events.map(e=>JSON.stringify(e)).join('\n')+'\n'});
 });
 await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
 await page.waitForFunction(()=>document.querySelector('#spot-rate').textContent!=='—');
 await page.locator('[data-days="10"]').click();
 await page.locator('nav [data-view="budget"]').click();await page.locator('#budget-name').fill('Private test budget');await page.locator('#budget-amount').fill('987654');await page.locator('#save-budget').click();
 await page.locator('nav [data-view="agent"]').click();
 assert.equal(posts.length,0,'LLM must not run automatically.');
 await page.locator('#run-agent').click();
 await page.waitForFunction(()=>document.querySelector('#agent-progress').textContent==='Complete');
 assert.equal(posts.length,1);assert.equal(posts[0].horizon,10);
 assert.equal(JSON.stringify(posts).includes('987654'),false);assert.equal(JSON.stringify(posts).includes('Private test budget'),false);
 assert.equal(await page.locator('.agent-tool-detail').count(),result.trace.length);
 assert.equal(await page.locator('.agent-source-list>a').count(),result.sources.length);
 assert.equal(await page.locator('#agent-report img').count(),0,'Model content must be rendered as text.');
 assert.ok((await page.locator('#agent-report').textContent()).includes('4 model calls'));
 await page.screenshot({path:'/tmp/fx-agent-desktop.png',fullPage:true});
 await page.locator('nav [data-view="desk"]').click();await page.locator('[data-days="20"]').click();await page.locator('nav [data-view="agent"]').click();
 assert.equal(await page.locator('#agent-progress').textContent(),'Previous inputs');
 fail=true;await page.locator('#run-agent').click();await page.waitForFunction(()=>document.querySelector('#agent-error').textContent.includes('usage limit'));
 assert.equal(await page.locator('#run-agent').isEnabled(),true);
 await page.setViewportSize({width:390,height:844});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Mobile agent layout overflows.');
 await page.screenshot({path:'/tmp/fx-agent-mobile.png',fullPage:true});
 assert.deepEqual(errors,[]);
 console.log('PASS: real-response rendering, tool traces/citations, no automatic calls, private budgets excluded, XSS escaping, stale-input notice, provider failure and mobile layout.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
