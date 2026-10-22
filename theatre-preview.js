'use strict';
(()=>{
 const panel=document.getElementById('or-theatre-panel');if(!panel)return;
 const open=document.getElementById('or-theatre-open'),close=document.getElementById('or-theatre-close'),form=document.getElementById('or-theatre-form'),input=document.getElementById('or-theatre-topic'),button=document.getElementById('or-theatre-generate'),status=document.getElementById('or-theatre-status'),result=document.getElementById('or-theatre-result');
 const lang=['ca','es','en'].includes(document.documentElement.lang)?document.documentElement.lang:'es';
 const copy={ca:{error:'No s’ha pogut crear l’escena. Torna-ho a provar.',invalid:'Explica una situació d’entre 2 i 2.000 caràcters.',question:'Pregunta oberta: '},es:{error:'No se ha podido crear la escena. Vuelve a intentarlo.',invalid:'Describe una situación de entre 2 y 2.000 caracteres.',question:'Pregunta abierta: '},en:{error:'The scene could not be created. Please try again.',invalid:'Describe a situation using 2 to 2,000 characters.',question:'Open question: '}}[lang];
 function startTheatreWait(){
  const phrase={"ca": "Els símbols són entre bastidors… encara s’estan posant d’acord sobre qui surt primer.", "es": "Los símbolos están entre bastidores… todavía se están poniendo de acuerdo sobre quién sale primero.", "en": "The symbols are backstage… they’re still deciding who goes on first."}[lang];
  const status=document.getElementById('or-theatre-status'),spoken=document.createElement('span'),visual=document.createElement('span');
  spoken.className='or-preview-sr';spoken.textContent=phrase;
  visual.className='or-theatre-wait-visual';visual.setAttribute('aria-hidden','true');status.replaceChildren(spoken,visual);
  const words=phrase.split(/\s+/);let count=1,timer=null,stopped=false;
  function reveal(){if(stopped)return;visual.textContent=words.slice(0,count).join(' ');count++;timer=count<=words.length?setTimeout(reveal,850):null;}
  reveal();
  return ()=>{stopped=true;if(timer!==null)clearTimeout(timer);};
 }
 let busy=false;
 open.addEventListener('click',()=>{panel.hidden=false;open.setAttribute('aria-expanded','true');panel.scrollIntoView({block:'start',behavior:'smooth'});input.focus({preventScroll:true});});
 close.addEventListener('click',()=>{panel.hidden=true;open.setAttribute('aria-expanded','false');open.focus();});
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(busy)return;
  const topic=input.value.trim();
  if(topic.length<2||topic.length>2000){status.textContent=copy.invalid;return;}
  busy=true;button.disabled=true;input.disabled=true;input.blur();form.setAttribute('aria-busy','true');const stopWaiting=startTheatreWait();
  try{
   const response=await fetch('https://biblioteca-oraclia.onrender.com/api/public/theatre/generate',{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json','X-Library-Language':lang},body:JSON.stringify({topic})});
   let data=null;try{data=await response.json();}catch{}
   if(!response.ok)throw Error(typeof data?.detail==='string'?data.detail:copy.error);
   if(typeof data?.title!=='string'||typeof data.setting!=='string'||typeof data.question!=='string'||!Array.isArray(data.dialogue)||!data.dialogue.length||data.dialogue.some(t=>typeof t?.speaker!=='string'||typeof t?.line!=='string'))throw Error(copy.error);
   const fragment=document.createDocumentFragment(),title=document.createElement('h4'),setting=document.createElement('p');
   title.textContent=data.title;setting.className='or-theatre-setting';setting.textContent=data.setting;fragment.append(title,setting);
   for(const turn of data.dialogue){const line=document.createElement('p'),speaker=document.createElement('strong');speaker.textContent=turn.speaker+' — ';line.append(speaker,document.createTextNode(turn.line));fragment.append(line);}
   if(data.question.trim()){const question=document.createElement('p'),label=document.createElement('strong');label.textContent=copy.question;question.append(label,document.createTextNode(data.question));fragment.append(question);}
   const silence=document.createElement('p');silence.textContent='○';silence.className='or-theatre-silence';fragment.append(silence);
   result.replaceChildren(fragment);result.hidden=false;status.textContent='';
   if(!panel.hidden)result.scrollIntoView({block:'start',behavior:'smooth'});
  }catch(error){status.textContent=error.message||copy.error;}
  finally{stopWaiting();busy=false;button.disabled=false;input.disabled=false;form.setAttribute('aria-busy','false');}
 });
})();
