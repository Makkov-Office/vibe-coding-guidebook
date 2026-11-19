// Home page labels (P4-06): templates from content/home.md ("## Подписи" (Labels), generated.home.labels).
// The code only fills in {slots} and picks the plural form; the text itself lives in content.
export const fillLabel=(template:string,values:Record<string,string|number>)=>template.replace(/\{(\w+)\}/g,(_,key:string)=>String(values[key]??''));
/** The form for number n out of three, "1 | 2–4 | 5+" (plural rule of the content language). */
export const pluralForm=(n:number,[one,few,many]:string[])=>n%10===1&&n%100!==11?one:n%10>=2&&n%10<=4&&(n%100<10||n%100>=20)?few:many;
