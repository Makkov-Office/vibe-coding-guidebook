// Шаблон страницы главы (P5-02, бриф 8.3; P5-05 — баннер M3 из двух карточек; каркас — PageTemplate, P3-11): баннер, полоса 4 табов, «На этой странице», соседние страницы, copy link.
// Данные — формат P5-01 (chapter.heading, chapter.tabs[]); адреса табов — chapterTabHrefs (P5-02b) или tabHrefs для образцов.
import Link from 'next/link';
import type {ReactNode} from 'react';
import generated from '../content/generated.json';
import type {Handbook,TabId} from '../content/types';
import {chapterTabs as tabs} from '../content/chapter-routes';
import {InteractivePanel} from '../components/InteractivePanel';
import {ReaderPageData,type PageData} from '../components/ReaderPageData';
import {ButtonLink,RoleIcon} from './primitives';
import {PageTemplate} from './PageTemplate';
import {ChapterEnhancer} from './ChapterEnhancer';
import {ChapterVisual} from './ChapterVisual';
import {readingMinutes,sectionOf,shortTitle} from './page-data';

export type {TabId};
export type PageLink={href:string;label:string};
export type ChapterTemplateProps={
  chapterId:string;tabId:TabId;hrefs:Record<TabId,string>;
  /** Соседние главы: на первом табе «Предыдущая», на последнем «Дальше». */
  prev?:PageLink;next?:PageLink;
  meta?:{minutes?:number;level?:string;template?:string};
  /** Поправки к PageData страницы; по умолчанию шаблон собирает его сам: outline — подзаголовки таба. */
  pageData?:Partial<PageData>;
  /** Место под мини-таймлайн DEMO-42 и мини-карту системы (бриф 9.3–9.4). */
  aside?:ReactNode;
  /** Содержимое таба сверх текста и панелей (тренажёр таба «Проверь себя», P7-03): идёт после них, таб с ним не пустой. */
  children?:ReactNode;
};

const handbook=generated as unknown as Handbook;
const tabIcon={overview:'tabOverview','how-it-works':'tabMechanics',apply:'tabApply',check:'tabCheck'} as const;
/** Адреса 4 табов от адреса страницы: «Обзор» — сам адрес, остальные — сегмент из url-map. */
export function tabHrefs(base:string){return Object.fromEntries(tabs.map(t=>[t.id,t.segment?`${base}/${t.segment}`:base])) as Record<TabId,string>;}
// Заголовок главы — h1, заголовки таба на уровень выше (как в HandbookPage); старый «#» заменяет copy link.
const lift=(html:string)=>html.replace(/<(\/?)h3\b/g,'<$1h2').replace(/<(\/?)h4\b/g,'<$1h3');
const heading=(html:string)=>html.replace(/<a [^>]*class="permalink"[^>]*>#<\/a>/,'').replace(/^<h2/,'<h1').replace(/<\/h2>$/,'</h1>');
/** Одна строка описания в баннере — первый абзац «Обзора» как текст (учебный текст не дублируется в коде). */
// Текст первого абзаца без разметки; сущности компилятора (&quot;, &#x27; и др.) декодируются — React экранирует текст сам.
const entities:Record<string,string>={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:'\u00a0'};
const decode=(text:string)=>text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi,(all,code:string)=>code[0]==='#'?String.fromCodePoint(code[1].toLowerCase()==='x'?parseInt(code.slice(2),16):+code.slice(1)):entities[code.toLowerCase()]??all);
export function lede(html:string){const m=/<p\b[^>]*>([\s\S]*?)<\/p>/.exec(html);return m?decode(m[1].replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim()):'';}

