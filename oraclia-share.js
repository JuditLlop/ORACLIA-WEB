/* Export only the visible conversation; sharing requires an explicit click. */
(() => {
  'use strict';
  const lang = (document.documentElement.lang || 'es').split('-')[0];
  const labels = ({
    ca:{pdf:'Desar conversa en PDF',share:'Compartir fragment',title:'Comparteix un fragment',hint:'Pots retallar o editar el text. Només es compartirà aquest fragment; el destinatari el tries a WhatsApp.',text:'Text per compartir',open:'Obrir WhatsApp',cancel:'Cancel·lar',empty:'Encara no hi ha cap conversa per desar.',wait:'Espera que acabi la resposta abans de desar-la.',pdfHint:'A la finestra d’impressió, tria «Desar com a PDF». Al mòbil, utilitza les opcions d’impressió o de compartir del dispositiu.',you:'Tu'},
    es:{pdf:'Guardar conversación en PDF',share:'Compartir fragmento',title:'Comparte un fragmento',hint:'Puedes recortar o editar el texto. Solo se compartirá este fragmento; eliges el destinatario en WhatsApp.',text:'Texto para compartir',open:'Abrir WhatsApp',cancel:'Cancelar',empty:'Todavía no hay ninguna conversación para guardar.',wait:'Espera a que termine la respuesta antes de guardarla.',pdfHint:'En la ventana de impresión, elige «Guardar como PDF». En el móvil, utiliza las opciones de impresión o de compartir del dispositivo.',you:'Tú'},
    en:{pdf:'Save conversation as PDF',share:'Share excerpt',title:'Share an excerpt',hint:'You can shorten or edit the text. Only this excerpt is shared; choose the recipient in WhatsApp.',text:'Text to share',open:'Open WhatsApp',cancel:'Cancel',empty:'There is no conversation to save yet.',wait:'Wait for the response to finish before saving.',pdfHint:'Choose “Save as PDF” in the print dialog. On mobile, use your device’s print or share options.',you:'You'}
  })[lang] || {pdf:'Save as PDF',share:'Share excerpt',title:'Share',hint:'Edit the excerpt before sharing.',text:'Text',open:'Open WhatsApp',cancel:'Cancel',empty:'No conversation.',wait:'Wait for the response.',pdfHint:'Choose Save as PDF in the print dialog.',you:'You'};
  const status = document.getElementById('or-status');
  const pdf = document.createElement('button'); pdf.type='button'; pdf.id='or-pdf'; pdf.textContent=labels.pdf;
  document.getElementById('or-export').before(pdf);
  pdf.addEventListener('click', () => {
    if (document.getElementById('or-send').disabled) { status.textContent=labels.wait; return; }
    const messages=[...document.querySelectorAll('#or-messages .or-message')];
    if (!messages.length) { status.textContent=labels.empty; return; }
    const printArea=document.createElement('section');printArea.id='or-print';
    const title=document.createElement('h1');title.textContent='Oraclia';printArea.appendChild(title);
    for (const message of messages) {
      const block=document.createElement('article');
      const author=document.createElement('h2');author.textContent=message.classList.contains('user')?labels.you:'Oraclia';
      // Copy only rendered message prose, never saved archives or hidden trace data.
      const body=message.querySelector('.or-message-body').cloneNode(true);
      block.append(author,body);printArea.appendChild(block);
    }
    document.getElementById('or-print')?.remove();document.body.appendChild(printArea);
    document.querySelector('.or-compose-menu')?.removeAttribute('open');
    status.textContent=labels.pdfHint;
    window.print();
  });
  window.addEventListener('afterprint',()=>document.getElementById('or-print')?.remove());

  const wording = ({
    ca:{share:'Compartir conversa',title:'Comparteix aquest intercanvi',hint:'Revisa el teu missatge i la resposta. Només es desarà aquest fragment. Qualsevol persona amb l’enllaç podrà llegir-lo durant 30 dies i continuar en un xat independent.',user:'El teu missatge',answer:'Resposta d’Oraclia (pots retallar-la)',create:'Crear enllaç per continuar',copy:'Copiar missatge i enllaç',revoke:'Retirar l’enllaç',creating:'Creant l’enllaç…',ready:'Enllaç creat. Revisa la previsualització i tria com compartir-la.',failed:'No s’ha pogut completar l’acció. Torna-ho a provar.',withdrawn:'Enllaç retirat.',copied:'Missatge i enllaç copiats.',follow:'Continua aquesta conversa amb Oraclia',author:'Missatge compartit',edited:'Fragment compartit · text revisable per qui el comparteix',preview:'Previsualització per WhatsApp',incomplete:'Cal un missatge i una resposta complets.',changed:'El text ha canviat. Crea un enllaç nou per compartir aquests canvis.',manage:'Enllaços que has creat en aquest navegador'},
    es:{share:'Compartir conversación',title:'Comparte este intercambio',hint:'Revisa tu mensaje y la respuesta. Solo se guardará este fragmento. Cualquier persona con el enlace podrá leerlo durante 30 días y continuar en un chat independiente.',user:'Tu mensaje',answer:'Respuesta de Oraclia (puedes recortarla)',create:'Crear enlace para continuar',copy:'Copiar mensaje y enlace',revoke:'Retirar el enlace',creating:'Creando el enlace…',ready:'Enlace creado. Revisa la vista previa y elige cómo compartirla.',failed:'No se ha podido completar la acción. Inténtalo de nuevo.',withdrawn:'Enlace retirado.',copied:'Mensaje y enlace copiados.',follow:'Continúa esta conversación con Oraclia',author:'Mensaje compartido',edited:'Fragmento compartido · texto revisable por quien lo comparte',preview:'Vista previa para WhatsApp',incomplete:'Hace falta un mensaje y una respuesta completos.',changed:'El texto ha cambiado. Crea un enlace nuevo para compartir estos cambios.',manage:'Enlaces que has creado en este navegador'},
    en:{share:'Share conversation',title:'Share this exchange',hint:'Review your message and the reply. Only this excerpt will be saved. Anyone with the link can read it for 30 days and continue in a separate chat.',user:'Your message',answer:'Oraclia’s reply (you can shorten it)',create:'Create continuation link',copy:'Copy message and link',revoke:'Withdraw link',creating:'Creating link…',ready:'Link created. Review the preview and choose how to share it.',failed:'The action could not be completed. Please try again.',withdrawn:'Link withdrawn.',copied:'Message and link copied.',follow:'Continue this conversation with Oraclia',author:'Shared message',edited:'Shared excerpt · text may be edited by the person sharing it',preview:'WhatsApp preview',incomplete:'A complete message and reply are required.',changed:'The text has changed. Create a new link to share these changes.',manage:'Links you created in this browser'}
  })[lang] || null;
  if (!wording) return;
  const api='https://oraclia-api.onrender.com/shares';
  const recordKey='oraclia.shared-links.v1';
  let current=null, busy=false;
  const dialog=document.createElement('dialog');dialog.className='or-share-dialog';dialog.setAttribute('aria-labelledby','or-share-title');
  const heading=document.createElement('h2');heading.id='or-share-title';heading.textContent=wording.title;
  const hint=document.createElement('p');hint.textContent=wording.hint;
  function field(id,label,max) {
    const caption=document.createElement('label');caption.htmlFor=id;caption.textContent=label;
    const input=document.createElement('textarea');input.id=id;input.rows=5;input.maxLength=max;
    dialog.append(caption,input);return input;
  }
  dialog.append(heading,hint);
  const user=field('or-share-user',wording.user,6000), answer=field('or-share-answer',wording.answer,12000);
  const notice=document.createElement('p');notice.setAttribute('role','status');
  const previewLabel=document.createElement('label');previewLabel.htmlFor='or-share-preview';previewLabel.textContent=wording.preview;
  const preview=document.createElement('textarea');preview.id='or-share-preview';preview.rows=8;preview.readOnly=true;
  const actions=document.createElement('div');actions.className='or-share-actions';
  function button(label,fn){const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',fn);actions.append(b);return b;}
  const cancel=button(labels.cancel,()=>dialog.close());
  const create=button(wording.create,createLink);
  const copy=button(wording.copy,async()=>{try{await navigator.clipboard.writeText(preview.value);notice.textContent=wording.copied;}catch(_){preview.focus();preview.select();notice.textContent=wording.failed;}});
  const open=document.createElement('a');open.textContent=labels.open;open.target='_blank';open.rel='noopener noreferrer';actions.append(open);
  const revoke=button(wording.revoke,async()=>{if(current)await withdraw(current);});
  const records=document.createElement('details'), recordsTitle=document.createElement('summary'), recordList=document.createElement('div');
  recordsTitle.textContent=wording.manage;records.append(recordsTitle,recordList);
  dialog.append(notice,previewLabel,preview,actions,records);document.body.appendChild(dialog);
  const menu=document.createElement('button');menu.type='button';menu.textContent=wording.manage;document.getElementById('or-export').before(menu);
  menu.addEventListener('click',()=>{user.value='';answer.value='';current=null;notice.textContent='';refresh();renderRecords();records.open=true;dialog.showModal();});
  function readRecords(){try{return JSON.parse(localStorage.getItem(recordKey)||'[]').filter(r=>r.expires_at>Date.now()/1000);}catch(_){return [];}}
  function writeRecords(rows){try{localStorage.setItem(recordKey,JSON.stringify(rows));return true;}catch(_){return false;}}
  function renderRecords(){
    recordList.replaceChildren();
    for(const r of readRecords()){
      const row=document.createElement('p');row.append(document.createTextNode(new Date(r.created_at).toLocaleString()+' '));
      const remove=document.createElement('button');remove.type='button';remove.textContent=wording.revoke;remove.addEventListener('click',()=>withdraw(r));row.append(remove);recordList.append(row);
    }
    records.hidden=!recordList.children.length;
  }
  function refresh(){
    const valid=user.value.trim() && answer.value.trim();
    create.disabled=busy||!valid;cancel.disabled=busy;user.disabled=answer.disabled=busy;
    copy.hidden=open.hidden=revoke.hidden=preview.hidden=previewLabel.hidden=!current;
    if(!current){preview.value='';open.removeAttribute('href');return;}
    const path=({ca:'oraclia-ca.html',es:'oraclia.html',en:'oraclia-en.html'})[lang];
    const url=new URL(path,location.href);url.search='';url.hash='shared='+current.id;
    preview.value='Oraclia\n'+wording.edited+'\n\n'+wording.author+'\n'+current.user+'\n\nOraclia\n'+current.assistant+'\n\n'+wording.follow+'\n'+url.href;
    open.href='https://wa.me/?text='+encodeURIComponent(preview.value);
  }
  async function createLink(){
    if(busy||!user.value.trim()||!answer.value.trim())return;
    busy=true;current=null;notice.textContent=wording.creating;refresh();
    try{
      const payload={user:user.value.trim(),assistant:answer.value.trim(),language:lang};
      const response=await fetch(api,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      if(!response.ok)throw Error('create');
      const result=await response.json();
      current={...result,...payload,created_at:new Date().toISOString()};
      // Store only withdrawal capabilities, never another copy of the excerpt.
      writeRecords([...readRecords(),{id:result.id,delete_token:result.delete_token,expires_at:result.expires_at,created_at:current.created_at}]);
      notice.textContent=wording.ready;renderRecords();
    }catch(_){notice.textContent=wording.failed;}
    finally{busy=false;refresh();}
  }
  async function withdraw(r){
    if(busy)return;busy=true;refresh();
    try{
      const response=await fetch(api+'/'+r.id,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({delete_token:r.delete_token})});
      if(!response.ok&&response.status!==404)throw Error('delete');
      writeRecords(readRecords().filter(x=>x.id!==r.id));if(current?.id===r.id)current=null;
      notice.textContent=wording.withdrawn;renderRecords();
    }catch(_){notice.textContent=wording.failed;}finally{busy=false;refresh();}
  }
  for(const field of [user,answer])field.addEventListener('input',()=>{if(current)notice.textContent=wording.changed;current=null;refresh();});
  dialog.addEventListener('cancel',event=>{if(busy)event.preventDefault();});
  document.addEventListener('oraclia-share',event=>{
    if(busy)return;
    const pair=event.detail.pair;
    if(!pair){status.textContent=wording.incomplete;return;}
    user.value=pair.user;answer.value=pair.assistant;current=null;notice.textContent='';records.open=false;
    refresh();renderRecords();dialog.showModal();user.focus();
  });
  function labelButtons(){document.querySelectorAll('.or-share-message').forEach(b=>{if(b.textContent!==wording.share)b.textContent=wording.share;});}
  labelButtons();new MutationObserver(labelButtons).observe(document.getElementById('or-messages'),{childList:true,subtree:true});
})();
