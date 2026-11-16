'use strict';
(()=>{
 const alphabet=['∞','†','◉','⇡','▭','○','→','〰','✧','?','⊘','☲','∆','÷','≈','✛','⇤','≋','()','Y','≡'];
 const t={
 ca:{label:'Quin tema vols posar a debat?',placeholder:'Escriu un tema o una situació…',go:'Obrir el debat',wait:'Els símbols llegeixen el tema i preparen una escena…',error:'No s’ha pogut preparar el debat. Torna-ho a provar.',limit:'Has fet moltes proves seguides. Espera un minut.',invalid:'Escriu un tema entre 2 i 2.000 caràcters.',timeout:'El debat està trigant massa.',topic:'Tema',cast:'Mirades que entren al debat',emergence:'Les mirades juntes',open:'Mirada oberta',focusLabel:'Mirada concreta',focusPlaceholder:'Quin aspecte vols explorar? (p. ex. poder, història...)'},
 es:{label:'¿Qué tema quieres poner a debate?',placeholder:'Escribe un tema o una situación…',go:'Abrir el debate',wait:'Los símbolos leen el tema y preparan una escena…',error:'No se ha podido preparar el debate. Vuelve a intentarlo.',limit:'Has hecho demasiadas pruebas seguidas. Espera un minuto.',invalid:'Escribe un tema de 2 a 2.000 caracteres.',timeout:'El debate está tardando demasiado.',topic:'Tema',cast:'Miradas que entran al debate',emergence:'Las miradas juntas',open:'Mirada abierta',focusLabel:'Mirada concreta',focusPlaceholder:'¿Qué aspecto quieres explorar? (p. ej., poder, historia...)'},
 en:{label:'What topic would you like to debate?',placeholder:'Write a topic or situation…',go:'Open the debate',wait:'The symbols are reading the topic and preparing a scene…',error:'Could not prepare the debate. Please try again.',limit:'Too many requests. Wait a minute.',invalid:'Enter a topic between 2 and 2,000 characters.',timeout:'The debate is taking too long.',topic:'Topic',cast:'Perspectives in the debate',emergence:'Perspectives together',open:'Open perspective',focusLabel:'Specific perspective',focusPlaceholder:'Which aspect? (e.g. power, history...)'}
 };
 const make=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e;};
 document.querySelectorAll('[data-oraclia-debate]').forEach((root,i)=>{
  const lang=t[document.documentElement.lang]?document.documentElement.lang:'ca',v=t[lang];
  const form=make('form','debate-form'),label=make('label','',v.label),input=make('textarea'),go=make('button','debate-go',v.go),status=make('p','debate-status'),result=make('article','debate-result');
  input.id='debate-topic-'+i;label.htmlFor=input.id;input.required=true;input.minLength=2;input.maxLength=2000;input.rows=3;input.placeholder=v.placeholder;
  go.type='submit';result.hidden=true;result.setAttribute('aria-live','polite');status.setAttribute('role','status');
  const modes=make('div','debate-modes'),openLabel=make('label','debate-mode'),focusLabel=make('label','debate-mode'),openRadio=make('input'),focusRadio=make('input'),focusInput=make('input','debate-focus');
  openRadio.type='radio';focusRadio.type='radio';openRadio.name=focusRadio.name='debate-mode-'+i;openRadio.value='open';focusRadio.value='focus';openRadio.checked=true;
  openLabel.append(openRadio,document.createTextNode(' '+v.open));focusLabel.append(focusRadio,document.createTextNode(' '+v.focusLabel));modes.append(openLabel,focusLabel);
  focusInput.type='text';focusInput.maxLength=300;focusInput.minLength=2;focusInput.placeholder=v.focusPlaceholder;focusInput.hidden=true;focusInput.setAttribute('aria-label',v.focusLabel);
  const syncMode=()=>{focusInput.hidden=!focusRadio.checked;focusInput.required=focusRadio.checked;result.hidden=true;result.replaceChildren();status.textContent='';};openRadio.addEventListener('change',syncMode);focusRadio.addEventListener('change',syncMode);
  form.append(label,input,modes,focusInput,go);root.replaceChildren(form,status,result);
  let busy=false;input.addEventListener('input',()=>{result.hidden=true;result.replaceChildren();status.textContent='';});
  form.addEventListener('submit',async e=>{
   e.preventDefault();if(busy)return;const topic=input.value.trim(),mode=focusRadio.checked?'focus':'open',focus=mode==='focus'?focusInput.value.trim():null;if(topic.length<2||topic.length>2000||(mode==='focus'&&(focus.length<2||focus.length>300))){status.textContent=v.invalid;return;}
   busy=true;input.disabled=true;focusInput.disabled=true;openRadio.disabled=true;focusRadio.disabled=true;go.disabled=true;result.hidden=true;result.replaceChildren();status.textContent=v.wait;
   const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),120000);
   try{
    const response=await fetch((root.dataset.apiBase||'')+'/api/public/debate/generate',{method:'POST',credentials:'omit',signal:controller.signal,headers:{'Content-Type':'application/json','X-Library-Language':lang},body:JSON.stringify({topic,mode,focus})});
    const data=await response.json();if(!response.ok)throw Error(response.status===429?v.limit:v.error);
    if(data?.topic!==topic||!Array.isArray(data.symbols)||data.symbols.length<2||data.symbols.length>4||new Set(data.symbols).size!==data.symbols.length||data.symbols.some(g=>!alphabet.includes(g))||typeof data.title!=='string'||typeof data.setting!=='string'||!Array.isArray(data.dialogue)||data.dialogue.length<6||typeof data.emergence!=='string'||!data.emergence.trim())throw Error(v.error);
    const speakers=new Set(data.symbols);if(data.dialogue.some(x=>!speakers.has(x?.speaker)||typeof x.line!=='string'||!x.line.trim()))throw Error(v.error);
    const heading=make('h4','debate-topic',data.title),scene=make('p','debate-setting',data.setting),cast=make('p','debate-cast',v.cast+': '+data.symbols.join(' · '));
    result.append(heading,scene,cast);
    for(const turn of data.dialogue){const row=make('div','debate-turn'),speaker=make('span','debate-speaker',turn.speaker),line=make('p','',turn.line);row.append(speaker,line);result.append(row);}
    const emergence=make('section','debate-emergence'),eh=make('h5','debate-emergence-title',v.emergence),ep=make('p','',data.emergence);emergence.append(eh,ep);result.append(emergence);
    result.hidden=false;status.textContent='';
   }catch(err){status.textContent=err.name==='AbortError'?v.timeout:err.message||v.error;}
   finally{clearTimeout(timeout);busy=false;input.disabled=false;focusInput.disabled=false;openRadio.disabled=false;focusRadio.disabled=false;go.disabled=false;}
  });
 });
})();