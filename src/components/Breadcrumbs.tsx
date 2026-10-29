"use client";
// Breadcrumbs (P3-03, docs/design/visual-language.md «Навигация»): «Главная › Раздел › Страница»
// from the rail sections of src/content/url-map.json. A page outside every section (print, 404)
// and the home page get none.
import Link from 'next/link';
import {useMemo} from 'react';
import {navSections,currentSection,onPage,type NavChapter} from '../design/nav-sections';
import {chapterTabs,liveRoute} from '../content/chapter-routes';
import '../design/search-nav.css';

export function Breadcrumbs({chapters,pathname}:{chapters:NavChapter[];pathname:string}){
 const sections=useMemo(()=>navSections(chapters),[chapters]);
 const id=pathname==='/'?null:currentSection(sections,pathname),section=sections.find(s=>s.id===id);
 if(!section)return null;
 const page=[...section.pages,...section.groups.flatMap(g=>g.pages)].find(p=>onPage(p.href,pathname));
 // A chapter tab other than «Обзор» (P5-02b) is one more crumb after its chapter.
 const route=liveRoute(pathname),tab=route&&route.tab!=='overview'?chapterTabs.find(t=>t.id===route.tab):undefined;
 // A section with its own page (Agent Pack) is the last crumb itself.
 const sectionIsPage=!page&&section.href===pathname;
 return <nav className="breadcrumbs" aria-label="Хлебные крошки"><ol>
  <li><Link href="/">Главная</Link></li>
  <li>{sectionIsPage?<span aria-current="page">{section.label}</span>:section.href&&section.href!==pathname?<Link href={section.href}>{section.label}</Link>:<span>{section.label}</span>}</li>
  {page&&<li className="crumb-page">{tab?<Link href={page.href}>{page.number?`${page.number}. `:''}{page.title}</Link>:<span aria-current="page">{page.number?`${page.number}. `:''}{page.title}</span>}</li>}
  {page&&tab&&<li><span aria-current="page">{tab.label}</span></li>}
 </ol></nav>;
}
