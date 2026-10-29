// Иллюстрации главной (P4-06, RD-01 «Главная», вариант f): фронтальные SVG из примитивов «Чертежа» —
// пилюли, скруглённые прямоугольники, линии, круг и моно-подписи в 1–3 слова. Цвета — только токены
// через классы .hi-* (src/design/home.css). Линии (.hi-ln, pathLength 1) прорисовываются при наведении
// на карточку; постоянной анимации нет. Подписи на схемах — служебные метки, не учебный текст. Hero — P4-07.
import type {ReactNode} from 'react';

type Pill={x:number;y:number;w:number;label:string};
const pill=({x,y,w,label}:Pill,size?:number)=><g key={`${label}-${x}-${y}`}>
  <rect className="hi-4 hi-o" x={x-w/2} y={y-15} width={w} height={30} rx={15}/>
  <text className="hi-t" x={x} y={y+4} textAnchor="middle" style={size?{fontSize:size}:undefined}>{label}</text>
</g>;

/** Hero (P4-07): путь задачи как коллаж карточек «Чертежа» разного масштаба — человек ставит цель, агент делает
 *  в своей ветке, проверка, решение человека, единственный акцент — последний шаг. Глубина — слоями и масштабом
 *  (фоновые формы, задние и передние карточки), без перспективы и теней. viewBox 800×420 с полями: карточка визуала
 *  режет края (slice), смысловая часть сжата в зону x 100–700, y 40–380: её видно и на 1440 (режутся бока),
 *  и на 2560 (режутся верх и низ). Подписи — шаги пути из content/home.md
 *  (label и sub) и служебные метки; для скринридера — <title> и #home-path-steps в HomePage.tsx.
 *  Движение — одно: линия пути прорисовывается один раз (.motion-draw, pathLength 1). Линия соединяет все
 *  карточки по порядку (P2-09); карточки не перекрывают друг друга, кроме Founder за агентом. */
export function HeroPath({title,steps}:{title:string;steps:{label:string;sub:string}[]}){
  const s=(i:number)=>steps[i]??{label:'',sub:''};
  const [founder,ticket,agent,branch,review,decision,main,deploy]=[0,1,2,3,4,5,6,7].map(s);
  const row=(y:number,label:string)=><g key={label}>
    <rect className="hh-chip" x={530} y={y} width={154} height={26} rx={13}/>
    <circle className="hh-ink" cx={547} cy={y+13} r={7}/><path className="hh-tick" d={`M543.5 ${y+13}l2.5 2.5 4.5-5`}/>
    <text className="hh-s" x={562} y={y+17}>{label}</text>
  </g>;
  return <svg className="hi hi-hero motion-draw" viewBox="0 0 800 420" preserveAspectRatio="xMidYMid slice" role="img" aria-labelledby="home-path-title">
    <title id="home-path-title">{title}</title>
    <g aria-hidden="true">
      <rect className="hh-back" x={-60} y={292} width={470} height={230} rx={115}/>
      <circle className="hh-back" cx={770} cy={24} r={140}/>
      <path className="hh-plus" d="M446 40h12M452 34v12M120 300h12M126 294v12M718 250h12M724 244v12M300 384h12M306 378v12"/>
    </g>
    <g transform="translate(400 210) scale(.94) translate(-400 -214)">
    <path className="hi-ln" d="M192 164V210Q192 232 214 232H236M494 208H540Q560 208 560 188M650 182V236M651 344V364" pathLength={1}/>
    <g className="hh-card hh-practice">
      <rect x={506} y={34} width={204} height={148} rx={26}/>
      <text className="hh-h" x={530} y={70}>{review.label}</text><text className="hh-s" x={530} y={90}>{review.sub}</text>
      {row(104,'validate')}{row(138,'e2e')}
    </g>
    <g className="hh-card hh-human">
      <rect x={92} y={40} width={200} height={124} rx={26}/>
      <circle className="hh-chip" cx={126} cy={76} r={16}/><circle className="hh-ink" cx={126} cy={72} r={5}/><path className="hh-ink" d="M117 85a9 7 0 0 1 18 0z"/>
      <text className="hh-h" x={152} y={82}>{founder.label}</text><text className="hh-s" x={116} y={118}>{founder.sub}</text>
      <rect className="hh-chip" x={116} y={128} width={96} height={24} rx={12}/><text className="hh-s" x={164} y={144} textAnchor="middle">{ticket.label}</text>
    </g>
    <g className="hh-card hh-agent">
      <rect x={232} y={130} width={262} height={196} rx={30}/>
      <text className="hh-h" x={256} y={168}>{agent.label}</text><text className="hh-s" x={472} y={166} textAnchor="end">{agent.sub}</text>
      <rect className="hh-chip" x={254} y={184} width={218} height={86} rx={18}/>
      <text className="hh-t" x={272} y={212}>&gt;</text>
      <rect className="hh-bar" x={290} y={202} width={130} height={10} rx={5}/><rect className="hh-bar" x={290} y={222} width={164} height={10} rx={5}/><rect className="hh-bar" x={290} y={242} width={96} height={10} rx={5}/>
      <rect className="hh-ink" x={392} y={240} width={7} height={14} rx={2}/>
      <rect className="hh-chip" x={254} y={284} width={112} height={28} rx={14}/><circle className="hh-ink" cx={272} cy={298} r={4}/><text className="hh-s" x={284} y={302}>{branch.label}</text>
    </g>
    <g className="hh-card hh-human">
      <rect x={512} y={236} width={198} height={108} rx={26}/>
      <text className="hh-h" x={536} y={270}>{decision.label}</text><text className="hh-s" x={536} y={288}>{decision.sub}</text>
      <rect className="hh-chip" x={536} y={302} width={74} height={28} rx={14}/><text className="hh-s" x={573} y={320} textAnchor="middle">назад</text>
      <rect className="hh-ink" x={618} y={302} width={74} height={28} rx={14}/><text className="hh-on-ink" x={655} y={320} textAnchor="middle">{main.label}</text>
    </g>
    <g className="hi-accent"><rect x={592} y={364} width={118} height={32} rx={16}/><text x={651} y={385} textAnchor="middle">{deploy.label}</text></g>
    </g>
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
