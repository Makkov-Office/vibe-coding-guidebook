import type {Metadata} from 'next';
import {ChapterTemplate,tabHrefs,type TabId} from '../../../../src/design/ChapterTemplate';
import {brandTitle} from '../../../../src/design/brand';
import generated from '../../../../src/content/generated.json';

// Служебный образец P5-02: шаблон на главах 07 (таблицы) и 08 (срез), пока их маршруты /flow/… не перешли на него.
export const demoMetadata:Metadata={title:`Шаблон главы · ${brandTitle}`,robots:{index:false,follow:false}};
export const demoChapters=['07','08'];
export const demoTabs:TabId[]=['how-it-works','apply','check'];
const link=(id:string)=>{const c=generated.chapters.find(c=>c.id===id)!;return {href:c.path,label:c.title};};
// Чипы уровня и шаблона — образец: уровень по шкале брифа (раздел 2), шаблон — раздел 8.2 главы 08.
const meta:Record<string,{level:string;template?:string}>={'07':{level:'2 · Инженер'},'08':{level:'2 · Инженер',template:'Отчёт preflight'}};
export function ChapterDemo({number,tab}:{number:string;tab:TabId}){
  const n=Number(number);const id=(k:number)=>`ch-${String(k).padStart(2,'0')}`;
  return <ChapterTemplate chapterId={id(n)} tabId={tab} hrefs={tabHrefs(`/design/chapters/${number}`)}
    prev={link(id(n-1))} next={link(id(n+1))} meta={meta[number]}/>;
}
