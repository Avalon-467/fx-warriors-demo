import {t,formatDateShort,localizeSourceMode} from './i18n.mjs';
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rate=value=>Number(value).toFixed(value>=20?3:4);
export function mountChatChart(element,chart){
 element._fxChart=chart;
 const history=chart.history||[],forecast=chart.forecast||[];if(history.length<2){element.textContent=t('chart.notEnoughHistory');return;}
 const all=[...history,...forecast],W=760,H=290,L=12,R=67,T=27,B=39,pw=W-L-R,ph=H-T-B;
 const values=[...history.map(p=>p.rate),...forecast.flatMap(p=>[p.lower,p.upper])];let lo=Math.min(...values),hi=Math.max(...values);const pad=(hi-lo)*.18||lo*.004;lo-=pad;hi+=pad;
 const x=i=>L+i/(all.length-1)*pw,y=v=>T+(hi-v)/(hi-lo)*ph;
 const path=points=>points.map((p,i)=>(i?'L':'M')+p[0].toFixed(2)+' '+p[1].toFixed(2)).join(' ');
 const hist=path(history.map((p,i)=>[x(i),y(p.rate)])),anchor=history.length-1,spot=history.at(-1).rate;
 const future=[{...history.at(-1),lower:spot,upper:spot},...forecast];
 const band=forecast.length?path(future.map((p,i)=>[x(anchor+i),y(p.upper)]))+' '+future.toReversed().map((p,i)=>'L'+x(anchor+future.length-1-i).toFixed(2)+' '+y(p.lower).toFixed(2)).join(' ')+' Z':'';
 const tick=Array.from({length:5},(_,i)=>{const value=lo+(hi-lo)*i/4,yy=y(value);return '<line x1="'+L+'" x2="'+(W-R)+'" y1="'+yy+'" y2="'+yy+'" stroke="#e6ece4" stroke-dasharray="3 4"/><text x="'+(W-R+11)+'" y="'+(yy+4)+'">'+rate(value)+'</text>';}).join('');
 const labels=[0,Math.floor(anchor/2),anchor,...(forecast.length?[all.length-1]:[])].map(i=>'<text x="'+x(i)+'" y="'+(H-9)+'" text-anchor="'+(i===0?'start':i===all.length-1?'end':'middle')+'">'+escape(formatDateShort(all[i].date))+'</text>').join('');
 const change=(spot/history[0].rate-1)*100;
 const pctText=(change>=0?'+':'')+change.toFixed(2)+'%';
 const ariaLabel=t('chart.ariaRates',{pair:chart.pair})+(forecast.length?t('chart.ariaWithForecast'):'');
 const descText=t('chart.descPrefix',{spot:rate(spot),date:chart.reference_date})+(forecast.length?t('chart.descForecast'):t('chart.descHistory'));
 const sourceName=chart.source||'ECB';
 const modeText=localizeSourceMode(chart.source_mode);
 element.className='chat-chart';
 element.innerHTML='<div class="chat-chart-heading"><div><span class="chat-card-eyebrow">'+escape(forecast.length?t('chart.eyebrowWithForecast'):t('chart.eyebrowHistoryOnly'))+'</span><h3>'+escape(chart.pair)+' <span>'+escape(t('chart.perBase',{base:chart.base,quote:chart.quote}))+'</span></h3></div><div class="chat-chart-spot"><strong>'+rate(spot)+'</strong><span class="'+(change>=0?'up':'down')+'">'+escape(t('chart.changeOverShown',{pct:pctText}))+'</span></div></div><div class="chat-chart-plot"><svg viewBox="0 0 '+W+' '+H+'" role="img" tabindex="0" aria-label="'+escape(ariaLabel)+'"><title>'+escape(chart.pair)+' · '+history[0].date+' to '+all.at(-1).date+'</title><desc>'+escape(descText)+'</desc>'+tick+(forecast.length?'<rect x="'+x(anchor)+'" y="'+T+'" width="'+(W-R-x(anchor))+'" height="'+ph+'" fill="#eff4e6" opacity=".55"/><path d="'+band+'" fill="#d7e7bf" opacity=".75"/><path d="'+path(future.map((p,i)=>[x(anchor+i),y(p.rate)]))+'" fill="none" stroke="#91ad67" stroke-width="2.5" stroke-dasharray="5 5"/>':'')+'<path d="'+hist+'" fill="none" stroke="#34664b" stroke-width="2.5" stroke-linejoin="round"/>'+labels+'<circle cx="'+x(anchor)+'" cy="'+y(spot)+'" r="4" fill="#34664b" stroke="white" stroke-width="2"/><line class="chat-chart-cursor" y1="'+T+'" y2="'+(T+ph)+'" stroke="#7b9870" stroke-dasharray="3 4" visibility="hidden"/><circle class="chat-chart-dot" r="4.5" fill="#34664b" stroke="white" stroke-width="2" visibility="hidden"/></svg><div class="chat-chart-tooltip" hidden></div></div><div class="chat-chart-footer"><span><i></i>'+escape(t('chart.legendHistory'))+(forecast.length?' <b>┄</b> '+escape(t('chart.legendProjection'))+' <em>'+escape(t('chart.legendInterval'))+'</em>':'')+'</span><span>'+escape(t('chart.asOf',{date:chart.reference_date}))+'</span></div><p class="chat-chart-note">'+escape(sourceName)+' · '+escape(modeText)+escape(forecast.length?t('chart.noteForecast'):t('chart.noteHistory'))+'</p>';
 const svg=element.querySelector('svg'),tooltip=element.querySelector('.chat-chart-tooltip'),cursor=element.querySelector('.chat-chart-cursor'),dot=element.querySelector('.chat-chart-dot');
 const show=index=>{const point=all[index];cursor.setAttribute('x1',x(index));cursor.setAttribute('x2',x(index));cursor.setAttribute('visibility','visible');dot.setAttribute('cx',x(index));dot.setAttribute('cy',y(point.rate));dot.setAttribute('visibility','visible');tooltip.hidden=false;tooltip.textContent=point.date+' · '+rate(point.rate)+' '+chart.quote+(index>=history.length?t('chart.tooltipProjection'):'');tooltip.style.left=Math.min(65,Math.max(0,x(index)/W*100))+'%';tooltip.style.top='10px';};
 svg.addEventListener('pointermove',event=>{const rect=svg.getBoundingClientRect(),px=(event.clientX-rect.left)/rect.width*W;show(Math.max(0,Math.min(all.length-1,Math.round((px-L)/pw*(all.length-1)))));});
 svg.addEventListener('pointerleave',()=>{tooltip.hidden=true;cursor.setAttribute('visibility','hidden');dot.setAttribute('visibility','hidden');});
 let focusIndex=history.length-1;svg.addEventListener('keydown',event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();focusIndex=Math.max(0,Math.min(all.length-1,focusIndex+(event.key==='ArrowRight'?1:-1)));show(focusIndex);}});
}
