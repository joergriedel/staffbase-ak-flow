(function () {
'use strict';
// AK-FLOW v1.5 - Staffbase Custom Widget Bundle
// Fix: Action bar rendered OUTSIDE scroll container, always visible at bottom

if (!customElements.get('ak-flow-widget')) {
  customElements.define('ak-flow-widget', class extends HTMLElement {
    connectedCallback() { this.innerHTML = '<slot></slot>'; }
  });
}

var AK_CSS=[
  '#ak-chat-area{display:flex;flex-direction:column;gap:12px;padding:12px 12px 120px 12px}',
  '.ak-bot-msg{display:flex;align-items:flex-start;gap:8px}',
  '.ak-bot-avatar{width:26px;height:26px;border-radius:50%;background:#003366;color:white;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;margin-top:2px}',
  '.ak-bot-bubble{background:#fff;border-radius:4px 16px 16px 16px;padding:10px 13px;font-size:13px;max-width:88%;box-shadow:0 1px 3px rgba(0,0,0,.1);line-height:1.4}',
  '.ak-user-msg{display:flex;justify-content:flex-end}',
  '.ak-user-bubble{background:#003366;color:white;border-radius:16px 4px 16px 16px;padding:9px 13px;font-size:13px;max-width:88%}',
  '.ak-tile-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:8px}',
  '.ak-chat-tile{border:2px solid #e0e0e0;border-radius:10px;padding:8px 5px;cursor:pointer;text-align:center;font-size:11px;background:#fff;transition:all .15s;line-height:1.3}',
  '.ak-chat-tile:hover{border-color:#003366;background:#f0f4ff}',
  '.ak-chat-tile.sel{border-color:#003366;background:#e8f0fe;color:#003366;font-weight:700}',
  '.ak-chat-tile .ico{font-size:20px;margin-bottom:3px;display:block}',
  '.ak-select-inline{width:100%;box-sizing:border-box;padding:7px 9px;border:1.5px solid #d0d7de;border-radius:8px;font-size:12px;background:#fff;margin-top:7px}',
  '.ak-input-label{font-size:11px;color:#666;font-weight:600;margin-top:8px;display:block}',
  '.ak-date-input{width:100%;box-sizing:border-box;padding:7px 9px;border:1.5px solid #d0d7de;border-radius:8px;font-size:12px;background:#fff;margin-top:3px}',
  '.ak-summary-table{width:100%;font-size:11px;border-collapse:collapse;margin-top:6px}',
  '.ak-summary-table td{padding:3px 0;border-bottom:1px solid #f0f0f0;color:#555}',
  '.ak-summary-table td:first-child{font-weight:600;color:#333;width:42%}',
  '.ak-success-box{background:#e8f5e9;border:1px solid #a5d6a7;border-radius:12px;padding:12px;text-align:center}',
  '.ak-success-box .ak-order-num{font-size:16px;font-weight:700;color:#003366;margin:5px 0}',
  '.ak-typing{display:flex;gap:4px;align-items:center;padding:4px 0}',
  '.ak-typing span{width:6px;height:6px;border-radius:50%;background:#999;animation:akBounce 1s infinite;display:inline-block}',
  '.ak-typing span:nth-child(2){animation-delay:.15s}',
  '.ak-typing span:nth-child(3){animation-delay:.3s}',
  '@keyframes akBounce{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-5px);opacity:1}}',
  // Action bar: fixed at bottom of the grid container, outside scroll area
  '#ak-action-bar{position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,#f0f4f8 30%);padding:16px 12px 10px;display:flex;gap:8px;flex-wrap:wrap;z-index:100;pointer-events:auto}',
  '.ak-chat-btn{padding:9px 18px;background:#003366;color:white;border:none;border-radius:20px;font-size:13px;font-weight:700;cursor:pointer;transition:opacity .15s;flex-shrink:0;box-shadow:0 2px 6px rgba(0,0,0,.2)}',
  '.ak-chat-btn:hover{opacity:.85}',
  '.ak-chat-btn.secondary{background:#f0f4f8;color:#003366;border:1.5px solid #003366}',
  '.ak-chat-btn.green{background:#1a7f37}',
].join('');

var akState={},akObs=null,akStyled=false,akBar=null;

function css(){if(akStyled)return;var s=document.createElement('style');s.id='ak-flow-css';s.textContent=AK_CSS;document.head.appendChild(s);akStyled=true;}
function getGrid(){var els=document.querySelectorAll('.pointer-events-auto.fixed');for(var i=0;i<els.length;i++){var g=els[i].querySelector('.grid.h-full');if(g)return g;}return null;}
function getBtn(){var bs=document.querySelectorAll('button');for(var i=0;i<bs.length;i++){if(bs[i].textContent.toLowerCase().includes('arbeitskleidung'))return bs[i];}return null;}

function botMsg(area,html,delay){
  return new Promise(function(resolve){
    setTimeout(function(){
      var t=document.createElement('div');
      t.className='ak-bot-msg';
      t.innerHTML='<div class="ak-bot-avatar">✨</div><div class="ak-bot-bubble"><div class="ak-typing"><span></span><span></span><span></span></div></div>';
      area.appendChild(t);
      scrollDown(area);
      setTimeout(function(){
        t.remove();
        var m=document.createElement('div');
        m.className='ak-bot-msg';
        m.innerHTML='<div class="ak-bot-avatar">✨</div><div class="ak-bot-bubble">'+html+'</div>';
        area.appendChild(m);
        scrollDown(area);
        resolve(m);
      },700);
    },delay||0);
  });
}

function userMsg(area,txt){
  var m=document.createElement('div');
  m.className='ak-user-msg';
  m.innerHTML='<div class="ak-user-bubble">'+txt+'</div>';
  area.appendChild(m);
  scrollDown(area);
}

// Action bar is OUTSIDE the scroll container, fixed at bottom of panel
function actionBar(grid,buttons){
  // Remove existing bar
  var old=document.getElementById('ak-action-bar');
  if(old)old.remove();
  akBar=document.createElement('div');
  akBar.id='ak-action-bar';
  buttons.forEach(function(b){
    var btn=document.createElement('button');
    btn.className='ak-chat-btn'+(b.cls?' '+b.cls:'');
    btn.textContent=b.label;
    btn.addEventListener('click',b.fn);
    akBar.appendChild(btn);
  });
  // Append to the grid container (parent of scroll area) with position:relative
  grid.style.position='relative';
  grid.appendChild(akBar);
}

function removeBar(){
  var old=document.getElementById('ak-action-bar');
  if(old)old.remove();
  akBar=null;
}

function scrollDown(area){
  // Scroll the area's own container to bottom
  area.scrollTop=area.scrollHeight;
  // Also try parent elements
  var p=area.parentElement;
  while(p && p!==document.body){
    if(p.scrollHeight>p.clientHeight){
      p.scrollTop=p.scrollHeight;
    }
    p=p.parentElement;
  }
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
  // Find or create the scroll area (second child = chat panel)
  var ch=Array.from(grid.children),sa=null;
  ch.forEach(function(c,i){
    if(c.id==='ak-action-bar')return; // skip our bar
    if(i===1){c.style.display='';sa=c;}
    else{c.style.display='none';}
  });
  if(!sa&&ch[0]&&ch[0].id!=='ak-action-bar'){sa=ch[0];sa.style.display='';}
  if(!sa){sa=document.createElement('div');sa.style.cssText='flex:1;overflow-y:auto;';grid.appendChild(sa);}
  sa.style.overflowY='auto';
  sa.style.overflowX='hidden';
  sa.innerHTML='<div id="ak-chat-area"></div>';
  var area=sa.querySelector('#ak-chat-area');
  akState={};
  setTimeout(function(){step1(area,sa,grid);},300);
}

function step1(area,sa,grid){
  botMsg(area,'Hallo! Ich helfe dir bei der <strong>Bestellung von Arbeitskleidung</strong>. 👷').then(function(){
    botMsg(area,'Bitte wähle deine <strong>Abteilung</strong>:<select class="ak-select-inline" id="ak-abt"><option value="">-- Abteilung wählen --</option><option>Objektschutz</option><option>Revierdienst</option><option>Empfang &amp; Service</option><option>Veranstaltungsschutz</option><option>Luftsicherheit</option><option>Zentrale Dienste</option></select>',350).then(function(){
      botMsg(area,'Wähle <strong>Artikel</strong> (Mehrfachauswahl):<div class="ak-tile-grid" id="ak-art"><div class="ak-chat-tile" data-art="Sicherheitsjacke"><div class="ico">🧥</div>Sicherheitsjacke</div><div class="ak-chat-tile" data-art="Diensthose"><div class="ico">👖</div>Diensthose</div><div class="ak-chat-tile" data-art="Polo-Shirt"><div class="ico">👔</div>Polo-Shirt</div><div class="ak-chat-tile" data-art="Sicherheitsweste"><div class="ico">🦺</div>Sicherheitsweste</div><div class="ak-chat-tile" data-art="Einsatzstiefel"><div class="ico">👢</div>Einsatzstiefel</div><div class="ak-chat-tile" data-art="Schirmmütze"><div class="ico">🧢</div>Schirmmütze</div></div>',700).then(function(){
        var g=area.querySelector('#ak-art');
        if(g)g.addEventListener('click',function(e){var t=e.target.closest('.ak-chat-tile');if(t)t.classList.toggle('sel');});
        botMsg(area,'<select class="ak-select-inline" id="ak-gr"><option value="">-- Bestellgrund wählen --</option><option>Erstausstattung</option><option>Ersatzbeschaffung (Verschleiß)</option><option>Größenänderung</option><option>Neuer Einsatzbereich</option></select>',400).then(function(){
          actionBar(grid,[{label:'Weiter →',fn:function(){
            var a=area.querySelector('#ak-abt'),gr=area.querySelector('#ak-gr'),ts=area.querySelectorAll('.ak-chat-tile.sel');
            if(!a||!a.value){alert('Abteilung wählen');return;}
            if(!ts.length){alert('Artikel wählen');return;}
            if(!gr||!gr.value){alert('Bestellgrund wählen');return;}
            akState.abt=a.value;
            akState.art=Array.from(ts).map(function(t){return t.dataset.art;});
            akState.gr=gr.value;
            removeBar();
            userMsg(area,'📦 '+akState.art.join(', ')+' | '+akState.abt);
            step2(area,sa,grid);
          }}]);
        });
      });
    });
  });
}

function step2(area,sa,grid){
  var hO=akState.art.some(function(a){return['Sicherheitsjacke','Polo-Shirt','Sicherheitsweste'].indexOf(a)>-1;}),
      hH=akState.art.indexOf('Diensthose')>-1,
      hS=akState.art.indexOf('Einsatzstiefel')>-1,
      html='<strong>Größen &amp; Lieferung</strong><br><br>';
  if(hO)html+='<label class="ak-input-label">Oberteil / Jacke</label><select class="ak-select-inline" id="ak-ob"><option value="">Größe wählen</option><option>XS</option><option>S</option><option>M</option><option>L</option><option>XL</option><option>XXL</option><option>3XL</option></select>';
  if(hH)html+='<label class="ak-input-label">Hosenweite</label><select class="ak-select-inline" id="ak-ho"><option value="">Größe wählen</option><option>44</option><option>46</option><option>48</option><option>50</option><option>52</option><option>54</option><option>56</option><option>58</option></select>';
  if(hS)html+='<label class="ak-input-label">Schuhgröße</label><select class="ak-select-inline" id="ak-sc"><option value="">Größe wählen</option><option>38</option><option>39</option><option>40</option><option>41</option><option>42</option><option>43</option><option>44</option><option>45</option><option>46</option></select>';
  html+='<label class="ak-input-label">Lieferort</label><select class="ak-select-inline" id="ak-lo"><option value="">Standort wählen</option><option>Zentrale Essen</option><option>NL Hamburg</option><option>NL München</option><option>NL Berlin</option><option>NL Frankfurt</option></select>';
  html+='<label class="ak-input-label">Wunsch-Lieferdatum</label><input type="date" class="ak-date-input" id="ak-dt">';
  botMsg(area,html,350).then(function(){
    actionBar(grid,[
      {label:'← Zurück',cls:'secondary',fn:function(){removeBar();area.innerHTML='';akState={};step1(area,sa,grid);}},
      {label:'Weiter →',fn:function(){
        if(hO){var v=area.querySelector('#ak-ob');if(!v||!v.value){alert('Oberteil wählen');return;}akState.ob=v.value;}
        if(hH){var v2=area.querySelector('#ak-ho');if(!v2||!v2.value){alert('Hose wählen');return;}akState.ho=v2.value;}
        if(hS){var v3=area.querySelector('#ak-sc');if(!v3||!v3.value){alert('Schuh wählen');return;}akState.sc=v3.value;}
        var lo=area.querySelector('#ak-lo'),dt=area.querySelector('#ak-dt');
        if(!lo||!lo.value){alert('Lieferort wählen');return;}
        if(!dt||!dt.value){alert('Datum wählen');return;}
        akState.lo=lo.value;akState.dt=dt.value;
        removeBar();
        userMsg(area,'📏 Größen OK | 📍 '+akState.lo);
        step3(area,sa,grid);
      }}
    ]);
  });
}

function step3(area,sa,grid){
  var rows=[['Abteilung',akState.abt],['Artikel',akState.art.join(', ')],['Bestellgrund',akState.gr],['Lieferort',akState.lo],['Datum',akState.dt]];
  if(akState.ob)rows.push(['Oberteil',akState.ob]);
  if(akState.ho)rows.push(['Hose',akState.ho]);
  if(akState.sc)rows.push(['Schuh',akState.sc]);
  var tbl='<table class="ak-summary-table">'+rows.map(function(r){return'<tr><td>'+r[0]+'</td><td>'+r[1]+'</td></tr>';}).join('')+'</table>';
  botMsg(area,'<strong>Bestätigung</strong>'+tbl+'<label class="ak-input-label" style="margin-top:10px">Genehmiger</label><select class="ak-select-inline" id="ak-gen"><option value="">Wählen...</option><option value="Max Müller">Max Müller (Teamleiter)</option><option value="Sandra Schmidt">Sandra Schmidt (HR)</option><option value="Thomas Weber">Thomas Weber (Abt.-leiter)</option></select>',350).then(function(){
    actionBar(grid,[
      {label:'← Zurück',cls:'secondary',fn:function(){removeBar();step2(area,sa,grid);}},
      {label:'✅ Jetzt bestellen',cls:'green',fn:function(){
        var g=area.querySelector('#ak-gen');
        if(!g||!g.value){alert('Genehmiger wählen');return;}
        akState.gen=g.value;
        removeBar();
        userMsg(area,'✅ Bestätigt | '+akState.gen);
        success(area,sa,grid);
      }}
    ]);
  });
}

function success(area,sa,grid){
  var num='#AK-2026-'+Math.floor(1000+Math.random()*9000);
  akState.orderNum=num;
  botMsg(area,'<div class="ak-success-box"><div style="font-size:26px">🎉</div><div class="ak-order-num">'+num+'</div><div style="font-size:12px;color:#333">Bestellung erfolgreich eingereicht!</div></div>'+
    '<div style="font-size:11px;color:#555;margin-top:8px">📧 <strong>'+akState.gen+'</strong> wurde zur Genehmigung benachrichtigt.<br>'+
    '<em>Lieferung: '+akState.lo+' | '+akState.dt+'</em></div>',350).then(function(){
    setTimeout(function(){sendOrderEmail(num);},500);
    actionBar(grid,[{label:'Neue Bestellung',fn:function(){removeBar();area.innerHTML='';akState={};step1(area,sa,grid);}}]);
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
console.log('[AK-Flow] v1.5 ready ✅ (action bar outside scroll container)');
})();
