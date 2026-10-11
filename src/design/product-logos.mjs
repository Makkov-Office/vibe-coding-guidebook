import products from './product-logos.json' with {type:'json'};
const aliases={'github-actions':'github','github-cli':'github','docker-engine':'docker','docker-desktop':'docker','claude-code':'claude','node':'nodejs'};
export const productLogo=id=>products[id]??products[aliases[id]];
export const termProduct=id=>id?.startsWith('term-')?productLogo(id.slice(5)):undefined;
export const chapterProduct=id=>productLogo({'ch-codex':'codex','ch-claude-code':'claude'}[id]);
export function linkedProduct(href){
  if(!/^https:\/\//.test(href??''))return;
  const host=new URL(href).hostname;
  const id=Object.keys(products).find(key=>products[key].domains?.includes(host));
  return productLogo(id);
}
