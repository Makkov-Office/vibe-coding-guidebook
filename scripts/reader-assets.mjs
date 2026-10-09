import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const data=JSON.parse(await fs.readFile('src/content/generated.json','utf8'));
const diagrams=JSON.parse(await fs.readFile('src/content/diagram-assets.json','utf8'));
function images(html){return html.replace(/<figure[^>]*data-diagram="([^"]+)"[^>]*>[\s\S]*?<\/figure>/g,(all,id)=>{const asset=diagrams[id];if(!asset?.src)return all.replace('<details class="diagram-source">','<p class="diagram-diagnostic">Схема доступна в текстовом формате.</p><details open class="diagram-source">');return all.replace('class="mermaid-figure','class="mermaid-figure diagram-ready').replace(/(<div class="diagram-render"[^>]*>)(<\/div>)/,`$1<img src="${asset.src}" alt="" loading="lazy" decoding="async"/>$2`);});}
data.html=images(data.html);data.intro=images(data.intro);for(const chapter of data.chapters)chapter.html=images(chapter.html);
await fs.writeFile('src/content/generated.json',JSON.stringify(data));
await fs.mkdir('public/data',{recursive:true});
const manifest={};
for(const key of ['search','anchors']){const json=JSON.stringify(data[key]);const hash=createHash('sha256').update(json).digest('hex').slice(0,16);const name=`${key}-${hash}.json`;await fs.writeFile(`public/data/${name}`,json);manifest[key]=`/data/${name}`;}
await fs.writeFile('src/content/reader-assets.json',JSON.stringify(manifest));
console.log('Lazy reader assets prepared; static diagram HTML generated.');
