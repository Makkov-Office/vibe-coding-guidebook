'use client';
// Табы страницы (P5-02, P5-05; единый шаблон — PageTemplate.tsx): на всю ширину под баннером, текущий таб — тональная пилюля.
// При прокрутке полоса прилипает и сжимается до ширины внутреннего контейнера (--content-container, P3-08) —
// плавающая пилюля с коротким именем страницы (RD-01, экран «Страница темы»; m3.material.io/components/buttons).
// Полоса идёт сразу за баннером: по нему видно, что она прилипла. Стили — page-tabs.css.
// Два режима: route — табы-страницы (ссылки на отдельные адреса, текущий — aria-current="page");
// anchor — разделы этой страницы (ссылки на якоря, текущий по прокрутке — aria-current="location").
import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import {RoleIcon} from './primitives';
import type {iconRoles} from './icons.mjs';

export type PageTab={id:string;label:string;href:string;icon?:keyof typeof iconRoles};
export type PageTabsProps={
  /** Подпись навигации для вспомогательных технологий. */
  label:string;
  /** Короткое имя страницы в прилипшей пилюле. */
  title:string;
  tabs:PageTab[];
  /** Текущий таб в режиме route. */
  current?:string;
  mode?:'route'|'anchor';
};

/** Нижний край прилипшей шапки страницы (.topbar), если она есть: под ним прилипает полоса. */
function headerBottom(){
  const header=document.querySelector<HTMLElement>('.topbar');if(!header)return 0;
  const position=getComputedStyle(header).position;
  return position==='sticky'||position==='fixed'?Math.round(header.getBoundingClientRect().height):0;
}

/** Текущий раздел по прокрутке: последний, чей заголовок выше 45 % экрана; у конца страницы — последний. */
function useScrollSpy(ids:string[],enabled:boolean){
  const [current,setCurrent]=useState(ids[0]);
  const key=ids.join('|');
  useEffect(()=>{
    if(!enabled)return;
    const headings=key.split('|').map(id=>document.getElementById(id)).filter((h):h is HTMLElement=>!!h);
    if(!headings.length)return;
    let frame=0;
    const mark=()=>{frame=0;
      const end=innerHeight+scrollY>=document.documentElement.scrollHeight-2;
      setCurrent((end?headings.at(-1):headings.filter(h=>h.getBoundingClientRect().top<innerHeight*.45).at(-1)??headings[0])!.id);
    };
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(mark);};
    // Первая отметка — в кадре после отрисовки, не во время гидратации: чтение геометрии не форсирует лишний layout.
    schedule();addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);
    return()=>{cancelAnimationFrame(frame);removeEventListener('scroll',schedule);removeEventListener('resize',schedule);};
  },[key,enabled]);
  return current;
}

export function PageTabs({label,title,tabs,current,mode='route'}:PageTabsProps){
  const bar=useRef<HTMLElement>(null);
  const [stuck,setStuck]=useState(false);
  const anchors=mode==='anchor';
  const spied=useScrollSpy(anchors?tabs.map(tab=>tab.href.slice(1)):[],anchors);
  const active=anchors?tabs.find(tab=>tab.href===`#${spied}`)?.id:current;
  useEffect(()=>{
    const node=bar.current;if(!node)return;
    // Текущий таб виден и тогда, когда полоса прокручивается (узкий экран, много разделов).
    const list=node.querySelector('ul'),item=node.querySelector<HTMLElement>('[aria-current]');
    // По прямоугольникам, не offsetLeft: у пункта, который ещё появляется (каскад), transform делает его offsetParent.
    if(!list||!item||list.scrollWidth<=list.clientWidth)return;
    const box=list.getBoundingClientRect(),own=item.getBoundingClientRect();
    list.scrollLeft+=own.left-box.left-list.clientWidth/2+own.width/2;
  },[active]);
  useEffect(()=>{
    const node=bar.current,mark=node?.previousElementSibling;if(!node||!mark||typeof IntersectionObserver==='undefined')return;
    // Полоса прилипает, когда низ баннера над ней уходит на 8 px (промежуток) выше верха прилипания: тогда она сжимается.
    // Граница root смещена на промежуток вниз (rootMargin = gap − top), иначе пилюля сжималась бы на 16 px раньше.
    // Высота шапки меняется с шириной окна, поэтому отступ прилипания пересчитывается, а observer пересоздаётся.
    const gap=parseFloat(getComputedStyle(node).getPropertyValue('--page-tabs-gap'))||8;
    let observer:IntersectionObserver|undefined,top=-1;
    const watch=()=>{
      const next=headerBottom();if(next===top&&observer)return;top=next;
      node.closest<HTMLElement>('.page')?.style.setProperty('--page-tabs-top',`${top}px`);
      observer?.disconnect();
      observer=new IntersectionObserver(([entry])=>setStuck(!entry.isIntersecting&&entry.boundingClientRect.top<(entry.rootBounds?.top??top)),{rootMargin:`${gap-top}px 0px 0px 0px`,threshold:0});
      observer.observe(mark);
    };
    watch();addEventListener('resize',watch);
    return()=>{removeEventListener('resize',watch);observer?.disconnect();};
  },[]);
  return <nav ref={bar} className="page-tabs shell-wide" aria-label={label} data-mode={mode} data-stuck={stuck||undefined}>
    <div className="page-tabs__row">
      <span className="page-tabs__pill" aria-hidden="true">{title}</span>
      <ul>
        {tabs.map(tab=>{const on=tab.id===active;
          const body=<>{tab.icon&&<RoleIcon role={tab.icon} filled={on}/>}<span>{tab.label}</span></>;
          return <li key={tab.id}>{anchors
            ?<a href={tab.href} aria-current={on?'location':undefined}>{body}</a>
            :<Link href={tab.href} aria-current={on?'page':undefined}>{body}</Link>}</li>;})}
      </ul>
    </div>
  </nav>;
}
