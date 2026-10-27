import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import { visit } from 'unist-util-visit';
import { toString } from 'mdast-util-to-string';
import { toText } from 'hast-util-to-text';
import { inflections, occurrenceOverrides, contextualTokens, resolveContext } from './term-overrides.mjs';
import { createPanels } from '../interactive/registry.mjs';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {icons,iconProps,chapterIcons} from '../design/icons.mjs';
import identities from './block-identities.json' with {type:'json'};
import practiceIdentities from './practice-identities.json' with {type:'json'};
import toolMedia from './tool-media.json' with {type:'json'};
import {termProduct,chapterProduct,linkedProduct} from '../design/product-logos.mjs';
import {compileDrills} from './drills.mjs';
const iconMarkup=name=>renderToStaticMarkup(createElement(icons[name],iconProps));

const el = (tagName, properties={}, children=[]) => ({type:'element',tagName,properties,children});
const txt = value => ({type:'text',value});
const productImage=logo=>el('img',{src:logo.src,alt:'',width:logo.width??20,height:20,className:['product-mark',...(logo.kind==='wordmark'?['product-wordmark']:[]),...(logo.tone?[logo.tone]:[])],'aria-hidden':'true'});
const decorateProductLinks=node=>visit(node,'element',(link,index,parent)=>{
  if(link.tagName!=='a'||link.children.some(child=>child.properties?.className?.includes('product-mark')))return;
  const href=String(link.properties.href??''),termId=href.split('#')[1],logo=termProduct(termId)??linkedProduct(href);
  if(!logo)return;
  if(termId==='term-vscode'&&!/VS\s?Code|Visual Studio Code/i.test(toText(link)))return;
  if(termId==='term-docker-engine'&&!/Docker/i.test(toText(link)))return;
  if(parent?.tagName==='h2'&&chapterProduct(parent.properties.id)?.src===logo.src)return;
  link.properties.className=[...(link.properties.className??[]),'product-link'];
  if(logo.kind==='wordmark'&&toText(link)==='Context7')link.children=[productImage(logo),el('span',{className:['sr-only']},link.children)];
  else link.children.unshift(productImage(logo));
});
const productMarkup=logo=>unified().use(rehypeStringify).stringify({type:'root',children:[productImage(logo)]});
const chapterMarkup=id=>chapterProduct(id)?productMarkup(chapterProduct(id)):iconMarkup(chapterIcons[id]??'book');
const featureIcon=title=>title.includes('Dots')?'dots':title.includes('Artifacts')?'docs':title.includes('Design')?'design':title.includes('Security')?'security':title.includes('Appshots')?'photo':title.includes('Подписки')?'tags':title.includes('Cloud')?'cloud':title.includes('Расписание')?'schedule':title.includes('От прототипа')?'world':title.includes('Браузер')||title.includes('Визуальный')?'world':title.includes('Review')||title.includes('review')?'review':title.includes('агент')||title.includes('Агенты')?'users':title.includes('План')||title.includes('/goal')?'lifecycle':title.includes('Контекст')?'context':title.includes('Модел')||title.includes('Mods')||title.includes('навыки')||title.includes('plugins')?'setup':'terminal';
export const normalize = s => s.normalize('NFKC').toLocaleLowerCase('ru').replaceAll('ё','е');
const toolPages={'Обзоры инструментов':{id:'ch-tools',path:'/tools'},'Codex: от идеи до проверенного результата':{id:'ch-codex',path:'/tools/codex'},'Claude Code: рабочий процесс внутри проекта':{id:'ch-claude-code',path:'/tools/claude-code'}};
export const chapterPath = id => Object.values(toolPages).find(page=>page.id===id)?.path??(id==='ch-00'?'/':id==='ch-23'?'/glossary':id==='ch-resources'?'/resources':`/chapters/${id.slice(3)}`);
export function previewKind(definition, structured=false, linked=false){return !structured && [...definition.trim().replace(/\s+/g,' ')].length<=160?(linked?'popover':'tooltip'):'panel';}
const slug = s => normalize(s).replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-|-$/g,'');
const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const word = c => c && /[\p{L}\p{N}_]/u.test(c);
export function makeMatcher(terms) {
  const registry = new Map();
  for (const term of terms) for (const alias of [...new Set([term.label,...term.aliases,...(inflections[term.id]??[])])]) {
    if(!alias.trim()) continue;
    const key=normalize(alias); const items=registry.get(key)??[];
    if(!items.some(i=>i.term.id===term.id)) items.push({term,alias});
    registry.set(key,items);
  }
  const pattern = [...registry.keys()].sort((a,b)=>b.length-a.length).map(escape).join('|');
  return text => {
    const matches=[]; const regex=new RegExp(pattern,'giu'); let m;
    while((m=regex.exec(text))) {
      const value=m[0]; const start=m.index; const end=start+value.length;
      if(word(value[0]) && word(text[start-1]) || word(value.at(-1)) && word(text[end])) continue;
      const items=(registry.get(normalize(value))??[]).filter(({alias})=> !/^[A-Z]{1,3}$/.test(alias) || value===alias);
      if(!items.length) continue;
      const candidates=items.map(i=>i.term);
      matches.push({start,end,value,id:candidates.length===1?candidates[0].id:null,candidates});
    }
    return matches;
  };
}

// Overview layer of a chapter (brief 8.2): frontmatter keys and sections, in order.
const OVERVIEW_KEYS=['chapter','minutes','rule_strength','title'];
const OVERVIEW_SECTIONS=['Зачем','Правило','Как это выглядит','Три вещи, которые нужно сделать','Частая ошибка','Проверь себя'];

