/* Homemade TOEIC Trainer — bank quality fixes v27 */
(function(){"use strict";
function norm(s){return String(s||"").trim().toLowerCase().replace(/\s+/g," ")}
function fix(){var B=window.TOEIC_BANK;if(!B)return;var Q=B.QUESTIONS||[];function q(id){return Q.find(function(x){return x&&x.id===id})}
var x=q("X02-003");if(x){x.stem="According to the published opening schedule, the new branch ____ on 3 September.";x.opts=["opened","will open","has opened","opens"];x.a=3;x.why="A published timetable or schedule can use the present simple for a fixed future event: the branch opens on 3 September.";x.skill="Présent simple pour horaire futur";}
x=q("D10-001");if(x){x.stem="The prize money was distributed ____ all members of the winning team.";x.opts=["between","among","beside","across"];x.a=1;x.why="Among is natural for distribution within a group. Avoid the oversimplified rule 'between = two only': between can also be used with more than two when individual relationships are considered.";}
x=q("X08-011");if(x&&Array.isArray(x.opts))x.opts=x.opts.map(function(v){return v==="asster"?"assert":v});
x=q("I08-001");if(x){x.dom="Stratégie";x.skill="Réponse indirecte — entraînement Part 2";x.why="Cet item écrit entraîne la logique d'une réponse indirecte de Part 2 ; il ne mesure pas la compréhension orale.";}
x=q("J03-002");if(x){x.dom="Stratégie";x.skill="Inférence — entraînement Part 7";x.why="Cet item court entraîne une inférence de lecture ; il ne remplace pas une véritable question Part 7 sur document.";}
x=q("L08-001");if(x){x.stem="Au TOEIC, que vaut-il mieux faire si tu hésites entre plusieurs réponses ?";x.opts=["Laisser la case vide","Choisir quand même une réponse","Sauter toute la partie","Répondre deux fois"];x.a=1;x.why="Il n'y a pas de pénalité supplémentaire pour une mauvaise réponse : mieux vaut répondre à chaque question que laisser une case vide.";x.skill="Toujours répondre";}
var seen=new Set(),u=[];Q.forEach(function(z){if(!z||!Array.isArray(z.opts))return;var key=norm(z.stem)+"|"+norm(z.opts[z.a]);if(!seen.has(key)){seen.add(key);u.push(z)}});Q.splice.apply(Q,[0,Q.length].concat(u));
var V=B.VOCAB||[],m=new Map(),out=[];V.forEach(function(v){if(!v||!v.w)return;var cols=(v.col||[]).filter(function(c){return c&&!/TOEIC\s*(EXERCISE|COLLOCATIONS|SUPER|Favorite|Trap)|Match the word|Très fréquentes|⚠|Important$/i.test(String(c))});var k=norm(v.w);if(!m.has(k)){v.col=Array.from(new Set(cols));m.set(k,v);out.push(v)}else{var b=m.get(k);b.col=Array.from(new Set((b.col||[]).concat(cols)));}});V.splice.apply(V,[0,V.length].concat(out));
}
if(typeof document==="undefined")fix();else if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",fix);else fix();
})();
