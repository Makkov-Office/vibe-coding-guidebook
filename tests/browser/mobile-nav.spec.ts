import {test,expect,type Page} from '@playwright/test';
import fs from 'node:fs';
// Mobile navigation (P3-02): bottom bar and the full-screen section menu below 1024 px.
const urlMap=JSON.parse(fs.readFileSync('src/content/url-map.json','utf8')) as {pages:{old:string;new:string;chapter?:string}[]};
async function ready(page:Page,path:string,width=360){await page.setViewportSize({width,height:800});await page.goto(path);await page.waitForSelector('html.js-enabled');await expect(page.getByRole('button',{name:'Разделы',exact:true})).toBeEnabled();}
const bar=(page:Page)=>page.getByRole('navigation',{name:'Навигация'}),menu=(page:Page)=>page.locator('#section-menu');
const section=(page:Page,label:string)=>menu(page).getByRole('button',{name:label,exact:true});

test('below 1024 px the bottom bar replaces the rail, without horizontal scroll',async({page})=>{
 for(const width of [320,360,768,1023]){
  await ready(page,'/flow/08-preflight',width);
  await expect(bar(page)).toBeVisible();await expect(page.locator('.nav-rail')).toBeHidden();
  await expect(bar(page).locator('a,button')).toHaveText(['Главная','Разделы','Поиск','Продолжить']);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  // The bar does not cover the end of the page.
  await page.locator('.reader-footer').scrollIntoViewIfNeeded();
  const footer=(await page.locator('.reader-footer').boundingBox())!,top=(await bar(page).boundingBox())!.y;
  expect(footer.y+footer.height).toBeLessThanOrEqual(top+1);
 }
 await page.setViewportSize({width:1024,height:800});await expect(bar(page)).toBeHidden();await expect(page.locator('.nav-rail')).toBeVisible();
});

test('the section menu opens with the current section expanded and closes with Esc and the close button',async({page})=>{
 await ready(page,'/flow/08-preflight');
 const trigger=page.getByRole('button',{name:'Разделы',exact:true});
 await trigger.click();await expect(menu(page)).toBeVisible();await expect(trigger).toHaveAttribute('aria-expanded','true');
 await expect(menu(page).locator('.section-row')).toHaveText(['Главная','Начать','Основы','Процесс','Контроль','Надёжность','Практика','Инструменты','Agent Pack']);
 await expect(section(page,'Процесс')).toHaveAttribute('aria-expanded','true');await expect(section(page,'Процесс')).toHaveAttribute('aria-current','true');
 await expect(menu(page).locator('.mega-item[aria-current=page]')).toHaveAttribute('href','/flow/08-preflight');
 await expect(section(page,'Основы')).toHaveAttribute('aria-expanded','false');
 await section(page,'Основы').click();await expect(menu(page).locator('#section-base')).toBeVisible();
 await section(page,'Основы').press('Enter');await expect(menu(page).locator('#section-base')).toBeHidden();
 await page.keyboard.press('Escape');await expect(menu(page)).toBeHidden();await expect(trigger).toBeFocused();await expect(trigger).toHaveAttribute('aria-expanded','false');
 await trigger.press('Enter');await expect(menu(page)).toBeVisible();
 await page.getByRole('button',{name:'Закрыть разделы'}).click();await expect(menu(page)).toBeHidden();await expect(trigger).toBeFocused();
});

// Choosing a page moves focus to the new page, not back to «Разделы» (P1-12, review of PR #28; was the drawer test).
for(const via of ['click','Enter'] as const)test(`choosing a chapter by ${via} closes the menu and focuses the new page`,async({page})=>{
 await ready(page,'/chapters/01');
 await page.getByRole('button',{name:'Разделы',exact:true}).click();await section(page,'Основы').click();
 const link=menu(page).locator('a[href="/chapters/05"]');
 if(via==='click')await link.click();else{await link.focus();await page.keyboard.press('Enter');}
 await expect(page).toHaveURL(/\/chapters\/05$/);await expect(page.locator('main [data-chapter="ch-05"]')).toBeVisible();await expect(menu(page)).toBeHidden();
 // The dialog close event and the route commit may land in either order; give both time to settle.
 await page.waitForTimeout(800);
 await expect(page.locator('main#reader')).toBeFocused();
});

