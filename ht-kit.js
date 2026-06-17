/* ============================================================
   HT TOEIC KIT — vitesse d'écoute, transcriptions, stratégies, gamification
   Sans dépendance. Tout est sous window.HT. Données en localStorage (local, RGPD).
   ============================================================ */
(function(){
  "use strict";
  var LS = {
    speed: "htoeic_speed_v1",
    gamify: "htoeic_gamify_v1"
  };
  function $(sel, root){ return (root||document).querySelector(sel); }
  function $all(sel, root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); }
  function el(tag, props, kids){
    var n = document.createElement(tag);
    if(props){ for(var k in props){
      if(k==="class") n.className = props[k];
      else if(k==="text") n.textContent = props[k];
      else if(k==="html") n.innerHTML = props[k];
      else if(k.indexOf("on")===0 && typeof props[k]==="function") n.addEventListener(k.slice(2), props[k]);
      else if(k==="dataset"){ for(var d in props[k]) n.dataset[d]=props[k][d]; }
      else n.setAttribute(k, props[k]);
    }}
    (kids||[]).forEach(function(c){ if(c==null) return; n.appendChild(typeof c==="string"?document.createTextNode(c):c); });
    return n;
  }
  function load(key, fallback){ try{ var v=localStorage.getItem(key); return v==null?fallback:JSON.parse(v);}catch(e){return fallback;} }
  function save(key, val){ try{ localStorage.setItem(key, JSON.stringify(val)); }catch(e){} }
  function todayKey(){ var d=new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }

  var HT = window.HT = window.HT || {};

  /* ---------------- MODULE A : VITESSE + AUDIO + TRANSCRIPTION ---------------- */
  var SPEEDS = [0.75, 1, 1.25];
  var speedState = load(LS.speed, 1);
  if(SPEEDS.indexOf(speedState)===-1) speedState = 1;

  HT.speed = {
    get: function(){ return speedState; },
    set: function(v){
      v = parseFloat(v); if(SPEEDS.indexOf(v)===-1) v = 1;
      speedState = v; save(LS.speed, v);
      $all("[data-ht-speed]").forEach(HT.speed.mount);
      var live = $("#ht-speed-live"); if(live) live.textContent = "Vitesse d'écoute : " + v + "×";
    },
    // Rend le sélecteur segmenté dans un conteneur
    mount: function(container){
      if(!container) return;
      container.innerHTML = "";
      var group = el("div", {class:"ht-seg", role:"group", "aria-label":"Vitesse d'écoute"});
      SPEEDS.forEach(function(s){
        var pressed = (s===speedState);
        var btn = el("button", {
          type:"button", class:"ht-seg-btn"+(pressed?" is-on":""),
          "aria-pressed": pressed?"true":"false",
          text: (s===1?"1×":(s+"×")),
          onclick: function(){ HT.speed.set(s); }
        });
        group.appendChild(btn);
      });
      var label = el("span", {class:"ht-seg-label", text:"🔊 Vitesse"});
      container.appendChild(label);
      container.appendChild(group);
      if(!$("#ht-speed-live")) container.appendChild(el("span",{id:"ht-speed-live",class:"ht-sr","aria-live":"polite"}));
    },
    // Applique la vitesse globale À TOUT l'audio existant (sans toucher ton code)
    enableGlobal: function(){
      if(!("speechSynthesis" in window) || speechSynthesis.__htPatched) return;
      try{
        var orig = speechSynthesis.speak.bind(speechSynthesis);
        speechSynthesis.speak = function(u){
          try{ if(u && u.__htRate!==false && !u.__htFixed){ u.rate = speedState; } }catch(e){}
          return orig(u);
        };
        speechSynthesis.__htPatched = true;
      }catch(e){}
    }
  };

  // Lecture d'un texte (respecte la vitesse globale)
  HT.speak = function(text, opts){
    opts = opts || {};
    if(!("speechSynthesis" in window)){ console.warn("SpeechSynthesis indisponible"); return; }
    try{
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = opts.lang || "en-US";
      u.rate = (opts.rate!=null) ? opts.rate : speedState;
      if(opts.rate!=null) u.__htFixed = true; // vitesse forcée = on n'écrase pas
      var voices = speechSynthesis.getVoices()||[];
      var v = voices.filter(function(x){ return x.lang && x.lang.toLowerCase().indexOf((u.lang||"en").slice(0,2).toLowerCase())===0; });
      if(opts.lang){ var exact = voices.filter(function(x){return x.lang && x.lang.toLowerCase()===opts.lang.toLowerCase();}); if(exact.length) v = exact; }
      if(v.length) u.voice = v[0];
      speechSynthesis.speak(u);
    }catch(e){ console.warn(e); }
  };
  HT.stop = function(){ try{ speechSynthesis.cancel(); }catch(e){} };

  // Délégation : tout bouton .ht-play / .ht-replay lit son data-ht-text
  document.addEventListener("click", function(e){
    var b = e.target.closest && e.target.closest(".ht-play, .ht-replay");
    if(!b) return;
    var txt = b.getAttribute("data-ht-text"); if(!txt) return;
    HT.speak(txt, { lang: b.getAttribute("data-ht-lang") || "en-US" });
  });

  /* ---------------- MODULE B : MINI-FICHES STRATÉGIE ---------------- */
  // Édite librement ce tableau (titres, stratégies, astuces).
  HT.STRATEGIES = [
    { part:"Partie 1", titre:"Photographies", strat:"Décris l'ACTION visible, pas ce que tu imagines. Élimine toute phrase dont l'action est fausse, même si un mot est correct.", repere:"le verbe (souvent en -ing) et qui fait quoi.", astuce:"Méfie-toi des mots proches : office / officer, copy / coffee." },
    { part:"Partie 2", titre:"Question / Réponse", strat:"Repère le mot interrogatif dès le début : il commande la réponse logique.", repere:"where → lieu · when → temps · who → personne · why → raison · how → manière.", astuce:"Une réponse qui répète un mot entendu est souvent un piège." },
    { part:"Partie 3", titre:"Conversations", strat:"Lis les 3 questions AVANT d'écouter : tu sais quoi guetter.", repere:"qui parle ? où ? que veut / propose la personne ?", astuce:"Les réponses suivent en général l'ordre des questions." },
    { part:"Partie 4", titre:"Exposés & annonces", strat:"Une seule voix : identifie d'abord le type (annonce, message vocal, météo, pub).", repere:"le but du message, le public visé, l'action demandée.", astuce:"L'info est reformulée : « delayed » → la cause = la météo." },
    { part:"Partie 5", titre:"Phrases à compléter", strat:"Regarde d'abord la FORME attendue (grammaire) avant le sens.", repere:"la place du mot manquant : nom, verbe, adjectif, adverbe ?", astuce:"Les 4 options testent souvent la même racine (complete / completed / completing / completion)." },
    { part:"Partie 6", titre:"Textes à compléter", strat:"Lis tout le court texte : c'est la cohérence d'ensemble qui guide le choix.", repere:"connecteurs, temps des verbes, et la phrase entière à insérer.", astuce:"La phrase à insérer doit suivre LOGIQUEMENT ce qui précède." },
    { part:"Partie 7", titre:"Compréhension de textes", strat:"Scanne les mots-clés de la question, puis retrouve-les dans le texte (ne lis pas tout mot à mot).", repere:"dates, noms propres, chiffres, mots-clés.", astuce:"Textes multiples = croise les 2 documents. Surveille le temps : la Partie 7 est longue." }
  ];
  HT.renderStrategies = function(container){
    if(!container) return;
    container.innerHTML = "";
    var grid = el("div", {class:"ht-strat-grid"});
    HT.STRATEGIES.forEach(function(s){
      grid.appendChild(el("article",{class:"ht-card"},[
        el("div",{class:"ht-card-tag",text:s.part}),
        el("h3",{class:"ht-card-title",text:s.titre}),
        el("p",{class:"ht-line"},[ el("strong",{text:"Stratégie : "}), document.createTextNode(s.strat) ]),
        el("p",{class:"ht-line"},[ el("strong",{text:"À repérer : "}), document.createTextNode(s.repere) ]),
        el("p",{class:"ht-line ht-tip"},[ el("strong",{text:"💡 Astuce : "}), document.createTextNode(s.astuce) ])
      ]));
    });
    container.appendChild(grid);
  };

  /* ---------------- MODULE C : GAMIFICATION (XP / RANGS / BADGES / RÉCAP) ---------------- */
  var RANKS = [
    { min:0,    name:"Apprenti·e" },
    { min:100,  name:"Explorateur·rice" },
    { min:300,  name:"Habitué·e" },
    { min:600,  name:"Confirmé·e" },
    { min:1000, name:"Avancé·e" },
    { min:1600, name:"Expert·e" },
    { min:2500, name:"TOEIC Master" }
  ];
  var BADGES = [
    { id:"first_diag", emoji:"🧭", label:"Premier diagnostic" },
    { id:"streak7",    emoji:"🔥", label:"7 jours d'affilée",  counter:"streak",    threshold:7 },
    { id:"words50",    emoji:"📚", label:"50 mots appris",     counter:"words",     threshold:50 },
    { id:"q100",       emoji:"🎯", label:"100 questions",      counter:"questions", threshold:100 },
    { id:"mock1",      emoji:"⏱️", label:"Premier examen blanc", counter:"mocks",   threshold:1 },
    { id:"perfect",    emoji:"⭐", label:"Leçon sans-faute" }
  ];
  var DEFAULT = { v:1, xp:0, daily:{}, badges:{}, counters:{ questions:0, words:0, mocks:0, streak:0 } };
  var g = load(LS.gamify, null);
  if(!g || g.v!==1){ g = JSON.parse(JSON.stringify(DEFAULT)); save(LS.gamify, g); } // migration simple par version

  function gsave(){ save(LS.gamify, g); }
  function rankOf(xp){
    var idx=0; for(var i=0;i<RANKS.length;i++){ if(xp>=RANKS[i].min) idx=i; }
    var cur=RANKS[idx], next=RANKS[idx+1]||null;
    var pct = next ? Math.round((xp-cur.min)/(next.min-cur.min)*100) : 100;
    return { idx:idx, name:cur.name, cur:cur.min, next: next?next.min:null, nextName: next?next.name:null, pct:pct };
  }
  function announce(msg){ var n=$("#ht-xp-live"); if(n) n.textContent=msg; }
  function toast(msg){
    var t = el("div",{class:"ht-toast",text:msg});
    document.body.appendChild(t);
    requestAnimationFrame(function(){ t.classList.add("show"); });
    setTimeout(function(){ t.classList.remove("show"); setTimeout(function(){ t.remove(); },300); }, 2600);
  }
  function checkBadges(){
    BADGES.forEach(function(bd){
      if(bd.counter && !g.badges[bd.id] && (g.counters[bd.counter]||0) >= bd.threshold){ unlock(bd.id); }
    });
  }
  function unlock(id){
    if(g.badges[id]) return;
    var bd = BADGES.filter(function(x){return x.id===id;})[0];
    g.badges[id] = true; gsave();
    if(bd) toast("🏅 Badge débloqué : "+bd.emoji+" "+bd.label);
    refresh();
  }

  HT.xp = {
    state: function(){ return g; },
    add: function(points, reason){
      points = parseInt(points,10)||0; if(points<=0) return;
      g.xp += points;
      var t = todayKey(); g.daily[t] = (g.daily[t]||0) + points;
      gsave(); checkBadges(); refresh();
      announce("+"+points+" XP" + (reason?(" ("+reason+")"):"") + ". Total : "+g.xp+" XP.");
    },
    inc: function(counter, by){ g.counters[counter] = (g.counters[counter]||0) + (by==null?1:by); gsave(); checkBadges(); refresh(); },
    set: function(counter, val){ g.counters[counter] = parseInt(val,10)||0; gsave(); checkBadges(); refresh(); },
    unlock: unlock,
    rank: function(){ return rankOf(g.xp); },
    weekly: function(){
      var out=[], names=["dim","lun","mar","mer","jeu","ven","sam"];
      for(var i=6;i>=0;i--){
        var d=new Date(); d.setDate(d.getDate()-i);
        var key=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
        out.push({ key:key, label:names[d.getDay()], xp:(g.daily[key]||0) });
      }
      return out;
    },
    reset: function(){ g = JSON.parse(JSON.stringify(DEFAULT)); gsave(); refresh(); },
    renderDashboard: function(container){ if(container) renderGamify(container); }
  };

  function renderGamify(container){
    container.innerHTML = "";
    var r = rankOf(g.xp);
    var wrap = el("div",{class:"ht-gam"});

    // En-tête rang + barre XP
    var head = el("div",{class:"ht-gam-head"},[
      el("div",{class:"ht-rank"},[ el("span",{class:"ht-rank-name",text:r.name}), el("span",{class:"ht-xp-total",text:g.xp+" XP"}) ]),
    ]);
    var bar = el("div",{class:"ht-bar", role:"progressbar", "aria-valuemin":"0","aria-valuemax":"100","aria-valuenow":String(r.pct), "aria-label":"Progression vers le rang suivant"},[
      el("span",{class:"ht-bar-fill"})
    ]);
    bar.querySelector(".ht-bar-fill").style.width = r.pct + "%";
    head.appendChild(bar);
    head.appendChild(el("div",{class:"ht-rank-next", text: r.next!=null ? ("Prochain rang : "+r.nextName+" — encore "+(r.next-g.xp)+" XP") : "Rang maximum atteint 🎉"}));
    wrap.appendChild(head);

    // Récap hebdo (barres)
    var wk = HT.xp.weekly();
    var maxXp = Math.max(1, Math.max.apply(null, wk.map(function(d){return d.xp;})));
    var weekTotal = wk.reduce(function(a,d){return a+d.xp;},0);
    var recap = el("section",{class:"ht-week"},[
      el("div",{class:"ht-week-head"},[ el("strong",{text:"Cette semaine"}), el("span",{class:"ht-week-total",text:weekTotal+" XP"}) ])
    ]);
    var bars = el("div",{class:"ht-week-bars"});
    wk.forEach(function(d){
      var col = el("div",{class:"ht-wb"});
      var h = Math.round(d.xp/maxXp*100);
      var fill = el("div",{class:"ht-wb-fill"}); fill.style.height = (d.xp>0?Math.max(6,h):2)+"%";
      col.appendChild(el("div",{class:"ht-wb-track"},[fill]));
      col.appendChild(el("div",{class:"ht-wb-label",text:d.label}));
      col.title = d.xp+" XP";
      bars.appendChild(col);
    });
    recap.appendChild(bars);
    wrap.appendChild(recap);

    // Badges
    var bsec = el("section",{class:"ht-badges"},[ el("strong",{text:"Badges"}) ]);
    var bgrid = el("div",{class:"ht-badge-grid"});
    BADGES.forEach(function(bd){
      var got = !!g.badges[bd.id];
      bgrid.appendChild(el("div",{class:"ht-badge"+(got?" is-on":""), title: bd.label + (got?" — débloqué":" — verrouillé")},[
        el("span",{class:"ht-badge-emo",text: got?bd.emoji:"🔒"}),
        el("span",{class:"ht-badge-lab",text:bd.label})
      ]));
    });
    bsec.appendChild(bgrid);
    wrap.appendChild(bsec);

    if(!$("#ht-xp-live")) wrap.appendChild(el("span",{id:"ht-xp-live",class:"ht-sr","aria-live":"polite"}));
    container.appendChild(wrap);
  }

  function refresh(){ $all("[data-ht-gamify]").forEach(renderGamify); }

  /* ---------------- AUTO-INIT ---------------- */
  function init(){
    HT.speed.enableGlobal();
    $all("[data-ht-speed]").forEach(HT.speed.mount);
    $all("[data-ht-strategy]").forEach(HT.renderStrategies);
    $all("[data-ht-gamify]").forEach(renderGamify);
    // Certains navigateurs chargent les voix de façon asynchrone
    if("speechSynthesis" in window){ try{ speechSynthesis.onvoiceschanged = function(){}; speechSynthesis.getVoices(); }catch(e){} }
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
