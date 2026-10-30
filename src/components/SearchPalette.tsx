"use client";
import Link from 'next/link';
import {useEffect,useMemo,type ReactNode,type RefObject} from 'react';
import {ProjectIcon,ChapterIcon} from './ProjectIcon';
import {RoleIcon} from './RoleIcon';
import {plural} from './plural';
import {norm,groupResults,headline,otherLayout,matchRanges,SEARCH_GROUPS,type GroupId} from '../design/search-groups.mjs';
import urlMap from '../content/url-map.json';
import {pageHref} from '../content/chapter-routes';
import type {SearchEntry} from '../content/types';
import '../design/search-palette.css';

// Search as a command palette (P3-03, redesign after founder feedback 30.10.2026): one input, results grouped
// with icons, quick jumps and recent pages for the empty query, filter chips, keyboard hints in the footer.
// Reader owns the state and the navigation; this component builds the options and draws the dialog.

export type SearchHit={key:string;href:string;query?:string;title:string;text?:ReactNode;meta?:string;icon:ReactNode;entry?:SearchEntry};
export type SearchPage={title:string;chapter:string|null};
type Indexed=SearchEntry&{normalized:string};

// Topics readers come back to; each finds pages, terms and text (tests/browser/search.spec.ts).
const POPULAR=['preflight','worktree','источники истины','independent review'];
const toolIds=['ch-tools','ch-codex','ch-claude-code'];
const tabLabel=new Map(urlMap.tabs.map(tab=>[tab.id,tab.label]));
const place=(entry:SearchEntry)=>{const c=entry.chapter;const name=toolIds.includes(c)?'Инструменты':c==='ch-resources'?'Материалы':c==='ch-00'?'Начало':c==='ch-23'?'Глоссарий':c==='ch-22'?'Памятка':`Глава ${c.slice(3)}`;return entry.tab&&entry.tab!=='overview'?`${name} · ${tabLabel.get(entry.tab)}`:name;};
const typeIcon:Record<string,Parameters<typeof ProjectIcon>[0]['name']>={'пример':'terminal','схема':'architecture','материал':'sources','термин':'glossary'};
function entryIcon(entry:SearchEntry,group:GroupId){if(group==='pages')return <ChapterIcon id={entry.chapter}/>;if(group==='memo')return <ProjectIcon name="notes"/>;return <ProjectIcon name={typeIcon[entry.type]??'docs'}/>;}

/** The text with every word of the query marked; a long text is cut around the first match. */
function Mark({text,query,around=false}:{text:string;query:string;around?:boolean}){
 const ranges=matchRanges(text,query);let start=0,end=text.length;
 if(around){const first=ranges[0]?.[0]??0;start=first>60?text.lastIndexOf(' ',first-40)+1:0;end=Math.min(text.length,start+220);}
 const parts:ReactNode[]=[];let at=start;
 for(const [from,to] of ranges){if(to<=start||from>=end)continue;const a=Math.max(from,start),b=Math.min(to,end);if(a>at)parts.push(text.slice(at,a));parts.push(<mark key={a}>{text.slice(a,b)}</mark>);at=b;}
 if(at<end)parts.push(text.slice(at,end));
 return <>{start>0?'…':''}{parts}{end<text.length?'…':''}</>;
}

type Props={
 dialogRef:RefObject<HTMLDialogElement|null>;inputRef:RefObject<HTMLInputElement|null>;
 query:string;onQuery:(query:string)=>void;selected:number;onSelect:(index:number|((index:number)=>number))=>void;
 scope:GroupId|null;onScope:(scope:GroupId|null)=>void;
 data:Indexed[]|null;state:'idle'|'loading'|'ready'|'error';
 pages:Map<string,SearchPage>;recent:string[];here:string;
 onPick:(hit:SearchHit)=>void;onRetry:()=>void;onClosed:()=>void;
};

