'use strict';
(()=>{
 const root=document.getElementById('or-fiches-preview');if(!root)return;
 const lang=['ca','es','en'].includes(document.documentElement.lang)?document.documentElement.lang:'es';
 const copy={
  ca:{waiting:'Una paraula sembla petita… fins que la mires de vint-i-una maneres.',invalid:'Escriu una sola paraula, sense espais.',failure:'No s’han pogut preparar les mirades. Torna-ho a provar.'},
  es:{waiting:'Una palabra parece pequeña… hasta que la miras de veintiuna maneras.',invalid:'Escribe una sola palabra, sin espacios.',failure:'No se han podido preparar las miradas. Vuelve a intentarlo.'},
  en:{waiting:'A word seems small… until you look at it in twenty-one different ways.',invalid:'Enter a single word, without spaces.',failure:'The perspectives could not be prepared. Please try again.'}
 }[lang];
 const find=name=>root.querySelector('[data-preview="'+name+'"]');
 const form=find('form'),input=find('input'),submit=find('submit'),stage=find('stage'),initial=find('initial'),waiting=find('waiting'),slide=find('slide'),nav=find('nav'),error=find('error');
 const alphabet=['∞','†','◉','⇡','▭','○','→','〰','✧','?','⊘','☲','∆','÷','≈','✛','⇤','≋','()','Y','≡'];
 const metadata={"ca":{"∞":{"name":"El Arca del Infinito","field":"possibilitats encara no esgotades per la forma actual"},"†":{"name":"El Arca de la Cruz","field":"allò que necessita un punt, una referència o una forma concreta"},"◉":{"name":"El Arca del Ojo Abierto","field":"condicions d’atenció, observació i disponibilitat que permeten percebre"},"⇡":{"name":"El Árbol de la Vida","field":"nutrició, sosteniment, reparació, adaptació, transformació i continuïtat"},"▭":{"name":"El Arca del Límite","field":"fronteres, marcs, separacions, contorns, allò que queda dins i fora"},"○":{"name":"El Arca del Silencio","field":"pausa, escolta, respiració, allò que encara no necessita paraula"},"→":{"name":"El Arca de la Propulsión","field":"inici de moviment, direcció, canvi de posició o estat"},"〰":{"name":"La Danza del Ritmo","field":"repetició, alternança, interval, pulsació i variació en el temps"},"✧":{"name":"El Arca de la Energía","field":"disponibilitat d’energia, inici o augment d’un procés"},"?":{"name":"El Arca de la Duda","field":"certeses que poden ser reobertes, alternatives, interrogació"},"⊘":{"name":"El Arca de DESTEM","field":"mutació, interrupció, esdeveniment no anticipat"},"☲":{"name":"El Arca de la Sombra Viva","field":"indicis, contorns, vulnerabilitats, informació incompleta però perceptible"},"∆":{"name":"El Arca sin Norte","field":"pèrdua de direcció, referència o centre"},"÷":{"name":"El Arca del Último Gesto","field":"finals, comiats, tancament irreversible d’un cicle"},"≈":{"name":"El Arca de la Templanza","field":"intensitat, proporció, regulació i ajust entre extrems"},"✛":{"name":"El Arca de la Carne","field":"sensació, necessitat, instint, plaer, dolor, supervivència i materialitat"},"⇤":{"name":"El Arca del Desaprender","field":"estructures apreses que han passat a semblar inevitables"},"≋":{"name":"El Arca del Reflejo Fluido","field":"allò que es reconeix reflectit en una altra persona, idea, forma o relació"},"()":{"name":"El Arca del VERBATEM","field":"dada, evidència formulable, allò que pot exposar-se sense afegir interpretació"},"Y":{"name":"El Arca de Y","field":"polaritats, bifurcacions i possibilitats simultànies"},"≡":{"name":"El Arca del Tercer Espacio","field":"relacions on del contacte entre dues posicions apareix alguna cosa que no pertany completament a cap de les dues"}},"es":{"∞":{"name":"El Arca del Infinito","field":"posibilidades aún no agotadas por la forma actual"},"†":{"name":"El Arca de la Cruz","field":"lo que necesita un punto, una referencia o una forma concreta"},"◉":{"name":"El Arca del Ojo Abierto","field":"condiciones de atención, observación y disponibilidad que permiten percibir"},"⇡":{"name":"El Árbol de la Vida","field":"nutrición, sostenimiento, reparación, adaptación, transformación y continuidad"},"▭":{"name":"El Arca del Límite","field":"fronteras, marcos, separaciones, contornos, lo que queda dentro y fuera"},"○":{"name":"El Arca del Silencio","field":"pausa, escucha, respiración, lo que aún no necesita palabras"},"→":{"name":"El Arca de la Propulsión","field":"inicio del movimiento, dirección, cambio de posición o estado"},"〰":{"name":"La Danza del Ritmo","field":"repetición, alternancia, intervalo, pulsación y variación en el tiempo"},"✧":{"name":"El Arca de la Energía","field":"disponibilidad de energía, inicio o aumento de un proceso"},"?":{"name":"El Arca de la Duda","field":"certezas que pueden reabrirse, alternativas, interrogación"},"⊘":{"name":"El Arca de DESTEM","field":"mutación, interrupción, acontecimiento no anticipado"},"☲":{"name":"El Arca de la Sombra Viva","field":"indicios, contornos, vulnerabilidades, información incompleta pero perceptible"},"∆":{"name":"El Arca sin Norte","field":"pérdida de dirección, referencia o centro"},"÷":{"name":"El Arca del Último Gesto","field":"finales, despedidas, cierre irreversible de un ciclo"},"≈":{"name":"El Arca de la Templanza","field":"intensidad, proporción, regulación y ajuste entre extremos"},"✛":{"name":"El Arca de la Carne","field":"sensación, necesidad, instinto, placer, dolor, supervivencia y materialidad"},"⇤":{"name":"El Arca del Desaprender","field":"estructuras aprendidas que han llegado a parecer inevitables"},"≋":{"name":"El Arca del Reflejo Fluido","field":"lo que se reconoce reflejado en otra persona, idea, forma o relación"},"()":{"name":"El Arca del VERBATEM","field":"dato, evidencia formulable, lo que puede exponerse sin añadir interpretación"},"Y":{"name":"El Arca de Y","field":"polaridades, bifurcaciones y posibilidades simultáneas"},"≡":{"name":"El Arca del Tercer Espacio","field":"relaciones donde el contacto entre dos posiciones hace aparecer algo que no pertenece por completo a ninguna de ellas"}},"en":{"∞":{"name":"El Arca del Infinito","field":"possibilities not yet exhausted by the current form"},"†":{"name":"El Arca de la Cruz","field":"what needs a point, a reference or a concrete form"},"◉":{"name":"El Arca del Ojo Abierto","field":"conditions of attention, observation and receptiveness that enable perception"},"⇡":{"name":"El Árbol de la Vida","field":"nourishment, support, repair, adaptation, transformation and continuity"},"▭":{"name":"El Arca del Límite","field":"boundaries, frames, separations, contours, what lies inside and outside"},"○":{"name":"El Arca del Silencio","field":"pause, listening, breathing, what does not yet need words"},"→":{"name":"El Arca de la Propulsión","field":"onset of movement, direction, change of position or state"},"〰":{"name":"La Danza del Ritmo","field":"repetition, alternation, intervals, pulse and variation over time"},"✧":{"name":"El Arca de la Energía","field":"availability of energy, the beginning or intensification of a process"},"?":{"name":"El Arca de la Duda","field":"certainties that can be reopened, alternatives, inquiry"},"⊘":{"name":"El Arca de DESTEM","field":"mutation, interruption, an unanticipated event"},"☲":{"name":"El Arca de la Sombra Viva","field":"clues, contours, vulnerabilities, incomplete yet perceptible information"},"∆":{"name":"El Arca sin Norte","field":"loss of direction, reference or centre"},"÷":{"name":"El Arca del Último Gesto","field":"endings, farewells, the irreversible closing of a cycle"},"≈":{"name":"El Arca de la Templanza","field":"intensity, proportion, regulation and adjustment between extremes"},"✛":{"name":"El Arca de la Carne","field":"sensation, need, instinct, pleasure, pain, survival and materiality"},"⇤":{"name":"El Arca del Desaprender","field":"learned structures that have come to seem inevitable"},"≋":{"name":"El Arca del Reflejo Fluido","field":"what is recognised as reflected in another person, idea, form or relationship"},"()":{"name":"El Arca del VERBATEM","field":"data, articulable evidence, what can be stated without adding interpretation"},"Y":{"name":"El Arca de Y","field":"polarities, forks and simultaneous possibilities"},"≡":{"name":"El Arca del Tercer Espacio","field":"relationships in which contact between two positions gives rise to something that belongs fully to neither"}}};
 let phrases=[],index=0,word='',busy=false;
 function mode(value){
  initial.hidden=value!=='initial';waiting.hidden=value!=='waiting';slide.hidden=value!=='result';nav.hidden=value!=='result';
  stage.classList.toggle('is-waiting',value==='waiting');
 }
 function render(){
  const row=phrases[index];
  find('word').textContent=word;find('glyph').textContent=row.glyph;find('phrase').textContent=row.phrase;
  find('name').textContent=metadata[lang][row.glyph].name;find('field').textContent=metadata[lang][row.glyph].field;
  find('count').textContent=(index+1)+' / '+phrases.length;
  mode('result');
 }
 function startWaiting(){
  const spoken=document.createElement('span'),visual=document.createElement('span');
  spoken.className='or-preview-sr';spoken.textContent=copy.waiting;
  visual.className='or-preview-wait-visual';visual.setAttribute('aria-hidden','true');waiting.replaceChildren(spoken,visual);
  const words=copy.waiting.split(/\s+/);let count=1,timer=null,stopped=false;
  function reveal(){if(stopped)return;visual.textContent=words.slice(0,count).join(' ');count++;timer=count<=words.length?setTimeout(reveal,850):null;}
  mode('waiting');reveal();stage.scrollIntoView({block:'nearest',behavior:'smooth'});
  return ()=>{stopped=true;if(timer!==null)clearTimeout(timer);waiting.replaceChildren();};
 }
 find('previous').addEventListener('click',()=>{if(!phrases.length||busy)return;index=(index-1+phrases.length)%phrases.length;render();});
 find('next').addEventListener('click',()=>{if(!phrases.length||busy)return;index=(index+1)%phrases.length;render();});
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(busy)return;
  const nextWord=input.value.trim();error.hidden=true;
  if(nextWord.length<2||nextWord.length>110||/\s/u.test(nextWord)){error.textContent=copy.invalid;error.hidden=false;return;}
  busy=true;input.blur();input.disabled=true;submit.disabled=true;form.setAttribute('aria-busy','true');
  const stopWaiting=startWaiting();
  try{
   const response=await fetch('https://biblioteca-oraclia.onrender.com/api/public/symbols/theme',{
    method:'POST',credentials:'omit',headers:{'Content-Type':'application/json','X-Library-Language':lang},body:JSON.stringify({theme:nextWord})
   });
   let data=null;try{data=await response.json();}catch{}
   if(!response.ok)throw Error(typeof data?.detail==='string'?data.detail:copy.failure);
   if(!Array.isArray(data?.phrases)||data.phrases.length!==21)throw Error(copy.failure);
   const rows=new Map(data.phrases.map(row=>[row.glyph,row.phrase]));
   if(rows.size!==21||alphabet.some(g=>typeof rows.get(g)!=='string'||!rows.get(g).trim()))throw Error(copy.failure);
   phrases=alphabet.map(glyph=>({glyph,phrase:rows.get(glyph)}));word=nextWord;index=0;render();
  }catch(failure){
   error.textContent=failure.message||copy.failure;error.hidden=false;
   if(phrases.length)render();else mode('initial');
  }finally{
   stopWaiting();busy=false;input.disabled=false;submit.disabled=false;form.setAttribute('aria-busy','false');
  }
 });
})();
