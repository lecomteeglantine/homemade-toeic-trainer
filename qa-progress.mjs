#!/usr/bin/env node
/* Homemade TOEIC Trainer — Progress Core contract QA v30. */
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT=path.dirname(fileURLToPath(import.meta.url));
const code=fs.readFileSync(path.join(ROOT,'progress-core.js'),'utf8');
class LocalStorage {
  constructor(){this.m=new Map()}
  getItem(k){k=String(k);return this.m.has(k)?this.m.get(k):null}
  setItem(k,v){this.m.set(String(k),String(v))}
  removeItem(k){this.m.delete(String(k))}
  clear(){this.m.clear()}
  key(i){return [...this.m.keys()][i]??null}
  get length(){return this.m.size}
}
const storage=new LocalStorage();
const sandbox={console,localStorage:storage};sandbox.window=sandbox;sandbox.globalThis=sandbox;
vm.createContext(sandbox);vm.runInContext(code,sandbox,{filename:'progress-core.js'});
const P=sandbox.HTProgress;if(!P||P.VERSION!==1)throw new Error('HTProgress v1 did not load');
const put=(k,v)=>storage.setItem(k,JSON.stringify(v));
const clear=()=>storage.clear();
const by=id=>P.activities().find(x=>x.id===id);
const eq=(a,b,m)=>{if(JSON.stringify(a)!==JSON.stringify(b))throw new Error(`${m}: ${JSON.stringify(a)} != ${JSON.stringify(b)}`)};
const is=(v,m)=>{if(!v)throw new Error(m)};

// Untouched baseline.
clear();
let s=P.summary();eq(s.started,0,'empty started');eq(s.completed,0,'empty completed');eq(s.activities.length,13,'activity adapter count');

// Exact resume state: a partially completed diagnostic is in progress, not completed.
put('ht_toeic_diagnostic_v3',{version:3,attempt:{index:7,completed:false},lastResult:null,history:[]});
eq(by('diagnostic').status,'in_progress','diagnostic resume status');eq(by('diagnostic').done,7,'diagnostic resume index');

// Complete fixtures for every game adapter.
clear();
put('l1toeic.v1',{global:{n:42,ok:31},mywords:['invoice'],a11y:{dyslexia:true},target:785,dailyGoal:15});
put('ht_toeic_diagnostic_v3',{version:3,attempt:null,lastResult:{ok:18,n:24,listening:{ok:8,n:12},reading:{ok:10,n:12}},history:[]});
put('CORP_MYSTERIES_V2',{completed:{case001:{accuracy:90}},score:170});
put('HT_TOEIC_KINGDOM_V1',{trials:{crimson:{done:true},british:{done:true},knights:{done:true},badger:{done:true},magician:{done:true},wooooow:{done:true},bridge:{done:true},palace:{done:true}},bonusCleared:true});
put('HT_SURVIVAL_ISLAND_V1',{completed:[1,2,3,4,5,6,7,8],stats:{answered:96,correct:81},adventure:{active:false}});
put('zombieGrammarSurvival_v2',{completed:{time:{},place:{},movement:{},work:{}},bestCampaignScore:410,run:null});
put('detectiveAcademy_v2',{started:true,completed:[0,1,2,3,4],finished:true,chestOpened:true,totalScore:420,bestScore:420});
put('toeicEscapeGame_v2',{started:true,completed:[0,1,2,3,4],finished:true,totalScore:390,bestScore:390});
put('grammarTimeMachine_v2',{completed:{e1:true,e2:true,e3:true,e4:true,e5:true},totalAnswered:50,totalCorrect:44,active:null});
put('phrasalVerbCity_v2',{completed:{d1:true,d2:true,d3:true,d4:true,d5:true,d6:true,d7:true,d8:true,d9:true,d10:true},lifetimeAnswered:100,lifetimeCorrect:84,run:null});
put('modalGalaxyExplorer_v2',{completedPlanets:['ability','obligation','prohibition','advice','permission','possibility','deduction','pastmodals'],lifetimeAnswered:96,lifetimeCorrect:80,bestJourneyScore:710,active:null});
put('toeicSentenceBuilder_v1',{best:6,solved:15});
put('htt_pron',{pairs:{c:3,t:4},stress:{c:2,t:4}});
storage.setItem('ht_accent','en-GB');storage.setItem('htoeic_speed_v1','0.9');
s=P.summary();
for(const id of ['diagnostic','corporate','kingdom','survival','zombie','detective','escape','grammar','phrasal','modal'])eq(by(id).status,'complete',`${id} completed`);
for(const id of ['training','sentences','pronunciation'])eq(by(id).status,'in_progress',`${id} ongoing`);
eq(by('pronunciation').done,8,'pronunciation c/t schema');
eq(s.completed,10,'completed module count');eq(s.started,13,'started module count');

// Snapshot is a whitelist, not the whole GitHub Pages origin.
storage.setItem('foreign-site-secret','leave-me-alone');
const snap=P.snapshot();is(!Object.prototype.hasOwnProperty.call(snap,'foreign-site-secret'),'snapshot leaked an unrelated localStorage key');is(Object.prototype.hasOwnProperty.call(snap,'modalGalaxyExplorer_v2'),'snapshot omitted TOEIC state');

// Reset clears every known progress key while preserving user-facing settings and other sites.
P.reset({preserveSettings:true});
is(storage.getItem('foreign-site-secret')==='leave-me-alone','reset touched unrelated origin data');
is(storage.getItem('ht_accent')==='en-GB','reset lost accent setting');is(storage.getItem('htoeic_speed_v1')==='0.9','reset lost speed setting');
const root=JSON.parse(storage.getItem('l1toeic.v1')||'{}');eq(root.target,785,'reset lost score target');eq(root.dailyGoal,15,'reset lost daily goal');is(root.a11y?.dyslexia===true,'reset lost accessibility setting');
for(const k of P.keys().filter(k=>!['l1toeic.v1','ht_accent','htoeic_speed_v1'].includes(k)))is(storage.getItem(k)===null,`reset left ${k}`);
eq(P.summary().started,0,'reset did not return activities to untouched');

// Subscriber contract keeps same-page dashboards in sync.
let notifications=0;const unsub=P.subscribe(()=>notifications++);
put('toeicSentenceBuilder_v1',{best:1,solved:1});
// In the Node VM there is no browser Storage prototype, so notify is exercised by reset below.
P.reset({preserveSettings:true});is(notifications>=1,'progress subscribers were not notified');unsub();

// Event log is local, bounded and serialisable.
P.record('diagnostic',{status:'complete',done:24,total:24});
eq(P.events().length,1,'event recording');is(P.events()[0].activity==='diagnostic','event activity');
for(let i=0;i<100;i++)P.record('training',{i});is(P.events().length<=80,'event log is not bounded');
console.log('Progress Core QA v30: PASS — 13 adapters, resume, completion, snapshot, reset and event log validated.');
