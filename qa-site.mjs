#!/usr/bin/env node
/* Homemade TOEIC Trainer — zero-regression QA v27. No dependencies. */
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
const html=files.filter(f=>/\.html?$/i.test(f)), js=files.filter(f=>/\.js$/i.test(f)&&!f.endsWith('qa-site.mjs'));
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
try{const sw=fs.readFileSync(path.join(ROOT,'sw.js'),'utf8');if(!/homemade-toeic-v27/.test(sw))err('sw.js: expected cache homemade-toeic-v27');for(const m of sw.matchAll(/["']\.\/([^"']+)["']/g)){const u=m[1];if(u==='')continue;const f=path.join(ROOT,u);if(!fs.existsSync(f))err(`sw.js: cached file missing from repository: ${u}`)}ok()}catch(e){err(`sw.js check failed: ${e.message}`)}
// Shared bank: raw structural checks + post-fix quality checks.
try{const sandbox={window:{},document:undefined,Set,Map,Array,String,Object,RegExp};vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(ROOT,'toeic-bank.js'),'utf8'),sandbox,{filename:'toeic-bank.js'});let B=sandbox.window.TOEIC_BANK,Q=B?.QUESTIONS||[],V=B?.VOCAB||[];if(Q.length<100)err(`toeic-bank: suspiciously small question bank (${Q.length})`);let ids=new Set();for(const q of Q){if(!q?.id||ids.has(q.id))err(`toeic-bank: missing/duplicate question id ${q?.id}`);ids.add(q.id);if(!q?.stem||!Array.isArray(q.opts)||q.opts.length<2)err(`toeic-bank ${q?.id}: invalid stem/options`);if(!Number.isInteger(q.a)||q.a<0||q.a>=q.opts.length)err(`toeic-bank ${q?.id}: invalid answer index`);if(new Set(q.opts.map(x=>String(x).trim().toLowerCase())).size!==q.opts.length)err(`toeic-bank ${q?.id}: duplicate options`)}ok();
  const counts=[0,0,0,0];Q.forEach(q=>{if(q.opts?.length===4&&q.a>=0&&q.a<4)counts[q.a]++});const mx=Math.max(...counts),mn=Math.min(...counts);if(mx-mn>Q.length*.18)warn(`toeic-bank source answer positions are biased ${counts.join('/')}; ht-kit v27 rebalances them at runtime.`);
  vm.runInContext(fs.readFileSync(path.join(ROOT,'toeic-bank-fixes.js'),'utf8'),sandbox,{filename:'toeic-bank-fixes.js'});B=sandbox.window.TOEIC_BANK;Q=B.QUESTIONS;V=B.VOCAB;const stemSeen=new Set();for(const q of Q){const k=String(q.stem).trim().toLowerCase().replace(/\s+/g,' ')+'|'+String(q.opts[q.a]).trim().toLowerCase();if(stemSeen.has(k))err(`toeic-bank post-fix: exact duplicate remains: ${q.id}`);stemSeen.add(k)}if(JSON.stringify(Q).includes('asster'))err('toeic-bank post-fix: typo asster remains');const vk=new Set();for(const v of V){const k=String(v.w||'').trim().toLowerCase();if(vk.has(k))err(`toeic-bank post-fix: duplicate vocab entry ${v.w}`);vk.add(k);if((v.col||[]).some(c=>/TOEIC\s*(EXERCISE|COLLOCATIONS|SUPER|Favorite|Trap)|Match the word|⚠/i.test(String(c))))err(`toeic-bank post-fix: UI label leaked into collocations for ${v.w}`)}ok();
}catch(e){err(`toeic-bank QA could not run: ${e.stack||e.message}`)}
// Known high-risk regressions.
function text(name){const f=path.join(ROOT,name);return fs.existsSync(f)?fs.readFileSync(f,'utf8'):''}
let kingdom=text('successful-toeic-kingdom.html');if(kingdom){if(/parseInt\s*\([^\n]{0,120}replace\(\/\[\^0-9\]/.test(kingdom))err('Successful Kingdom: old money parser returned');if(!/August/.test(kingdom)||!/December/.test(kingdom))err('Successful Kingdom: month list incomplete');if(!/serviceWorker\.register/.test(kingdom))err('Successful Kingdom: no service worker registration');else ok()}
let modal=text('modal-galaxy-explorer.html');if(modal){const qids=[...modal.matchAll(/"id"\s*:\s*"(?:ability|obligation|prohibition|advice|permission|possibility|deduction|pastmodals)-\d+"/g)];if(qids.length!==112)err(`Modal Galaxy: expected 112 bank questions, found ${qids.length}`);if(!/modalGalaxyExplorer_v2/.test(modal))err('Modal Galaxy: v2 storage missing');else ok()}
let diag=text('diagnostic-toeic.html');if(diag){const qids=[...diag.matchAll(/"id"\s*:\s*"p[1-7]-\d+"/g)];if(qids.length!==24)err(`Diagnostic: expected 24 questions, found ${qids.length}`);for(let p=1;p<=7;p++)if(!new RegExp(`"part"\\s*:\\s*${p}`).test(diag))err(`Diagnostic: Part ${p} missing`);if(!/historyHtml/.test(diag)||!/recommendation\(/.test(diag))err('Diagnostic: P2 history/recommendation layer missing');else ok()}
console.log(`\nHomemade TOEIC Trainer QA v27`);console.log(`Checks passed: ${checks}`);if(warnings.length){console.log(`Warnings (${warnings.length}):`);warnings.forEach(x=>console.log('  ⚠ '+x))}if(errors.length){console.error(`Errors (${errors.length}):`);errors.forEach(x=>console.error('  ✖ '+x));process.exit(1)}console.log('Result: PASS — no blocking regression found.');
