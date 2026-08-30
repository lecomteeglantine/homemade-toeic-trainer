/* Homemade TOEIC Trainer — bank corrections v24 */
(function(){"use strict";
function fix(){var B=window.TOEIC_BANK;if(!B)return;var Q=B.QUESTIONS||[];
function q(id){return Q.find(function(x){return x&&x.id===id;});}
var x=q("X02-003");if(x){x.stem="According to the published opening schedule, the new branch ____ on 3 September.";x.opts=["opened","will open","has opened","opens"];x.a=3;x.why="A published timetable or schedule can use the present simple for a fixed future event: the branch opens on 3 September.";x.skill="Présent simple pour horaire futur";}
x=q("D10-001");if(x){x.stem="The prize money was distributed ____ all members of the winning team.";x.opts=["between","among","beside","across"];x.a=1;x.why="Among is the natural choice for distribution within a group. Avoid the oversimplified rule 'between = two only': between can also be used with more than two when individual relationships are considered.";}
x=q("X08-011");if(x&&Array.isArray(x.opts)){x.opts=x.opts.map(function(v){return v==="asster"?"assert":v;});}
(B.VOCAB||[]).forEach(function(v){if(Array.isArray(v.col))v.col=v.col.filter(function(c){return !/TOEIC (EXERCISE|COLLOCATIONS|SUPER|Favorite|Trap)|Match the word|Très fréquentes|⚠/i.test(String(c));});});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",fix);else fix();
})();