// Страница глоссария (раздел 23) в шаблоне «Чертежа» (P6-07c): hero как у главы (P5-02), под ним вводный текст,
// фильтр и темы. Copy link у тем — ChapterEnhancer шаблона, у терминов — GlossaryEnhancer (P6-07b).
import type {ReactNode} from 'react';
import type {Chapter,Handbook} from '../content/types';
import {Annotation,RoleIcon} from '../design/primitives';
import {ChapterEnhancer} from '../design/ChapterEnhancer';
import {GlossaryFilter} from './GlossaryFilter';
import {GlossaryEnhancer} from './GlossaryEnhancer';
import {ProjectIcon} from './ProjectIcon';
import {plural} from './plural';


export function GlossaryPage({chapter,handbook,html,tools}:{chapter:Chapter;handbook:Handbook;html:string;tools?:ReactNode}){
  // html — текст раздела с h1 и темами в h2 (как в HandbookPage). Заголовок и вводные абзацы уходят в hero
  // (заголовок без старого «#»), темы — после фильтра: ChapterEnhancer берёт первый .ct-prose, в нём должны быть темы.
  const close=html.indexOf('</h1>');if(close<0)throw new Error('GlossaryPage: the glossary has no h1');
  const end=close+'</h1>'.length,topics=html.indexOf('<h2',end);
  const heading=html.slice(0,end).replace(/<a [^>]*class="permalink"[^>]*>#<\/a>/,'');
  const intro=html.slice(end,topics<0?html.length:topics),rest=topics<0?'':html.slice(topics);
  const levels=handbook.levels;
  return <section className="chapter ct glossary-page" data-chapter={chapter.id}>
    <header className="ct-hero">
      <Annotation>Справочник</Annotation>
      <div className="ct-title" dangerouslySetInnerHTML={{__html:heading}}/>
      <ul className="ct-chips" aria-label="О глоссарии">
        <li><ProjectIcon name="glossary"/>{plural(handbook.terms.length,['термин','термина','терминов'])}</li>
        <li><ProjectIcon name="tags"/>{plural(handbook.topics.length,['тема','темы','тем'])}</li>
        {levels&&<li><RoleIcon role="level"/>{plural(Object.keys(levels).length,['уровень','уровня','уровней'])}</li>}
      </ul>
      <div className="reader-prose glossary-lead" dangerouslySetInnerHTML={{__html:intro}}/>
      {tools}
    </header>
    <GlossaryFilter terms={handbook.terms.map(({id,label,aliases,topic,definition,level})=>({id,label,aliases,topic,definition,level}))} topics={handbook.topics} levels={levels}/>
    <div className="reader-prose ct-prose" dangerouslySetInnerHTML={{__html:rest}}/>
    <GlossaryEnhancer/>
    <ChapterEnhancer key={chapter.id}/>
  </section>;
}
