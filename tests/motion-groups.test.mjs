// Каскад (P3-11, docs/design/visual-language.md «Движение»): реестр групп в src/design/motion-groups.mjs и правило
// «6. Каскад» в app/motion.css совпадают; число шагов — одно в реестре, CSS и токенах; скрытое ожидание появления
// при прокрутке есть только при включённом движении.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {STAGGER_CAP,STAGGER_CHILDREN,STAGGER_GROUPS} from '../src/design/motion-groups.mjs';

const read=(file)=>fs.readFileSync(new URL(`../${file}`,import.meta.url),'utf8').replace(/\/\*[\s\S]*?\*\//g,'');
const css=read('app/motion.css'),tokens=read('app/tokens.css');
const list=(text)=>text.split(',').map((s)=>s.trim()).sort();

test('every cascade rule in motion.css lists exactly STAGGER_GROUPS',()=>{
  const rules=[...css.matchAll(/:where\(([^)]*)\)>/g)].map((m)=>m[1]).filter((rule)=>rule.includes('[data-stagger]'));
  assert.ok(rules.length>=STAGGER_CAP,`${rules.length} rules`);
  for(const rule of rules)assert.deepEqual(list(rule),[...STAGGER_GROUPS].sort());
});

test('cascade indexes cover the cap from tokens.css',()=>{
  assert.match(css,/@supports \(z-index:sibling-index\(\)\)\{:where\([^)]*\)>\*\{--i:min\(sibling-index\(\) - 1,var\(--stagger-cap\)\)\}\}/);
  assert.match(tokens,new RegExp(`--stagger-cap:${STAGGER_CAP};`));
  assert.match(css,new RegExp(`>:where\\(:nth-child\\(-n\\+${STAGGER_CAP}\\)\\)\\{animation:`));
  for(let k=2;k<=STAGGER_CAP;k++)assert.match(css,new RegExp(`>:where\\(:nth-child\\(${k}\\)\\)\\{--i:${k-1}\\}`),String(k));
});

test('the cascade uses only motion tokens and a group inside a group passes it on',()=>{
  assert.match(css,/var\(--dur-stagger\)/);
  assert.match(css,/var\(--dur-enter\) var\(--ease-enter\)/);
  assert.match(css,/>:where\([^{]+\)\{animation:none\}/);
});

test('waiting for reveal hides only with motion on and never in print',()=>{
  assert.match(css,/@media \(prefers-reduced-motion:no-preference\)\{:root:not\(\[data-motion=off\]\) \[data-reveal=wait\]\{opacity:0;animation:none\}\}/);
  assert.match(css,/@media print\{\[data-reveal\]\{opacity:1!important;animation:none!important\}\}/);
  assert.equal(STAGGER_CHILDREN.split(',').length,STAGGER_GROUPS.length);
});
