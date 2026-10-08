import {LearningProgress} from './LearningProgress';
import {BrandSignature} from './BrandSignature';
import Link from 'next/link';
import generated from '../content/generated.json';
import type {Handbook} from '../content/types';
import {Reader} from './Reader';
import {InteractivePanel} from './InteractivePanel';
import {GlossaryFilter} from './GlossaryFilter';
import {ProjectIcon} from './ProjectIcon';
export const handbook=generated as Handbook;
export function HandbookPage({id}:{id:string}){
 const chapter=handbook.chapters.find(c=>c.id===id),index=handbook.chapters.findIndex(c=>c.id===id);
 const chapterHtml=chapter?.html.replace('<h2','<h1').replace('</h2>','</h1>')??'';const map=handbook.panels.find(p=>p.chapter===id&&p.id==='architecture');const split=map?chapterHtml.indexOf('<h3'):chapterHtml.length;
 const metadata={chapters:handbook.chapters.map(c=>({...c,html:''})),search:handbook.search,terms:handbook.terms,topics:handbook.topics,anchors:handbook.anchors,diagrams:handbook.diagrams.filter(d=>d.chapter===id),blocks:handbook.blocks.filter(b=>b.id.startsWith(id))};
 return <Reader key={id} data={metadata} chapterId={id}><main id="reader" tabIndex={-1}>
 {id==='ch-00'?<><div className="intro" id="top"><p className="eyebrow">Практическое руководство для брата</p><h1 dangerouslySetInnerHTML={{__html:handbook.presentation.heading.replace(/^<p>|<\/p>$/g,'')}}/><BrandSignature/><div className="intro-description" dangerouslySetInnerHTML={{__html:handbook.presentation.description}}/><div className="intro-actions"><Link className="primary-action" href="/chapters/01">Начать чтение <ProjectIcon name="arrowRight"/></Link><Link href="/chapters/02#architecture-panel">Карта системы <ProjectIcon name="architecture"/></Link></div></div><LearningProgress chapter="ch-00"/><div className="orientation reader-prose" dangerouslySetInnerHTML={{__html:handbook.intro}}/></>:chapter&&<section className="chapter" data-chapter={id}><div className="chapter-kicker"><span>Глава {chapter.number}</span><span>{id==='ch-23'?'Единый глоссарий':'В своём темпе'}</span></div>{id==='ch-23'&&<GlossaryFilter terms={handbook.terms} topics={handbook.topics}/>}<div className="reader-prose" dangerouslySetInnerHTML={{__html:chapterHtml.slice(0,split)}}/>{map&&<div id="architecture-panel"><InteractivePanel panel={map}/></div>}{map&&<div className="reader-prose" dangerouslySetInnerHTML={{__html:chapterHtml.slice(split)}}/>}{handbook.panels.filter(p=>p.chapter===id&&p.id!=='architecture').map(panel=><div id={`${panel.id}-panel`} key={panel.id}><InteractivePanel panel={panel}/></div>)}{id==='ch-18'&&<div className="historical-timeline"><p className="eyebrow">Учебный план · merge не подтверждён</p><h3><ProjectIcon name="timeline"/> Последовательность интеграции</h3><ol>{handbook.presentation.timeline.map((html,i)=><li key={i} dangerouslySetInnerHTML={{__html:html}}/>)}</ol></div>}<nav className="chapter-pagination" aria-label="Переходы между главами"><Link href={index>0?handbook.chapters[index-1].path:'/'}><span><ProjectIcon name="arrowLeft"/> Назад</span><strong>{index>0?handbook.chapters[index-1].title:'Как читать'}</strong></Link>{index<handbook.chapters.length-1&&<Link href={handbook.chapters[index+1].path}><span>Далее <ProjectIcon name="arrowRight"/></span><strong>{handbook.chapters[index+1].title}</strong></Link>}</nav></section>}
 </main></Reader>;
}
