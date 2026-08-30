/* ============================================================
   HT TOEIC KIT — v22 homepage stabilisation
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
    var btn=document.getElementById("startDiag");if(!btn||btn.__ht22)return;btn.__ht22=true;
    btn.addEventListener("click",function(e){
      if(typeof diagState==="undefined"||typeof QUESTIONS==="undefined"||typeof renderDiagQ!=="function")return;
      e.preventDefault();e.stopImmediatePropagation();
      var picked=stratifiedSample(QUESTIONS,Math.min(24,QUESTIONS.length));picked=balancedClone(picked,Math.random);
      diagState={i:0,answers:[],items:picked};var intro=document.getElementById("diagIntro"),res=document.getElementById("diagResult"),run=document.getElementById("diagRun");if(intro)intro.hidden=true;if(res)res.hidden=true;if(run)run.hidden=false;renderDiagQ();
    },true);
    var intro=btn.closest(".card");if(intro&&!intro.querySelector(".ht-diag-note")){var p=document.createElement("p");p.className="disclaimer ht-diag-note";p.style.marginBottom="0";p.textContent="Diagnostic court : 24 questions équilibrées couvrant plusieurs domaines. Le score indicatif est calculé uniquement à partir de ce diagnostic.";intro.appendChild(p);}
  }

  function diagnosticStats(){
    try{if(typeof Store==="undefined")return null;var d=Store.get("lastDiag",null);if(!d||!d.byDom)return null;var ok=0,n=0;Object.keys(d.byDom).forEach(function(k){ok+=Number(d.byDom[k].ok)||0;n+=Number(d.byDom[k].n)||0;});if(!n)return null;return{ok:ok,n:n,pct:ok/n};}catch(e){return null;}
  }
  function installScoreFix(){
    if(typeof window.estimateScore==="function"){
      window.estimateScore=function(){var x=diagnosticStats();if(!x)return null;var score=Math.round((10+x.pct*980)/5)*5;score=Math.max(10,Math.min(990,score));return{score:score,pct:Math.round(x.pct*100),conf:x.n>=24?"moyen (mini-diagnostic)":"faible",n:x.n};};
    }
    if(typeof window.drawGauge==="function"){
      window.drawGauge=function(node,score){if(!node)return;var pct=Math.max(0,Math.min(1,(score-10)/(990-10))),R=84,C=2*Math.PI*R,col=score>=785?"var(--green)":score>=600?"var(--yellow)":score>=450?"var(--orange)":"var(--coral)";node.innerHTML='<svg width="200" height="200" viewBox="0 0 200 200" role="img" aria-label="Score indicatif '+score+' sur 990"><circle cx="100" cy="100" r="'+R+'" fill="none" stroke="var(--bg2)" stroke-width="16"/><circle cx="100" cy="100" r="'+R+'" fill="none" stroke="'+col+'" stroke-width="16" stroke-linecap="round" stroke-dasharray="'+C+'" stroke-dashoffset="'+(C*(1-pct))+'"/></svg><div class="val"><div class="n">'+score+'</div><div class="l">/ 990 indicatif</div></div>';};
    }
    if(typeof window.showDiagResult==="function"){var old=window.showDiagResult;window.showDiagResult=function(){var v=old.apply(this,arguments);patchScoreCopy();return v;};}
    if(typeof window.renderDashboard==="function"){var oldDash=window.renderDashboard;window.renderDashboard=function(){var v=oldDash.apply(this,arguments);patchScoreCopy();return v;};}
  }
  function patchScoreCopy(){
    $all("#diagResult .pill, #dashboard .pill").forEach(function(x){if(/Score TOEIC estimé/i.test(x.textContent))x.textContent="Score indicatif · mini-diagnostic";});
    var c=document.getElementById("confLine");if(c&&c.textContent.indexOf("mini-diagnostic")<0)c.textContent=c.textContent.replace("Estimation","Indication issue du dernier diagnostic");
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
