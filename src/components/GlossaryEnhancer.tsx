"use client";
// Copy link on every glossary term (P6-07b), next to its level label. The cards come as HTML from
// the compiler, so the buttons are added after mounting; without JavaScript the term keeps its #term-* address.
import {useEffect,useRef,useState} from 'react';
import {RoleIcon} from '../design/primitives';

export function GlossaryEnhancer(){
 const icon=useRef<HTMLSpanElement>(null);
 const [status,setStatus]=useState('');
 useEffect(()=>{
  const cleanup:(()=>void)[]=[];
  // The same text twice in a row is not announced again: clear first, then show.
  let timer=0;const announce=(text:string)=>{setStatus('');clearTimeout(timer);timer=window.setTimeout(()=>setStatus(text),50);};
  cleanup.push(()=>clearTimeout(timer));
  for(const card of document.querySelectorAll<HTMLElement>('.term-definition[id]')){
   const name=card.querySelector(':is(h3,h4) strong')?.textContent?.trim()??card.id;
   const existing=card.querySelector<HTMLElement>('.term-meta'),added=!existing;
   const meta=existing??Object.assign(document.createElement('p'),{className:'term-meta'});
   if(added)card.querySelector(':is(h3,h4)')?.insertAdjacentElement('afterend',meta);
   const button=document.createElement('button');
   button.type='button';button.className='term-copy';
   button.setAttribute('aria-label',`Скопировать ссылку на термин «${name}»`);
   button.innerHTML=icon.current!.innerHTML;
   // Without clipboard access the address is shown under the card, selectable, for copying by hand.
   const fallback=Object.assign(document.createElement('p'),{className:'term-copy-fallback',hidden:true});
   card.appendChild(fallback);
   const copy=async()=>{
    const url=`${location.origin}${location.pathname}#${card.id}`;
    try{await navigator.clipboard.writeText(url);fallback.hidden=true;announce(`Ссылка на термин «${name}» скопирована.`);}
    catch{
     fallback.replaceChildren('Не удалось скопировать ссылку. Адрес термина: ',Object.assign(document.createElement('code'),{textContent:url}));
     fallback.hidden=false;announce(`Не удалось скопировать ссылку. Адрес термина: ${url}`);
    }
   };
   button.addEventListener('click',copy);meta.appendChild(button);
   cleanup.push(()=>{button.removeEventListener('click',copy);button.remove();fallback.remove();if(added)meta.remove();});
  }
  return()=>cleanup.forEach(fn=>fn());
 },[]);
 return <>
  <span ref={icon} hidden><RoleIcon role="anchorLink"/></span>
  <p className="term-copy-status sr-only" role="status">{status}</p>
 </>;
}
