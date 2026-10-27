import {test,expect,type Page} from '@playwright/test';
// P6-07c: глоссарий в шаблоне «Чертежа» — hero главы, вводный текст в нём, фильтр под hero, copy link у тем.
async function ready(page:Page){await page.goto('/glossary');await page.waitForSelector('html.js-enabled');await expect(page.locator('.search-trigger')).toBeEnabled();await page.locator('.ct-live').waitFor({state:'attached'});}
async function settled(page:Page){await page.evaluate(()=>Promise.all(document.getAnimations().filter(a=>Number.isFinite(Number(a.effect?.getComputedTiming().endTime))).map(a=>a.finished.catch(()=>undefined))));}

test('glossary hero: title, chips, lead, then filter, then topics',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await ready(page);
 const hero=page.locator('main .glossary-page>.ct-hero');
 await expect(hero.locator('.bp-anno')).toHaveText('Справочник');
 await expect(page.locator('main h1')).toHaveCount(1);
 await expect(hero.locator('h1#ch-23')).toHaveText('23. Полный тематический глоссарий');
 await expect(hero.locator('h1 .permalink')).toHaveCount(0);
 await expect(hero.getByRole('list',{name:'О глоссарии'}).locator('li')).toHaveText(['394 термина','11 тем','2 уровня']);
 await expect(hero.locator('.glossary-lead')).toContainText('Сначала выбери тему');
 await expect(hero.getByRole('button',{name:'Скопировать для агента'})).toBeVisible();
 // Порядок: hero → фильтр → первая тема.
 const order=await page.evaluate(()=>{const at=(s:string)=>document.querySelector(s)!;const after=(a:Element,b:Element)=>!!(a.compareDocumentPosition(b)&Node.DOCUMENT_POSITION_FOLLOWING);return after(at('.glossary-page>.ct-hero'),at('.glossary-filter'))&&after(at('.glossary-filter'),at('.ct-prose h2'));});
 expect(order).toBe(true);
 // Темы получают copy link шаблона вместо «#».
 const topics=page.locator('.ct-prose h2[id]');
 await expect(page.locator('.ct-prose h2 .ct-copy')).toHaveCount(await topics.count());
 await expect(page.locator('.ct-prose .permalink')).toHaveCount(0);
 await expect(topics.first().getByRole('button')).toHaveAccessibleName(/^Скопировать ссылку на раздел «23\.1\./);
 expect(errors).toEqual([]);
});

for(const width of [320,1440])test(`glossary hero at ${width}px: no horizontal scroll, axe`,async({page})=>{
 await page.setViewportSize({width,height:900});
 await ready(page);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
 await settled(page);await page.addScriptTag({path:'node_modules/axe-core/axe.min.js'});
 const violations=await page.evaluate(async()=>{const result=await(window as unknown as {axe:{run:(context:string,options:object)=>Promise<{violations:{id:string}[]}>}}).axe.run('main .glossary-page>.ct-hero',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});return result.violations.map(v=>v.id);});
 expect(violations).toEqual([]);
});
