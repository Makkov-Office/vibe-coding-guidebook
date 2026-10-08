"use client";
import {useEffect,useState} from 'react';
import type {InteractivePanel as Panel} from '../content/types';
import {ProjectIcon} from './ProjectIcon';
export function InteractivePanel({panel}:{panel:Panel}){
  const [selected,setSelected]=useState(0),[scenario,setScenario]=useState(0);
  const [ready,setReady]=useState(false);useEffect(()=>{const frame=requestAnimationFrame(()=>setReady(true));return()=>cancelAnimationFrame(frame);},[]);
  const choice=panel.choices[selected];
  return <div className={`interactive-panel ${panel.id}`} data-panel={panel.id}>
    <div className="panel-heading"><span className="eyebrow">{panel.label}</span><h3><ProjectIcon name={panel.id==='architecture'?'architecture':panel.id==='lifecycle'?'lifecycle':panel.id==='collisions'?'collisions':'maturity'}/> {panel.title}</h3></div>
    {panel.scenarios && <fieldset className="scenarios" disabled={!ready}><legend>Сценарий DEMO-42</legend>{panel.scenarios.map((s,i)=><label key={s.id}><input type="radio" name="lifecycle-scenario" value={s.id} checked={i===scenario} onChange={()=>setScenario(i)}/>{s.label}</label>)}</fieldset>}
    <div className="panel-workspace"><div className="node-list" role="group" aria-label={panel.title}>{panel.choices.map((item,i)=><button type="button" disabled={!ready} key={item.id} aria-pressed={i===selected} onClick={()=>setSelected(i)}><span className="node-number" aria-hidden="true">{String(i+1).padStart(2,'0')}</span><span>{item.label}</span>{i<panel.choices.length-1 && <span className="node-arrow" aria-hidden="true"><ProjectIcon name="arrowDown"/></span>}</button>)}</div>
      <div className="panel-detail"><span className="eyebrow">Выбранный этап / узел</span><h4 dangerouslySetInnerHTML={{__html:choice.titleHtml??choice.label}}/><div dangerouslySetInnerHTML={{__html:choice.html}}/>
        {panel.id==='collisions' && <svg className="collision-diagram" viewBox="0 0 360 100" role="img" aria-label={['Независимые пути задач A и B','Пути сходятся в общем файле','Задача B зависит от контракта A','Противоречие требует решения владельца'][selected]}><path d={selected===0?'M30 25H330 M30 75H330':selected===1?'M30 25H140L220 50H330 M30 75H140L220 50':selected===2?'M30 25H330 M180 25V75H330':'M30 25H140L220 75H330 M30 75H140L220 25H330'} fill="none" stroke="currentColor" strokeWidth="2"/><text x="30" y="17">A</text><text x="30" y="95">B</text><circle cx="330" cy={selected===1?50:25} r="4" fill="currentColor"/><circle cx="330" cy="75" r="4" fill="currentColor"/></svg>}
        {choice.chapter && <a className="panel-chapter" href={`#${choice.chapter}`}>Читать соответствующую главу <ProjectIcon name="arrowRight"/></a>}
      </div></div>
    <p className="sr-only" role="status">Выбран {choice.label}</p>
    {panel.scenarios && <div className="scenario-result" data-scenario={panel.scenarios[scenario].id} dangerouslySetInnerHTML={{__html:panel.scenarios[scenario].html}}/>}
    <details className="static-panel"><summary><ProjectIcon name="chevronRight"/> Полная текстовая карта для чтения и печати</summary>{panel.choices.map(item=><div key={item.id}><h4 dangerouslySetInnerHTML={{__html:item.titleHtml??item.label}}/><div dangerouslySetInnerHTML={{__html:item.html}}/></div>)}</details>
  </div>;
}
