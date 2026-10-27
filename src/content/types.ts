export interface Chapter { id: string; number: string; title: string; html: string; path:string; href:string; outline: {id:string; title:string}[]; heading?:string; tabs?:ChapterTab[]; overview?:{title:string;minutes:number;ruleStrength:string}|null }
// A tab of a chapter (P5-01): url-map `tabs[].id`, its HTML, headings and panel ids.
export interface ChapterTab { id:TabId; html:string; outline:{id:string; title:string}[]; panels:string[] }
export type TabId='overview'|'how-it-works'|'apply'|'check';
export interface GlossaryTerm { id:string; label:string; aliases:string[]; topic:string; definition:string; definitionHtml:string; previewKind:'tooltip'|'popover'|'panel'; level?:GlossaryLevel }
export type GlossaryLevel='basic'|'professional';
export interface SearchEntry { id:string; chapter:string; title:string; type:string; text:string; path:string; tab?:TabId; /** Glossary level label of a term (P6-07), shown in search (P3-03). */ level?:string }
export interface DiagramEntry { id:string; chapter:string; source:string; description:string }
export interface CodeBlock { id:string; language:string; raw:string; adjacent:boolean; terms:string[] }
export interface Choice { id:string; label:string; html:string; titleHtml?:string; chapter?:string; path?:string; evidenceHtml?:string; ownerHtml?:string }
export interface InteractivePanel { id:string; chapter:string; title:string; label:string; choices:Choice[]; scenarios?:{id:string;label:string;html:string}[] }
// A drill of a chapter (P7-03): content/gamification/drills/*.json, `href` is the chapter paragraph of each card.
export interface DrillCard { id:string; scenario:string; question:string; options:{id:string;label:string}[]; answer:string; explanation:string; href:string; difficulty:number }
export interface Drill { id:string; chapter:string; title:string; minutes:number; intro:string; cards:DrillCard[] }
export interface Handbook { html:string; intro:string; chapters:Chapter[]; terms:GlossaryTerm[]; topics:string[]; levels:Record<GlossaryLevel,string>|null; search:SearchEntry[]; diagrams:DiagramEntry[]; blocks:CodeBlock[]; panels:InteractivePanel[]; anchors:Record<string,{id:string;path:string}>; drills:Drill[]; presentation:{heading:string;description:string;subtitle:string;timeline:string[]}; audit:Record<string,unknown> }
