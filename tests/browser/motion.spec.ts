import {test,expect,type Page} from '@playwright/test';
// Motion system (P3-05, docs/design/visual-language.md section 7): one curve and token durations,
// page transitions through the View Transitions API, and two switches that remove every animation.
async function ready(page:Page,path:string){await page.goto(path);await page.waitForSelector('html.js-enabled');await expect(page.locator('.search-trigger')).toBeEnabled();}
// Record View Transitions and every CSS animation or transition that starts; the API call itself is passed through.
async function record(page:Page){await page.addInitScript(()=>{const w=window as unknown as {__transitions:number;__started:string[]};w.__transitions=0;w.__started=[];const doc=document as unknown as {startViewTransition?:(...a:unknown[])=>unknown};const start=doc.startViewTransition?.bind(document);if(start)doc.startViewTransition=(...a:unknown[])=>{w.__transitions++;return start(...a);};for(const type of ['animationstart','transitionrun'])addEventListener(type,event=>{const e=event as AnimationEvent&TransitionEvent;w.__started.push(`${type}:${e.animationName??e.propertyName}`);},true);});}
const transitions=(page:Page)=>page.evaluate(()=>(window as unknown as {__transitions:number}).__transitions);
const started=(page:Page)=>page.evaluate(()=>(window as unknown as {__started:string[]}).__started);
const probe=(page:Page)=>page.evaluate(()=>{const a=document.createElement('a');a.href='/chapters/06#ch-06-6-2-definition-of-ready';a.id='motion-probe';a.textContent='6.2';const prose=document.querySelector('.reader-prose');prose?.insertBefore(a,prose.firstChild);});
// Interactions that start animations when motion is on: hover, page change, search dialog, details.
async function exercise(page:Page){
 const link=page.locator('.sidebar a[href="/flow/08-preflight"]');await link.hover();await link.click();await expect(page.locator('main [data-chapter="ch-08"]')).toBeVisible();
 await page.keyboard.press('Control+k');await expect(page.locator('.search-dialog')).toBeVisible();await page.keyboard.press('Escape');
 const details=page.locator('main details').first();if(await details.count())await details.locator('summary').click();
}

for(const mode of ['reduced-motion','data-motion-off'] as const)test(`no animation with ${mode}`,async({page})=>{
 await record(page);
 if(mode==='reduced-motion')await page.emulateMedia({reducedMotion:'reduce'});
 await ready(page,'/chapters/07');
 if(mode==='data-motion-off')await page.evaluate(()=>document.documentElement.setAttribute('data-motion','off'));
 expect(await page.evaluate(()=>parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--dur-3')))).toBe(0);
 await page.evaluate(()=>{(window as unknown as {__started:string[]}).__started=[];});
 await exercise(page);
 expect(await started(page)).toEqual([]);
 expect(await page.evaluate(()=>document.getAnimations().length)).toBe(0);
 expect(await transitions(page)).toBe(0);
 // Navigation does not depend on the motion setting: a link in the text is a client navigation here too.
 await page.evaluate(()=>{(window as unknown as {__marker:boolean}).__marker=true;});
 await probe(page);await page.locator('#motion-probe').click();
 await expect(page.locator('[id="ch-06-6-2-definition-of-ready"]')).toBeInViewport();
 expect(await page.evaluate(()=>(window as unknown as {__marker?:boolean}).__marker)).toBe(true);
});

test('page transition keeps keyboard focus and anchor scroll',async({page})=>{
 await record(page);
 await page.emulateMedia({reducedMotion:'no-preference'});
 await ready(page,'/chapters/07');
 expect(await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--ease').replace(/\s/g,''))).toBe('cubic-bezier(.2,0,0,1)');
 const supported=await page.evaluate(()=>'startViewTransition' in document);
 // From the bottom of a long chapter: the column must not fly in from its old position.
 await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));
 const next=page.locator('.pagination-next');await next.focus();await page.keyboard.press('Enter');
 const pseudo=await page.evaluate(()=>new Promise<string[]>(resolve=>requestAnimationFrame(()=>resolve(document.getAnimations().map(a=>(a.effect as KeyframeEffect|null)?.pseudoElement??'').filter(Boolean)))));
 expect(pseudo.filter(p=>/group\(page\)|old\(page\)/.test(p))).toEqual([]);
 await expect(page).toHaveURL(/\/flow\/08-preflight$/);await expect(page.locator('main [data-chapter="ch-08"]')).toBeVisible();
 await expect(page.locator('main#reader')).toBeFocused();
 if(supported)expect(await transitions(page)).toBe(1);
 // A link to a section of another chapter lands on that section.
 await probe(page);await page.locator('#motion-probe').click();
 await expect(page).toHaveURL(/\/chapters\/06#ch-06-6-2-definition-of-ready$/);
 await expect(page.locator('[id="ch-06-6-2-definition-of-ready"]')).toBeInViewport();
 // A search result on another page starts one transition, not two.
 const before=await transitions(page);
 await page.keyboard.press('Control+k');await page.locator('#handbook-search').fill('preflight');
 const results=page.locator('#search-results [role=option]');await expect(results.first()).toBeVisible();
 const other=page.locator('#search-results [role=option]:not([href^="/chapters/06#"])').first();
 const href=(await other.getAttribute('href'))!;await other.click();
 await expect(page).toHaveURL(new URL(href,page.url()).href);
 if(supported)expect(await transitions(page)).toBe(before+1);
});
