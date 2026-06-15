(function () {
'use strict';
// AK-FLOW v1.7 - Staffbase Custom Widget Bundle
// Fix: Compact layout (tiles+Bestellgrund in one bubble) + MutationObserver auto-scroll on grid

if (!customElements.get('ak-flow-widget')) {
  customElements.define('ak-flow-widget', class extends HTMLElement {
    connectedCallback() { this.innerHTML = '<slot></slot>'; }
  });
}

var AK_CSS=[
  '#ak-chat-area{display:flex;flex-direction:column;gap:8px;padding:8px 8px 4px 8px}',
  '.ak-bot-msg{display:flex;align-items:flex-start;gap:6px}',
  '.ak-bot-avatar{width:22px;height:22px;border-radius:50%;background:#003366;color:white;display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0;margin-top:2px}',
  '.ak-bot-bubble{background:#fff;border-radius:4px 14px 14px 14px;padding:8px 11px;font-size:12px;max-width:90%;box-shadow:0 1px 3px rgba(0,0,0,.1);line-height:1.4}',
  '.ak-user-msg{display:flex;justify-content:flex-end}',
  '.ak-user-bubble{background:#003366;color:white;border-radius:14px 4px 14px 14px;padding:7px 11px;font-size:12px;max-width:90%}',
  '.ak-tile-grid{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-top:6px}',
  '.ak-chat-tile{border:1.5px solid #e0e0e0;border-radius:8px;padding:6px 4px;cursor:pointer;text-align:center;font-size:10px;background:#fff;transition:all .15s;line-height:1.2}',
  '.ak-chat-tile:hover{border-color:#003366;background:#f0f4ff}',
  '.ak-chat-tile.sel{border-color:#003366;background:#e8f0fe;color:#003366;font-weight:700}',
  '.ak-chat-tile .ico{font-size:18px;margin-bottom:2px;display:block}',
  '.ak-select-inline{width:100%;box-sizing:border-box;padding:6px 8px;border:1.5px solid #d0d7de;border-radius:7px;font-size:11px;background:#fff;margin-top:6px}',
  '.ak-input-label{font-size:10px;color:#666;font-weight:600;margin-top:7px;display:block}',
  '.ak-date-input{width:100%;box-sizing:border-box;padding:6px 8px;border:1.5px solid #d0d7de;border-radius:7px;font-size:11px;background:#fff;margin-top:2px}',
  '.ak-summary-table{width:100%;font-size:10px;border-collapse:collapse;margin-top:5px}',
  '.ak-summary-table td{padding:2px 0;border-bottom:1px solid #f0f0f0;color:#555}',
  '.ak-summary-table td:first-child{font-weight:600;color:#333;width:42%}',
  '.ak-success-box{background:#e8f5e9;border:1px solid #a5d6a7;border-radius:10px;padding:10px;text-align:center}',
  '.ak-success-box .ak-order-num{font-size:14px;font-weight:700;color:#003366;margin:4px 0}',
  '.ak-typing{display:flex;gap:4px;align-items:center;padding:3px 0}',
  '.ak-typing span{width:5px;height:5px;border-radius:50%;background:#999;animation:akBounce 1s infinite;display:inline-block}',
  '.ak-typing span:nth-child(2){animation-delay:.15s}',
  '.ak-typing span:nth-child(3){animation-delay:.3s}',
  '@keyframes akBounce{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-5px);opacity:1}}',
  '.ak-action-bar{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;padding-bottom:12px}',
  '.ak-chat-btn{padding:8px 16px;background:#003366;color:white;border:none;border-radius:18px;font-size:12px;font-weight:700;cursor:pointer;transition:opacity .15s;flex-shrink:0}',
  '.ak-chat-btn:hover{opacity:.85}',
  '.ak-chat-btn.secondary{background:#f0f4f8;color:#003366;border:1.5px solid #003366}',
  '.ak-chat-btn.green{background:#1a7f37}',
].join('');

var akState={},akObs=null,akScrollObs=null,akStyled=false;

function css(){
  if(akStyled)return;
  var s=document.createElement('style');
  s.id='ak-flow-css';
  s.textContent=AK_CSS;
  document.head.appendChild(s);
  akStyled=true;
}

function getGrid(){
  var els=document.querySelectorAll('.pointer-events-auto.fixed');
  for(var i=0;i<els.length;i++){
    var g=els[i].querySelector('.grid.h-full');
    if(g)return g;
  }
  return null;
}

function getBtn(){
  var bs=document.querySelectorAll('button');
  for(var i=0;i<bs.length;i++){
    if(bs[i].textContent.toLowerCase().includes('arbeitskleidung'))return bs[i];
  }
  return null;
}

// Install a MutationObserver on the grid that auto-scrolls on any DOM change
function installAutoScroll(grid){
  if(akScrollObs)akScrollObs.disconnect();
  akScrollObs=new MutationObserver(function(){
    requestAnimationFrame(function(){
      // Scroll the grid itself
      if(grid.scrollHeight>grid.clientHeight){
        grid.scrollTop=grid.scrollHeight;
      }
    });
  });
  akScrollObs.observe(grid,{childList:true,subtree:true});
}

function scrollToBottom(grid){
  if(!grid)grid=getGrid();
  if(grid)grid.scrollTop=grid.scrollHeight;
}

function botMsg(area,html,grid,delay){
  return new Promise(function(resolve){
    setTimeout(function(){
      var t=document.createElement('div');
      t.className='ak-bot-msg';
      t.innerHTML='<div class="ak-bot-avatar">✨</div><div class="ak-bot-bubble"><div class="ak-typing"><span></span><span></span><span></span></div></div>';
      area.appendChild(t);
      scrollToBottom(grid);
      setTimeout(function(){
        t.remove();
        var m=document.createElement('div');
        m.className='ak-bot-msg';
        m.innerHTML='<div class="ak-bot-avatar">✨</div><div class="ak-bot-bubble">'+html+'</div>';
        area.appendChild(m);
        scrollToBottom(grid);
        resolve(m);
      },600);
    },delay||0);
  });
}

function userMsg(area,txt,grid){
  var m=document.createElement('div');
  m.className='ak-user-msg';
  m.innerHTML='<div class="ak-user-bubble">'+txt+'</div>';
  area.appendChild(m);
  scrollToBottom(grid);
}

function actionBar(area,grid,buttons){
  var old=area.querySelector('.ak-action-bar');
  if(old)old.remove();
  var bar=document.createElement('div');
  bar.className='ak-action-bar';
  buttons.forEach(function(b){
    var btn=document.createElement('button');
    btn.className='ak-chat-btn'+(b.cls?' '+b.cls:'');
    btn.textContent=b.label;
    btn.addEventListener('click',b.fn);
    bar.appendChild(btn);
  });
  area.appendChild(bar);
  scrollToBottom(grid);
  return bar;
}

// Silent email notification
function sendOrderEmail(orderNum){
  var subject=encodeURIComponent('Neue Arbeitskleidung-Bestellung '+orderNum);
  var body=encodeURIComponent(
    'Guten Tag,

'+
    'eine neue Bestellung für Arbeitskleidung wurde eingereicht.

'+
    'Bestellnummer:   '+orderNum+'
'+
    'Abteilung:       '+(akState.abt||'')+'
'+
    'Artikel:         '+(akState.art||[]).join(', ')+'
'+
    'Bestellgrund:    '+(akState.gr||'')+'
'+
    'Lieferort:       '+(akState.lo||'')+'
'+
    'Lieferdatum:     '+(akState.dt||'')+'
'+
    (akState.ob?'Oberteil-Größe:  '+akState.ob+'
':'')+
    (akState.ho?'Hosen-Größe:    '+akState.ho+'
':'')+
    (akState.sc?'Schuh-Größe:    '+akState.sc+'
':'')+
    'Genehmiger:      '+(akState.gen||'')+'

'+
    'Mit freundlichen Grüßen
Kötter KI-Assistent'
  );
  var iframe=document.createElement('iframe');
  iframe.style.display='none';
  iframe.src='mailto:joerg.riedel@me.com?subject='+subject+'&body='+body;
  document.body.appendChild(iframe);
  setTimeout(function(){iframe.remove();},3000);
}

function startFlow(grid){
  css();
  installAutoScroll(grid);
  var ch=Array.from(grid.children),sa=null;
  ch.forEach(function(c,i){
    if(i===1){c.style.display='';sa=c;}
    else{c.style.display='none';}
  });
  if(!sa&&ch[0]){sa=ch[0];sa.style.display='';}
  if(!sa){sa=document.createElement('div');sa.style.cssText='flex:1;overflow-y:auto;';grid.appendChild(sa);}
  sa.innerHTML='<div id="ak-chat-area"></div>';
  var area=sa.querySelector('#ak-chat-area');
  akState={};
  setTimeout(function(){step1(area,grid);},300);
}

function step1(area,grid){
  // Compact: greeting + abteilung in one shot, then tiles+bestellgrund+button together
  botMsg(area,'Hallo! Bitte wähle deine <strong>Abteilung</strong>:<select class="ak-select-inline" id="ak-abt"><option value="">-- Abteilung wählen --</option><option>Objektschutz</option><option>Revierdienst</option><option>Empfang &amp; Service</option><option>Veranstaltungsschutz</option><option>Luftsicherheit</option><option>Zentrale Dienste</option></select>',grid).then(function(){
    // Tiles + Bestellgrund in one bubble
    var html='<strong>Artikel</strong> (Mehrfachauswahl):'+
      '<div class="ak-tile-grid" id="ak-art">'+
      '<div class="ak-chat-tile" data-art="Sicherheitsjacke"><div class="ico">🧥</div>Sicherheitsjacke</div>'+
      '<div class="ak-chat-tile" data-art="Diensthose"><div class="ico">👖</div>Diensthose</div>'+
      '<div class="ak-chat-tile" data-art="Polo-Shirt"><div class="ico">👔</div>Polo-Shirt</div>'+
      '<div class="ak-chat-tile" data-art="Sicherheitsweste"><div class="ico">🦺</div>Sicherheitsweste</div>'+
      '<div class="ak-chat-tile" data-art="Einsatzstiefel"><div class="ico">👢</div>Einsatzstiefel</div>'+
      '<div class="ak-chat-tile" data-art="Schirmmütze"><div class="ico">🧢</div>Schirmmütze</div>'+
      '</div>'+
      '<select class="ak-select-inline" id="ak-gr" style="margin-top:6px">'+
      '<option value="">-- Bestellgrund --</option>'+
      '<option>Erstausstattung</option>'+
      '<option>Ersatzbeschaffung (Verschleiß)</option>'+
      '<option>Größenänderung</option>'+
      '<option>Neuer Einsatzbereich</option>'+
      '</select>';
    botMsg(area,html,grid,300).then(function(){
      var g=area.querySelector('#ak-art');
      if(g)g.addEventListener('click',function(e){var t=e.target.closest('.ak-chat-tile');if(t)t.classList.toggle('sel');});
      actionBar(area,grid,[{label:'Weiter →',fn:function(){
        var a=area.querySelector('#ak-abt'),gr=area.querySelector('#ak-gr'),ts=area.querySelectorAll('.ak-chat-tile.sel');
        if(!a||!a.value){alert('Abteilung wählen');return;}
        if(!ts.length){alert('Artikel wählen');return;}
        if(!gr||!gr.value){alert('Bestellgrund wählen');return;}
        akState.abt=a.value;
        akState.art=Array.from(ts).map(function(t){return t.dataset.art;});
        akState.gr=gr.value;
        area.querySelector('.ak-action-bar').remove();
        userMsg(area,'📦 '+akState.art.join(', ')+' | '+akState.abt,grid);
        step2(area,grid);
      }}]);
    });
  });
}

function step2(area,grid){
  var hO=akState.art.some(function(a){return['Sicherheitsjacke','Polo-Shirt','Sicherheitsweste'].indexOf(a)>-1;}),
      hH=akState.art.indexOf('Diensthose')>-1,
      hS=akState.art.indexOf('Einsatzstiefel')>-1,
      html='<strong>Größen &amp; Lieferung</strong><br>';
  if(hO)html+='<label class="ak-input-label">Oberteil / Jacke</label><select class="ak-select-inline" id="ak-ob"><option value="">Größe wählen</option><option>XS</option><option>S</option><option>M</option><option>L</option><option>XL</option><option>XXL</option><option>3XL</option></select>';
  if(hH)html+='<label class="ak-input-label">Hosenweite</label><select class="ak-select-inline" id="ak-ho"><option value="">Größe wählen</option><option>44</option><option>46</option><option>48</option><option>50</option><option>52</option><option>54</option><option>56</option><option>58</option></select>';
  if(hS)html+='<label class="ak-input-label">Schuhgröße</label><select class="ak-select-inline" id="ak-sc"><option value="">Größe wählen</option><option>38</option><option>39</option><option>40</option><option>41</option><option>42</option><option>43</option><option>44</option><option>45</option><option>46</option></select>';
  html+='<label class="ak-input-label">Lieferort</label><select class="ak-select-inline" id="ak-lo"><option value="">Standort wählen</option><option>Zentrale Essen</option><option>NL Hamburg</option><option>NL München</option><option>NL Berlin</option><option>NL Frankfurt</option></select>';
  html+='<label class="ak-input-label">Wunsch-Lieferdatum</label><input type="date" class="ak-date-input" id="ak-dt">';
  botMsg(area,html,grid,300).then(function(){
    actionBar(area,grid,[
      {label:'← Zurück',cls:'secondary',fn:function(){area.innerHTML='';akState={};step1(area,grid);}},
      {label:'Weiter →',fn:function(){
        if(hO){var v=area.querySelector('#ak-ob');if(!v||!v.value){alert('Oberteil wählen');return;}akState.ob=v.value;}
        if(hH){var v2=area.querySelector('#ak-ho');if(!v2||!v2.value){alert('Hose wählen');return;}akState.ho=v2.value;}
        if(hS){var v3=area.querySelector('#ak-sc');if(!v3||!v3.value){alert('Schuh wählen');return;}akState.sc=v3.value;}
        var lo=area.querySelector('#ak-lo'),dt=area.querySelector('#ak-dt');
        if(!lo||!lo.value){alert('Lieferort wählen');return;}
        if(!dt||!dt.value){alert('Datum wählen');return;}
        akState.lo=lo.value;akState.dt=dt.value;
        area.querySelector('.ak-action-bar').remove();
        userMsg(area,'📏 Größen OK | 📍 '+akState.lo,grid);
        step3(area,grid);
      }}
    ]);
  });
}

function step3(area,grid){
  var rows=[['Abteilung',akState.abt],['Artikel',akState.art.join(', ')],['Bestellgrund',akState.gr],['Lieferort',akState.lo],['Datum',akState.dt]];
  if(akState.ob)rows.push(['Oberteil',akState.ob]);
  if(akState.ho)rows.push(['Hose',akState.ho]);
  if(akState.sc)rows.push(['Schuh',akState.sc]);
  var tbl='<table class="ak-summary-table">'+rows.map(function(r){return'<tr><td>'+r[0]+'</td><td>'+r[1]+'</td></tr>';}).join('')+'</table>';
  botMsg(area,'<strong>Bestätigung</strong>'+tbl+'<label class="ak-input-label" style="margin-top:8px">Genehmiger</label><select class="ak-select-inline" id="ak-gen"><option value="">Wählen...</option><option value="Max Müller">Max Müller (Teamleiter)</option><option value="Sandra Schmidt">Sandra Schmidt (HR)</option><option value="Thomas Weber">Thomas Weber (Abt.-leiter)</option></select>',grid,300).then(function(){
    actionBar(area,grid,[
      {label:'← Zurück',cls:'secondary',fn:function(){area.querySelector('.ak-action-bar').remove();step2(area,grid);}},
      {label:'✅ Jetzt bestellen',cls:'green',fn:function(){
        var g=area.querySelector('#ak-gen');
        if(!g||!g.value){alert('Genehmiger wählen');return;}
        akState.gen=g.value;
        area.querySelector('.ak-action-bar').remove();
        userMsg(area,'✅ Bestätigt | '+akState.gen,grid);
        success(area,grid);
      }}
    ]);
  });
}

function success(area,grid){
  var num='#AK-2026-'+Math.floor(1000+Math.random()*9000);
  akState.orderNum=num;
  botMsg(area,'<div class="ak-success-box"><div style="font-size:24px">🎉</div><div class="ak-order-num">'+num+'</div><div style="font-size:11px;color:#333">Bestellung eingereicht!</div></div>'+
    '<div style="font-size:10px;color:#555;margin-top:6px">📧 <strong>'+akState.gen+'</strong> benachrichtigt.<br>'+
    '<em>Lieferung: '+akState.lo+' | '+akState.dt+'</em></div>',grid,300).then(function(){
    setTimeout(function(){sendOrderEmail(num);},500);
    actionBar(area,grid,[{label:'Neue Bestellung',fn:function(){area.innerHTML='';akState={};step1(area,grid);}}]);
  });
}

function attach(){
  var b=getBtn();
  if(!b||b._ak)return;
  b._ak=true;
  b.addEventListener('click',function(e){
    e.stopImmediatePropagation();
    e.preventDefault();
    setTimeout(function(){var g=getGrid();if(g)startFlow(g);},200);
  },true);
}

function observe(){
  if(akObs)akObs.disconnect();
  akObs=new MutationObserver(function(){attach();});
  akObs.observe(document.body,{childList:true,subtree:true});
  attach();
}

if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',observe);}else{observe();}
var _p=history.pushState;
history.pushState=function(){_p.apply(history,arguments);setTimeout(observe,500);};
window.addEventListener('popstate',function(){setTimeout(observe,500);});
console.log('[AK-Flow] v1.7 ready ✅ (compact layout + MutationObserver auto-scroll)');
})();
