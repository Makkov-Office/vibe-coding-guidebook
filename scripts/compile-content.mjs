import fs from 'node:fs/promises';
import { compileHandbook } from '../src/content/compiler.mjs';
const source=await fs.readFile('content/handbook.md','utf8');
const data=await compileHandbook(source);
await fs.writeFile('src/content/generated.json',JSON.stringify(data));
await fs.writeFile('public/handbook.md',source);
await fs.writeFile('docs/coverage-report.json',JSON.stringify(data.audit,null,2));
console.log(JSON.stringify({chapters:data.chapters.length,terms:data.terms.length,topics:data.topics.length,diagrams:data.diagrams.length,linked:data.audit.linked,ambiguous:data.audit.ambiguous.length}));
if(data.audit.unexplainedGaps) {console.error('Unresolved glossary mappings: see docs/coverage-report.json');process.exitCode=1;}
