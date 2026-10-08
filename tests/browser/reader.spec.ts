import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const generated=JSON.parse(fs.readFileSync('src/content/generated.json','utf8')) as {blocks:{id:string;language:string;raw:string}[]};
test('initial HTML contains every chapter; all internal anchors and definitions resolve',async({page,request})=>{
  const response=await request.get('/');expect(response.status()).toBe(200);const html=await response.text();expect(html).toContain('Полный тематический глоссарий');expect(html).not.toContain('## 17. README и handoff');
  await page.goto('/');await expect(page.locator('[data-chapter]')).toHaveCount(24);await expect(page.locator('.term-definition')).toHaveCount(451);
  const problems=await page.evaluate(()=>{const ids=[...document.querySelectorAll('[id]')].map(n=>n.id);return {duplicates:ids.filter((id,i)=>ids.indexOf(id)!==i),missing:[...document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')].filter(a=>!document.getElementById(decodeURIComponent(a.hash.slice(1)))).map(a=>a.hash),nested:document.querySelectorAll('a a').length};});expect(problems).toEqual({duplicates:[],missing:[],nested:0});
});
test('search includes glossary, prose and hidden prompts; keyboard/Esc restore focus',async({page})=>{
  await page.goto('/');await page.locator('.search-trigger').click();await expect(page.getByRole('dialog',{name:'Поиск по руководству'})).toBeVisible();
  for(const query of ['harness','источники истины','preflight','security','In Review','merge order','least privilege','ADR','worktree']){await page.getByLabel('Термин, фраза или текст примера').fill(query);await expect(page.locator('.search-results>a').first()).toBeVisible();}
  await page.getByLabel('Термин, фраза или текст примера').fill('zzzz-no-match');await expect(page.locator('.empty-state')).toContainText('ничего не найдено');
  await page.getByLabel('Термин, фраза или текст примера').fill('Бери в работу');await page.getByLabel('Термин, фраза или текст примера').press('Enter');await expect(page.locator('details.deep-dive[open]').first()).toBeVisible();
  await page.keyboard.press('Control+k');await page.keyboard.press('Escape');await expect(page.locator('.search-trigger')).toBeFocused();
});
test('glossary links reveal filtered definitions, highlight, repeat, reload and back',async({page})=>{
  await page.goto('/#ch-01');await page.getByLabel('Термин',{exact:true}).fill('zzzz-no-match');
  const link=page.locator('[data-chapter="ch-01"] a[href="#term-harness"]').first();await link.click();await expect(page.locator('#term-harness')).toBeVisible();await expect(page.locator('#term-harness')).toHaveClass(/term-arrival/);await expect(page.locator('#term-harness')).toBeFocused();await expect(page.getByLabel('Термин',{exact:true})).toHaveValue('');
  await page.waitForTimeout(1150);await expect(page.locator('#term-harness')).not.toHaveClass(/term-arrival/);await page.goBack();await expect(page).toHaveURL(/#ch-01$/);await link.click();await expect(page.locator('#term-harness')).toHaveClass(/term-arrival/);await page.reload();await expect(page.locator('#term-harness')).toBeVisible();
});
test('all learning controls expose correct scenario evidence',async({page})=>{
  await page.goto('/#lifecycle-panel');await page.getByRole('radio',{name:'Review findings',exact:true}).check();await expect(page.locator('[data-scenario="findings"]')).toContainText('остаётся In Review');await page.getByRole('radio',{name:'Unavailable evidence',exact:true}).check();await expect(page.locator('[data-scenario="unavailable"]')).toContainText('INCOMPLETE');
  for(const panel of ['architecture','lifecycle','collisions','maturity']){const buttons=page.locator(`[data-panel="${panel}"] .node-list button`);for(let i=0;i<await buttons.count();i++){await buttons.nth(i).focus();await page.keyboard.press('Enter');await expect(buttons.nth(i)).toHaveAttribute('aria-pressed','true');}}
  await page.locator('[data-panel="lifecycle"]').scrollIntoViewIfNeeded();await page.screenshot({path:'docs/screenshots/lifecycle.png'});
});
test('copy preserves Unicode/newlines byte-for-byte and reports failure',async({page})=>{
  await page.goto('/');await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async(text:string)=>{(window as unknown as {copied:string}).copied=text;}}});});
  const block=generated.blocks.find(b=>b.language==='text')!;await page.locator(`#${block.id} summary`).click();await page.locator(`[data-copy="${block.id}"]`).click();expect(await page.evaluate(()=>(window as unknown as {copied:string}).copied)).toBe(block.raw);
  await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('denied');}}});});await page.locator(`[data-copy="${block.id}"]`).click();await expect(page.locator(`[data-copy="${block.id}"]`)).toHaveText('Выделите текст');
});
test('responsive widths, mobile drawer, no overflow and screenshots',async({page})=>{
  await page.goto('/');for(const width of [320,360,768,1024,1440]){await page.setViewportSize({width,height:900});await page.evaluate(()=>scrollTo(0,0));expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`width ${width}`).toBe(true);if(width===1440)await page.screenshot({path:'docs/screenshots/desktop.png'});}
  await page.setViewportSize({width:360,height:800});await page.getByRole('button',{name:'Открыть меню глав'}).click();await expect(page.locator('.drawer')).toBeVisible();await page.screenshot({path:'docs/screenshots/mobile-navigation.png'});await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:'Открыть меню глав'})).toBeFocused();
  await page.setViewportSize({width:640,height:1000});await page.evaluate(()=>{document.documentElement.style.zoom='2';});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('storage denied, reduced motion, print, no-JS all preserve reading',async({browser})=>{
  const context=await browser.newContext({reducedMotion:'reduce',viewport:{width:360,height:800}});await context.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw Error('denied');}});});const page=await context.newPage();const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://localhost:3000/#term-worktree');await expect(page.locator('#term-worktree')).toBeVisible();await expect(page.locator('#term-worktree')).toHaveClass(/term-arrival/);await page.emulateMedia({media:'print'});await expect(page.locator('.topbar')).toBeHidden();await expect(page.locator('details.deep-dive pre').first()).toBeVisible();expect(errors).toEqual([]);await context.close();
  const nojs=await browser.newContext({javaScriptEnabled:false});const p=await nojs.newPage();await p.goto('http://localhost:3000/#ch-07');await expect(p.locator('[data-chapter]')).toHaveCount(24);await expect(p.locator('#term-worktree')).toBeVisible();await nojs.close();
});
test('accessibility scan of reader, dialog and interactive panels',async({page})=>{
  await page.goto('/');await page.addScriptTag({content:fs.readFileSync('node_modules/axe-core/axe.min.js','utf8')});
  const run=()=>page.evaluate(async()=>{const axe=(window as unknown as {axe:{run:(root:Document,options:unknown)=>Promise<{violations:{id:string;impact:string;nodes:{target:string[]}[]}[]}>}}).axe;return (await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations;});
  expect(await run()).toEqual([]);await page.locator('.search-trigger').click();expect(await run()).toEqual([]);
});
test('all seven diagrams render safely without runtime errors',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await page.waitForSelector('html.js-enabled');
  const figures=page.locator('[data-diagram]');for(let i=0;i<await figures.count();i++){await figures.nth(i).scrollIntoViewIfNeeded();await expect(figures.nth(i)).toHaveClass(/diagram-ready/,{timeout:30000});}
  expect(errors).toEqual([]);
});
