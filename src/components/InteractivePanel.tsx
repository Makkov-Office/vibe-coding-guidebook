"use client";
import {useEffect,useRef,useState} from 'react';
import type {InteractivePanel as Panel} from '../content/types';
import {ProjectIcon} from './ProjectIcon';
import {ProductMark} from './ProductMark';
export function InteractivePanel({panel}:{panel:Panel}){
  const [selected,setSelected]=useState(0),[scenario,setScenario]=useState(0);
  const [ready,setReady]=useState(false);useEffect(()=>{const frame=requestAnimationFrame(()=>setReady(true));return()=>cancelAnimationFrame(frame);},[]);
  const detail=useRef<HTMLDivElement>(null);
  useEffect(()=>{if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;const animation=detail.current?.animate([{opacity:.35,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:260,easing:'cubic-bezier(.22,1,.36,1)'});return()=>animation?.cancel();},[selected,scenario]);
  const choice=panel.choices[selected];
  const points=[[500,36],[167,144],[500,144],[833,144],[167,252],[500,252],[833,252],[167,360],[500,360],[833,360]];
  const edges=[[0,1],[0,2],[0,3],[1,4],[2,4],[3,4],[4,5],[5,6],[6,7],[7,8],[0,8],[8,9]];
  return <div className={`interactive-panel ${panel.id}`} data-panel={panel.id}>
    <div className="panel-heading"><span className="eyebrow">{panel.label}</span><h2><ProjectIcon name={panel.id==='architecture'?'architecture':panel.id==='lifecycle'?'lifecycle':panel.id==='collisions'?'collisions':'maturity'}/> {panel.title}</h2></div>
    {panel.scenarios && <fieldset className="scenarios" disabled={!ready}><legend>Сценарий DEMO-42</legend>{panel.scenarios.map((s,i)=><label key={s.id}><input type="radio" name="lifecycle-scenario" value={s.id} checked={i===scenario} onChange={()=>setScenario(i)}/>{s.label}</label>)}</fieldset>}
    <div className="panel-workspace"><div className="map-nodes"><div className="node-list" role="group" aria-label={panel.title}>{panel.choices.map((item,i)=><button type="button" disabled={!ready} key={item.id} aria-pressed={i===selected} onClick={()=>{setSelected(i);if(panel.id==='architecture'&&matchMedia('(max-width:767px)').matches)requestAnimationFrame(()=>document.querySelector('[data-panel=architecture] .panel-detail')?.scrollIntoView({block:'nearest',behavior:'instant'}));}}><span className="node-number" aria-hidden="true">{panel.id==='architecture'&&item.label==='Linear'?<ProductMark id="linear"/>:panel.id==='architecture'&&item.label==='GitHub / CI'?<ProductMark id="github"/>:String(i+1).padStart(2,'0')}</span><span>{item.label}</span>{panel.id!=='architecture'&&i<panel.choices.length-1 && <span className="node-arrow" aria-hidden="true"><ProjectIcon name="arrowDown"/></span>}</button>)}</div>{panel.id==='architecture'&&<svg className="map-connections" viewBox="0 0 1000 396" preserveAspectRatio="none" aria-hidden="true">{edges.map(([a,b])=><path key={`${a}-${b}`} className={a===selected||b===selected?'selected-edge':''} d={`M${points[a][0]} ${points[a][1]} L${points[b][0]} ${points[b][1]}`} vectorEffect="non-scaling-stroke"/>)}</svg>}</div>
      <div className="panel-detail" ref={detail}><h3 dangerouslySetInnerHTML={{__html:choice.titleHtml??choice.label}}/><div dangerouslySetInnerHTML={{__html:choice.html}}/>
        {panel.id==='collisions' && <svg className="collision-diagram" viewBox="0 0 360 100" role="img" aria-label={['Независимые пути задач A и B','Пути сходятся в общем файле','Задача B зависит от контракта A','Противоречие требует решения владельца'][selected]}><path d={selected===0?'M30 25H330 M30 75H330':selected===1?'M30 25H140L220 50H330 M30 75H140L220 50':selected===2?'M30 25H330 M180 25V75H330':'M30 25H140L220 75H330 M30 75H140L220 25H330'} fill="none" stroke="currentColor" strokeWidth="2"/><text x="30" y="17">A</text><text x="30" y="95">B</text><circle cx="330" cy={selected===1?50:25} r="4" fill="currentColor"/><circle cx="330" cy="75" r="4" fill="currentColor"/></svg>}
        {panel.id==='architecture'&&<div className="map-evidence"><strong>Ответственный</strong><div dangerouslySetInnerHTML={{__html:choice.ownerHtml??''}}/><div dangerouslySetInnerHTML={{__html:choice.evidenceHtml??''}}/></div>}
        {choice.chapter && <a className="panel-chapter" href={choice.path}>Читать соответствующую главу <ProjectIcon name="arrowRight"/></a>}
      </div></div>
    <p className="sr-only" role="status">Выбран {choice.label}</p>
    {panel.scenarios && <div className="scenario-result" data-scenario={panel.scenarios[scenario].id} dangerouslySetInnerHTML={{__html:panel.scenarios[scenario].html}}/>}
    <details className="static-panel"><summary><ProjectIcon name="chevronRight"/> Полная текстовая карта для чтения и печати</summary>{panel.choices.map(item=><div key={item.id}><h3 dangerouslySetInnerHTML={{__html:item.titleHtml??item.label}}/><div dangerouslySetInnerHTML={{__html:item.html}}/></div>)}</details>
  </div>;
}
