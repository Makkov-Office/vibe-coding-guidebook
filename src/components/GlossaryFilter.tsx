"use client";
import {useEffect,useState} from 'react';
import type {GlossaryTerm} from '../content/types';
import {ProjectIcon} from './ProjectIcon';
const norm=(s:string)=>s.toLocaleLowerCase('ru').replaceAll('ё','е');
export function GlossaryFilter({terms,topics}:{terms:GlossaryTerm[];topics:string[]}){
  const [query,setQuery]=useState(''),[topic,setTopic]=useState('');
  const visibleTerms=terms.filter(term=>(!topic||term.topic===topic)&&norm(`${term.label} ${term.aliases.join(' ')} ${term.definition}`).includes(norm(query)));
  const count=visibleTerms.length;
  const [ready,setReady]=useState(false);useEffect(()=>{const frame=requestAnimationFrame(()=>setReady(true));return()=>cancelAnimationFrame(frame);},[]);
  useEffect(()=>{const clear=()=>{setQuery('');setTopic('');document.querySelectorAll<HTMLElement>('.term-definition').forEach(n=>n.hidden=false);};window.addEventListener('glossary-reveal',clear);return()=>window.removeEventListener('glossary-reveal',clear);},[]);
  useEffect(()=>{for(const term of terms){const visible=(!topic||term.topic===topic)&&norm(`${term.label} ${term.aliases.join(' ')} ${term.definition}`).includes(norm(query));const element=document.getElementById(term.id);if(element)element.hidden=!visible;}},[terms,query,topic]);
  return <div className="glossary-filter"><p className="section-label"><ProjectIcon name="glossary"/><strong>Найти определение</strong></p><div className="filter-fields"><label>Термин<input disabled={!ready} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Например, worktree"/></label><label>Тема<span className="select-shell"><select disabled={!ready} value={topic} onChange={e=>setTopic(e.target.value)}><option value="">Все темы</option>{topics.map(t=><option key={t} value={t}>{t}</option>)}</select><ProjectIcon name="chevronDown"/></span></label></div><p role="status">{count?`Найдено определений: ${count}`:'Определений не найдено. Измените запрос или сбросьте фильтр.'}</p><button type="button" disabled={!ready} onClick={()=>{setQuery('');setTopic('');}}>Сбросить фильтр</button></div>;
}
