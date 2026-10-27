// Главная (P4-01, бриф 7.3): hero с путём задачи, 8 карточек разделов, «Продолжить»
// для вернувшихся, следующие шаги и подвал. Тексты — content/home.md (generated.home),
// разделы и их адреса — navSections() (P3-01). Стили — src/design/home.css.
import Link from 'next/link';
import {handbook} from '../components/HandbookPage';
import {ReaderPageData} from '../components/ReaderPageData';
import {navSections} from './nav-sections';
import {Blueprint,BpArrow,BpNode,BpRunDot,PlusBanner,RoleIcon,type Meaning} from './primitives';
import {HomeResume} from './HomeResume';
import {ProjectIcon} from '../components/ProjectIcon';

// Змейка 2 × 4: узлы 124 × 56, колонки x 0 и 156, ряды через 80; ширина 280 помещается в hero от 360 px.
const at=[[0,0],[156,0],[156,80],[0,80],[0,160],[156,160],[156,240],[0,240]];
const meaning:Meaning[]=['human','path','agent','agent','practice','human','path','path'];
const arrows=['M124 28H152','M218 56V76','M156 108H128','M62 136V156','M124 188H152','M218 216V236','M156 268H128'];
const run='M62 28H218V108H62V188H218V268H62';
const pageData={chapterId:'home',outline:[],hasChecklists:false,terms:[],levels:null,blocks:[]};

export function HomePage(){
  const home=handbook.home;
  const sections=navSections(handbook.chapters.map(({id,number,title,href})=>({id,number,title,path:href}))).filter(section=>section.id!=='home');
  const titles=Object.fromEntries(handbook.chapters.map(chapter=>[chapter.id,chapter.title]));
  return <><ReaderPageData value={pageData}/><main id="reader" tabIndex={-1} className="home">
    <div className="home-hero">
      <PlusBanner>
        <div className="home-hero-text">
          <h1>{home.title}</h1>
          <p className="home-subtitle">{home.subtitle}</p>
          <p>{home.lead}</p>
          <div className="home-actions">{home.actions.map((action,i)=><Link key={action.href} className={`bp-button bp-button--${i?'tonal':'fill'}`} href={action.href}>{action.label}{!i&&<ProjectIcon name="arrowRight"/>}</Link>)}</div>
        </div>
        <figure className="home-path">
          <Blueprint viewBox="0 0 280 296" title={home.path.title}>
            {arrows.map(d=><BpArrow key={d} d={d} draw/>)}
            {home.path.steps.map((step,i)=><BpNode key={step.label} x={at[i][0]} y={at[i][1]} w={124} meaning={meaning[i]} label={step.label} sub={step.sub}/>)}
            <BpRunDot d={run}/>
          </Blueprint>
          <figcaption>{home.path.title}<span className="sr-only"> {home.path.steps.map(step=>`${step.label}: ${step.sub}`).join(' → ')}</span></figcaption>
        </figure>
      </PlusBanner>
    </div>
    <HomeResume heading={home.resume.heading} lead={home.resume.lead} action={home.resume.action} titles={titles}/>
    <section className="home-block" aria-labelledby="home-sections">
      <h2 id="home-sections">{home.sections.heading}</h2>
      <p className="home-lead">{home.sections.lead}</p>
      <ul className="home-cards">{sections.map((section,i)=>{const card=home.sections.cards[i];const body=<><span className="home-card-icon"><RoleIcon role={section.icon}/></span><h3>{card.label}</h3><p>{card.text}</p><span className="home-card-line" aria-hidden="true"/></>;
        return <li key={section.id}>{section.href?<Link className="bp-card home-card" href={section.href}>{body}</Link>:<div className="bp-card bp-card--low home-card" aria-disabled="true">{body}</div>}</li>;})}</ul>
    </section>
    <section className="home-block" aria-labelledby="home-next">
      <h2 id="home-next">{home.next.heading}</h2>
      <ul className="home-next">{home.next.items.map(item=><li key={item.label}>{item.href?<Link className="bp-card home-next-item" href={item.href}><h3>{item.label}</h3><p>{item.text}</p><span className="home-next-arrow"><ProjectIcon name="arrowRight"/></span></Link>:<div className="bp-card bp-card--low home-next-item"><h3>{item.label}</h3><p>{item.text}</p></div>}</li>)}</ul>
    </section>
    <nav className="home-footer" aria-label={home.footer.heading}>{home.footer.groups.map(group=><div key={group.heading}><h2>{group.heading}</h2><ul>{group.links.map(link=><li key={link.href}>{/\.\w+$/.test(link.href)?<a href={link.href}>{link.label}</a>:<Link href={link.href}>{link.label}</Link>}</li>)}</ul></div>)}</nav>
  </main></>;
}
