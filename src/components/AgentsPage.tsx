// Страница /agents (P8-03, brief §11.3): что внутри Agent Pack, как подключить, скачать архив.
// Описание — README самого пакета (agent-pack/README.md), собранное в src/content/agent-pack.json.
import pack from '../content/agent-pack.json';
import {ReaderPageData} from './ReaderPageData';
import {ProjectIcon} from './ProjectIcon';
import {PageHero} from '../design/PageHero';
import {AgentPackVisual} from '../design/HeroVisuals';
import '../design/agent-delivery.css';

const kb=(bytes:number)=>`${Math.max(1,Math.round(bytes/1024))} КБ`;
export const agentsPageData={chapterId:'agents',outline:[],hasChecklists:false,terms:[],levels:null,blocks:[]};

export function AgentsPage(){
 return <><ReaderPageData value={agentsPageData}/><main id="reader" tabIndex={-1}><section className="chapter agents-page" data-chapter="agents">
  <PageHero eyebrow="Для агентов" title="Agent Pack" description="Правила руководства для твоего агента: архив, llms.txt и Markdown каждой страницы." tone="agent" visual={<AgentPackVisual/>}
   meta={<ul className="page-hero__meta" aria-label="Об архиве"><li>{pack.files.length} файлов</li><li>архив {kb(pack.zip.size)}</li></ul>}
   actions={<div className="agents-download"><a className="primary-action" href={pack.zip.href} download><ProjectIcon name="download"/> Скачать Agent Pack (.zip)</a>
    <div className="agents-links"><a href="/llms.txt">llms.txt — карта для LLM</a><a href="/llms-full.txt">llms-full.txt — весь текст</a></div></div>}/>
  <div className="reader-prose" dangerouslySetInnerHTML={{__html:pack.readmeHtml}}/>
  <div className="reader-prose agents-files"><h2>Файлы в архиве</h2><ul>{pack.files.map(f=><li key={f.path}><span>{f.path}</span><span>{kb(f.size)}</span></li>)}</ul></div>
 </section></main></>;
}
