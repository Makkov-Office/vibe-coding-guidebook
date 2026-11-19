// Diagrams for page banners (P3-07): "Blueprint" primitives: rounded rectangles, pills, lines, a circle,
// mono labels of 1–3 words; frontal, monochrome and at most one accent (the phv-accent class). Decorative:
// the banner text carries the page meaning, so the diagram is hidden from assistive technology (aria-hidden on the card).
import type {ReactNode} from 'react';

function Frame({children}:{children:ReactNode}){
  return <svg className="phv" viewBox="0 0 400 260" focusable="false">{children}</svg>;
}
const Check=({x,y}:{x:number;y:number})=><path className="phv-check" d={`M${x-5} ${y}l3.5 3.5 6.5-7`}/>;

/** Glossary: three terms, one selected, a line to its definition. */
export function GlossaryVisual(){
  return <Frame>
    {['agent','preflight','evidence'].map((term,i)=><g key={term} className={i===1?'phv-accent':'phv-term'}>
      <rect x="28" y={52+i*58} width="136" height="40" rx="20"/>
      <text className="phv-label" x="48" y={77+i*58}>{term}</text>
    </g>)}
    <path className="bp-line" d="M164 130h44"/>
    <rect className="phv-card" x="208" y="54" width="164" height="152" rx="16"/>
    <text className="phv-label" x="226" y="84">определение</text>
    <rect className="phv-bar" x="226" y="102" width="128" height="8" rx="4"/>
    <rect className="phv-bar" x="226" y="120" width="112" height="8" rx="4"/>
    <rect className="phv-bar" x="226" y="138" width="120" height="8" rx="4"/>
    <rect className="phv-pill" x="226" y="164" width="72" height="24" rx="12"/>
    <text className="phv-small" x="238" y="180">уровень</text>
  </Frame>;
}

/** Operational cheat sheet: four checklists by stage, the current one marked. */
export function ChecklistVisual(){
  const rows=['до старта','перед review','перед merge','после merge'];
  return <Frame>
    <rect className="phv-card" x="88" y="26" width="224" height="208" rx="20"/>
    {rows.map((row,i)=><g key={row} className={i===2?'phv-accent':'phv-row'}>
      <rect x="104" y={42+i*46} width="192" height="38" rx="19"/>
      <circle cx="125" cy={61+i*46} r="9"/>
      {i<2&&<Check x={125} y={61+i*46}/>}
      <text className="phv-label" x="144" y={65+i*46}>{row}</text>
    </g>)}
  </Frame>;
}

/** Agent Pack: the archive and the files the agent receives. */
export function AgentPackVisual(){
  const files=['AGENTS.md','llms.txt','главы .md'];
  return <Frame>
    <g className="phv-accent"><rect x="30" y="92" width="132" height="76" rx="16"/></g>
    <text className="phv-label phv-on-accent" x="48" y="126">agent-pack</text>
    <text className="phv-small phv-on-accent" x="48" y="146">.zip</text>
    {files.map((file,i)=><g key={file}>
      <path className="bp-line" d={`M162 130C200 130 196 ${70+i*60} 232 ${70+i*60}`}/>
      <rect className="phv-term" x="232" y={50+i*60} width="140" height="40" rx="20"/>
      <text className="phv-label" x="252" y={75+i*60}>{file}</text>
    </g>)}
  </Frame>;
}

/** Tool reviews: the path from idea to review. */
export function ToolsVisual(){
  const steps=['идея','прототип','проверка','review'];
  return <Frame>
    <path className="bp-line" d="M60 130h280"/>
    {steps.map((step,i)=><g key={step} className={i===3?'phv-accent':'phv-step'}>
      <circle cx={60+i*93} cy="130" r="22"/>
      <text className="phv-small phv-step-number" x={60+i*93} y="134" textAnchor="middle">{String(i+1).padStart(2,'0')}</text>
      <text className="phv-label" x={60+i*93} y={i%2?92:182} textAnchor="middle">{step}</text>
    </g>)}
  </Frame>;
}

/** Codex: a task window with request, diff, check. */
export function CodexVisual(){
  return <Frame>
    <rect className="phv-card" x="40" y="34" width="320" height="192" rx="20"/>
    <path className="phv-divider" d="M40 74h320"/>
    {[0,1,2].map(i=><circle key={i} className="phv-dot" cx={64+i*18} cy="54" r="5"/>)}
    <text className="phv-label" x="64" y="106">&gt; задача</text>
    <rect className="phv-bar" x="64" y="122" width="200" height="8" rx="4"/>
    <text className="phv-label phv-muted" x="64" y="160">diff +12 −3</text>
    <g className="phv-accent"><rect x="64" y="176" width="120" height="32" rx="16"/></g>
    <text className="phv-small phv-on-accent" x="82" y="196">проверено</text>
  </Frame>;
}

/** Claude Code: a project where the agent changes files and runs a check. */
export function ClaudeCodeVisual(){
  const tree=['app/','src/','tests/'];
  return <Frame>
    <rect className="phv-card" x="34" y="40" width="160" height="180" rx="20"/>
    <text className="phv-label" x="54" y="72">проект</text>
    {tree.map((dir,i)=><g key={dir}>
      <path className="bp-line" d={`M60 86V${110+i*36}h18`}/>
      <rect className="phv-term" x="78" y={96+i*36} width="96" height="28" rx="14"/>
      <text className="phv-small" x="92" y={114+i*36}>{dir}</text>
    </g>)}
    <path className="bp-line" d="M194 130h44"/>
    <rect className="phv-term" x="238" y="70" width="128" height="40" rx="20"/>
    <text className="phv-label" x="256" y="95">изменения</text>
    <path className="bp-line" d="M302 110v40"/>
    <g className="phv-accent"><rect x="238" y="150" width="128" height="40" rx="20"/></g>
    <text className="phv-label phv-on-accent" x="256" y="175">проверка</text>
  </Frame>;
}

/** Useful resources: three stacks of videos, articles, documentation. */
export function ResourcesVisual(){
  const shelves=['видео','статьи','доки'];
  return <Frame>
    {shelves.map((shelf,i)=><g key={shelf}>
      <rect className="phv-soft" x={46+i*112} y="66" width="88" height="128" rx="16"/>
      <rect className={i===0?'phv-accent-fill':'phv-card'} x={38+i*112} y="58" width="88" height="128" rx="16"/>
      <rect className="phv-bar" x={54+i*112} y="122" width="56" height="8" rx="4"/>
      <rect className="phv-bar" x={54+i*112} y="138" width="40" height="8" rx="4"/>
      <text className="phv-label" x={82+i*112} y="220" textAnchor="middle">{shelf}</text>
    </g>)}
  </Frame>;
}

/** How to read the handbook: a route through the chapters, the start marked. */
export function RouteVisual(){
  const stops=['00','01','08','15','23'];
  return <Frame>
    <path className="bp-line" d="M52 170L127 120L202 150L277 110L352 90"/>
    {stops.map((stop,i)=>{const x=52+i*75,y=[170,120,150,110,90][i];return <g key={stop} className={i===0?'phv-accent':'phv-step'}>
      <circle cx={x} cy={y} r="20"/>
      <text className="phv-small phv-step-number" x={x} y={y+4} textAnchor="middle">{stop}</text>
    </g>;})}
    <text className="phv-label" x="52" y="212" textAnchor="middle">старт</text>
    <text className="phv-label" x="352" y="54" textAnchor="middle">глоссарий</text>
  </Frame>;
}
