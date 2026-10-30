// Единый шаблон страницы (P3-11): баннер с визуалом раздела → табы, которые прилипают и сжимаются при прокрутке →
// тело. Так собраны все страницы чтения: главы, инструменты, справочник, Agent Pack. Страница передаёт только
// данные; каркас, отступы, прилипание и движение (каскад появления, app/motion.css) — общие. Стили — page-template.css.
import type {ReactNode} from 'react';
import {PageTabs,type PageTabsProps} from './PageTabs';
import type {Chapter} from '../content/types';

export type PageTemplateProps={
  /** Баннер: <PageHero/> или баннер главы с теми же классами .page-hero. */
  hero:ReactNode;
  /** Табы-страницы (route) или разделы страницы (anchor); меньше двух — полосы нет. */
  tabs?:PageTabsProps|null;
  className?:string;
  /** data-chapter и data-tab — по ним страницу находят Reader и тесты. */
  chapter?:string;
  tab?:string;
  children:ReactNode;
  /** После тела: соседние страницы, служебные компоненты. */
  after?:ReactNode;
};

export function PageTemplate({hero,tabs,className,chapter,tab,children,after}:PageTemplateProps){
  return <article className={['page',className].filter(Boolean).join(' ')} data-chapter={chapter} data-tab={tab}>
    {hero}
    {tabs&&tabs.tabs.length>1&&<PageTabs {...tabs}/>}
    <div className="page-body">{children}</div>
    {after}
  </article>;
}

/** «4.1. Что даёт каждый слой» → «Что даёт каждый слой»: номер раздела в табе лишний. */
const unnumbered=(title:string)=>title.replace(/^\d+(?:\.\d+)*\.?\s+/,'');

/** Табы-разделы из оглавления страницы (заголовки h2 компилятора). */
export function outlineTabs(outline:Chapter['outline'],title:string,label='Разделы страницы'):PageTabsProps|null{
  return outline.length>1?{mode:'anchor',label,title,tabs:outline.map(item=>({id:item.id,label:unnumbered(item.title),href:`#${item.id}`}))}:null;
}
