import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {norm,groupOf,groupResults,otherLayout,matchRanges,SEARCH_GROUPS,SCOPED_LIMIT,rememberPage,readRecent,RECENT_KEY} from '../src/design/search-groups.mjs';

const entry=(id,type,chapter,title,text=title)=>({id,type,chapter,title,text,path:'/x',normalized:norm(`${title} ${text}`)});

test('groupOf: terms, memo (chapter 22), headings, the rest',()=>{
 assert.equal(groupOf(entry('a','термин','ch-23','A')),'terms');
 assert.equal(groupOf(entry('b','заголовок','ch-22','B')),'memo');
 assert.equal(groupOf(entry('c','текст','ch-22','C')),'memo');
 assert.equal(groupOf(entry('d','заголовок','ch-08','D')),'pages');
 for(const type of ['текст','пример','материал','схема'])assert.equal(groupOf(entry('e',type,'ch-08','E')),'text');
});

test('groupResults keeps group order, ranks a headline match first and caps each group',()=>{
 const entries=[
  entry('t1','текст','ch-01','Про ревью','независимое review всегда'),
  entry('h1','заголовок','ch-07','07. Жизненный цикл','Что делать после review'),
  entry('h2','заголовок','ch-07','07. Жизненный цикл','Review и merge'),
  entry('k1','термин','ch-23','Independent review','проверка'),
  entry('m1','текст','ch-22','Памятка','review по HEAD'),
 ];
 const {groups,more}=groupResults(entries,norm('review'));
 assert.deepEqual(groups.map(g=>g.id),['pages','terms','memo','text']);
 assert.deepEqual(groups[0].entries.map(e=>e.id),['h2','h1'],'a heading that starts with the query comes first');
 assert.equal(more,false);
 const many=Array.from({length:30},(_,i)=>entry(`x${i}`,'заголовок','ch-02','Стр',`review ${i}`));
 const capped=groupResults(many,'review');
 assert.equal(capped.groups[0].entries.length,SEARCH_GROUPS[0].limit);assert.equal(capped.more,true);
 assert.deepEqual(groupResults(entries,'').groups,[]);
});

test('a phrase found as typed wins; otherwise every word must match, in any order; counts and a scope',()=>{
 const typed=[entry('p','текст','ch-01','01','бери в работу задачу'),entry('w','заголовок','ch-01','01','В работу не бери')];
 assert.deepEqual(groupResults(typed,norm('бери в работу')).groups.flatMap(g=>g.entries.map(e=>e.id)),['p']);
 const entries=[
  entry('a','заголовок','ch-07','07','Review и merge'),
  entry('b','текст','ch-07','07','merge после независимого review'),
  entry('c','текст','ch-07','07','только review'),
  entry('d','термин','ch-23','Merge queue','очередь, review не нужен'),
 ];
 const {groups,counts}=groupResults(entries,norm('merge review'));
 assert.deepEqual(groups.flatMap(g=>g.entries.map(e=>e.id)),['a','d','b']);
 assert.deepEqual(counts,{pages:1,terms:1,memo:0,text:1});
 const many=Array.from({length:80},(_,i)=>entry(`x${i}`,'текст','ch-02','Стр',`review ${i}`));
 const scoped=groupResults([...many,...entries],'review','text');
 assert.deepEqual(scoped.groups.map(g=>g.id),['text']);assert.equal(scoped.groups[0].entries.length,SCOPED_LIMIT);
 assert.equal(scoped.counts.pages,1,'counts include the groups a scope hides');
});

test('the other keyboard layout and the ranges to mark',()=>{
 assert.equal(otherLayout('кумшуц'),'review');assert.equal(otherLayout('review'),'кумшуц');assert.equal(otherLayout('ыщгксу'),'source');
 assert.deepEqual(matchRanges('Review и merge','merge review'),[[0,6],[9,14]]);
 assert.deepEqual(matchRanges('Ёлка','елка'),[[0,4]]);
 assert.deepEqual(matchRanges('nothing','zz'),[]);
});

test('the built index carries the glossary level of every term',()=>{
 const assets=JSON.parse(fs.readFileSync('src/content/reader-assets.json','utf8'));
 const index=JSON.parse(fs.readFileSync(`public${assets.search}`,'utf8'));
 const terms=index.filter(e=>e.type==='термин');
 assert.ok(terms.length>0);
 for(const term of terms)assert.ok(['Базовое','Профессиональное'].includes(term.level),term.id);
 assert.ok(index.filter(e=>e.type!=='термин').every(e=>!('level' in e)));
});

test('recent pages: newest first, no duplicates, at most four, storage optional',()=>{
 const store=new Map();
 globalThis.localStorage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)};
 for(const path of ['/chapters/01','/chapters/02','/chapters/01','/chapters/03','/chapters/04','/glossary'])rememberPage(path);
 assert.deepEqual(readRecent(),['/glossary','/chapters/04','/chapters/03','/chapters/01']);
 store.set(RECENT_KEY,'not json');assert.deepEqual(readRecent(),['/glossary','/chapters/04','/chapters/03','/chapters/01']);
 store.set(RECENT_KEY,JSON.stringify(['https://evil.example',5,'/tools']));assert.deepEqual(readRecent(),['/tools']);
 globalThis.localStorage={getItem(){throw new Error('denied');},setItem(){throw new Error('denied');}};
 rememberPage('/chapters/09');assert.deepEqual(readRecent(),['/chapters/09','/tools']);
 delete globalThis.localStorage;
});
