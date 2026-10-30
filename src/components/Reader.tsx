"use client";
import Link from 'next/link';
import {useRouter,usePathname} from 'next/navigation';
import {useEffect,useRef,useState,useMemo,type ReactNode} from 'react';
import {ProjectIcon,ChapterIcon} from './ProjectIcon';
import {ContextPreview} from './ContextPreview';
import {NavRail} from './NavRail';
import {MobileNav} from './MobileNav';
import {Breadcrumbs} from './Breadcrumbs';
import {navSections} from '../design/nav-sections';
import {norm,readRecent,rememberPage,type GroupId} from '../design/search-groups.mjs';
import {SearchPalette,type SearchHit,type SearchPage} from './SearchPalette';
import {BrandSignature} from './BrandSignature';
import {transitionTo} from '../design/motion';
import {progressStore} from './progress-store.mjs';
import type {Chapter,SearchEntry} from '../content/types';
import {ReaderPageContext,type PageData} from './ReaderPageData';
import {liveChapter,liveRoute,movedPage,movedPages,pageHref} from '../content/chapter-routes';
type NavigationChapter=Pick<Chapter,'id'|'number'|'title'|'path'>;
const loadedSearch=new Map<string,Promise<(SearchEntry&{normalized:string})[]>>();
function fetchSearch(url:string){let promise=loadedSearch.get(url);if(!promise){promise=fetch(url).then(r=>{if(!r.ok)throw new Error('Search unavailable');return r.json() as Promise<SearchEntry[]>;}).then((entries:SearchEntry[])=>entries.map(e=>({...e,normalized:norm(e.title+' '+e.text)})));loadedSearch.set(url,promise);promise.catch(()=>loadedSearch.delete(url));}return promise;}
const groups=[['Понять систему',1,5],['Провести задачу',6,11],['Риск и интеграция',12,17],['Практика и развитие',18,21],['Инструменты',0,0],['Справочник',22,23]] as const;
const toolIds=['ch-tools','ch-codex','ch-claude-code'];
const skeletonDelay=500;
export function Reader({chapters,assets,children}:{chapters:NavigationChapter[];assets:{search:string;anchors:string};children:ReactNode}){
 const pathname=usePathname(),live=liveRoute(pathname),chapterId=live?live.chapterId:pathname==='/agents'?'agents':movedPages.find(entry=>entry.new===pathname)?.chapter??(pathname==='/resources'?'ch-resources':pathname==='/tools'?'ch-tools':pathname.startsWith('/tools/')?'ch-'+pathname.split('/').pop():pathname.startsWith('/chapters/')?'ch-'+pathname.split('/').pop():pathname.startsWith('/design/chapters/')?'ch-'+pathname.split('/')[3]:pathname==='/'?'home':'ch-00');
 const [pageData,setPageData]=useState<PageData>({chapterId:'',outline:[],hasChecklists:false,terms:[],levels:null,blocks:[]}),[searchData,setSearchData]=useState<(SearchEntry&{normalized:string})[]|null>(null),[searchState,setSearchState]=useState<'idle'|'loading'|'ready'|'error'>('idle'),[pending,setPending]=useState(false);
 // The page's address for «Недавние»: a chapter tab counts as its chapter (P5-02b).
 const here=live?pageHref(live.chapterId):pathname;
 const searchDataRef=useRef(searchData);searchDataRef.current=searchData;
 const current=useRef({pageData,chapterId,pathname,tab:live?.tab});current.current={pageData,chapterId,pathname,tab:live?.tab};
 const hasChecklists=pageData.chapterId===chapterId&&pageData.hasChecklists;
 const router=useRouter();
 // Page transition (P3-05): client navigation inside a View Transition that waits for the new page to commit, see transitionTo.
 const committed=useRef<(()=>void)|null>(null);
 const go=(href:string)=>transitionTo(()=>{committed.current?.();router.push(href);return new Promise<void>(resolve=>{committed.current=resolve;});});
 // Route skeleton without a Suspense boundary (P1-12): a slow transition swaps the old page for the skeleton until the route commits.
 const [skeletonFor,setSkeletonFor]=useState<string|null>(null),skeleton=pending&&skeletonFor===pathname;
 useEffect(()=>{if(!pending)return;const from=current.current.pathname,timer=setTimeout(()=>setSkeletonFor(from),skeletonDelay);return()=>{clearTimeout(timer);setSkeletonFor(null);};},[pending]);
 const [ready,setReady]=useState(false),[query,setQuery]=useState(''),[selected,setSelected]=useState(0),[scope,setScope]=useState<GroupId|null>(null),[status,setStatus]=useState(''),[returnTo,setReturnTo]=useState<{path:string;y:number;id:string}|null>(null);
 const readingProgress=useRef<HTMLDivElement>(null),searchNavigating=useRef(false);
 const searchRef=useRef<HTMLDialogElement>(null),inputRef=useRef<HTMLInputElement>(null),highlight=useRef<ReturnType<typeof setTimeout>|null>(null);
 const chapter=pageData.chapterId===chapterId?pageData:null;
 // Pages search can lead to by address, for quick jumps and «Недавние» (P3-03).
 const pages=useMemo(()=>{const list=new Map<string,SearchPage>(chapters.map(c=>[liveChapter(c.id)||movedPage(c.id)?pageHref(c.id):c.path,{title:c.id==='ch-23'?'Глоссарий':c.title,chapter:c.id}]));const agents=navSections(chapters).find(s=>s.id==='agents')?.href;if(agents)list.set(agents,{title:'Agent Pack',chapter:null});if(!list.has('/start/00-how-to-read'))list.set('/start/00-how-to-read',{title:'Как читать руководство',chapter:'ch-00'});return list;},[chapters]);
 const [recent,setRecent]=useState<string[]>([]);
 // Closing search returns focus to the button that opened it (rail or bottom bar), or to what had focus before a shortcut opened it (P3-07: no header button).
 const searchOpener=useRef<HTMLElement|null>(null);
 function openSearch(opener:HTMLElement|null=null){searchOpener.current=opener??(document.activeElement instanceof HTMLElement&&document.activeElement!==document.body?document.activeElement:null);setRecent(readRecent());setSelected(0);setScope(null);window.dispatchEvent(new Event('context-close'));searchRef.current?.showModal();inputRef.current?.focus();if(searchDataRef.current)return;setSearchState('loading');fetchSearch(assets.search).then(entries=>{setSearchData(entries);setSearchState('ready');},()=>setSearchState('error'));}

 function reveal(id:string){const target=document.getElementById(id);if(!target)return;if(id.startsWith('term-'))window.dispatchEvent(new CustomEvent('glossary-reveal'));target.hidden=false;let node:HTMLElement|null=target;while(node){if(node instanceof HTMLDetailsElement)node.open=true;node=node.parentElement;}requestAnimationFrame(()=>{target.scrollIntoView({block:'start',behavior:'instant'});target.tabIndex=-1;target.focus({preventScroll:true});if(id.startsWith('term-')){document.querySelectorAll('.term-arrival').forEach(n=>n.classList.remove('term-arrival'));target.classList.add('term-arrival');if(highlight.current)clearTimeout(highlight.current);highlight.current=setTimeout(()=>target.classList.remove('term-arrival'),1000);}});}
 function result(hit:SearchHit){const entry=hit.entry;searchNavigating.current=true;searchRef.current?.close();if(!entry){if(hit.href===location.pathname)searchNavigating.current=false;else {setPending(true);go(hit.href);}return;}if(entry.path===location.pathname){history.pushState(null,'',`${entry.path}#${entry.id}`);reveal(entry.id);}else {setPending(true);go(`${entry.path}#${entry.id}`);}}
 useEffect(()=>{
  setReady(true);document.documentElement.classList.add('js-enabled');
  const key=(event:KeyboardEvent)=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();openSearch();return;}
  // «/» opens search too, unless the reader is typing or another dialog is open (P3-03).
  if(event.key==='/'&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&!(event.target as HTMLElement).closest?.('input,textarea,select,[contenteditable]:not([contenteditable=false])')&&!document.querySelector('dialog[open]')){event.preventDefault();openSearch();}};
  const click=async(event:MouseEvent)=>{const node=event.target as HTMLElement,practice=node.closest<HTMLElement>('.practice-text');if(practice&&!node.closest('a,button,input,select,textarea')){practice.parentElement?.querySelector<HTMLInputElement>('input[type=checkbox]')?.click();return;}const copy=node.closest<HTMLButtonElement>('[data-copy]');if(copy){try{await navigator.clipboard.writeText(current.current.pageData.blocks.find(b=>b.id===copy.dataset.copy)?.raw??'');setStatus('Пример скопирован без изменений.');}catch{setStatus('Копирование недоступно. Выделите и скопируйте текст вручную.');}return;}const link=node.closest<HTMLAnchorElement>('a[href]');if(!link||link.classList.contains('term-link')||link.closest('.search-results')||link.hasAttribute('data-tap-open')||link.download||link.target||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||event.button!==0)return;const url=new URL(link.href);if(url.origin!==location.origin)return;if(url.pathname!==location.pathname){if(/\.[a-z0-9]+$/i.test(url.pathname))return;event.preventDefault();setPending(true);go(url.pathname+url.search+url.hash);}else if(url.hash){event.preventDefault();history.pushState(null,'',url.pathname+url.hash);reveal(decodeURIComponent(url.hash.slice(1)));}};
  const change=(event:Event)=>{const box=event.target as HTMLInputElement;if(!box.matches('[data-practice]'))return;const id=box.dataset.practice??'';if(!progressStore.set(({practice})=>{const next={...practice};if(box.checked)next[id]=true;else delete next[id];return {practice:next};}))setStatus('Хранилище недоступно: отметки сохраняются до перезагрузки вкладки.');};
  const updateProgress=()=>{const range=document.documentElement.scrollHeight-innerHeight,progress=range>0?Math.min(1,Math.max(0,scrollY/range)):1;if(readingProgress.current)readingProgress.current.style.transform='scaleX('+progress+')';};
  const size=new ResizeObserver(updateProgress);const column=document.querySelector('.reading-column');if(column)size.observe(column);window.addEventListener('resize',updateProgress);updateProgress();
  let last=0;const save=()=>{updateProgress();const id=current.current.chapterId;if(['home','ch-00','ch-23','ch-resources',...toolIds].includes(id)||current.current.pathname.startsWith('/design/')||Date.now()-last<800)return;last=Date.now();const tab=current.current.tab;progressStore.set(()=>({reading:tab?{page:id,tab,y:scrollY}:{page:id,y:scrollY}}));};
  const hash=()=>{if(location.hash)reveal(decodeURIComponent(location.hash.slice(1)));};
  document.addEventListener('keydown',key);document.addEventListener('click',click,true);document.addEventListener('change',change);window.addEventListener('hashchange',hash);window.addEventListener('scroll',save,{passive:true});
  return()=>{size.disconnect();window.removeEventListener('resize',updateProgress);document.removeEventListener('keydown',key);document.removeEventListener('click',click,true);document.removeEventListener('change',change);window.removeEventListener('hashchange',hash);window.removeEventListener('scroll',save);if(highlight.current)clearTimeout(highlight.current);};
 // Global handlers survive chapter transitions and read current page metadata through a ref.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[assets.search]);
 // close() on an already closed dialog fires no close event, so the flag is set only when it will be reset by onClose.
 // A chapter tab counts as a visit to its chapter (P5-02b).
 useEffect(()=>{if(pages.has(here))rememberPage(here);},[pages,here]);
 // After a client navigation that leaves focus nowhere (a closed menu took the focused link with it), the new page takes it.
 const shownPath=useRef(pathname);
 useEffect(()=>{if(shownPath.current===pathname)return;shownPath.current=pathname;const frame=requestAnimationFrame(()=>{if(!location.hash&&(document.activeElement===document.body||!document.activeElement))document.querySelector<HTMLElement>('main#reader')?.focus({preventScroll:true});});return()=>cancelAnimationFrame(frame);},[pathname]);
 useEffect(()=>{setStatus('');setReturnTo(null);window.dispatchEvent(new Event('context-close'));if(searchRef.current?.open){searchNavigating.current=true;searchRef.current.close();}},[pathname]);
 useEffect(()=>{
  if(pageData.chapterId!==chapterId)return;setPending(false);committed.current?.();committed.current=null;let disposed=false,frame=0;
  document.querySelectorAll<HTMLButtonElement>('[data-copy],[data-example]').forEach(button=>button.disabled=false);
  const {practice}=progressStore.get();document.querySelectorAll<HTMLInputElement>('[data-practice]').forEach(box=>box.checked=practice[box.dataset.practice??'']===true);
  let stored:{path:string;y:number;id:string}|null=null;try{stored=JSON.parse(sessionStorage.getItem('handbook-return')??'null');}catch{}
  if(chapterId==='ch-23'&&stored)setReturnTo(stored);
  const params=new URLSearchParams(location.search),hash=decodeURIComponent(location.hash.slice(1));
  if(hash==='ch-24')setStatus('Раздел об истории подготовки удалён. Учебный материал доступен в главах.');
  if(stored?.path===pathname&&Number.isFinite(stored.y)&&params.has('return')){const reading=stored;const target=document.getElementById(reading.id);let node:HTMLElement|null=target;while(node){if(node instanceof HTMLDetailsElement)node.open=true;node=node.parentElement;}frame=requestAnimationFrame(()=>{frame=requestAnimationFrame(()=>{scrollTo({top:reading.y,behavior:'instant'});target?.focus({preventScroll:true});history.replaceState(history.state,'',pathname+location.hash);try{sessionStorage.removeItem('handbook-return');}catch{}});});}
  else if(hash){if(document.getElementById(hash))reveal(hash);else fetch(assets.anchors).then(r=>r.json() as Promise<Record<string,{id:string;path:string}>>).then(registry=>{if(disposed)return;const target=registry[hash]??registry[hash.slice(0,5)];if(target)router.replace(target.path+'#'+target.id);}).catch(()=>setStatus('Не удалось восстановить старую ссылку. Выберите главу в меню.'));}
  // Resume after web fonts: a late display font (hero H1) reflows the page, and scroll anchoring would move the restored position.
  if(params.has('resume')){const saved=progressStore.get().reading;if(saved?.page===chapterId&&(live?saved.tab??'overview':saved.tab)===live?.tab)document.fonts.ready.then(()=>{if(!disposed)frame=requestAnimationFrame(()=>scrollTo({top:saved.y,behavior:'instant'}));});history.replaceState(history.state,'',pathname);}
  return()=>{disposed=true;cancelAnimationFrame(frame);};
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[pageData,chapterId,pathname]);
 // Wide blocks at the top of the page (.page-hero, .shell-wide) span the outline column as well: the outline starts below them (P3-07).
 // A sticky block (chapter tabs) is placed where it sits before sticking: after the previous block, its margin and the parent's row gap
 // (once stuck, its own box moves with the scroll).
 const shell=useRef<HTMLDivElement>(null);
 useEffect(()=>{const root=shell.current,column=root?.querySelector<HTMLElement>('.reading-column');if(!root||!column)return;
  const measure=()=>{const origin=column.getBoundingClientRect().top;let bottom=0,limit=200;
   for(const wide of column.querySelectorAll<HTMLElement>('.page-hero,.shell-wide')){if(wide.parentElement?.closest('.page-hero,.shell-wide'))continue;const style=getComputedStyle(wide),parent=wide.parentElement,previous=wide.previousElementSibling;
    const top=style.position==='sticky'?(previous?previous.getBoundingClientRect().bottom-origin:bottom)+(parent?parseFloat(getComputedStyle(parent).rowGap)||0:0)+(parseFloat(style.marginTop)||0):wide.getBoundingClientRect().top-origin;if(top>limit)break;bottom=top+wide.offsetHeight;limit=bottom+64;}
   root.style.setProperty('--outline-offset',`${Math.round(bottom)}px`);};
  // Measured in a frame, not during the commit: a forced style recalc here would start the details opening transition before reveal() focuses the target.
  const frame=requestAnimationFrame(measure),size=new ResizeObserver(measure);size.observe(column);return()=>{cancelAnimationFrame(frame);size.disconnect();};
 },[pathname,pageData]);
 // Reader navigation (header; the sidebar is shown only without JavaScript) prefetches on intent, not when links render: without loading.tsx a viewport prefetch loads the full page RSC, and listing every chapter would queue them all.
 const intentPrefetch=(href:string)=>{const warm=()=>router.prefetch(href);return {prefetch:false,onMouseEnter:warm,onFocus:warm,onTouchStart:warm};};
 // Without JavaScript this sidebar is the only navigation (no rail, no bottom bar, no header since P3-07): it starts with «Главная».
 const nav=()=><nav aria-label="Главы руководства"><Link className="orientation-link" href="/" {...intentPrefetch('/')} aria-current={chapterId==='home'?'page':undefined}><ProjectIcon name="compass"/><span>Главная</span></Link><Link className="orientation-link" href="/start/00-how-to-read" {...intentPrefetch('/start/00-how-to-read')} aria-current={chapterId==='ch-00'?'page':undefined}><ChapterIcon id="ch-00"/><span>Как читать руководство</span></Link>{groups.map(([label,start,end])=><div className="nav-group" key={start}><p>{label}</p>{chapters.filter(c=>start===0?toolIds.includes(c.id):+c.number>=start&&+c.number<=end||start===22&&c.id==='ch-resources').sort((a,b)=>a.id==='ch-23'?1:b.id==='ch-23'?-1:0).map(c=><Link key={c.id} href={c.path} {...intentPrefetch(c.path)} aria-current={chapterId===c.id?'page':undefined}><ChapterIcon id={c.id}/><span>{c.id==='ch-tools'?'Все обзоры':c.id==='ch-codex'?'Codex':c.id==='ch-claude-code'?'Claude Code':c.title.replace(/^\d{2}\.\s*/,'')}</span></Link>)}</div>)}</nav>;
 const utilities=<div className="nav-utilities"><Link className="download" href="/handbook.md" download><ProjectIcon name="download"/> Скачать Markdown</Link><Link className="download" href="/print"><ProjectIcon name="book"/> Версия для печати</Link></div>;
 return <ReaderPageContext.Provider value={setPageData}><Link className="skip-link" href="#reader">Перейти к чтению</Link><div className="reading-progress-track" aria-hidden="true"><div ref={readingProgress}/></div>
 <div ref={shell} className={`reading-shell ${pending?'navigation-pending':''}${skeleton?' navigation-skeleton':''}`}><div className="route-loading" role="status" aria-live="polite">{pending&&<><span className="loading-spinner"/> Загружаем главу…</>}</div><NavRail chapters={chapters} pathname={pathname} ready={ready} onSearch={openSearch}/><MobileNav chapters={chapters} pathname={pathname} ready={ready} onSearch={openSearch}/><aside className="sidebar">{nav()}{utilities}</aside><div className="reading-column"><Breadcrumbs chapters={chapters} pathname={pathname}/>{skeleton&&<main className="reader-skeleton" aria-busy="true" aria-label="Загрузка главы"><span className="skeleton-title"/>{Array.from({length:8},(_,i)=><span className="skeleton-line" key={i}/>)}</main>}{children}<footer className="reader-footer"><BrandSignature/>{hasChecklists&&<div className="footer-actions"><button type="button" disabled={!ready} onClick={()=>{document.querySelectorAll<HTMLInputElement>('[data-practice]:not([data-exercise])').forEach(box=>{box.checked=false;});const ids=new Set([...document.querySelectorAll<HTMLInputElement>('[data-practice]:not([data-exercise])')].map(box=>box.dataset.practice));progressStore.set(({practice})=>({practice:Object.fromEntries(Object.entries(practice).filter(([id])=>!ids.has(id)))}));setStatus('Операционные отметки на странице сброшены.');}}><ProjectIcon name="reset"/> Сбросить чеклисты</button></div>}</footer></div>{!!chapter?.outline.length&&<aside className="local-outline"><nav aria-label="Подразделы текущей главы">{chapter.outline.map(item=><Link href={`#${item.id}`} key={item.id}>{item.title}</Link>)}</nav></aside>}</div>
 {returnTo&&<Link className="return-reading" href={`${returnTo.path}?return=1#${returnTo.id}`}>Вернуться к месту чтения <ProjectIcon name="arrowLeft"/></Link>}
 <SearchPalette dialogRef={searchRef} inputRef={inputRef} query={query} onQuery={setQuery} selected={selected} onSelect={setSelected} scope={scope} onScope={setScope} data={searchData} state={searchState} pages={pages} recent={recent} here={here} onPick={result} onRetry={()=>openSearch(searchOpener.current)} onClosed={()=>{if(!searchNavigating.current){const opener=searchOpener.current;if(opener?.isConnected&&opener.checkVisibility?.()!==false)opener.focus();else document.querySelector<HTMLElement>('main#reader')?.focus({preventScroll:true});}searchNavigating.current=false;}}/>
 <ContextPreview terms={chapter?.terms??[]} levels={chapter?.levels??null} blocks={chapter?.blocks??[]}/><p role="status" className="reader-status">{status}</p><noscript><style>{`.nav-rail,.bottom-bar,.search-trigger,.local-outline,.glossary-filter,.learning-progress,[data-example]{display:none!important}.sidebar{display:block!important;position:static!important;width:auto!important;max-height:none!important}.reading-shell{display:block!important;margin:0!important}.reading-column{margin:0 auto!important}.panel-workspace,.scenarios,.scenario-result{display:none!important}.static-panel>div{display:block!important}`}</style><p className="no-js-note">JavaScript отключён. Чтение, навигация, глоссарий и текстовые схемы доступны.</p></noscript></ReaderPageContext.Provider>;
}
