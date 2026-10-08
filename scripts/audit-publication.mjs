import fs from 'node:fs';
import path from 'node:path';
const forbidden=/Makkov-design\/ai-artefacts|AI Artefacts|chatgpt-conversation:|Codex implementation prompt|## 17\. README и handoff|Конец учебного руководства/;
let scanned=0;
function inspect(directory){for(const entry of fs.readdirSync(directory,{withFileTypes:true})){const file=path.join(directory,entry.name);if(entry.isDirectory())inspect(file);else if(/\.(?:js|mjs|json|html|css|md|map)$/.test(entry.name)){scanned++;if(forbidden.test(fs.readFileSync(file,'utf8')))throw Error(`Excluded material in publication: ${file}`);}}}
inspect('public');inspect('dist');
const source=fs.readFileSync('content/handbook.md','utf8');if(source!==fs.readFileSync('public/handbook.md','utf8'))throw Error('Download differs from teaching source');
console.log(`Publication audit passed: ${scanned} assets; source/download identical; no private provenance or appendix.`);
