import {test,expect,type Page} from '@playwright/test';
// Motion system (P3-05, docs/design/visual-language.md section 7): one curve and token durations,
// page transitions through the View Transitions API, and two switches that remove every animation.
async function ready(page:Page,path:string){await page.goto(path);await page.waitForSelector('html.js-enabled');await expect(page.locator('.search-trigger')).toBeEnabled();}
// Count View Transitions started by the page; the call itself is passed through unchanged.
async function countTransitions(page:Page){await page.addInitScript(()=>{const w=window as unknown as {__transitions:number};w.__transitions=0;const doc=document as unknown as {startViewTransition?:(...a:unknown[])=>unknown};const start=doc.startViewTransition?.bind(document);if(start)doc.startViewTransition=(...a:unknown[])=>{w.__transitions++;return start(...a);};});}
const transitions=(page:Page)=>page.evaluate(()=>(window as unknown as {__transitions:number}).__transitions);
// Interactions that start animations when motion is on: page change, search dialog, details, panel choice.
async function exercise(page:Page){
 await page.locator('.sidebar a[href="/chapters/08"]').click();await expect(page.locator('main [data-chapter="ch-08"]')).toBeVisible();
 await page.keyboard.press('Control+k');await expect(page.locator('.search-dialog')).toBeVisible();await page.keyboard.press('Escape');
 const details=page.locator('main details').first();if(await details.count())await details.locator('summary').click();
}
const running=(page:Page)=>page.evaluate(()=>document.getAnimations().map(a=>(a as CSSAnimation).animationName??(a as CSSTransition).transitionProperty??'script'));

for(const mode of ['reduced-motion','data-motion-off'] as const)test(`no animation with ${mode}`,async({page})=>{
 await countTransitions(page);
 if(mode==='reduced-motion')await page.emulateMedia({reducedMotion:'reduce'});
 await ready(page,'/chapters/07');
 if(mode==='data-motion-off')await page.evaluate(()=>document.documentElement.setAttribute('data-motion','off'));
 expect(await page.evaluate(()=>parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--dur-3')))).toBe(0);
 await exercise(page);
 expect(await running(page)).toEqual([]);
 expect(await transitions(page)).toBe(0);
 expect(await page.locator('.sidebar a').first().evaluate(el=>getComputedStyle(el).transitionDuration)).toBe('0s');
});

test('page transition keeps keyboard focus and anchor scroll',async({page})=>{
 await countTransitions(page);
 await page.emulateMedia({reducedMotion:'no-preference'});
 await ready(page,'/chapters/07');
 expect(await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--ease').replace(/\s/g,''))).toBe('cubic-bezier(.2,0,0,1)');
 const next=page.locator('.pagination-next');await next.focus();await page.keyboard.press('Enter');
 await expect(page).toHaveURL(/\/chapters\/08$/);await expect(page.locator('main [data-chapter="ch-08"]')).toBeVisible();
 await expect(page.locator('main#reader')).toBeFocused();
 const supported=await page.evaluate(()=>'startViewTransition' in document);
 if(supported)expect(await transitions(page)).toBeGreaterThan(0);
 // A link to a section of another chapter lands on that section.
 await page.evaluate(()=>{const a=document.createElement('a');a.href='/chapters/06#ch-06-6-2-definition-of-ready';a.id='motion-probe';a.textContent='6.2';const prose=document.querySelector('.reader-prose');prose?.insertBefore(a,prose.firstChild);});
 await page.locator('#motion-probe').click();
 await expect(page).toHaveURL(/\/chapters\/06#ch-06-6-2-definition-of-ready$/);
 await expect(page.locator('[id="ch-06-6-2-definition-of-ready"]')).toBeInViewport();
});