export function SearchPalette({dialogRef,inputRef,query,onQuery,selected,onSelect,scope,onScope,data,state,pages,recent,here,onPick,onRetry,onClosed}:Props){
 const typed=norm(query.trim());
 // A query in the wrong keyboard layout is searched again in the other one when it finds nothing.
 const search=useMemo(()=>{
  const direct=groupResults(data??[],typed,scope);
  if(!typed||direct.groups.length||Object.values(direct.counts).some(Boolean))return {...direct,query:typed,swapped:false};
  const other=otherLayout(typed),again=groupResults(data??[],other,scope);
  return Object.values(again.counts).some(Boolean)?{...again,query:other,swapped:true}:{...direct,query:typed,swapped:false};
 },[data,typed,scope]);
 const total=Object.values(search.counts).reduce((a,b)=>a+b,0);

 // Empty query: quick jumps and the pages opened last on this device.
 const suggestions=useMemo(()=>{
  const quick:[string,string,string,ReactNode][]=[
   [pageHref('ch-23'),'Глоссарий','Все термины руководства',<ProjectIcon key="i" name="glossary"/>],
   [pageHref('ch-22'),'Операционная памятка','Короткие правила на каждый день',<ProjectIcon key="i" name="notes"/>],
   ['/start/00-how-to-read','Как читать руководство','С чего начать и в каком порядке',<RoleIcon key="i" role="start"/>],
   ['/tools','Инструменты','Обзоры Claude Code и Codex',<RoleIcon key="i" role="tools"/>],
   ['/agents','Agent Pack','Правила руководства для твоего агента',<RoleIcon key="i" role="agentPack"/>],
  ];
  const fixed=quick.filter(([href])=>pages.has(href)&&href!==here).map(([href,title,text,icon]):SearchHit=>({key:`quick-${href}`,href,title,text,icon}));
  const visited=recent.filter(href=>pages.has(href)&&href!==here).map((href):SearchHit=>{const page=pages.get(href)!;return {key:`recent-${href}`,href,title:page.title,icon:page.chapter?<ChapterIcon id={page.chapter}/>:<ProjectIcon name="docs"/>,meta:'Недавно'};});
  // A popular query fills the input instead of opening a page.
  const popular=data===null&&state==='error'?[]:POPULAR.map((text):SearchHit=>({key:`query-${text}`,href:`#${text}`,query:text,title:text,icon:<ProjectIcon name="search"/>}));
  return [{id:'quick',label:'Быстрый переход',hits:fixed},{id:'recent',label:'Недавние страницы',hits:visited},{id:'popular',label:'Часто ищут',hits:popular}].filter(group=>group.hits.length);
 },[pages,recent,here,data,state]);

 const groups=typed?search.groups.map(group=>({id:group.id,label:group.label,hits:group.entries.map((entry):SearchHit=>{
  const heading=entry.type==='заголовок',name=headline(entry);
  const text=heading?(entry.text===entry.title?undefined:entry.title):<Mark text={entry.text} query={search.query} around/>;
  return {key:entry.id,href:`${entry.path}#${entry.id}`,title:name,text,meta:[place(entry),entry.level].filter(Boolean).join(' · '),icon:entryIcon(entry,group.id),entry};
 })})):suggestions;
 const results=groups.flatMap(group=>group.hits);
 const active=Math.min(selected,Math.max(0,results.length-1));

 useEffect(()=>{document.getElementById(`search-result-${active}`)?.scrollIntoView({block:'nearest'});},[active,query,scope]);

 function key(event:React.KeyboardEvent<HTMLInputElement>){
  const move=(step:number)=>{event.preventDefault();onSelect(i=>results.length?(Math.min(i,results.length-1)+step+results.length)%results.length:0);};
  if(event.key==='ArrowDown')move(1);
  else if(event.key==='ArrowUp')move(-1);
  else if(event.key==='Home'&&event.ctrlKey){event.preventDefault();onSelect(0);}
  else if(event.key==='End'&&event.ctrlKey){event.preventDefault();onSelect(Math.max(0,results.length-1));}
  else if(event.key==='Enter'&&results[active]){event.preventDefault();pick(results[active]);}
 }
 function pick(hit:SearchHit){if(hit.query===undefined){onPick(hit);return;}onQuery(hit.query);onScope(null);onSelect(0);inputRef.current?.focus();}
 function dismiss(event:React.MouseEvent<HTMLDialogElement>){if(event.target!==event.currentTarget)return;const r=event.currentTarget.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)event.currentTarget.close();}
 const chips=typed&&state==='ready'&&total>0;
 const status=state==='error'?null:typed&&state==='ready'?(total?`${plural(total,['результат','результата','результатов'])}`:''):'';

 return <dialog ref={dialogRef} onClick={dismiss} className="search-dialog" aria-labelledby="search-title" onClose={onClosed}>
  <h2 id="search-title" className="sr-only">Поиск по руководству</h2>
  <div className="cmdk-field">
   <ProjectIcon name="search"/>
   <label htmlFor="handbook-search" className="sr-only">Термин, фраза или текст примера</label>
   <input id="handbook-search" ref={inputRef} type="text" role="combobox" aria-autocomplete="list" aria-expanded={results.length>0} aria-controls="search-results" aria-activedescendant={results[active]?`search-result-${active}`:undefined} autoComplete="off" autoCorrect="off" spellCheck={false} enterKeyHint="go" value={query} placeholder="Глава, термин или пример" onChange={e=>{onQuery(e.target.value);onSelect(0);onScope(null);}} onKeyDown={key}/>
   {query&&<button type="button" className="cmdk-icon-button" aria-label="Очистить поиск" onClick={()=>{onQuery('');onScope(null);onSelect(0);inputRef.current?.focus();}}><ProjectIcon name="close"/></button>}
   <button type="button" className="cmdk-close" aria-label="Закрыть поиск" onClick={()=>dialogRef.current?.close()}><kbd>Esc</kbd><span className="cmdk-close-text">Закрыть</span></button>
  </div>
  {chips&&<div className="cmdk-scopes" role="group" aria-label="Показать в результатах">
   {[{id:null,short:'Все',count:total},...SEARCH_GROUPS.map(group=>({id:group.id,short:group.short,count:search.counts[group.id]}))].filter(item=>item.id===null||item.count>0||item.id===scope).map(item=><button key={item.id??'all'} type="button" className="cmdk-scope bp-chip" aria-pressed={scope===item.id} onClick={()=>{onScope(item.id);onSelect(0);inputRef.current?.focus();}}>{item.short}<span className="cmdk-scope-count">{item.count}</span></button>)}
  </div>}
  <div className="cmdk-body">
   {/* Status messages stay outside the listbox: it holds only options (P3-03). Suggestions need no index, so they show even when it failed to load. */}
   {state==='error'?<div role="status" className="search-state"><p>Поиск не загрузился.</p><button type="button" className="cmdk-retry" onClick={onRetry}>Повторить</button></div>
   :typed&&(state==='loading'||state==='idle')?<div className="search-state search-loading" role="status"><span className="loading-spinner"/> Загружаем поиск…</div>
   :typed&&state==='ready'&&!results.length?<div className="search-state cmdk-empty" role="status"><span className="cmdk-empty-icon"><ProjectIcon name="search"/></span><p><strong>Ничего не найдено по «{query.trim()}»</strong></p><p>Проверьте написание или попробуйте термин на английском, например review.</p></div>
   :search.swapped&&typed?<p className="search-state cmdk-swapped" role="status">Показаны результаты для «{search.query}»: запрос набран в другой раскладке.</p>:null}
   {results.length>0&&<div id="search-results" role="listbox" aria-label={typed?'Результаты поиска':'Подсказки'} className="search-results">{groups.map(group=><div key={group.id} role="group" aria-label={group.label} className="search-group"><div className="search-group-label" aria-hidden="true">{group.label}</div>{group.hits.map(hit=>{const i=results.indexOf(hit);const props={id:`search-result-${i}`,role:'option','aria-selected':i===active,tabIndex:-1,className:`cmdk-item${i===active?' selected':''}`,onMouseMove:()=>{if(i!==active)onSelect(i);},onClick:(event:React.MouseEvent)=>{event.preventDefault();pick(hit);}};const body=<>
    <span className="cmdk-item-icon">{hit.icon}</span>
    <span className="cmdk-item-main"><strong className="cmdk-item-title">{typed?<Mark text={hit.title} query={search.query}/>:hit.title}</strong>{hit.text&&<span className="cmdk-item-text">{hit.text}</span>}</span>
    {hit.meta&&<span className="result-meta">{hit.meta}</span>}
    <span className="cmdk-item-enter" aria-hidden="true"><ProjectIcon name={hit.query===undefined?'arrowRight':'search'}/></span>
   </>;
   // A popular query is not a page: an option without an address.
   return hit.query===undefined?<Link key={hit.key} href={hit.href} {...props}>{body}</Link>:<div key={hit.key} {...props}>{body}</div>;})}</div>)}</div>}
  </div>
  <div className="cmdk-footer">
   <span className="cmdk-hints" aria-hidden="true"><span><kbd>↑</kbd><kbd>↓</kbd> выбрать</span><span><kbd>↵</kbd> открыть</span><span><kbd>Esc</kbd> закрыть</span></span>
   <p className="search-count" role="status">{status}{status&&search.more&&!scope?', показаны лучшие':''}</p>
  </div>
 </dialog>;
}