export function ChapterTemplate({chapterId,tabId,hrefs,prev,next,meta,pageData,aside,children}:ChapterTemplateProps){
  const chapter=handbook.chapters.find(c=>c.id===chapterId);
  if(!chapter?.tabs||!chapter.heading)throw new Error(`ChapterTemplate: ${chapterId} has no tabs`);
  const tab=chapter.tabs.find(t=>t.id===tabId);
  if(!tab)throw new Error(`ChapterTemplate: ${chapterId} has no tab ${tabId}`);
  const index=tabs.findIndex(t=>t.id===tabId);
  const label=(id:TabId)=>tabs.find(t=>t.id===id)!.label;
  const minutes=Object.fromEntries(chapter.tabs.map(t=>[t.id,readingMinutes(t.html)])) as Record<TabId,number>;
  const total=meta?.minutes??Object.values(minutes).reduce((a,b)=>a+b,0);
  const before=index>0?{href:hrefs[tabs[index-1].id],label:label(tabs[index-1].id),kind:'Предыдущий таб'}:prev&&{...prev,kind:'Предыдущая глава'};
  const after=index<tabs.length-1?{href:hrefs[tabs[index+1].id],label:label(tabs[index+1].id),kind:'Дальше'}:next&&{...next,kind:'Следующая глава'};
  const filled=chapter.tabs.find((t,i)=>i>index&&t.html)??chapter.tabs.find(t=>t.html&&t.id!==tabId);
  const section=sectionOf(chapterId).label,summary=lede(chapter.tabs.find(t=>t.id==='overview')?.html??'');
  const panels=tab.panels.map(id=>handbook.panels.find(p=>p.chapter===chapterId&&p.id===id)).filter(p=>p!==undefined);
  // Термины и блоки кода — как в HandbookPage, но только для текста этого таба.
  const blocks=handbook.blocks.filter(b=>tab.html.includes(` id="${b.id}"`));
  const required=new Set([...JSON.stringify([chapter.heading,tab.html,panels]).matchAll(/term-[a-z0-9-]+/g)].map(m=>m[0]));for(const block of blocks)for(const term of block.terms)required.add(term);
  const data:PageData={chapterId,outline:tab.outline,hasChecklists:tab.html.includes('data-practice='),terms:handbook.terms.filter(t=>required.has(t.id)),levels:handbook.levels,blocks,...pageData};

  return <>
    <ReaderPageData value={data}/>
    <main id="reader" tabIndex={-1}><PageTemplate className="ct" chapter={chapterId} tab={tabId}
      hero={<header className="ct-banner page-hero shell-wide">
        <div className="ct-banner-text page-hero__text">
          <p className="ct-kicker page-hero__eyebrow">{section?`${section} · `:''}Глава {chapter.number}</p>
          <div className="ct-title" dangerouslySetInnerHTML={{__html:heading(chapter.heading)}}/>
          {summary&&<p className="ct-lede page-hero__description">{summary}</p>}
          <ul className="ct-chips page-hero__meta" aria-label="О главе">
            {total>0&&<li><RoleIcon role="readingTime"/>{total} мин</li>}
            {meta?.level&&<li><RoleIcon role="level"/>{meta.level}</li>}
            {meta?.template&&<li><RoleIcon role="template"/>{meta.template}</li>}
          </ul>
        </div>
        <div className="ct-banner-visual page-hero__visual" aria-hidden="true"><ChapterVisual chapterId={chapterId} number={chapter.number} tabs={tabs.map(t=>t.label)} current={Math.max(0,index)}/></div>
      </header>}
      tabs={{label:'Табы главы',title:`${chapter.number} · ${shortTitle(chapter.title)}`,current:tabId,tabs:tabs.map(t=>({id:t.id,label:t.label,href:hrefs[t.id],icon:tabIcon[t.id]}))}}
      after={<>
        {(before||after)&&<nav className="ct-pager" aria-label="Соседние страницы">
          {before&&<Link className="ct-pager-link ct-pager-prev" href={before.href}><span><RoleIcon role="previous"/>{before.kind}</span><strong>{before.label}</strong></Link>}
          {after&&<Link className="ct-pager-link ct-pager-next" href={after.href}><span>{after.kind}<RoleIcon role="next"/></span><strong>{after.label}</strong></Link>}
        </nav>}
        <ChapterEnhancer key={`${chapterId}/${tabId}`}/>
      </>}>
      {tab.outline.length>1&&<details className="ct-toc"><summary>На этой странице<span>{minutes[tabId]} мин</span></summary><nav aria-label="На этой странице"><ol>{tab.outline.map(item=><li key={item.id}><a href={`#${item.id}`}>{item.title}</a></li>)}</ol></nav></details>}
      {tab.html&&<div className="reader-prose ct-prose" dangerouslySetInnerHTML={{__html:lift(tab.html)}}/>}
      {!tab.html&&!panels.length&&!children&&<div className="ct-empty bp-card bp-card--low" role="status"><h2>Таб «{label(tabId)}» готовится</h2><p>Его текст появится в следующих волнах редизайна. Остальной текст главы уже на месте.</p>{filled&&<ButtonLink variant="tonal" href={hrefs[filled.id]} icon="next">{label(filled.id)}</ButtonLink>}</div>}
      {panels.map(panel=><div id={`${panel.id}-panel`} key={panel.id}><InteractivePanel panel={panel}/></div>)}
      {children}
      {aside&&<aside className="ct-slot" aria-label="Схема главы">{aside}</aside>}
    </PageTemplate></main>
  </>;
}
