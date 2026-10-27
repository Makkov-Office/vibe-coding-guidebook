"use client";
import {useEffect,useRef,useState} from 'react';
import {Button,ButtonLink,Pill,ProgressDots} from '../design/primitives';
import {progressStore} from './progress-store.mjs';
import type {Drill} from '../content/types';
// Drill of a chapter (P7-03, brief 10.3): one card at a time, instant feedback with a link
// to the chapter paragraph, a result with the next step. The best result goes to ProgressStore.
// A drill counts as passed from 80% of the cards (brief 10.4).
export const PASS_SHARE=0.8;
type Phase='intro'|'card'|'result';
export function DrillPlayer({drill,next}:{drill:Drill;next?:{href:string;label:string}}){
 const total=drill.cards.length;
 const [phase,setPhase]=useState<Phase>('intro'),[index,setIndex]=useState(0),[chosen,setChosen]=useState<string|null>(null),[missed,setMissed]=useState<string[]>([]);
 const [best,setBest]=useState<number|null>(null),[ready,setReady]=useState(false),[saved,setSaved]=useState(true);
 const heading=useRef<HTMLHeadingElement>(null),actions=useRef<HTMLDivElement>(null);
 useEffect(()=>{const frame=requestAnimationFrame(()=>{setBest(progressStore.get().drills[drill.id]?.best??null);setReady(true);});return()=>cancelAnimationFrame(frame);},[drill.id]);
 // Focus follows the step: the new card or result heading, the «Дальше» button after an answer.
 useEffect(()=>{if(ready&&phase!=='intro'&&chosen===null)heading.current?.focus();},[phase,index,chosen,ready]);
 useEffect(()=>{if(chosen!==null)actions.current?.querySelector('button')?.focus();},[chosen]);
 const card=drill.cards[index];
 const start=()=>{setIndex(0);setChosen(null);setMissed([]);setPhase('card');};
 const answer=(option:string)=>{if(chosen!==null)return;setChosen(option);if(option!==card.answer)setMissed(list=>[...list,card.id]);};
 const advance=()=>{
  if(index<total-1){setIndex(index+1);setChosen(null);return;}
  const score=total-missed.length;
  const ok=progressStore.set(({drills})=>{const previous=drills[drill.id]?.best??-1;return previous>=score?{}:{drills:{...drills,[drill.id]:{best:score,total}}};});
  setSaved(ok);setBest(value=>Math.max(value??0,score));setChosen(null);setPhase('result');
 };
 const label=(id:string)=>card.options.find(option=>option.id===id)?.label??id;
 if(phase==='intro')return <section className="drill" aria-labelledby={`${drill.id}-title`}>
  <div className="drill-meta"><Pill meaning="practice">Тренажёр</Pill><span>{drill.minutes} мин · {total} ситуаций</span></div>
  <h2 id={`${drill.id}-title`}>{drill.title}</h2>
  <p className="drill-intro">{drill.intro}</p>
  {best!==null&&<p className="drill-best">Лучший результат: {best} из {total}{best>=Math.ceil(total*PASS_SHARE)?' · навык засчитан':''}</p>}
  <Button onClick={start} disabled={!ready} icon="tabCheck">{best===null?'Начать':'Пройти ещё раз'}</Button>
 </section>;
 if(phase==='result'){
  const score=total-missed.length,passed=score>=Math.ceil(total*PASS_SHARE);
  return <section className="drill" aria-labelledby={`${drill.id}-result`}>
   <div className="drill-meta"><Pill meaning={passed?'practice':'human'}>{passed?'Навык засчитан':'Ещё не засчитан'}</Pill><span>Лучший результат: {best} из {total}</span></div>
   <h2 id={`${drill.id}-result`} ref={heading} tabIndex={-1}>Результат: {score} из {total}</h2>
   <p className="drill-intro">{passed?'Можно идти дальше.':`Чтобы навык засчитался, нужно не меньше ${Math.ceil(total*PASS_SHARE)} верных ответов. Перечитай отмеченные места и попробуй снова.`}</p>
   {missed.length>0&&<><h3>Что перечитать</h3><ul className="drill-missed">{drill.cards.filter(item=>missed.includes(item.id)).map(item=><li key={item.id}><a href={item.href}>{item.scenario.split(/(?<=[.:])\s/)[0]}</a></li>)}</ul></>}
   {!saved&&<p className="drill-note" role="status">Хранилище недоступно: результат сохранится только до перезагрузки вкладки.</p>}
   <div className="drill-actions"><Button variant="tonal" onClick={start}>Пройти ещё раз</Button>{next&&<ButtonLink href={next.href} icon="tabOverview">Дальше: {next.label}</ButtonLink>}</div>
  </section>;
 }
 const right=chosen!==null&&chosen===card.answer;
 return <section className="drill" aria-labelledby={`${drill.id}-card`}>
  <div className="drill-meta"><span>Ситуация {index+1} из {total}</span><ProgressDots total={total} current={index} label={`Ситуация ${index+1} из ${total}`}/></div>
  <h2 id={`${drill.id}-card`} ref={heading} tabIndex={-1} className="drill-scenario">{card.scenario}</h2>
  <fieldset className="drill-options" aria-describedby={chosen!==null?`${drill.id}-feedback`:undefined}>
   <legend>{card.question}</legend>
   {card.options.map(option=>{const state=chosen===null?undefined:option.id===card.answer?'right':option.id===chosen?'wrong':'idle';
    return <button key={option.id} type="button" className="drill-option" data-state={state} aria-pressed={chosen===option.id} disabled={chosen!==null&&option.id!==chosen&&option.id!==card.answer} aria-disabled={chosen!==null} onClick={()=>answer(option.id)}>
     <span>{option.label}</span>{state==='right'&&<span className="drill-mark">Верный ответ</span>}{state==='wrong'&&<span className="drill-mark">Твой ответ</span>}
    </button>;})}
  </fieldset>
  <div id={`${drill.id}-feedback`} className="drill-feedback" role="status" data-state={chosen===null?undefined:right?'right':'wrong'}>
   {chosen!==null&&<><p><strong>{right?'Верно.':`Неверно. Правильный ответ: ${label(card.answer)}.`}</strong> {card.explanation}</p><a href={card.href}>Перечитать в главе</a></>}
  </div>
  {chosen!==null&&<div className="drill-actions" ref={actions}><Button onClick={advance}>{index<total-1?'Следующая ситуация':'Посмотреть результат'}</Button></div>}
 </section>;
}

// Without JavaScript: every card with its answer under a disclosure.
export function DrillStatic({drill}:{drill:Drill}){
 return <section className="drill drill-static" aria-label={drill.title}>
  <h2>{drill.title}</h2><p className="drill-intro">{drill.intro}</p>
  <ol>{drill.cards.map(card=><li key={card.id}><p>{card.scenario}</p><p><strong>{card.question}</strong> {card.options.map(option=>option.label).join(' / ')}</p><details><summary>Ответ</summary><p>{card.options.find(option=>option.id===card.answer)?.label}. {card.explanation} <a href={card.href}>Перечитать в главе</a></p></details></li>)}</ol>
 </section>;
}
