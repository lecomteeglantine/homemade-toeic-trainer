/* ============================================================
   HT TOEIC KIT — v28 P3 linguistic quality release
   Audio speed, strategies, gamification + root-site audit fixes.
   No dependency. Local data only (localStorage).
   ============================================================ */
(function(){
  "use strict";

  var LS={speed:"htoeic_speed_v1",gamify:"htoeic_gamify_v1"};
  function $(sel,root){return (root||document).querySelector(sel);}
  function $all(sel,root){return Array.prototype.slice.call((root||document).querySelectorAll(sel));}
  function el(tag,props,kids){
    var n=document.createElement(tag),k,d;
    if(props){for(k in props){
      if(k==="class") n.className=props[k];
      else if(k==="text") n.textContent=props[k];
      else if(k==="html") n.innerHTML=props[k];
      else if(k.indexOf("on")===0&&typeof props[k]==="function") n.addEventListener(k.slice(2),props[k]);
      else if(k==="dataset"){for(d in props[k]) n.dataset[d]=props[k][d];}
      else n.setAttribute(k,props[k]);
    }}
    (kids||[]).forEach(function(c){if(c!=null)n.appendChild(typeof c==="string"?document.createTextNode(c):c);});
    return n;
  }
  function load(key,fallback){try{var v=localStorage.getItem(key);return v==null?fallback:JSON.parse(v);}catch(e){return fallback;}}
  function save(key,val){try{localStorage.setItem(key,JSON.stringify(val));}catch(e){}}
  function todayKey(){var d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
  function hash(s){var h=2166136261>>>0;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
  function seeded(seed){return function(){seed=seed+0x6D2B79F5|0;var t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
  function shuffle(a,rng){var b=a.slice(),r=rng||Math.random;for(var i=b.length-1;i>0;i--){var j=Math.floor(r()*(i+1)),t=b[i];b[i]=b[j];b[j]=t;}return b;}
  function positions(n,rng){
    var a=[],i,tries=0,r=rng||Math.random;
    for(i=0;i<n;i++)a.push(i%4);
    do{a=shuffle(a,r);tries++;}while(tries<80&&a.some(function(x,k){return k>1&&a[k-1]===x&&a[k-2]===x;}));
    return a;
  }
  function placeCorrect(q,pos,rng,clone){
    if(!q||!Array.isArray(q.opts)||q.opts.length<2||typeof q.a!=="number")return q;
    var correct=q.opts[q.a],rest=q.opts.filter(function(_,i){return i!==q.a;}),r=rng||Math.random;
    rest=shuffle(rest,r);var p=Math.max(0,Math.min(q.opts.length-1,pos));rest.splice(p,0,correct);
    var out=clone?Object.assign({},q):q;out.opts=rest;out.a=p;return out;
  }
  function balancedClone(arr,rng){var r=rng||Math.random,pos=positions(arr.length,r);return arr.map(function(q,i){return placeCorrect(q,pos[i],r,true);});}

  var HT=window.HT=window.HT||{};

  /* ---------- Audio speed / speech ---------- */
  var SPEEDS=[0.75,1,1.25],speedState=load(LS.speed,1);
  if(SPEEDS.indexOf(speedState)===-1)speedState=1;
  HT.speed={
    get:function(){return speedState;},
    set:function(v){v=parseFloat(v);if(SPEEDS.indexOf(v)===-1)v=1;speedState=v;save(LS.speed,v);$all("[data-ht-speed]").forEach(HT.speed.mount);var live=$("#ht-speed-live");if(live)live.textContent="Vitesse d'écoute : "+v+"×";},
    mount:function(container){if(!container)return;container.innerHTML="";var group=el("div",{class:"ht-seg",role:"group","aria-label":"Vitesse d'écoute"});SPEEDS.forEach(function(s){group.appendChild(el("button",{type:"button",class:"ht-seg-btn"+(s===speedState?" is-on":""),"aria-pressed":s===speedState?"true":"false",text:s===1?"1×":s+"×",onclick:function(){HT.speed.set(s);}}));});container.appendChild(el("span",{class:"ht-seg-label",text:"🔊 Vitesse"}));container.appendChild(group);if(!$("#ht-speed-live"))container.appendChild(el("span",{id:"ht-speed-live",class:"ht-sr","aria-live":"polite"}));},
    enableGlobal:function(){if(!("speechSynthesis" in window)||speechSynthesis.__htPatched)return;try{var orig=speechSynthesis.speak.bind(speechSynthesis);speechSynthesis.speak=function(u){try{if(u&&u.__htRate!==false&&!u.__htFixed)u.rate=speedState;}catch(e){}return orig(u);};speechSynthesis.__htPatched=true;}catch(e){}}
  };
  HT.speak=function(text,opts){opts=opts||{};if(!("speechSynthesis" in window))return false;try{speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(text);u.lang=opts.lang||"en-US";u.rate=opts.rate!=null?opts.rate:speedState;if(opts.rate!=null)u.__htFixed=true;var voices=speechSynthesis.getVoices()||[],prefix=(u.lang||"en").slice(0,2).toLowerCase(),v=voices.filter(function(x){return x.lang&&x.lang.toLowerCase().indexOf(prefix)===0;});if(opts.lang){var exact=voices.filter(function(x){return x.lang&&x.lang.toLowerCase()===opts.lang.toLowerCase();});if(exact.length)v=exact;}if(v.length)u.voice=v[0];speechSynthesis.speak(u);return true;}catch(e){return false;}};
  HT.stop=function(){try{speechSynthesis.cancel();}catch(e){}};
  document.addEventListener("click",function(e){var b=e.target.closest&&e.target.closest(".ht-play, .ht-replay");if(!b)return;var txt=b.getAttribute("data-ht-text");if(txt)HT.speak(txt,{lang:b.getAttribute("data-ht-lang")||"en-US"});});

  /* ---------- Strategies ---------- */
  HT.STRATEGIES=[
    {part:"Partie 1",titre:"Photographies",strat:"Décris l'ACTION visible, pas ce que tu imagines. Élimine toute phrase dont l'action est fausse, même si un mot est correct.",repere:"le verbe (souvent en -ing) et qui fait quoi.",astuce:"Méfie-toi des mots proches : office / officer, copy / coffee."},
    {part:"Partie 2",titre:"Question / Réponse",strat:"Repère le mot interrogatif dès le début : il commande la réponse logique.",repere:"where → lieu · when → temps · who → personne · why → raison · how → manière.",astuce:"Une réponse qui répète un mot entendu est souvent un piège."},
    {part:"Partie 3",titre:"Conversations",strat:"Lis les 3 questions AVANT d'écouter : tu sais quoi guetter.",repere:"qui parle ? où ? que veut / propose la personne ?",astuce:"Les réponses suivent en général l'ordre des questions."},
    {part:"Partie 4",titre:"Exposés & annonces",strat:"Une seule voix : identifie d'abord le type (annonce, message vocal, météo, pub).",repere:"le but du message, le public visé, l'action demandée.",astuce:"L'information est souvent reformulée."},
    {part:"Partie 5",titre:"Phrases à compléter",strat:"Regarde d'abord la FORME attendue (grammaire) avant le sens.",repere:"la place du mot manquant : nom, verbe, adjectif, adverbe ?",astuce:"Les 4 options testent souvent la même racine."},
    {part:"Partie 6",titre:"Textes à compléter",strat:"Lis tout le court texte : c'est la cohérence d'ensemble qui guide le choix.",repere:"connecteurs, temps des verbes, et la phrase entière à insérer.",astuce:"La phrase à insérer doit suivre logiquement ce qui précède."},
    {part:"Partie 7",titre:"Compréhension de textes",strat:"Scanne les mots-clés de la question, puis retrouve-les dans le texte.",repere:"dates, noms propres, chiffres, mots-clés.",astuce:"Textes multiples = croise les documents et surveille le temps."}
  ];
  HT.renderStrategies=function(container){if(!container)return;container.innerHTML="";var grid=el("div",{class:"ht-strat-grid"});HT.STRATEGIES.forEach(function(s){grid.appendChild(el("article",{class:"ht-card"},[el("div",{class:"ht-card-tag",text:s.part}),el("h3",{class:"ht-card-title",text:s.titre}),el("p",{class:"ht-line"},[el("strong",{text:"Stratégie : "}),document.createTextNode(s.strat)]),el("p",{class:"ht-line"},[el("strong",{text:"À repérer : "}),document.createTextNode(s.repere)]),el("p",{class:"ht-line ht-tip"},[el("strong",{text:"💡 Astuce : "}),document.createTextNode(s.astuce)])]));});container.appendChild(grid);};

  /* ---------- Gamification ---------- */
  var RANKS=[{min:0,name:"Apprenti·e"},{min:100,name:"Explorateur·rice"},{min:300,name:"Habitué·e"},{min:600,name:"Confirmé·e"},{min:1000,name:"Avancé·e"},{min:1600,name:"Expert·e"},{min:2500,name:"TOEIC Master"}];
  var BADGES=[{id:"first_diag",emoji:"🧭",label:"Premier diagnostic"},{id:"streak7",emoji:"🔥",label:"7 jours d'affilée",counter:"streak",threshold:7},{id:"words50",emoji:"📚",label:"50 mots appris",counter:"words",threshold:50},{id:"q100",emoji:"🎯",label:"100 questions",counter:"questions",threshold:100},{id:"mock1",emoji:"⏱️",label:"Première simulation",counter:"mocks",threshold:1},{id:"perfect",emoji:"⭐",label:"Leçon sans-faute"},{id:"early",emoji:"🌅",label:"Lève-tôt"},{id:"q500",emoji:"🏆",label:"500 questions",counter:"questions",threshold:500}];
  var DEFAULT={v:3,xp:0,daily:{},dailyQ:{},badges:{},counters:{questions:0,words:0,mocks:0,streak:0},rewardKeys:{}};
  var g=load(LS.gamify,null)||JSON.parse(JSON.stringify(DEFAULT));g.daily=g.daily||{};g.dailyQ=g.dailyQ||{};g.badges=g.badges||{};g.counters=g.counters||{questions:0,words:0,mocks:0,streak:0};g.rewardKeys=g.rewardKeys||{};g.v=3;save(LS.gamify,g);
  function gsave(){save(LS.gamify,g);}function rankOf(xp){var idx=0;for(var i=0;i<RANKS.length;i++)if(xp>=RANKS[i].min)idx=i;var cur=RANKS[idx],next=RANKS[idx+1]||null,pct=next?Math.round((xp-cur.min)/(next.min-cur.min)*100):100;return{idx:idx,name:cur.name,cur:cur.min,next:next?next.min:null,nextName:next?next.name:null,pct:pct};}
  function announce(msg){var n=$("#ht-xp-live");if(n)n.textContent=msg;}function toast(msg){var t=el("div",{class:"ht-toast",text:msg});document.body.appendChild(t);requestAnimationFrame(function(){t.classList.add("show");});setTimeout(function(){t.classList.remove("show");setTimeout(function(){t.remove();},300);},2600);}
  function unlock(id){if(g.badges[id])return;var bd=BADGES.filter(function(x){return x.id===id;})[0];g.badges[id]=true;gsave();if(bd)toast("🏅 Badge débloqué : "+bd.emoji+" "+bd.label);refresh();}
  function checkBadges(){BADGES.forEach(function(bd){if(bd.counter&&!g.badges[bd.id]&&(g.counters[bd.counter]||0)>=bd.threshold)unlock(bd.id);});}
  HT.xp={
    state:function(){return g;},
    add:function(points,reason){points=parseInt(points,10)||0;if(points<=0)return;/* completion bonus: once/day, prevents replay farming */if(reason&&/examen blanc|simulation/i.test(reason)){var key=todayKey()+"|"+reason;if(g.rewardKeys[key])return;g.rewardKeys[key]=1;}g.xp+=points;var t=todayKey();g.daily[t]=(g.daily[t]||0)+points;gsave();checkBadges();refresh();announce("+"+points+" XP"+(reason?" ("+reason+")":"")+". Total : "+g.xp+" XP.");},
    inc:function(counter,by){by=by==null?1:by;g.counters[counter]=(g.counters[counter]||0)+by;if(counter==="questions"){var tq=todayKey();g.dailyQ[tq]=(g.dailyQ[tq]||0)+by;var hr=new Date().getHours();if(hr>=4&&hr<8)unlock("early");}gsave();checkBadges();refresh();},
    set:function(counter,val){g.counters[counter]=parseInt(val,10)||0;gsave();checkBadges();refresh();},unlock:unlock,rank:function(){return rankOf(g.xp);},
    weekly:function(){var out=[],names=["dim","lun","mar","mer","jeu","ven","sam"];for(var i=6;i>=0;i--){var d=new Date();d.setDate(d.getDate()-i);var key=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");out.push({key:key,label:names[d.getDay()],xp:g.daily[key]||0,qn:g.dailyQ[key]||0});}return out;},
    reset:function(){g=JSON.parse(JSON.stringify(DEFAULT));gsave();refresh();},renderDashboard:function(container){if(container)renderGamify(container);}
  };
  function renderGamify(container){container.innerHTML="";var r=rankOf(g.xp),wrap=el("div",{class:"ht-gam"}),head=el("div",{class:"ht-gam-head"},[el("div",{class:"ht-rank"},[el("span",{class:"ht-rank-name",text:r.name}),el("span",{class:"ht-xp-total",text:g.xp+" XP"})])]),bar=el("div",{class:"ht-bar",role:"progressbar","aria-valuemin":"0","aria-valuemax":"100","aria-valuenow":String(r.pct),"aria-label":"Progression vers le rang suivant"},[el("span",{class:"ht-bar-fill"})]);bar.querySelector(".ht-bar-fill").style.width=r.pct+"%";head.appendChild(bar);head.appendChild(el("div",{class:"ht-rank-next",text:r.next!=null?"Prochain rang : "+r.nextName+" — encore "+(r.next-g.xp)+" XP":"Rang maximum atteint 🎉"}));wrap.appendChild(head);var wk=HT.xp.weekly(),maxXp=Math.max(1,Math.max.apply(null,wk.map(function(d){return d.xp;}))),weekTotal=wk.reduce(function(a,d){return a+d.xp;},0),weekQ=wk.reduce(function(a,d){return a+(d.qn||0);},0),recap=el("section",{class:"ht-week"},[el("div",{class:"ht-week-head"},[el("strong",{text:"Cette semaine"}),el("span",{class:"ht-week-total",text:weekTotal+" XP"})])]),bars=el("div",{class:"ht-week-bars"});wk.forEach(function(d){var col=el("div",{class:"ht-wb"}),h=Math.round(d.xp/maxXp*100),fill=el("div",{class:"ht-wb-fill"});fill.style.height=(d.xp>0?Math.max(6,h):2)+"%";col.appendChild(el("div",{class:"ht-wb-track"},[fill]));col.appendChild(el("div",{class:"ht-wb-label",text:d.label}));col.title=d.xp+" XP";bars.appendChild(col);});recap.appendChild(bars);recap.appendChild(el("div",{class:"ht-week-q",text:"🎯 "+weekQ+" question"+(weekQ>1?"s":"")+" cette semaine"}));wrap.appendChild(recap);var bsec=el("section",{class:"ht-badges"},[el("strong",{text:"Badges"})]),bgrid=el("div",{class:"ht-badge-grid"});BADGES.forEach(function(bd){var got=!!g.badges[bd.id];bgrid.appendChild(el("div",{class:"ht-badge"+(got?" is-on":""),title:bd.label+(got?" — débloqué":" — verrouillé")},[el("span",{class:"ht-badge-emo",text:got?bd.emoji:"🔒"}),el("span",{class:"ht-badge-lab",text:bd.label})]));});bsec.appendChild(bgrid);wrap.appendChild(bsec);if(!$("#ht-xp-live"))wrap.appendChild(el("span",{id:"ht-xp-live",class:"ht-sr","aria-live":"polite"}));container.appendChild(wrap);}
  function refresh(){$all("[data-ht-gamify]").forEach(renderGamify);}

  /* ============================================================
     ROOT SITE AUDIT FIXES
     ============================================================ */
  function rootSite(){return !!document.getElementById("startDiag")&&!!window.TOEIC_BANK;}

  function rebalanceSharedBank(){
    var bank=window.TOEIC_BANK&&window.TOEIC_BANK.QUESTIONS;if(!Array.isArray(bank)||!bank.length)return;
    var r=seeded(hash(todayKey()+"|HTBANK22")),pos=positions(bank.length,r);
    bank.forEach(function(q,i){placeCorrect(q,pos[i],r,false);});
  }
  function rebalanceFullMock(){
    if(typeof FULLMOCK==="undefined"||!FULLMOCK)return;
    ["listening","reading"].forEach(function(section,si){var qs=[];(FULLMOCK[section]||[]).forEach(function(b){(b.qs||[]).forEach(function(q){qs.push(q);});});var r=seeded(hash(todayKey()+"|FULLMOCK22|"+si)),pos=positions(qs.length,r);qs.forEach(function(q,i){placeCorrect(q,pos[i],r,false);});});
  }
  function stratifiedSample(arr,n){
    var groups={},out=[],r=seeded(hash(todayKey()+"|DIAG22|"+Date.now()));arr.forEach(function(q){var k=q.dom||"Autre";(groups[k]=groups[k]||[]).push(q);});Object.keys(groups).forEach(function(k){groups[k]=shuffle(groups[k],r);});var names=shuffle(Object.keys(groups),r),round=0;while(out.length<n&&names.length){var progressed=false;for(var i=0;i<names.length&&out.length<n;i++){var q=groups[names[i]][round];if(q){out.push(q);progressed=true;}}if(!progressed)break;round++;}if(out.length<n){var rest=arr.filter(function(q){return out.indexOf(q)<0;});out=out.concat(shuffle(rest,r).slice(0,n-out.length));}return shuffle(out,r).slice(0,n);
  }
  function installDiagnosticFix(){
    var btn=document.getElementById("startDiag");
    if(!btn||btn.__ht25)return;
    btn.__ht25=true;
    btn.addEventListener("click",function(e){e.preventDefault();e.stopImmediatePropagation();location.href="diagnostic-toeic.html";},true);
  }

  function installScoreFix(){
    /* v25: no home-made conversion to an ETS /990 score. */
    if(typeof window.estimateScore==="function") window.estimateScore=function(){return null;};
  }
  function patchScoreCopy(){
    $all("#dashboard .pill").forEach(function(x){if(/Score TOEIC estimé|Score indicatif/i.test(x.textContent))x.textContent="Dernier mini-diagnostic";});
    var c=document.getElementById("confLine");if(c)c.textContent=c.textContent.replace(/Estimation[^·]*/i,"Résultat diagnostique");
    var acc=document.getElementById("stAcc");if(acc){var stat=acc.closest(".mini-stat"),lab=stat&&stat.querySelector(".l");if(lab)lab.textContent="réussite au dernier diagnostic";}
    var streak=document.getElementById("stStreak");if(streak){var st=streak.closest(".mini-stat"),sl=st&&st.querySelector(".l");if(sl)sl.textContent="jours d'activité d'affilée";}
  }


  function installLocalDateFix(){
    if(typeof window.todayStr==="function")window.todayStr=todayKey;
    if(typeof window.touchStreak==="function"){
      window.touchStreak=function(){try{if(typeof Store==="undefined")return;var s=Store.get("streak",{last:null,count:0}),t=todayKey();if(s.last===t)return;var y=new Date();y.setDate(y.getDate()-1);var yk=y.getFullYear()+"-"+String(y.getMonth()+1).padStart(2,"0")+"-"+String(y.getDate()).padStart(2,"0");s.count=s.last===yk?s.count+1:1;s.last=t;Store.set("streak",s);if(window.HT&&HT.xp)HT.xp.set("streak",s.count);}catch(e){}};
    }
  }
  function installRecordFix(){
    if(typeof window.recordAnswer!=="function")return;
    window.recordAnswer=function(skill,ok){
      try{if(typeof Store==="undefined")return;var st=Store.get("skills",{});if(!st[skill])st[skill]={ok:0,n:0};st[skill].n++;if(ok)st[skill].ok++;Store.set("skills",st);var gg=Store.get("global",{ok:0,n:0});gg.n++;if(ok)gg.ok++;Store.set("global",gg);var t=(typeof todayStr==="function"?todayStr():todayKey()),d=Store.get("daily",{date:t,count:0});if(d.date!==t){d.date=t;d.count=0;}d.count++;Store.set("daily",d);if(window.HT&&HT.xp){if(ok)HT.xp.add(5,"question");HT.xp.inc("questions");}}catch(e){}
    };
  }

  function installExamFix(){
    if(typeof window.startExam==="function"){
      window.startExam=function(n,secs){if(typeof QUESTIONS==="undefined")return;var pool=shuffle(QUESTIONS.slice(),Math.random).slice(0,n);pool=balancedClone(pool,Math.random);exam={pool:pool,i:0,sel:new Array(pool.length).fill(null),left:secs,endAt:Date.now()+secs*1000,timer:null,w60:false,w10:false};document.getElementById("chronoMenu").hidden=true;document.getElementById("chronoResult").hidden=true;document.getElementById("chronoRun").hidden=false;exam.timer=setInterval(window.tickExam,250);window.tickExam();renderExamQ();};
      window.tickExam=function(){if(typeof exam==="undefined"||!exam)return;exam.left=Math.max(0,Math.ceil((exam.endAt-Date.now())/1000));var t=document.getElementById("examTimer");if(t){t.textContent=fmtTime(exam.left);t.style.color=exam.left<=60?"var(--coral)":"var(--ink)";}if(exam.left<=60&&!exam.w60){exam.w60=true;if(typeof toast==="function")toast("1 minute restante");}if(exam.left<=10&&!exam.w10){exam.w10=true;if(typeof toast==="function")toast("10 secondes !");}if(exam.left<=0){clearInterval(exam.timer);finishExam(true);}};
    }
    if(typeof window.mockSections==="function"&&typeof FULLMOCK!=="undefined"){
      window.mockSections=function(){function count(blocks){return(blocks||[]).reduce(function(n,b){return n+((b.qs||[]).length);},0);}var ln=count(FULLMOCK.listening),rn=count(FULLMOCK.reading);return[{name:"Écoute",icon:"&#127911;",note:"Mini-simulation des Parties 1 à 4 — "+ln+" questions originales. Le vrai TOEIC comporte environ 45 min et 100 questions d'écoute.",secs:Math.max(180,ln*35),blocks:FULLMOCK.listening},{name:"Lecture",icon:"&#128214;",note:"Mini-simulation des Parties 5 à 7 — "+rn+" questions originales. Le vrai TOEIC comporte 75 min et 100 questions de lecture.",secs:Math.max(180,rn*55),blocks:FULLMOCK.reading}];};
    }
    if(typeof window.startSection==="function"){
      window.startSection=function(){if(typeof mock==="undefined"||!mock)return;var s=mock.secs[mock.si];mock.bi=0;mock.left=s.secs;mock.endAt=Date.now()+s.secs*1000;mock.__played=mock.__played||{};mock.__w60=false;if(mock.timer)clearInterval(mock.timer);mock.timer=setInterval(window.tickMock,250);window.tickMock();window.renderMockBlock();};
      window.tickMock=function(){if(typeof mock==="undefined"||!mock)return;mock.left=Math.max(0,Math.ceil((mock.endAt-Date.now())/1000));var t=document.getElementById("mockTimer");if(t){t.textContent=fmtTime(mock.left);t.style.color=mock.left<=60?"var(--coral)":"var(--ink)";}if(mock.left<=60&&!mock.__w60){mock.__w60=true;if(typeof toast==="function")toast("1 minute restante dans cette section");}if(mock.left<=0){clearInterval(mock.timer);endSection();}};
    }
    if(typeof window.renderMockBlock==="function"){
      var oldR=window.renderMockBlock;window.renderMockBlock=function(){var v=oldR.apply(this,arguments);setTimeout(enforceMockAudio,0);return v;};
    }
  }
  function enforceMockAudio(){
    try{if(typeof mock==="undefined"||!mock||mock.si!==0)return;mock.__played=mock.__played||{};var host=document.getElementById("chronoRun");if(!host)return;$all("details",host).forEach(function(d){d.hidden=true;});if(!$ (".ht-exam-audio-note",host)){var note=document.createElement("div");note.className="note ht-exam-audio-note";note.style.marginBottom="10px";note.textContent="Mode simulation : transcription masquée et chaque audio n'est disponible qu'une fois. Les explications restent disponibles au bilan.";var card=$(".card",host);if(card)card.insertBefore(note,card.children[1]||null);}
      var blockKey=mock.si+"-"+mock.bi;var play=$all("button",host).find(function(b){return /Écouter/.test(b.textContent||"")&&!b.closest(".opt");});if(play){if(mock.__played[blockKey]){play.disabled=true;play.textContent="✓ Audio déjà écouté";}else{play.addEventListener("click",function(){mock.__played[blockKey]=1;setTimeout(function(){play.disabled=true;play.textContent="✓ Audio écouté";},0);},{once:true});}}
      $all(".audio-btn",host).forEach(function(ab,idx){var k=blockKey+"-opt-"+idx;if(mock.__played[k]){ab.setAttribute("aria-disabled","true");ab.setAttribute("tabindex","-1");ab.style.pointerEvents="none";ab.style.opacity=".45";}else{var lock=function(){mock.__played[k]=1;setTimeout(function(){ab.setAttribute("aria-disabled","true");ab.setAttribute("tabindex","-1");ab.style.pointerEvents="none";ab.style.opacity=".45";},0);};ab.addEventListener("click",lock,{once:true});ab.addEventListener("keydown",function(ev){if(ev.key==="Enter"||ev.key===" ")lock();},{once:true});}});
    }catch(e){}
  }

  function patchChronoCopy(){
    var menu=document.getElementById("chronoMenu");if(menu){$all("h3",menu).forEach(function(h){if(/TOEIC blanc complet/i.test(h.textContent))h.textContent="Mini TOEIC blanc structuré";});$all("button",menu).forEach(function(b){if(/Lancer le TOEIC blanc complet/i.test(b.textContent))b.textContent="Lancer la mini-simulation";});$all("p",menu).forEach(function(p){if(/Les 7 parties du TOEIC en deux sections/i.test(p.textContent))p.textContent="Échantillon structuré des 7 parties en deux sections chronométrées, avec bilan par partie. Ce n'est pas un TOEIC complet de 200 questions.";});}
    $all('[data-nav="chrono"]').forEach(function(b){if(/Passer un TOEIC blanc complet/i.test(b.textContent))b.textContent="Ouvrir la mini-simulation structurée";});
    var modal=document.querySelector('a[href="modal-galaxy-explorer.html"]');if(modal){var p=modal.querySelector("p");if(p&&/96 questions/i.test(p.textContent))p.textContent=p.textContent.replace(/96 questions[^.]*\.?/i,"112 questions dans la banque, avec 12 questions tirées par mission et des réponses A/B/C/D équilibrées.");}
  }
  function wrapChronoMenu(){if(typeof window.renderChronoMenu!=="function")return;var old=window.renderChronoMenu;window.renderChronoMenu=function(){var v=old.apply(this,arguments);patchChronoCopy();return v;};}

  function patchStress(){
    if(typeof STRESS==="undefined"||!Array.isArray(STRESS))return;var lines={record:"Please record the record.",permit:"They permit each visitor to show a permit.",contract:"They contract a company to manage the contract.",export:"They export every export by sea.",present:"I present the present to the client.",object:"I object to moving the object.",project:"They project the figures for the project.",increase:"We expect sales to increase after the increase.",decrease:"Costs may decrease after the decrease.",produce:"The farm will produce fresh produce.",conduct:"They conduct a review of professional conduct."};STRESS.forEach(function(p){var k=(p.say&&p.say[0]||"").toLowerCase();if(lines[k])p.say[0]=lines[k];});var pron=document.getElementById("pronBody");if(pron){var first=pron.querySelector(".card");if(first)$all(".audio-btn",first).forEach(function(b){b.setAttribute("aria-label","Écouter les deux accents dans une phrase");});}
  }

  function patchA11y(){
    var panel=document.getElementById("panel");if(!panel)return;var lastOpener=null;[document.getElementById("openSettings"),document.getElementById("aboutA11y")].forEach(function(b){if(b)b.addEventListener("click",function(){lastOpener=b;});});function mirror(){ $all('[role="switch"]',panel).forEach(function(b){b.setAttribute("aria-checked",b.getAttribute("aria-pressed")==="true"?"true":"false");});}mirror();var mo=new MutationObserver(mirror);mo.observe(panel,{subtree:true,attributes:true,attributeFilter:["aria-pressed"]});
    document.addEventListener("keydown",function(e){if(!panel.classList.contains("open"))return;if(e.key==="Tab"){var focusables=$all('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',panel).filter(function(x){return x.offsetParent!==null;});if(!focusables.length)return;var first=focusables[0],last=focusables[focusables.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}if(e.key==="Escape"&&lastOpener)setTimeout(function(){lastOpener.focus();},320);});var close=document.getElementById("closePanel"),bg=document.getElementById("panelBg");[close,bg].forEach(function(x){if(x)x.addEventListener("click",function(){if(lastOpener)setTimeout(function(){lastOpener.focus();},320);});});
  }

  function patchDailyChallenge(){
    var body=document.getElementById("djBody");if(!body)return;function run(){var cards=$all(".dj-q",body);if(!cards.length)return;var bank=window.TOEIC_BANK&&window.TOEIC_BANK.QUESTIONS||[],r=seeded(hash(todayKey()+"|DAILY22")),targets=shuffle([0,1,2,3],r).slice(0,Math.min(4,cards.length));cards.forEach(function(card,ci){if(card.dataset.htBalanced)return;var qt=card.querySelector(".qt"),text=(qt?qt.textContent:"").replace(/^Q\d+\.\s*/,"").trim(),q=bank.find(function(x){return(x.stem||"").trim()===text;});if(!q)return;var group=card.querySelector(".dj-opts"),buttons=$all(".dj-opt",group),correct=buttons.find(function(b){return +b.getAttribute("data-o")===q.a;});if(!correct)return;var others=shuffle(buttons.filter(function(b){return b!==correct;}),r),target=targets[ci%targets.length],ordered=others.slice();ordered.splice(target,0,correct);ordered.forEach(function(b,i){group.appendChild(b);var k=b.querySelector(".k");if(k)k.textContent="ABCD"[i];});card.dataset.htBalanced="1";});}
    var mo=new MutationObserver(run);mo.observe(body,{childList:true,subtree:true});run();
  }

  function init(){
    HT.speed.enableGlobal();$all("[data-ht-speed]").forEach(HT.speed.mount);$all("[data-ht-strategy]").forEach(HT.renderStrategies);$all("[data-ht-gamify]").forEach(renderGamify);if("speechSynthesis" in window){try{speechSynthesis.getVoices();}catch(e){}}
    if(rootSite()){
      rebalanceSharedBank();rebalanceFullMock();installLocalDateFix();installDiagnosticFix();installScoreFix();installRecordFix();installExamFix();wrapChronoMenu();patchChronoCopy();patchStress();patchA11y();patchDailyChallenge();patchScoreCopy();
    }
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();


/* ============================================================
   P1 RELEASE v26 — cumulative root overrides
   Keeps the original toolkit (speed, strategies, XP) and replaces
   only the remaining fragile homepage behaviours.
   ============================================================ */
(function(){"use strict";
const $=(s,r)=>(r||document).querySelector(s), $$=(s,r)=>Array.from((r||document).querySelectorAll(s));
const dayKey=(d=new Date())=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const progressKeys=["l1toeic.v1","htoeic_gamify_v1","htoeic_errors_v1","toeicDaily_v1","ht_toeic_diagnostic_v3","CORP_MYSTERIES_V2","CORP_MYSTERIES_V1","HT_TOEIC_KINGDOM_V1","HT_SURVIVAL_ISLAND_V1","zombieGrammarSurvival_v1","zombieGrammarSurvival_v2","detectiveAcademy_v1","detectiveAcademy_v2","toeicEscapeGame_v1","toeicEscapeGame_v2","grammarTimeMachine_v1","grammarTimeMachine_v2","phrasalVerbCity_v1","phrasalVerbCity_v2","modalGalaxyExplorer_v1","modalGalaxyExplorer_v2","toeicSentenceBuilder_v1","htt_pron","ht_accent","htoeic_speed_v1"];
window.HT=window.HT||{};HT.PROGRESS_KEYS=progressKeys;HT.localDateKey=dayKey;
HT.resetAllProgress=function(){let keep={};try{let root=JSON.parse(localStorage.getItem("l1toeic.v1")||"{}");keep.a11y=root.a11y;keep.target=root.target;keep.dailyGoal=root.dailyGoal}catch(e){}progressKeys.forEach(k=>{try{localStorage.removeItem(k)}catch(e){}});try{let root={};if(keep.a11y)root.a11y=keep.a11y;if(keep.target!=null)root.target=keep.target;if(keep.dailyGoal!=null)root.dailyGoal=keep.dailyGoal;localStorage.setItem("l1toeic.v1",JSON.stringify(root))}catch(e){}};
function diagDB(){try{return JSON.parse(localStorage.getItem("ht_toeic_diagnostic_v3")||"null")}catch(e){return null}}
function fixBankSemantics(){let B=window.TOEIC_BANK;if(!B||!Array.isArray(B.QUESTIONS))return;let find=id=>B.QUESTIONS.find(q=>q&&q.id===id),x=find("X02-003");if(x){x.stem="According to the published opening schedule, the new branch ____ on 3 September.";x.opts=["opened","will open","has opened","opens"];x.a=3;x.why="A published timetable or schedule can use the present simple for a fixed future event: the branch opens on 3 September.";x.skill="Présent simple pour horaire futur";}x=find("D10-001");if(x){x.stem="The prize money was distributed ____ all members of the winning team.";x.opts=["between","among","beside","across"];x.a=1;x.why="Among is natural for distribution within a group. 'Between = two only' is not a universal rule.";}x=find("X08-011");if(x&&Array.isArray(x.opts))x.opts=x.opts.map(v=>v==="asster"?"assert":v);}
function redirectDiagnostic(e){let b=e.target.closest&&e.target.closest('[data-nav="diagnostic"]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();location.href="diagnostic-toeic.html";}
function replaceDiagSection(){let s=$("#diagnostic");if(!s)return;s.innerHTML='<span class="eyebrow">Diagnostic</span><h1>Mini-diagnostic TOEIC Listening &amp; Reading</h1><div class="card"><span class="pill teal">24 questions · Parts 1 à 7</span><h3 style="margin-top:12px">Un vrai diagnostic court, séparé de l’entraînement</h3><p>12 questions de Listening et 12 de Reading. Le résultat repère tes points forts et faibles sans conversion artificielle en score TOEIC.</p><a class="btn primary" href="diagnostic-toeic.html">Démarrer le diagnostic</a></div>';}
function renderDashboardV3(){if(typeof Store==="undefined")return;let db=diagDB(),r=db&&db.lastResult,empty=$("#dashEmpty"),full=$("#dashFull");if(!empty||!full)return;empty.hidden=!!r;full.hidden=!r;if(!r){let p=empty.querySelector("p");if(p)p.textContent="Tu verras ici ton dernier résultat de diagnostic, ta progression d'entraînement et les compétences à renforcer.";return;}let pct=Math.round(r.ok/r.n*100),g=$("#scoreGauge");if(g)g.innerHTML='<div style="font:800 3rem var(--display);color:var(--blue)">'+r.ok+' / '+r.n+'</div><div style="font-weight:700">'+pct+' %</div><div class="disclaimer">Listening '+r.listening.ok+'/12 · Reading '+r.reading.ok+'/12</div>';let pill=g&&g.parentElement.querySelector(".pill");if(pill)pill.textContent="Dernier mini-diagnostic";if($("#confLine"))$("#confLine").textContent=(r.band&&r.band.label?r.band.label:"Diagnostic terminé")+" · "+(r.when||"")+" · aucune conversion artificielle en score TOEIC";let obj=$("#targetInput")&&$("#targetInput").closest(".card");if(obj){let h=obj.querySelector("h3");if(h)h.textContent="Mon objectif officiel";if($("#gapLine"))$("#gapLine").textContent="Ton objectif officiel reste un repère personnel. Le mini-diagnostic ne prétend pas prédire ce score.";let j=obj.querySelector(".journey");if(j)j.hidden=true;}let streak=Store.get("streak",{count:0}),glob=Store.get("global",{n:0}),mw=Store.get("mywords",[]);if($("#stStreak"))$("#stStreak").textContent=streak.count||0;if($("#stAnswered"))$("#stAnswered").textContent=glob.n||0;if($("#stWords"))$("#stWords").textContent=(mw||[]).length;if($("#stAcc"))$("#stAcc").textContent=pct+"%";let al=$("#stAcc")&&$("#stAcc").parentElement.querySelector(".l");if(al)al.textContent="réussite au dernier diagnostic";let bars=$("#skillBars"),weak={p:null,pct:101};if(bars){bars.innerHTML="";for(let p=1;p<=7;p++){let v=(r.byPart||{})[String(p)]||{ok:0,n:0},pp=v.n?Math.round(v.ok/v.n*100):0;if(pp<weak.pct)weak={p:p,pct:pp};let row=document.createElement("div");row.className="skill";row.innerHTML='<div class="h"><span>Part '+p+'</span><span class="v">'+v.ok+' / '+v.n+' · '+pp+'%</span></div><div class="bar"><i style="width:'+pp+'%"></i></div>';bars.appendChild(row);}}if($("#nextStepLine"))$("#nextStepLine").innerHTML='Priorité conseillée : <strong>Part '+(weak.p||"—")+'</strong>.';let goal=Store.get("dailyGoal",10),d=Store.get("daily",{date:dayKey(),count:0}),done=d.date===dayKey()?d.count:0;if($("#goalInput"))$("#goalInput").value=goal;if($("#goalBar"))$("#goalBar").style.width=Math.min(100,Math.round(done/goal*100))+"%";if($("#goalLine"))$("#goalLine").textContent=done+" / "+goal+" aujourd'hui";}
function scrubLegacyCopy(){
  
  let about=$("#about p");if(about)about.textContent=about.textContent.replace(/et un score estimé\.?/i,"et un suivi de progression.");
  let empty=$("#dashEmpty p");if(empty)empty.textContent="Tu verras ici ton dernier résultat de diagnostic, ta progression et les compétences à renforcer.";
}
function patchRoot(){fixBankSemantics();replaceDiagSection();scrubLegacyCopy();document.addEventListener("click",redirectDiagnostic,true);if(typeof window.todayStr==="function")window.todayStr=dayKey;if(typeof window.estimateScore==="function")window.estimateScore=()=>null;if(typeof window.renderDashboard==="function")window.renderDashboard=renderDashboardV3;let reset=$("#resetData");if(reset)document.addEventListener("click",e=>{if(!(e.target.closest&&e.target.closest("#resetData")))return;e.preventDefault();e.stopImmediatePropagation();if(confirm("Effacer toute la progression Homemade TOEIC Trainer sur cet appareil ? Les réglages d'accessibilité et ton objectif sont conservés.")){HT.resetAllProgress();renderDashboardV3();if(typeof go==="function")go("home");if(typeof toast==="function")toast("Progression TOEIC réinitialisée")}},true);$$("[data-nav='chrono']").forEach(b=>{if(/TOEIC blanc complet/i.test(b.textContent))b.textContent=b.textContent.replace(/Passer un TOEIC blanc complet/i,"Ouvrir la mini-simulation TOEIC")});try{let v=sessionStorage.getItem("ht_open_view");if(v&&typeof go==="function"){sessionStorage.removeItem("ht_open_view");setTimeout(()=>go(v),0)}}catch(e){}}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",patchRoot);else patchRoot();
})();


/* ============================================================
   P1 v26 — storage / copy / PWA hardening
   ============================================================ */
(function(){"use strict";
const $=(s,r)=>(r||document).querySelector(s), $$=(s,r)=>Array.from((r||document).querySelectorAll(s));
function onRoot(){return /(?:^|\/)homemade-toeic-trainer\/?(?:index\.html)?$/.test(location.pathname);}
function replaceText(root,rx,repl){if(!root)return;const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){if(rx.test(n.nodeValue||""))n.nodeValue=(n.nodeValue||"").replace(rx,repl);}}
function cleanHomepageCopy(){
  if(!onRoot())return;
  const home=$("#home"), about=$("#about"), dashboard=$("#dashboard"), chrono=$("#chrono");
  replaceText(home,/un score estimé qui progresse avec toi/gi,"un suivi de progression qui évolue avec toi");
  replaceText(home,/repérer ton point faible et estimer ton score/gi,"repérer tes points forts et les parties à renforcer");
  replaceText(home,/Le score affiché est une estimation pédagogique, pas un score officiel\./gi,"Les résultats d'entraînement et de diagnostic sont pédagogiques et ne constituent pas un score officiel TOEIC.");
  replaceText(about,/du vocabulaire avec audio et un score estimé/gi,"du vocabulaire avec audio et un suivi de progression");
  replaceText(about,/Le score affiché est une estimation, pas un résultat officiel\./gi,"Les résultats affichés sont des indicateurs pédagogiques, pas des résultats officiels.");
  replaceText(document.querySelector('footer'),/Score = estimation pédagogique\./gi,"Résultats = indicateurs pédagogiques.");
  replaceText(document,/Passer un TOEIC blanc complet/gi,"Ouvrir la mini-simulation TOEIC");
  replaceText(document,/TOEIC blanc complet \(structuré\)/gi,"Mini-simulation TOEIC structurée");
  replaceText(document,/Examen blanc/gi,"Mini-simulation");
  if(dashboard){
    const h=[...dashboard.querySelectorAll('h3,.pill')].find(x=>/Score TOEIC estimé/i.test(x.textContent||''));if(h)h.textContent='Dernier mini-diagnostic';
    replaceText(dashboard,/Estimation — indice de confiance\s*:?\s*—?/gi,"Résultat diagnostique");
    replaceText(dashboard,/Tu verras ici ton score estimé/gi,"Tu verras ici ton dernier résultat diagnostique");
  }
  if(chrono){const h=chrono.querySelector('h1');if(h&&/Mode chronométré/i.test(h.textContent))h.textContent='Mini-simulation chronométrée';}
  // Public card may still describe old Modal build.
  const modal=document.querySelector('a[href="modal-galaxy-explorer.html"] p');
  if(modal)modal.textContent=modal.textContent.replace(/96 questions style TOEIC/gi,'112 questions dans la banque, 12 tirées par mission');
}
function hardenReset(){
  if(!onRoot())return;
  const btn=$("#resetData");if(!btn)return;
  btn.setAttribute('title','Efface toutes les données de progression Homemade TOEIC Trainer, sans toucher aux autres sites du domaine.');
}
function exposeDataAPI(){
  window.HT=window.HT||{};
  HT.backupKeys=function(){return (HT.PROGRESS_KEYS||[]).slice();};
  HT.progressSnapshot=function(){const out={};HT.backupKeys().forEach(k=>{try{const v=localStorage.getItem(k);if(v!==null)out[k]=v}catch(e){}});return out;};
}
function addUpdateNotice(){
  if(!onRoot()||!("serviceWorker" in navigator))return;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{try{if(sessionStorage.getItem('ht_sw_reloaded_v28'))return;sessionStorage.setItem('ht_sw_reloaded_v28','1');location.reload();}catch(e){}});
}
function init(){exposeDataAPI();cleanHomepageCopy();hardenReset();addUpdateNotice();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();


/* ============================================================
   P3 v28 — human linguistic audit + bank hygiene + recommendations
   ============================================================ */
(function(){"use strict";
const $=(s,r)=>(r||document).querySelector(s), $$=(s,r)=>Array.from((r||document).querySelectorAll(s));
function norm(s){return String(s||"").trim().toLowerCase().replace(/\s+/g," ");}

function applyLinguisticAudit(B){
  if(!B)return {questions:0,vocab:0};
  var Q=Array.isArray(B.QUESTIONS)?B.QUESTIONS:[], V=Array.isArray(B.VOCAB)?B.VOCAB:[];
  function by(id){return Q.find(function(q){return q&&q.id===id});}
  function setQ(id,data){var q=by(id);if(q)Object.keys(data).forEach(function(k){q[k]=data[k];});}
  function setDx(id,dx){var q=by(id);if(q)q.dx=dx;}
  // P2 fixes retained.
  setQ("X02-003",{stem:"According to the published opening schedule, the new branch ____ on 3 September.",opts:["opened","will open","has opened","opens"],a:3,why:"Un horaire ou calendrier officiel peut employer le présent simple pour un événement futur fixé : the branch opens on 3 September.",skill:"Présent simple pour horaire futur"});
  setQ("D10-001",{stem:"The prize money was distributed ____ all members of the winning team.",opts:["between","among","beside","across"],a:1,why:"Among est naturel pour une distribution au sein d'un groupe. Évite la fausse règle « between = deux seulement » : between peut aussi s'employer avec plus de deux éléments lorsque les relations sont considérées individuellement."});
  var x=by("X08-011");if(x&&Array.isArray(x.opts))x.opts=x.opts.map(function(v){return v==="asster"?"assert":v});
  setQ("I08-001",{dom:"Stratégie",skill:"Réponse indirecte — entraînement Part 2",why:"Cet item écrit entraîne la logique d'une réponse indirecte de Part 2 ; il ne mesure pas la compréhension orale."});
  setQ("J03-002",{dom:"Stratégie",skill:"Inférence — entraînement Part 7",why:"Cet item court entraîne une inférence de lecture ; il ne remplace pas une véritable question Part 7 sur document."});
  setQ("L08-001",{stem:"Au TOEIC, que vaut-il mieux faire si tu hésites entre plusieurs réponses ?",opts:["Laisser la case vide","Choisir quand même une réponse","Sauter toute la partie","Répondre deux fois"],a:1,why:"Il n'y a pas de pénalité supplémentaire pour une mauvaise réponse : mieux vaut répondre à chaque question que laisser une case vide.",skill:"Toujours répondre"});

  // P3 human linguistic audit — remove ambiguous distractors and improve context.
  setQ("E10-001",{stem:"After reviewing all the evidence, the committee will ____ its final decision.",opts:["perform","make","do","give"],a:1,why:"Make a decision est la collocation standard. En anglais britannique, take a decision existe aussi : il n'est donc volontairement pas utilisé comme distracteur.",skill:"Décisions"});
  setQ("E13-001",{stem:"The marketing team will ____ a survey of existing clients.",opts:["make","do","conduct","pass"],a:2,why:"Conduct a survey = mener une enquête."});
  setQ("E20-001",{stem:"Could you ____ the minutes during the meeting?",opts:["make","take","bring","hold"],a:1,why:"Take the minutes = rédiger le compte rendu officiel d'une réunion. En anglais britannique, do the minutes existe également : do a donc été retiré des distracteurs.",skill:"Réunions"});
  setQ("F08-001",{stem:"Please ____ this form before the interview.",opts:["bring up","back up","fill in","run out"],a:2,why:"Fill in a form est la formulation britannique courante ; fill out est également fréquent, notamment en anglais américain.",skill:"Fill in"});
  setQ("G06-001",{stem:"In “The shipment arrived a day early”, “shipment” is closest to:",opts:["consignment","payment","supplier","invoice"],a:0,why:"Dans ce contexte, shipment désigne l'envoi / la cargaison : consignment est le synonyme le plus précis."});
  setQ("G16-001",{stem:"In “The meeting will resume at 2 p.m.”, “resume” is closest to:",opts:["finish","continue","summarise","reduce"],a:1,why:"Comme verbe, resume = continue/restart, reprendre après une interruption. À ne pas confondre avec le nom résumé / CV."});
  setQ("G18-001",{stem:"In “Guests receive complimentary breakfast”, “complimentary” is closest to:",opts:["expensive","free","optional","damaged"],a:1,why:"Dans ce contexte, complimentary = free of charge, offert. Le mot peut aussi signifier « élogieux » dans d'autres contextes."});
  setQ("G19-001",{stem:"In “Thank you for your prompt reply”, “prompt” is closest to:",opts:["late","careful","quick","polite"],a:2,why:"Dans prompt reply, prompt signifie rapide / sans délai."});
  setQ("G26-001",{stem:"In “We are recruiting for a vacant position”, “vacant” is closest to:",opts:["available","busy","new","clean"],a:0,why:"A vacant position est un poste disponible / non pourvu."});
  setQ("G33-001",{stem:"“Innovative” is closest to:",opts:["traditional","new and original","cheap","reliable"],a:1,why:"Innovative décrit quelque chose qui introduit des idées ou méthodes nouvelles et originales."});
  setQ("G36-001",{stem:"« Refreshments will be provided » signifie :",opts:["Drinks and light snacks will be available","Guests must bring their own food","The café will be closed","An extra fee will be charged"],a:0,why:"Refreshments désigne des boissons et de petites collations servies lors d'un événement."});
  setQ("C11-001",{stem:"Yesterday, he said he ____ finish the report by the following Friday.",opts:["will","would","is","has"],a:1,why:"Dans ce récit au passé, le futur vu depuis le passé se formule avec would : will → would."});
  setQ("D40-001",{why:"Whether introduit une question indirecte oui/non. Une alternative explicite avec or est possible, mais elle n'est pas obligatoire."});
  setQ("X03-001",{stem:"If you confirm this booking today, we ____ you a 10% discount on this order.",opts:["offer","will offer","offered","would offer"],a:1,why:"Conséquence future réelle et ponctuelle : if + présent, puis will + base verbale."});
  setQ("X05-001",{stem:"The team worked ____ to meet the deadline.",opts:["hard","hardly","hardness","hard-working"],a:0,why:"Hard est ici l'adverbe qui signifie « avec beaucoup d'effort ». Hardly signifie « à peine » ; hardness est un nom et hard-working un adjectif."});
  setQ("X07-001",{stem:"After two hours of discussion, the committee finally ____ a decision.",opts:["reached","did","held","put"],a:0,why:"Reach a decision = parvenir à une décision. Cela évite de dupliquer l'item make a decision."});
  setQ("X07-002",{stem:"Could you ____ an appointment with the dentist for next Tuesday?",opts:["schedule","take","do","put"],a:0,why:"Schedule an appointment = fixer / programmer un rendez-vous."});
  setQ("X07-004",{stem:"We need to ____ costs without cutting quality.",opts:["fall","reduce","decline","go down"],a:1,why:"Reduce est transitif et peut prendre directement costs comme complément. Fall, decline et go down s'emploient ici sans objet direct."});
  setQ("X07-007",{stem:"Because of the customs delay, the supplier ____ the deadline.",opts:["missed","lost","failed","passed"],a:0,why:"Miss a deadline = ne pas respecter / dépasser une date limite."});
  setQ("X07-008",{stem:"Our goal is to ____ customer satisfaction.",opts:["rise","improve","lift","grow"],a:1,why:"Improve customer satisfaction est une collocation naturelle en anglais professionnel."});
  setQ("X08-001",{stem:"Only full-time staff are ____ for the travel allowance.",opts:["eligible","required","available","reliable"],a:0,why:"Be eligible for = avoir droit à / remplir les conditions pour bénéficier de quelque chose.",skill:"Eligible for"});
  setQ("X08-004",{stem:"The manager asked us to ____ the meeting for next Thursday.",opts:["reschedule","cancel","attend","assist"],a:0,why:"Reschedule = fixer une nouvelle date ou heure. Postpone, déjà travaillé ailleurs dans la banque, signifie reporter à plus tard.",skill:"Reschedule"});

  // P3 second-pass ambiguity sweep — every item below now has one defensible answer.
  setQ("E10-001",{stem:"After reviewing all the evidence, the committee will ____ its final decision.",opts:["perform","make","conduct","attend"],a:1,why:"Make a decision est la collocation standard. En anglais britannique, take a decision existe aussi : il n'est donc pas utilisé comme distracteur."});
  setQ("E11-002",{stem:"After long talks, both sides finally ____ an agreement.",opts:["reached","performed","attended","delivered"],a:0,why:"Reach an agreement = parvenir à un accord."});
  setQ("E12-001",{stem:"The customer would like to ____ an order for 200 units.",opts:["place","attend","reach","conduct"],a:0,why:"Place an order = passer une commande."});
  setQ("E12-002",{stem:"The campaign aims to ____ awareness of the new policy.",opts:["raise","reach","attend","conduct"],a:0,why:"Raise awareness = sensibiliser / accroître la sensibilisation."});
  setQ("E13-001",{stem:"Next month, the marketing team will ____ a survey of existing clients to measure satisfaction.",opts:["conduct","postpone","attend","reach"],a:0,why:"Conduct a survey = mener une enquête."});
  setQ("E15-001",{stem:"Over 300 delegates are expected to ____ the annual conference in person.",opts:["assist","attend","schedule","postpone"],a:1,why:"Attend a conference = assister à une conférence. Assist signifie aider."});
  setQ("E16-002",{stem:"We need to ____ the vacant position before the new project starts.",opts:["finish","arrange","fill","attend"],a:2,why:"Fill a vacant position = pourvoir un poste vacant."});
  setQ("E18-004",{stem:"We are working to a very ____ schedule this month.",opts:["narrow","loose","tight","wide"],a:2,why:"A tight schedule = un emploi du temps très serré."});
  setQ("F25-001",{stem:"The team needs to ____ a completely new marketing strategy from scratch.",opts:["go over","come up with","drop off","check in"],a:1,why:"Come up with = trouver / concevoir une idée ou une solution. From scratch indique qu'il faut la créer, pas simplement la revoir."});
  setQ("F29-001",{stem:"To reserve a place, employees must ____ the new training programme online before Friday.",opts:["hand in","look into","sign up for","lay off"],a:2,why:"Sign up for = s'inscrire à. Le contexte précise qu'il faut réserver une place."});
  setQ("G23-001",{stem:"In “a brief meeting”, “brief” is closest to:",opts:["short","detailed","loud","official"],a:0,why:"Dans brief meeting, brief = short / concise."});
  setQ("P02-001",{why:"Agree to + nom / proposition (agree to the terms, agree to a proposal) ; agree to + infinitif (agree to pay) ; agree with + personne / opinion."});
  setQ("V03-001",{stem:"Attendance at the safety training is mandatory, so all employees are ____ to attend.",opts:["required","requested","acquired","inquired"],a:0,why:"Le contexte mandatory impose be required to = être tenu de."});
  setQ("X03-001",{stem:"If you confirm this booking today, we ____ you a 10% discount on this order.",opts:["offered","will offer","would offer","have offered"],a:1,why:"Conséquence future réelle et ponctuelle : if + présent, puis will + base verbale."});
  setQ("X05-005",{stem:"Neither option ____ suitable for the client.",opts:["are","were","have","is"],a:3,why:"Neither, employé seul devant un nom singulier, prend ici un verbe singulier : neither option is suitable."});
  setQ("X07-003",{stem:"The firm plans to expand ____ the Asian market next year.",opts:["into","at","on","for"],a:0,why:"Expand into a market = se développer / pénétrer un nouveau marché.",skill:"Expand into"});
  // P3 final ambiguity sweep — issues found during full 210-item human review.
  setQ("C02-001",{stem:"The form must ____ by every applicant before Friday.",opts:["complete","completed","be completed","be complete"],a:2,why:"Après un modal, le passif se construit avec be + participe passé : must be completed. Le complément by every applicant confirme que le formulaire reçoit l’action."});
  setQ("E10-002",{stem:"Managers must ____ responsibility for their teams when problems arise.",opts:["take","perform","attend","raise"],a:0,why:"Take responsibility for = assumer la responsabilité de."});
  setQ("E11-001",{stem:"The team worked overtime to ____ the deadline and submit the bid on time.",opts:["perform","attend","meet","conduct"],a:2,why:"Meet a deadline = respecter une date limite."});
  setQ("E14-002",{stem:"Customer-service staff are trained to ____ complaints professionally and find a solution.",opts:["hold","reach","handle","attend"],a:2,why:"Handle a complaint = traiter / gérer une réclamation."});
  setQ("E16-001",{stem:"After the final legal review, both parties are ready to ____ the contract.",opts:["attend","sign","conduct","reach"],a:1,why:"Sign a contract = signer un contrat."});
  setQ("E20-002",{stem:"The startup managed to ____ funds from several investors for its expansion.",opts:["attend","hold","raise","conduct"],a:2,why:"Raise funds = lever des fonds."});
  setQ("X03-003",{stem:"He called the supplier in order ____ the delivery date.",opts:["confirm","to confirm","confirming","confirmed"],a:1,why:"Après in order, le but se construit avec to + base verbale : in order to confirm."});
  setQ("X07-010",{stem:"After the final negotiations, both parties ____ the contract in front of a witness.",opts:["signed","attended","conducted","reached"],a:0,why:"Sign a contract = signer un contrat."});
  setQ("X07-011",{stem:"Staff must ____ with the new safety regulations even if they disagree with them.",opts:["agree","comply","accept","approve"],a:1,why:"Comply with regulations = se conformer à la réglementation. Le contexte even if they disagree exclut agree with."});

  setDx("A01-001",{0:{t:"forme",note:"« are » ne s'accorde pas avec le sujet singulier the manager."},1:{t:"temps",note:"Pour une affirmation ordinaire au passé avec un sujet singulier, on attendrait was ; ici aucun contexte ne justifie de toute façon un passé ou un irréel en were."},3:{t:"temps",note:"« have been » impose un present perfect inutile ici : le présent simple suffit."}});
  setDx("H01-001",{0:{t:"fauxami",note:"Faux ami : attend ressemble à « attendre », mais signifie « assister à »."},2:{t:"sens",note:"« annuler » = cancel / call off : aucun rapport avec attend."},3:{t:"sens",note:"« organiser » = organise / hold : ce n'est pas le sens de attend."}});
  setDx("H02-001",{0:{t:"fauxami",note:"Actually ne signifie pas « actuellement » (= currently)."},2:{t:"sens",note:"« finalement » se traduit selon le contexte par eventually / finally, pas par actually."},3:{t:"fauxami",note:"« éventuellement » se traduit généralement par possibly / perhaps, pas par actually."}});
  var c7=by("C07-001");if(c7&&c7.dx){c7.dx={0:{t:"temps",note:"« increased » met la principale au passé : ce n'est pas la structure du premier conditionnel visé ici."},1:{t:"temps",note:"« would increase » correspond à une hypothèse de type second conditionnel ; ici le scénario présenté est réel / possible."},3:{t:"forme",note:"« increasing » n'est pas une forme verbale conjuguée ici : il manque un auxiliaire."}};}

  // Vocabulary canonicalisation before duplicate merging.
  var advanced={"ambiguous":{"ipa":"/æmˈbɪɡ.ju.əs/","col":["ambiguous wording","ambiguous instructions"]},"benchmark":{"ipa":"/ˈbentʃ.mɑːk/","col":["industry benchmark","set a benchmark","benchmark performance"]},"compensate":{"ipa":"/ˈkɒm.pen.seɪt/","col":["compensate employees","compensate for a loss"]},"confidential":{"ipa":"/ˌkɒn.fɪˈden.ʃəl/","col":["confidential information","strictly confidential"]},"constraint":{"ipa":"/kənˈstreɪnt/","col":["budget constraint","time constraint"]},"deteriorate":{"ipa":"/dɪˈtɪə.ri.ə.reɪt/","col":["conditions deteriorate","deteriorate rapidly"]},"drawback":{"ipa":"/ˈdrɔː.bæk/","col":["major drawback","main drawback"]},"endorse":{"ipa":"/ɪnˈdɔːs/","col":["endorse a proposal","officially endorse"]},"forecast":{"ipa":"/ˈfɔː.kɑːst/","col":["sales forecast","forecast demand"]},"hinder":{"ipa":"/ˈhɪn.dər/","col":["hinder progress","hinder growth"]},"leverage":{"ipa":"/ˈliː.vər.ɪdʒ/","col":["leverage expertise","leverage technology"]},"offset":{"ipa":"/ˈɒf.set/","col":["offset costs","offset losses"]},"outsource":{"ipa":"/ˈaʊt.sɔːs/","col":["outsource services","outsource production"]},"redundancy":{"ipa":"/rɪˈdʌn.dən.si/","col":["redundancy package","make an employee redundant"]},"viable":{"ipa":"/ˈvaɪ.ə.bəl/","col":["financially viable","viable option"]},"alleviate":{"ipa":"/əˈliː.vi.eɪt/","col":["alleviate concerns","alleviate pressure"]},"apparent":{"ipa":"/əˈpær.ənt/","col":["become apparent","apparent reason"]},"backlog":{"ipa":"/ˈbæk.lɒɡ/","col":["clear a backlog","order backlog"]},"compelling":{"ipa":"/kəmˈpel.ɪŋ/","col":["compelling evidence","compelling argument"]},"controversial":{"ipa":"/ˌkɒn.trəˈvɜː.ʃəl/","col":["controversial decision","highly controversial"]},"deficit":{"ipa":"/ˈdef.ɪ.sɪt/","col":["budget deficit","trade deficit"]},"surplus":{"ipa":"/ˈsɜː.pləs/","col":["budget surplus","surplus stock"]},"diversify":{"ipa":"/daɪˈvɜː.sɪ.faɪ/","col":["diversify operations","diversify a portfolio"]},"eliminate":{"ipa":"/ɪˈlɪm.ɪ.neɪt/","col":["eliminate errors","eliminate waste"]},"emerge":{"ipa":"/ɪˈmɜːdʒ/","col":["new issues emerge","emerging market"]},"exclusive":{"ipa":"/ɪkˈskluː.sɪv/","col":["exclusive offer","exclusive rights"]},"franchise":{"ipa":"/ˈfræn.tʃaɪz/","col":["franchise agreement","franchise owner"]},"implementation":{"ipa":"/ˌɪm.plɪ.menˈteɪ.ʃən/","col":["successful implementation","implementation plan"]},"inevitable":{"ipa":"/ɪˈnev.ɪ.tə.bəl/","col":["inevitable delay","seem inevitable"]},"innovative":{"ipa":"/ˈɪn.ə.və.tɪv/","col":["innovative solution","innovative product"]},"insight":{"ipa":"/ˈɪn.saɪt/","col":["valuable insight","gain insight into"]},"lucrative":{"ipa":"/ˈluː.krə.tɪv/","col":["lucrative market","lucrative contract"]},"minimise":{"ipa":"/ˈmɪn.ɪ.maɪz/","col":["minimise costs","minimise risk"]},"monopoly":{"ipa":"/məˈnɒp.əl.i/","col":["hold a monopoly","market monopoly"]},"obstacle":{"ipa":"/ˈɒb.stə.kəl/","col":["major obstacle","overcome an obstacle"]},"optimise":{"ipa":"/ˈɒp.tɪ.maɪz/","col":["optimise performance","optimise processes"]},"prestigious":{"ipa":"/preˈstɪdʒ.əs/","col":["prestigious firm","prestigious award"]},"sustainable":{"ipa":"/səˈsteɪ.nə.bəl/","col":["sustainable growth","sustainable practices"]},"compliance":{"ipa":"/kəmˈplaɪ.əns/","col":["regulatory compliance","ensure compliance","compliance requirements"]},"stakeholder":{"ipa":"/ˈsteɪkˌhəʊl.dər/","col":["key stakeholder","stakeholder engagement"]},"turnover":{"ipa":"/ˈtɜːnˌəʊ.vər/","col":["staff turnover","annual turnover"]},"streamline":{"ipa":"/ˈstriːm.laɪn/","col":["streamline operations","streamline a process"]},"waiver":{"ipa":"/ˈweɪ.vər/","col":["sign a waiver","waiver of liability"]}};
  function replaceProgramme(s){return String(s||"").replace(/\bprogram\b/g,"programme").replace(/\bprograms\b/g,"programmes");}
  V.forEach(function(v){
    if(!v||!v.w)return;
    var k=norm(v.w);
    if(k==="resume (us) / cv (uk)"||k==="resume"){v.w="CV (UK) / résumé (US)";v.ipa="/ˌsiːˈviː/ (UK) · /ˈrez.ə.meɪ/ (US)";v.fr="CV";v.ex="Please attach your CV to the application form.";v.col=["update a CV","submit a CV","CV screening"];v.t="RH & recrutement";}
    if(k==="purchase order (po)"||k==="purchase order"){v.w="purchase order (PO)";}
    if(k==="inquiry"){v.w="enquiry / inquiry";v.fr="demande de renseignements";v.ex="We received an enquiry about the product.";v.col=["customer enquiry","handle an enquiry","respond to an enquiry"];}
    if(k==="loyalty"||k==="recycling"){v.ex=replaceProgramme(v.ex);if(Array.isArray(v.col))v.col=v.col.map(replaceProgramme);}
    var a=advanced[k];if(a){if(!v.ipa)v.ipa=a.ipa;v.col=Array.from(new Set([].concat(v.col||[],a.col||[])));}
  });
  // Clean UI debris and merge exact/concept-normalised duplicates without throwing away IPA/collocations.
  var garbage=/TOEIC\s*(?:EXERCISE|COLLOCATIONS|SUPER|Favorite|Trap|MASTER TABLE|EMAIL EXPRESSIONS)|Match the word|Très fréquentes|Phrasal VerbMeaning|⚠|Important$/i;
  var map=new Map(),out=[];
  V.forEach(function(v){
    if(!v||!v.w)return;
    var cols=(Array.isArray(v.col)?v.col:[]).map(String).map(function(s){return s.trim();}).filter(function(s){return s&&!garbage.test(s);});
    v.col=Array.from(new Set(cols));
    var k=norm(v.w);
    if(!map.has(k)){map.set(k,v);out.push(v);}
    else{
      var b=map.get(k);
      b.col=Array.from(new Set([].concat(b.col||[],v.col||[])));
      if(!b.ipa&&v.ipa)b.ipa=v.ipa;
      if((!b.ex||b.ex.length<20)&&v.ex)b.ex=v.ex;
      if((b.t==="Vocabulaire avancé"||!b.t)&&v.t&&v.t!=="Vocabulaire avancé")b.t=v.t;
    }
  });
  V.splice.apply(V,[0,V.length].concat(out));
  function vw(name){var n=norm(name);return V.find(function(v){return norm(v.w)===n;});}
  function patchV(name,data){var v=vw(name);if(v)Object.keys(data).forEach(function(k){v[k]=data[k];});}
  patchV("mandatory",{col:["mandatory training","mandatory attendance"]});
  patchV("outstanding",{fr:"impayé, en suspens ; remarquable, excellent",col:["outstanding balance","outstanding invoice","outstanding performance"]});
  var unique=vw("unique");if(unique)unique.col=(unique.col||[]).filter(function(c){return norm(c)!=="accurate information";});
  patchV("stock",{fr:"action, titre ; stock, inventaire",col:["stock market","stock price","stock exchange","stock levels"]});
  patchV("liability",{fr:"passif comptable ; responsabilité juridique",col:["financial liabilities","current liabilities","limited liability","tax liability","assets and liabilities"]});
  patchV("promotion",{fr:"promotion professionnelle ; promotion commerciale",t:"RH & marketing",col:["earn a promotion","promotion opportunity","sales promotion","run a promotion"]});
  patchV("turnover",{fr:"rotation du personnel ; chiffre d'affaires",t:"Finance & RH",col:["staff turnover","employee turnover","annual turnover"]});
  patchV("upgrade",{ipa:"noun /ˈʌp.ɡreɪd/ · verb /ʌpˈɡreɪd/",fr:"mise à niveau ; mettre à niveau",ex:"The software upgrade improved performance.",col:["software upgrade","system upgrade","upgrade the software"]});
  patchV("import",{ipa:"noun /ˈɪm.pɔːt/ · verb /ɪmˈpɔːt/",fr:"importation ; importer",ex:"Imports from Asia increased last year.",col:["import duties","import licence","import goods"]});
  patchV("export",{ipa:"noun /ˈek.spɔːt/ · verb /ɪkˈspɔːt/",fr:"exportation ; exporter",ex:"Exports increased by 10% this year.",col:["export market","export licence","export goods"]});
  patchV("compliance",{fr:"conformité (réglementaire)",ex:"The company must ensure compliance with safety regulations.",col:["regulatory compliance","ensure compliance","compliance requirements"]});
  patchV("insight",{fr:"éclairage, compréhension, enseignement",ex:"The survey provided valuable insights into customer behaviour.",col:["valuable insight","gain insight into"]});
  patchV("attendee",{ipa:"/ə.tenˈdiː/"});
  patchV("recently",{ipa:"/ˈriː.sənt.li/"});
  patchV("enquiry / inquiry",{ipa:"/ɪnˈkwaɪə.ri/",fr:"demande de renseignements",ex:"We received an enquiry about the product.",col:["customer enquiry","handle an enquiry","respond to an enquiry"]});
  patchV("portfolio",{col:["investment portfolio","diversified portfolio","manage a portfolio"]});
  // British spelling in ordinary non-software contexts.
  ["loyalty","recycling"].forEach(function(name){var v=vw(name);if(v){v.ex=replaceProgramme(v.ex);v.col=(v.col||[]).map(replaceProgramme);}});
  // Ensure every advanced item receives its audited IPA and collocations after merging.
  Object.keys(advanced).forEach(function(name){var v=vw(name);if(v){v.ipa=advanced[name].ipa;v.col=Array.from(new Set([].concat(v.col||[],advanced[name].col||[])));}});
  window.HT_BANK_LINGUISTIC_AUDIT={version:28,questionsReviewed:210,vocabularyReviewed:V.length,language:"British English preferred",status:"audited"};
  return {questions:Q.length,vocab:V.length};
}

function sessionSeed(){try{let x=sessionStorage.getItem("ht_bank_seed_v28");if(!x){x=String(Date.now())+"-"+Math.random();sessionStorage.setItem("ht_bank_seed_v28",x)}let h=2166136261>>>0;for(let i=0;i<x.length;i++){h^=x.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}catch(e){return (Date.now()>>>0)}}
function rng(seed){return function(){seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function shuf(a,r){let b=a.slice();for(let i=b.length-1;i>0;i--){let j=Math.floor(r()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b}
function remapQuestion(q,target,r){if(!q||!Array.isArray(q.opts)||q.opts.length<2||!Number.isInteger(q.a)||q.a<0||q.a>=q.opts.length)return;const old=q.opts.map((text,i)=>({text,i})),correct=old[q.a],rest=shuf(old.filter(x=>x.i!==q.a),r),pos=Math.min(target,q.opts.length-1);rest.splice(pos,0,correct);q.opts=rest.map(x=>x.text);q.a=rest.findIndex(x=>x.i===correct.i);if(q.dx&&typeof q.dx==="object"){const nd={};rest.forEach((x,newI)=>{if(Object.prototype.hasOwnProperty.call(q.dx,x.i))nd[newI]=q.dx[x.i]});q.dx=nd}q._htV28=true;}
function cleanBank(){
  const B=window.TOEIC_BANK;if(!B)return {version:28,questions:0,vocab:0};
  if(B.__htP3Cleaned)return (window.HT&&HT.BANK_QUALITY)||{version:28,questions:(B.QUESTIONS||[]).length,vocab:(B.VOCAB||[]).length};
  applyLinguisticAudit(B);
  let Q=Array.isArray(B.QUESTIONS)?B.QUESTIONS:[];
  const seen=new Set(),unique=[];Q.forEach(q=>{if(!q||!Array.isArray(q.opts))return;const key=norm(q.stem)+"|"+norm(q.opts[q.a]);if(!seen.has(key)){seen.add(key);unique.push(q)}});Q.splice(0,Q.length,...unique);
  const r=rng(sessionSeed()), four=Q.filter(q=>q.opts&&q.opts.length===4), other=Q.filter(q=>q.opts&&q.opts.length!==4);
  const slots=shuf(four.map((_,i)=>i%4),r);four.forEach((q,i)=>remapQuestion(q,slots[i],r));other.forEach((q,i)=>remapQuestion(q,i%(q.opts?.length||1),r));
  B.__htP3Cleaned=true;
  window.HT=window.HT||{};
  HT.BANK_QUALITY={version:28,questions:Q.length,vocab:(B.VOCAB||[]).length,balanced:true,duplicatesRemoved:true,linguisticAudit:true,questionsReviewed:210};
  return HT.BANK_QUALITY;
}
function recommendationFor(part){const map={
  1:{title:"Affûter l'écoute visuelle",text:"Travaille la reconnaissance rapide des actions et du vocabulaire descriptif.",href:"prononciation-ecoute.html",label:"Pronunciation & Listening"},
  2:{title:"Réponses courtes et indirectes",text:"Entraîne-toi à repérer immédiatement who / where / when / why et les réponses indirectes.",href:"survival-island-listening.html",label:"Survival Island"},
  3:{title:"Conversations professionnelles",text:"Travaille les intentions, problèmes, décisions et prochaines actions dans des dialogues.",href:"corporate-mysteries.html",label:"Corporate Mysteries"},
  4:{title:"Annonces et monologues",text:"Travaille le but du message, les changements, horaires, chiffres et actions demandées.",href:"survival-island-listening.html",label:"Survival Island"},
  5:{title:"Grammaire et vocabulaire en contexte",text:"Renforce les formes grammaticales qui permettent d'éliminer rapidement les distracteurs.",href:"grammar-time-machine.html",label:"Grammar Time Machine"},
  6:{title:"Cohérence d'un texte",text:"Travaille les liens logiques, formes verbales et choix de mots dans un contexte plus long.",href:"constructeur-de-phrases.html",label:"Sentence Builder"},
  7:{title:"Lecture et croisement d'informations",text:"Entraîne scanning, inférence et lecture de plusieurs documents sous pression.",href:"successful-toeic-kingdom.html",label:"Successful TOEIC Kingdom"}
};return map[Number(part)]||null}
function addSystemCheckLink(){if(!/(?:^|\/)homemade-toeic-trainer\/?(?:index\.html)?$/.test(location.pathname))return;const about=$("#about .card");if(about&&!about.querySelector(".ht-system-check")){const p=document.createElement("p");p.className="ht-system-check";p.style.marginTop="16px";p.innerHTML='<a class="btn ghost" href="system-check.html">🩺 Vérifier mon appareil et le site</a>';about.appendChild(p)}const foot=document.querySelector("footer");if(foot&&!foot.querySelector('a[href="system-check.html"]')){const a=document.createElement("a");a.href="system-check.html";a.textContent="System Check";a.style.marginLeft="10px";foot.appendChild(a)}}
function enrichDashboard(){if(!/(?:^|\/)homemade-toeic-trainer\/?(?:index\.html)?$/.test(location.pathname))return;try{const db=JSON.parse(localStorage.getItem("ht_toeic_diagnostic_v3")||"null"),r=db&&db.lastResult;if(!r)return;let weak=null;for(let p=1;p<=7;p++){const v=(r.byPart||{})[String(p)]||{ok:0,n:0};if(!v.n)continue;const pct=v.ok/v.n;if(!weak||pct<weak.pct||(pct===weak.pct&&v.n>weak.n))weak={p,pct,n:v.n}}const rec=weak&&recommendationFor(weak.p);const line=$("#nextStepLine");if(line&&rec)line.innerHTML='Priorité conseillée : <strong>Part '+weak.p+'</strong> · '+rec.title+' — <a href="'+rec.href+'">'+rec.label+'</a>'; }catch(e){}}
function init(){cleanBank();addSystemCheckLink();setTimeout(enrichDashboard,0);window.HT=window.HT||{};HT.recommendationForPart=recommendationFor;HT.cleanQuestionBank=cleanBank;}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();

/* ============================================================
   P4 v29 — final stabilisation bridge
   Loads the shared progress contract on the legacy monolithic
   homepage, hard-disables legacy diagnostic/scoring entry points,
   and exposes one release/version contract to all pages.
   ============================================================ */
(function(){"use strict";
  window.HT=window.HT||{};HT.RELEASE=29;
  const root=()=>/(?:^|\/)homemade-toeic-trainer\/?(?:index\.html)?$/.test(location.pathname);
  const $=(s,r)=>(r||document).querySelector(s);
  function loadProgress(cb){
    if(window.HTProgress){cb&&cb();return;}
    let old=document.querySelector('script[data-ht-progress-core]');
    if(old){old.addEventListener('load',()=>cb&&cb(),{once:true});return;}
    let s=document.createElement('script');s.src='progress-core.js';s.dataset.htProgressCore='1';s.async=false;s.onload=()=>cb&&cb();s.onerror=()=>{};(document.head||document.documentElement).appendChild(s);
  }
  function scrub(){if(!root())return;
    const meta=document.querySelector('meta[name="description"]');if(meta)meta.content='Homemade TOEIC Trainer — entraînement pédagogique TOEIC Listening & Reading : mini-diagnostic, vocabulaire, prononciation, jeux et progression locale. Créé par Eglantine Lecomte. Non affilié à ETS Global.';
    const patterns=[
      [/score TOEIC estimé/gi,'résultat diagnostique'],
      [/score estimé/gi,'résultat diagnostique'],
      [/TOEIC blanc complet/gi,'mini-simulation TOEIC'],
      [/Passer un TOEIC blanc complet/gi,'Ouvrir la mini-simulation TOEIC']
    ];
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;
    while(n=walker.nextNode()){if(!n.nodeValue||!n.nodeValue.trim())continue;let v=n.nodeValue;patterns.forEach(p=>{v=v.replace(p[0],p[1])});if(v!==n.nodeValue)n.nodeValue=v;}
    const about=$('#about .card');if(about&&!about.querySelector('[data-ht-release]')){const p=document.createElement('p');p.dataset.htRelease='29';p.className='disclaimer';p.style.marginTop='12px';p.textContent='Version pédagogique stabilisée v29 · progression stockée uniquement sur cet appareil.';about.appendChild(p);}
  }
  function hardDisableLegacy(){if(!root())return;
    try{window.startDiag=function(){location.href='diagnostic-toeic.html'};}catch(e){}
    try{window.estimateScore=function(){return null};}catch(e){}
    document.addEventListener('click',function(e){const t=e.target.closest&&e.target.closest('[data-nav="diagnostic"],#startDiag,.start-diag');if(!t)return;e.preventDefault();e.stopImmediatePropagation();location.href='diagnostic-toeic.html';},true);
  }
  function mountProgress(){
    if(!window.HTProgress)return;
    HT.PROGRESS_KEYS=HTProgress.keys();
    HT.progressSnapshot=()=>HTProgress.snapshot();
    HT.resetAllProgress=()=>HTProgress.reset({preserveSettings:true});
    if(!root())return;
    const host=$('#dashFull');if(!host)return;
    let box=host.querySelector('[data-ht-platform-progress]');if(!box){box=document.createElement('div');box.dataset.htPlatformProgress='1';box.className='card';box.style.marginTop='16px';host.appendChild(box);}
    const s=HTProgress.summary(),core=s.activities.filter(a=>['diagnostic','corporate','kingdom','survival','zombie','detective','escape','grammar','phrasal','modal'].includes(a.id));
    const complete=core.filter(a=>a.status==='complete').length,started=core.filter(a=>a.status!=='untouched').length;
    box.innerHTML='<span class="pill blue">Progression de la plateforme</span><h3 style="margin-top:10px">'+complete+' activité'+(complete>1?'s':'')+' terminée'+(complete>1?'s':'')+' sur '+core.length+'</h3><p>'+started+' activité'+(started>1?'s':'')+' commencée'+(started>1?'s':'')+'. Les jeux gardent leurs propres scores, mais le reset et la sauvegarde utilisent désormais un registre commun.</p>';
  }
  function init(){scrub();hardDisableLegacy();loadProgress(()=>{mountProgress();if(!HT.__progressSubscribed&&HTProgress.subscribe){HT.__progressSubscribed=true;HTProgress.subscribe(()=>mountProgress());}try{HTProgress.record('platform',{release:29,event:'loaded'})}catch(e){}});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
