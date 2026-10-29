// Страница глоссария (раздел 23) в шаблоне «Чертежа» (P6-07c): баннер страницы (P3-07) с вводным текстом,
// под ним фильтр и темы. Copy link у тем — ChapterEnhancer шаблона, у терминов — GlossaryEnhancer (P6-07b).
import type {ReactNode} from 'react';
import type {Chapter,Handbook} from '../content/types';
import {RoleIcon} from '../design/primitives';
import {PageHero} from '../design/PageHero';
import {GlossaryVisual} from '../design/HeroVisuals';
import {ChapterEnhancer} from '../design/ChapterEnhancer';
import {GlossaryFilter} from './GlossaryFilter';
import {GlossaryEnhancer} from './GlossaryEnhancer';
import {ProjectIcon} from './ProjectIcon';
import {plural} from './plural';


export function GlossaryPage({chapter,handbook,html,tools}:{chapter:Chapter;handbook:Handbook;html:string;tools?:ReactNode}){
  // html — текст раздела с h1 и темами в h2 (как в HandbookPage). Заголовок и вводные абзацы уходят в hero
  // баннера (заголовок без старого «#»), темы — после фильтра: ChapterEnhancer берёт первый .ct-prose, в нём должны быть темы.
  const close=html.indexOf('</h1>');if(close<0)throw new Error('GlossaryPage: the glossary has no h1');
  const end=close+'</h1>'.length,topics=html.indexOf('<h2',end);
  const heading=html.slice(0,end).replace(/<a [^>]*class="permalink"[^>]*>#<\/a>/,'');
  const intro=html.slice(end,topics<0?html.length:topics),rest=topics<0?'':html.slice(topics);
  const levels=handbook.levels;
  return <section className="chapter ct glossary-page" data-chapter={chapter.id}>
    <PageHero eyebrow="Справочник" titleHtml={heading} descriptionHtml={intro} visual={<GlossaryVisual/>} actions={tools}
      meta={<ul className="page-hero__meta" aria-label="О глоссарии">
        <li><ProjectIcon name="glossary"/>{plural(handbook.terms.length,['термин','термина','терминов'])}</li>
        <li><ProjectIcon name="tags"/>{plural(handbook.topics.length,['тема','темы','тем'])}</li>
        {levels&&<li><RoleIcon role="level"/>{plural(Object.keys(levels).length,['уровень','уровня','уровней'])}</li>}
      </ul>}/>
    <GlossaryFilter terms={handbook.terms.map(({id,label,aliases,topic,definition,level})=>({id,label,aliases,topic,definition,level}))} topics={handbook.topics} levels={levels}/>
    <div className="reader-prose ct-prose" dangerouslySetInnerHTML={{__html:rest}}/>
    <GlossaryEnhancer/>
    <ChapterEnhancer key={chapter.id}/>
  </section>;
}