// Checks content/overview/NN.md against the template and returns its frontmatter
// and Markdown tree; throws with the file name and the broken rule.
export function parseOverview(number,text){
  const fail=message=>{throw Error(`content/overview/${number}.md: ${message}`);};
  text=text.replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n');
  const frontmatter=text.match(/^---\n([\s\S]*?)\n---\n/);if(!frontmatter)fail('frontmatter is missing');
  const meta={};
  for(const line of frontmatter[1].split('\n')){
    // A value is bare or in balanced double quotes; a key appears once.
    const m=line.match(/^([a-z_]+):\s*(?:"([^"]*)"|([^"'\s](?:[^"]*[^"\s])?))\s*$/)??fail(`frontmatter line «${line}»`);
    if(m[1] in meta)fail(`frontmatter key ${m[1]} is repeated`);meta[m[1]]=m[2]??m[3];
  }
  if(Object.keys(meta).sort().join()!==OVERVIEW_KEYS.join())fail(`frontmatter needs exactly ${OVERVIEW_KEYS.join(', ')}`);
  if(meta.chapter!==number)fail(`chapter ${meta.chapter} does not match the file name`);
  if(!meta.title.trim())fail('title is empty');
  if(!/^[1-9]\d*$/.test(meta.minutes))fail('minutes must be a positive whole number');
  if(!['MUST','SHOULD','MAY'].includes(meta.rule_strength))fail('rule_strength must be MUST, SHOULD or MAY');
  const body=unified().use(remarkParse).use(remarkGfm).parse(text.slice(frontmatter[0].length));
  visit(body,'heading',node=>{if(node.depth!==2)fail(`only ## sections are allowed, found ${'#'.repeat(node.depth)} ${toString(node)}`);});
  visit(body,'html',()=>fail('raw HTML and disclosures are not allowed'));
  const sections=[];for(const node of body.children){if(node.type==='heading')sections.push({title:toString(node),nodes:[]});else if(!sections.length)fail('text before the first section');else sections.at(-1).nodes.push(node);}
  if(sections.map(section=>section.title).join('|')!==OVERVIEW_SECTIONS.join('|'))fail(`sections must be exactly: ${OVERVIEW_SECTIONS.join(' / ')}`);
  for(const section of sections)if(!section.nodes.some(node=>toString(node).trim()))fail(`«${section.title}» is empty`);
  const rules=sections[1].nodes.filter(node=>node.type==='blockquote');
  if(rules.length!==1||!toString(rules[0]).trim())fail('«Правило» needs the rule as one quote');
  const steps=sections[3].nodes;
  if(steps.length!==1||steps[0].type!=='list'||!steps[0].ordered||steps[0].children.length!==3||steps[0].children.some(item=>!toString(item).trim()))fail('«Три вещи, которые нужно сделать» needs one numbered list of 3 items');
  let words=0;visit(body,node=>{if(typeof node.value==='string'&&node.type!=='html')words+=node.value.split(/\s+/).filter(word=>/[\p{L}\p{N}]/u.test(word)).length;});if(words>350)fail(`${words} words, at most 350`);
  let count=0;visit(body,'table',()=>{count++;});if(count>1)fail(`${count} tables, at most 1`);
  count=0;visit(body,'code',node=>{if(node.lang==='mermaid')count++;});if(count>1)fail(`${count} diagrams, at most 1`);
  return {meta,body};
}

export const LEVELS=['basic','professional'];
// Glossary levels (P6-07): content/glossary-levels.json. Every term stands in
// exactly one list of its own topic; anything else fails the build.
export function parseGlossaryLevels(value,terms,topics){
  const fail=message=>{throw Error(`content/glossary-levels.json: ${message}`);};
  if(!value||typeof value!=='object'||!value.terms||typeof value.terms!=='object')fail('expected {levels, collapsed, terms}');
  const names=value.levels??{};
  for(const level of LEVELS)if(typeof names[level]!=='string'||!names[level].trim())fail(`levels.${level} needs a label`);
  if(Object.keys(names).some(level=>!LEVELS.includes(level)))fail(`levels: only ${LEVELS.join(', ')}`);
  const number=topic=>topic.match(/^(23\.\d+)\./)?.[1];
  const known=new Set(topics.map(number));
  const level=new Map();
  for(const [topic,lists] of Object.entries(value.terms)){
    if(!known.has(topic))fail(`unknown topic ${topic}`);
    if(!lists||typeof lists!=='object'||Object.keys(lists).some(key=>!LEVELS.includes(key)))fail(`${topic}: only ${LEVELS.join(', ')} lists`);
    for(const name of LEVELS)if(lists[name]!==undefined&&(!Array.isArray(lists[name])||lists[name].some(id=>typeof id!=='string')))fail(`${topic}.${name}: expected a list of term ids`);
    for(const name of LEVELS)for(const id of lists[name]??[]){
      const term=terms.find(t=>t.id===id);
      if(!term)fail(`${topic}: unknown term ${id}`);
      if(number(term.topic)!==topic)fail(`${id} belongs to ${number(term.topic)}, not ${topic}`);
      if(level.has(id))fail(`${id} is listed twice`);
      level.set(id,name);
    }
  }
  const missing=terms.filter(term=>!level.has(term.id)).map(term=>term.id);
  if(missing.length)fail(`no level for ${missing.join(', ')}`);
  const collapsed=new Map();
  for(const [topic,summary] of Object.entries(value.collapsed??{})){
    if(!known.has(topic))fail(`collapsed: unknown topic ${topic}`);
    if(typeof summary!=='string'||!summary.trim())fail(`collapsed.${topic} needs a summary`);
    collapsed.set(topic,summary.trim());
  }
  return {level,names,collapsed,number};
}

