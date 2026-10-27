'use client';
// Полоса 4 табов главы (P5-02): под hero; при прокрутке прилипает под шапкой и сжимается в «пилюлю» с коротким именем главы.
import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import {RoleIcon} from './primitives';
import type {TabId} from './ChapterTemplate';

const tabIcon={overview:'tabOverview','how-it-works':'tabMechanics',apply:'tabApply',check:'tabCheck'} as const;

export function ChapterTabBar({title,current,tabs}:{title:string;current:TabId;tabs:{id:TabId;label:string;href:string;minutes:number}[]}){
  const bar=useRef<HTMLElement>(null);
  const [stuck,setStuck]=useState(false);
  useEffect(()=>{
    const node=bar.current;if(!node)return;
    // Текущий таб виден и на узком экране, где полоса прокручивается.
    const list=node.querySelector('ul'),active=node.querySelector<HTMLElement>('[aria-current="page"]');
    if(list&&active&&list.scrollWidth>list.clientWidth)list.scrollLeft=active.offsetLeft-list.offsetLeft-list.clientWidth/2+active.offsetWidth/2;
    if(typeof IntersectionObserver==='undefined')return;
    // Полоса прилипла, когда её верх упёрся в нижний край шапки: тогда она на пиксель заходит под границу root.
    const top=parseFloat(getComputedStyle(node).top)||0;
    const observer=new IntersectionObserver(([entry])=>setStuck(entry.intersectionRatio<1&&entry.boundingClientRect.top<=top+1),{rootMargin:`-${top+1}px 0px 0px 0px`,threshold:[1]});
    observer.observe(node);return()=>observer.disconnect();
  },[]);
  return <>
    <nav ref={bar} className="ct-tabs" aria-label="Табы главы" data-stuck={stuck||undefined}>
      <span className="ct-tabs-pill" aria-hidden="true">{title}</span>
      <ul>
        {tabs.map(tab=><li key={tab.id}><Link href={tab.href} aria-current={tab.id===current?'page':undefined}>
          <RoleIcon role={tabIcon[tab.id]} filled={tab.id===current}/><span>{tab.label}</span>
          {tab.minutes>0&&<span className="ct-tab-minutes">{tab.minutes} мин</span>}
        </Link></li>)}
      </ul>
    </nav>
  </>;
}
