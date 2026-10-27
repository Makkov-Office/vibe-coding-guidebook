"use client";
// «Скопировать для агента» (P8-03, brief §11.3): copies the page's Markdown (public/<page>.md,
// built by scripts/agent-delivery.mjs) for pasting into an agent's chat. The text is fetched on
// click; ClipboardItem with a promise keeps the click's user activation while the fetch runs.
import {useState} from 'react';
import {ProjectIcon} from './ProjectIcon';
import '../design/agent-delivery.css';

export function CopyForAgent({href}:{href:string}){
 const [status,setStatus]=useState('');
 async function copy(){
  setStatus('');
  const text=()=>fetch(href).then(response=>{if(!response.ok)throw Error(`${href}: ${response.status}`);return response.text();});
  try{
   const body=text();body.catch(()=>{});
   // ClipboardItem with a promise is not everywhere: if it fails, plain writeText with the same text.
   try{if(typeof ClipboardItem==='undefined'||!navigator.clipboard?.write)throw Error('no ClipboardItem');await navigator.clipboard.write([new ClipboardItem({'text/plain':body.then(t=>new Blob([t],{type:'text/plain'}))})]);}
   catch{await navigator.clipboard.writeText(await body);}
   setStatus('Markdown страницы скопирован. Вставьте его в чат агента.');
  }catch{setStatus('Скопировать не получилось. Откройте Markdown по ссылке и скопируйте вручную.');}
 }
 return <div className="agent-copy">
  <button type="button" className="agent-copy-button" onClick={copy}><ProjectIcon name="copy"/> Скопировать для агента</button>
  <a href={href}>Markdown страницы</a>
  <p role="status" className="agent-copy-status">{status}</p>
 </div>;
}
