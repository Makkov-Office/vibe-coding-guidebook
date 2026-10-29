// Визуал баннера главы (P5-05): SVG из примитивов «Чертежа» — пилюли, скруглённые прямоугольники, линии, моно-подписи.
// Для главы 08 — чек-лист проверок preflight и четыре результата (RD-01, экран «Страница темы»);
// для остальных глав — спокойный общий визуал: номер главы и четыре таба страницы.
// Цвета — только токены через классы chapter-template.css (.cv-*). Декоративный: смысл несёт текст баннера,
// поэтому карточка визуала скрыта от вспомогательных технологий (aria-hidden в ChapterTemplate).

import type {CSSProperties} from 'react';

const checks=['тикет','base SHA','ветка','риск','Docs Impact','коллизии'];
const results=['PASS','FAIL','BLOCKED','INCOMPLETE'];

function Pill({x,y,w,label,strong}:{x:number;y:number;w:number;label:string;strong?:boolean}){
  return <g className={strong?'cv-pill cv-pill--strong':'cv-pill'}>
    <rect x={x-w/2} y={y-15} width={w} height={30} rx={15}/>
    <text x={x} y={y+4} textAnchor="middle">{label}</text>
  </g>;
}

function PreflightVisual(){
  return <svg className="cv cv--preflight motion-draw" viewBox="0 0 520 300" focusable="false">
    <rect className="cv-card" x="30" y="30" width="250" height="240" rx="20"/>
    <g className="motion-steps">
      {checks.map((label,i)=>{const y=66+i*34;return <g key={label} style={{'--step':i} as CSSProperties}>
        <circle className="cv-check" cx="62" cy={y} r="11"/>
        <path className="cv-tick" d={`M56 ${y}l4 4 8-8`}/>
        <text className="cv-label" x="84" y={y+4}>{label}</text>
      </g>;})}
    </g>
    <path className="cv-line" d="M282 150 H318" pathLength={1}/>
    {results.map((label,i)=><Pill key={label} x={400} y={74+i*52} w={150} label={label} strong={i===0}/>)}
  </svg>;
}

/** Номер главы и четыре таба; выделен текущий таб страницы. */
function GenericVisual({number,tabs,current}:{number:string;tabs:string[];current:number}){
  return <svg className="cv motion-draw" viewBox="0 0 520 300" focusable="false">
    <circle className="cv-card" cx="120" cy="150" r="76"/>
    <text className="cv-number" x="120" y="164" textAnchor="middle">{number}</text>
    <path className="cv-line" d="M196 150 H232 M232 74 V226 M232 74 H262 M232 124 H262 M232 176 H262 M232 226 H262" pathLength={1}/>
    {tabs.map((label,i)=><Pill key={label} x={362} y={74+i*50.7} w={196} label={label} strong={i===current}/>)}
  </svg>;
}

export function ChapterVisual({chapterId,number,tabs,current}:{chapterId:string;number:string;tabs:string[];current:number}){
  return chapterId==='ch-08'?<PreflightVisual/>:<GenericVisual number={number} tabs={tabs} current={current}/>;
}
