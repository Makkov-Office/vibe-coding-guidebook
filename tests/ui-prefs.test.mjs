import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {parsePrefs,applyPrefs,uiPrefsScript,UI_PREFS_KEY} from '../src/design/ui-prefs.mjs';

// A minimal <html> element: the attributes the prefs touch.
function root(){const attrs=new Map();return {attrs,setAttribute:(k,v)=>attrs.set(k,v),removeAttribute:k=>attrs.delete(k)};}

const stored=[undefined,'{}','not json','null','[]','{"theme":"dark"}','{"theme":"light","motion":"off"}','{"theme":"system","motion":"off"}','{"theme":"blue","motion":"maybe"}','{"motion":"off"}'];

test('parsePrefs falls back to the system theme and keeps only the theme',()=>{
 assert.deepEqual(parsePrefs(null),{theme:'system'});
 assert.deepEqual(parsePrefs({theme:'blue',motion:'maybe'}),{theme:'system'});
 // The animation switch is gone (P3-09): its stored «off» is not a preference any more.
 assert.deepEqual(parsePrefs({theme:'dark',motion:'off'}),{theme:'dark'});
});

test('a stored «motion: off» from the removed switch never sets data-motion',()=>{
 for(const value of ['{"motion":"off"}','{"theme":"dark","motion":"off"}']){
  const html=root();
  vm.runInNewContext(uiPrefsScript,{localStorage:{getItem:()=>value},document:{documentElement:html},JSON});
  assert.equal(html.attrs.has('data-motion'),false,value);
  const applied=root();applyPrefs(parsePrefs(JSON.parse(value)),applied);
  assert.equal(applied.attrs.has('data-motion'),false,value);
 }
});

test('readPrefs drops the motion key from an old record and keeps the theme',async()=>{
 const store=new Map([[UI_PREFS_KEY,'{"theme":"light","motion":"off"}']]);
 const writes=[];
 globalThis.localStorage={getItem:key=>store.get(key)??null,setItem:(key,value)=>{writes.push(key);store.set(key,value);}};
 try{
  // A fresh module instance: readPrefs caches the record.
  const {readPrefs}=await import('../src/design/ui-prefs.mjs?clean-motion');
  assert.deepEqual(readPrefs(),{theme:'light'});
  assert.deepEqual(JSON.parse(store.get(UI_PREFS_KEY)),{theme:'light'});
  assert.deepEqual(writes,[UI_PREFS_KEY]);
 }finally{delete globalThis.localStorage;}
 // A record without the key is left alone.
 store.set(UI_PREFS_KEY,'{"theme":"dark"}');writes.length=0;
 globalThis.localStorage={getItem:key=>store.get(key)??null,setItem:(key,value)=>{writes.push(key);store.set(key,value);}};
 try{
  const {readPrefs}=await import('../src/design/ui-prefs.mjs?no-motion');
  assert.deepEqual(readPrefs(),{theme:'dark'});assert.deepEqual(writes,[]);
 }finally{delete globalThis.localStorage;}
});

test('the inline script sets the same attributes as applyPrefs for every stored value',()=>{
 for(const value of stored){
  const fromScript=root(),fromModule=root();
  const localStorage={getItem:key=>key===UI_PREFS_KEY?value??null:null};
  vm.runInNewContext(uiPrefsScript,{localStorage,document:{documentElement:fromScript},JSON});
  let parsed;try{parsed=JSON.parse(value??'{}');}catch{parsed=null;}
  applyPrefs(parsePrefs(parsed),fromModule);
  assert.deepEqual([...fromScript.attrs],[...fromModule.attrs],String(value));
 }
});

test('the inline script survives a storage that throws',()=>{
 const html=root();
 vm.runInNewContext(uiPrefsScript,{localStorage:{getItem(){throw new Error('denied');}},document:{documentElement:html},JSON});
 assert.equal(html.attrs.size,0);
});

test('nextTheme: after the system theme comes its opposite, then the same, then the system',async()=>{
 const {nextTheme}=await import('../src/design/ui-prefs.mjs');
 assert.deepEqual([nextTheme('system',false),nextTheme('dark',false),nextTheme('light',false)],['dark','light','system']);
 assert.deepEqual([nextTheme('system',true),nextTheme('light',true),nextTheme('dark',true)],['light','dark','system']);
});
