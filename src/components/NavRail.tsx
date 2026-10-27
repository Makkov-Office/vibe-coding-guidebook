"use client";
// Navigation rail and mega-menu (P3-01, docs/design/visual-language.md «Навигация»): nine sections,
// disclosure navigation (not role=menu). Hover opens after a short delay, focus and tap open at once,
// Esc closes and returns focus to the rail item, arrows move along the rail and inside the menu.
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {useEffect,useMemo,useRef,useState,type KeyboardEvent,type PointerEvent} from 'react';
import {iconProps,iconRoles} from '../design/icons.mjs';
import {appear} from '../design/motion';
import {navSections,currentSection,type NavChapter,type NavPage,type NavSection} from '../design/nav-sections';
import {readLocal} from './localState';
import {normalizeMarks} from './learning-profile';
import '../design/nav-rail.css';

const learningKey='handbook-learning-v2',changeEvent='handbook-learning-change';
// Hover intent: open after the pointer rests, close after it has left both rail and menu.
const openDelay=90,closeDelay=180;

function RoleIcon({role,filled=false}:{role:keyof typeof iconRoles;filled?:boolean}){
 const entry=iconRoles[role] as {icon:typeof iconRoles.home.icon;filled?:typeof iconRoles.home.icon};
 const Icon=filled&&entry.filled?entry.filled:entry.icon;
 return <Icon {...iconProps}/>;
}

function Ring({state}:{state:'done'|'current'|'todo'}){
 const c=2*Math.PI*7;
 return <svg className={`nav-ring nav-ring-${state}`} viewBox="0 0 20 20" aria-hidden="true"><circle className="nav-ring-bg" cx="10" cy="10" r="7"/><circle className="nav-ring-fg" cx="10" cy="10" r="7" strokeDasharray={c.toFixed(1)} strokeDashoffset={(state==='done'?0:state==='current'?c/2:c).toFixed(1)}/></svg>;
}

function PageLink({page,pathname,completed,onNavigate}:{page:NavPage;pathname:string;completed:string[];onNavigate:()=>void}){
 const router=useRouter(),warm=()=>router.prefetch(page.href);
 const current=page.href===pathname,done=completed.includes(page.chapter);
 const state=done?'done':current?'current':'todo';
 return <li><Link className="mega-item" href={page.href} prefetch={false} onMouseEnter={warm} onFocus={warm} aria-current={current?'page':undefined} onClick={onNavigate}>
  <span className="mega-number">{page.number||'·'}</span><span className="mega-title">{page.title}</span>
  {page.completable&&<><Ring state={state}/><span className="sr-only">{done?', пройдено':''}</span></>}
 </Link></li>;
}

