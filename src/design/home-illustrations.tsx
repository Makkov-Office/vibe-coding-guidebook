// Иллюстрации главной (P4-06, RD-01 «Главная», вариант f): фронтальные SVG из примитивов «Чертежа» —
// пилюли, скруглённые прямоугольники, линии, круг и моно-подписи в 1–3 слова. Цвета — только токены
// через классы .hi-* (src/design/home.css). Линии (.hi-ln, pathLength 1) прорисовываются при наведении
// на карточку; постоянной анимации нет. Подписи на схемах — служебные метки, не учебный текст.
import type {ReactNode} from 'react';

type Pill={x:number;y:number;w:number;label:string};
const pill=({x,y,w,label}:Pill,size?:number)=><g key={`${label}-${x}-${y}`}>
  <rect className="hi-4 hi-o" x={x-w/2} y={y-15} width={w} height={30} rx={15}/>
  <text className="hi-t" x={x} y={y+4} textAnchor="middle" style={size?{fontSize:size}:undefined}>{label}</text>
</g>;

/** Hero: путь одной задачи — восемь моно-пилюль на одной линии, единственный акцент — последний шаг. */
export function HeroPath({title,steps}:{title:string;steps:{label:string;sub:string}[]}){
  // Змейка 3 · 3 · 2: ряд слева направо, разворот, ряд справа налево, разворот, последний ряд.
  const d='M64 104H332Q372 104 372 144Q372 184 332 184H108Q68 184 68 224Q68 264 108 264H300';
  const at=[[64,104],[176,104],[288,104],[288,184],[176,184],[64,184],[176,264]];
  const last=steps.at(-1);
  return <svg className="hi hi-hero motion-draw" viewBox="-6 40 396 260" role="img" aria-labelledby="home-path-title">
    <title id="home-path-title">{title}</title>
    <text className="hi-t" x="16" y="64">{title}</text>
    <path className="hi-ln" d={d} pathLength={1}/>
    {steps.slice(0,-1).map((step,i)=>pill({x:at[i][0],y:at[i][1],w:96,label:step.label}))}
    {last&&<foreignObject x={248} y={247} width={104} height={34}><div className="hi-accent">{last.label}</div></foreignObject>}
  </svg>;
}

const svg=(children:ReactNode)=><svg className="hi" viewBox="0 0 240 140" aria-hidden="true" focusable="false">{children}</svg>;
const tick='hi-tick';

