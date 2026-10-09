import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {renderMermaid} from '@mermaid-js/mermaid-cli';

const require=createRequire(import.meta.resolve('@mermaid-js/mermaid-cli'));
const puppeteer=require('puppeteer');
const config={startOnLoad:false,securityLevel:'strict',htmlLabels:false,theme:'dark',flowchart:{htmlLabels:false},themeVariables:{primaryColor:'#141516',primaryTextColor:'#f7f8f8',lineColor:'#8a8f98',fontFamily:'Arial, sans-serif'}};
const root=new URL('../',import.meta.url),directory=new URL('public/diagrams/',root),manifestUrl=new URL('src/content/diagram-assets.json',root);
const {diagrams}=JSON.parse(await readFile(new URL('src/content/generated.json',root),'utf8'));
await mkdir(directory,{recursive:true});
let previous={};try{previous=JSON.parse(await readFile(manifestUrl,'utf8'));}catch{}
let browser;const manifest={},started=Date.now();
function validate(svg){
 if(!svg.includes('<svg')||/<(?:script|foreignObject|iframe|image|a)\b|\bon[a-z]+\s*=|(?:href|xlink:href)\s*=\s*["'](?!#)|url\(\s*["']?(?!#)|@import/i.test(svg))throw new Error('SVG contains unsupported active or external content');
 return svg;
}
try{
 for(const diagram of diagrams){
  const hash=createHash('sha256').update(JSON.stringify({source:diagram.source,config,renderer:'mermaid-cli-12'})).digest('hex').slice(0,16),name=`${diagram.id}-${hash}.svg`,file=new URL(name,directory),src=`/diagrams/${name}`;
  try{
   if(previous[diagram.id]?.src===src){await access(file);validate(await readFile(file,'utf8'));manifest[diagram.id]=previous[diagram.id];continue;}
   if(!browser){const chrome=process.env.MERMAID_CHROME_PATH??(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined);browser=await puppeteer.launch({headless:true,...(chrome?{executablePath:chrome}:{})});}
   const {data}=await renderMermaid(browser,diagram.source,'svg',{backgroundColor:'transparent',mermaidConfig:config,fontEmbed:false,svgId:diagram.id});
   const svg=validate(Buffer.from(data).toString('utf8'));await writeFile(file,svg);manifest[diagram.id]={src,bytes:Buffer.byteLength(svg)};
  }catch(error){manifest[diagram.id]={error:'Схема доступна в текстовом формате.'};console.warn(`Diagram ${diagram.id}: ${error.message}`);}
 }
}finally{await browser?.close();}
await writeFile(manifestUrl,JSON.stringify(manifest,null,2)+'\n');
console.log(`Diagram assets: ${Object.values(manifest).filter(x=>x.src).length}/${diagrams.length}, ${Date.now()-started} ms`);
