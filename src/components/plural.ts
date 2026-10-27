/** Число со словом в нужной форме: 1 термин, 2 термина, 5 терминов, 11 терминов, 21 термин. */
export function plural(n:number,[one,few,many]:[string,string,string]){const d=n%10,h=n%100;return `${n} ${d===1&&h!==11?one:d>=2&&d<=4&&(h<12||h>14)?few:many}`;}
