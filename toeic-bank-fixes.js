/* Homemade TOEIC Trainer — human linguistic audit fixes v28 */
(function(){"use strict";
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

function run(){var r=applyLinguisticAudit(window.TOEIC_BANK);window.HT_BANK_QUALITY=Object.assign({version:28},r||{});}
if(typeof document==="undefined")run();else if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",run);else run();
})();
