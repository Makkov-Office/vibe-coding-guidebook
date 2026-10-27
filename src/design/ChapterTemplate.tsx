// Шаблон страницы главы (P5-02, бриф 8.3): hero, полоса 4 табов, «На этой странице», соседние страницы, copy link.
// Данные — формат P5-01 (chapter.heading, chapter.tabs[]); адреса табов — tabHrefs(адрес главы из url-map).
import Link from 'next/link';
import type {ReactNode} from 'react';
import generated from '../content/generated.json';
import urlMap from '../content/url-map.json';
import type {Handbook} from '../content/types';
import {InteractivePanel} from '../components/InteractivePanel';
import {ReaderPageData,type PageData} from '../components/ReaderPageData';
import {Annotation,ButtonLink,RoleIcon} from './primitives';
import {ChapterTabBar} from './ChapterTabBar';
import {ChapterEnhancer} from './ChapterEnhancer';
import './chapter-template.css';

export type TabId='overview'|'how-it-works'|'apply'|'check';
export type PageLink={href:string;label:string};
type Tab={id:TabId;html:string;outline:{id:string;title:string}[];panels:string[]};
type TabbedChapter=Handbook['chapters'][number]&{heading:string;tabs:Tab[]};
export type ChapterTemplateProps={
  chapterId:string;tabId:TabId;hrefs:Record<TabId,string>;
  /** Соседние главы: на первом табе «Предыдущая», на последнем «Дальше». */
  prev?:PageLink;next?:PageLink;
  meta?:{minutes?:number;level?:string;template?:string};
  /** Поправки к PageData страницы; по умолчанию шаблон собирает его сам: outline — подзаголовки таба. */
  pageData?:Partial<PageData>;
  /** Место под мини-таймлайн DEMO-42 и мини-карту системы (бриф 9.3–9.4). */
  aside?:ReactNode;
};

