/* ============================================================
   HT-ERRORS — Banque d'erreurs "Mes erreurs à revoir"
   Autonome (logique + UI + styles injectés). Données locales (RGPD).
   API : HTErr.onAnswer(question, ok, type)  -> à appeler à chaque réponse
         HTErr.count()  HTErr.clearAll()
   Affichage : pose <div data-ht-errors></div> où tu veux.
   ============================================================ */
(function(){
  "use strict";
  var KEY = "htoeic_errors_v1";
  function load(){ try{ var r=localStorage.getItem(KEY); return r?JSON.parse(r):{v:1,items:{}}; }catch(e){ return {v:1,items:{}}; } }
  function save(s){ try{ localStorage.setItem(KEY, JSON.stringify(s)); }catch(e){} }
  var state = load();
  if(!state.items) state.items = {};

  function el(tag, props, kids){
    var n=document.createElement(tag);
    if(props){ for(var k in props){
      if(k==="class") n.className=props[k];
      else if(k==="text") n.textContent=props[k];
      else if(k==="html") n.innerHTML=props[k];
      else if(k.indexOf("on")===0 && typeof props[k]==="function") n.addEventListener(k.slice(2),props[k]);
      else n.setAttribute(k,props[k]);
    }}
    (kids||[]).forEach(function(c){ if(c==null) return; n.appendChild(typeof c==="string"?document.createTextNode(c):c); });
    return n;
  }
  function norm(q){
    q = q || {};
    return {
      stem: (q.stem!=null?q.stem:(q.prompt!=null?q.prompt:"")) + "",
      opts: Array.isArray(q.opts)?q.opts.slice():[],
      a: q.a,
      why: (q.why!=null?q.why:"") + "",
      skill: (q.skill!=null?q.skill:(q.dom!=null?q.dom:"")) + ""
    };
  }
  function sig(kind,nq){ return kind+"||"+nq.stem.slice(0,160); }

  var HTErr = window.HTErr = window.HTErr || {};

  HTErr.record = function(q, kind){
    kind = kind || "Exercice";
    var nq = norm(q);
    if(!nq.stem || !nq.opts.length) return;        // rien à rejouer sans énoncé/options
    var s = sig(kind, nq);
    var ex = state.items[s];
    state.items[s] = { kind:kind, q:nq, ts:Date.now(), count: ex?ex.count+1:1 };
    save(state); refresh();
  };
  HTErr.clear = function(kind, q){
    var s = sig(kind, norm(q));
    if(state.items[s]){ delete state.items[s]; save(state); refresh(); }
  };
  // Le hook unique à appeler à chaque réponse : range OU retire selon juste/faux
  HTErr.onAnswer = function(q, ok, kind){
    if(!q) return;
    if(ok) HTErr.clear(kind, q); else HTErr.record(q, kind);
  };
  HTErr.count = function(){ return Object.keys(state.items).length; };
  HTErr.list = function(){
    return Object.keys(state.items).map(function(k){ var it=state.items[k]; it._sig=k; return it; })
      .sort(function(a,b){ return b.ts-a.ts; });
  };
  HTErr.clearAll = function(){ state.items={}; save(state); refresh(); };

  /* ---------- Affichage ---------- */
  function letter(i){ return String.fromCharCode(65+i); }

  function renderItem(it){
    var card = el("div",{class:"hterr-item"});
    card.appendChild(el("div",{class:"hterr-tag",text: it.kind + (it.count>1?(" · vue "+it.count+"×"):"")}));
    card.appendChild(el("p",{class:"hterr-q",text: it.q.stem}));
    var opts = el("div",{class:"hterr-opts"});
    var answered = false;
    it.q.opts.forEach(function(opt, i){
      var btn = el("button",{type:"button",class:"hterr-opt",text: letter(i)+". "+opt});
      btn.addEventListener("click", function(){
        if(answered) return; answered = true;
        var good = (i === it.q.a);
        Array.prototype.forEach.call(opts.children, function(c,ci){
          c.disabled = true;
          if(ci===it.q.a) c.classList.add("is-correct");
          if(ci===i && !good) c.classList.add("is-wrong");
        });
        var fb = el("div",{class:"hterr-why"+(good?" ok":"")});
        if(good){
          fb.appendChild(el("strong",{text:"✅ Correct ! "}));
          fb.appendChild(document.createTextNode("Retiré de tes erreurs."));
          if(it.q.why) fb.appendChild(el("div",{class:"hterr-whytx",text: it.q.why}));
          if(window.HT && HT.xp){ try{ HT.xp.add(3,"révision erreur"); }catch(e){} }
          delete state.items[it._sig]; save(state);
          setTimeout(function(){ card.classList.add("done"); setTimeout(refresh, 450); }, 900);
        } else {
          fb.appendChild(el("strong",{text:"❌ Pas encore. "}));
          fb.appendChild(document.createTextNode("La bonne réponse est "+letter(it.q.a)+". Reste dans tes erreurs."));
          if(it.q.why) fb.appendChild(el("div",{class:"hterr-whytx",text: it.q.why}));
          var retry = el("button",{type:"button",class:"hterr-retry",text:"↻ Réessayer"});
          retry.addEventListener("click", function(){ refresh(); });
          fb.appendChild(retry);
        }
        card.appendChild(fb);
      });
      opts.appendChild(btn);
    });
    card.appendChild(opts);
    return card;
  }

  function renderInto(container){
    container.innerHTML = "";
    var items = HTErr.list();
    var wrap = el("div",{class:"hterr-wrap"});
    var head = el("div",{class:"hterr-head"},[
      el("strong",{class:"hterr-title",text:"📌 Mes erreurs à revoir ("+items.length+")"})
    ]);
    if(items.length){
      var clr = el("button",{type:"button",class:"hterr-clear",text:"Tout effacer"});
      clr.addEventListener("click", function(){ if(confirm("Vider toute la banque d'erreurs ?")) HTErr.clearAll(); });
      head.appendChild(clr);
    }
    wrap.appendChild(head);
    if(!items.length){
      wrap.appendChild(el("p",{class:"hterr-empty",text:"Aucune erreur en attente. Réponds à des exercices : tes erreurs apparaîtront ici pour être rejouées, puis disparaîtront dès que tu y répondras juste. 💪"}));
    } else {
      var list = el("div",{class:"hterr-list"});
      items.forEach(function(it){ list.appendChild(renderItem(it)); });
      wrap.appendChild(list);
    }
    container.appendChild(wrap);
  }
  function refresh(){
    Array.prototype.forEach.call(document.querySelectorAll("[data-ht-errors]"), renderInto);
  }

  /* ---------- Styles auto-injectés ---------- */
  function injectCSS(){
    if(document.getElementById("hterr-css")) return;
    var css = ""
    + ".hterr-wrap{font-family:system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:#1f2a44;}"
    + ".hterr-head{display:flex;align-items:center;justify-content:space-between;gap:.5rem;margin:.2rem 0 .8rem;}"
    + ".hterr-title{font-size:1.1rem;color:#3A63DB;}"
    + ".hterr-clear{border:1px solid #d7defb;background:#fff;border-radius:10px;padding:.35rem .7rem;cursor:pointer;font-weight:600;font-size:.85rem;}"
    + ".hterr-clear:hover{background:#eef2ff;}"
    + ".hterr-empty{background:#f1f4ff;border:1px dashed #c9d3f7;border-radius:12px;padding:1rem;color:#5b6478;}"
    + ".hterr-list{display:grid;gap:1rem;}"
    + ".hterr-item{border:1px solid #e3b7bd;background:#fdf6f7;border-radius:16px;padding:1rem;transition:opacity .4s,transform .4s;}"
    + ".hterr-item.done{opacity:0;transform:translateY(-6px);}"
    + ".hterr-tag{display:inline-block;background:#fdeaec;color:#b23a48;font-weight:800;font-size:.72rem;padding:.18rem .55rem;border-radius:999px;}"
    + ".hterr-q{margin:.55rem 0 .7rem;font-weight:600;}"
    + ".hterr-opts{display:grid;gap:.45rem;}"
    + ".hterr-opt{text-align:left;border:1px solid #d7defb;background:#fff;border-radius:12px;padding:.55rem .8rem;cursor:pointer;font-size:.95rem;}"
    + ".hterr-opt:hover:not(:disabled){background:#eef2ff;}"
    + ".hterr-opt:disabled{cursor:default;}"
    + ".hterr-opt.is-correct{border-color:#1E7A46;background:#e9f6ee;font-weight:700;}"
    + ".hterr-opt.is-wrong{border-color:#b23a48;background:#fdeaec;}"
    + ".hterr-why{margin-top:.7rem;font-size:.92rem;background:#fff;border:1px solid #d7defb;border-radius:12px;padding:.6rem .8rem;}"
    + ".hterr-why.ok{border-color:#1E7A46;background:#e9f6ee;}"
    + ".hterr-whytx{margin-top:.35rem;color:#5b6478;}"
    + ".hterr-retry{display:inline-block;margin-top:.5rem;border:1px solid #4F7CFF;background:#4F7CFF;color:#fff;border-radius:10px;padding:.35rem .7rem;cursor:pointer;font-weight:700;}"
    + "@media (prefers-reduced-motion:reduce){.hterr-item{transition:none;}}";
    var st = document.createElement("style"); st.id="hterr-css"; st.textContent=css;
    document.head.appendChild(st);
  }

  function init(){ injectCSS(); refresh(); }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
