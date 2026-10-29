// Interface preferences (P3-04): the theme in three states, kept in one localStorage record.
// The animation switch was removed (founder 29.10.2026, P3-09): a stored «motion: off» from it is
// ignored and dropped on the next read, so it never turns animation off for good; motion follows
// prefers-reduced-motion only. The same rules run twice: as an inline script before the first paint (no
// flash of the wrong theme) and in the controls after hydration. Storage may be unavailable:
// the choice then lives until the page is closed.
export const UI_PREFS_KEY='mae-ui';
export const THEMES=/** @type {const} */(['system','light','dark']);

/** @typedef {{theme:'system'|'light'|'dark'}} UiPrefs */

/** @param {unknown} value @returns {UiPrefs} */
export function parsePrefs(value){
  const raw=value&&typeof value==='object'?/** @type {Record<string,unknown>} */(value):{};
  return {theme:THEMES.includes(/** @type {never} */(raw.theme))?/** @type {UiPrefs['theme']} */(raw.theme):'system'};
}

/** @param {UiPrefs} prefs @param {HTMLElement} root */
export function applyPrefs(prefs,root){
  if(prefs.theme==='system')root.removeAttribute('data-theme');else root.setAttribute('data-theme',prefs.theme);
}

// Inline, before hydration: the same parse and apply, minified by hand, without imports.
export const uiPrefsScript=`(()=>{try{var p=JSON.parse(localStorage.getItem('${UI_PREFS_KEY}')||'{}')||{},r=document.documentElement;if(p.theme==='light'||p.theme==='dark')r.setAttribute('data-theme',p.theme);}catch(e){}})();`;

let memory=/** @type {UiPrefs|null} */(null);
const listeners=new Set();

/** @returns {UiPrefs} */
export function readPrefs(){
  if(memory)return memory;
  let raw=null;
  try{raw=JSON.parse(localStorage.getItem(UI_PREFS_KEY)||'{}');}catch{}
  memory=parsePrefs(raw);
  // A record left by the removed animation switch: rewrite it with the theme only.
  if(raw&&typeof raw==='object'&&'motion' in raw){try{localStorage.setItem(UI_PREFS_KEY,JSON.stringify(memory));}catch{}}
  return memory;
}

/** @param {Partial<UiPrefs>} update @returns {UiPrefs} */
export function writePrefs(update){
  memory=parsePrefs({...readPrefs(),...update});
  try{localStorage.setItem(UI_PREFS_KEY,JSON.stringify(memory));}catch{}
  applyPrefs(memory,document.documentElement);
  for(const listener of listeners)listener(memory);
  return memory;
}

// Another tab changed the record: drop the cached copy, so a stale tab never writes old values back.
/** @param {StorageEvent} event */
function storageChanged(event){
  if(event.key!==UI_PREFS_KEY&&event.key!==null)return;
  memory=null;const prefs=readPrefs();
  applyPrefs(prefs,document.documentElement);
  for(const listener of listeners)listener(prefs);
}

/** @param {(prefs:UiPrefs)=>void} listener */
export function subscribePrefs(listener){
  if(!listeners.size)window.addEventListener('storage',storageChanged);
  listeners.add(listener);
  return()=>{listeners.delete(listener);if(!listeners.size)window.removeEventListener('storage',storageChanged);};
}

/**
 * The next theme of the cycle. After «Как в системе» comes the opposite of the system theme, so
 * the first click always changes the page. @param {UiPrefs['theme']} theme @param {boolean} systemDark
 * @returns {UiPrefs['theme']}
 */
export function nextTheme(theme,systemDark){
  const [first,second]=systemDark?['light','dark']:['dark','light'];
  return theme==='system'?first:theme===first?second:'system';
}
