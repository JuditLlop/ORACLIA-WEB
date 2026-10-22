'use strict';
(()=>{
 const panel=document.getElementById('or-theatre-panel');if(!panel)return;
 const open=document.getElementById('or-theatre-open'),close=document.getElementById('or-theatre-close'),form=document.getElementById('or-theatre-form'),input=document.getElementById('or-theatre-topic'),button=document.getElementById('or-theatre-generate'),status=document.getElementById('or-theatre-status'),result=document.getElementById('or-theatre-result');
 const lang=['ca','es','en'].includes(document.documentElement.lang)?document.documentElement.lang:'es';
 const copy={ca:{waiting:'El teló està a punt d’obrir-se…',error:'No s’ha pogut crear l’escena. Torna-ho a provar.',invalid:'Explica una situació d’entre 2 i 2.000 caràcters.',question:'Pregunta oberta: '},es:{waiting:'El telón está a punto de abrirse…',error:'No se ha podido crear la escena. Vuelve a intentarlo.',invalid:'Describe una situación de entre 2 y 2.000 caracteres.',question:'Pregunta abierta: '},en:{waiting:'The curtain is about to rise…',error:'The scene could not be created. Please try again.',invalid:'Describe a situation using 2 to 2,000 characters.',question:'Open question: '}}[lang];
 let busy=false;
 open.addEventListener('click',()=>{panel.hidden=false;open.setAttribute('aria-expanded','true');panel.scrollIntoView({block:'start',behavior:'smooth'});input.focus({preventScroll:true});});
 close.addEventListener('click',()=>{panel.hidden=true;open.setAttribute('aria-expanded','false');open.focus();});
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(busy)return;
  const topic=input.value.trim();
  if(topic.length<2||topic.length>2000){status.textContent=copy.invalid;return;}
  busy=true;button.disabled=true;input.disabled=true;input.blur();form.setAttribute('aria-busy','true');status.textContent=copy.waiting;
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
  finally{busy=false;button.disabled=false;input.disabled=false;form.setAttribute('aria-busy','false');}
 });
})();
