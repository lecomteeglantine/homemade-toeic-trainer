/* ============================================================
   Homemade TOEIC Trainer — Progress Core v1 (release v29)
   One read/write contract for all local progress. No server.
   ============================================================ */
(function(global){
  "use strict";
  var VERSION=1, EVENT_KEY="htoeic_progress_events_v1";
  var KEYS=[
    "l1toeic.v1","htoeic_gamify_v1","htoeic_errors_v1","toeicDaily_v1","ht_toeic_diagnostic_v3",
    "CORP_MYSTERIES_V2","CORP_MYSTERIES_V1","HT_TOEIC_KINGDOM_V1","HT_SURVIVAL_ISLAND_V1",
    "zombieGrammarSurvival_v2","zombieGrammarSurvival_v1","detectiveAcademy_v2","detectiveAcademy_v1",
    "toeicEscapeGame_v2","toeicEscapeGame_v1","grammarTimeMachine_v2","grammarTimeMachine_v1",
    "phrasalVerbCity_v2","phrasalVerbCity_v1","modalGalaxyExplorer_v2","modalGalaxyExplorer_v1",
    "toeicSentenceBuilder_v1","htt_pron","ht_accent","htoeic_speed_v1",EVENT_KEY
  ];
  function uniq(a){return Array.from(new Set(a));}
  function raw(key){try{return global.localStorage?global.localStorage.getItem(key):null}catch(e){return null}}
  function json(key){var v=raw(key);if(v==null)return null;try{return JSON.parse(v)}catch(e){return null}}
  function n(v){v=Number(v);return Number.isFinite(v)?Math.max(0,v):0}
  function arr(v){return Array.isArray(v)?v:[]}
  function obj(v){return v&&typeof v==="object"&&!Array.isArray(v)?v:{}}
  function pct(ok,total){return total?Math.round(ok/total*100):0}
  function status(started,complete){return complete?"complete":started?"in_progress":"untouched"}
  function act(id,label,started,complete,done,total,extra){var out={id:id,label:label,status:status(started,complete),done:n(done),total:total==null?null:n(total)};if(out.total!=null)out.percent=pct(Math.min(out.done,out.total),out.total);if(extra)Object.assign(out,extra);return out}
  function rootActivity(){var s=obj(json("l1toeic.v1")),g=obj(s.global),answered=n(g.n),words=arr(s.mywords).length;return act("training","Homepage training",answered>0||words>0,false,answered,null,{answered:answered,words:words});}
  function diagnostic(){var s=obj(json("ht_toeic_diagnostic_v3")),r=s.lastResult,a=s.attempt;var complete=!!r,started=complete||!!a;return act("diagnostic","Mini-diagnostic",started,complete,complete?n(r.ok):a?n(a.index):0,complete?n(r.n):24,{listening:r&&r.listening?r.listening:null,reading:r&&r.reading?r.reading:null});}
  function corporate(){var s=obj(json("CORP_MYSTERIES_V2")),done=Object.keys(obj(s.completed)).length;return act("corporate","Corporate Mysteries",done>0||n(s.score)>0,done>=1,done,1,{score:n(s.score)});}
  function kingdom(){var s=obj(json("HT_TOEIC_KINGDOM_V1")),tr=obj(s.trials),done=Object.values(tr).filter(function(x){return x&&x.done}).length;return act("kingdom","Successful TOEIC Kingdom",done>0||Object.keys(tr).length>0,done>=8,done,8,{bonus:!!s.bonusCleared});}
  function survival(){var s=obj(json("HT_SURVIVAL_ISLAND_V1")),done=uniq(arr(s.completed)).length,started=done>0||!!obj(s.adventure).active||n(obj(s.stats).answered)>0;return act("survival","Survival Island",started,done>=8,done,8,{answered:n(obj(s.stats).answered),correct:n(obj(s.stats).correct)});}
  function zombie(){var s=obj(json("zombieGrammarSurvival_v2")||json("zombieGrammarSurvival_v1")),done=Object.keys(obj(s.completed)).length;return act("zombie","Zombie Grammar Survival",done>0||!!s.run||!!s.lastResult,done>=4,done,4,{bestScore:n(s.bestCampaignScore||s.bestScore)});}
  function detective(){var s=obj(json("detectiveAcademy_v2")||json("detectiveAcademy_v1")),done=uniq(arr(s.completed)).length,complete=!!s.finished||!!s.chestOpened||done>=5;return act("detective","Detective Academy",!!s.started||done>0,complete,done,5,{score:n(s.totalScore),best:n(s.bestScore)});}
  function escape(){var s=obj(json("toeicEscapeGame_v2")||json("toeicEscapeGame_v1")),done=uniq(arr(s.completed)).length,complete=!!s.finished||done>=5;return act("escape","Escape Game TOEIC",!!s.started||done>0,complete,done,5,{score:n(s.totalScore),best:n(s.bestScore)});}
  function grammar(){var s=obj(json("grammarTimeMachine_v2")||json("grammarTimeMachine_v1")),done=Object.keys(obj(s.completed)).length;return act("grammar","Grammar Time Machine",done>0||!!s.active,done>=5,done,5,{answered:n(s.totalAnswered),correct:n(s.totalCorrect)});}
  function phrasal(){var s=obj(json("phrasalVerbCity_v2")||json("phrasalVerbCity_v1")),done=Object.keys(obj(s.completed)).length;return act("phrasal","Phrasal Verb City",done>0||!!s.run,done>=10,done,10,{answered:n(s.lifetimeAnswered),correct:n(s.lifetimeCorrect)});}
  function modal(){var s=obj(json("modalGalaxyExplorer_v2")||json("modalGalaxyExplorer_v1")),done=uniq(arr(s.completedPlanets)).length;return act("modal","Modal Galaxy Explorer",done>0||!!s.active,done>=8,done,8,{answered:n(s.lifetimeAnswered),correct:n(s.lifetimeCorrect),best:n(s.bestJourneyScore)});}
  function sentence(){var s=obj(json("toeicSentenceBuilder_v1")),solved=n(s.solved);return act("sentences","Sentence Builder",solved>0,false,solved,null,{bestStreak:n(s.best)});}
  function pron(){var s=obj(json("htt_pron")),answered=0,correct=0;Object.keys(s).forEach(function(k){var v=s[k];if(v&&typeof v==="object"){answered+=n(v.t||v.n||v.answered);correct+=n(v.c||v.ok||v.correct)}});return act("pronunciation","Pronunciation & Listening",answered>0,false,answered,null,{correct:correct});}
  var ADAPTERS=[rootActivity,diagnostic,corporate,kingdom,survival,zombie,detective,escape,grammar,phrasal,modal,sentence,pron];
  function activities(){return ADAPTERS.map(function(fn){try{return fn()}catch(e){return {id:"unknown",label:"Unknown",status:"untouched",done:0,total:null,error:true}}});}
  function events(){var e=json(EVENT_KEY);return Array.isArray(e)?e:[]}
  var recording=false,lastSig={},listeners=[];
  function notify(key){listeners.slice().forEach(function(fn){try{fn(key,summary())}catch(e){}})}
  function subscribe(fn){if(typeof fn!=="function")return function(){};listeners.push(fn);return function(){listeners=listeners.filter(function(x){return x!==fn})}}
  function writeEvents(list){if(!global.localStorage)return;try{recording=true;global.localStorage.setItem(EVENT_KEY,JSON.stringify(list.slice(-80)))}catch(e){}finally{recording=false}}
  function record(activity,detail){if(!activity)return;var list=events(),ev={at:new Date().toISOString(),activity:String(activity),detail:detail||null};list.push(ev);writeEvents(list);return ev}
  function summary(){var a=activities(),started=a.filter(function(x){return x.status!=="untouched"}),completed=a.filter(function(x){return x.status==="complete"});return {version:VERSION,started:started.length,completed:completed.length,activities:a,lastEvent:events().slice(-1)[0]||null};}
  function snapshot(){var out={};KEYS.forEach(function(k){var v=raw(k);if(v!==null)out[k]=v});return out}
  function reset(opts){opts=opts||{};var preserve=opts.preserveSettings!==false,keep={};if(preserve){var r=obj(json("l1toeic.v1"));keep.a11y=r.a11y;keep.target=r.target;keep.dailyGoal=r.dailyGoal;keep.accent=raw("ht_accent");keep.speed=raw("htoeic_speed_v1");}
    KEYS.forEach(function(k){try{global.localStorage&&global.localStorage.removeItem(k)}catch(e){}});
    if(preserve&&global.localStorage){var root={};if(keep.a11y)root.a11y=keep.a11y;if(keep.target!=null)root.target=keep.target;if(keep.dailyGoal!=null)root.dailyGoal=keep.dailyGoal;try{global.localStorage.setItem("l1toeic.v1",JSON.stringify(root));if(keep.accent!=null)global.localStorage.setItem("ht_accent",keep.accent);if(keep.speed!=null)global.localStorage.setItem("htoeic_speed_v1",keep.speed)}catch(e){}}
    notify("reset");return true;
  }
  function activityForKey(key){var map={"l1toeic.v1":"training","ht_toeic_diagnostic_v3":"diagnostic","CORP_MYSTERIES_V2":"corporate","HT_TOEIC_KINGDOM_V1":"kingdom","HT_SURVIVAL_ISLAND_V1":"survival","zombieGrammarSurvival_v2":"zombie","detectiveAcademy_v2":"detective","toeicEscapeGame_v2":"escape","grammarTimeMachine_v2":"grammar","phrasalVerbCity_v2":"phrasal","modalGalaxyExplorer_v2":"modal","toeicSentenceBuilder_v1":"sentences","htt_pron":"pronunciation"};return map[key]||null}
  function installMonitor(){if(!global.Storage||!global.Storage.prototype||global.Storage.prototype.__htProgressPatched)return false;var p=global.Storage.prototype,orig=p.setItem;try{p.setItem=function(k,v){var ret=orig.apply(this,arguments);if(!recording){var id=activityForKey(String(k));if(id){var a=activities().find(function(x){return x.id===id}),sig=a?JSON.stringify([a.status,a.done,a.total,a.score,a.best,a.answered,a.correct]):String(v).length;if(lastSig[id]!==sig){lastSig[id]=sig;record(id,{status:a&&a.status,done:a&&a.done,total:a&&a.total});notify(String(k));}}}return ret};p.__htProgressPatched=true;return true}catch(e){return false}}
  var api={VERSION:VERSION,EVENT_KEY:EVENT_KEY,keys:function(){return KEYS.slice()},readJSON:json,activities:activities,summary:summary,snapshot:snapshot,reset:reset,record:record,events:events,subscribe:subscribe,installMonitor:installMonitor};
  global.HTProgress=api;installMonitor();
})(typeof window!=="undefined"?window:globalThis);
