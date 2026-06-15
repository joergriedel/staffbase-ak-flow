(function(){
  'use strict';
  // AK-FLOW v1.9
 // Changes: hide agent start-screen, bigger fonts, email=joerg.riedel@staffbase.com

 if(!customElements.get('ak-flow-widget')){
     customElements.define('ak-flow-widget',class extends HTMLElement{
           connectedCallback(){this.innerHTML='<slot></slot>';}
     });
 }

 var AK_CSS=[
   '#ak-chat-area{display:flex;flex-direction:column;gap:10px;padding:10px 10px 4px 10px}',
   '.ak-bot-msg{display:flex;align-items:flex-start;gap:8px}',
   '.ak-bot-avatar{width:26px;height:26px;border-radius:50%;background:#003366;color:white;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;margin-top:2px}',
   '.ak-bot-bubble{background:#fff;border-radius:4px 16px 16px 16px;padding:10px 14px;font-size:14px;max-width:92%;box-shadow:0 1px 3px rgba(0,0,0,.1);line-height:1.5}',
   '.ak-user-msg{display:flex;justify-content:flex-end}',
   '.ak-user-bubble{background:#003366;color:white;border-radius:16px 4px 16px 16px;padding:9px 14px;font-size:14px;max-width:92%}',
   '.ak-tile-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:8px}',
   '.ak-chat-tile{border:2px solid #e0e0e0;border-radius:10px;padding:10px 6px;cursor:pointer;text-align:center;font-size:12px;background:#fff;transition:all .15s;line-height:1.3}',
   '.ak-chat-tile:hover{border-color:#003366;background:#f0f4ff}',
   '.ak-chat-tile.sel{border-color:#003366;background:#e8f0fe;color:#003366;font-weight:700}',
   '.ak-chat-tile .ico{font-size:22px;margin-bottom:3px;display:block}',
   '.ak-select-inline{width:100%;box-sizing:border-box;padding:8px 10px;border:2px solid #d0d7de;border-radius:8px;font-size:13px;background:#fff;margin-top:7px}',
   '.ak-input-label{font-size:12px;color:#555;font-weight:600;margin-top:9px;display:block}',
   '.ak-date-input{width:100%;box-sizing:border-box;padding:8px 10px;border:2px solid #d0d7de;border-radius:8px;font-size:13px;background:#fff;margin-top:3px}',
   '.ak-summary-table{width:100%;font-size:12px;border-collapse:collapse;margin-top:6px}',
   '.ak-summary-table td{padding:3px 0;border-bottom:1px solid #f0f0f0;color:#555}',
   '.ak-summary-table td:first-child{font-weight:600;color:#333;width:42%}',
   '.ak-success-box{background:#e8f5e9;border:1px solid #a5d6a7;border-radius:12px;padding:14px;text-align:center}',
   '.ak-success-box .ak-order-num{font-size:16px;font-weight:700;color:#003366;margin:5px 0}',
   '.ak-typing{display:flex;gap:4px;align-items:center;padding:3px 0}',
   '.ak-typing span{width:6px;height:6px;border-radius:50%;background:#999;animation:akBounce 1s infinite;display:inline-block}',
   '.ak-typing span:nth-child(2){animation-delay:.15s}',
   '.ak-typing span:nth-child(3){animation-delay:.3s}',
   '@keyframes akBounce{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-6px);opacity:1}}',
   '.ak-action-bar{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;padding-bottom:14px}',
   '.ak-chat-btn{padding:10px 20px;background:#003366;color:white;border:none;border-radius:20px;font-size:14px;font-weight:700;cursor:pointer;transition:opacity .15s;flex-shrink:0}',
   '.ak-chat-btn:hover{opacity:.85}',
   '.ak-chat-btn.secondary{background:#f0f4f8;color:#003366;border:2px solid #003366}',
   '.ak-chat-btn.green{background:#1a7f37}'
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

 function getStartScreen(grid){
     if(!grid)return null;
     for(var i=0;i<grid.children.length;i++){
           if(grid.children[i].classList.contains('row-start-2'))return grid.children[i];
     }
     return null;
 }

 function hideStartScreen(grid){
     var ss=getStartScreen(grid);
     if(ss){ss.dataset.akHidden='1';ss.style.display='none';}
 }

 function showStartScreen(grid){
     var ss=getStartScreen(grid);
     if(ss&&ss.dataset.akHidden){ss.style.display='';delete ss.dataset.akHidden;}
 }

 function getBtn(){
     var bs=document.querySelectorAll('button');
     for(var i=0;i<bs.length;i++){
           if(bs[i].textContent.toLowerCase().includes('arbeitskleidung'))return bs[i];
     }
     return null;
 }

 function installAutoScroll(grid){
     if(akScrollObs)akScrollObs.disconnect();
     akScrollObs=new MutationObserver(function(){
           requestAnimationFrame(function(){
                   if(grid.scrollHeight>grid.clientHeight)grid.scrollTop=grid.scrollHeight;
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
                   t.innerHTML='<div class="ak-bot-avatar">\u2728</div><div class="ak-bot-bubble"><div class="ak-typing"><span></span><span></span><span></span></div></div>';
                   area.appendChild(t);scrollToBottom(grid);
                   setTimeout(function(){
                             t.remove();
                             var m=document.createElement('div');
                             m.className='ak-bot-msg';
                             m.innerHTML='<div class="ak-bot-avatar">\u2728</div><div class="ak-bot-bubble">'+html+'</div>';
                             area.appendChild(m);scrollToBottom(grid);resolve(m);
                   },600);
           },delay||0);
     });
 }

 function userMsg(area,txt,grid){
     var m=document.createElement('div');
     m.className='ak-user-msg';
     m.innerHTML='<div class="ak-user-bubble">'+txt+'</div>';
     area.appendChild(m);scrollToBottom(grid);
 }

 function actionBar(area,grid,buttons){
     var bar=document.createElement('div');
     bar.className='ak-action-bar';
     buttons.forEach(function(b){
           var btn=document.createElement('button');
           btn.className='ak-chat-btn'+(b.cls?' '+b.cls:'');
           btn.textContent=b.label;btn.onclick=b.fn;
           bar.appendChild(btn);
     });
     area.appendChild(bar);scrollToBottom(grid);
     return bar;
 }

 function sendEmail(orderNum){
     var art=(akState.art||[]).join(', ');
     var sizes='';
     if(akState.ob)sizes+='Oberteil: '+akState.ob+' / ';
     if(akState.ho)sizes+='Hose: '+akState.ho+' / ';
     if(akState.sc)sizes+='Schuh: '+akState.sc;
     sizes=sizes.replace(/ \/ $/,'');
     var body='Bestellbestaetigung AK-Flow%0A%0ABestellnummer: '+orderNum+'%0AAbteilung: '+(akState.abt||'')+'%0AArtikel: '+encodeURIComponent(art)+'%0ABestellgrund: '+(akState.gr||'')+'%0AGroessen: '+encodeURIComponent(sizes)+'%0ALieferort: '+encodeURIComponent(akState.lo||'')+'%0ALieferdatum: '+(akState.dt||'')+'%0AGenehmiger: '+encodeURIComponent(akState.gen||'')+'%0A%0AMit freundlichen Gruessen%0AKoetter KI-Assistent';
     var subj='Bestellbestaetigung%20'+orderNum+'%20Arbeitskleidung';
     var link=document.createElement('a');
     link.href='mailto:joerg.riedel@staffbase.com?subject='+subj+'&body='+body;
     link.style.display='none';
     document.body.appendChild(link);link.click();
     setTimeout(function(){link.remove();},2000);
 }

 function step1(area,grid){
     akState={};
     botMsg(area,'<strong>Bestellung von Arbeitskleidung</strong> \ud83d\udc77',grid,0);
     botMsg(area,'Bitte w\u00e4hle deine <strong>Abteilung</strong>:<br><select class="ak-select-inline" id="ak-abt"><option value="">-- Abteilung w\u00e4hlen --</option><option>Objektschutz</option><option>Revierdienst</option><option>Empfang &amp; Service</option><option>Reinigung</option><option>Technik</option></select>',grid,300);
     botMsg(area,'W\u00e4hle <strong>Artikel</strong> (Mehrfachauswahl):<div class="ak-tile-grid"><div class="ak-chat-tile" data-art="Sicherheitsjacke"><span class="ico">\ud83e\udde5</span>Sicherheitsjacke</div><div class="ak-chat-tile" data-art="Diensthose"><span class="ico">\ud83d\udc56</span>Diensthose</div><div class="ak-chat-tile" data-art="Polo-Shirt"><span class="ico">\ud83d\udc55</span>Polo-Shirt</div><div class="ak-chat-tile" data-art="Sicherheitsweste"><span class="ico">\ud83e\uddb7</span>Sicherheitsweste</div><div class="ak-chat-tile" data-art="Einsatzstiefel"><span class="ico">\ud83e\udd7e</span>Einsatzstiefel</div><div class="ak-chat-tile" data-art="Schirmm\u00fctze"><span class="ico">\ud83e\udde2</span>Schirmm\u00fctze</div></div><br><label class="ak-input-label">Bestellgrund:</label><select class="ak-select-inline" id="ak-gr"><option value="">-- Bestellgrund --</option><option>Erstausstattung</option><option>Ersatz/Verschlei\u00df</option><option>Neue Stelle</option><option>Sonstiges</option></select>',grid,600);
     setTimeout(function(){
           var bubble=area.querySelector('.ak-tile-grid')?area.querySelector('.ak-tile-grid').closest('.ak-bot-bubble'):null;
           if(bubble){
                   bubble.querySelectorAll('.ak-chat-tile').forEach(function(tile){
                             tile.onclick=function(){
                                         tile.classList.toggle('sel');
                                         akState.art=Array.from(bubble.querySelectorAll('.ak-chat-tile.sel')).map(function(t){return t.dataset.art;});
                             };
                   });
           }
           actionBar(area,grid,[{label:'Weiter \u2192',fn:function(){
                   akState.abt=(document.getElementById('ak-abt')||{}).value||'';
                   akState.gr=(document.getElementById('ak-gr')||{}).value||'';
                   if(!akState.abt){alert('Bitte Abteilung w\u00e4hlen!');return;}
                   if(!akState.art||!akState.art.length){alert('Bitte mind. einen Artikel w\u00e4hlen!');return;}
                   if(!akState.gr){alert('Bitte Bestellgrund w\u00e4hlen!');return;}
                   userMsg(area,akState.abt+' | '+akState.art.join(', ')+' | '+akState.gr,grid);
                   step2(area,grid);
           }}]);
     },1600);
 }

 function step2(area,grid){
     var art=akState.art||[];
     var needOb=art.some(function(a){return['Sicherheitsjacke','Polo-Shirt','Sicherheitsweste'].includes(a);});
     var needHo=art.some(function(a){return a==='Diensthose';});
     var needSc=art.some(function(a){return a==='Einsatzstiefel';});
     var sizeHtml='';
     if(needOb)sizeHtml+='<label class="ak-input-label">Oberteil-Gr\u00f6\u00dfe</label><select class="ak-select-inline" id="ak-ob"><option value="">-- Gr\u00f6\u00dfe --</option><option>XS</option><option>S</option><option>M</option><option>L</option><option>XL</option><option>XXL</option><option>3XL</option></select>';
     if(needHo)sizeHtml+='<label class="ak-input-label">Hosen-Gr\u00f6\u00dfe</label><select class="ak-select-inline" id="ak-ho"><option value="">-- Gr\u00f6\u00dfe --</option><option>44</option><option>46</option><option>48</option><option>50</option><option>52</option><option>54</option><option>56</option><option>58</option></select>';
     if(needSc)sizeHtml+='<label class="ak-input-label">Schuh-Gr\u00f6\u00dfe</label><select class="ak-select-inline" id="ak-sc"><option value="">-- Gr\u00f6\u00dfe --</option><option>37</option><option>38</option><option>39</option><option>40</option><option>41</option><option>42</option><option>43</option><option>44</option><option>45</option><option>46</option></select>';
     botMsg(area,(sizeHtml?'<strong>Gr\u00f6\u00dfen</strong>:'+sizeHtml:'')+'<label class="ak-input-label">Lieferort</label><select class="ak-select-inline" id="ak-lo"><option value="">-- Standort --</option><option>Zentrale Essen</option><option>Filiale D\u00fcsseldorf</option><option>Filiale K\u00f6ln</option><option>Filiale Hamburg</option><option>Lager Bochum</option></select><label class="ak-input-label">Gew\u00fcnschtes Lieferdatum</label><input type="date" class="ak-date-input" id="ak-dt" min="'+new Date().toISOString().split('T')[0]+'">',grid,0);
     setTimeout(function(){
           actionBar(area,grid,[
             {label:'\u2190 Zur\u00fcck',cls:'secondary',fn:function(){while(area.lastChild)area.removeChild(area.lastChild);step1(area,grid);}},
             {label:'Weiter \u2192',fn:function(){
                       if(needOb)akState.ob=(document.getElementById('ak-ob')||{}).value||'';
                       if(needHo)akState.ho=(document.getElementById('ak-ho')||{}).value||'';
                       if(needSc)akState.sc=(document.getElementById('ak-sc')||{}).value||'';
                       akState.lo=(document.getElementById('ak-lo')||{}).value||'';
                       akState.dt=(document.getElementById('ak-dt')||{}).value||'';
                       if(needOb&&!akState.ob){alert('Bitte Oberteil-Gr\u00f6\u00dfe w\u00e4hlen!');return;}
                       if(needHo&&!akState.ho){alert('Bitte Hosen-Gr\u00f6\u00dfe w\u00e4hlen!');return;}
                       if(needSc&&!akState.sc){alert('Bitte Schuh-Gr\u00f6\u00dfe w\u00e4hlen!');return;}
                       if(!akState.lo){alert('Bitte Lieferort w\u00e4hlen!');return;}
                       if(!akState.dt){alert('Bitte Lieferdatum w\u00e4hlen!');return;}
                       var sizeTxt=[];
                       if(akState.ob)sizeTxt.push('Oberteil: '+akState.ob);
                       if(akState.ho)sizeTxt.push('Hose: '+akState.ho);
                       if(akState.sc)sizeTxt.push('Schuh: '+akState.sc);
                       userMsg(area,akState.lo+' | '+(sizeTxt.join(', ')||'k.A.')+' | '+akState.dt,grid);
                       step3(area,grid);
             }}
                 ]);
     },800);
 }

 function step3(area,grid){
     var art=akState.art||[];
     var rows='<tr><td>Abteilung</td><td>'+akState.abt+'</td></tr><tr><td>Artikel</td><td>'+art.join(', ')+'</td></tr><tr><td>Bestellgrund</td><td>'+akState.gr+'</td></tr>';
     if(akState.ob)rows+='<tr><td>Oberteil-Gr.</td><td>'+akState.ob+'</td></tr>';
     if(akState.ho)rows+='<tr><td>Hosen-Gr.</td><td>'+akState.ho+'</td></tr>';
     if(akState.sc)rows+='<tr><td>Schuh-Gr.</td><td>'+akState.sc+'</td></tr>';
     rows+='<tr><td>Lieferort</td><td>'+akState.lo+'</td></tr><tr><td>Lieferdatum</td><td>'+akState.dt+'</td></tr>';
     botMsg(area,'<strong>\u00dcbersicht deiner Bestellung:</strong><table class="ak-summary-table">'+rows+'</table><br><label class="ak-input-label">Genehmiger</label><select class="ak-select-inline" id="ak-gen"><option value="">-- Genehmiger w\u00e4hlen --</option><option>Max M\u00fcller</option><option>Anna Schmidt</option><option>Peter Weber</option><option>Lisa Fischer</option></select>',grid,0);
     setTimeout(function(){
           actionBar(area,grid,[
             {label:'\u2190 Zur\u00fcck',cls:'secondary',fn:function(){while(area.lastChild)area.removeChild(area.lastChild);step2(area,grid);}},
             {label:'\u2705 Jetzt bestellen',cls:'green',fn:function(){
                       akState.gen=(document.getElementById('ak-gen')||{}).value||'';
                       if(!akState.gen){alert('Bitte Genehmiger w\u00e4hlen!');return;}
                       userMsg(area,'Genehmiger: '+akState.gen,grid);
                       var orderNum='#AK-'+new Date().getFullYear()+'-'+Math.floor(1000+Math.random()*9000);
                       sendEmail(orderNum);
                       botMsg(area,'<div class="ak-success-box"><div style="font-size:26px;">\u2705</div><div class="ak-order-num">'+orderNum+'</div><div style="font-size:13px;color:#555;">Deine Bestellung wurde erfolgreich eingereicht und an deinen Genehmiger weitergeleitet.</div></div>',grid,400);
                       setTimeout(function(){
                                   actionBar(area,grid,[{label:'\ud83d\udd04 Neue Bestellung',fn:function(){
                                                 while(area.lastChild)area.removeChild(area.lastChild);
                                                 showStartScreen(grid);
                                                 step1(area,grid);
                                   }}]);
                       },1200);
             }}
                 ]);
     },800);
 }

 function startFlow(grid){
     css();
     var existing=document.getElementById('ak-chat-area');
     if(existing)existing.remove();
     hideStartScreen(grid);
     var area=document.createElement('div');
     area.id='ak-chat-area';
     grid.insertBefore(area,grid.firstChild);
     installAutoScroll(grid);
     step1(area,grid);
 }

 function attach(){
     var btn=getBtn();
     if(!btn||btn._ak)return;
     btn._ak=true;
     btn.addEventListener('click',function(e){
           e.stopPropagation();e.preventDefault();
           setTimeout(function(){var grid=getGrid();if(grid)startFlow(grid);},400);
     });
 }

 function watchAndAttach(){
     attach();
     if(akObs)akObs.disconnect();
     akObs=new MutationObserver(function(){attach();});
     akObs.observe(document.body,{childList:true,subtree:true});
 }

 if(document.readyState==='loading'){
     document.addEventListener('DOMContentLoaded',watchAndAttach);
 }else{
     watchAndAttach();
 }

})();
