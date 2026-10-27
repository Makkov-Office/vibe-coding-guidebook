// Search results and suggestions (P3-03, docs/design/visual-language.md «Навигация»). The index is
// the existing public/data/search-*.json; this module only groups and orders what it finds, and
// keeps the reader's recently opened pages for the empty query.

/** @typedef {{id:string;chapter:string;title:string;type:string;text:string;path:string;level?:string}} Entry */
/** @typedef {'pages'|'terms'|'memo'|'text'} GroupId */

export const norm=(/** @type {string} */s)=>s.normalize('NFKC').toLocaleLowerCase('ru').replaceAll('ё','е');

/** Groups in display order, each with the most results it shows. @type {{id:GroupId;label:string;limit:number}[]} */
export const SEARCH_GROUPS=[
 {id:'pages',label:'Страницы и разделы',limit:8},
 {id:'terms',label:'Термины глоссария',limit:8},
 {id:'memo',label:'Памятка',limit:6},
 {id:'text',label:'Текст и примеры',limit:18},
];

/** @param {Entry} entry @returns {GroupId} */
export function groupOf(entry){
 if(entry.type==='термин')return 'terms';
 if(entry.chapter==='ch-22')return 'memo';
 if(entry.type==='заголовок')return 'pages';
 return 'text';
}

/** The line a result is named by: a heading entry carries its heading in text, the page in title. @param {Entry} entry */
export const headline=entry=>entry.type==='заголовок'?entry.text:entry.title;

/**
 * Entries that contain the query, grouped. Inside a group a match at the start of the headline
 * comes first, then a match in the headline, then a match in the text; ties keep index order.
 * @template {Entry & {normalized:string}} T
 * @param {T[]} entries
 * @param {string} query already normalized with norm()
 */
export function groupResults(entries,query){
 /** @type {Record<GroupId,{entry:T;score:number;index:number}[]>} */
 const found={pages:[],terms:[],memo:[],text:[]};
 if(!query)return {groups:[],more:false};
 entries.forEach((entry,index)=>{
  if(!entry.normalized.includes(query))return;
  const name=norm(headline(entry));
  found[groupOf(entry)].push({entry,index,score:name.startsWith(query)?0:name.includes(query)?1:2});
 });
 let more=false;
 const groups=SEARCH_GROUPS.flatMap(group=>{
  const list=found[group.id].sort((a,b)=>a.score-b.score||a.index-b.index);
  if(list.length>group.limit)more=true;
  return list.length?[{...group,entries:list.slice(0,group.limit).map(item=>item.entry)}]:[];
 });
 return {groups,more};
}

// Recently opened pages, newest first, for the empty query. Only paths go to storage; titles come
// from the page list of the current build, so a removed page simply drops out.
export const RECENT_KEY='mae-recent';
const RECENT_LIMIT=4;
/** @type {string[]} */
let memory=[];

/** @returns {string[]} */
export function readRecent(){
 try{const stored=JSON.parse(localStorage.getItem(RECENT_KEY)??'null');if(Array.isArray(stored))memory=stored.filter(path=>typeof path==='string'&&path.startsWith('/')).slice(0,RECENT_LIMIT);}catch{}
 return memory;
}

/** @param {string} path */
export function rememberPage(path){
 memory=[path,...readRecent().filter(item=>item!==path)].slice(0,RECENT_LIMIT);
 try{localStorage.setItem(RECENT_KEY,JSON.stringify(memory));}catch{}
}
