// Главная (P4-01, вид — P4-06 по экрану «Главная» RD-01 f): hero из двух карточек (текст и одна
// спокойная схема пути задачи), 8 карточек разделов с иллюстрацией, «Продолжить» для вернувшихся,
// следующие шаги и подвал. Тексты — content/home.md (generated.home), разделы и их адреса —
// navSections() (P3-01), иллюстрации — home-illustrations.tsx. Стили — src/design/home.css.
import Link from 'next/link';
import {handbook} from '../components/HandbookPage';
import {ReaderPageData} from '../components/ReaderPageData';
import {navSections,type NavSection} from './nav-sections';
import {HomeResume} from './HomeResume';
import {HeroPath,SectionIllustration,sectionTone} from './home-illustrations';
import {pageHref} from '../content/chapter-routes';
import {ProjectIcon} from '../components/ProjectIcon';
import {fillLabel,pluralForm} from './home-labels';
import type {HomeContent} from '../content/types';

const pageData={chapterId:'home',outline:[],hasChecklists:false,terms:[],levels:null,blocks:[]};

/** Мета-строка карточки из данных сборки: номера глав раздела или число страниц; шаблоны — «## Подписи» в content/home.md. */
function meta(section:NavSection,labels:HomeContent['labels']){
  const numbers=section.pages.map(page=>page.number).filter(Boolean);
  if(numbers.length&&numbers.length===section.pages.length)return numbers.length===1?fillLabel(labels.chapter,{n:numbers[0]}):fillLabel(labels.chapters,{from:numbers[0],to:numbers.at(-1)!});
  const n=section.pages.length+section.groups.reduce((sum,group)=>sum+group.pages.length,0);
  return n?fillLabel(pluralForm(n,labels.pages),{n}):'';
}

export function HomePage(){
  const home=handbook.home;
  const sections=navSections(handbook.chapters.map(({id,number,title,href})=>({id,number,title,path:href}))).filter(section=>section.id!=='home');
  const sectionOf=(id:string)=>sections.find(item=>[...item.pages,...item.groups.flatMap(group=>group.pages)].some(page=>page.chapter===id))?.label??'';
  const chapters=Object.fromEntries(handbook.chapters.map(chapter=>[chapter.id,{title:chapter.title,section:sectionOf(chapter.id)}]));
  // Тренажёр — только своей главы читателя (P7-03): у главы без тренажёра карточки нет.
  const drills=Object.fromEntries(handbook.drills.map(drill=>[drill.chapter,{title:drill.title,text:drill.intro,minutes:drill.minutes,href:pageHref(drill.chapter,'check')}]));
  return <><ReaderPageData value={pageData}/><main id="reader" tabIndex={-1} className="home shell-wide">
    <div className="home-hero">
      <section className="home-hero__text" aria-labelledby="home-title">
        <svg className="home-plus" aria-hidden="true" focusable="false">
          <defs><pattern id="home-plus" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M10 14h8M14 10v8"/></pattern></defs>
          <rect width="100%" height="100%" fill="url(#home-plus)"/>
        </svg>
        <p className="home-eyebrow">{home.eyebrow}</p>
        <h1 id="home-title">{home.title}</h1>
        <p className="home-subtitle">{home.subtitle}</p>
        <div className="home-actions">{home.actions.map((action,i)=><Link key={action.href} className={`bp-button bp-button--${i?'tonal':'fill'}`} href={action.href}>{action.label}{!i&&<ProjectIcon name="arrowRight"/>}</Link>)}</div>
        <p className="sr-only" id="home-path-steps">{home.path.title} {home.path.steps.map(step=>`${step.label}: ${step.sub}`).join(' → ')}</p>
      </section>
      <figure className="home-hero__visual home-path">
        <HeroPath title={home.path.title} steps={home.path.steps}/>
      </figure>
    </div>
    <section className="home-block" aria-labelledby="home-sections">
      <div className="home-head"><h2 id="home-sections">{home.sections.heading}</h2><p className="home-lead">{home.sections.lead}</p></div>
      <ul className="home-cards">{sections.map((section,i)=>{const card=home.sections.cards[i];const tone=sectionTone[section.id];const info=meta(section,home.labels);
        const body=<><span className={`home-card-vis${tone?` home-card-vis--${tone}`:''}`}><SectionIllustration id={section.id}/></span><span className="home-card-body"><h3>{card.label}</h3><p>{card.text}</p>{info&&<span className="home-card-meta">{info}</span>}</span></>;
        return <li key={section.id}>{section.href?<Link className="home-card" data-section={section.id} href={section.href}>{body}</Link>:<div className="home-card home-card--off" aria-disabled="true">{body}</div>}</li>;})}</ul>
    </section>
    <HomeResume heading={home.resume.heading} lead={home.resume.lead} action={home.resume.action} labels={home.labels} chapters={chapters} drills={drills}/>
    <section className="home-block" aria-labelledby="home-next">
      <h2 id="home-next">{home.next.heading}</h2>
      <ul className="home-next">{home.next.items.map(item=>{const body=<><span><h3>{item.label}</h3><p>{item.text}</p></span>{item.href&&<ProjectIcon name="arrowRight"/>}</>;
        return <li key={item.label}>{item.href?<Link className="home-next-item" href={item.href}>{body}</Link>:<div className="home-next-item">{body}</div>}</li>;})}</ul>
    </section>
    <nav className="home-footer" aria-label={home.footer.heading}>{home.footer.groups.map(group=><div key={group.heading}><h2>{group.heading}</h2><ul>{group.links.map(link=><li key={link.href}>{/^https:/.test(link.href)?<a href={link.href} rel="noopener noreferrer">{link.label}</a>:/\.\w+$/.test(link.href)?<a href={link.href}>{link.label}</a>:<Link href={link.href}>{link.label}</Link>}</li>)}</ul></div>)}</nav>
  </main></>;
}
