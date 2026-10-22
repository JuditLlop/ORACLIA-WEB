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
 let phrases=[],index=0,word='',busy=false;
 function mode(value){
  initial.hidden=value!=='initial';waiting.hidden=value!=='waiting';slide.hidden=value!=='result';nav.hidden=value!=='result';
  stage.classList.toggle('is-waiting',value==='waiting');
 }
 function render(){
  const row=phrases[index];
  find('word').textContent=word;find('glyph').textContent=row.glyph;find('phrase').textContent=row.phrase;
  find('count').textContent=(index+1)+' / '+phrases.length;
  mode('result');
 }
 function startWaiting(){
  const spoken=document.createElement('span'),visual=document.createElement('span');
  spoken.className='or-preview-sr';spoken.textContent=copy.waiting;
  visual.className='or-preview-wait-visual';visual.setAttribute('aria-hidden','true');waiting.replaceChildren(spoken,visual);
  const words=copy.waiting.split(/\s+/);let count=1,timer=null,stopped=false;
  function reveal(){if(stopped)return;visual.textContent=words.slice(0,count).join(' ');count++;timer=count<=words.length?setTimeout(reveal,850):null;}
  mode('waiting');reveal();
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
