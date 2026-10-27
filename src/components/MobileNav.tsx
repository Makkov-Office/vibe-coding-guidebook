"use client";
// Mobile navigation (P3-02, docs/design/visual-language.md «Навигация»): below 1024 px a bottom bar
// replaces the rail, and «Разделы» opens a full-screen menu with the same nine sections, pages and
// progress as the rail's mega-menus. Each section is a disclosure; the current one starts open.
import Link from 'next/link';
import {useEffect,useMemo,useRef,useState} from 'react';
import {navSections,currentSection,completable,onPage,type NavChapter} from '../design/nav-sections';
import {RoleIcon,PageLink,Progress,useCompleted} from './NavRail';
import {UiControls} from './UiControls';
import {pageHref} from '../content/chapter-routes';
import '../design/mobile-nav.css';

export function MobileNav({chapters,pathname,ready,onSearch}:{chapters:NavChapter[];pathname:string;ready:boolean;onSearch:(opener:HTMLElement)=>void}){
 const sections=useMemo(()=>navSections(chapters),[chapters]),active=currentSection(sections,pathname),completed=useCompleted();
 const dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLButtonElement>(null),navigating=useRef(false);
 const [open,setOpen]=useState(false),[expanded,setExpanded]=useState<string[]>([]);
 // «Продолжить» leads to the first chapter not yet completed, in reading order.
 const next=chapters.filter(c=>completable(c.id)).sort((a,b)=>a.id<b.id?-1:1).find(c=>!completed.includes(c.id));
 const continueHref=next?.path??pageHref('ch-23');
 const show=()=>{window.dispatchEvent(new Event('context-close'));setExpanded(active&&active!=='home'?[active]:[]);dialog.current?.showModal();setOpen(true);};
 // A link closes the menu for the route change: focus goes to the new page, not back to «Разделы».
 const leave=()=>{navigating.current=true;dialog.current?.close();};
 // A link in the menu: the new page takes focus, also where the router does not move it (/agents).
 // A link to the page already open changes no address: no flag that would outlive it.
 const focusPage=useRef(false),go=(e?:{currentTarget:EventTarget})=>{const link=e?.currentTarget;focusPage.current=!(link instanceof HTMLAnchorElement&&link.pathname===location.pathname);leave();};
 // The menu belongs to the narrow layout: widening the window to the rail closes it.
 useEffect(()=>{const wide=matchMedia('(min-width:1024px)'),fit=()=>{if(wide.matches&&dialog.current?.open)dialog.current.close();};wide.addEventListener('change',fit);return()=>wide.removeEventListener('change',fit);},[]);
 // Any route change (search, back button, a link in the text) closes the menu the same way.
 useEffect(()=>{
  if(dialog.current?.open)leave();
  if(!focusPage.current)return;focusPage.current=false;if(location.hash)return;
  const frame=requestAnimationFrame(()=>{const main=document.querySelector<HTMLElement>('main#reader');if(main&&!main.contains(document.activeElement))main.focus({preventScroll:true});});
  return()=>cancelAnimationFrame(frame);
 },[pathname]);
 const toggle=(id:string)=>setExpanded(list=>list.includes(id)?list.filter(x=>x!==id):[...list,id]);
 return <>
  <nav className="bottom-bar" aria-label="Навигация">
   <Link className="bottom-item" href="/" prefetch={false} aria-current={pathname==='/'?'page':undefined}><span className="bottom-indicator"><RoleIcon role="home" filled={pathname==='/'}/></span><span>Главная</span></Link>
   <button ref={trigger} type="button" className="bottom-item" disabled={!ready} aria-haspopup="dialog" aria-expanded={open} aria-controls="section-menu" onClick={show}><span className="bottom-indicator"><RoleIcon role="menu"/></span><span>Разделы</span></button>
   <button type="button" className="bottom-item" disabled={!ready} aria-haspopup="dialog" onClick={event=>onSearch(event.currentTarget)}><span className="bottom-indicator"><RoleIcon role="search"/></span><span>Поиск</span></button>
   <Link className="bottom-item" href={continueHref} prefetch={false} aria-current={onPage(continueHref,pathname)?'page':undefined}><span className="bottom-indicator"><RoleIcon role="progress"/></span><span>{next?'Продолжить':'Глоссарий'}</span></Link>
  </nav>
  <dialog ref={dialog} id="section-menu" className="section-menu" aria-labelledby="section-menu-title" onClose={()=>{setOpen(false);if(!navigating.current)trigger.current?.focus();navigating.current=false;}}>
   <div className="section-menu-header"><h2 id="section-menu-title">Разделы</h2><button type="button" className="section-menu-close" aria-label="Закрыть разделы" onClick={()=>dialog.current?.close()}><RoleIcon role="close"/></button></div>
   <nav aria-label="Разделы руководства"><ul className="section-list">{sections.map(s=>{
    const isOpen=expanded.includes(s.id),current=active===s.id;
    if(s.id==='home')return <li key={s.id}><Link className="section-row" href="/" prefetch={false} aria-current={current?'true':undefined} onClick={go}><span className="section-icon"><RoleIcon role={s.icon} filled={current}/></span><span className="section-label">{s.label}</span></Link></li>;
    return <li key={s.id}>
     <button type="button" className="section-row" aria-expanded={isOpen} aria-controls={`section-${s.id}`} aria-current={current?'true':undefined} onClick={()=>toggle(s.id)}><span className="section-icon"><RoleIcon role={s.icon} filled={current}/></span><span className="section-label">{s.label}</span><span className="section-chevron" aria-hidden="true"/></button>
     <div id={`section-${s.id}`} className="section-panel" hidden={!isOpen}>
      <p className="mega-description">{s.description}</p>
      {s.href&&!s.pages.length&&!s.links.some(l=>l.href===s.href)&&<ul className="mega-links"><li><Link href={s.href} prefetch={false} onClick={go}>Открыть раздел</Link></li></ul>}
      {s.pages.length>0&&<ul className="mega-list">{s.pages.map(p=><PageLink key={p.chapter} page={p} pathname={pathname} completed={completed} onNavigate={go}/>)}</ul>}
      {s.groups.filter(g=>g.pages.length).map(g=><div key={g.label} className="mega-group"><p className="mega-group-label">{g.label}</p><ul className="mega-list">{g.pages.map(p=><PageLink key={p.chapter} page={p} pathname={pathname} completed={completed} onNavigate={go}/>)}</ul></div>)}
      <Progress section={s} completed={completed} onNavigate={go}/>
      {s.links.length>0&&<ul className="mega-links">{s.links.map(l=><li key={l.href}>{/\.[a-z0-9]+$/i.test(l.href)?<a href={l.href} download={l.download||undefined}>{l.label}</a>:<Link href={l.href} prefetch={false} onClick={go}>{l.label}</Link>}</li>)}</ul>}
     </div>
    </li>;
   })}</ul></nav>
   <UiControls className="menu-controls"/>
  </dialog>
 </>;
}
