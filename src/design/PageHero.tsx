// Баннер страницы (P3-07): две карточки M3 рядом, как M3 Buttons и «Страница темы» RD-01.
// Слева текст (надзаголовок, заголовок Unbounded, одна строка описания, мета и действия), справа тонированная
// карточка со спокойной схемой из примитивов «Чертежа». Стили — page-hero.css; на всю ширину рабочей области
// баннер выводит класс .page-hero (app/globals.css, «Оболочка M3»).
import type {ReactNode} from 'react';

export type HeroTone='neutral'|'agent'|'practice'|'human';

type Props={
  id?:string;
  eyebrow?:ReactNode;
  /** Заголовок текстом; titleHtml — готовый h1 из компилятора контента (с id и терминами). */
  title?:ReactNode;
  titleHtml?:string;
  description?:ReactNode;
  descriptionHtml?:string;
  /** Мета-чипы: список ul.page-hero__meta с подписью aria-label. */
  meta?:ReactNode;
  actions?:ReactNode;
  visual:ReactNode;
  tone?:HeroTone;
  className?:string;
};

/** Убирает из h1 компилятора ссылку «#» (у баннера нет copy link). */
export const heroTitle=(html:string)=>html.replace(/<a [^>]*class="permalink"[^>]*>#<\/a>/,'');

/** Делит HTML страницы: h1, первый абзац сразу после него (описание баннера) и остальной текст. */
export function splitLead(html:string){
  const close=html.indexOf('</h1>');if(close<0)return {title:'',lead:'',rest:html};
  const end=close+'</h1>'.length,after=html.slice(end),lead=/^\s*<p[ >][\s\S]*?<\/p>/.exec(after)?.[0]??'';
  return {title:heroTitle(html.slice(0,end)),lead:lead.trim(),rest:after.slice(lead.length)};
}

export function PageHero({id,eyebrow,title,titleHtml,description,descriptionHtml,meta,actions,visual,tone='neutral',className}:Props){
  return <header id={id} className={['page-hero',className].filter(Boolean).join(' ')}>
    <div className="page-hero__text">
      {eyebrow&&<p className="page-hero__eyebrow">{eyebrow}</p>}
      {titleHtml?<div className="page-hero__title" dangerouslySetInnerHTML={{__html:titleHtml}}/>:<h1 className="page-hero__title">{title}</h1>}
      {descriptionHtml?<div className="page-hero__description" dangerouslySetInnerHTML={{__html:descriptionHtml}}/>:description&&<p className="page-hero__description">{description}</p>}
      {meta}
      {actions&&<div className="page-hero__actions">{actions}</div>}
    </div>
    <div className={`page-hero__visual page-hero__visual--${tone}`} aria-hidden="true">{visual}</div>
  </header>;
}
