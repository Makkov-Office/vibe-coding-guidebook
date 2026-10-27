// ProgressStore (P7-01): all reader progress in one versioned record under
// one localStorage key. Ids are the stable page and tab ids of
// src/content/url-map.json (`chapter`, `tabs[].id`), not addresses, so moved
// pages keep their marks. Works without storage: the record then lives in
// memory until the tab is reloaded.

export const PROGRESS_KEY='mae-progress';
export const PROGRESS_VERSION=2;
// Keys of the v1 format (before P7-01). Read once by the migration, never
// written again; they stay in place so a rollback still finds the old marks.
export const LEGACY_KEYS={learning:'handbook-learning-v2',reading:'handbook-reading-v2',position:'handbook-progress',practice:'practice:'};

const CHAPTER=/^ch-(0[1-9]|1\d|2[0-2])$/;
const PAGE=/^ch-(0[1-9]|1\d|2[0-3])$/;
const EXERCISE=/^exercise-[1-5]$/;
const PRACTICE=/^[\p{L}\p{N}_-]{1,120}$/u;
export const TABS=['overview','how-it-works','apply','check'];

const unique=(list,pattern)=>[...new Set((Array.isArray(list)?list:[]).filter(id=>typeof id==='string'&&pattern.test(id)))];
const empty=()=>({version:PROGRESS_VERSION,completed:[],exercises:[],practice:{},reading:null});

/** @param {unknown} value */
function normalizeReading(value){
  if(!value||typeof value!=='object')return null;
  const {page,tab,y}=/** @type {Record<string,unknown>} */(value);
  if(typeof page!=='string'||!PAGE.test(page))return null;
  const reading={page,y:typeof y==='number'&&Number.isFinite(y)&&y>=0?Math.round(y):0};
  if(typeof tab==='string'&&TABS.includes(tab))reading.tab=tab;
  return reading;
}

/**
 * @typedef {{page:string,tab?:string,y:number}} Reading
 * @typedef {{version:number,completed:string[],exercises:string[],practice:Record<string,true>,reading:Reading|null}} Progress
 * @param {unknown} value
 * @returns {Progress}
 */
export function normalizeProgress(value){
  const source=value&&typeof value==='object'?/** @type {Record<string,any>} */(value):{};
  const practice={};
  if(source.practice&&typeof source.practice==='object')for(const [id,done] of Object.entries(source.practice))if(done===true&&PRACTICE.test(id))practice[id]=true;
  return {version:PROGRESS_VERSION,completed:unique(source.completed,CHAPTER),exercises:unique(source.exercises,EXERCISE),practice,reading:normalizeReading(source.reading)};
}

/** Same marks as learning-profile normalizeMarks: chapters 01–22 and exercises 1–5. */
export const normalizeMarks=value=>{const {completed,exercises}=normalizeProgress(value);return {completed,exercises};};

/**
 * v1 → v2. `read(key)` returns the stored string or null, `keys` lists the
 * stored keys. Each part is read on its own: a damaged one is skipped, the
 * rest is kept. Returns the record and whether any part was damaged.
 * @param {(key:string)=>string|null} read
 * @param {string[]} keys
 */
export function migrateLegacy(read,keys){
  const progress=empty();let damaged=false;
  const json=key=>{const text=read(key);if(text==null)return null;try{return JSON.parse(text);}catch{damaged=true;return null;}};
  const marks=normalizeMarks(json(LEGACY_KEYS.learning));progress.completed=marks.completed;progress.exercises=marks.exercises;
  const reading=json(LEGACY_KEYS.reading);
  if(reading&&typeof reading==='object'){
    // v1 kept {path,y,id}; id is the chapter, path its address.
    const page=typeof reading.id==='string'?reading.id:typeof reading.path==='string'?(reading.path==='/glossary'?'ch-23':`ch-${reading.path.split('/').pop()}`):'';
    progress.reading=normalizeReading({page,y:reading.y});
  }
  if(!progress.reading){
    // Oldest format: {id,y}; it reopened the chapter at the top.
    const position=json(LEGACY_KEYS.position);
    if(position&&typeof position.id==='string'&&typeof position.y==='number')progress.reading=normalizeReading({page:position.id,y:0});
  }
  for(const key of keys)if(key.startsWith(LEGACY_KEYS.practice)&&read(key)==='1'){const id=key.slice(LEGACY_KEYS.practice.length);if(PRACTICE.test(id))progress.practice[id]=true;}
  return {progress,damaged};
}

/**
 * @typedef {{getItem(key:string):string|null,setItem(key:string,value:string):void,keys():string[]}} ProgressStorage
 * @param {()=>ProgressStorage|null} storage  may throw or return null when storage is unavailable
 */
export function createProgressStore(storage){
  /** @type {Progress|null} */let state=null;let unavailable=false,damaged=false;
  /** @type {Set<(progress:Progress,meta?:{reward?:number})=>void>} */const listeners=new Set();
  const attempt=(action,fallback)=>{try{const target=storage();if(!target)throw Error('no storage');return action(target);}catch{unavailable=true;return fallback;}};
  const write=progress=>attempt(target=>{target.setItem(PROGRESS_KEY,JSON.stringify(progress));return true;},false);
  function load(){
    const text=attempt(target=>target.getItem(PROGRESS_KEY),null);
    if(text!=null){
      try{const stored=JSON.parse(text);if(stored?.version===PROGRESS_VERSION)return normalizeProgress(stored);}catch{}
      damaged=true;
    }
    // No v2 record yet (or a damaged one): migrate from v1 and keep the result.
    const keys=attempt(target=>target.keys(),[]);
    const migrated=migrateLegacy(key=>attempt(target=>target.getItem(key),null),keys);
    damaged=damaged||migrated.damaged;
    if(!unavailable)write(migrated.progress);
    return migrated.progress;
  }
  /** @returns {Progress} */
  const get=()=>state??=load();
  return {
    get,
    /**
     * Applies `update` to the current record; returns false when storage
     * refused the write (the record still changes for this tab).
     * @param {(progress:Progress)=>Partial<Progress>} update
     * @param {{reward?:number}} [meta]  passed to the listeners
     */
    set(update,meta){const current=get(),next=normalizeProgress({...current,...update(current)});state=next;const saved=write(next);for(const listener of listeners)listener(next,meta);return saved;},
    /** @param {(progress:Progress,meta?:{reward?:number})=>void} listener */
    subscribe(listener){listeners.add(listener);return()=>{listeners.delete(listener);};},
    unavailable:()=>unavailable,
    damaged:()=>damaged,
  };
}

const browserStorage=()=>{
  const local=globalThis.localStorage;if(!local)return null;
  return {getItem:key=>local.getItem(key),setItem:(key,value)=>local.setItem(key,value),keys:()=>Array.from({length:local.length},(_,i)=>local.key(i)).filter(key=>typeof key==='string')};
};

export const progressStore=createProgressStore(browserStorage);
