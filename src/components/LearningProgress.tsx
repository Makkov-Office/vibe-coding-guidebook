"use client";
import {useCallback,useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {ProjectIcon} from './ProjectIcon';
import {readLocal,writeLocal,removeLocal,localUnavailable} from './localState';
import {learningGroups,learningLevels,learningProfile,maxLearningXp,normalizeMarks,type LearningMarks} from './learning-profile';
import './learning-profile.css';

const learningKey='handbook-learning-v2',changeEvent='handbook-learning-change';
export function LearningProgress({chapter,compact=false}:{chapter:string;compact?:boolean}){
 const [value,setValue]=useState<LearningMarks>({completed:[],exercises:[]}),[ready,setReady]=useState(false),[message,setMessage]=useState(''),[resume,setResume]=useState<{path:string;y:number}|null>(null),[reward,setReward]=useState(0);
 const current=useRef(value),profile=learningProfile(value),home=chapter==='ch-00'&&!compact,isChapter=/^ch-(0[1-9]|1\d|2[0-2])$/.test(chapter),complete=value.completed.includes(chapter);
 const save=useCallback((next:LearningMarks,earned=0)=>{const marks=normalizeMarks(next);current.current=marks;writeLocal(learningKey,JSON.stringify(marks));setValue(marks);setReward(earned);window.dispatchEvent(new CustomEvent(changeEvent,{detail:{...marks,reward:earned}}));},[]);
 useEffect(()=>{
  const frame=requestAnimationFrame(()=>{try{const marks=normalizeMarks(JSON.parse(readLocal(learningKey)??'null'));current.current=marks;setValue(marks);let reading=JSON.parse(readLocal('handbook-reading-v2')??'null');if(!reading){const old=JSON.parse(readLocal('handbook-progress')??'null');if(old?.id&&typeof old.y==='number')reading={path:old.id==='ch-23'?'/glossary':`/chapters/${old.id.slice(3)}`,y:0};}setResume(reading);}catch{setMessage('Сохранённый прогресс не удалось прочитать. Новые отметки доступны.');}setReward(0);setReady(true);});
  return()=>cancelAnimationFrame(frame);
 },[chapter]);
 useEffect(()=>{
  const sync=(event:Event)=>{const detail=(event as CustomEvent<LearningMarks&{reward?:number}>).detail;if(!detail)return;const marks=normalizeMarks(detail);current.current=marks;setValue(marks);setReward(detail.reward??0);};
  const change=(event:Event)=>{const input=event.target;if(!(input instanceof HTMLInputElement)||!/^exercise-[1-5]$/.test(input.dataset.exercise??''))return;const id=input.dataset.exercise!;if(current.current.exercises.includes(id)===input.checked)return;const exercises=current.current.exercises.filter(item=>item!==id);if(input.checked)exercises.push(id);save({...current.current,exercises},input.checked?50:0);};
  window.addEventListener(changeEvent,sync);document.addEventListener('change',change);
  return()=>{window.removeEventListener(changeEvent,sync);document.removeEventListener('change',change);};
 },[save]);
 function markChapter(){save({...current.current,completed:complete?current.current.completed.filter(id=>id!==chapter):[...current.current.completed,chapter]},complete?0:100);setMessage(complete?'Отметка главы отменена.':'Глава отмечена как изученная. +100 XP за шаг вперёд.');}
 function reset(){if(!window.confirm('Сбросить изученные главы, пять упражнений и XP? Операционные чеклисты сохранятся.'))return;save({completed:[],exercises:[]});for(let i=1;i<=5;i++)removeLocal(`practice:exercise-${i}`);document.querySelectorAll<HTMLInputElement>('[data-exercise]').forEach(input=>{input.checked=false;removeLocal(`practice:${input.dataset.practice}`);});setMessage('Учебный прогресс сброшен. Можно начать маршрут заново.');}
 const nextPath=profile.nextChapter?`/chapters/${profile.nextChapter.slice(3)}`:'/chapters/22';
 return <section className={`learning-progress learning-profile ${home?'learning-profile-home':'learning-profile-compact'}`} aria-label="Учебный прогресс">
  <div className="learning-heading"><span><ProjectIcon name="compass"/> {home?'Учебный профиль':'Ваш маршрут'}</span><strong>{value.completed.length} из 22</strong></div>
  <div className="profile-identity"><span className="profile-emblem" aria-hidden="true"><ProjectIcon name={profile.levelIndex<2?'compass':'maturity'}/></span><div><p className="profile-kicker">Уровень {profile.levelIndex+1} из 4</p><h2 className="profile-level">{profile.level.name}</h2>{home&&<p className="profile-welcome">{value.completed.length===22?'Брат, маршрут пройден. Памятка и примеры всегда под рукой.':value.completed.length===0?'Брат, начинаем с одной главы. Без гонки: свой темп тоже темп.':`Брат, уже ${value.completed.length} из 22. Следующий шаг — когда будет удобно.`}</p>}</div><span className="profile-xp"><ProjectIcon name="preflight"/><strong>{profile.xp}</strong> XP</span></div>
  {!home&&<progress value={value.completed.length} max={22} aria-label="Отмеченные главы"/>}
  {home&&<><div className="profile-level-track">
   <div className="profile-stage-track" role="progressbar" aria-label="Учебный опыт по уровням" aria-valuemin={0} aria-valuemax={maxLearningXp} aria-valuenow={profile.xp} aria-valuetext={`${profile.xp} из ${maxLearningXp} XP. Уровень ${profile.levelIndex+1}: ${profile.level.name}. Изучено ${value.completed.length} из 22 глав.`}>
    {learningLevels.map((level,i)=>{const range=(learningLevels[i+1]?.xp??maxLearningXp)-level.xp;return <span className="profile-stage" key={level.name} aria-hidden="true" style={{flexGrow:range}}><span style={{width:`${Math.min(1,Math.max(0,(profile.xp-level.xp)/range))*100}%`}}/></span>;})}
   </div>
   <ol className="profile-stage-labels" aria-label="Уровни обучения">{learningLevels.map((level,i)=><li key={level.name} className={i===profile.levelIndex?'current':i<profile.levelIndex?'reached':''} aria-current={i===profile.levelIndex?'step':undefined} style={{flexGrow:(learningLevels[i+1]?.xp??maxLearningXp)-level.xp}}><span className="stage-title"><span className="stage-number" aria-hidden="true">{i<profile.levelIndex?<ProjectIcon name="check"/>:i+1}</span><span className="stage-name">{level.name}</span></span><small>{level.xp} XP<span className="sr-only"> · {level.name}</span></small></li>)}</ol>
   <div className="profile-next-level"><span>{profile.nextLevel?`До уровня «${profile.nextLevel.name}»`:'До максимума опыта'}</span><strong>{profile.nextLevel?profile.nextLevel.xp-profile.xp:maxLearningXp-profile.xp} XP</strong></div>
  </div>
   <div className="achievement-list">{learningGroups.map(group=>{const total=group.end-group.start+1,count=value.completed.filter(id=>+id.slice(3)>=group.start&&+id.slice(3)<=group.end).length,earned=count===total;return <div key={group.start} className={`achievement profile-badge ${earned?'earned':''}`}><span className="badge-emblem"><ProjectIcon name={earned?'check':group.icon}/></span><div><strong>{group.name}</strong><small>Главы {String(group.start).padStart(2,'0')}–{group.end} · {earned?'Знак получен':`${count} из ${total}`}</small><progress value={count} max={total} aria-label={`${group.name}: ${count} из ${total} глав`}/></div></div>;})}</div>
   <div className={`profile-exercises ${value.exercises.length===5?'earned':''}`}><ProjectIcon name={value.exercises.length===5?'check':'cases'}/><div><strong>{value.exercises.length===5?'Брат в деле · знак получен':'Брат в деле'}</strong><p>Упражнения для брата: {value.exercises.length} из 5. Добровольный бонус к практике.</p></div><span className="profile-exercise-count">{value.exercises.length}/5</span></div>
   <p className="profile-rules">Глава +100 XP · упражнение +50 XP</p>
  </>}
  <div className="learning-actions">
   {home&&resume&&<Link className="resume-button primary-action" href={`${resume.path}?resume=1`}>Продолжить чтение <ProjectIcon name="arrowRight"/></Link>}
   {home&&<Link className={`profile-next ${resume?'':'primary-action'}`} href={nextPath}>{profile.nextChapter?`Следующий шаг · глава ${profile.nextChapter.slice(3)}`:'Открыть операционную памятку'}<ProjectIcon name="arrowRight"/></Link>}
   {isChapter&&<button type="button" disabled={!ready} aria-pressed={complete} className={complete?'completion-button earned':'completion-button primary-action'} onClick={markChapter}><ProjectIcon name={complete?'check':'book'}/>{complete?'Глава изучена · отменить':'Глава изучена'}</button>}
   {home&&<button className="reset-learning" type="button" disabled={!ready} onClick={reset}><ProjectIcon name="reset"/> Сбросить прогресс</button>}
  </div>
  {reward>0&&<p className="profile-reward" key={`${profile.xp}-${reward}`}><ProjectIcon name="check"/> +{reward} XP · Ещё один шаг в копилку.</p>}
  <p role="status">{message}{ready&&localUnavailable()&&<> Хранилище недоступно: отметки сохраняются до перезагрузки вкладки.</>}</p>
 </section>;
}
