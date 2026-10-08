export interface Chapter { id: string; number: string; title: string; html: string; outline: {id:string; title:string}[] }
export interface GlossaryTerm { id:string; label:string; aliases:string[]; topic:string; definition:string }
export interface SearchEntry { id:string; chapter:string; title:string; type:string; text:string }
export interface DiagramEntry { id:string; chapter:string; source:string; description:string }
export interface CodeBlock { id:string; language:string; raw:string }
export interface Choice { id:string; label:string; html:string; titleHtml?:string; chapter?:string }
export interface InteractivePanel { id:string; chapter:string; title:string; label:string; choices:Choice[]; scenarios?:{id:string;label:string;html:string}[] }
export interface Handbook { html:string; intro:string; chapters:Chapter[]; terms:GlossaryTerm[]; topics:string[]; search:SearchEntry[]; diagrams:DiagramEntry[]; blocks:CodeBlock[]; panels:InteractivePanel[]; presentation:{heading:string;description:string;subtitle:string;timeline:string[]}; audit:Record<string,unknown> }
