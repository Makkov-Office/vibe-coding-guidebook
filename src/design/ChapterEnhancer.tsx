'use client';
// Tab text behaviour (P5-02): copy link on headings, tables as cards on mobile, the current "On this page" item.
// The tab HTML comes ready from the compiler, so buttons and cell labels are added after mount.
import {useEffect,useRef,useState} from 'react';
import {RoleIcon} from './primitives';

export function ChapterEnhancer(){
  const icon=useRef<HTMLSpanElement>(null);
  const [status,setStatus]=useState('');
  useEffect(()=>{
    const main=icon.current?.closest('.ct');const prose=main?.querySelector('.ct-prose');
    if(!main||!prose)return;
    const cleanup:(()=>void)[]=[];
    // A live region will not announce the same text twice in a row: clear first, then show.
    let timer=0;const announce=(text:string)=>{setStatus('');clearTimeout(timer);timer=window.setTimeout(()=>setStatus(text),50);};
    cleanup.push(()=>clearTimeout(timer));
    // 1. Copy link: a button instead of the old "#"; the address is the current page with the heading anchor.
    for(const h of prose.querySelectorAll<HTMLElement>('h2[id],h3[id]')){
      h.querySelector('.permalink')?.remove();
      const button=document.createElement('button');
      button.type='button';button.className='ct-copy';
      button.setAttribute('aria-label',`Скопировать ссылку на раздел «${h.textContent?.trim()}»`);
      button.innerHTML=icon.current!.innerHTML;
      const copy=async()=>{
        const url=`${location.origin}${location.pathname}#${encodeURIComponent(h.id)}`;
        // The section name is in the message: copying another section again is announced again.
        const name=h.textContent?.trim();
        try{await navigator.clipboard.writeText(url);announce(`Ссылка на раздел «${name}» скопирована.`);}
        catch{announce(`Не удалось скопировать. Адрес раздела: ${decodeURI(url)}`);}
      };
      button.addEventListener('click',copy);h.appendChild(button);
      cleanup.push(()=>{button.removeEventListener('click',copy);button.remove();});
    }
    // 2. Tables: a column label on every cell, so that below 600 px a row reads as a card.
    for(const table of prose.querySelectorAll('table')){
      const head=[...table.querySelectorAll('thead th')].map(th=>th.textContent?.trim()??'');
      if(!head.length)continue;
      table.classList.add('ct-cards');
      for(const row of table.querySelectorAll('tbody tr'))[...row.children].forEach((cell,i)=>head[i]&&cell.setAttribute('data-label',head[i]));
    }
    // 3. "On this page": the current item is the last heading above the middle of the screen; at the end of the page, the last one.
    const headings=[...prose.querySelectorAll<HTMLElement>('h2[id]')];
    if(headings.length){
      let frame=0;
      const mark=()=>{frame=0;
        const end=innerHeight+scrollY>=document.documentElement.scrollHeight-2;
        const id=(end?headings.at(-1):headings.filter(h=>h.getBoundingClientRect().top<innerHeight*.45).at(-1))?.id;
        for(const a of document.querySelectorAll<HTMLAnchorElement>('.ct-toc a, .local-outline a')){if(id&&decodeURIComponent(a.hash)===`#${id}`)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');}
      };
      const schedule=()=>{if(!frame)frame=requestAnimationFrame(mark);};
      mark();addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);
      cleanup.push(()=>{cancelAnimationFrame(frame);removeEventListener('scroll',schedule);removeEventListener('resize',schedule);});
    }
    return()=>cleanup.forEach(fn=>fn());
  },[]);
  return <>
    <span ref={icon} hidden><RoleIcon role="anchorLink"/></span>
    <p className="ct-live sr-only" role="status">{status}</p>
  </>;
}
