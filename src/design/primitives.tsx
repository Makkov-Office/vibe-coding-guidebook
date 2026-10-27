// Примитивы «Чертежа» (P2-04): из них собираются экраны фаз 3–7. Стили — src/design/primitives.css,
// спецификация — docs/design/visual-language.md, раздел «Примитивы и шаблоны».
import {createElement,useId,type AnchorHTMLAttributes,type ButtonHTMLAttributes,type CSSProperties,type ReactNode} from 'react';
import {iconProps,iconRoles} from './icons.mjs';

export type Meaning='path'|'agent'|'practice'|'human';
type Role=keyof typeof iconRoles;
const meaningIcon:Record<Meaning,Role>={path:'progress',agent:'agent',practice:'practiceMeaning',human:'human'};
const cx=(...names:(string|false|undefined)[])=>names.filter(Boolean).join(' ');

export function RoleIcon({role,filled=false}:{role:Role;filled?:boolean}){
  const entry=iconRoles[role] as {icon:typeof iconRoles.home.icon;filled?:typeof iconRoles.home.icon};
  return createElement((filled&&entry.filled)||entry.icon,iconProps);
}

export function Card({href,tone='surface',className,children}:{href?:string;tone?:'surface'|'low';className?:string;children:ReactNode}){
  const classes=cx('bp-card',tone==='low'&&'bp-card--low',className);
  return href?<a className={classes} href={href}>{children}</a>:<div className={classes}>{children}</div>;
}

/** Цвет-смысл всегда с подписью и иконкой роли, чтобы читался без цвета (раздел 4). */
export function Pill({meaning,icon=true,children}:{meaning:Meaning;icon?:boolean;children:ReactNode}){
  return <span className={`bp-pill bp-pill--${meaning}`}>{icon&&<RoleIcon role={meaningIcon[meaning]}/>}{children}</span>;
}

export function Chip({pressed=false,children,...props}:{pressed?:boolean;children:ReactNode}&Omit<ButtonHTMLAttributes<HTMLButtonElement>,'aria-pressed'>){
  return <button type="button" className="bp-chip" aria-pressed={pressed} {...props}>{children}</button>;
}

type ButtonVariant='fill'|'tonal'|'text';
type ButtonProps={variant?:ButtonVariant;icon?:Role;children:ReactNode};
export function Button({variant='fill',icon,children,...props}:ButtonProps&ButtonHTMLAttributes<HTMLButtonElement>){
  return <button type="button" className={`bp-button bp-button--${variant}`} {...props}>{children}{icon&&<RoleIcon role={icon}/>}</button>;
}
export function ButtonLink({variant='fill',icon,children,...props}:ButtonProps&AnchorHTMLAttributes<HTMLAnchorElement>){
  return <a className={`bp-button bp-button--${variant}`} {...props}>{children}{icon&&<RoleIcon role={icon}/>}</a>;
}

/** Линия шага: шаги до current пройдены; animate включает приём «Смена шага». */
export function StepLine({steps,current,animate=false,label}:{steps:string[];current:number;animate?:boolean;label:string}){
  return <ol className={cx('bp-steps',animate&&'bp-steps--animate')} aria-label={label}>
    {steps.map((step,i)=>{
      const state=i<current?'done':i===current?'current':'todo';
      return <li key={step} data-state={state} aria-current={state==='current'?'step':undefined} style={{'--i':i} as CSSProperties}><span className="bp-step-label">{step}</span></li>;
    })}
  </ol>;
}

export function ProgressDots({total,current,label}:{total:number;current:number;label:string}){
  return <span className="bp-dots" role="img" aria-label={label}>
    {Array.from({length:total},(_,i)=><i key={i} data-state={i<current?'done':i===current?'current':'todo'}/>)}
  </span>;
}

export function Annotation({children}:{children:ReactNode}){return <span className="bp-anno">{children}</span>;}
export function GameLabel({children}:{children:ReactNode}){return <span className="bp-game">{children}</span>;}

/** Баннер с паттерном «+» (8 px в ячейке 28 px) и фирменной рамкой: только hero главной и «Начать». */
export function PlusBanner({children}:{children:ReactNode}){
  const id=useId();
  return <section className="bp-banner">
    <svg className="bp-plus" aria-hidden="true" focusable="false">
      <defs><pattern id={id} width="28" height="28" patternUnits="userSpaceOnUse"><path className="bp-plus-line" d="M10 14h8M14 10v8"/></pattern></defs>
      <rect width="100%" height="100%" fill={`url(#${id})`}/>
    </svg>
    {children}
  </section>;
}

/* Шаблоны SVG «Чертёж». Схема не сжимается меньше ширины viewBox (подписи не мельче 10.5 px):
   на узком экране она прокручивается в рамке, рамка доступна с клавиатуры. */
export function Blueprint({viewBox,title,children}:{viewBox:string;title:string;children:ReactNode}){
  const id=useId();
  const width=Number(viewBox.trim().split(/[\s,]+/)[2]);
  return <div className="bp-svg-frame" role="region" tabIndex={0} aria-label={`Схема: ${title}`}>
  <svg className="bp-svg" viewBox={viewBox} role="img" aria-labelledby={`${id}-t`} style={{'--bp-min-width':`${width}px`} as CSSProperties}>
    <title id={`${id}-t`}>{title}</title>
    <defs><marker id={`${id}-a`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path className="bp-arrowhead" d="M0 1 9 5 0 9z"/></marker></defs>
    <g style={{'--bp-arrow':`url(#${id}-a)`} as CSSProperties}>{children}</g>
  </svg>
  </div>;
}

export function BpNode({x,y,w=148,h=56,meaning,label,sub}:{x:number;y:number;w?:number;h?:number;meaning?:Meaning;label:string;sub?:string}){
  return <g className={cx('bp-node',meaning&&`bp-node--${meaning}`)} transform={`translate(${x} ${y})`}>
    <rect width={w} height={h} rx="12"/>
    <text x="14" y={sub?24:h/2+4}>{label}</text>
    {sub&&<text className="bp-sub" x="14" y="42">{sub}</text>}
  </g>;
}

export function BpArrow({d,dashed=false,draw=false}:{d:string;dashed?:boolean;draw?:boolean}){
  return <path className={cx('bp-line',dashed&&'bp-line--dashed',draw&&'bp-draw')} d={d} pathLength={draw?1:undefined} style={{markerEnd:'var(--bp-arrow)'}}/>;
}

export function BpLabel({x,y,children}:{x:number;y:number;children:ReactNode}){return <text className="bp-label" x={x} y={y}>{children}</text>;}

/** Приём «Бег точки»: одна точка идёт по пути задачи, пауза в конце; на схеме не больше одной. */
export function BpRunDot({d}:{d:string}){return <circle className="bp-run" r="4" style={{offsetPath:`path('${d}')`}}/>;}