const ills:Record<string,()=>ReactNode>={
  // Начать: маршрут M0 → M5 с флажком.
  start:()=>svg(<>
    <path className="hi-ln" d="M34 108C80 108 92 64 128 70S182 52 200 46" pathLength={1}/>
    <circle className="hi-4 hi-o" cx="34" cy="108" r="12"/><circle className="hi-p" cx="34" cy="108" r="5"/>
    <circle className="hi-1 hi-o" cx="128" cy="70" r="8"/>
    <rect className="hi-5" x="198" y="16" width="3" height="34" rx="1.5"/><path className="hi-2 hi-o" d="M201 17h28l-7 8 7 8h-28z"/>
    <text className="hi-t" x="22" y="134">M0</text><text className="hi-t" x="190" y="68">M5</text>
  </>),
  // Основы: среда → harness, слои друг на друге.
  base:()=>svg(<>
    <rect className="hi-3 hi-o" x="54" y="86" width="132" height="38" rx="14"/>
    <rect className="hi-2 hi-o" x="64" y="62" width="112" height="38" rx="13"/>
    <rect className="hi-1 hi-o" x="74" y="34" width="92" height="38" rx="12"/>
    <text className="hi-t" x="120" y="57" textAnchor="middle">harness</text>
    <text className="hi-t" x="120" y="116" textAnchor="middle">среда</text>
  </>),
  // Процесс: тикет → PR → review → main.
  flow:()=>svg(<>
    <path className="hi-ln" d="M30 66H210" pathLength={1}/>
    {[['Тикет',30],['PR',90],['Review',150],['main',210]].map(([label,x])=>pill({x:x as number,y:66,w:54,label:label as string},9))}
    <path className="hi-ln hi-ln--dots" d="M30 98H210"/>
    <circle className="hi-p" cx="150" cy="98" r="6"/>
    <text className="hi-t" x="120" y="128" textAnchor="middle">DEMO-42</text>
  </>),
  // Контроль: уровни риска L · M · H и решение человека.
  control:()=>svg(<>
    <rect className="hi-3 hi-o" x="40" y="80" width="36" height="34" rx="10"/>
    <rect className="hi-2 hi-o" x="86" y="58" width="36" height="56" rx="10"/>
    <rect className="hi-1 hi-o" x="132" y="34" width="36" height="80" rx="10"/>
    <text className="hi-t" x="58" y="132" textAnchor="middle">L</text><text className="hi-t" x="104" y="132" textAnchor="middle">M</text><text className="hi-t" x="150" y="132" textAnchor="middle">H</text>
    <circle className="hi-p" cx="198" cy="44" r="16"/><path className={tick} d="M190 44l6 6 10-11"/>
  </>),
  // Надёжность: щит и путь восстановления вокруг него.
  reliability:()=>svg(<>
    <path className="hi-ln" d="M120 18a54 54 0 1 1-47 27" pathLength={1}/><path className="hi-5" d="M66 40l12-1-5 11z"/>
    <path className="hi-1 hi-o" d="M120 34l30 12v22c0 22-14 34-30 42c-16-8-30-20-30-42v-22z"/>
    <path className="hi-tick2" d="M107 72l9 9 17-19"/>
  </>),
  // Практика: колода карточек тренажёра с ответом.
  practice:()=>svg(<>
    <rect className="hi-3 hi-o" x="62" y="30" width="110" height="80" rx="14" transform="rotate(-9 117 70)"/>
    <rect className="hi-2 hi-o" x="68" y="28" width="110" height="80" rx="14" transform="rotate(5 123 68)"/>
    <rect className="hi-4 hi-o" x="64" y="32" width="112" height="82" rx="14"/>
    <rect className="hi-3" x="76" y="46" width="70" height="7" rx="3.5"/><rect className="hi-3" x="76" y="64" width="88" height="14" rx="7"/><rect className="hi-p" x="76" y="84" width="88" height="14" rx="7"/>
    <circle className="hi-p" cx="186" cy="32" r="12"/><path className={tick} d="M180 32l4 4 8-8"/>
  </>),
  // Инструменты: окно терминала агента.
  tools:()=>svg(<>
    <rect className="hi-2 hi-o" x="96" y="20" width="118" height="78" rx="12"/>
    <rect className="hi-4 hi-o" x="28" y="40" width="148" height="84" rx="12"/>
    <circle className="hi-3" cx="42" cy="53" r="3.5"/><circle className="hi-3" cx="53" cy="53" r="3.5"/><circle className="hi-3" cx="64" cy="53" r="3.5"/>
    <text className="hi-t" x="40" y="82">&gt; claude</text><text className="hi-t" x="40" y="104">validate: PASS</text>
    <rect className="hi-p" x="100" y="72" width="7" height="12" rx="1"/>
  </>),
  // Agent Pack: правила для агента в одном пакете.
  agents:()=>svg(<>
    <g transform="rotate(-10 98 52)"><rect className="hi-4 hi-o" x="70" y="20" width="58" height="64" rx="8"/><text className="hi-t" x="99" y="44" textAnchor="middle" style={{fontSize:8.5}}>AGENTS</text></g>
    <g transform="rotate(8 146 48)"><rect className="hi-4 hi-o" x="117" y="16" width="58" height="64" rx="8"/><text className="hi-t" x="146" y="40" textAnchor="middle" style={{fontSize:8.5}}>schema</text></g>
    <rect className="hi-1 hi-o" x="56" y="68" width="128" height="58" rx="14"/>
    <rect className="hi-2 hi-o" x="50" y="60" width="140" height="18" rx="9"/>
    <text className="hi-t" x="120" y="106" textAnchor="middle">agent-pack</text>
  </>),
};

/** Цвет-смысл фона иллюстрации (RD-01 f): практика — мятный, агент — лиловый, решает человек — персиковый. */
export const sectionTone:Record<string,'practice'|'agent'|'human'|undefined>={practice:'practice',tools:'agent',agents:'agent',control:'human'};

export function SectionIllustration({id}:{id:string}){return <>{ills[id]?.()??null}</>;}
