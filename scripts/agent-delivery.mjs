// Agent delivery (P8-03, brief §11.3): everything an AI agent takes from the site, built from
// content/ and agent-pack/ in `npm run content`:
//   public/<page>.md          Markdown of each page (llms.txt convention: page address + .md, "/" → /index.md)
//   public/llms.txt           map for LLMs (https://llmstxt.org), public/llms-full.txt the whole text
//   public/agent-pack.zip     agent-pack/ as one archive: stored (no compression), sorted, fixed dates,
//                             so the same files give the same bytes on any machine and Node version
//   src/content/agent-pack.json  what /agents shows: README as HTML, file list, archive size
// The public/ outputs are build artifacts (.gitignore); agent-pack.json is committed like generated.json.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {unified} from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import {loadUrlMap} from './url-map.mjs';
import {INTRO_PATH} from '../src/content/compiler.mjs';

// Canonical address of the site: llms.txt and the pack point here, so that a file pasted into an
// agent elsewhere still resolves. Changes together with the domain (P4-05).
export const SITE_ORIGIN='https://vibe-coding-guidebook-ivory.vercel.app';
const PACK='agent-pack',ZIP='/agent-pack.zip';

/** Markdown of every page: the handbook split at its chapter headings, the top-level `##` of the
 *  CommonMark tree (so a `##` inside code, a quote or a list never starts a page). */
export function splitPages(source,chapters){
  const lines=source.split('\n');
  const starts=unified().use(remarkParse).use(remarkGfm).parse(source).children.filter(node=>node.type==='heading'&&node.depth===2).map(node=>node.position.start.line-1);
  const byTitle=new Map(chapters.map(c=>[c.title,c])),seen=new Set();
  const pages=[];
  starts.forEach((start,i)=>{
    const title=lines[start].replace(/^##\s+/,'').trim();
    // The introduction (ch-00, at /start/00-how-to-read since P4-01) also carries the handbook title above it.
    const chapter=/^00\. /.test(title)?{id:'ch-00',title,path:INTRO_PATH}:byTitle.get(title);
    if(!chapter)throw Error(`agent-delivery: heading "${title}" is not a chapter of generated.json`);
    if(seen.has(chapter.id))throw Error(`agent-delivery: chapter ${chapter.id} appears twice`);
    seen.add(chapter.id);
    const from=i===0?0:start,body=lines.slice(from,starts[i+1]??lines.length);
    // The rule and HTML anchor before the next heading belong to the next chapter.
    while(body.length&&/^(---|<a id="[^"]+"><\/a>|\s*)$/.test(body.at(-1)))body.pop();
    // Site links become absolute, so the text still leads somewhere once pasted into an agent.
    pages.push({id:chapter.id,title:chapter.title,path:chapter.path,file:mdPath(chapter.path),markdown:`${body.join('\n').replace(/\]\(\/(?!\/)/g,`](${SITE_ORIGIN}/`)}\n`});
  });
  const missing=chapters.filter(c=>!pages.some(p=>p.id===c.id));
  if(missing.length)throw Error(`agent-delivery: no Markdown for ${missing.map(c=>c.id).join(', ')}`);
  return pages;
}
export const mdPath=pagePath=>pagePath==='/'?'/index.md':`${pagePath}.md`;

/** llms.txt: H1, summary quote, a note, then H2 file lists; secondary links go under "Optional". */
export function llmsText(pages,urlMap,pack){
  const url=p=>`${SITE_ORIGIN}${p}`,link=p=>`- [${p.title}](${url(p.file)})`;
  const sectionOf=new Map(urlMap.pages.filter(e=>e.chapter).map(e=>[e.chapter,e.section]));
  const brand=fs.readFileSync('src/design/brand.ts','utf8').match(/brandTitle='([^']+)'/)?.[1];
  if(!brand)throw Error('agent-delivery: brandTitle not found in src/design/brand.ts');
  // The summary is the handbook's own lead quote (before the first chapter), not text written here.
  const summary=fs.readFileSync('content/handbook.md','utf8').split(/^## /m)[0].match(/^> (.+)$/m)?.[1];
  if(!summary)throw Error('agent-delivery: no lead quote in content/handbook.md');
  const out=[`# ${brand}`,'',`> ${summary}`,'',
    `Каждая страница есть в Markdown: адрес страницы + \`.md\` (у глав с табами — адрес главы + \`.md\`, один файл на всю главу), вводная глава — \`${INTRO_PATH}.md\`. Ссылки вида \`[H08.2]\` в Agent Pack ведут на главу 08, раздел 8.2.`,'',
    '## Agent Pack','',
    `- [Agent Pack (.zip)](${url(ZIP)}): ${pack.files.length} файлов — AGENTS.md, CLAUDE.md, skills, JSON Schema, hooks для Claude Code`,
    `- [Agent Pack: что внутри и как подключить](${url('/agents')})`,''];
  const optional=new Set(['ch-23','ch-resources']);
  // Sections in rail order, then the reference outside the rail.
  for(const section of urlMap.sections.filter(s=>(s.rail&&s.id!=='home'&&s.id!=='agents')||s.id==='reference')){
    const list=pages.filter(p=>!optional.has(p.id)&&sectionOf.get(p.id)===section.id);
    if(list.length)out.push(`## ${section.label}`,'',...list.map(link),'');
  }
  out.push('## Optional','',...pages.filter(p=>optional.has(p.id)).map(link),`- [Полный текст руководства](${url('/llms-full.txt')})`,'');
  const listed=out.join('\n');
  const absent=pages.filter(p=>!listed.includes(`(${url(p.file)})`));
  if(absent.length)throw Error(`agent-delivery: llms.txt does not list ${absent.map(p=>p.id).join(', ')}`);
  return listed;
}

// --- Deterministic ZIP (PKWARE APPNOTE 6.3: local headers, stored entries, central directory) ---
const CRC=Array.from({length:256},(_,n)=>{let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
export function crc32(buffer){let c=0xffffffff;for(const byte of buffer)c=CRC[(c^byte)&0xff]^(c>>>8);return (c^0xffffffff)>>>0;}
// 2026-01-01 00:00 in MS-DOS format; one date for every entry keeps the archive reproducible.
const DOS_TIME=0,DOS_DATE=((2026-1980)<<9)|(1<<5)|1;
export function zip(entries){
  const locals=[],centrals=[];let offset=0;
  for(const {name,data,executable} of entries){
    const nameBytes=Buffer.from(name,'utf8'),crc=crc32(data);
    const local=Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50,0);local.writeUInt16LE(20,4);local.writeUInt16LE(0x0800,6);local.writeUInt16LE(0,8);
    local.writeUInt16LE(DOS_TIME,10);local.writeUInt16LE(DOS_DATE,12);local.writeUInt32LE(crc,14);
    local.writeUInt32LE(data.length,18);local.writeUInt32LE(data.length,22);local.writeUInt16LE(nameBytes.length,26);local.writeUInt16LE(0,28);
    const central=Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50,0);central.writeUInt16LE((3<<8)|20,4);central.writeUInt16LE(20,6);central.writeUInt16LE(0x0800,8);central.writeUInt16LE(0,10);
    central.writeUInt16LE(DOS_TIME,12);central.writeUInt16LE(DOS_DATE,14);central.writeUInt32LE(crc,16);
    central.writeUInt32LE(data.length,20);central.writeUInt32LE(data.length,24);central.writeUInt16LE(nameBytes.length,28);
    // Unix mode in the high half of the external attributes: hooks stay executable after unzip.
    central.writeUInt32LE(((executable?0o100755:0o100644)<<16)>>>0,38);central.writeUInt32LE(offset,42);
    locals.push(local,nameBytes,data);centrals.push(central,nameBytes);
    offset+=local.length+nameBytes.length+data.length;
  }
  const directory=Buffer.concat(centrals),end=Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(entries.length,8);end.writeUInt16LE(entries.length,10);
  end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);
  return Buffer.concat([...locals,directory,end]);
}

/** Files of agent-pack/, sorted by path; fails on anything that is not a plain file or directory. */
export function packFiles(root=PACK){
  const files=[];
  const walk=dir=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:0)){
    const file=path.join(dir,entry.name);
    if(entry.isDirectory())walk(file);
    else if(entry.isFile())files.push({path:path.relative(root,file).split(path.sep).join('/'),data:fs.readFileSync(file),executable:(fs.statSync(file).mode&0o111)!==0});
    else throw Error(`agent-delivery: ${file} is not a regular file`);
  }};
  walk(root);
  return files;
}

