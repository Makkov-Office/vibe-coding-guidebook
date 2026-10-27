import Link from 'next/link';
import {handbook} from './HandbookPage';
import {ReaderPageData} from './ReaderPageData';
import {InteractivePanel} from './InteractivePanel';
import {LearningProgress} from './LearningProgress';
import {ProjectIcon} from './ProjectIcon';
import {chapterTabs,chapterTabHrefs} from '../content/chapter-routes';
import type {TabId} from '../content/types';
// One tab of a live chapter (P5-02b): the chapter heading, the tab's HTML and panels.
// The tab bar and the links between tabs are temporary: the chapter template of P5-02 replaces them.
export function ChapterTabPage({chapterId,tabId}:{chapterId:string;tabId:TabId}){
 const chapter=handbook.chapters.find(c=>c.id===chapterId)!,tab=chapter.tabs!.find(t=>t.id===tabId)!,hrefs=chapterTabHrefs(chapterId);
 const heading=chapter.heading!.replace('<h2','<h1').replace('</h2>','</h1>'),html=tab.html.replace(/<(\/?)h3\b/g,'<$1h2').replace(/<(\/?)h4\b/g,'<$1h3');
 const panels=handbook.panels.filter(p=>p.chapter===chapterId&&tab.panels.includes(p.id));
 const blocks=handbook.blocks.filter(b=>tab.html.includes(` id="${b.id}"`));
 const required=new Set([...JSON.stringify([chapter.heading,tab.html,panels]).matchAll(/term-[a-z0-9-]+/g)].map(m=>m[0]));for(const block of blocks)for(const term of block.terms)required.add(term);
 const metadata={chapterId,outline:tab.outline,hasChecklists:html.includes('data-practice='),terms:handbook.terms.filter(t=>required.has(t.id)),levels:handbook.levels,blocks};
 const reading=handbook.chapters.filter(c=>/^ch-\d{2}$/.test(c.id)),index=reading.findIndex(c=>c.id===chapterId),at=chapterTabs.findIndex(t=>t.id===tabId);
 const previous=at>0?{href:hrefs[chapterTabs[at-1].id],label:chapterTabs[at-1].label}:index>0?{href:reading[index-1].href,label:reading[index-1].title}:null;
 const next=at<chapterTabs.length-1?{href:hrefs[chapterTabs[at+1].id],label:chapterTabs[at+1].label}:index<reading.length-1?{href:reading[index+1].href,label:reading[index+1].title}:null;
 return <><ReaderPageData value={metadata}/><main id="reader" tabIndex={-1}><section className="chapter chapter-tabbed" data-chapter={chapterId} data-tab={tabId}>
  <div className="reader-prose" dangerouslySetInnerHTML={{__html:heading}}/>
  <nav className="chapter-tabs-stub" aria-label="Разделы главы"><ul>{chapterTabs.map(t=><li key={t.id}><Link href={hrefs[t.id]} aria-current={t.id===tabId?'page':undefined}>{t.label}</Link></li>)}</ul></nav>
  {html?<div className="reader-prose" dangerouslySetInnerHTML={{__html:html}}/>:<p className="tab-empty">Раздел «{chapterTabs[at].label}» этой главы появится позже.</p>}
  {panels.map(panel=><div id={`${panel.id}-panel`} key={panel.id}><InteractivePanel panel={panel}/></div>)}
  <nav className="chapter-pagination" aria-label="Переходы по главе">{previous&&<Link className="pagination-previous" href={previous.href}><span><ProjectIcon name="arrowLeft"/> Назад</span><strong>{previous.label}</strong></Link>}{next&&<Link className="pagination-next" href={next.href}><span>Дальше <ProjectIcon name="arrowRight"/></span><strong>{next.label}</strong></Link>}</nav>
 </section></main><LearningProgress chapter={chapterId}/></>;
}
