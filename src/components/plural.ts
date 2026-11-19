/** A number with its noun in the right plural form: one / few / many, e.g. for n = 1, 2, 5, 11, 21. */
export function plural(n:number,[one,few,many]:[string,string,string]){const d=n%10,h=n%100;return `${n} ${d===1&&h!==11?one:d>=2&&d<=4&&(h<12||h>14)?few:many}`;}
