// Search results and suggestions (P3-03, docs/design/visual-language.md «Навигация»). The index is
// the existing public/data/search-*.json; this module only groups and orders what it finds, and
// keeps the reader's recently opened pages for the empty query.

/** @typedef {{id:string;chapter:string;title:string;type:string;text:string;path:string;level?:string}} Entry */
/** @typedef {'pages'|'terms'|'memo'|'text'} GroupId */

export const norm=(/** @type {string} */s)=>s.normalize('NFKC').toLocaleLowerCase('ru').replaceAll('ё','е');

/** Groups in display order, each with the most results it shows; short is the label of its filter chip. @type {{id:GroupId;label:string;short:string;limit:number}[]} */
export const SEARCH_GROUPS=[
 {id:'pages',label:'Страницы и разделы',short:'Страницы',limit:8},
 {id:'terms',label:'Термины глоссария',short:'Термины',limit:8},
 {id:'memo',label:'Памятка',short:'Памятка',limit:6},
 {id:'text',label:'Текст и примеры',short:'Текст',limit:18},
];
/** A group shown alone (filter chip) lists this many results. */
export const SCOPED_LIMIT=60;

/** @param {Entry} entry @returns {GroupId} */
export function groupOf(entry){
 if(entry.type==='термин')return 'terms';
 if(entry.chapter==='ch-22')return 'memo';
 if(entry.type==='заголовок')return 'pages';
 return 'text';
}

/** The line a result is named by: a heading entry carries its heading in text, the page in title. @param {Entry} entry */
export const headline=entry=>entry.type==='заголовок'?entry.text:entry.title;

/** The words of a normalized query; every one must be found, in any order. @param {string} query */
export const words=query=>query.split(/\s+/).filter(Boolean);

/**
 * Entries that contain the query, grouped; when none contains it as typed, those that contain every word of it.
 * Inside a group the headline decides first: it starts with the query, contains it, contains every word; ties keep
 * index order.
 * counts holds every match of a group, also those over its limit. A scope shows one group with SCOPED_LIMIT results.
 * @template {Entry & {normalized:string}} T
 * @param {T[]} entries
 * @param {string} query already normalized with norm()
 * @param {GroupId|null} [scope]
 */
export function groupResults(entries,query,scope=null){
 /** @type {Record<GroupId,{entry:T;score:number;index:number}[]>} */
 const found={pages:[],terms:[],memo:[],text:[]};
 const counts={pages:0,terms:0,memo:0,text:0};
 const list=words(query);
 if(!list.length)return {groups:[],more:false,counts};
 // The whole phrase wins: words in any order are a fallback for a query no entry contains as typed.
 const phrase=list.length>1&&entries.some(entry=>entry.normalized.includes(query));
 entries.forEach((entry,index)=>{
  if(phrase?!entry.normalized.includes(query):!list.every(word=>entry.normalized.includes(word)))return;
  const name=norm(headline(entry));
  const score=name.startsWith(query)?0:name.includes(query)?1:list.every(word=>name.includes(word))?2:3;
  found[groupOf(entry)].push({entry,index,score});
 });
 let more=false;
 const groups=SEARCH_GROUPS.flatMap(group=>{
  const items=found[group.id].sort((a,b)=>a.score-b.score||a.index-b.index);
  counts[group.id]=items.length;
  if(scope&&scope!==group.id)return [];
  const limit=scope?SCOPED_LIMIT:group.limit;
  if(items.length>limit)more=true;
  return items.length?[{...group,entries:items.slice(0,limit).map(item=>item.entry)}]:[];
 });
 return {groups,more,counts};
}

// A query typed in the wrong keyboard layout («кумшуц» for «review», «ыщгксу» for «source»): the same keys in the
// other layout. Search tries it only when the query itself finds nothing.
const EN='`qwertyuiop[]asdfghjkl;\'zxcvbnm,.';
const RU='ёйцукенгшщзхъфывапролджэячсмитьбю';
/** @param {string} query already normalized @returns {string} */
export function otherLayout(query){
 const cyrillic=/[а-яё]/.test(query),from=cyrillic?RU:EN,to=cyrillic?EN:RU;
 return [...query].map(char=>{const at=from.indexOf(char);return at<0?char:to[at];}).join('');
}

/** Where the words of a query occur in a text, merged and in order, for highlighting. @param {string} text @param {string} query normalized */
export function matchRanges(text,query){
 const plain=norm(text),/** @type {[number,number][]} */ranges=[];
 // NFKC and lower case keep the length of Russian and English text, so the positions match the original.
 if(plain.length!==text.length)return ranges;
 for(const word of words(query)){let at=plain.indexOf(word);while(at>=0){ranges.push([at,at+word.length]);at=plain.indexOf(word,at+word.length);}}
 ranges.sort((a,b)=>a[0]-b[0]);
 /** @type {[number,number][]} */const merged=[];
 for(const range of ranges){const last=merged.at(-1);if(last&&range[0]<=last[1])last[1]=Math.max(last[1],range[1]);else merged.push([...range]);}
 return merged;
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