// urlMap: src/content/url-map.json (tabs of each chapter); overviews: { '08': markdown of content/overview/08.md };
// glossaryLevels: content/glossary-levels.json (without it terms carry no level).
export async function compileHandbook(source, {urlMap, overviews={}, glossaryLevels, drills:drillInputs=[], drillSchema}={}) {
  if(/Конец учебного руководства|Codex implementation prompt|## 17\. README и handoff/.test(source)) throw Error('Implementation appendix in reader source');
  const tree=unified().use(remarkParse).use(remarkGfm).parse(source);
  const terms=[]; const topics=[]; let topic=''; let inGlossary=false;
  for(const node of tree.children) {
    if(node.type==='heading' && node.depth===2) inGlossary=toString(node).startsWith('23.');
    if(inGlossary && node.type==='heading' && node.depth===3) {topic=toString(node);topics.push(topic);}
    if(inGlossary && node.type==='table') for(const row of node.children.slice(1)) {
      const first=row.children[0]; const html=first.children.find(n=>n.type==='html')?.value??'';
      const id=html.match(/id="(term-[^"]+)"/)?.[1]; if(!id) throw Error('Glossary term without ID');
      const label=toString(first.children.find(n=>n.type==='strong'));
      const variants=toString(first).split('·')[1]?.split(';').map(s=>s.trim()).filter(Boolean)??[];
      const definition=toString(row.children[1]);
      let linked=false;visit(row.children[1],'link',()=>{linked=true;});
      terms.push({id,label,aliases:variants,topic,definition,definitionHtml:'',previewKind:previewKind(definition,row.children[1].children.some(n=>!['text','strong','emphasis','inlineCode','link','break'].includes(n.type)),linked)});
    }
  }
  // Only an omitted option skips levels: a supplied value is always validated.
  const levels=glossaryLevels!==undefined?parseGlossaryLevels(glossaryLevels,terms,topics):null;
  if(levels)for(const term of terms)term.level=levels.level.get(term.id);
  const matcher=makeMatcher(terms);
  const audit={topics:topics.length,definitions:terms.length,recognized:0,linked:0,exceptions:[],ambiguous:[],unexplainedGaps:0,tabs:{chapters:0,blocks:0,overviews:0}};
  const occurrenceIds={};
  function annotate(node, context, suppressed=false, parent=null) {
    if(!node.children) return;
    const stop=suppressed || ['a','button','summary'].includes(node.tagName);
    const result=[];
    for(const child of node.children) {
      if(child.type==='text' && !suppressed && !['script','style'].includes(node.tagName)) {
        let cursor=0; let occurrence=0;
        const matches=matcher(child.value);
        for(const m of matches) {
          const key=`${context.id}:${occurrence++}:${m.value}`;
          const mapped=occurrenceOverrides[key];
          let id=mapped??contextualTokens[context.id]?.[normalize(m.value)]??m.id??resolveContext(m.candidates,toText(parent??node),context,m.value)?.id;
          if(!id) {audit.ambiguous.push({key,chapter:context.chapter,value:m.value,candidates:m.candidates.map(t=>t.id),text:child.value});continue;}
          audit.recognized++;
          if(stop) {audit.exceptions.push({block:context.id,term:id,reason:'existing link or semantic control'});continue;}
          if(m.start>cursor) result.push(txt(child.value.slice(cursor,m.start)));
          const occurrenceId=context.id.startsWith('ch-')?`occ-${context.id}-${occurrenceIds[context.id]=(occurrenceIds[context.id]??0)+1}`:undefined;
          result.push(el('a',{id:occurrenceId,href:`#${id}`,className:['term-link'],'data-term-link':id},[txt(m.value)]));
          cursor=m.end;audit.linked++;
        }
        result.push(txt(child.value.slice(cursor)));
      } else {annotate(child,context,stop,node);result.push(child);}
    }
    node.children=result;
  }
  const renderTree=async md => {
    const schema={...defaultSchema,allowComments:true,clobberPrefix:'',attributes:{...defaultSchema.attributes,'*':[...(defaultSchema.attributes['*']??[]),'id']},protocols:{...defaultSchema.protocols,href:[...(defaultSchema.protocols.href??[]),'chatgpt-conversation']}};
    return unified().use(remarkRehype,{allowDangerousHtml:true}).use(rehypeRaw).use(rehypeSanitize,schema).run(md);
  };
  const stringify = node => unified().use(rehypeStringify).stringify(node);
  const externalIcon=(await unified().use(rehypeRaw).run({type:'root',children:[{type:'raw',value:iconMarkup('arrowUpRight')}]})).children[0];
  const chapters=[];const search=[];const diagrams=[];const blocks=[];const tables={};let intro='';let current='ch-00';let offset=0;let exercise=0;
  const groups=[];let nodes=[];
  for(const node of tree.children) {
    if(node.type==='html' && /^<a id="ch-\d{2}"><\/a>$/.test(node.value.trim())) continue;
    if(node.type==='heading' && node.depth===2 && (/^\d{2}\./.test(toString(node)) || toString(node)==='Полезные материалы' || toolPages[toString(node)])) {
      if(nodes.length) groups.push({chapter:current,nodes});
      current=toolPages[toString(node)]?.id??(toString(node)==='Полезные материалы'?'ch-resources':`ch-${toString(node).slice(0,2)}`); nodes=[];
    }
    nodes.push(node);
  }
  if(nodes.length) groups.push({chapter:current,nodes});
  const usedIds=new Set();const counters={};
  // Chapters with tabs (P5-01): src/content/url-map.json says which tab each
  // heading and panel belongs to; the chapter is split by that, nothing is cut.
  const tabbed=new Map((urlMap?.pages??[]).filter(entry=>entry.tabs&&entry.chapter).map(entry=>[entry.chapter,entry]));
  const finish=(node,chapter,icon=true)=>stringify(node)
    .replace(/(<h2\b[^>]*>)/,icon?`$1${chapterMarkup(chapter)}`:'$1')
    .replace(/(<h3\b[^>]*>)([\s\S]*?)(<\/h3>)/g,(_,open,body,close)=>`${open}${chapter==='ch-23'?iconMarkup('tags'):['ch-codex','ch-claude-code'].includes(chapter)?iconMarkup(featureIcon(body.replace(/<[^>]*>/g,''))):''}${body}${close}`)
    .replace(/<summary>/g,`<summary>${iconMarkup('chevronRight')}`)
    .replace(/<span class="route-icon" data-chapter="([^"]+)"><\/span>/g,(_,id)=>`<span class="route-icon">${chapterMarkup(id)}</span>`)
    .replace(/<span class="route-arrow"><\/span>/g,`<span class="route-arrow">${iconMarkup('arrowRight')}</span>`);
  // One top-level block of a chapter or of its overview layer, after its id is set.
  const transform=(node,{chapter,id,title,tab,permalink=true,example=false})=>{
    const push=entry=>search.push(tab?{...entry,tab}:entry);
    if(node.tagName==='pre') {
      const code=node.children.find(n=>n.tagName==='code');const raw=code?.children.map(n=>n.value??'').join('')??'';
      const language=code?.properties.className?.[0]?.replace('language-','')??'text';
      if(language==='mermaid') {
        const description=raw.split('\n').filter(l=>l.includes('-->')||l.includes('.->')).map(l=>l.trim()).join('\n');
        diagrams.push({id,chapter,source:raw,description});
        node.tagName='figure';node.properties.className=['mermaid-figure'];
        node.properties['data-diagram']=id;
        node.children=[el('figcaption',{},[txt('Схема процесса')]),el('div',{className:['diagram-render'],'aria-hidden':'true'}),el('details',{className:['diagram-source']},[el('summary',{},[txt('Текстовая версия схемы')]),el('pre',{},[el('code',{},[txt(raw)])])])];
        const refs=[...new Set(matcher(raw).flatMap(m=>m.candidates.map(t=>t.id)))];
        node.children.push(el('p',{className:['code-terms']},[txt('Термины в схеме: '),...refs.flatMap((term,i)=>[...(i?[txt(' · ')]:[]),el('a',{href:`#${term}`,className:['term-link']},[txt(terms.find(t=>t.id===term).label)])])]));
        audit.exceptions.push(...refs.map(term=>({block:id,term,reason:'Mermaid source; equivalent definition links'})));
      } else {
        const adjacent=chapter==='ch-06'&&language==='yaml'||chapter==='ch-14'&&raw.startsWith('Проведи независимый review');
        blocks.push({id,raw,language,adjacent,terms:[...new Set(matcher(raw).flatMap(m=>m.candidates.map(t=>t.id)))]});
        if(language==='text'||language==='markdown') annotate(code,{id,chapter});
        const refs=[...new Set(matcher(raw).flatMap(m=>m.candidates.map(t=>t.id)))];
        const block=el('div',{className:['code-shell']},[el('div',{className:['code-toolbar']},[txt(`${language} · учебный шаблон`),el('button',{type:'button',disabled:true,'data-copy':id},[txt('Копировать')])]),el('pre',{'data-raw-exception':language!=='text'&&language!=='markdown'?'executable code':undefined},[code])]);
        annotate(block.children[0],{id:`${id}-toolbar`,chapter});
        if(adjacent)block.children[0].children.push(el('button',{id:`example-${id}`,type:'button',disabled:true,'data-example':id},[txt('Открыть рядом')]));
        if(language!=='text' && language!=='markdown') {
          block.children.push(el('p',{className:['code-terms']},[txt('Термины в примере: '),...refs.flatMap((term,i)=>[...(i?[txt(' · ')]:[]),el('a',{href:`#${term}`,className:['term-link']},[txt(terms.find(t=>t.id===term).label)])])]));
          audit.exceptions.push(...refs.map(term=>({block:id,term,reason:'executable source retained; adjacent term link'})));
        }
        // An overview example is the point of its section: shown open, not as a deep dive.
        if(example){node.tagName='div';node.properties.className=['overview-example'];node.children=[block];}
        else {node.tagName='details';node.properties.className=['deep-dive'];node.children=[el('summary',{},[txt(`Открыть ${language==='text'?'промпт / контракт':'учебный пример'}`)]),block];}
      }
      push({id,chapter,title:title||'Ориентация',type:language==='mermaid'?'схема':'пример',text:raw});
      return;
    }
    if(chapter==='ch-23' && node.tagName==='table') {
      const rows=node.children.find(n=>n.tagName==='tbody')?.children.filter(n=>n.tagName==='tr')??[];
      node.tagName='div';node.properties.className=['glossary-list'];node.children=[];
      for(const row of rows) {
        const cells=row.children.filter(n=>n.tagName==='td');const anchor=cells[0]?.children.find(n=>n.tagName==='a');const term=terms.find(t=>t.id===anchor?.properties.id);if(!term) continue;
        cells[0].children=cells[0].children.filter(n=>n!==anchor);
        // The level is shown on the card too (P6-07b); the copy-link button joins it in the browser.
        const meta=term.level?[el('p',{className:['term-meta']},[el('span',{className:['term-level'],'data-level':term.level},[el('span',{className:['sr-only']},[txt('Уровень: ')]),txt(levels.names[term.level])])])]:[];
        const card=el('article',{id:term.id,tabIndex:-1,className:['term-definition'],'data-topic':term.topic,'data-term':term.id,'data-level':term.level},[el('h4',{},cells[0].children),...meta,el('p',{},cells[1].children)]);
        if(termProduct(term.id))card.children[0].children.unshift(productImage(termProduct(term.id)));
        decorateProductLinks(card);
        visit(card,'element',n=>{if(n.tagName==='a'&&/^https?:/.test(n.properties.href??'')){n.properties.target='_blank';n.properties.rel=['noopener','noreferrer'];n.properties['aria-label']=`${toText(n)} — открывается в новой вкладке`;n.children.push(structuredClone(externalIcon));}});
        term.definitionHtml=stringify(el('p',{},cells[1].children));
        node.children.push(card);usedIds.add(term.id);
        search.push({id:term.id,chapter,title:term.label,type:'термин',text:`${term.label} ${term.aliases.join(' ')} ${term.definition}`});
      }
      // Basic terms of a collapsed topic (Git) go to a closed group at the end of the topic.
      const summary=levels?.collapsed.get(levels.number(terms.find(t=>t.id===node.children[0]?.properties.id)?.topic??''));
      if(summary){
        const basic=node.children.filter(card=>card.properties['data-level']==='basic');
        if(basic.length){
          node.children=node.children.filter(card=>!basic.includes(card));
          node.children.push(el('details',{className:['glossary-basics'],'data-level':'basic'},[el('summary',{},[txt(summary)]),el('div',{className:['glossary-list']},basic)]));
        }
      }
    } else if(chapter==='ch-23'&&node.tagName==='p'&&node.children[0]?.tagName==='strong'&&toText(node.children[0])==='Служебный формат для сайта:'){
      // A note on the source format, written for the site and agents: kept in the Markdown, hidden on the page and from search (P6-07b).
      node.properties.hidden=true;node.properties.className=['glossary-service-note'];
    } else {
      if(chapter!=='ch-23') annotate(node,{id,chapter});
      visit(node,'element',(n,index,parent)=>{
        if(n.tagName==='a' && n.properties.href?.startsWith('chatgpt-conversation:')) n.children.push(txt(' (историческая переписка; может быть доступна только владельцу)'));
        if(n.tagName==='a' && /^https?:/.test(n.properties.href??'')) n.properties.rel=['noopener','noreferrer'];
        if(n.tagName==='input' && n.properties.type==='checkbox') {n.properties.disabled=false;const label=`Учебный пункт: ${toText(parent??node).trim().replace(/\s+/g,' ')}`;n.properties['data-practice']=practiceIdentities[label]??`${id}-${offset}`;if(chapter==='ch-20'){n.properties['data-exercise']=`exercise-${++exercise}`;n.properties['data-practice']=`exercise-${exercise}`;}offset++;n.properties['aria-label']=label;}
      });
      visit(node,'element',item=>{
        if(item.tagName!=='li'||!item.properties.className?.includes('task-list-item'))return;
        const checkbox=item.children.find(child=>child.type==='element'&&child.tagName==='input'&&child.properties.type==='checkbox');
        if(!checkbox)return;
        item.children=[el('label',{className:['practice-toggle']},[checkbox]),el('div',{className:['practice-text']},item.children.filter(child=>child!==checkbox))];
      });
      if(chapter==='ch-resources'&&node.tagName==='ul'){
        for(const item of node.children.filter(n=>n.tagName==='li')){
          const itemTitle=toText(item.children.find(n=>n.tagName==='p')??item);
          const itemId=`ch-resources-item-${slug(itemTitle)}`;
          item.properties.id=itemId;
          search.push({id:itemId,chapter,title:itemTitle,type:'материал',text:toText(item)});
        }
      }else{const text=toText(node);if(text.trim()) push({id,chapter,title:title||'Ориентация',type:/^h/.test(node.tagName)?'заголовок':'текст',text});}
    }
    if(chapter==='ch-00'&&node.tagName==='ul'&&node.children.filter(n=>n.tagName==='li').every(item=>item.children.some(n=>n.tagName==='ul')&&item.children.some(n=>n.tagName==='p'&&n.children.some(c=>c.tagName==='strong')))){
      node.tagName='nav';node.properties.className=['home-route'];node.properties['aria-label']='Маршрут по главам';
      node.children=node.children.filter(n=>n.tagName==='li');
      for(const item of node.children){
        item.tagName='section';item.properties.className=['route-group'];
        const label=item.children.find(n=>n.tagName==='p'),list=item.children.find(n=>n.tagName==='ul');
        item.properties['aria-label']=toText(label);label.tagName='h4';label.properties.className=['route-group-title'];
        list.properties.className=['route-chapters'];list.children=list.children.filter(n=>n.tagName==='li');
        visit(list,'element',link=>{if(link.tagName!=='a'||!/^#ch-(\d{2}|resources|tools|codex|claude-code)$/.test(link.properties.href??''))return;const chapter=link.properties.href.slice(1);link.properties.className=['route-chapter'];link.children=[el('span',{className:['route-icon'],'data-chapter':chapter}),el('span',{className:['route-title']},link.children),el('span',{className:['route-arrow']})];});
      }
    }
    if(chapter==='ch-tools'&&node.tagName==='ul'&&toText(node).includes('Codex —')){
      node.properties.className=['tool-cards'];
      visit(node,'element',link=>{if(link.tagName!=='a'||!['#ch-codex','#ch-claude-code'].includes(link.properties.href))return;const [name,...description]=toText(link).split(' — ');link.properties.className=['route-chapter','tool-card'];link.children=[el('span',{className:['route-icon'],'data-chapter':link.properties.href.slice(1)}),el('strong',{},[txt(name)]),el('span',{className:['tool-card-description']},[txt(description.join(' — '))]),el('span',{className:['route-arrow']})];});
    }
    if(['ch-codex','ch-claude-code'].includes(chapter)&&node.tagName==='blockquote'&&toText(node).trim().startsWith('Где найти:'))node.properties.className=['feature-facts'];
    if(node.tagName==='table') {const inner={...node,properties:{...node.properties,id:undefined}};node.tagName='div';node.properties.className=['table-scroll'];node.properties.tabIndex=0;node.properties.role='region';node.properties['aria-label']='Таблица; прокрутите по горизонтали при необходимости';node.children=[inner];}
    if(permalink&&/^h[23]$/.test(node.tagName)) node.children.push(el('a',{href:`#${id}`,className:['permalink'],'aria-label':`Ссылка на ${toText(node)}`},[txt('#')]));
  };
  for(const group of groups) {
    const chapter=group.chapter;let counter=counters[chapter]??1000;const outline=[];let title='';
    const entry=tabbed.get(chapter);let tab=entry?.lead;const tabOf=new Map();
    tables[chapter]=group.nodes.filter(n=>n.type==='table').map(n=>n.children.map(row=>row.children.map(toString)));
    const hast=await renderTree({type:'root',children:group.nodes});
    visit(hast,'element',n=>{if(n.tagName==='a' && /^ch-\d{2}$/.test(n.properties.id??'')) delete n.properties.id;});
    for(const node of hast.children) {
      if(node.type!=='element') continue;
      if(node.tagName==='h1') { node.tagName='p';node.properties.className=['source-title']; }
      const identity=`${chapter}:${node.tagName}:${toText(node).trim().replace(/\s+/g,' ')}`;
      let id=identities[identity]??`${chapter}-b${String(++counter).padStart(3,'0')}`;
      if(usedIds.has(id))id=`${chapter}-b${String(++counter).padStart(3,'0')}`;
      if(/^h[23]$/.test(node.tagName)) {
        if(node.tagName==='h2') {title=toText(node);id=chapter;}
        else {id=`${chapter}-${slug(toText(node))}`;let suffix=2;const base=id;while(usedIds.has(id)) id=`${base}-${suffix++}`;outline.push({id,title:toText(node)});}
      }
      node.properties.id=id;usedIds.add(id);
      if(entry&&node.tagName==='h3'){tab=entry.anchors[id];if(!tab)throw Error(`${chapter}: heading ${id} has no tab in src/content/url-map.json`);}
      if(entry)tabOf.set(node,node.tagName==='h2'?'heading':tab);
      transform(node,{chapter,id,title,tab:entry&&(node.tagName==='h2'?'overview':tab)});
    }
    counters[chapter]=counter;
    const root={type:'root',children:[]};const containers=[root];
    for(const node of hast.children){
      if(node.type==='comment'&&node.value.trim().startsWith('details:')){const detail=el('details',{className:['deep-dive','content-detail']},[el('summary',{},[txt(node.value.trim().slice(8).trim())])]);containers.at(-1).children.push(detail);containers.push(detail);}
      else if(node.type==='comment'&&node.value.trim()==='/details'){if(containers.length===1)throw Error('Unmatched disclosure');containers.pop();}
      else if(node.type!=='comment')containers.at(-1).children.push(node);
    }
    if(containers.length!==1)throw Error('Unclosed disclosure');hast.children=root.children;
    decorateProductLinks(hast);
    if(['ch-codex','ch-claude-code'].includes(chapter))visit(hast,'element',(node,index,parent)=>{
      if(node.tagName!=='p'||node.children.length!==1||node.children[0].tagName!=='img')return;
      const image=node.children[0],src=String(image.properties.src??'');if(!src.startsWith('/tools/'))return;
      const media=toolMedia[src];if(!media?.width||!media?.height)throw Error(`Screenshot metadata missing: ${src}`);
      Object.assign(image.properties,{loading:'lazy',decoding:'async',width:media.width,height:media.height,style:`max-width:${media.width}px;margin-inline:auto`});
      node.tagName='figure';node.properties.className=['feature-shot'];
      node.children=[el('a',{href:src,target:'_blank',rel:['noopener','noreferrer'],'aria-label':`Открыть скрин: ${image.properties.alt} — в новой вкладке`},[image])];
      const caption=parent.children.slice(index+1).find(n=>n.type==='element');
      if(caption?.tagName!=='p'||!toText(caption).trim().startsWith('Скрин:'))throw Error(`Screenshot caption missing: ${src}`);
      caption.tagName='figcaption';node.children.push(caption);parent.children.splice(parent.children.indexOf(caption),1);
    });
    // Trusted library SVG is added after source sanitization; source HTML cannot supply SVG.
    const html=finish(hast,chapter);
    if(chapter==='ch-00') {intro+=html;continue;}
    const compiled={id:chapter,number:chapter.slice(3),title,html,outline,path:chapterPath(chapter)};
    if(entry){
      // Each top-level block goes to exactly one tab; a disclosure must not span tabs.
      const parts=new Map(urlMap.tabs.map(item=>[item.id,[]]));let heading;let count=0;
      for(const node of hast.children){
        if(node.type!=='element')continue;
        const found=new Set();visit(node,'element',n=>{if(tabOf.has(n))found.add(tabOf.get(n));});
        if(found.size!==1)throw Error(`${chapter}: block ${node.properties.id??node.tagName} belongs to ${found.size?[...found].join(' and '):'no tab'}`);
        const target=[...found][0];count++;
        if(target==='heading')heading=node;else parts.get(target).push(node);
      }
      if(!heading||count!==hast.children.filter(node=>node.type==='element').length)throw Error(`${chapter}: tab split lost blocks`);
      compiled.heading=finish({type:'root',children:[heading]},chapter);compiled.overview=null;
      compiled.tabs=urlMap.tabs.map(item=>({id:item.id,html:finish({type:'root',children:parts.get(item.id)},chapter),outline:outline.filter(line=>entry.anchors[line.id]===item.id),panels:Object.entries(entry.anchors).filter(([key,value])=>key.endsWith('-panel')&&value===item.id).map(([key])=>key.slice(0,-'-panel'.length))}));
      audit.tabs.chapters++;audit.tabs.blocks+=count;
    }
    chapters.push(compiled);
  }
  // Overview layer (brief 8.2): content/overview/NN.md, same pipeline as the
  // original text, opened first on a tabbed chapter.
  for(const [number,text] of Object.entries(overviews).sort()){
    const chapter=`ch-${number}`,compiled=chapters.find(item=>item.id===chapter);
    if(!compiled?.tabs)throw Error(`content/overview/${number}.md: not a chapter with tabs in src/content/url-map.json`);
    const {meta,body}=parseOverview(number,text);
    const hast=await renderTree(body);let block=0;
    for(const node of hast.children){
      if(node.type!=='element')continue;
      const id=node.tagName==='h2'?`${chapter}-overview-${slug(toText(node))}`:`${chapter}-overview-b${String(++block).padStart(3,'0')}`;
      if(usedIds.has(id))throw Error(`content/overview/${number}.md: id ${id} is already used`);
      node.properties.id=id;usedIds.add(id);
      transform(node,{chapter,id,title:meta.title,tab:'overview',permalink:false,example:true});
    }
    decorateProductLinks(hast);
    const overview=compiled.tabs.find(item=>item.id==='overview');
    overview.html=finish(hast,chapter,false)+overview.html;
    compiled.overview={title:meta.title,minutes:Number(meta.minutes),ruleStrength:meta.rule_strength};
    audit.tabs.overviews++;
  }
  // Compact intro and orientation are separate source groups, both kept intact.
  const rich = (text,id,chapter) => {const node=el('p',{},[txt(text)]);annotate(node,{id,chapter});decorateProductLinks(node);return stringify({type:'root',children:[node]});};
  const panels=createPanels({tables,rich});
  const presentation={
    heading:rich(toString(tree.children.find(node=>node.type==='heading'&&node.depth===1)),'intro-heading','ch-00'),
    description:rich('Как работать с AI-агентами: задать границы, получить доказательства и сохранить контроль над результатом.','intro-description','ch-00'),
    subtitle:rich('Agentic Engineering / AI-Native Development','intro-subtitle','ch-00'),
    timeline:['Исправить findings и независимо проверить A','Интегрировать A только после authorization','Refresh B от нового main; сохранить оба ADR','Collision assessment + full validation B','Independent review актуального HEAD B','Интегрировать B после authorization и подтверждения checks'].map((text,i)=>rich(text,`timeline-${i}`,'ch-18'))
  };
  const html=intro+chapters.map(c=>`<section data-chapter="${c.id}">${c.html}</section>`).join('');
  audit.exceptions.push(...terms.map(term=>({block:`preview-${term.id}`,term:term.id,reason:'glossary definition reused in tooltip/panel; recursive annotation excluded'})));
  const auditSources=[html,...chapters.flatMap(c=>c.tabs?.filter(tab=>tab.id==='overview').map(tab=>tab.html)??[]),...terms.map(term=>`<div data-term="${term.id}">${term.definitionHtml}</div>`),...panels.flatMap(p=>[...p.choices.flatMap(c=>[c.html,c.titleHtml??'',c.evidenceHtml??'',c.ownerHtml??'']),...(p.scenarios??[]).map(s=>s.html)]),presentation.heading,presentation.description,presentation.subtitle,...presentation.timeline];
  let renderedLinked=0;const renderedGaps=[];
  for(const fragment of auditSources){
    const processor=unified().use(remarkParse).use(remarkRehype,{allowDangerousHtml:true}).use(rehypeRaw);
    const rendered=await processor.run(processor.parse(fragment));
    const inspect=(node,excluded=false)=>{
      if(node.type==='element'){
        if(node.tagName==='a'&&String(node.properties.href??'').startsWith('#term-'))renderedLinked++;
        excluded=excluded||['a','button','summary'].includes(node.tagName)||node.properties['data-chapter']==='ch-23'||node.properties['dataChapter']==='ch-23'||Boolean(node.properties['data-term']??node.properties.dataTerm)||Boolean(node.properties['data-raw-exception']??node.properties.dataRawException)||node.properties.className?.includes('diagram-source');
      }
      if(node.type==='text'&&!excluded)for(const match of matcher(node.value))renderedGaps.push({text:node.value,term:match.value});
      for(const child of node.children??[])inspect(child,excluded);
    };inspect(rendered);
  }
  audit.renderedLinked=renderedLinked;audit.renderedGaps=renderedGaps;
  const ids=[...html.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]);
  if(ids.length!==new Set(ids).size) throw Error(`Duplicate rendered IDs: ${[...new Set(ids.filter((id,i)=>ids.indexOf(id)!==i))].join(', ')}`);
  // Overview ids live only in the overview tab: link targets, not legacy anchors.
  const overviewHtml=chapters.filter(c=>c.overview).map(c=>[c,c.tabs.find(tab=>tab.id==='overview').html]);
  const overviewIds=new Map(overviewHtml.flatMap(([c,fragment])=>[...fragment.matchAll(/ id="([^"]+)"/g)].filter(m=>m[1].startsWith(`${c.id}-overview-`)).map(m=>[m[1],c.id])));
  // Markdown percent-encodes a Cyrillic fragment; ids are compared decoded.
  const decode=id=>{try{return decodeURIComponent(id);}catch{return id;}};
  for(const [,href] of [html,...overviewHtml.map(([,fragment])=>fragment)].join('').matchAll(/href="#([^"]+)"/g)){const target=decode(href);if(!ids.includes(target)&&!overviewIds.has(target)) throw Error(`Missing anchor ${target}`);}
  audit.unexplainedGaps=audit.ambiguous.length+renderedGaps.length;
  // A live chapter (url-map `live`: its tab pages are built) is read at its tab
  // addresses: anchors, links and search go to the tab that holds the id.
  const tabAddress=(entry,tab)=>{const segment=urlMap.tabs.find(item=>item.id===tab).segment;return segment?`${entry.new}/${segment}`:entry.new;};
  const live=new Map([...tabbed].filter(([,entry])=>entry.live));const liveIds=new Map();
  for(const chapter of chapters){
    const entry=live.get(chapter.id);if(!entry)continue;
    for(const [,id] of chapter.heading.matchAll(/ id="([^"]+)"/g))liveIds.set(id,tabAddress(entry,'overview'));
    for(const tab of chapter.tabs){for(const [,id] of tab.html.matchAll(/ id="([^"]+)"/g))liveIds.set(id,tabAddress(entry,tab.id));for(const panel of tab.panels)liveIds.set(`${panel}-panel`,tabAddress(entry,tab.id));}
  }
  const pathOf=(id,chapter)=>{if(!live.has(chapter))return chapterPath(chapter);if(!liveIds.has(id))throw Error(`${chapter}: ${id} is in no tab`);return liveIds.get(id);};
  const chapterHref=chapter=>live.get(chapter)?.new??chapterPath(chapter);
  for(const chapter of chapters)chapter.href=chapterHref(chapter.id);
  const anchors=Object.fromEntries(ids.map(id=>[id,{id,path:id.startsWith('term-')?'/glossary':pathOf(id,id.match(/ch-(?:\d{2}|resources|tools|codex|claude-code)/)?.[0]??'ch-00')}]));
  for(const panel of panels)anchors[`${panel.id}-panel`]={id:`${panel.id}-panel`,path:pathOf(`${panel.id}-panel`,panel.chapter)};
  const targets={...anchors,...Object.fromEntries([...overviewIds].map(([id,chapter])=>[id,{id,path:pathOf(id,chapter)}]))};
  const routeLinks=fragment=>fragment.replace(/href="#([^"]+)"/g,(_,id)=>`href="${targets[decode(id)]?.path??'/'}#${id}"`);
  intro=routeLinks(intro);for(const chapter of chapters){chapter.html=routeLinks(chapter.html);if(chapter.tabs){chapter.heading=routeLinks(chapter.heading);for(const tab of chapter.tabs)tab.html=routeLinks(tab.html);}}
  for(const entry of search)entry.path=live.has(entry.chapter)?tabAddress(live.get(entry.chapter),entry.tab):chapterPath(entry.chapter);
  for(const panel of panels){for(const choice of panel.choices){choice.html=routeLinks(choice.html);choice.titleHtml=routeLinks(choice.titleHtml??'');if(choice.evidenceHtml)choice.evidenceHtml=routeLinks(choice.evidenceHtml);if(choice.ownerHtml)choice.ownerHtml=routeLinks(choice.ownerHtml);if(choice.chapter)choice.path=chapterHref(choice.chapter);}for(const scenario of panel.scenarios??[])scenario.html=routeLinks(scenario.html);}
  for(const key of ['heading','description','subtitle'])presentation[key]=routeLinks(presentation[key]);presentation.timeline=presentation.timeline.map(routeLinks);
  const finalHtml=intro+chapters.map(c=>`<section data-chapter="${c.id}">${c.html}</section>`).join('');
  if(/ai-artefacts|AI Artefacts|chatgpt-conversation:|PR #\d|TICKET-\d/.test(JSON.stringify({finalHtml,search,panels,presentation})))throw Error('Private provenance in publication');
  for(const fragment of [finalHtml,...chapters.flatMap(c=>c.tabs?[c.heading,...c.tabs.map(tab=>tab.html)]:[]),...panels.flatMap(p=>p.choices.map(c=>c.html))])for(const [,path,target]of fragment.matchAll(/href="([^"#]*)#([^"]+)"/g))if(!targets[decode(target)]||targets[decode(target)].path!==path)throw Error(`Invalid route target: ${path}#${target}`);
  // Drills (P7-03): every card links to a paragraph of its chapter, at the tab that holds it.
  if(drillInputs.length&&!drillSchema)throw Error('Drills need content/gamification/schema/drill.schema.json');
  const drills=compileDrills(drillInputs,drillSchema??{},id=>targets[id]?.path);
  const levelNames=levels?Object.fromEntries(LEVELS.map(level=>[level,levels.names[level].trim()])):null;
  return {html:finalHtml,intro,chapters,terms,topics,levels:levelNames,search,diagrams,blocks,panels,presentation,anchors,drills,audit};
}