test('every menu link leads to an existing address, and progress and «Продолжить» follow completion',async({page,request})=>{
 await page.addInitScript(()=>localStorage.setItem('handbook-learning-v2',JSON.stringify({completed:['ch-01','ch-02','ch-06'],exercises:[]})));
 await ready(page,'/flow/08-preflight');
 await expect(bar(page).getByRole('link',{name:'Продолжить'})).toHaveAttribute('href','/chapters/03');
 await page.getByRole('button',{name:'Разделы',exact:true}).click();
 for(const label of ['Начать','Основы','Контроль','Надёжность','Практика','Инструменты','Agent Pack'])await section(page,label).click();
 await expect(menu(page).locator('#section-flow .mega-progress')).toContainText('1 из 6 пройдено');
 const hrefs=await menu(page).locator('a').evaluateAll(links=>links.map(a=>a.getAttribute('href')!));
 const mapped=new Set(urlMap.pages.flatMap(p=>[p.old,p.new])),extra=new Set(['/handbook.md','/print','/agent-pack.zip','/llms.txt']);
 for(const href of new Set(hrefs)){
  expect(mapped.has(href)||extra.has(href),href).toBe(true);
  expect((await request.get(href,{maxRedirects:0})).status(),href).toBe(200);
 }
 // Every chapter is in the menu; a chapter that moved (P5) at its new address.
 for(let i=1;i<=22;i++){const id=`ch-${String(i).padStart(2,'0')}`,paths=urlMap.pages.filter(p=>p.chapter===id).flatMap(p=>[p.old,p.new]);expect(hrefs.some(href=>paths.includes(href)),id).toBe(true);}
});

test('«Поиск» in the bottom bar opens search; «Главная» marks the home page',async({page})=>{
 await ready(page,'/');
 await expect(bar(page).getByRole('link',{name:'Главная'})).toHaveAttribute('aria-current','page');
 await bar(page).getByRole('button',{name:'Поиск'}).click();await expect(page.locator('.search-dialog')).toBeVisible();await expect(page.locator('#handbook-search')).toBeFocused();
 // Closing search returns focus to the bar button that opened it, not to the header.
 await page.keyboard.press('Escape');await expect(page.locator('.search-dialog')).toBeHidden();await expect(bar(page).getByRole('button',{name:'Поиск'})).toBeFocused();
});

test('widening the window past 1024 px closes the section menu',async({page})=>{
 await ready(page,'/flow/08-preflight');
 await page.getByRole('button',{name:'Разделы',exact:true}).click();await expect(menu(page)).toBeVisible();
 await page.setViewportSize({width:1280,height:800});await expect(menu(page)).toBeHidden();await expect(page.locator('.nav-rail')).toBeVisible();
});

test('without JavaScript there is no bar, the chapter list stays and nothing scrolls sideways',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:360,height:800}}),page=await context.newPage();
 await page.goto('/flow/08-preflight');
 await expect(page.locator('.bottom-bar')).toBeHidden();await expect(page.locator('.sidebar a[href="/chapters/05"]')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await context.close();
});

