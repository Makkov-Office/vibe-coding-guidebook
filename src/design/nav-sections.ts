// Navigation rail and mega-menu data (P3-01): the nine rail sections of src/content/url-map.json
// with the pages that exist in the current build. A page links to its current address; once a
// page moves to its new address, the build turns the old one into a 308 (P2-05).
import urlMap from '../content/url-map.json';
import type {iconRoles} from './icons.mjs';

export type NavChapter={id:string;number:string;title:string;path:string};
export type NavPage={chapter:string;number:string;title:string;href:string;completable:boolean};
export type NavLink={label:string;href:string;download?:boolean};
export type NavSection={id:string;label:string;icon:keyof typeof iconRoles;href:string|null;description:string;pages:NavPage[];groups:{label:string;pages:NavPage[]}[];links:NavLink[]};

const icon:Record<string,keyof typeof iconRoles>={home:'home',start:'start',base:'foundations',flow:'process',control:'control',reliability:'reliability',practice:'practice',tools:'tools',agents:'agentPack'};
const description:Record<string,string>={
 home:'Главная страница руководства',
 start:'С чего начать и как читать руководство',
 base:'Как устроена система вокруг агента',
 flow:'Путь задачи от тикета до merge',
 control:'Риск, параллельная работа и проверка',
 reliability:'Безопасность, ошибки и восстановление',
 practice:'Внедрение системы, зрелость и справочник',
 tools:'Claude Code, Codex и полезные материалы',
 agents:'Правила руководства для твоего агента: архив, llms.txt и Markdown каждой страницы.',
};
// Sections outside the rail are shown inside a rail section's menu.
const hosted:Record<string,{host:string;label:string}>={reference:{host:'practice',label:'Справочник'}};
const extraLinks:Record<string,NavLink[]>={
 tools:[{label:'Скачать Markdown',href:'/handbook.md',download:true},{label:'Версия для печати',href:'/print'}],
 agents:[{label:'Что внутри и как подключить',href:'/agents'},{label:'Скачать Agent Pack (.zip)',href:'/agent-pack.zip',download:true},{label:'llms.txt — карта для LLM',href:'/llms.txt'}],
};

export const completable=(id:string)=>/^ch-(0[1-9]|1\d|2[0-2])$/.test(id);

function pages(section:string,chapters:Map<string,NavChapter>):NavPage[]{
 const seen=new Set<string>();
 return urlMap.pages.filter(page=>page.section===section&&page.chapter).flatMap(page=>{
  const chapter=chapters.get(page.chapter!);
  if(!chapter||seen.has(chapter.id))return [];
  seen.add(chapter.id);
  return [{chapter:chapter.id,number:/^ch-(0\d|1\d|2[0-2])$/.test(chapter.id)?chapter.number:'',title:chapter.title.replace(/^\d{2}\.\s*/,''),href:chapter.path,completable:completable(chapter.id)}];
 });
}

export function navSections(list:NavChapter[]):NavSection[]{
 const chapters=new Map(list.map(chapter=>[chapter.id,chapter]));
 // The introduction (ch-00) lives at "/" and is not in the chapter list.
 if(!chapters.has('ch-00'))chapters.set('ch-00',{id:'ch-00',number:'00',title:'Как читать руководство',path:'/'});
 return urlMap.sections.filter(section=>section.rail).map(section=>{
  const own=section.id==='home'?[]:pages(section.id,chapters);
  const groups=Object.entries(hosted).filter(([,h])=>h.host===section.id).map(([id,h])=>({label:h.label,pages:pages(id,chapters)}));
  // A section without chapters (Agent Pack) leads to its own page from the URL map.
  const href=section.id==='home'?'/':own[0]?.href??urlMap.pages.find(page=>page.section===section.id&&!page.chapter)?.new??null;
  return {id:section.id,label:section.label,icon:icon[section.id],href,description:description[section.id]??'',pages:own,groups,links:extraLinks[section.id]??[]};
 });
}

/** A page or one of its tabs (P5: /flow/08-preflight/apply belongs to /flow/08-preflight). Only tab
 *  segments of url-map count: /tools/codex is its own page, not a tab of /tools. */
const tabSegments=urlMap.tabs.map(tab=>tab.segment).filter(Boolean);
export const onPage=(href:string,pathname:string)=>pathname===href||href!=='/'&&tabSegments.some(segment=>pathname===`${href}/${segment}`);

/** The rail section of a pathname: home for "/", otherwise the section that lists the page. */
export function currentSection(sections:NavSection[],pathname:string):string|null{
 if(pathname==='/')return 'home';
 return sections.find(s=>s.href===pathname)?.id??sections.find(s=>[...s.pages,...s.groups.flatMap(g=>g.pages)].some(p=>onPage(p.href,pathname)))?.id??null;
}
