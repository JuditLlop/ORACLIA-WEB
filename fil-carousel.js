'use strict';

 (()=>{
  const root=document.getElementById('oraclia-slider-fils'),q=s=>root.querySelector(s),slides=[...root.querySelectorAll('[data-slide]')],surface=q('.fil-carousel');
  const boundary=q('[data-boundary]'),arrow=q('[data-arrow]'),wave=q('[data-wave]'),infinity=q('[data-infinity]'),pause=q('[data-pause]'),count=q('[data-count]'),status=q('[data-status]');
  const lang=(document.documentElement.lang||'ca').split('-')[0];
  const copy={ca:{names:['El límit','La propulsió','El ritme','L’infinit'],drawing:'Dibuix',of:'de',play:'Animar',pause:'Pausa'},es:{names:['El límite','La propulsión','El ritmo','El infinito'],drawing:'Dibujo',of:'de',play:'Animar',pause:'Pausa'},en:{names:['The boundary','Propulsion','Rhythm','Infinity'],drawing:'Drawing',of:'of',play:'Play',pause:'Pause'}}[lang]||{names:['El límit','La propulsió','El ritme','L’infinit'],drawing:'Dibuix',of:'de',play:'Animar',pause:'Pausa'};
  const names=copy.names,duration=[10000,6500,6500,8000],TAU=Math.PI*2,N=120;
  const preference=matchMedia('(prefers-reduced-motion: reduce)');let reduced=preference.matches,index=0,paused=reduced,frame=null,elapsed=0,last=performance.now(),pointer=null,visible=true;
  function path(points,closed=false){return points.map((p,i)=>(i?'L':'M')+p.x.toFixed(3)+' '+p.y.toFixed(3)).join(' ')+(closed?'Z':'');}
  function length(points){let total=0;for(let i=1;i<points.length;i++)total+=Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y);return total;}
  function scaleLength(points,target){const k=target/length(points);return points.map(p=>({x:180+(p.x-180)*k,y:105+(p.y-105)*k}));}
  function rectangle(u){const d=u*540;if(d<=180)return{x:90+d,y:60};if(d<=270)return{x:270,y:60+d-180};if(d<=450)return{x:270-(d-270),y:150};return{x:90,y:150-(d-450)};}
  const rectanglePoints=Array.from({length:N+1},(_,i)=>rectangle(i/N)),perimeter=length(rectanglePoints);
  function draw(time){
   const p=(time%duration[index])/duration[index];
   if(index===0){
    const bend=(1-Math.cos(TAU*p))/2;
    const points=rectanglePoints.map((a,i)=>{const angle=-3*Math.PI/4+i/N*TAU,b={x:180+86*Math.cos(angle),y:105+86*Math.sin(angle)};return{x:a.x+(b.x-a.x)*bend,y:a.y+(b.y-a.y)*bend};});
    boundary.setAttribute('d',path(scaleLength(points,perimeter),true));
   }else if(index===1){
    // Each cycle is a new forward gesture, with a short rest before and after.
    const t=Math.max(0,Math.min(1,(p-.12)/.68)),advance=t*t*(3-2*t);
    arrow.setAttribute('transform','translate('+(28*advance).toFixed(3)+' 0)');
   }else if(index===2){
    const points=Array.from({length:N+1},(_,i)=>({x:60+240*i/N,y:105+22*Math.sin(i/N*TAU*1.5-TAU*p)}));
    wave.setAttribute('d',path(scaleLength(points,275)));
   }else infinity.setAttribute('stroke-dashoffset',String(-p));
  }
  function schedule(){if(frame===null&&!paused&&!document.hidden&&visible){last=performance.now();frame=requestAnimationFrame(tick);}}
  function tick(now){frame=null;if(!root.isConnected||paused||document.hidden||!visible)return;elapsed+=now-last;last=now;draw(elapsed);frame=requestAnimationFrame(tick);}
  function stop(){if(frame!==null)cancelAnimationFrame(frame);frame=null;}
  function show(next){index=(next+4)%4;elapsed=0;last=performance.now();slides.forEach((slide,i)=>{slide.hidden=i!==index;});count.textContent=(index+1)+' / 4';status.textContent=names[index]+'. '+copy.drawing+' '+(index+1)+' '+copy.of+' 4.';draw(0);schedule();}
  function pauseLabel(){pause.textContent=paused?copy.play:copy.pause;pause.setAttribute('aria-pressed',String(paused));}
  q('[data-previous]').addEventListener('click',()=>show(index-1));q('[data-next]').addEventListener('click',()=>show(index+1));
  pause.addEventListener('click',()=>{paused=!paused;pauseLabel();if(paused)stop();else schedule();});
  surface.addEventListener('keydown',event=>{if(event.key==='ArrowRight'){event.preventDefault();show(index+1);}else if(event.key==='ArrowLeft'){event.preventDefault();show(index-1);}});
  slides.forEach(slide=>{
   slide.addEventListener('pointerdown',event=>{pointer={x:event.clientX,y:event.clientY};});
   slide.addEventListener('pointerup',event=>{if(!pointer)return;const dx=event.clientX-pointer.x,dy=event.clientY-pointer.y;pointer=null;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.4)show(index+(dx<0?1:-1));});
   slide.addEventListener('pointercancel',()=>{pointer=null;});
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else schedule();});
  preference.addEventListener?.('change',event=>{reduced=event.matches;if(reduced){paused=true;stop();pauseLabel();}});
  if(typeof IntersectionObserver==='function'){
   const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)schedule();else stop();},{threshold:0.01});observer.observe(root);
  }
  pauseLabel();show(0);
 })();
 