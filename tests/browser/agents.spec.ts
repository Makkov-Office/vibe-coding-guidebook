import {test,expect,type Page} from '@playwright/test';
// Agent delivery (P8-03): /agents, the archive download, llms.txt and «Скопировать для агента».
async function ready(page:Page,path:string){await page.goto(path);await page.waitForSelector('html.js-enabled');await expect(page.locator('.search-trigger')).toBeEnabled();}
async function settled(page:Page){await page.evaluate(()=>Promise.all(document.getAnimations().filter(a=>Number.isFinite(Number(a.effect?.getComputedTiming().endTime))).map(a=>a.finished.catch(()=>undefined))));}

test('/agents offers the archive, llms.txt and the pack description',async({page,request})=>{
 await ready(page,'/agents');
 await expect(page.locator('main h1')).toHaveText('Agent Pack');
 const download=page.getByRole('link',{name:'Скачать Agent Pack (.zip)'});
 await expect(download).toHaveAttribute('href','/agent-pack.zip');
 const [file]=await Promise.all([page.waitForEvent('download'),download.click()]);
 expect(file.suggestedFilename()).toBe('agent-pack.zip');
 const zip=await request.get('/agent-pack.zip');expect(zip.status()).toBe(200);expect(zip.headers()['content-type']).toContain('zip');
 expect((await zip.body()).subarray(0,4).toString('hex')).toBe('504b0304');
 for(const path of ['/llms.txt','/llms-full.txt']){const r=await request.get(path);expect(r.status(),path).toBe(200);expect(await r.text()).toMatch(/^# /);}
 await expect(page.locator('.agents-files li')).not.toHaveCount(0);
 await expect(page.locator('main')).toContainText('AGENTS.md');
 await expect(page.locator('.route-loading')).toBeEmpty();
});

test('«Скопировать для агента» copies the page Markdown from the keyboard and announces it',async({page,context,request})=>{
 await context.grantPermissions(['clipboard-read','clipboard-write']);
 await ready(page,'/flow/08-preflight');
 const button=page.getByRole('button',{name:'Скопировать для агента'});
 // The live region is in the accessibility tree before the first message, so screen readers announce it.
 expect(await page.locator('.agent-copy [role=status]').evaluate(e=>getComputedStyle(e).display)).not.toBe('none');
 await button.focus();await page.keyboard.press('Enter');
 await expect(page.locator('.agent-copy [role=status]')).toHaveText(/скопирован/);
 const expected=await (await request.get('/flow/08-preflight.md')).text();
 // The address the pack used before the move still serves the same Markdown.
 expect(await (await request.get('/chapters/08.md')).text()).toBe(expected);
 expect(expected).toMatch(/^## 08\. Preflight/);
 expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe(expected);
 await expect(page.getByRole('link',{name:'Markdown страницы'})).toHaveAttribute('href','/flow/08-preflight.md');
 // Every tab of the chapter, the introduction and the tool reviews have the button too.
 for(const [path,md] of [['/flow/08-preflight/apply','/flow/08-preflight.md'],['/flow/08-preflight/check','/flow/08-preflight.md'],['/','/index.md'],['/tools/claude-code','/tools/claude-code.md'],['/reference/glossary','/reference/glossary.md']]){
  await ready(page,path);await expect(page.locator('.agent-copy a')).toHaveAttribute('href',md);
 }
});

test('/agents: no overflow from 320 px and no serious or critical axe violations',async({page})=>{
 for(const width of [320,360,768,1024,1440]){
  await page.setViewportSize({width,height:900});await ready(page,'/agents');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width}`).toBe(true);
 }
 await settled(page);await page.addScriptTag({path:'node_modules/axe-core/axe.min.js'});
 const violations=await page.evaluate(async()=>{const result=await(window as unknown as {axe:{run:(context:unknown,options:object)=>Promise<{violations:{id:string;impact:string}[]}>}}).axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}});return result.violations.filter(v=>v.impact==='serious'||v.impact==='critical').map(v=>v.id);});
 expect(violations).toEqual([]);
});
