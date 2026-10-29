// Подписи главной (P4-06): шаблоны из content/home.md («## Подписи», generated.home.labels).
// В коде только подстановка {слотов} и выбор формы множественного числа, сам текст — в content.
export const fillLabel=(template:string,values:Record<string,string|number>)=>template.replace(/\{(\w+)\}/g,(_,key:string)=>String(values[key]??''));
/** Форма для числа n из трёх «1 | 2–4 | 5+» (правило русского языка). */
export const pluralForm=(n:number,[one,few,many]:string[])=>n%10===1&&n%100!==11?one:n%10>=2&&n%10<=4&&(n%100<10||n%100>=20)?few:many;