const handbook=generated as unknown as Handbook;
const tabs=urlMap.tabs as {id:TabId;segment:string;label:string}[];
const WORDS_PER_MINUTE=180;
/** Минуты чтения по тексту HTML: не меньше одной у непустого таба. */
export function readingMinutes(html:string){const words=html.replace(/<[^>]+>/g,' ').split(/\s+/).filter(Boolean).length;return words?Math.max(1,Math.round(words/WORDS_PER_MINUTE)):0;}
/** Адреса 4 табов от адреса страницы: «Обзор» — сам адрес, остальные — сегмент из url-map. */
export function tabHrefs(base:string){return Object.fromEntries(tabs.map(t=>[t.id,t.segment?`${base}/${t.segment}`:base])) as Record<TabId,string>;}
/** «08. Preflight: начать правильно» → «Preflight». */
export function shortTitle(title:string){return title.replace(/^\d+\.\s*/,'').split(':')[0].trim();}
// Заголовок главы — h1, заголовки таба на уровень выше (как в HandbookPage); старый «#» заменяет copy link.
const lift=(html:string)=>html.replace(/<(\/?)h3\b/g,'<$1h2').replace(/<(\/?)h4\b/g,'<$1h3');
const heading=(html:string)=>html.replace(/<a [^>]*class="permalink"[^>]*>#<\/a>/,'').replace(/^<h2/,'<h1').replace(/<\/h2>$/,'</h1>');

export function ChapterTemplate({chapterId,tabId,hrefs,prev,next,meta,pageData,aside}:ChapterTemplateProps){
  const chapter=handbook.chapters.find(c=>c.id===chapterId) as TabbedChapter|undefined;
  if(!chapter?.tabs)throw new Error(`ChapterTemplate: ${chapterId} has no tabs`);
  const tab=chapter.tabs.find(t=>t.id===tabId);
  if(!tab)throw new Error(`ChapterTemplate: ${chapterId} has no tab ${tabId}`);
  const index=tabs.findIndex(t=>t.id===tabId);
  const label=(id:TabId)=>tabs.find(t=>t.id===id)!.label;
  const minutes=Object.fromEntries(chapter.tabs.map(t=>[t.id,readingMinutes(t.html)])) as Record<TabId,number>;
  const total=meta?.minutes??Object.values(minutes).reduce((a,b)=>a+b,0);
  const before=index>0?{href:hrefs[tabs[index-1].id],label:label(tabs[index-1].id),kind:'Предыдущий таб'}:prev&&{...prev,kind:'Предыдущая глава'};
  const after=index<tabs.length-1?{href:hrefs[tabs[index+1].id],label:label(tabs[index+1].id),kind:'Дальше'}:next&&{...next,kind:'Следующая глава'};
  const filled=chapter.tabs.find((t,i)=>i>index&&t.html)??chapter.tabs.find(t=>t.html&&t.id!==tabId);
  const panels=tab.panels.map(id=>handbook.panels.find(p=>p.chapter===chapterId&&p.id===id)).filter(p=>p!==undefined);
  // Термины и блоки кода — как в HandbookPage, но только для текста этого таба.
  const blocks=handbook.blocks.filter(b=>b.id.startsWith(chapterId)&&tab.html.includes(b.id));
  const required=new Set([...JSON.stringify([tab.html,panels]).matchAll(/term-[a-z0-9-]+/g)].map(m=>m[0]));for(const block of blocks)for(const term of block.terms)required.add(term);
  const data:PageData={chapterId,outline:tab.outline,hasChecklists:tab.html.includes('data-practice='),terms:handbook.terms.filter(t=>required.has(t.id)),levels:handbook.levels,blocks,...pageData};

  return <>
    <ReaderPageData value={data}/>
    <main id="reader" tabIndex={-1} className="ct" data-chapter={chapterId} data-tab={tabId}>
      <header className="ct-hero">
        <Annotation>Глава {chapter.number}</Annotation>
        <div className="ct-title" dangerouslySetInnerHTML={{__html:heading(chapter.heading)}}/>
        <ul className="ct-chips" aria-label="О главе">
          {total>0&&<li><RoleIcon role="readingTime"/>{total} мин</li>}
          {meta?.level&&<li><RoleIcon role="level"/>{meta.level}</li>}
          {meta?.template&&<li><RoleIcon role="template"/>{meta.template}</li>}
        </ul>
      </header>
      <ChapterTabBar title={shortTitle(chapter.title)} current={tabId} tabs={tabs.map(t=>({id:t.id,label:t.label,href:hrefs[t.id],minutes:minutes[t.id]}))}/>
      <div className="ct-body">
        {tab.outline.length>1&&<details className="ct-toc"><summary>На этой странице<span>{minutes[tabId]} мин</span></summary><nav aria-label="На этой странице"><ol>{tab.outline.map(item=><li key={item.id}><a href={`#${item.id}`}>{item.title}</a></li>)}</ol></nav></details>}
        {tab.html&&<div className="reader-prose ct-prose" dangerouslySetInnerHTML={{__html:lift(tab.html)}}/>}
        {!tab.html&&!panels.length&&<div className="ct-empty bp-card bp-card--low" role="status"><h2>Таб «{label(tabId)}» готовится</h2><p>Его текст появится в следующих волнах редизайна. Остальной текст главы уже на месте.</p>{filled&&<ButtonLink variant="tonal" href={hrefs[filled.id]} icon="next">{label(filled.id)}</ButtonLink>}</div>}
        {panels.map(panel=><div id={`${panel.id}-panel`} key={panel.id}><InteractivePanel panel={panel}/></div>)}
        {aside&&<aside className="ct-slot" aria-label="Схема главы">{aside}</aside>}
      </div>
      {(before||after)&&<nav className="ct-pager" aria-label="Соседние страницы">
        {before&&<Link className="ct-pager-link ct-pager-prev" href={before.href}><span><RoleIcon role="previous"/>{before.kind}</span><strong>{before.label}</strong></Link>}
        {after&&<Link className="ct-pager-link ct-pager-next" href={after.href}><span>{after.kind}<RoleIcon role="next"/></span><strong>{after.label}</strong></Link>}
      </nav>}
      <ChapterEnhancer key={`${chapterId}/${tabId}`}/>
    </main>
  </>;
}
