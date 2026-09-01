#!/usr/bin/env node
/* Homemade TOEIC Trainer — zero-regression QA v30.10. No dependencies. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const ROOT=path.dirname(fileURLToPath(import.meta.url));
const SKIP=new Set(['.git','node_modules']);
let errors=[],warnings=[],checks=0;
const err=m=>errors.push(m), warn=m=>warnings.push(m), ok=()=>checks++;
function walk(dir){let out=[];for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(SKIP.has(e.name))continue;const p=path.join(dir,e.name);if(e.isDirectory())out.push(...walk(p));else out.push(p)}return out}
const files=walk(ROOT), rel=p=>path.relative(ROOT,p).replaceAll(path.sep,'/');
// Only deployable HTML pages at repository root are audited as pages.
// Nested HTML files under asset folders (for example images/index.html) are not site routes;
// resolving their relative href/src values as pages creates false missing-asset failures.
const html=files.filter(f=>/\.html?$/i.test(f)&&path.dirname(f)===ROOT), js=files.filter(f=>/\.js$/i.test(f)&&!f.endsWith('qa-site.mjs'));
const nestedHtml=files.filter(f=>/\.html?$/i.test(f)&&path.dirname(f)!==ROOT);if(nestedHtml.length)warn(`nested HTML ignored as non-route: ${nestedHtml.map(rel).join(', ')}`);
function cleanRef(v){return v.split('#')[0].split('?')[0].trim()}
function localTarget(from,v){v=cleanRef(v);if(!v||v==='#'||/^(?:https?:|mailto:|tel:|data:|blob:|javascript:)/i.test(v)||/[${}<>]/.test(v))return null;let t=v.startsWith('/')?path.join(ROOT,v.replace(/^\/+/,'')):path.resolve(path.dirname(from),v);if(v.endsWith('/'))t=path.join(t,'index.html');return t}
// JS files syntax
for(const f of js){const r=spawnSync(process.execPath,['--check',f],{encoding:'utf8'});if(r.status!==0)err(`${rel(f)}: JavaScript syntax error\n${r.stderr.trim()}`);else ok()}
// HTML: duplicate IDs, inline syntax, static refs
for(const f of html){const t=fs.readFileSync(f,'utf8');const markup=t.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'');const ids=[...markup.matchAll(/\bid\s*=\s*["']([^"']+)["']/gi)].map(m=>m[1]);const dup=[...new Set(ids.filter((x,i)=>ids.indexOf(x)!==i))];if(dup.length)err(`${rel(f)}: duplicate id(s): ${dup.join(', ')}`);else ok();
  for(const m of t.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){const attrs=m[1],code=m[2];if(/\bsrc\s*=/i.test(attrs)||/type\s*=\s*["'](?:application\/ld\+json|application\/json)["']/i.test(attrs))continue;try{new Function(code);ok()}catch(e){err(`${rel(f)}: inline script syntax error: ${e.message}`)}}
  const refs=[];for(const m of markup.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/gi))refs.push(m[1]);
  for(const v of refs){const target=localTarget(f,v);if(!target)continue;if(!fs.existsSync(target)){const ext=path.extname(cleanRef(v)).toLowerCase();if(['.html','.js','.css','.json','.webmanifest','.svg','.png','.jpg','.jpeg','.webp','.mp3','.wav'].includes(ext))err(`${rel(f)}: missing local asset ${v}`)}else ok()}
}
// Manifest
try{const mf=JSON.parse(fs.readFileSync(path.join(ROOT,'manifest.webmanifest'),'utf8'));if(mf.orientation!=='any')err('manifest.webmanifest: orientation must be any');for(const i of mf.icons||[]){if(!fs.existsSync(path.join(ROOT,i.src)))err(`manifest: missing icon ${i.src}`)}ok()}catch(e){err(`manifest.webmanifest invalid: ${e.message}`)}
// Service worker
try{const sw=fs.readFileSync(path.join(ROOT,'sw.js'),'utf8');if(!/homemade-toeic-v30/.test(sw))err('sw.js: expected cache homemade-toeic-v30');if(!/NETWORK_FIRST/.test(sw)||!/ht-kit\.js/.test(sw)||!/progress-core\.js/.test(sw))err('sw.js: critical deployment files must use network-first refresh');for(const m of sw.matchAll(/["']\.\/([^"']+)["']/g)){const u=m[1];if(u==='')continue;const f=path.join(ROOT,u);if(!fs.existsSync(f))err(`sw.js: cached file missing from repository: ${u}`)}ok()}catch(e){err(`sw.js check failed: ${e.message}`)}
try{const r=JSON.parse(fs.readFileSync(path.join(ROOT,'release.json'),'utf8'));if(r.release!==30)err(`release.json: expected release 30, found ${r.release}`);if(r.serviceWorkerCache!=='homemade-toeic-v30')err('release.json: service worker cache metadata mismatch');if(r.progressCore!==1)err('release.json: Progress Core v1 metadata missing');ok()}catch(e){err(`release.json invalid: ${e.message}`)}
try{const pc=fs.readFileSync(path.join(ROOT,'progress-core.js'),'utf8');if(!/global\.HTProgress=api/.test(pc)||!/EVENT_KEY="htoeic_progress_events_v1"/.test(pc))err('progress-core.js: public contract missing');ok()}catch(e){err(`progress-core.js check failed: ${e.message}`)}
const PROGRESS_PAGES=['diagnostic-toeic.html','sauvegarde-progression.html','flashcards.html','constructeur-de-phrases.html','prononciation-ecoute.html','corporate-mysteries.html','successful-toeic-kingdom.html','survival-island-listening.html','zombie-prepositions-survival.html','escape-game-toeic.html','detective-game.html','grammar-time-machine.html','phrasal-verb-city.html','modal-galaxy-explorer.html','system-check.html'];for(const n of PROGRESS_PAGES){const t=path.join(ROOT,n);if(!fs.existsSync(t)){err(`P4: supported page missing ${n}`);continue}const c=fs.readFileSync(t,'utf8');if(!/progress-core\.js/.test(c))err(`P4: ${n} does not load progress-core.js`);else ok()}
// Shared bank: raw structural checks + post-fix quality checks.
try{const sandbox={window:{},document:undefined,Set,Map,Array,String,Object,RegExp};vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(ROOT,'toeic-bank.js'),'utf8'),sandbox,{filename:'toeic-bank.js'});let B=sandbox.window.TOEIC_BANK,Q=B?.QUESTIONS||[],V=B?.VOCAB||[];if(Q.length!==210)err(`toeic-bank: P3 v28 audited exactly 210 source questions; found ${Q.length}. New/removed items require a fresh linguistic audit.`);let ids=new Set();for(const q of Q){if(!q?.id||ids.has(q.id))err(`toeic-bank: missing/duplicate question id ${q?.id}`);ids.add(q.id);if(!q?.stem||!Array.isArray(q.opts)||q.opts.length<2)err(`toeic-bank ${q?.id}: invalid stem/options`);if(!Number.isInteger(q.a)||q.a<0||q.a>=q.opts.length)err(`toeic-bank ${q?.id}: invalid answer index`);if(new Set(q.opts.map(x=>String(x).trim().toLowerCase())).size!==q.opts.length)err(`toeic-bank ${q?.id}: duplicate options`)}ok();
  const counts=[0,0,0,0];Q.forEach(q=>{if(q.opts?.length===4&&q.a>=0&&q.a<4)counts[q.a]++});const mx=Math.max(...counts),mn=Math.min(...counts);if(mx-mn>Q.length*.18)warn(`toeic-bank source answer positions are biased ${counts.join('/')}; ht-kit v30 rebalances them at runtime.`);
  vm.runInContext(fs.readFileSync(path.join(ROOT,'toeic-bank-fixes.js'),'utf8'),sandbox,{filename:'toeic-bank-fixes.js'});B=sandbox.window.TOEIC_BANK;Q=B.QUESTIONS;V=B.VOCAB;const stemSeen=new Set();for(const q of Q){const k=String(q.stem).trim().toLowerCase().replace(/\s+/g,' ')+'|'+String(q.opts[q.a]).trim().toLowerCase();if(stemSeen.has(k))err(`toeic-bank post-fix: exact duplicate remains: ${q.id}`);stemSeen.add(k)}if(JSON.stringify(Q).includes('asster'))err('toeic-bank post-fix: typo asster remains');
  const qBy=id=>Q.find(q=>q.id===id);
  const expect=(id,test,msg)=>{const q=qBy(id);if(!q||!test(q))err(`toeic-bank linguistic audit ${id}: ${msg}`)};
  expect('C02-001',q=>q.opts[q.a]==='be completed'&&/by every applicant/i.test(q.stem),'must be completed item needs an explicit passive context');
  expect('E10-001',q=>q.opts[q.a]==='make'&&!q.opts.includes('take'),'British-English ambiguity returned: take a decision is valid');
  expect('E10-002',q=>q.opts[q.a]==='take'&&!q.opts.includes('hold'),'take/hold responsibility ambiguity remains');
  expect('E11-001',q=>q.opts[q.a]==='meet'&&!q.opts.includes('reach'),'meet/reach deadline ambiguity remains');
  expect('E11-002',q=>q.opts[q.a]==='reached'&&!q.opts.includes('made'),'reach/make an agreement ambiguity remains');
  expect('E12-001',q=>q.opts[q.a]==='place'&&!q.opts.includes('make'),'place an order item needs one defensible answer');
  expect('E12-002',q=>q.opts[q.a]==='raise','raise awareness collocation missing');
  expect('E13-001',q=>q.opts[q.a]==='conduct'&&!q.opts.includes('do'),'do/conduct a survey ambiguity remains');
  expect('E14-002',q=>q.opts[q.a]==='handle'&&!q.opts.includes('take'),'handle/take complaints ambiguity remains');
  expect('E15-001',q=>q.opts[q.a]==='attend'&&!q.opts.includes('join'),'join/attend a conference ambiguity remains');
  expect('E16-001',q=>q.opts[q.a]==='sign'&&!q.opts.includes('write'),'sign/write a contract ambiguity remains');
  expect('E16-002',q=>q.opts[q.a]==='fill'&&!q.opts.includes('occupy'),'fill/occupy a position ambiguity remains');
  expect('E18-004',q=>q.opts[q.a]==='tight','tight schedule collocation missing');
  expect('E20-002',q=>q.opts[q.a]==='raise'&&!q.opts.includes('gain'),'raise/gain funds ambiguity remains');
  expect('F25-001',q=>q.opts[q.a]==='come up with'&&/from scratch/i.test(q.stem),'come up with item needs creation context');
  expect('F29-001',q=>q.opts[q.a]==='sign up for'&&/reserve a place/i.test(q.stem),'sign up for item needs enrolment context');
  expect('E20-001',q=>q.opts[q.a]==='take'&&!q.opts.includes('do')&&!q.opts.includes('write'),'minutes item must have one defensible answer');
  expect('F08-001',q=>q.opts[q.a]==='fill in','British-preferred fill in a form missing');
  expect('G06-001',q=>/consignment/i.test(q.opts[q.a]),'shipment needs contextual consignment answer');
  expect('G16-001',q=>/meeting will resume/i.test(q.stem),'resume needs verb context');
  expect('G18-001',q=>/complimentary breakfast/i.test(q.stem),'complimentary needs free-of-charge context');
  expect('G19-001',q=>/prompt reply/i.test(q.stem),'prompt needs response-time context');
  expect('G23-001',q=>/brief meeting/i.test(q.stem)&&q.opts[q.a]==='short','brief needs adjective context');
  expect('G26-001',q=>q.opts[q.a]==='available','vacant position must map to available');
  expect('G33-001',q=>/new and original/i.test(q.opts[q.a]),'innovative paraphrase must be precise');
  expect('G36-001',q=>/light snacks/i.test(q.opts[q.a]),'refreshments paraphrase must not overstate a full meal');
  expect('C11-001',q=>/Yesterday/.test(q.stem)&&q.opts[q.a]==='would','reported future needs an explicit past frame');
  expect('V03-001',q=>/mandatory/i.test(q.stem)&&q.opts[q.a]==='required','required/requested ambiguity needs mandatory context');
  expect('X03-001',q=>/10% discount/.test(q.stem)&&q.opts[q.a]==='will offer','first conditional needs a one-off future context');
  expect('X03-003',q=>/in order ____/.test(q.stem)&&q.opts[q.a]==='to confirm','purpose infinitive item needs an unambiguous in order to frame');
  expect('X05-001',q=>q.opts[q.a]==='hard'&&!q.opts.includes('harder'),'harder is a valid comparative adverb and must not be a distractor');
  expect('X05-005',q=>q.opts[q.a]==='is'&&/Neither option/.test(q.stem),'neither agreement item missing');
  expect('X07-003',q=>q.opts[q.a]==='into'&&/expand ____ the Asian market/i.test(q.stem),'grow/expand operations ambiguity remains');
  expect('X07-004',q=>q.opts[q.a]==='reduce'&&!q.opts.includes('drop'),'drop can be transitive and must not be a distractor');
  expect('X07-008',q=>q.opts[q.a]==='improve','customer satisfaction should use improve');
  expect('X07-010',q=>q.opts[q.a]==='signed'&&!q.opts.includes('made'),'sign/make a contract ambiguity remains');
  expect('X07-011',q=>q.opts[q.a]==='comply'&&/even if they disagree/i.test(q.stem),'comply/agree with regulations ambiguity remains');
  expect('X08-001',q=>q.opts[q.a]==='eligible','duplicate required-to item was not diversified');
  const vk=new Set();for(const v of V){const k=String(v.w||'').trim().toLowerCase();if(vk.has(k))err(`toeic-bank post-fix: duplicate vocab entry ${v.w}`);vk.add(k);if((v.col||[]).some(c=>/TOEIC\s*(EXERCISE|COLLOCATIONS|SUPER|Favorite|Trap|MASTER TABLE|EMAIL EXPRESSIONS)|Match the word|Phrasal VerbMeaning|⚠/i.test(String(c))))err(`toeic-bank post-fix: UI label leaked into collocations for ${v.w}`)}
  const byWord=w=>V.find(v=>String(v.w||'').trim().toLowerCase()===w.toLowerCase());
  const advanced=V.filter(v=>v.t==='Vocabulaire avancé');for(const v of advanced){if(!v.ipa)err(`toeic-bank vocabulary: advanced item missing IPA: ${v.w}`);if(!(v.col||[]).length)err(`toeic-bank vocabulary: advanced item missing collocations: ${v.w}`)}
  if(V.filter(v=>/CV \(UK\) \/ résumé \(US\)/.test(v.w||'')).length!==1)err('toeic-bank vocabulary: CV/résumé duplicates not canonicalised');
  if(V.filter(v=>/purchase order \(PO\)/i.test(v.w||'')).length!==1)err('toeic-bank vocabulary: purchase order duplicates not canonicalised');
  if(V.filter(v=>/enquiry \/ inquiry/i.test(v.w||'')).length!==1)err('toeic-bank vocabulary: enquiry/inquiry duplicates not canonicalised');
  let attendee=byWord('attendee');if(!attendee||attendee.ipa!=='/ə.tenˈdiː/')err('toeic-bank vocabulary: attendee UK IPA must be /ə.tenˈdiː/');
  let recently=byWord('recently');if(recently&&recently.ipa!=='/ˈriː.sənt.li/')err('toeic-bank vocabulary: recently UK IPA must be /ˈriː.sənt.li/');
  let up=byWord('upgrade');if(!up||!/verb \/ʌpˈɡreɪd\//.test(up.ipa||''))err('toeic-bank vocabulary: upgrade noun/verb stress not documented');
  let imp=byWord('import');if(!imp||!/verb \/ɪmˈpɔːt\//.test(imp.ipa||''))err('toeic-bank vocabulary: import noun/verb stress not documented');
  let comp=byWord('compliance');if(!comp||!/ensure compliance/i.test((comp.col||[]).join(' '))||!/compliance/i.test(comp.ex||''))err('toeic-bank vocabulary: compliance entry not linguistically aligned');
  let port=byWord('portfolio');if(!port||/open a bank account/i.test((port.col||[]).join(' '))||!/investment portfolio/i.test((port.col||[]).join(' ')))err('toeic-bank vocabulary: portfolio collocations contain leaked or missing content');
  if((sandbox.window.HT_BANK_LINGUISTIC_AUDIT||{}).version!==28)err('toeic-bank: linguistic audit metadata v28 missing');
  ok();
}catch(e){err(`toeic-bank QA could not run: ${e.stack||e.message}`)}
// Known high-risk regressions.
function text(name){const f=path.join(ROOT,name);return fs.existsSync(f)?fs.readFileSync(f,'utf8'):''}
// Runtime linguistic layer must mirror the standalone audited patch.
let kit=text('ht-kit.js');if(kit){if(!/P3 v28 — human linguistic audit/.test(kit)||!/questionsReviewed:210/.test(kit)||!/E20-001/.test(kit)||!/X07-004/.test(kit))err('ht-kit.js: P3 v28 linguistic runtime layer is missing or incomplete');if(!/P4\.5 v30/.test(kit)||!/progress-core\.js/.test(kit)||!/HT\.RELEASE=30/.test(kit))err('ht-kit.js: P4.5 v30 consolidation layer is missing');else ok();if(!/ainsi que ce site ont été créés par Eglantine Lecomte, avec l'assistance de ChatGPT/.test(kit))err('ht-kit.js: requested footer credit is missing');else ok();if(!/ht_sw_reloaded_v30/.test(kit))err('ht-kit.js: service-worker reload marker is stale');else ok()}

// Games, diagnostic and shared-tool regression checks.
let kingdom=text('successful-toeic-kingdom.html');if(kingdom){if(/parseInt\s*\([^\n]{0,120}replace\(\/\[\^0-9\]/.test(kingdom))err('Successful Kingdom: old money parser returned');if(!/August/.test(kingdom)||!/December/.test(kingdom))err('Successful Kingdom: month list incomplete');if(!/serviceWorker\.register/.test(kingdom))err('Successful Kingdom: no service worker registration');else ok()}
let modal=text('modal-galaxy-explorer.html');if(modal){const qids=[...modal.matchAll(/"id"\s*:\s*"(?:ability|obligation|prohibition|advice|permission|possibility|deduction|pastmodals)-\d+"/g)];if(qids.length!==112)err(`Modal Galaxy: expected 112 bank questions, found ${qids.length}`);if(!/modalGalaxyExplorer_v2/.test(modal))err('Modal Galaxy: v2 storage missing');if(!/serviceWorker\.register/.test(modal))err('Modal Galaxy: no service worker registration');else ok()}
let diag=text('diagnostic-toeic.html');if(diag){const qids=[...diag.matchAll(/"id"\s*:\s*"p[1-7]-\d+"/g)];if(qids.length!==24)err(`Diagnostic: expected 24 questions, found ${qids.length}`);for(let p=1;p<=7;p++)if(!new RegExp(`"part"\\s*:\\s*${p}`).test(diag))err(`Diagnostic: Part ${p} missing`);if(!/historyHtml/.test(diag)||!/recommendation\(/.test(diag))err('Diagnostic: P2 history/recommendation layer missing');if(/\/\s*990/.test(diag)&&/estimated|estimé/i.test(diag))err('Diagnostic: a homemade /990 estimate returned');if(!/function autoOpen\(\)[^{]*\{[\s\S]*validState\(db\.attempt\)[\s\S]*render\(\)/.test(diag))err('Diagnostic: refresh does not automatically resume an in-progress attempt');else ok()}
const gameRules=[
 ['corporate-mysteries.html',/CORP_MYSTERIES_V2/,/serviceWorker\.register/,/preload=["']auto["']/i],
 ['survival-island-listening.html',/HT_SURVIVAL_ISLAND_V1/,/serviceWorker\.register/,/preload=["']auto["']/i],
 ['zombie-prepositions-survival.html',/zombieGrammarSurvival_v2/,/serviceWorker\.register/,/preload=["']auto["']/i],
 ['escape-game-toeic.html',/toeicEscapeGame_v2/,/serviceWorker\.register/,/preload=["']auto["']/i],
 ['detective-game.html',/detectiveAcademy_v2/,/serviceWorker\.register/,/preload=["']auto["']/i],
 ['grammar-time-machine.html',/grammarTimeMachine_v2/,/serviceWorker\.register/,/preload=["']auto["']/i],
 ['phrasal-verb-city.html',/phrasalVerbCity_v2/,/serviceWorker\.register/,/preload=["']auto["']/i]
];
for(const [name,stateRe,swRe,preloadRe] of gameRules){const c=text(name);if(!c){err(`${name}: missing`);continue}if(!stateRe.test(c))err(`${name}: expected audited state schema missing`);if(!swRe.test(c))err(`${name}: service worker registration missing`);if(preloadRe.test(c))err(`${name}: preload=auto returned`);else ok()}
let sentence=text('constructeur-de-phrases.html');if(sentence){if(!/toeicSentenceBuilder_v1/.test(sentence)||!/best/.test(sentence)||!/solved/.test(sentence))err('Sentence Builder: v1 best/solved state contract missing');else ok();if(!/validated=false/.test(sentence)||!/if\(validated\)return/.test(sentence)||!/validated=true/.test(sentence))err('Sentence Builder: anti-farming guard missing; one solved phrase could be counted repeatedly');else ok();if(/\$=id=>document\.getElementById\(id\)/.test(sentence)&&/\$\('#/.test(sentence))err('Sentence Builder: broken selector helper uses getElementById with #-prefixed selectors');else ok()}
let pron=text('prononciation-ecoute.html');if(pron){if(/setTimeout\s*\(\s*\(\)\s*=>\s*say/.test(pron))err('Pronunciation: autoplay returned');if(!/employ-EE/.test(pron))err('Pronunciation: employee stress regression');if(/Please record the record\.|I will present the present\.|We expect sales to increase after the increase\./.test(pron))err('Pronunciation: ambiguous noun/verb stress item returned');if(!/speakItem\(current/.test(pron)||!/speakerVoice=new Map/.test(pron))err('Pronunciation: mini-dialogue speaker separation missing');if(!/Which stress pattern do you hear in record/.test(pron)||!/RE-cord \(noun\)/.test(pron)||!/re-CORD \(verb\)/.test(pron))err('Pronunciation: stress prompts are not explicit enough');else ok()}
let backup=text('sauvegarde-progression.html');if(backup){if(!/VERSION=4/.test(backup)||!/HTProgress\.keys/.test(backup))err('Backup: P4 whitelist/version contract missing');if(/for\s*\([^)]*localStorage\.length/.test(backup))err('Backup: whole-origin localStorage export returned');else ok()}
let sys=text('system-check.html');if(sys){if(!/(?:Deployment|Quality) check v30/.test(sys)||!/homemade-toeic-v30/.test(sys)||!/Progression unifiée/.test(sys))err('System Check: v30/progress checks missing');if(!/__htcheck/.test(sys)||!/freshSeq/.test(sys))err('System Check: cache-busting deployment verification missing');if(/Aucune voix anglaise trouvée/.test(sys))err('System Check: speech synthesis false-negative wording returned');else ok()}

// v30.9 live-dashboard coherence regressions.
{
  const kit309=text('ht-kit.js');
  if(kit309){
    if(!/v30\.9 — dashboard \/ unified-progress coherence hotfix/.test(kit309)) err('Dashboard: v30.9 coherence layer missing'); else ok();
    if(!/last!=="diagnostic"\|\|!btn/.test(kit309)||!/validAttempt\(a\)/.test(kit309)||!/setLast\(""\)/.test(kit309)) err('Dashboard: stale Diagnostic resume guard missing'); else ok();
    if(!/Progression unifiée/.test(kit309)||!/Sentence Builder/.test(kit309)||!/Pronunciation & Listening/.test(kit309)) err('Dashboard: unified Progress Core coverage is incomplete'); else ok();
    if(!/XP d’entraînement/.test(kit309)||!/gamifiée/.test(kit309)) err('Dashboard: XP scope is not explained clearly'); else ok();
  }
}


// v30.10 autonomous-games hardening regressions.
{
  const corp=text('corporate-mysteries.html');
  if(corp){
    if(/\.png\.png["']/i.test(corp)) err('Corporate Mysteries: doubled image extension returned'); else ok();
    if(!/const settings=\{\.\.\.state\.settings\}/.test(corp)||!/state\.settings=\{\.\.\.state\.settings,\.\.\.settings\}/.test(corp)) err('Corporate Mysteries: reset no longer preserves music/volume/contrast preferences'); else ok();
  }
  const grammar=text('grammar-time-machine.html');
  if(grammar){
    if(/audio\.pause\(\);S\.music=false;save\(\);reflectMusic\(\)/.test(grammar)) err('Grammar Time Machine: reset still forces the saved music preference off'); else ok();
    if(!/Music and volume preferences were kept/.test(grammar)) err('Grammar Time Machine: preference-preserving reset marker missing'); else ok();
  }
  const kingdom=text('successful-toeic-kingdom.html');
  if(kingdom){
    if(!/const music=state\.settings\.music/.test(kingdom)||!/state\.settings\.music=music/.test(kingdom)) err('Successful TOEIC Kingdom: reset no longer preserves music preference'); else ok();
  }
  const island=text('survival-island-listening.html');
  if(island){
    if(/The order total comes to sixteen fifty\./.test(island)) err('Survival Island: ambiguous bare “sixteen fifty” amount returned'); else ok();
    if(!/sixteen dollars and fifty cents/.test(island)) err('Survival Island: explicit $16.50 listening wording missing'); else ok();
    if(!/const settings=\{\.\.\.state\.settings\}/.test(island)||!/state\.settings=\{\.\.\.state\.settings,\.\.\.settings\}/.test(island)) err('Survival Island: reset no longer preserves music/accent preferences'); else ok();
  }
  const zombie=text('zombie-prepositions-survival.html');
  if(zombie){
    if(/She hurried ___ the lobby to catch the lift\./.test(zombie)||/The manager walked ___ the office and closed the door\./.test(zombie)) err('Zombie Survival: ambiguous movement prompt returned'); else ok();
    if(!/x\.mode==="zone"\?Q_PER_ZONE:Q_PER_ZONE\*ZONE_KEYS\.length/.test(zombie)) err('Zombie Survival: game-over denominator is not mode-aware'); else ok();
  }
}

console.log(`\nHomemade TOEIC Trainer QA v30`);console.log(`Checks passed: ${checks}`);if(warnings.length){console.log(`Warnings (${warnings.length}):`);warnings.forEach(x=>console.log('  ⚠ '+x))}if(errors.length){console.error(`Errors (${errors.length}):`);errors.forEach(x=>console.error('  ✖ '+x));process.exit(1)}console.log('Result: PASS — no blocking regression found.');
