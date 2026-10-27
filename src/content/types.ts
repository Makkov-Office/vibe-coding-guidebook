export interface Chapter { id: string; number: string; title: string; html: string; path:string; href:string; outline: {id:string; title:string}[]; heading?:string; tabs?:ChapterTab[]; overview?:{title:string;minutes:number;ruleStrength:string}|null }
// A tab of a chapter (P5-01): url-map `tabs[].id`, its HTML, headings and panel ids.
export interface ChapterTab { id:TabId; html:string; outline:{id:string; title:string}[]; panels:string[] }
export type TabId='overview'|'how-it-works'|'apply'|'check';
export interface GlossaryTerm { id:string; label:string; aliases:string[]; topic:string; definition:string; definitionHtml:string; previewKind:'tooltip'|'popover'|'panel'; level?:GlossaryLevel }
export type GlossaryLevel='basic'|'professional';
export interface SearchEntry { id:string; chapter:string; title:string; type:string; text:string; path:string; tab?:TabId }
export interface DiagramEntry { id:string; chapter:string; source:string; description:string }
export interface CodeBlock { id:string; language:string; raw:string; adjacent:boolean; terms:string[] }
export interface Choice { id:string; label:string; html:string; titleHtml?:string; chapter?:string; path?:string; evidenceHtml?:string; ownerHtml?:string }
export interface InteractivePanel { id:string; chapter:string; title:string; label:string; choices:Choice[]; scenarios?:{id:string;label:string;html:string}[] }
export interface HomeLink { label:string; href:string }
export interface HomeContent { title:string; subtitle:string; lead:string; actions:HomeLink[]; path:{title:string;steps:{label:string;sub:string}[]}; sections:{heading:string;lead:string;cards:{label:string;text:string}[]}; resume:{heading:string;lead:string;action:string}; next:{heading:string;items:{label:string;href:string|null;text:string}[]}; footer:{heading:string;groups:{heading:string;links:HomeLink[]}[]} }
export interface Handbook { home:HomeContent; html:string; intro:string; chapters:Chapter[]; terms:GlossaryTerm[]; topics:string[]; levels:Record<GlossaryLevel,string>|null; search:SearchEntry[]; diagrams:DiagramEntry[]; blocks:CodeBlock[]; panels:InteractivePanel[]; anchors:Record<string,{id:string;path:string}>; presentation:{heading:string;description:string;subtitle:string;timeline:string[]}; audit:Record<string,unknown> }
