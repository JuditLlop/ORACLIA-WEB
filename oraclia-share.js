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
  const dialog=document.createElement('dialog');dialog.className='or-share-dialog';dialog.setAttribute('aria-labelledby','or-share-title');
  const heading=document.createElement('h2');heading.id='or-share-title';heading.textContent=labels.title;
  const hint=document.createElement('p');hint.id='or-share-hint';hint.textContent=labels.hint;
  const fieldLabel=document.createElement('label');fieldLabel.htmlFor='or-share-text';fieldLabel.textContent=labels.text;
  const input=document.createElement('textarea');input.id='or-share-text';input.rows=9;input.setAttribute('aria-describedby','or-share-hint');
  const actions=document.createElement('div');actions.className='or-share-actions';
  const cancel=document.createElement('button');cancel.type='button';cancel.textContent=labels.cancel;
  const open=document.createElement('a');open.textContent=labels.open;open.target='_blank';open.rel='noopener noreferrer';
  const update=()=>{
    const text=input.value.trim();
    if(text)open.href='https://wa.me/?text='+encodeURIComponent(text);else open.removeAttribute('href');
    open.setAttribute('aria-disabled',String(!text));
  };
  input.addEventListener('input',update);cancel.addEventListener('click',()=>dialog.close());
  open.addEventListener('click',event=>{if(!input.value.trim())event.preventDefault();});
  actions.append(cancel,open);dialog.append(heading,hint,fieldLabel,input,actions);document.body.appendChild(dialog);
  document.addEventListener('oraclia-share',event=>{input.value=event.detail.text;update();dialog.showModal();input.focus();});
  document.querySelectorAll('.or-share-message').forEach(b=>b.textContent=labels.share);
  new MutationObserver(()=>document.querySelectorAll('.or-share-message').forEach(b=>{if(b.textContent!==labels.share)b.textContent=labels.share;})).observe(document.getElementById('or-messages'),{childList:true,subtree:true});
})();
