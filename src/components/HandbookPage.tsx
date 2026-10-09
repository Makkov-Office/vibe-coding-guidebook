import {LearningProgress} from './LearningProgress';
import {BrandSignature} from './BrandSignature';
import Link from 'next/link';
import generated from '../content/generated.json';
import type {Handbook} from '../content/types';
import {ReaderPageData} from './ReaderPageData';
import {InteractivePanel} from './InteractivePanel';
import {GlossaryFilter} from './GlossaryFilter';
import {ProjectIcon} from './ProjectIcon';
export const handbook=generated as Handbook;
export function HandbookPage({id}:{id:string}){
 const chapter=handbook.chapters.find(c=>c.id===id),index=handbook.chapters.filter(c=>c.id!=='ch-resources').findIndex(c=>c.id===id);
 const readingChapters=handbook.chapters.filter(c=>c.id!=='ch-resources');
 const chapterHtml=chapter?.html.replace('<h2','<h1').replace('</h2>','</h1>').replace(/<(\/?)h3\b/g,'<$1h2').replace(/<(\/?)h4\b/g,'<$1h3')??'';const map=handbook.panels.find(p=>p.chapter===id&&p.id==='architecture');const split=map?chapterHtml.indexOf('<h2'):chapterHtml.length;
 const blocks=handbook.blocks.filter(b=>b.id.startsWith(id));
 const contexts=JSON.stringify([chapter?.html,id==='ch-00'?[handbook.intro,handbook.presentation]:null,handbook.panels.filter(p=>p.chapter===id),id==='ch-18'?handbook.presentation.timeline:null]);
 const required=new Set([...contexts.matchAll(/term-[a-z0-9-]+/g)].map(m=>m[0]));for(const block of blocks)for(const term of block.terms)required.add(term);
 const metadata={chapterId:id,outline:chapter?.outline??[],hasChecklists:chapterHtml.includes('data-practice='),terms:id==='ch-23'?[]:handbook.terms.filter(t=>required.has(t.id)),blocks};
 return <><ReaderPageData value={metadata}/><main id="reader" tabIndex={-1}>
 {id==='ch-00'?<><div className="intro" id="top"><p className="eyebrow">Практическое руководство для брата</p><h1 dangerouslySetInnerHTML={{__html:handbook.presentation.heading.replace(/^<p>|<\/p>$/g,'')}}/><BrandSignature/><div className="intro-description" dangerouslySetInnerHTML={{__html:handbook.presentation.description}}/><div className="intro-actions"><Link className="primary-action" href="/chapters/01">Начать чтение <ProjectIcon name="arrowRight"/></Link><Link href="/chapters/02#architecture-panel">Карта системы <ProjectIcon name="architecture"/></Link></div></div><LearningProgress chapter="ch-00"/><div className="orientation reader-prose" dangerouslySetInnerHTML={{__html:handbook.intro}}/></>:chapter&&<section className={id==='ch-resources'?'chapter resource-chapter':'chapter'} data-chapter={id}>{id==='ch-23'&&<GlossaryFilter terms={handbook.terms.map(({id,label,aliases,topic,definition})=>({id,label,aliases,topic,definition}))} topics={handbook.topics}/>}<div className="reader-prose" dangerouslySetInnerHTML={{__html:chapterHtml.slice(0,split)}}/>{map&&<div id="architecture-panel"><InteractivePanel panel={map}/></div>}{map&&<div className="reader-prose" dangerouslySetInnerHTML={{__html:chapterHtml.slice(split)}}/>}{handbook.panels.filter(p=>p.chapter===id&&p.id!=='architecture').map(panel=><div id={`${panel.id}-panel`} key={panel.id}><InteractivePanel panel={panel}/></div>)}{id==='ch-18'&&<div className="historical-timeline"><p className="eyebrow">Учебный план · merge не подтверждён</p><h2><ProjectIcon name="timeline"/> Последовательность интеграции</h2><ol>{handbook.presentation.timeline.map((html,i)=><li key={i} dangerouslySetInnerHTML={{__html:html}}/>)}</ol></div>}{id!=='ch-resources'&&<nav className="chapter-pagination" aria-label="Переходы между главами"><Link className="pagination-previous" href={index>0?readingChapters[index-1].path:'/'}><span><ProjectIcon name="arrowLeft"/> Предыдущий раздел</span><strong>{index>0?readingChapters[index-1].title:'Как читать руководство'}</strong></Link>{index<readingChapters.length-1&&<Link className="pagination-next" href={readingChapters[index+1].path}><span>Следующий раздел <ProjectIcon name="arrowRight"/></span><strong>{readingChapters[index+1].title}</strong></Link>}</nav>}</section>}
 </main>{id!=='ch-00'&&id!=='ch-resources'&&<LearningProgress chapter={id}/>}</>;
}
