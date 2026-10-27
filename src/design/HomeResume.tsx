"use client";
// «Продолжить» на главной (P4-01): последняя позиция чтения из progressStore (P7-01)
// с табом (P5-02b). Новичок без сохранённой позиции блок не видит.
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {progressStore} from '../components/progress-store.mjs';
import {chapterTabs,pageHref} from '../content/chapter-routes';
import {ProjectIcon} from '../components/ProjectIcon';

type Reading={page:string;tab?:string;y:number};
export function HomeResume({heading,lead,action,titles}:{heading:string;lead:string;action:string;titles:Record<string,string>}){
  const [reading,setReading]=useState<Reading|null>(null);
  useEffect(()=>{const frame=requestAnimationFrame(()=>setReading(progressStore.get().reading));return()=>cancelAnimationFrame(frame);},[]);
  if(!reading||!titles[reading.page])return null;
  const tab=chapterTabs.find(item=>item.id===reading.tab&&item.id!=='overview')?.label;
  return <section className="home-block home-resume" aria-labelledby="home-resume">
    <h2 id="home-resume">{heading}</h2>
    <p className="home-lead">{lead}</p>
    <p className="home-resume-place">{titles[reading.page]}{tab&&<> · {tab}</>}</p>
    <Link className="bp-button bp-button--fill resume-button" href={`${pageHref(reading.page,reading.tab)}?resume=1`}>{action}<ProjectIcon name="arrowRight"/></Link>
  </section>;
}