export function NavRail({chapters,pathname}:{chapters:NavChapter[];pathname:string}){
 const router=useRouter(),sections=useMemo(()=>navSections(chapters),[chapters]);
 const active=currentSection(sections,pathname);
 // Open menu and roving focus belong to a page: both reset when the route or section changes.
 const [openState,setOpenState]=useState<{path:string;id:string|null}>({path:pathname,id:null}),[completed,setCompleted]=useState<string[]>([]);
 const open=openState.path===pathname?openState.id:null,setOpen=(id:string|null)=>setOpenState({path:pathname,id});
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null),touch=useRef(false),wasOpen=useRef(false),returning=useRef(false);
 const items=useRef(new Map<string,HTMLElement>()),panels=useRef(new Map<string,HTMLDivElement>());
 // Roving tabindex: one rail item is in the tab order, arrows move between the others.
 const [roving,setRoving]=useState<{active:string|null;id:string}|null>(null);
 const focusable=roving&&roving.active===active?roving.id:active??sections[0].id,setFocusable=(id:string)=>setRoving({active,id});
 useEffect(()=>{
  const read=()=>{try{setCompleted(normalizeMarks(JSON.parse(readLocal(learningKey)??'null')).completed);}catch{setCompleted([]);}};
  read();window.addEventListener(changeEvent,read);window.addEventListener('storage',read);
  return()=>{window.removeEventListener(changeEvent,read);window.removeEventListener('storage',read);};
 },[]);
 useEffect(()=>{if(open)appear(panels.current.get(open),'--dur-2');},[open]);
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);},[]);
 const schedule=(next:string|null,delay:number)=>{if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>setOpen(next),delay);};
 const show=(id:string)=>{if(timer.current)clearTimeout(timer.current);setOpen(id);};
 // Esc returns focus to the rail item without reopening its menu.
 const close=(focusItem=false)=>{const id=open;if(timer.current)clearTimeout(timer.current);setOpen(null);if(focusItem&&id){returning.current=true;items.current.get(id)?.focus();returning.current=false;}};
 const hasMenu=(s:NavSection)=>s.id!=='home';
 const ids=sections.map(s=>s.id);
 function railKey(event:KeyboardEvent<HTMLElement>,s:NavSection){
  const at=ids.indexOf(s.id);let next:string|null=null;
  if(event.key==='ArrowDown')next=ids[(at+1)%ids.length];
  else if(event.key==='ArrowUp')next=ids[(at-1+ids.length)%ids.length];
  else if(event.key==='Home')next=ids[0];
  else if(event.key==='End')next=ids[ids.length-1];
  else if(event.key==='ArrowRight'&&hasMenu(s)){event.preventDefault();show(s.id);requestAnimationFrame(()=>panels.current.get(s.id)?.querySelector<HTMLElement>('a')?.focus());return;}
  else if(event.key==='Escape'&&open){event.preventDefault();close(true);return;}
  else if((event.key==='Enter'||event.key===' ')&&!s.href){event.preventDefault();show(s.id);return;}
  if(!next)return;
  event.preventDefault();setFocusable(next);items.current.get(next)?.focus();
 }
 function menuKey(event:KeyboardEvent<HTMLDivElement>,s:NavSection){
  const links=[...(panels.current.get(s.id)?.querySelectorAll<HTMLElement>('a')??[])],at=links.indexOf(document.activeElement as HTMLElement);
  if(event.key==='Escape'){event.preventDefault();close(true);}
  else if(event.key==='ArrowDown'&&at>-1){event.preventDefault();links[Math.min(at+1,links.length-1)].focus();}
  else if(event.key==='ArrowUp'&&at>-1){event.preventDefault();if(at===0)items.current.get(s.id)?.focus();else links[at-1].focus();}
  else if(event.key==='ArrowLeft'){event.preventDefault();items.current.get(s.id)?.focus();}
 }
 // A tap on a closed section opens its menu; the next tap follows the link. data-tap-open tells
 // the reader's link handler (Reader.tsx) to leave this click to the rail.
 // Focus arrives before click and opens the menu, so the click decides by the state at pointerdown.
 const pointerDown=(event:PointerEvent<HTMLElement>,s:NavSection)=>{wasOpen.current=open===s.id;touch.current=event.pointerType!=='mouse'&&hasMenu(s)&&!wasOpen.current;event.currentTarget.toggleAttribute('data-tap-open',touch.current);};
 const resetTap=(event:{currentTarget:HTMLElement})=>{touch.current=false;wasOpen.current=false;event.currentTarget.removeAttribute('data-tap-open');};
 return <nav className="nav-rail" aria-label="Разделы руководства" onMouseLeave={event=>{if(!event.currentTarget.contains(document.activeElement))schedule(null,closeDelay);}} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node|null))setOpen(null);}}>
  <ul className="rail-list">{sections.map(s=>{
   const expanded=open===s.id,current=active===s.id,menu=hasMenu(s);
   const common={ref:(node:HTMLElement|null)=>{if(node)items.current.set(s.id,node);else items.current.delete(s.id);},className:'rail-item',tabIndex:focusable===s.id?0:-1,
    'aria-expanded':menu?expanded:undefined,'aria-controls':menu?`mega-${s.id}`:undefined,
    onPointerCancel:resetTap,onFocus:()=>{setFocusable(s.id);if(s.href)router.prefetch(s.href);if(returning.current)return;if(menu)show(s.id);else setOpen(null);},onKeyDown:(e:KeyboardEvent<HTMLElement>)=>{resetTap(e);railKey(e,s);},
    onPointerDown:(e:PointerEvent<HTMLElement>)=>pointerDown(e,s)};
   const body=<><span className="rail-indicator"><RoleIcon role={s.icon} filled={current}/></span><span className="rail-label">{s.label}</span></>;
   return <li key={s.id} className="rail-entry" data-section={s.id} onMouseEnter={()=>{if(s.href)router.prefetch(s.href);schedule(menu?s.id:null,openDelay);}}>
    {s.href?<Link {...common} href={s.href} prefetch={false} aria-current={current?'true':undefined} onClick={event=>{event.currentTarget.removeAttribute('data-tap-open');if(touch.current){touch.current=false;event.preventDefault();show(s.id);return;}setOpen(null);}}>{body}</Link>
     :<button {...common} type="button" aria-current={current?'true':undefined} onClick={event=>{resetTap(event);show(s.id);}}>{body}</button>}
    {menu&&<div id={`mega-${s.id}`} className="mega-menu" hidden={!expanded} ref={node=>{if(node)panels.current.set(s.id,node);else panels.current.delete(s.id);}} onMouseEnter={()=>show(s.id)} onKeyDown={e=>menuKey(e,s)}>
     <div className="mega-head"><p className="mega-heading">{s.label}</p><p className="mega-description">{s.description}</p></div>
     {s.pages.length>0&&<ul className="mega-list">{s.pages.map(p=><PageLink key={p.chapter} page={p} pathname={pathname} completed={completed} onNavigate={()=>setOpen(null)}/>)}</ul>}
     {s.groups.filter(g=>g.pages.length).map(g=><div key={g.label} className="mega-group"><p className="mega-group-label">{g.label}</p><ul className="mega-list">{g.pages.map(p=><PageLink key={p.chapter} page={p} pathname={pathname} completed={completed} onNavigate={()=>setOpen(null)}/>)}</ul></div>)}
     <Progress section={s} completed={completed} onNavigate={()=>setOpen(null)}/>
     {s.links.length>0&&<ul className="mega-links">{s.links.map(l=><li key={l.href}><Link href={l.href} prefetch={false} download={l.download||undefined}>{l.label}</Link></li>)}</ul>}
    </div>}
   </li>;
  })}</ul>
 </nav>;
}

function Progress({section,completed,onNavigate}:{section:NavSection;completed:string[];onNavigate:()=>void}){
 const pages=[...section.pages,...section.groups.flatMap(g=>g.pages)].filter(p=>p.completable);
 if(!pages.length)return null;
 const done=pages.filter(p=>completed.includes(p.chapter)).length,next=pages.find(p=>!completed.includes(p.chapter));
 return <div className="mega-progress"><p><strong>{done} из {pages.length} пройдено</strong></p>
  {next?<Link href={next.href} prefetch={false} onClick={onNavigate}>Продолжить: {next.title}</Link>:<p>Раздел пройден</p>}
 </div>;
}
