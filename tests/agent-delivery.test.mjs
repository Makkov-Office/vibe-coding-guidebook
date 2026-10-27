// Agent delivery (P8-03): the archive holds exactly agent-pack/, byte for byte and reproducibly;
// llms.txt follows https://llmstxt.org (checked 27.10.2026); every page has its Markdown.
// Reads the outputs of `npm run content` (scripts/agent-delivery.mjs), which runs before tests.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {splitPages,packFiles,zip,crc32,mdPath,SITE_ORIGIN} from '../scripts/agent-delivery.mjs';

const archive=fs.readFileSync('public/agent-pack.zip');
const pack=JSON.parse(fs.readFileSync('src/content/agent-pack.json','utf8'));
const generated=JSON.parse(fs.readFileSync('src/content/generated.json','utf8'));

// Minimal reader: end of central directory → central entries → local headers (stored only).
function unzip(buffer){
  const end=buffer.lastIndexOf(Buffer.from([0x50,0x4b,0x05,0x06]));
  assert.ok(end>=0,'no end of central directory');
  const count=buffer.readUInt16LE(end+10);let at=buffer.readUInt32LE(end+16);const entries=[];
  for(let i=0;i<count;i++){
    assert.equal(buffer.readUInt32LE(at),0x02014b50);
    const method=buffer.readUInt16LE(at+10),crc=buffer.readUInt32LE(at+16),size=buffer.readUInt32LE(at+24),nameLength=buffer.readUInt16LE(at+28),extra=buffer.readUInt16LE(at+30),comment=buffer.readUInt16LE(at+32);
    const mode=buffer.readUInt32LE(at+38)>>>16,offset=buffer.readUInt32LE(at+42),name=buffer.toString('utf8',at+46,at+46+nameLength);
    assert.equal(method,0,`${name}: stored`);
    const start=offset+30+buffer.readUInt16LE(offset+26)+buffer.readUInt16LE(offset+28),data=buffer.subarray(start,start+size);
    assert.equal(crc32(data),crc,`${name}: crc`);
    entries.push({name,data,mode});at+=46+nameLength+extra+comment;
  }
  return entries;
}

test('archive contains exactly the files of agent-pack/, byte for byte, hooks executable',()=>{
  const entries=unzip(archive),files=packFiles();
  assert.deepEqual(entries.map(e=>e.name),files.map(f=>`agent-pack/${f.path}`));
  for(const [i,f] of files.entries()){
    assert.ok(entries[i].data.equals(f.data),f.path);
    assert.equal(entries[i].mode,f.executable?0o100755:0o100644,f.path);
  }
  assert.ok(files.some(f=>f.executable&&f.path.startsWith('claude/hooks/')),'hooks keep the executable bit');
  assert.deepEqual(pack.files,files.map(f=>({path:f.path,size:f.data.length})));
  assert.equal(pack.zip.size,archive.length);
});

test('archive is reproducible: same files give the same bytes',()=>{
  const again=zip(packFiles().map(f=>({name:`agent-pack/${f.path}`,data:f.data,executable:f.executable})));
  assert.ok(again.equals(archive));
});

test('llms.txt follows the llmstxt.org format and every link resolves',()=>{
  const text=fs.readFileSync('public/llms.txt','utf8'),lines=text.split('\n');
  assert.match(lines[0],/^# \S/,'H1 first');
  assert.equal(lines.filter(l=>/^# /.test(l)).length,1,'one H1');
  assert.match(lines[2],/^> \S/,'summary quote after the H1');
  const firstH2=lines.findIndex(l=>/^## /.test(l));
  assert.ok(lines.slice(1,firstH2).every(l=>!/^#/.test(l)),'no headings before the file lists');
  const h2=lines.filter(l=>/^## /.test(l));
  assert.equal(h2.at(-1),'## Optional','Optional is the last section');
  for(const line of lines.slice(firstH2).filter(l=>l&&!/^## /.test(l))){
    const item=line.match(/^- \[([^\]]+)\]\((\S+)\)(: .+)?$/);
    assert.ok(item,`file list item: ${line}`);
    assert.ok(item[2].startsWith(`${SITE_ORIGIN}/`),item[2]);
    const local=item[2].slice(SITE_ORIGIN.length);
    assert.ok(local==='/agents'||fs.existsSync(`public${local}`),`${local} exists`);
  }
  for(const chapter of generated.chapters)assert.ok(text.includes(`${SITE_ORIGIN}${mdPath(chapter.path)})`),`${chapter.id} listed`);
  assert.ok(text.includes(`${SITE_ORIGIN}/index.md)`),'introduction listed');
  const full=fs.readFileSync('public/llms-full.txt','utf8');
  assert.ok(full.startsWith(lines[0])&&full.endsWith(fs.readFileSync('content/handbook.md','utf8')),'llms-full.txt is the header plus the whole handbook');
});

test('every page has its Markdown, at the current and the old address',()=>{
  const map=JSON.parse(fs.readFileSync('src/content/url-map.json','utf8'));
  for(const chapter of [...generated.chapters,{id:'ch-00',path:'/'}]){
    const file=pack.markdown[chapter.id];
    assert.equal(file,mdPath(chapter.path),chapter.id);
    assert.ok(fs.existsSync(`public${file}`),file);
    for(const entry of map.pages.filter(e=>e.chapter===chapter.id&&!e.alias))assert.ok(fs.existsSync(`public${mdPath(entry.old)}`),`${entry.old}.md`);
  }
  const chapter08=fs.readFileSync('public/chapters/08.md','utf8');
  assert.match(chapter08,/^## 08\. /);assert.ok(!/\n## 09\./.test(chapter08),'chapter 08 stops before 09');
});

test('split covers every chapter heading and fails closed on an unknown one',()=>{
  const chapters=[{id:'ch-01',title:'01. A',path:'/chapters/01'}];
  const pages=splitPages('# T\n\n## 00. Intro\n\ntext\n\n---\n\n<a id="ch-01"></a>\n## 01. A\n\n```md\n## not a chapter\n```\n',chapters);
  assert.deepEqual(pages.map(p=>p.id),['ch-00','ch-01']);
  assert.equal(pages[0].markdown,'# T\n\n## 00. Intro\n\ntext\n');
  assert.match(pages[1].markdown,/## not a chapter/);
  assert.throws(()=>splitPages('## 00. Intro\n\n## Unknown\n',chapters),/not a chapter/);
  assert.throws(()=>splitPages('## 00. Intro\n',chapters),/no Markdown for ch-01/);
});

test('the pack points agents to the handbook, so [Hnn.m] resolves outside this repository',()=>{
  const readme=fs.readFileSync('agent-pack/README.md','utf8');
  assert.ok(readme.includes(`${SITE_ORIGIN}/chapters/08.md`));
  assert.ok(readme.includes('/llms.txt'));
});
