'use client';
// Поведение текста таба (P5-02): copy link у заголовков, таблицы-карточки на мобильных, текущий пункт «На этой странице».
// HTML таба приходит готовым из компилятора, поэтому кнопки и подписи ячеек добавляются после монтирования.
import {useEffect,useRef,useState} from 'react';
import {RoleIcon} from './primitives';

export function ChapterEnhancer(){
  const icon=useRef<HTMLSpanElement>(null);
  const [status,setStatus]=useState('');
  useEffect(()=>{
    const main=icon.current?.closest('main');const prose=main?.querySelector('.ct-prose');
    if(!main||!prose)return;
    const cleanup:(()=>void)[]=[];
    // Тот же текст подряд live region не объявит: сначала очистить, затем показать.
    let timer=0;const announce=(text:string)=>{setStatus('');clearTimeout(timer);timer=window.setTimeout(()=>setStatus(text),50);};
    cleanup.push(()=>clearTimeout(timer));
    // 1. Copy link: кнопка вместо старого «#»; адрес — текущая страница с якорем заголовка.
    for(const h of prose.querySelectorAll<HTMLElement>('h2[id],h3[id]')){
      h.querySelector('.permalink')?.remove();
      const button=document.createElement('button');
      button.type='button';button.className='ct-copy';
      button.setAttribute('aria-label',`Скопировать ссылку на раздел «${h.textContent?.trim()}»`);
      button.innerHTML=icon.current!.innerHTML;
      const copy=async()=>{
        const url=`${location.origin}${location.pathname}#${encodeURIComponent(h.id)}`;
        // Имя раздела в сообщении: повторное копирование другого раздела снова объявляется.
        const name=h.textContent?.trim();
        try{await navigator.clipboard.writeText(url);announce(`Ссылка на раздел «${name}» скопирована.`);}
        catch{announce(`Не удалось скопировать. Адрес раздела: ${decodeURI(url)}`);}
      };
      button.addEventListener('click',copy);h.appendChild(button);
      cleanup.push(()=>{button.removeEventListener('click',copy);button.remove();});
    }
    // 2. Таблицы: подпись столбца у каждой ячейки, чтобы ниже 600 px строка читалась карточкой.
    for(const table of prose.querySelectorAll('table')){
      const head=[...table.querySelectorAll('thead th')].map(th=>th.textContent?.trim()??'');
      if(!head.length)continue;
      table.classList.add('ct-cards');
      for(const row of table.querySelectorAll('tbody tr'))[...row.children].forEach((cell,i)=>head[i]&&cell.setAttribute('data-label',head[i]));
    }
    // 3. «На этой странице»: текущий пункт — последний заголовок выше середины экрана; у конца страницы — последний.
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
