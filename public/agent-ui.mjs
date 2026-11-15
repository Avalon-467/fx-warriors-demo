import {mountChatChart} from './chat-chart.mjs';
import {t,getLang,STRINGS,formatDateLong,localizeNotice,localizeStatus} from './i18n.mjs';

export function mountAgent({getContext,icon,esc,toast}){
 const $=selector=>document.querySelector(selector);
 let config=null,running=null,history=[],current={base:'USD',quote:'SGD',horizon:10,scenarioBps:0},statusMode='connecting';
 const toolLabel=name=>t('chat.toolLabels.'+name)===('chat.toolLabels.'+name)?name:t('chat.toolLabels.'+name);

 const nav=document.createElement('a');
 nav.href='#agent';nav.className='nav-link';nav.dataset.view='agent';
 nav.innerHTML='<i>'+icon('spark')+'</i><span></span><span class="chat-nav-dot"></span>';
 $('.sidebar nav').prepend(nav);

 const section=document.createElement('section');
 section.id='view-agent';section.className='view chat-view';section.hidden=true;
 section.innerHTML=`<div class="chat-toolbar"><span><i class="chat-status-dot"></i><span id="chat-status"></span></span><button id="new-chat" class="chat-new" type="button"><span>＋</span> <b></b></button></div>
 <div class="chat-welcome" id="chat-welcome"><div class="chat-welcome-symbol">${icon('spark')}</div><div class="eyebrow"></div><h1></h1><p></p></div>
 <div class="chat-messages" id="chat-messages" role="log" aria-live="polite"></div>
 <div class="chat-composer-wrap"><form id="chat-form" class="chat-composer"><label for="chat-message" class="chat-sr-only"></label><textarea id="chat-message" maxlength="2000" rows="2" aria-describedby="chat-privacy"></textarea><div class="chat-composer-bottom"><span class="chat-search-status">${icon('globe')} <span class="chat-search-label"></span> <b></b></span><div class="chat-send-area"><span class="chat-key-hint"></span><button id="chat-send" type="button" disabled>${icon('arrow')}</button></div></div></form><p class="chat-privacy" id="chat-privacy"></p></div>
 <div class="chat-examples" id="chat-examples"></div>
 <div class="chat-supported" id="chat-supported"><span>USD</span><span>SGD</span><span>EUR</span><span>GBP</span><span>CNY</span><span>JPY</span><small></small></div>`;
 $('#content').insertBefore(section,$('footer'));

 const teaser=document.createElement('div');
 teaser.className='chat-desk-teaser';
 teaser.innerHTML='<div>'+icon('spark')+'<span></span></div><a class="button secondary" href="#agent"></a>';
 $('.watchlist').after(teaser);

 const ask=document.createElement('button');
 ask.id='ask-agent-headline';ask.className='button secondary full-width';ask.type='button';
 $('.lab-options').after(ask);
 ask.onclick=()=>{const headline=$('#headline').value.trim();$('#chat-message').value=t('signals.researchPromptPrefix')+headline;location.hash='agent';$('#chat-message').focus();};

 const safeUrl=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.toString():null;}catch{return null;}};
 function richText(value,sources){const map=new Map(sources.map((s,i)=>[s.id,{...s,index:i+1}]));return esc(value).replace(/\*\*([^*\n]+)\*\*/g,'<strong>$1</strong>').replace(/\[(s\d+)\]/g,(match,id)=>{const s=map.get(id),url=s&&safeUrl(s.url);return url?'<a class="chat-citation" href="'+esc(url)+'" target="_blank" rel="noopener noreferrer" title="'+esc(s.title)+'">'+s.index+'</a>':'';}).split(/\n\s*\n/).map(p=>'<p>'+p.replace(/\n/g,'<br>')+'</p>').join('');}
 function sourcesHtml(sources){if(!sources.length)return '';return '<div class="chat-sources"><div class="chat-section-label">'+icon('globe')+' '+esc(t('chat.sourcesHeading'))+' <span>'+sources.length+'</span></div><div class="chat-source-grid">'+sources.map((s,i)=>{const url=safeUrl(s.url);if(!url)return '';const domain=new URL(url).hostname.replace(/^www\./,''),published=formatDateLong(s.published_at),scope=s.retrieval_mode==='page_excerpt'?t('chat.scopePage'):s.retrieval_mode==='web_search'?t('chat.scopeSearch'):s.retrieval_mode==='dated_official_snapshot'?t('chat.scopeCachedRss'):t('chat.scopeRss');return '<a href="'+esc(url)+'" class="chat-source" target="_blank" rel="noopener noreferrer"><div><span class="chat-source-number">'+(i+1)+'</span><span>'+esc(domain)+'</span><b>↗</b></div><strong>'+esc(s.title)+'</strong><small>'+esc(scope)+(published?' · '+esc(published):' · '+esc(t('chat.pubDateUnavailable')))+'</small></a>';}).join('')+'</div></div>';}
 function scrollTurn(turn){turn.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}

 function renderStatusLine(){
  const statusEl=$('#chat-status');
  if(statusMode==='configured'){statusEl.textContent=t('chat.configuredStatus');statusEl.title=config?.model||'';}
  else if(statusMode==='unconfigured'){statusEl.textContent=t('chat.unconfiguredStatus');statusEl.title='';}
  else if(statusMode==='failed'){statusEl.textContent=t('chat.connectionFailed');statusEl.title='';}
  else {statusEl.textContent=t('chat.connecting');statusEl.title='';}
 }

 function setBusy(busy){
  const btn=$('#chat-send');
  btn.disabled=!config?.configured;
  btn.classList.toggle('is-stop',busy);
  btn.setAttribute('aria-label',busy?t('chat.stopAria'):t('chat.sendAria'));
  btn.innerHTML=busy?'<span class="chat-stop-square"></span>':icon('arrow');
  $('#chat-message').setAttribute('aria-busy',String(busy));
 }

 function renderExamples(){
  const examples=STRINGS[getLang()==='zh'?'zh':'en'].chat.examples;
  const container=$('#chat-examples');
  container.innerHTML=examples.map(ex=>`<button type="button" data-prompt="${esc(ex.prompt)}"><i>${icon(ex.icon)}</i><strong>${esc(ex.title)}</strong><span>${esc(ex.subtitle)}</span><b>↗</b></button>`).join('');
  for(const button of container.querySelectorAll('[data-prompt]'))button.onclick=()=>send(button.dataset.prompt);
 }

 function refreshChrome(){
  nav.setAttribute('aria-label',t('nav.agent'));
  nav.querySelector('span:not(.chat-nav-dot)').textContent=t('nav.agent');
  section.setAttribute('aria-label',t('chat.sectionAria'));
  renderStatusLine();
  $('#new-chat b').textContent=t('chat.newChat');
  $('#chat-welcome .eyebrow').textContent=t('chat.eyebrow');
  $('#chat-welcome h1').innerHTML=t('chat.welcomeH1');
  $('#chat-welcome p').innerHTML=t('chat.welcomeSub');
  $('#chat-messages').setAttribute('aria-label',t('nav.agent'));
  section.querySelector('label[for="chat-message"]').textContent=t('chat.inputSrLabel');
  $('#chat-message').placeholder=t('chat.placeholder');
  section.querySelector('.chat-search-label').textContent=t('chat.webSearchLabel');
  section.querySelector('.chat-search-status b').textContent=t('chat.webSearchAuto');
  section.querySelector('.chat-key-hint').textContent=t('chat.keyHint');
  $('#chat-privacy').textContent=t('chat.privacy');
  $('#chat-supported small').textContent=t('chat.supportedNote');
  setBusy(!!running);
  renderExamples();

  teaser.querySelector('span').textContent=t('desk.teaserQuestion');
  teaser.querySelector('a').innerHTML=esc(t('desk.teaserAction'))+' '+icon('arrow');
  ask.innerHTML=icon('spark')+' '+esc(t('signals.researchHeadlineBtn'));
  $('#analyse').innerHTML=icon('spark')+' '+esc(t('signals.analyseBtn'));
  $('.sources-card .muted').textContent=t('signals.sourcesSubtitle');
  $('.method-intro>p').textContent=t('method.introBody');

  const methodCards=[...document.querySelectorAll('.method-grid article')];
  if(methodCards[2]){
   methodCards[2].innerHTML='<i>'+icon('globe')+'</i><h2>'+esc(t('method.card3Title'))+'</h2><p>'+esc(t('method.card3P1'))+'</p><p>'+esc(t('method.card3P2'))+'</p><a class="text-link" href="#agent">'+esc(t('method.card3Link'))+'</a>';
  }
  if(methodCards[3]){
   const p4=methodCards[3].querySelectorAll('p');
   if(p4[1])p4[1].textContent=t('method.card4P2');
  }
  $('.project-tag small').textContent=t('projectTagSub');
 }

 function renderTurnLabels(turn){
  const meta=turn._fxTurn;
  if(!meta)return;
  turn.querySelector('.chat-user > span').textContent=t('chat.you');
  turn.querySelector('.chat-activity > summary > span').textContent=t('chat.activityTitle');
  const statusEl=turn.querySelector('.chat-turn-status');
  const countEl=turn.querySelector('.chat-tool-count');
  if(meta.state==='stopped'){
   statusEl.textContent=t('chat.stoppedStatus');
   const errEl=turn.querySelector('.chat-error');
   if(errEl)errEl.textContent=t('chat.stoppedMessage');
   const retryEl=turn.querySelector('.chat-retry');
   if(retryEl)retryEl.textContent=t('chat.retryBtn');
   countEl.textContent=t('chat.toolsCount',{count:meta.toolCount});
  }else if(meta.state==='failed'){
   statusEl.textContent=t('chat.failedStatus');
   const retryEl=turn.querySelector('.chat-retry');
   if(retryEl)retryEl.textContent=t('chat.retryBtn');
   countEl.textContent=t('chat.toolsCount',{count:meta.toolCount});
  }else if(meta.state==='done'&&meta.result){
   const r=meta.result;
   statusEl.textContent=t('chat.modelContextStatus',{pair:r.context.pair,horizon:r.context.horizon_weekdays});
   turn.querySelector('.chat-turn-sources').innerHTML=sourcesHtml(r.sources||[]);
   if(r.notices?.length){
    turn.querySelector('.chat-turn-notices').innerHTML='<details class="chat-data-notices"><summary>'+esc(t('chat.noticesSummary'))+'</summary>'+r.notices.map(n=>'<p>'+esc(localizeNotice(n))+'</p>').join('')+'</details>';
   }
   countEl.textContent=t('chat.toolsAndModelCount',{tools:meta.toolCount,models:r.model_calls});
   const chartSlot=turn.querySelector('.chat-turn-chart');
   if(chartSlot&&!chartSlot.hidden&&chartSlot._fxChart)mountChatChart(chartSlot,chartSlot._fxChart);
  }else if(meta.state==='running'){
   if(meta.rawStatus)statusEl.textContent=localizeStatus(meta.rawStatus);
   else if(meta.activeTool)statusEl.textContent=toolLabel(meta.activeTool);
   else statusEl.textContent=t('chat.thinking');
   countEl.textContent=meta.toolCount?t('chat.toolsCount',{count:meta.toolCount}):t('chat.working');
  }
  for(const row of turn.querySelectorAll('.chat-tool-result')){
   const name=row.dataset.toolName;
   const span=row.querySelector('summary > span');
   if(name&&span){
    const failed=row.dataset.toolFailed==='1';
    span.textContent=(failed?'!':'✓')+' '+toolLabel(name);
   }
  }
  for(const p of turn.querySelectorAll('.chat-tool-pending')){
   const name=p.dataset.pending;
   const query=p.dataset.query||'';
   p.textContent=toolLabel(name)+(query?' · '+query:'')+'…';
  }
 }

 function newChat(){running?.abort();history=[];current={base:'USD',quote:'SGD',horizon:10,scenarioBps:0};$('#chat-messages').replaceChildren();section.classList.remove('has-messages');$('#chat-message').value='';$('#chat-message').style.height='';$('#chat-message').focus();}
 $('#new-chat').onclick=newChat;

 function traceRow(list,event){
  list.querySelector('[data-pending="'+event.name+'"]')?.remove();
  if(event.type==='tool_start'){
   const el=document.createElement('p');el.className='chat-tool-pending';el.dataset.pending=event.name;
   if(event.arguments?.query)el.dataset.query=event.arguments.query;
   el.textContent=toolLabel(event.name)+(event.arguments?.query?' · '+event.arguments.query:'')+'…';
   list.append(el);return;
  }
  const el=document.createElement('details');el.className='chat-tool-result';
  const failed=!!event.result?.error;
  el.dataset.toolName=event.name;el.dataset.toolFailed=failed?'1':'0';
  el.innerHTML='<summary><span>'+(failed?'!':'✓')+' '+esc(toolLabel(event.name))+'</span><small>'+event.duration_ms+' ms</small></summary><pre>'+esc(JSON.stringify({arguments:event.arguments,result:event.result},null,2))+'</pre>';
  list.append(el);
 }

 async function send(messageOverride){
  if(running||!config?.configured)return;
  const message=(messageOverride??$('#chat-message').value).trim();
  if(!message){$('#chat-message').focus();return;}
  if(message.length>2000){toast(t('chat.msgTooLong'));return;}
  const controller=new AbortController();running=controller;setBusy(true);section.classList.add('has-messages');$('#chat-message').value='';$('#chat-message').style.height='';
  const turn=document.createElement('article');turn.className='chat-turn';
  turn._fxTurn={state:'running',toolCount:0,rawStatus:'Thinking about your question…',activeTool:null,result:null};
  turn.innerHTML='<div class="chat-user"><span>'+esc(t('chat.you'))+'</span><p>'+esc(message)+'</p></div><div class="chat-assistant"><div class="chat-assistant-heading"><span class="chat-assistant-mark">'+icon('spark')+'</span><strong>FX Warriors</strong><span class="chat-turn-status">'+esc(t('chat.thinking'))+'</span></div><div class="chat-turn-body"><div class="chat-pending"><span></span><span></span><span></span></div></div><div class="chat-turn-chart" hidden></div><div class="chat-turn-sources"></div><div class="chat-turn-notices"></div><details class="chat-activity"><summary>'+icon('layers')+'<span>'+esc(t('chat.activityTitle'))+'</span><small class="chat-tool-count">'+esc(t('chat.working'))+'</small></summary><div class="chat-activity-list"></div></details><div class="chat-follow-ups"></div></div>';
  $('#chat-messages').append(turn);scrollTurn(turn);
  const status=turn.querySelector('.chat-turn-status'),body=turn.querySelector('.chat-turn-body'),chartSlot=turn.querySelector('.chat-turn-chart'),activity=turn.querySelector('.chat-activity-list');
  let gotResult=false;
  try{
   const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message,context:current,history:history.slice(-8),locale:getLang()}),signal:controller.signal});
   if(!response.ok){const error=await response.json().catch(()=>({}));throw new Error(error.error||t('chat.httpError',{status:response.status}));}
   if(!response.body)throw new Error(t('chat.streamUnavailable'));
   const handle=event=>{
    if(event.type==='status'){turn._fxTurn.rawStatus=event.message;turn._fxTurn.activeTool=null;status.textContent=localizeStatus(event.message);}
    if(event.type==='context'){const [base,quote]=event.context.pair.split('/');current={base,quote,horizon:event.context.horizon_weekdays,scenarioBps:event.context.user_scenario?.assumed_terminal_bps||0};}
    if(event.type==='tool_start'){turn._fxTurn.rawStatus=null;turn._fxTurn.activeTool=event.name;status.textContent=toolLabel(event.name)||t('chat.researching');traceRow(activity,event);}
    if(event.type==='tool_result'){traceRow(activity,event);turn._fxTurn.toolCount++;turn.querySelector('.chat-tool-count').textContent=t('chat.toolsCount',{count:turn._fxTurn.toolCount});}
    if(event.type==='chart'){chartSlot.hidden=false;mountChatChart(chartSlot,event.chart);}
    if(event.type==='error')throw new Error(event.message);
    if(event.type==='result'){
     gotResult=true;turn._fxTurn.state='done';turn._fxTurn.result=event;
     status.textContent=t('chat.modelContextStatus',{pair:event.context.pair,horizon:event.context.horizon_weekdays});
     body.innerHTML=richText(event.answer,event.sources||[]);
     if(event.chart){chartSlot.hidden=false;mountChatChart(chartSlot,event.chart);}
     turn.querySelector('.chat-turn-sources').innerHTML=sourcesHtml(event.sources||[]);
     if(event.notices?.length)turn.querySelector('.chat-turn-notices').innerHTML='<details class="chat-data-notices"><summary>'+esc(t('chat.noticesSummary'))+'</summary>'+event.notices.map(n=>'<p>'+esc(localizeNotice(n))+'</p>').join('')+'</details>';
     turn.querySelector('.chat-tool-count').textContent=t('chat.toolsAndModelCount',{tools:turn._fxTurn.toolCount,models:event.model_calls});
     const follows=turn.querySelector('.chat-follow-ups');
     for(const question of event.follow_ups||[]){const button=document.createElement('button');button.type='button';button.textContent=question+' ↗';button.onclick=()=>send(question);follows.append(button);}
     history.push({role:'user',content:message},{role:'assistant',content:event.answer.slice(0,1900)});history=history.slice(-8);
    }
   };
   const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='';
   while(true){const {value,done}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});let line;while((line=buffer.indexOf('\n'))>=0){const part=buffer.slice(0,line);buffer=buffer.slice(line+1);if(part.trim())handle(JSON.parse(part));}}
   if(buffer.trim())handle(JSON.parse(buffer));if(!gotResult)throw new Error(t('chat.streamEndedEarly'));
  }catch(error){
   const aborted=error.name==='AbortError';
   turn._fxTurn.state=aborted?'stopped':'failed';
   status.textContent=aborted?t('chat.stoppedStatus'):t('chat.failedStatus');
   body.innerHTML='<p class="chat-error">'+esc(aborted?t('chat.stoppedMessage'):error.message)+'</p>';
   turn.querySelector('.chat-tool-count').textContent=t('chat.toolsCount',{count:turn._fxTurn.toolCount});
   const retry=document.createElement('button');retry.className='chat-retry';retry.type='button';retry.textContent=t('chat.retryBtn');retry.onclick=()=>send(message);body.append(retry);
  }finally{if(running===controller){running=null;setBusy(false);}activity.querySelectorAll('.chat-tool-pending').forEach(el=>el.remove());}
 }

 $('#chat-form').onsubmit=event=>{event.preventDefault();send();};
 $('#chat-send').onclick=()=>running?running.abort():$('#chat-form').requestSubmit();
 $('#chat-message').addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();if(!running)$('#chat-form').requestSubmit();}});
 $('#chat-message').addEventListener('input',event=>{event.target.style.height='auto';event.target.style.height=Math.min(event.target.scrollHeight,180)+'px';});

 refreshChrome();
 fetch('/api/chat').then(r=>{if(!r.ok)throw new Error();return r.json();}).then(value=>{config=value;statusMode=value.configured?'configured':'unconfigured';renderStatusLine();setBusy(!!running);}).catch(()=>{statusMode='failed';renderStatusLine();$('#chat-send').disabled=true;});

 return {
  contextChanged:()=>{if(!history.length&&!running&&location.hash==='#agent'){const c=getContext();if(c.ready)current={base:c.base,quote:c.quote,horizon:c.horizon,scenarioBps:c.scenarioBps};}},
  refreshI18n:()=>{
   refreshChrome();
   for(const turn of section.querySelectorAll('.chat-turn'))renderTurnLabels(turn);
  }
 };
}
