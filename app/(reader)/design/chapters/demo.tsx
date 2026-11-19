import type {Metadata} from 'next';
import {ChapterTemplate,tabHrefs,type TabId} from '../../../../src/design/ChapterTemplate';
import {brandTitle} from '../../../../src/design/brand';
import generated from '../../../../src/content/generated.json';

// Internal P5-02 sample: the template on chapters 07 (tables) and 08 (slice), until their /flow/… routes switch to it.
export const demoMetadata:Metadata={title:`Шаблон главы · ${brandTitle}`,robots:{index:false,follow:false}};
export const demoChapters=['07','08'];
export const demoTabs:TabId[]=['how-it-works','apply','check'];
const link=(id:string)=>{const c=generated.chapters.find(c=>c.id===id)!;return {href:c.href,label:c.title};};
// Level and template chips are a sample: the level on the brief's scale (section 2), the template from section 8.2 of chapter 08.
const meta:Record<string,{level:string;template?:string}>={'07':{level:'2 · Инженер'},'08':{level:'2 · Инженер',template:'Отчёт preflight'}};
export function ChapterDemo({number,tab}:{number:string;tab:TabId}){
  const n=Number(number);const id=(k:number)=>`ch-${String(k).padStart(2,'0')}`;
  return <ChapterTemplate chapterId={id(n)} tabId={tab} hrefs={tabHrefs(`/design/chapters/${number}`)}
    prev={link(id(n-1))} next={link(id(n+1))} meta={meta[number]}/>;
}
