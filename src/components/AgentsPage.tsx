// Страница /agents (P8-03, brief §11.3): что внутри Agent Pack, как подключить, скачать архив.
// Описание — README самого пакета (agent-pack/README.md), собранное в src/content/agent-pack.json.
import pack from '../content/agent-pack.json';
import {ReaderPageData} from './ReaderPageData';
import {ProjectIcon} from './ProjectIcon';
import '../design/agent-delivery.css';

const kb=(bytes:number)=>`${Math.max(1,Math.round(bytes/1024))} КБ`;
export const agentsPageData={chapterId:'agents',outline:[],hasChecklists:false,terms:[],blocks:[]};

export function AgentsPage(){
 return <><ReaderPageData value={agentsPageData}/><main id="reader" tabIndex={-1}><section className="chapter agents-page" data-chapter="agents">
  <h1>Agent Pack</h1>
  <div className="agents-download">
   <p>{pack.files.length} файлов · архив {kb(pack.zip.size)}</p>
   <a className="primary-action" href={pack.zip.href} download><ProjectIcon name="download"/> Скачать Agent Pack (.zip)</a>
   <div className="agents-links"><a href="/llms.txt">llms.txt — карта для LLM</a><a href="/llms-full.txt">llms-full.txt — весь текст</a></div>
  </div>
  <div className="reader-prose" dangerouslySetInnerHTML={{__html:pack.readmeHtml}}/>
  <div className="reader-prose agents-files"><h2>Файлы в архиве</h2><ul>{pack.files.map(f=><li key={f.path}><span>{f.path}</span><span>{kb(f.size)}</span></li>)}</ul></div>
 </section></main></>;
}
