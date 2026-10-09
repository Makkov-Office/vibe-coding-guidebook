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
const iconMarkup=name=>renderToStaticMarkup(createElement(icons[name],iconProps));

const el = (tagName, properties={}, children=[]) => ({type:'element',tagName,properties,children});
const txt = value => ({type:'text',value});
export const normalize = s => s.normalize('NFKC').toLocaleLowerCase('ru').replaceAll('ё','е');
export const chapterPath = id => id==='ch-00'?'/':id==='ch-23'?'/glossary':id==='ch-resources'?'/resources':`/chapters/${id.slice(3)}`;
export function previewKind(definition, structured=false){return !structured && [...definition.trim().replace(/\s+/g,' ')].length<=160?'tooltip':'panel';}
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

export async function compileHandbook(source) {
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
      terms.push({id,label,aliases:variants,topic,definition,definitionHtml:'',previewKind:previewKind(definition,row.children[1].children.some(n=>!['text','strong','emphasis','inlineCode','link','break'].includes(n.type)))});
    }
  }
  const matcher=makeMatcher(terms);
  const audit={topics:topics.length,definitions:terms.length,recognized:0,linked:0,exceptions:[],ambiguous:[],unexplainedGaps:0};
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
    const schema={...defaultSchema,clobberPrefix:'',attributes:{...defaultSchema.attributes,'*':[...(defaultSchema.attributes['*']??[]),'id']},protocols:{...defaultSchema.protocols,href:[...(defaultSchema.protocols.href??[]),'chatgpt-conversation']}};
    return unified().use(remarkRehype,{allowDangerousHtml:true}).use(rehypeRaw).use(rehypeSanitize,schema).run(md);
  };
  const stringify = node => unified().use(rehypeStringify).stringify(node);
  const chapters=[];const search=[];const diagrams=[];const blocks=[];const tables={};let intro='';let current='ch-00';let offset=0;let exercise=0;
  const groups=[];let nodes=[];
  for(const node of tree.children) {
    if(node.type==='html' && /^<a id="ch-\d{2}"><\/a>$/.test(node.value.trim())) continue;
    if(node.type==='heading' && node.depth===2 && (/^\d{2}\./.test(toString(node)) || toString(node)==='Полезные материалы')) {
      if(nodes.length) groups.push({chapter:current,nodes});
      current=toString(node)==='Полезные материалы'?'ch-resources':`ch-${toString(node).slice(0,2)}`; nodes=[];
    }
    nodes.push(node);
  }
  if(nodes.length) groups.push({chapter:current,nodes});
  const usedIds=new Set();const counters={};
  for(const group of groups) {
    const chapter=group.chapter;let counter=counters[chapter]??1000;const outline=[];let title='';
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
          node.tagName='details';node.properties.className=['deep-dive'];node.children=[el('summary',{},[txt(`Открыть ${language==='text'?'промпт / контракт':'учебный пример'}`)]),block];
        }
        search.push({id,chapter,title:title||'Ориентация',type:language==='mermaid'?'схема':'пример',text:raw});
        continue;
      }
      if(chapter==='ch-23' && node.tagName==='table') {
        const rows=node.children.find(n=>n.tagName==='tbody')?.children.filter(n=>n.tagName==='tr')??[];
        node.tagName='div';node.properties.className=['glossary-list'];node.children=[];
        for(const row of rows) {
          const cells=row.children.filter(n=>n.tagName==='td');const anchor=cells[0]?.children.find(n=>n.tagName==='a');const term=terms.find(t=>t.id===anchor?.properties.id);if(!term) continue;
          cells[0].children=cells[0].children.filter(n=>n!==anchor);
          const card=el('article',{id:term.id,tabIndex:-1,className:['term-definition'],'data-topic':term.topic,'data-term':term.id},[el('h4',{},cells[0].children),el('p',{},cells[1].children)]);
          term.definitionHtml=stringify(el('p',{},cells[1].children));
          node.children.push(card);usedIds.add(term.id);
          search.push({id:term.id,chapter,title:term.label,type:'термин',text:`${term.label} ${term.aliases.join(' ')} ${term.definition}`});
        }
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
        }else{const text=toText(node);if(text.trim()) search.push({id,chapter,title:title||'Ориентация',type:/^h/.test(node.tagName)?'заголовок':'текст',text});}
      }
      if(chapter==='ch-00'&&node.tagName==='ul'&&node.children.filter(n=>n.tagName==='li').every(item=>item.children.some(n=>n.tagName==='ul')&&item.children.some(n=>n.tagName==='p'&&n.children.some(c=>c.tagName==='strong')))){
        node.tagName='nav';node.properties.className=['home-route'];node.properties['aria-label']='Маршрут по главам';
        node.children=node.children.filter(n=>n.tagName==='li');
        for(const item of node.children){
          item.tagName='section';item.properties.className=['route-group'];
          const label=item.children.find(n=>n.tagName==='p'),list=item.children.find(n=>n.tagName==='ul');
          item.properties['aria-label']=toText(label);label.tagName='h4';label.properties.className=['route-group-title'];
          list.properties.className=['route-chapters'];list.children=list.children.filter(n=>n.tagName==='li');
          visit(list,'element',link=>{if(link.tagName!=='a'||!/^#ch-(\d{2}|resources)$/.test(link.properties.href??''))return;const chapter=link.properties.href.slice(1);link.properties.className=['route-chapter'];link.children=[el('span',{className:['route-icon'],'data-chapter':chapter}),el('span',{className:['route-title']},link.children),el('span',{className:['route-arrow']})];});
        }
      }
      if(node.tagName==='table') {const inner={...node,properties:{...node.properties,id:undefined}};node.tagName='div';node.properties.className=['table-scroll'];node.properties.tabIndex=0;node.properties.role='region';node.properties['aria-label']='Таблица; прокрутите по горизонтали при необходимости';node.children=[inner];}
      if(/^h[23]$/.test(node.tagName)) node.children.push(el('a',{href:`#${id}`,className:['permalink'],'aria-label':`Ссылка на ${toText(node)}`},[txt('#')]));
    }
    counters[chapter]=counter;
    const root={type:'root',children:[]};const containers=[root];
    for(const node of hast.children){
      if(node.type==='comment'&&node.value.trim().startsWith('details:')){const detail=el('details',{className:['deep-dive','content-detail']},[el('summary',{},[txt(node.value.trim().slice(8).trim())])]);containers.at(-1).children.push(detail);containers.push(detail);}
      else if(node.type==='comment'&&node.value.trim()==='/details'){if(containers.length===1)throw Error('Unmatched disclosure');containers.pop();}
      else containers.at(-1).children.push(node);
    }
    if(containers.length!==1)throw Error('Unclosed disclosure');hast.children=root.children;
    // Trusted library SVG is added after source sanitization; source HTML cannot supply SVG.
    const html=stringify(hast)
      .replace(/(<h2\b[^>]*>)/,`$1${iconMarkup(chapterIcons[chapter]??'book')}`)
      .replace(/(<h3\b[^>]*>)/g,chapter==='ch-23'?`$1${iconMarkup('tags')}`:'$1')
      .replace(/<summary>/g,`<summary>${iconMarkup('chevronRight')}`)
      .replace(/<span class="route-icon" data-chapter="([^"]+)"><\/span>/g,(_,id)=>`<span class="route-icon">${iconMarkup(chapterIcons[id]??'book')}</span>`)
      .replace(/<span class="route-arrow"><\/span>/g,`<span class="route-arrow">${iconMarkup('arrowRight')}</span>`);
    if(chapter==='ch-00') intro+=html;
    else chapters.push({id:chapter,number:chapter.slice(3),title,html,outline,path:chapterPath(chapter)});
  }
  // Compact intro and orientation are separate source groups, both kept intact.
  const rich = (text,id,chapter) => {const node=el('p',{},[txt(text)]);annotate(node,{id,chapter});return stringify({type:'root',children:[node]});};
  const panels=createPanels({tables,rich});
  const presentation={
    heading:rich(toString(tree.children.find(node=>node.type==='heading'&&node.depth===1)),'intro-heading','ch-00'),
    description:rich('Как работать с AI-агентами: задать границы, получить доказательства и сохранить контроль над результатом.','intro-description','ch-00'),
    subtitle:rich('Agentic Engineering / AI-Native Development','intro-subtitle','ch-00'),
    timeline:['Исправить findings и независимо проверить A','Интегрировать A только после authorization','Refresh B от нового main; сохранить оба ADR','Collision assessment + full validation B','Independent review актуального HEAD B','Интегрировать B после authorization и подтверждения checks'].map((text,i)=>rich(text,`timeline-${i}`,'ch-18'))
  };
  const html=intro+chapters.map(c=>`<section data-chapter="${c.id}">${c.html}</section>`).join('');
  audit.exceptions.push(...terms.map(term=>({block:`preview-${term.id}`,term:term.id,reason:'glossary definition reused in tooltip/panel; recursive annotation excluded'})));
  const auditSources=[html,...terms.map(term=>`<div data-term="${term.id}">${term.definitionHtml}</div>`),...panels.flatMap(p=>[...p.choices.flatMap(c=>[c.html,c.titleHtml??'',c.evidenceHtml??'',c.ownerHtml??'']),...(p.scenarios??[]).map(s=>s.html)]),presentation.heading,presentation.description,presentation.subtitle,...presentation.timeline];
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
  for(const [,target] of html.matchAll(/href="#([^"]+)"/g)) if(!ids.includes(target)) throw Error(`Missing anchor ${target}`);
  audit.unexplainedGaps=audit.ambiguous.length+renderedGaps.length;
  const anchors=Object.fromEntries(ids.map(id=>[id,{id,path:id.startsWith('term-')?'/glossary':chapterPath(id.match(/ch-(?:\d{2}|resources)/)?.[0]??'ch-00')}]));
  for(const panel of panels)anchors[`${panel.id}-panel`]={id:`${panel.id}-panel`,path:chapterPath(panel.chapter)};
  const routeLinks=fragment=>fragment.replace(/href="#([^"]+)"/g,(_,id)=>`href="${anchors[id]?.path??'/'}#${id}"`);
  intro=routeLinks(intro);for(const chapter of chapters)chapter.html=routeLinks(chapter.html);
  for(const entry of search)entry.path=chapterPath(entry.chapter);
  for(const panel of panels){for(const choice of panel.choices){choice.html=routeLinks(choice.html);choice.titleHtml=routeLinks(choice.titleHtml??'');if(choice.evidenceHtml)choice.evidenceHtml=routeLinks(choice.evidenceHtml);if(choice.ownerHtml)choice.ownerHtml=routeLinks(choice.ownerHtml);if(choice.chapter)choice.path=chapterPath(choice.chapter);}for(const scenario of panel.scenarios??[])scenario.html=routeLinks(scenario.html);}
  for(const key of ['heading','description','subtitle'])presentation[key]=routeLinks(presentation[key]);presentation.timeline=presentation.timeline.map(routeLinks);
  const finalHtml=intro+chapters.map(c=>`<section data-chapter="${c.id}">${c.html}</section>`).join('');
  if(/ai-artefacts|AI Artefacts|chatgpt-conversation:|PR #\d|TICKET-\d/.test(JSON.stringify({finalHtml,search,panels,presentation})))throw Error('Private provenance in publication');
  for(const fragment of [finalHtml,...panels.flatMap(p=>p.choices.map(c=>c.html))])for(const [,path,target]of fragment.matchAll(/href="([^"#]*)#([^"]+)"/g))if(!anchors[target]||anchors[target].path!==path)throw Error(`Invalid route target: ${path}#${target}`);
  return {html:finalHtml,intro,chapters,terms,topics,search,diagrams,blocks,panels,presentation,anchors,audit};
}