test('axe: no serious or critical violations with the menu closed and open',async({page})=>{
 for(const path of ['/','/flow/08-preflight']){
  await ready(page,path);
  for(const open of [false,true]){
   if(open){await page.getByRole('button',{name:'Разделы',exact:true}).click();await expect(menu(page)).toBeVisible();}
   await page.evaluate(()=>Promise.all(document.getAnimations().filter(a=>Number.isFinite(Number(a.effect?.getComputedTiming().endTime))).map(a=>a.finished.catch(()=>undefined))));
   await page.addScriptTag({path:'node_modules/axe-core/axe.min.js'});
   const violations=await page.evaluate(async()=>{const result=await(window as unknown as {axe:{run:(context:unknown,options:object)=>Promise<{violations:{id:string;impact:string}[]}>}}).axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}});return result.violations.filter(v=>v.impact==='serious'||v.impact==='critical').map(v=>v.id);});
   expect(violations,`${path} open=${open}`).toEqual([]);
  }
 }
});

// Polish of the test slice (P3-06): Agent Pack from the menu, «Продолжить» on a chapter tab.
test('Agent Pack from the menu: one link to /agents, and the new page takes focus',async({page})=>{
 await ready(page,'/chapters/01');
 await page.getByRole('button',{name:'Разделы',exact:true}).click();await section(page,'Agent Pack').click();
 const panel=menu(page).locator('#section-agents');
 await expect(panel.locator('a[href="/agents"]')).toHaveCount(1);await expect(panel.getByRole('link',{name:'Открыть раздел'})).toHaveCount(0);
 await panel.locator('a[href="/agents"]').click();
 await expect(page).toHaveURL(/\/agents$/);await expect(menu(page)).toBeHidden();
 await page.waitForTimeout(800);
 await expect(page.locator('main#reader')).toBeFocused();
});

test('«Продолжить» is the current item on any tab of the chapter it leads to',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('handbook-learning-v2',JSON.stringify({completed:['ch-01','ch-02','ch-03','ch-04','ch-05','ch-06','ch-07'],exercises:[]})));
 await ready(page,'/flow/08-preflight/apply');
 const next=bar(page).getByRole('link',{name:'Продолжить'});
 await expect(next).toHaveAttribute('href','/flow/08-preflight');await expect(next).toHaveAttribute('aria-current','page');
});

// Mobile overhaul (P3-12): the bar steps aside while reading down, the menu is a bottom sheet dragged down to close,
// chapter tabs stack the icon over the label and shrink to icons once stuck.
test('the bar hides while scrolling down and returns on the way up',async({page})=>{
 await ready(page,'/flow/08-preflight');
 await page.mouse.move(180,300);
 await page.mouse.wheel(0,600);await expect(bar(page)).toHaveAttribute('data-hidden','');
 await expect.poll(async()=>(await bar(page).boundingBox())!.y).toBeGreaterThanOrEqual(800-1);
 await page.mouse.wheel(0,-200);await expect(bar(page)).not.toHaveAttribute('data-hidden');
 // Keyboard focus inside a hidden bar shows it.
 await page.mouse.wheel(0,600);await expect(bar(page)).toHaveAttribute('data-hidden','');
 await bar(page).getByRole('link',{name:'Главная'}).focus();
 await expect.poll(async()=>{const b=(await bar(page).boundingBox())!;return b.y+b.height;}).toBeLessThanOrEqual(801);
});

test('the section menu is a bottom sheet: «Продолжить» first, dragged down it closes',async({page})=>{
 await ready(page,'/flow/08-preflight');
 await page.getByRole('button',{name:'Разделы',exact:true}).click();await expect(menu(page)).toBeVisible();
 await expect(menu(page).locator('.menu-continue')).toHaveAttribute('href','/chapters/01');
 await expect(menu(page).locator('.menu-continue')).toContainText('0 из 22 глав пройдено');
 await page.evaluate(()=>Promise.all(document.getAnimations().map(a=>a.finished.catch(()=>undefined))));
 const sheet=(await menu(page).boundingBox())!;expect(sheet.y+sheet.height).toBeGreaterThanOrEqual(799);
 // A short drag springs back; a long one closes the sheet.
 const header=(await menu(page).locator('.section-menu-header').boundingBox())!,x=header.x+60,y=header.y+20;
 await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x,y+30,{steps:5});await page.mouse.up();
 await expect(menu(page)).toBeVisible();
 await page.waitForTimeout(600);
 await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x,y+200,{steps:20});await page.mouse.up();
 await expect(menu(page)).toBeHidden();await expect(page.getByRole('button',{name:'Разделы',exact:true})).toBeFocused();
});

