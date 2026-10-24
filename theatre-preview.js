'use strict';
// Keep existing anchors usable while the public space becomes Symbols in debate.
(()=>{
 const panel=document.getElementById('or-theatre-panel');if(!panel)return;
 const open=document.getElementById('or-theatre-open'),close=document.getElementById('or-theatre-close');
 open.addEventListener('click',()=>{panel.hidden=false;open.setAttribute('aria-expanded','true');panel.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});panel.querySelector('textarea')?.focus({preventScroll:true});});
 close.addEventListener('click',()=>{panel.hidden=true;open.setAttribute('aria-expanded','false');open.focus();});
})();
