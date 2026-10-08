import generated from '../src/content/generated.json';
import type {Handbook} from '../src/content/types';
import {Reader} from '../src/components/Reader';
import {InteractivePanel} from '../src/components/InteractivePanel';
import {GlossaryFilter} from '../src/components/GlossaryFilter';
import {ProjectIcon} from '../src/components/ProjectIcon';
const data=generated as Handbook;
export default function Home(){
  const metadata={chapters:data.chapters.map(({id,title,number,outline})=>({id,title,number,outline})),search:data.search,terms:data.terms,topics:data.topics,diagrams:data.diagrams,blocks:data.blocks};
  return <Reader data={metadata}><main id="reader" tabIndex={-1}>
    <div className="intro" id="top"><div className="eyebrow intro-label"><span className="small-mark"/> Практическое руководство · v1.1</div><h1 dangerouslySetInnerHTML={{__html:data.presentation.heading.replace(/^<p>|<\/p>$/g,'')}}/><div className="intro-description" dangerouslySetInnerHTML={{__html:data.presentation.description}}/><div className="intro-actions"><a className="primary-action" href="#ch-01">Начать чтение <ProjectIcon name="arrowRight"/></a><a href="#architecture-panel">Посмотреть карту системы <ProjectIcon name="arrowRight"/></a></div><div className="intro-meta"><span dangerouslySetInnerHTML={{__html:data.presentation.subtitle.replace(/^<p>|<\/p>$/g,'')}}/><span>8 октября 2026</span></div></div>
    <div className="orientation reader-prose" dangerouslySetInnerHTML={{__html:data.intro}}/>
    {data.chapters.map((chapter,index)=><section className="chapter" data-chapter={chapter.id} key={chapter.id}>
      <div className="chapter-kicker"><span>Глава {chapter.number}</span><span>{index<5?'Понять систему':index<11?'Провести задачу':index<17?'Риск и интеграция':index<21?'Практика и развитие':'Справочник'}</span></div>
      {chapter.id==='ch-23' && <GlossaryFilter terms={data.terms} topics={data.topics}/>}
      <div className="reader-prose" dangerouslySetInnerHTML={{__html:chapter.html}}/>
      {data.panels.filter(p=>p.chapter===chapter.id).map(panel=><div key={panel.id} id={`${panel.id}-panel`}><InteractivePanel panel={panel}/></div>)}
      {chapter.id==='ch-18'&&<div className="historical-timeline"><p className="eyebrow">Исторический план · завершение не подтверждено</p><h3><ProjectIcon name="timeline"/> Последовательность интеграции</h3><ol>{data.presentation.timeline.map((html,i)=><li key={i} dangerouslySetInnerHTML={{__html:html}}/>)}</ol></div>}
      <nav className="chapter-pagination" aria-label={`Переходы из главы ${chapter.number}`}>{index>0?<a href={`#${data.chapters[index-1].id}`}><span><ProjectIcon name="arrowLeft"/> Предыдущая глава</span><strong>{data.chapters[index-1].title.replace(/^\d{2}\.\s*/,'')}</strong></a>:<a href="#ch-00"><span><ProjectIcon name="arrowLeft"/> Как читать</span><strong>Ориентация</strong></a>}{index<23 && <a href={`#${data.chapters[index+1].id}`}><span>Следующая глава <ProjectIcon name="arrowRight"/></span><strong>{data.chapters[index+1].title.replace(/^\d{2}\.\s*/,'')}</strong></a>}</nav>
    </section>)}
  </main></Reader>;
}
