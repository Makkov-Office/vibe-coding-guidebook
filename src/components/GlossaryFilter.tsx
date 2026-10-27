"use client";
import {useEffect,useState} from 'react';
import type {GlossaryLevel,GlossaryTerm} from '../content/types';
import {ProjectIcon} from './ProjectIcon';
const norm=(s:string)=>s.toLocaleLowerCase('ru').replaceAll('ё','е');
type Term=Pick<GlossaryTerm,'id'|'label'|'aliases'|'topic'|'definition'|'level'>;
export function GlossaryFilter({terms,topics,levels}:{terms:Term[];topics:string[];levels:Record<GlossaryLevel,string>|null}){
  const [query,setQuery]=useState(''),[topic,setTopic]=useState(''),[level,setLevel]=useState<GlossaryLevel|''>('');
  const matches=(term:Term,withLevel=true)=>(!topic||term.topic===topic)&&(!withLevel||!level||term.level===level)&&norm(`${term.label} ${term.aliases.join(' ')} ${term.definition}`).includes(norm(query));
  const count=terms.filter(term=>matches(term)).length;
  const [ready,setReady]=useState(false);useEffect(()=>{const frame=requestAnimationFrame(()=>setReady(true));return()=>cancelAnimationFrame(frame);},[]);
  const reset=()=>{setQuery('');setTopic('');setLevel('');};
  useEffect(()=>{const clear=()=>{setQuery('');setTopic('');setLevel('');document.querySelectorAll<HTMLElement>('.term-definition,.glossary-basics').forEach(n=>n.hidden=false);};window.addEventListener('glossary-reveal',clear);return()=>window.removeEventListener('glossary-reveal',clear);},[]);
  useEffect(()=>{
    for(const term of terms){const element=document.getElementById(term.id);if(element)element.hidden=!matches(term);}
    // A collapsed group (basic Git terms) hides when nothing in it matches and opens when a search or the basic level finds something in it.
    for(const group of document.querySelectorAll<HTMLDetailsElement>('.glossary-basics')){
      const shown=group.querySelector('.term-definition:not([hidden])')!==null;
      group.hidden=!shown;
      if(shown&&(query.trim()||level==='basic'))group.open=true;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[terms,query,topic,level]);
  const choices:[GlossaryLevel|'',string][]=levels?[['','Все'],['basic',levels.basic],['professional',levels.professional]]:[];
  return <div className="glossary-filter"><div className="filter-fields"><label>Термин<input disabled={!ready} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Например, worktree"/></label><label>Тема<span className="select-shell"><select disabled={!ready} value={topic} onChange={e=>setTopic(e.target.value)}><option value="">Все темы</option>{topics.map(t=><option key={t} value={t}>{t}</option>)}</select><ProjectIcon name="chevronDown"/></span></label></div>{choices.length>0&&<div className="level-filter" role="group" aria-labelledby="level-filter-label"><span id="level-filter-label">Уровень</span>{choices.map(([value,name])=><button key={value||'all'} type="button" disabled={!ready} aria-pressed={level===value} onClick={()=>setLevel(value)}>{name} <span className="level-count">{terms.filter(term=>(!value||term.level===value)&&matches(term,false)).length}</span></button>)}</div>}<p role="status">{count?`Найдено определений: ${count}`:'Определений не найдено. Измените запрос или сбросьте фильтр.'}</p><button type="button" disabled={!ready} onClick={reset}>Сбросить фильтр</button></div>;
}
