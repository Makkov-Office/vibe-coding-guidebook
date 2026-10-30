import {LearningProgress} from './LearningProgress';
import Link from 'next/link';
import generated from '../content/generated.json';
import type {Handbook} from '../content/types';
import {ReaderPageData} from './ReaderPageData';
import {InteractivePanel} from './InteractivePanel';
import {GlossaryPage} from './GlossaryPage';
import {ProjectIcon} from './ProjectIcon';
import type {ReactNode} from 'react';
import {PageHero,splitLead,type HeroTone} from '../design/PageHero';
import {PageTemplate} from '../design/PageTemplate';
import {pageTabs,readingMinutes,sectionOf,sectionTabs,shortTitle} from '../design/page-data';
import {SectionIllustration,sectionTone} from '../design/home-illustrations';
import {ChecklistVisual,ClaudeCodeVisual,CodexVisual,ResourcesVisual,RouteVisual,ToolsVisual} from '../design/HeroVisuals';
import {plural} from './plural';
import {RoleIcon} from '../design/primitives';
export const handbook=generated as Handbook;

// Страница без табов главы в едином шаблоне (P3-11, PageTemplate): баннер — h1 и первый абзац текста, табы —
// разделы страницы или страницы раздела (page-data.ts), тело — остальной текст. Свой визуал и надзаголовок — у
// страниц ниже; у глав — иллюстрация их раздела меню (та же, что в карточке раздела на главной).
const heroes:Record<string,{eyebrow:string;tone:HeroTone;visual:ReactNode;description?:string}>={
 'ch-22':{eyebrow:'Справочник',tone:'human',visual:<ChecklistVisual/>,description:'Короткие правила на каждый день'},
 'ch-tools':{eyebrow:'Инструменты',tone:'agent',visual:<ToolsVisual/>},
 'ch-codex':{eyebrow:'Инструменты · обзор',tone:'agent',visual:<CodexVisual/>},
 'ch-claude-code':{eyebrow:'Инструменты · обзор',tone:'agent',visual:<ClaudeCodeVisual/>},
 'ch-resources':{eyebrow:'Инструменты · материалы',tone:'practice',visual:<ResourcesVisual/>},
};
const pageClass:Record<string,string>={'ch-resources':'resource-chapter','ch-tools':'tool-directory','ch-codex':'tool-review','ch-claude-code':'tool-review'};

/** Заголовок главы — h1, подзаголовки на уровень выше. */
const lift=(html:string)=>html.replace('<h2','<h1').replace('</h2>','</h1>').replace(/<(\/?)h3\b/g,'<$1h2').replace(/<(\/?)h4\b/g,'<$1h3');

function Intro(){
 const tabs=sectionTabs('ch-00','Как читать');
 return <PageTemplate chapter="ch-00" tabs={tabs}
  hero={<PageHero id="top" className="intro-hero" eyebrow="Практическое руководство для брата" titleHtml={`<h1>${handbook.presentation.heading.replace(/^<p>|<\/p>$/g,'')}</h1>`} descriptionHtml={handbook.presentation.description} tone="practice" visual={<RouteVisual/>}
   actions={<div className="intro-actions"><Link className="primary-action" href="/chapters/01">Начать чтение <ProjectIcon name="arrowRight"/></Link><Link className="secondary-action" href="/chapters/02#architecture-panel"><ProjectIcon name="map"/> Карта системы</Link></div>}/>}>
  <LearningProgress chapter="ch-00"/>
  <div className="orientation reader-prose" dangerouslySetInnerHTML={{__html:handbook.intro}}/>
 </PageTemplate>;
}

