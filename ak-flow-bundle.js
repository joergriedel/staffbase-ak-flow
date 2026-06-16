(function(){
  'use strict';
  // AK-FLOW v2.0
  // Changes: no Abteilung, Lieferort (Einsatzort/Zentrallager/Nach Hause), voraussichtliches Lieferdatum, notification card

  if(!customElements.get('ak-flow-widget')){
    customElements.define('ak-flow-widget',class extends HTMLElement{
      connectedCallback(){this.innerHTML='<slot></slot>';}
    });
  }

  var AK_CSS=[
    '#ak-chat-area{display:flex;flex-direction:column;gap:10px;padding:10px 10px 4px 10px}',
    '.ak-bot-msg{display:flex;align-items:flex-start;gap:8px}',
    '.ak-bot-avatar{width:26px;height:26px;border-radius:50%;background:#003366;color:white;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0}',
    '.ak-bot-bubble{background:#fff;border-radius:4px 16px 16px 16px;padding:10px 14px;font-size:14px;max-width:92%;box-shadow:0 1px 3px rgba(0,0,0,.1);line-height:1.5}',
    '.ak-user-msg{display:flex;justify-content:flex-end}',
    '.ak-user-bubble{background:#003366;color:white;border-radius:16px 4px 16px 16px;padding:9px 14px;font-size:14px;max-width:92%}',
    '.ak-tile-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:8px}',
    '.ak-chat-tile{border:2px solid #e0e0e0;border-radius:10px;padding:10px 6px;cursor:pointer;text-align:center;font-size:12px;background:#fff;transition:all .15s;line-height:1.4}',
    '.ak-chat-tile:hover{border-color:#003366;background:#f0f4ff}',
    '.ak-chat-tile.ak-selected{border-color:#003366;background:#e8f0fe;font-weight:600}',
    '.ak-tile-icon{font-size:22px;margin-bottom:5px;display:block}',
    '.ak-select-inline{width:100%;box-sizing:border-box;padding:8px 10px;border:2px solid #d0d7de;border-radius:8px;font-size:13px;margin-top:4px}',
    '.ak-select-inline:focus{outline:none;border-color:#003366}',
    '.ak-btn-row{display:flex;gap:8px;margin-top:8px;flex-wrap:wrap}',
    '.ak-btn{padding:9px 18px;border-radius:20px;border:none;cursor:pointer;font-size:13px;font-weight:600;transition:all .15s}',
    '.ak-btn-primary{background:#003366;color:#fff}',
    '.ak-btn-primary:hover{background:#002244}',
    '.ak-btn-secondary{background:#fff;color:#003366;border:2px solid #003366}',
    '.ak-btn-secondary:hover{background:#f0f4ff}',
    '.ak-label{font-size:13px;font-weight:600;color:#333;margin-bottom:4px;display:block;margin-top:8px}',
    '.ak-label:first-child{margin-top:0}',
    '.ak-summary-box{background:#f8faff;border:1px solid #d0d7de;border-radius:8px;padding:12px;font-size:13px;line-height:1.8}',
    '.ak-summary-row{display:flex;justify-content:space-between;border-bottom:1px solid #eee;padding:3px 0}',
    '.ak-summary-row:last-child{border-bottom:none}',
    '.ak-summary-key{color:#666;font-weight:500}',
    '.ak-summary-val{color:#003366;font-weight:600;text-align:right;max-width:60%}',
    '.ak-success-box{background:#e6f4ea;border:1px solid #a8d5b5;border-radius:10px;padding:14px;text-align:center;margin-top:8px}',
    '.ak-order-num{font-size:18px;font-weight:700;color:#003366;margin:6px 0}',
    '.ak-notification-card{background:#fff;border:1px solid #d0d7de;border-radius:10px;padding:14px;margin-top:10px;box-shadow:0 2px 8px rgba(0,0,0,.08)}',
    '.ak-notif-header{font-size:13px;font-weight:700;color:#003366;margin-bottom:8px;display:flex;align-items:center;gap:6px}',
    '.ak-notif-body{font-size:13px;color:#333;margin-bottom:12px;line-height:1.5}',
    '.ak-notif-actions{display:flex;gap:8px}',
    '.ak-btn-accept{background:#1a7f37;color:#fff;padding:8px 16px;border-radius:16px;border:none;cursor:pointer;font-size:12px;font-weight:600}',
    '.ak-btn-accept:hover{background:#155d27}',
    '.ak-btn-decline{background:#cf222e;color:#fff;padding:8px 16px;border-radius:16px;border:none;cursor:pointer;font-size:12px;font-weight:600}',
    '.ak-btn-decline:hover{background:#a10e1a}',
    '.ak-ss-hidden{display:none!important}',
    '#ak-chat-area *{box-sizing:border-box}'
  ];

  function addStyles(){
    if(document.getElementById('ak-flow-styles')) return;
    var s=document.createElement('style');
    s.id='ak-flow-styles';
    s.textContent=AK_CSS.join('');
    document.head.appendChild(s);
  }

  function addWorkingDays(date, days){
    var d=new Date(date);
    var added=0;
    while(added<days){
      d.setDate(d.getDate()+1);
      var dow=d.getDay();
      if(dow!==0&&dow!==6) added++;
    }
    return d;
  }

  function formatDate(d){
    var dd=String(d.getDate()).padStart(2,'0');
    var mm=String(d.getMonth()+1).padStart(2,'0');
    return dd+'.'+mm+'.'+d.getFullYear();
  }

  function generateOrderNum(){
    var y=new Date().getFullYear();
    var n=String(Math.floor(1000+Math.random()*9000));
    return '#AK-'+y+'-'+n;
  }

  function initFlow(container){
    addStyles();
    var articles=[
      {id:'jacke',icon:'🧥',label:'Sicherheitsjacke'},
      {id:'hose',icon:'👖',label:'Diensthose'},
      {id:'polo',icon:'👕',label:'Polo-Shirt'},
      {id:'weste',icon:'🦺',label:'Sicherheitsweste'},
      {id:'stiefel',icon:'🥾',label:'Einsatzstiefel'},
      {id:'muetze',icon:'🧢',label:'Schirmmütze'}
    ];
    var state={step:1,selectedArticles:[],bestellgrund:'',groesseOberteil:'',groesseHose:'',lieferort:'',genehmiger:'Jan Günther',orderNum:''};
    var chatArea=container.querySelector('#ak-chat-area');
    if(!chatArea){
      chatArea=document.createElement('div');
      chatArea.id='ak-chat-area';
      container.appendChild(chatArea);
    }

    // Hide agent start screen
    var observer=new MutationObserver(function(){
      var ss=document.querySelector('.ak-agent-start-screen, [class*="startScreen"], [class*="start-screen"]');
      if(ss&&state.step>0) ss.classList.add('ak-ss-hidden');
    });
    observer.observe(document.body,{childList:true,subtree:true});
    var ss=document.querySelector('.ak-agent-start-screen, [class*="startScreen"], [class*="start-screen"]');
    if(ss) ss.classList.add('ak-ss-hidden');

    function scrollToBottom(){
      setTimeout(function(){
        var scrollable=container.closest('[class*="chat"],[class*="Chat"],[class*="dialog"],[class*="Dialog"],[class*="panel"],[class*="Panel"]');
        if(scrollable) scrollable.scrollTop=scrollable.scrollHeight;
        container.scrollIntoView({behavior:'smooth',block:'end'});
      },50);
    }

    function botMsg(html){
      var div=document.createElement('div');
      div.className='ak-bot-msg';
      div.innerHTML='<div class="ak-bot-avatar">🤖</div><div class="ak-bot-bubble">'+html+'</div>';
      chatArea.appendChild(div);
      scrollToBottom();
      return div.querySelector('.ak-bot-bubble');
    }

    function userMsg(text){
      var div=document.createElement('div');
      div.className='ak-user-msg';
      div.innerHTML='<div class="ak-user-bubble">'+text+'</div>';
      chatArea.appendChild(div);
      scrollToBottom();
    }

    function clearButtons(){
      chatArea.querySelectorAll('.ak-btn-row,.ak-tile-grid').forEach(function(el){el.remove();});
    }

    function renderStep1(){
      state.step=1;
      botMsg('Wähle <strong>Artikel</strong> (Mehrfachauswahl):');
      var grid=document.createElement('div');
      grid.className='ak-tile-grid';
      articles.forEach(function(a){
        var tile=document.createElement('div');
        tile.className='ak-chat-tile';
        tile.dataset.id=a.id;
        tile.innerHTML='<span class="ak-tile-icon">'+a.icon+'</span>'+a.label;
        tile.onclick=function(){
          tile.classList.toggle('ak-selected');
          var idx=state.selectedArticles.indexOf(a.id);
          if(idx===-1) state.selectedArticles.push(a.id);
          else state.selectedArticles.splice(idx,1);
        };
        grid.appendChild(tile);
      });
      chatArea.appendChild(grid);

      var bubble=botMsg('<span class="ak-label">Bestellgrund:</span>');
      var sel=document.createElement('select');
      sel.className='ak-select-inline';
      sel.innerHTML='<option value="">-- Bestellgrund --</option><option>Erstausstattung</option><option>Ersatz-Verschleiß</option><option>Größenänderung</option><option>Sonstiges</option>';
      sel.onchange=function(){state.bestellgrund=sel.value;};
      bubble.appendChild(sel);

      var btnRow=document.createElement('div');
      btnRow.className='ak-btn-row';
      var btnWeiter=document.createElement('button');
      btnWeiter.className='ak-btn ak-btn-primary';
      btnWeiter.textContent='Weiter →';
      btnWeiter.onclick=function(){
        if(state.selectedArticles.length===0){alert('Bitte mindestens einen Artikel wählen.');return;}
        if(!state.bestellgrund){alert('Bitte Bestellgrund angeben.');return;}
        var labels=state.selectedArticles.map(function(id){return articles.find(function(a){return a.id===id;}).label;});
        userMsg(labels.join(', ')+' · '+state.bestellgrund);
        clearButtons();
        renderStep2();
      };
      btnRow.appendChild(btnWeiter);
      chatArea.appendChild(btnRow);
      scrollToBottom();
    }

    function renderStep2(){
      state.step=2;
      var needsOberteil=state.selectedArticles.some(function(id){return['jacke','polo','weste'].includes(id);});
      var needsHose=state.selectedArticles.includes('hose');

      var delivDate=addWorkingDays(new Date(),10);
      var bubble=botMsg('<strong>Größen & Lieferdetails</strong>');

      if(needsOberteil){
        var lbl=document.createElement('span');
        lbl.className='ak-label';lbl.textContent='Oberteil-Größe';
        bubble.appendChild(lbl);
        var selO=document.createElement('select');
        selO.className='ak-select-inline';
        selO.innerHTML='<option value="">-- Größe --</option><option>XS</option><option>S</option><option>M</option><option>L</option><option>XL</option><option>XXL</option>';
        selO.onchange=function(){state.groesseOberteil=selO.value;};
        bubble.appendChild(selO);
      }
      if(needsHose){
        var lbl2=document.createElement('span');
        lbl2.className='ak-label';lbl2.textContent='Hosen-Größe';
        bubble.appendChild(lbl2);
        var selH=document.createElement('select');
        selH.className='ak-select-inline';
        selH.innerHTML='<option value="">-- Größe --</option><option>44</option><option>46</option><option>48</option><option>50</option><option>52</option><option>54</option>';
        selH.onchange=function(){state.groesseHose=selH.value;};
        bubble.appendChild(selH);
      }

      var lblL=document.createElement('span');
      lblL.className='ak-label';lblL.textContent='Lieferort';
      bubble.appendChild(lblL);
      var selL=document.createElement('select');
      selL.className='ak-select-inline';
      selL.innerHTML='<option value="">-- Standort --</option><option>Einsatzort</option><option>Zentrallager</option><option>Nach Hause</option>';
      selL.onchange=function(){state.lieferort=selL.value;};
      bubble.appendChild(selL);

      var lblD=document.createElement('span');
      lblD.className='ak-label';lblD.textContent='Voraussichtliches Lieferdatum';
      bubble.appendChild(lblD);
      var dateInfo=document.createElement('div');
      dateInfo.style.cssText='font-size:14px;font-weight:600;color:#003366;padding:8px 10px;background:#f0f4ff;border-radius:8px;margin-top:4px';
      dateInfo.textContent=formatDate(delivDate)+' (ca. 10 Werktage)';
      state.lieferdatum=formatDate(delivDate);
      bubble.appendChild(dateInfo);

      var btnRow=document.createElement('div');
      btnRow.className='ak-btn-row';
      var btnBack=document.createElement('button');
      btnBack.className='ak-btn ak-btn-secondary';
      btnBack.textContent='← Zurück';
      btnBack.onclick=function(){
        state.selectedArticles=[];state.bestellgrund='';state.groesseOberteil='';state.groesseHose='';state.lieferort='';
        chatArea.innerHTML='';
        renderStep1();
      };
      var btnWeiter=document.createElement('button');
      btnWeiter.className='ak-btn ak-btn-primary';
      btnWeiter.textContent='Weiter →';
      btnWeiter.onclick=function(){
        if(needsOberteil&&!state.groesseOberteil){alert('Bitte Oberteil-Größe wählen.');return;}
        if(needsHose&&!state.groesseHose){alert('Bitte Hosen-Größe wählen.');return;}
        if(!state.lieferort){alert('Bitte Lieferort wählen.');return;}
        var parts=[];
        if(state.groesseOberteil) parts.push('Oberteil '+state.groesseOberteil);
        if(state.groesseHose) parts.push('Hose '+state.groesseHose);
        parts.push(state.lieferort);
        userMsg(parts.join(' · '));
        clearButtons();
        renderStep3();
      };
      btnRow.appendChild(btnBack);btnRow.appendChild(btnWeiter);
      chatArea.appendChild(btnRow);
      scrollToBottom();
    }

    function renderStep3(){
      state.step=3;
      var labels=state.selectedArticles.map(function(id){return articles.find(function(a){return a.id===id;}).label;});
      var rows='';
      rows+='<div class="ak-summary-row"><span class="ak-summary-key">Artikel</span><span class="ak-summary-val">'+labels.join(', ')+'</span></div>';
      rows+='<div class="ak-summary-row"><span class="ak-summary-key">Bestellgrund</span><span class="ak-summary-val">'+state.bestellgrund+'</span></div>';
      if(state.groesseOberteil) rows+='<div class="ak-summary-row"><span class="ak-summary-key">Oberteil</span><span class="ak-summary-val">'+state.groesseOberteil+'</span></div>';
      if(state.groesseHose) rows+='<div class="ak-summary-row"><span class="ak-summary-key">Hose</span><span class="ak-summary-val">'+state.groesseHose+'</span></div>';
      rows+='<div class="ak-summary-row"><span class="ak-summary-key">Lieferort</span><span class="ak-summary-val">'+state.lieferort+'</span></div>';
      rows+='<div class="ak-summary-row"><span class="ak-summary-key">Lieferdatum</span><span class="ak-summary-val">'+state.lieferdatum+'</span></div>';
      rows+='<div class="ak-summary-row"><span class="ak-summary-key">Genehmiger</span><span class="ak-summary-val">'+state.genehmiger+'</span></div>';

      var bubble=botMsg('<strong>Zusammenfassung deiner Bestellung:</strong><div class="ak-summary-box" style="margin-top:8px">'+rows+'</div>');

      var btnRow=document.createElement('div');
      btnRow.className='ak-btn-row';
      var btnBack=document.createElement('button');
      btnBack.className='ak-btn ak-btn-secondary';
      btnBack.textContent='← Zurück';
      btnBack.onclick=function(){
        state.groesseOberteil='';state.groesseHose='';state.lieferort='';
        chatArea.querySelectorAll('.ak-bot-msg:last-of-type,.ak-btn-row').forEach(function(el){el.remove();});
        renderStep2();
      };
      var btnSubmit=document.createElement('button');
      btnSubmit.className='ak-btn ak-btn-primary';
      btnSubmit.textContent='✅ Bestellung absenden';
      btnSubmit.onclick=function(){
        state.orderNum=generateOrderNum();
        userMsg('Bestellung abgesendet');
        clearButtons();
        renderSuccess();
        sendMailto();
      };
      btnRow.appendChild(btnBack);btnRow.appendChild(btnSubmit);
      chatArea.appendChild(btnRow);
      scrollToBottom();
    }

    function sendMailto(){
      var labels=state.selectedArticles.map(function(id){return articles.find(function(a){return a.id===id;}).label;});
      var body='Neue Bestellung '+state.orderNum+'%0A%0A';
      body+='Artikel: '+labels.join(', ')+'%0A';
      body+='Bestellgrund: '+state.bestellgrund+'%0A';
      if(state.groesseOberteil) body+='Oberteil: '+state.groesseOberteil+'%0A';
      if(state.groesseHose) body+='Hose: '+state.groesseHose+'%0A';
      body+='Lieferort: '+state.lieferort+'%0A';
      body+='Lieferdatum: '+state.lieferdatum+'%0A';
      body+='Genehmiger: '+state.genehmiger;
      var mailto='mailto:joerg.riedel@staffbase.com?subject=Bestellung%20Arbeitskleidung%20'+state.orderNum+'&body='+body;
      var a=document.createElement('a');a.href=mailto;a.style.display='none';
      document.body.appendChild(a);a.click();
      setTimeout(function(){document.body.removeChild(a);},1000);
    }

    function renderSuccess(){
      state.step=4;
      botMsg('<div class="ak-success-box">🎉 <strong>Bestellung erfolgreich!</strong><div class="ak-order-num">'+state.orderNum+'</div><div style="font-size:12px;color:#555">Deine Bestellung wurde erfasst und wird bearbeitet.</div></div>');

      var labels=state.selectedArticles.map(function(id){return articles.find(function(a){return a.id===id;}).label;});
      var notifCard=document.createElement('div');
      notifCard.className='ak-notification-card';
      notifCard.innerHTML='<div class="ak-notif-header">🔔 Genehmigungsanfrage</div><div class="ak-notif-body">Hallo <strong>'+state.genehmiger+'</strong>,<br>eine neue Bestellung ('+state.orderNum+') über <strong>'+labels.join(', ')+'</strong> wartet auf deine Freigabe.</div><div class="ak-notif-actions"><button class="ak-btn-accept" onclick="this.closest(\'.ak-notification-card\').innerHTML=\'<span style=\\"color:#1a7f37;font-weight:600\\">✅ Bestellung genehmigt!</span>\'">&#x2705; Annehmen</button><button class="ak-btn-decline" onclick="this.closest(\'.ak-notification-card\').innerHTML=\'<span style=\\"color:#cf222e;font-weight:600\\">❌ Bestellung abgelehnt.</span>\'">&#x274C; Ablehnen</button></div>';
      chatArea.appendChild(notifCard);
      scrollToBottom();
    }

    renderStep1();
  }

function getAkContainer(){
  var panel=document.querySelector('[data-testid="ai-assistant-view"]');
  if(!panel) return null;
  var scrollArea=panel.querySelector('[class*="overflow-y-auto"]');
  return scrollArea||null;
}

function attachAkButton(){
  var btn=Array.from(document.querySelectorAll('button')).find(function(b){
    return b.textContent.trim()==='Arbeitskleidung bestellen';
  });
  if(btn&&!btn.dataset.akAttached){
    btn.dataset.akAttached='1';
    btn.addEventListener('click',function(e){
      e.stopImmediatePropagation();
      e.preventDefault();
      setTimeout(function(){
        var container=getAkContainer();
        if(container&&!container.dataset.akInit){
          container.dataset.akInit='1';
          // Hide footer input
          var footer=document.querySelector('[data-testid="ai-assistant-footer"]');
          if(footer) footer.style.display='none';
          initFlow(container);
        }
      },50);
    },true);
    return true;
  }
  return false;
}

if(!attachAkButton()){
  var mo=new MutationObserver(function(muts,obs){
    if(attachAkButton()) obs.disconnect();
  });
  mo.observe(document.body,{childList:true,subtree:true});
  setTimeout(function(){mo.disconnect();},30000);
}
