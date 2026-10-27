import {test,expect,type Page} from '@playwright/test';
import fs from 'node:fs';
// Navigation rail and mega-menu (P3-01): hover, focus, tap, keyboard, addresses and accessibility.
const urlMap=JSON.parse(fs.readFileSync('src/content/url-map.json','utf8')) as {pages:{old:string;new:string}[]};
async function ready(page:Page,path:string){await page.goto(path);await page.waitForSelector('html.js-enabled');await expect(page.locator('.search-trigger')).toBeEnabled();}
const item=(page:Page,id:string)=>page.locator(`.rail-entry[data-section=${id}] .rail-item`);
const menu=(page:Page,id:string)=>page.locator(`#mega-${id}`);

test('rail shows nine sections and marks the current one',async({page})=>{
 await ready(page,'/chapters/08');
 await expect(page.locator('.rail-item')).toHaveText(['Главная','Начать','Основы','Процесс','Контроль','Надёжность','Практика','Инструменты','Agent Pack']);
 await expect(item(page,'flow')).toHaveAttribute('aria-current','page');
 await expect(page.locator('.rail-item[tabindex="0"]')).toHaveCount(1);
 await expect(menu(page,'flow').locator('.mega-item[aria-current=page]')).toHaveAttribute('href','/chapters/08');
 await expect(page.locator('.mega-menu:visible')).toHaveCount(0);
});

test('hover opens the menu after a short delay and leaving closes it',async({page})=>{
 await ready(page,'/chapters/08');
 await item(page,'control').hover();
 await expect(menu(page,'control')).toBeVisible();await expect(item(page,'control')).toHaveAttribute('aria-expanded','true');
 // Moving from the rail into the menu keeps it open.
 await menu(page,'control').locator('.mega-item').first().hover();await page.waitForTimeout(400);
 await expect(menu(page,'control')).toBeVisible();
 await item(page,'reliability').hover();await expect(menu(page,'reliability')).toBeVisible();await expect(menu(page,'control')).toBeHidden();
 await page.mouse.move(900,500);await expect(menu(page,'reliability')).toBeHidden();
});

test('keyboard: focus opens, Tab enters the menu, arrows move, Esc returns focus to the rail',async({page})=>{
 await ready(page,'/chapters/08');
 await item(page,'flow').focus();
 await expect(menu(page,'flow')).toBeVisible();
 await page.keyboard.press('Tab');
 await expect(menu(page,'flow').locator('.mega-item').first()).toBeFocused();
 await page.keyboard.press('ArrowDown');await expect(menu(page,'flow').locator('.mega-item').nth(1)).toBeFocused();
 await page.keyboard.press('Escape');
 await expect(menu(page,'flow')).toBeHidden();await expect(item(page,'flow')).toBeFocused();
 // Arrows move along the rail; the focused section opens; ArrowRight enters its menu.
 await page.keyboard.press('ArrowDown');await expect(item(page,'control')).toBeFocused();await expect(menu(page,'control')).toBeVisible();
 await expect(item(page,'control')).toHaveAttribute('tabindex','0');await expect(item(page,'flow')).toHaveAttribute('tabindex','-1');
 await page.keyboard.press('ArrowRight');await expect(menu(page,'control').locator('.mega-item').first()).toBeFocused();
 await page.keyboard.press('ArrowUp');await expect(item(page,'control')).toBeFocused();
 await page.keyboard.press('End');await expect(item(page,'agents')).toBeFocused();
 await page.keyboard.press('Home');await expect(item(page,'home')).toBeFocused();await expect(page.locator('.mega-menu:visible')).toHaveCount(0);
 // Enter on a menu link navigates and closes the menu.
 await page.keyboard.press('ArrowDown');await page.keyboard.press('ArrowRight');
 await expect(menu(page,'start').locator('.mega-item').nth(1)).toHaveAttribute('href','/chapters/01');
 await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
 await expect(page).toHaveURL(/\/chapters\/01$/);await expect(page.locator('.mega-menu:visible')).toHaveCount(0);
});

test('tap opens the menu first, a second tap follows the rail link',async({browser})=>{
 const context=await browser.newContext({hasTouch:true,viewport:{width:1280,height:900},baseURL:test.info().project.use.baseURL});
 const page=await context.newPage();
 await ready(page,'/chapters/08');
 await item(page,'base').tap();
 await expect(menu(page,'base')).toBeVisible();await expect(page).toHaveURL(/\/chapters\/08$/);
 await menu(page,'base').locator('.mega-item[href="/chapters/03"]').tap();
 await expect(page).toHaveURL(/\/chapters\/03$/);await expect(page.locator('.mega-menu:visible')).toHaveCount(0);
 await item(page,'flow').tap();await expect(menu(page,'flow')).toBeVisible();
 await item(page,'flow').tap();await expect(page).toHaveURL(/\/chapters\/06$/);
 await context.close();
});

test('every mega-menu link leads to an existing address from the URL map',async({page,request})=>{
 await ready(page,'/chapters/08');
 const hrefs=await page.locator('.mega-menu a').evaluateAll(links=>links.map(a=>a.getAttribute('href')!));
 const mapped=new Set(urlMap.pages.flatMap(p=>[p.old,p.new])),extra=new Set(['/handbook.md','/print']);
 expect(hrefs.length).toBeGreaterThan(25);
 for(const href of new Set(hrefs)){
  expect(mapped.has(href)||extra.has(href),href).toBe(true);
  expect((await request.get(href,{maxRedirects:0})).status(),href).toBe(200);
 }
 // Every chapter of the URL map is reachable from the rail.
 for(let i=1;i<=22;i++)expect(hrefs).toContain(`/chapters/${String(i).padStart(2,'0')}`);
});

test('progress in the menu follows chapter completion',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('handbook-learning-v2',JSON.stringify({completed:['ch-06','ch-07'],exercises:[]})));
 await ready(page,'/chapters/08');
 await item(page,'flow').hover();
 await expect(menu(page,'flow').locator('.mega-progress')).toContainText('2 из 6 пройдено');
 await expect(menu(page,'flow').locator('.mega-progress a')).toHaveAttribute('href','/chapters/08');
 await expect(menu(page,'flow').locator('.nav-ring-done')).toHaveCount(2);
});

test('below 1024 px the rail is hidden and the menu button stays',async({page})=>{
 for(const width of [320,360,768,1023]){
  await page.setViewportSize({width,height:900});await ready(page,'/chapters/08');
  await expect(page.locator('.nav-rail')).toBeHidden();await expect(page.locator('.menu-trigger')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 await page.setViewportSize({width:1024,height:900});await ready(page,'/chapters/08');
 await expect(page.locator('.nav-rail')).toBeVisible();await expect(page.locator('.menu-trigger')).toBeHidden();
});

test('axe: no serious or critical violations with the menu closed and open',async({page})=>{
 for(const path of ['/','/chapters/08']){
  await ready(page,path);
  for(const open of [false,true]){
   if(open){await item(page,'flow').focus();await expect(menu(page,'flow')).toBeVisible();}
   await page.addScriptTag({path:'node_modules/axe-core/axe.min.js'});
   const violations=await page.evaluate(async()=>{const result=await(window as unknown as {axe:{run:(context:unknown,options:object)=>Promise<{violations:{id:string;impact:string}[]}>}}).axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}});return result.violations.filter(v=>v.impact==='serious'||v.impact==='critical').map(v=>v.id);});
   expect(violations,`${path} open=${open}`).toEqual([]);
  }
 }
});
