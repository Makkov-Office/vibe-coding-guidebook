"use client";
// «Продолжить» на главной (P4-01, вид — P4-06 по RD-01): последняя позиция чтения из progressStore
// (P7-01) с табом (P5-02b) и рядом тренажёр этой главы (P7-03), если он у главы есть. Новичок без
// сохранённой позиции блок не видит. Подписи — шаблоны «## Подписи» из content/home.md.
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {progressStore} from '../components/progress-store.mjs';
import {chapterTabs,pageHref} from '../content/chapter-routes';
import {ProjectIcon} from '../components/ProjectIcon';
import {fillLabel} from './home-labels';
import type {HomeContent} from '../content/types';

type Reading={page:string;tab?:string;y:number};
type Drill={title:string;text:string;minutes:number;href:string};
export function HomeResume({heading,lead,action,labels,chapters,drills}:{heading:string;lead:string;action:string;labels:HomeContent['labels'];chapters:Record<string,{title:string;section:string}>;drills:Record<string,Drill>}){
  const [reading,setReading]=useState<Reading|null>(null);
  useEffect(()=>{const frame=requestAnimationFrame(()=>setReading(progressStore.get().reading));return()=>cancelAnimationFrame(frame);},[]);
  const chapter=reading&&chapters[reading.page];
  if(!reading||!chapter)return null;
  const index=chapterTabs.findIndex(item=>item.id===reading.tab);
  const tab=index>0?chapterTabs[index]:undefined;
  const number=chapter.title.match(/^(\d{2})\.\s*/);
  const drill=drills[reading.page];
  return <section className="home-block home-resume" aria-labelledby="home-resume">
    <h2 id="home-resume">{heading}</h2>
    <div className={`home-resume-grid${drill?'':' home-resume-grid--single'}`}>
      <div className="home-resume-card">
        <div className="home-resume-text">
          <p className="home-resume-eyebrow">{[chapter.section,number&&fillLabel(labels.chapter,{n:number[1]})].filter(Boolean).join(' · ')}</p>
          <h3 className="home-resume-place">{chapter.title.replace(/^\d{2}\.\s*/,'')}</h3>
          <p className="home-resume-tab">{tab?fillLabel(labels.tab,{tab:tab.label,n:index+1,total:chapterTabs.length}):lead}</p>
          {tab&&<span className="home-resume-bar" aria-hidden="true"><i style={{width:`${(index+1)/chapterTabs.length*100}%`}}/></span>}
        </div>
        <Link className="bp-button bp-button--fill resume-button" href={`${pageHref(reading.page,reading.tab)}?resume=1`}>{action}<ProjectIcon name="arrowRight"/></Link>
      </div>
      {drill&&<Link className="home-drill" href={drill.href}>
        <span className="home-resume-eyebrow">{fillLabel(labels.drill,{minutes:drill.minutes})}</span>
        <h3>{drill.title}</h3>
        <p>{drill.text}</p>
      </Link>}
    </div>
  </section>;
}
