// Световой след и смена формы (P2-08): список кликабельных в скрипте и в CSS совпадает, встроенный скрипт ставит
// точку касания и атрибут, а при reduced motion, data-motion="off", неосновной кнопке и disabled ничего не делает.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {PRESS_SELECTOR,pressGlowScript} from '../src/design/press-glow.mjs';

const css=fs.readFileSync(new URL('../src/design/interaction.css',import.meta.url),'utf8').replace(/\/\*[\s\S]*?\*\//g,'');
const list=(text)=>text.split(',').map((s)=>s.trim()).sort();
const expected=list(PRESS_SELECTOR);

test('the glow rule in interaction.css covers exactly PRESS_SELECTOR',()=>{
 const match=css.match(/:is\(([^)]*)\)\[data-glowing\]::after/);
 assert.ok(match,'glow rule is missing');
 assert.deepEqual(list(match[1]),expected);
});

test('every shape rule covers the same clickable elements (data-glow is glow only)',()=>{
 const shapes=expected.filter((s)=>s!=='[data-glow]');
 const rules=[...css.matchAll(/:is\(([^)]*)\):(hover|active)\{--shape-r/g)];
 assert.equal(rules.length,2,'hover and press shape rules');
 for(const [,selectors] of rules)assert.deepEqual(list(selectors),shapes);
 const pills=css.match(/:is\(([^)]*)\)\{--shape-rest:var\(--shape-pill\)/),cards=css.match(/:is\(([^)]*)\)\{--shape-rest:var\(--shape-card\)/);
 assert.ok(pills&&cards);
 assert.deepEqual([...list(pills[1]),...list(cards[1])].sort(),[...shapes,'.bp-press--card'].sort());
});

function page({motion=null,reduce=false}={}){
 const attrs=new Map(motion?[['data-motion',motion]]:[]);
 const root={hasAttribute:(k)=>attrs.has(k),setAttribute:(k,v)=>attrs.set(k,v),getAttribute:(k)=>attrs.get(k)??null};
 const listeners={};
 const document={documentElement:root,addEventListener:(type,fn)=>{listeners[type]=fn;}};
 const window={matchMedia:()=>({matches:reduce})};
 vm.runInNewContext(pressGlowScript,{document,window,Math,JSON});
 return {listeners};
}

function host({disabled=false}={}){
 const style=new Map(),attrs=new Set();
 return {style:{setProperty:(k,v)=>style.set(k,v)},styleMap:style,attrs,offsetWidth:100,
  matches:()=>disabled,closest:function(){return this;},
  getBoundingClientRect:()=>({left:10,top:20,width:200,height:44}),
  removeAttribute:(k)=>attrs.delete(k),setAttribute:(k)=>attrs.add(k)};
}

test('pointerdown marks the pressed element with the touch point',()=>{
 const {listeners}=page(),el=host();
 listeners.pointerdown({button:0,target:el,clientX:60,clientY:42});
 assert.ok(el.attrs.has('data-glowing'));
 assert.equal(el.styleMap.get('--glow-x'),'50.0px');
 assert.equal(el.styleMap.get('--glow-y'),'22.0px');
 assert.ok(parseFloat(el.styleMap.get('--glow-reach'))<=240);
 listeners.animationend({animationName:'press-glow',target:el});
 assert.ok(!el.attrs.has('data-glowing'));
});

test('no glow with reduced motion, data-motion="off", a secondary button or a disabled control',()=>{
 for(const [options,event,state] of [[{reduce:true},{button:0},{}],[{motion:'off'},{button:0},{}],[{},{button:2},{}],[{},{button:0},{disabled:true}]]){
  const {listeners}=page(options),el=host(state);
  listeners.pointerdown({...event,target:el,clientX:0,clientY:0});
  assert.equal(el.attrs.size,0,JSON.stringify(options)+JSON.stringify(event)+JSON.stringify(state));
 }
});