export function HandbookPage({id}:{id:string}){
 const chapter=handbook.chapters.find(c=>c.id===id),readingChapters=handbook.chapters.filter(c=>/^ch-\d{2}$/.test(c.id)),index=readingChapters.findIndex(c=>c.id===id);
 const referenceOnly=index<0;
 const chapterHtml=chapter?lift(chapter.html):'';
 const blocks=handbook.blocks.filter(b=>b.id.startsWith(id));
 const contexts=JSON.stringify([chapter?.html,id==='ch-00'?[handbook.intro,handbook.presentation]:null,handbook.panels.filter(p=>p.chapter===id),id==='ch-18'?handbook.presentation.timeline:null]);
 const required=new Set([...contexts.matchAll(/term-[a-z0-9-]+/g)].map(m=>m[0]));for(const block of blocks)for(const term of block.terms)required.add(term);
 const title=chapter?shortTitle(chapter.title):'';
 const tabs=chapter&&id!=='ch-00'?pageTabs(id,chapter.outline,chapter.number&&!referenceOnly?`${chapter.number} · ${title}`:title):null;
 // «На этой странице» справа не нужна, когда разделы страницы уже стоят в табах.
 const metadata={chapterId:id,outline:tabs?.mode==='anchor'?[]:chapter?.outline??[],hasChecklists:chapterHtml.includes('data-practice='),terms:id==='ch-23'?[]:handbook.terms.filter(t=>required.has(t.id)),levels:handbook.levels,blocks};
 let page:ReactNode=null;
 if(id==='ch-00')page=<Intro/>;
 else if(id==='ch-23'&&chapter)page=<GlossaryPage chapter={chapter} handbook={handbook} html={chapterHtml} tabs={tabs}/>;
 else if(chapter){
  const {title:titleHtml,lead,rest}=splitLead(chapterHtml);
  const section=sectionOf(id),own=heroes[id];
  const hero=own??{eyebrow:`${section.label} · Глава ${chapter.number}`,tone:sectionTone[section.id]??'neutral',visual:<SectionIllustration id={section.id}/>};
  const meta=<ul className="page-hero__meta" aria-label="О странице">
   {!referenceOnly&&<li><RoleIcon role="readingTime"/>{readingMinutes(chapter.html)} мин</li>}
   {chapter.outline.length>1&&<li><ProjectIcon name="tags"/>{plural(chapter.outline.length,['раздел','раздела','разделов'])}</li>}
  </ul>;
  const map=handbook.panels.find(p=>p.chapter===id&&p.id==='architecture');const split=map?rest.indexOf('<h2'):rest.length;
  page=<PageTemplate className={['chapter',pageClass[id]].filter(Boolean).join(' ')} chapter={id} tabs={tabs}
   hero={<PageHero eyebrow={hero.eyebrow} titleHtml={titleHtml} descriptionHtml={lead||undefined} description={lead?undefined:hero.description} tone={hero.tone} visual={hero.visual} meta={meta}/>}
   after={!referenceOnly&&<nav className="chapter-pagination" aria-label="Переходы между главами"><Link className="pagination-previous" href={index>0?readingChapters[index-1].href:'/start/00-how-to-read'}><span><ProjectIcon name="arrowLeft"/> Предыдущий раздел</span><strong>{index>0?readingChapters[index-1].title:'Как читать руководство'}</strong></Link>{index<readingChapters.length-1&&<Link className="pagination-next" href={readingChapters[index+1].href}><span>Следующий раздел <ProjectIcon name="arrowRight"/></span><strong>{readingChapters[index+1].title}</strong></Link>}</nav>}>
   <div className="reader-prose" dangerouslySetInnerHTML={{__html:rest.slice(0,split)}}/>
   {map&&<div id="architecture-panel"><InteractivePanel panel={map}/></div>}
   {map&&<div className="reader-prose" dangerouslySetInnerHTML={{__html:rest.slice(split)}}/>}
   {handbook.panels.filter(p=>p.chapter===id&&p.id!=='architecture').map(panel=><div id={`${panel.id}-panel`} key={panel.id}><InteractivePanel panel={panel}/></div>)}
   {id==='ch-18'&&<div className="historical-timeline"><p className="eyebrow">Учебный план · merge не подтверждён</p><h2><ProjectIcon name="timeline"/> Последовательность интеграции</h2><ol>{handbook.presentation.timeline.map((html,i)=><li key={i} dangerouslySetInnerHTML={{__html:html}}/>)}</ol></div>}
  </PageTemplate>;
 }
 return <><ReaderPageData value={metadata}/><main id="reader" tabIndex={-1}>{page}</main>{id!=='ch-00'&&!referenceOnly&&<LearningProgress chapter={id}/>}</>;
}