async function main(){
  const generated=JSON.parse(fs.readFileSync('src/content/generated.json','utf8'));
  // A live chapter (P5-02b) has its new address in href; its Markdown follows it.
  const chapters=generated.chapters.map(({id,title,path,href})=>({id,title,path:href??path}));
  const pages=splitPages(fs.readFileSync('content/handbook.md','utf8'),chapters);
  // A page's Markdown also stays at its old address from the URL map, so links like
  // /chapters/08.md in the pack keep working after the page moves (P5).
  const urlMap=loadUrlMap();
  for(const page of pages){
   const olds=urlMap.pages.filter(e=>e.chapter===page.id&&!e.alias).map(e=>mdPath(e.old));
   for(const target of new Set([page.file,...olds])){const file=path.join('public',target);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,page.markdown);}
  }
  const files=packFiles();
  const archive=zip(files.map(f=>({name:`${PACK}/${f.path}`,data:f.data,executable:f.executable})));
  fs.writeFileSync('public/agent-pack.zip',archive);
  const readme=fs.readFileSync(path.join(PACK,'README.md'),'utf8').replace(/^# .*\n+/,'');
  const html=String(await unified().use(remarkParse).use(remarkGfm).use(remarkRehype).use(rehypeStringify).process(readme));
  // Tables scroll inside their own frame, as in the handbook (compiler: .table-scroll).
  const readmeHtml=html.replaceAll('<table>','<div class="table-scroll"><table>').replaceAll('</table>','</table></div>');
  const pack={zip:{href:ZIP,size:archive.length},files:files.map(f=>({path:f.path,size:f.data.length})),readmeHtml,markdown:Object.fromEntries(pages.map(p=>[p.id,p.file]))};
  fs.writeFileSync('src/content/agent-pack.json',`${JSON.stringify(pack,null,1)}\n`);
  const llms=llmsText(pages,urlMap,pack);
  fs.writeFileSync('public/llms.txt',llms);
  fs.writeFileSync('public/llms-full.txt',`${llms.split('\n## ')[0].trim()}\n\n${fs.readFileSync('content/handbook.md','utf8')}`);
  console.log(JSON.stringify({pages:pages.length,packFiles:files.length,zipBytes:archive.length}));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