test('on a phone chapter tabs fit without scrolling and shrink to icons when stuck, names intact',async({page})=>{
 for(const width of [360,390,430]){
  await ready(page,'/flow/08-preflight',width);
  const tabs=page.locator('.page-tabs');await expect(tabs).toHaveAttribute('data-icons','true');
  expect(await tabs.locator('ul').evaluate(list=>list.scrollWidth<=list.clientWidth)).toBe(true);
  await expect(tabs.getByRole('link')).toHaveText(['Обзор','Как устроено','Как применять','Проверь себя']);
  await page.mouse.move(width/2,400);await page.mouse.wheel(0,1200);await expect(tabs).toHaveAttribute('data-stuck','true');
  await page.evaluate(()=>Promise.all(document.getAnimations().map(a=>a.finished.catch(()=>undefined))));
  // Other tabs are icons of at least 44 px; the current one keeps its label; names stay for assistive tech.
  const sizes=await tabs.locator('a').evaluateAll(links=>links.map(a=>{const r=a.getBoundingClientRect();return {w:r.width,h:r.height,current:a.hasAttribute('aria-current')};}));
  for(const size of sizes){expect(size.h).toBeGreaterThanOrEqual(44);expect(size.w).toBeGreaterThanOrEqual(44);if(!size.current)expect(size.w).toBeLessThan(60);}
  await expect(tabs.getByRole('link',{name:'Как устроено'})).toBeVisible();
 }
});

// Review of PR #127: a gesture ends wherever the pointer is released; the next click after a drag works;
// a bar button left focused by a tap does not keep the bar on screen.
test('the sheet gesture ends outside the header and leaves the next click alone',async({page})=>{
 await ready(page,'/flow/08-preflight',390);
 await page.getByRole('button',{name:'Разделы',exact:true}).click();await expect(menu(page)).toBeVisible();
 await page.evaluate(()=>Promise.all(document.getAnimations().map(a=>a.finished.catch(()=>undefined))));
 const header=(await menu(page).locator('.section-menu-header').boundingBox())!,x=header.x+60,y=header.y+20;
 // Pressed on the header, released above it: hovering the header afterwards does not drag the sheet.
 await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x,y-80,{steps:5});await page.mouse.up();
 await page.mouse.move(x,y+40,{steps:5});
 await expect(menu(page)).not.toHaveAttribute('data-dragging');expect(await menu(page).evaluate(n=>n.style.translate)).toBe('');
 // A short drag springs back; one click on «Закрыть разделы» then closes the sheet.
 await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x,y+30,{steps:5});await page.mouse.up();
 await expect(menu(page)).toBeVisible();await page.waitForTimeout(600);
 await page.getByRole('button',{name:'Закрыть разделы'}).click();await expect(menu(page)).toBeHidden();
});

test('after a tap on the bar the bar still hides on scroll',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:800},hasTouch:true,isMobile:true}),page=await context.newPage();
 await page.goto('/flow/08-preflight');await page.waitForSelector('html.js-enabled');
 await page.getByRole('button',{name:'Разделы',exact:true}).tap();await expect(menu(page)).toBeVisible();
 await page.getByRole('button',{name:'Закрыть разделы'}).tap();await expect(menu(page)).toBeHidden();
 await page.evaluate(()=>scrollBy(0,400));await page.waitForTimeout(100);await page.evaluate(()=>scrollBy(0,500));
 await expect(bar(page)).toHaveAttribute('data-hidden','');
 await expect.poll(async()=>(await bar(page).boundingBox())!.y).toBeGreaterThanOrEqual(799);
 await context.close();
});
