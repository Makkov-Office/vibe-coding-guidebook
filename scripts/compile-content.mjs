import fs from 'node:fs/promises';
import { compileHandbook } from '../src/content/compiler.mjs';
import { loadUrlMap } from './url-map.mjs';
const source=await fs.readFile('content/handbook.md','utf8');
// Overview layer of tabbed chapters (P5-01): content/overview/NN.md.
const overviewFiles=await fs.readdir('content/overview').catch(error=>{if(error.code==='ENOENT')return [];throw error;});
const overviews={};
for(const file of overviewFiles.sort()){
  if(!/^\d{2}\.md$/.test(file))throw Error(`content/overview/${file}: expected NN.md`);
  overviews[file.slice(0,2)]=await fs.readFile(`content/overview/${file}`,'utf8');
}
// Level of each glossary term (P6-07); the file is required.
const glossaryLevels=JSON.parse(await fs.readFile('content/glossary-levels.json','utf8'));
// Drills of the chapters (P7-03): content/gamification/drills/*.json against the schema.
const drillFiles=(await fs.readdir('content/gamification/drills').catch(error=>{if(error.code==='ENOENT')return [];throw error;})).sort();
const drills=[];
for(const file of drillFiles){
  if(!/^\d{2}-[a-z0-9-]+\.json$/.test(file))throw Error(`content/gamification/drills/${file}: expected NN-name.json`);
  drills.push({file:`content/gamification/drills/${file}`,data:JSON.parse(await fs.readFile(`content/gamification/drills/${file}`,'utf8'))});
}
const drillSchema=JSON.parse(await fs.readFile('content/gamification/schema/drill.schema.json','utf8'));
const data=await compileHandbook(source,{urlMap:loadUrlMap(),overviews,glossaryLevels,drills,drillSchema});
await fs.writeFile('src/content/generated.json',JSON.stringify(data));
await fs.writeFile('public/handbook.md',source);
await fs.writeFile('docs/coverage-report.json',JSON.stringify(data.audit,null,2));
console.log(JSON.stringify({chapters:data.chapters.length,terms:data.terms.length,topics:data.topics.length,diagrams:data.diagrams.length,linked:data.audit.linked,ambiguous:data.audit.ambiguous.length,tabbed:data.audit.tabs.chapters,overviews:data.audit.tabs.overviews,drills:data.drills.length}));
if(data.audit.unexplainedGaps) {console.error('Unresolved glossary mappings: see docs/coverage-report.json');process.exitCode=1;}
