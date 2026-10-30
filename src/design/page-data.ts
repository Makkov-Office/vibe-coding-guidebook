// Данные единого шаблона страницы (P3-11) из сборки контента: раздел страницы и её табы. Правило табов одно на весь
// сайт: у главы с табами — её табы (ChapterTemplate); иначе разделы страницы (h2), если их два и больше; иначе
// страницы того же раздела меню; иначе полосы нет.
import generated from '../content/generated.json';
import urlMap from '../content/url-map.json';
import type {Chapter} from '../content/types';
import {navSections} from './nav-sections';
import {outlineTabs} from './PageTemplate';
import type {PageTabsProps} from './PageTabs';

const chapters=(generated.chapters as Chapter[]).map(({id,number,title,href})=>({id,number,title,path:href}));
const sections=navSections(chapters);

/** Раздел меню, где лежит страница (Справочник показан внутри «Практики»). */
export function sectionOf(chapterId:string){
  const page=urlMap.pages.find(p=>p.chapter===chapterId&&!('alias' in p));
  const own=urlMap.sections.find(s=>s.id===page?.section);
  const rail=sections.find(s=>s.id===own?.id)??sections.find(s=>s.groups.some(g=>g.pages.some(p=>p.chapter===chapterId)));
  return {id:rail?.id??own?.id??'',label:own?.label??rail?.label??''};
}

const WORDS_PER_MINUTE=180;
/** Минуты чтения по тексту HTML: не меньше одной у непустого текста. */
export function readingMinutes(html:string){const words=html.replace(/<[^>]+>/g,' ').split(/\s+/).filter(Boolean).length;return words?Math.max(1,Math.round(words/WORDS_PER_MINUTE)):0;}

/** «02. Архитектура и источники истины: …» → «Архитектура и источники истины». */
export const shortTitle=(title:string)=>title.replace(/^\d+\.\s*/,'').split(':')[0].trim();

/** Страницы раздела меню как табы-страницы (route). */
export function sectionTabs(chapterId:string,title:string):PageTabsProps|null{
  const section=sections.find(s=>[...s.pages,...s.groups.flatMap(g=>g.pages)].some(p=>p.chapter===chapterId));
  const pages=section?[...section.pages,...section.groups.flatMap(g=>g.pages)]:[];
  if(pages.length<2)return null;
  return {mode:'route',label:`Страницы раздела «${section!.label}»`,title,current:chapterId,tabs:pages.map(p=>({id:p.chapter,label:p.number?`${p.number} · ${shortTitle(p.title)}`:shortTitle(p.title),href:p.href}))};
}

/** Табы страницы без своих табов: разделы страницы, иначе страницы раздела. */
export const pageTabs=(chapterId:string,outline:Chapter['outline'],title:string)=>outlineTabs(outline,title)??sectionTabs(chapterId,title);

/** Заголовки h2 без id получают id (prefix-N), чтобы на них вели табы-разделы; возвращает html и оглавление. */
export function anchorHeadings(html:string,prefix:string){
  const outline:Chapter['outline']=[];let n=0;
  const out=html.replace(/<h2(\s[^>]*)?>([\s\S]*?)<\/h2>/g,(all,attrs='',inner:string)=>{
    const id=/\sid="([^"]+)"/.exec(attrs)?.[1]??`${prefix}-${++n}`;
    outline.push({id,title:inner.replace(/<[^>]+>/g,'').replace(/#$/,'').trim()});
    return attrs.includes(' id=')?all:`<h2 id="${id}"${attrs}>${inner}</h2>`;
  });
  return {html:out,outline};
}
