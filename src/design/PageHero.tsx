// Page banner (P3-07): two M3 cards side by side, like M3 Buttons and the RD-01 "Topic page".
// On the left the text (eyebrow, Unbounded heading, one line of description, meta and actions), on the right a tinted
// card with a calm diagram from "Blueprint" primitives. Styles: page-hero.css; the .page-hero class spreads the banner
// over the full width of the work area (app/globals.css, "M3 shell").
import type {ReactNode} from 'react';

export type HeroTone='neutral'|'agent'|'practice'|'human';

type Props={
  id?:string;
  eyebrow?:ReactNode;
  /** The heading as text; titleHtml is a ready h1 from the content compiler (with id and terms). */
  title?:ReactNode;
  titleHtml?:string;
  description?:ReactNode;
  descriptionHtml?:string;
  /** Meta chips: a ul.page-hero__meta list labelled with aria-label. */
  meta?:ReactNode;
  actions?:ReactNode;
  visual:ReactNode;
  tone?:HeroTone;
  className?:string;
};

/** Removes the "#" link from the compiler h1 (the banner has no copy link). */
export const heroTitle=(html:string)=>html.replace(/<a [^>]*class="permalink"[^>]*>#<\/a>/,'');

/** Splits the page HTML: the h1, the first paragraph right after it (the banner description) and the rest of the text. */
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
