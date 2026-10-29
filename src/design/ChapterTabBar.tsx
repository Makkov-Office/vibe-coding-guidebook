'use client';
// Полоса 4 табов главы (P5-02, P5-05): на всю ширину под баннером, активный таб — тональная пилюля.
// При прокрутке полоса прилипает и сжимается в плавающую пилюлю по центру с тенью и коротким именем главы
// (RD-01, экран «Страница темы»; m3.material.io). Полоса идёт сразу за баннером: по нему видно, что она прилипла.
// Табы — ссылки на отдельные адреса, текущий — aria-current="page".
import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import {RoleIcon} from './primitives';
import type {TabId} from './ChapterTemplate';

const tabIcon={overview:'tabOverview','how-it-works':'tabMechanics',apply:'tabApply',check:'tabCheck'} as const;

/** Нижний край прилипшей шапки страницы (.topbar), если она есть: под ним прилипает полоса. */
function headerBottom(){
  const header=document.querySelector<HTMLElement>('.topbar');if(!header)return 0;
  const position=getComputedStyle(header).position;
  return position==='sticky'||position==='fixed'?Math.round(header.getBoundingClientRect().height):0;
}

export function ChapterTabBar({title,current,tabs}:{title:string;current:TabId;tabs:{id:TabId;label:string;href:string}[]}){
  const bar=useRef<HTMLElement>(null);
  const [stuck,setStuck]=useState(false);
  useEffect(()=>{
    const node=bar.current;if(!node)return;
    // Текущий таб виден и на узком экране, где полоса прокручивается.
    const list=node.querySelector('ul'),active=node.querySelector<HTMLElement>('[aria-current="page"]');
    if(list&&active&&list.scrollWidth>list.clientWidth)list.scrollLeft=active.offsetLeft-list.offsetLeft-list.clientWidth/2+active.offsetWidth/2;
  },[current]);
  useEffect(()=>{
    const node=bar.current,mark=node?.previousElementSibling;if(!node||!mark||typeof IntersectionObserver==='undefined')return;
    // Полоса прилипла, когда низ баннера над ней (с промежутком 8 px) ушёл под шапку: тогда она сжимается.
    // Высота шапки меняется с шириной окна, поэтому отступ прилипания пересчитывается, а observer пересоздаётся.
    const gap=parseFloat(getComputedStyle(node).getPropertyValue('--ct-tabs-gap'))||8;
    let observer:IntersectionObserver|undefined,top=-1;
    const watch=()=>{
      const next=headerBottom();if(next===top&&observer)return;top=next;
      node.closest<HTMLElement>('.ct')?.style.setProperty('--ct-sticky-top',`${top}px`);
      observer?.disconnect();
      observer=new IntersectionObserver(([entry])=>setStuck(!entry.isIntersecting&&entry.boundingClientRect.top<(entry.rootBounds?.top??top)),{rootMargin:`-${top+gap}px 0px 0px 0px`,threshold:0});
      observer.observe(mark);
    };
    watch();addEventListener('resize',watch);
    return()=>{removeEventListener('resize',watch);observer?.disconnect();};
  },[]);
  return <>
    <nav ref={bar} className="ct-tabs shell-wide" aria-label="Табы главы" data-stuck={stuck||undefined}>
      <div className="ct-tabs-row">
        <span className="ct-tabs-pill" aria-hidden="true">{title}</span>
        <ul>
          {tabs.map(tab=><li key={tab.id}><Link href={tab.href} aria-current={tab.id===current?'page':undefined}>
            <RoleIcon role={tabIcon[tab.id]} filled={tab.id===current}/><span>{tab.label}</span>
          </Link></li>)}
        </ul>
      </div>
    </nav>
  </>;
}
