import {test,expect,type Page} from '@playwright/test';
import fs from 'node:fs';
// Search ⌘K and breadcrumbs (P3-03): rail button, bottom bar, shortcuts, grouped results, suggestions.
const data=JSON.parse(fs.readFileSync('src/content/generated.json','utf8')) as {chapters:{id:string;path:string;href?:string;title:string}[]};
async function ready(page:Page,path:string,width=1440){await page.setViewportSize({width,height:900});await page.goto(path);await page.waitForSelector('html.js-enabled');await expect(page.locator('.rail-search')).toBeEnabled();}
const dialog=(page:Page)=>page.locator('.search-dialog'),input=(page:Page)=>page.locator('#handbook-search');
const railSearch=(page:Page)=>page.locator('.nav-rail').getByRole('button',{name:'Поиск',exact:true});
const group=(page:Page,label:string)=>page.locator('#search-results').getByRole('group',{name:label});

test('the rail button, Ctrl+K, Meta+K and «/» open search; Esc returns focus',async({page})=>{
 await ready(page,'/flow/08-preflight');
 await railSearch(page).click();await expect(dialog(page)).toBeVisible();await expect(input(page)).toBeFocused();
 await page.keyboard.press('Escape');await expect(dialog(page)).toBeHidden();await expect(railSearch(page)).toBeFocused();
 for(const keys of ['Control+k','Meta+k','/']){
  // A shortcut has no opener: focus returns to what had it before (main after a click in the text; P3-07, no header button).
  await page.locator('main h1').first().click();await page.keyboard.press(keys);await expect(dialog(page)).toBeVisible();
  await page.keyboard.press('Escape');await expect(page.locator('main#reader')).toBeFocused();
 }
 // «/» while typing stays a character.
 await ready(page,'/reference/glossary');const filter=page.getByLabel('Термин',{exact:true});await filter.click();await page.keyboard.type('a/b');
 await expect(filter).toHaveValue('a/b');await expect(dialog(page)).toBeHidden();
 // P3-07: no header above the page; search lives in the rail, and below 1024 px in the bottom bar.
 await expect(page.locator('header.topbar')).toHaveCount(0);
 await page.setViewportSize({width:800,height:900});await expect(page.locator('.bottom-bar').getByRole('button',{name:'Поиск'})).toBeVisible();
});

test('results are grouped; a term shows its level and opens the glossary on #term-*, keyboard only',async({page})=>{
 await ready(page,'/chapters/03');await page.keyboard.press('Control+k');
 await input(page).fill('harness');
 const groups=page.locator('#search-results [role=group]');
 await expect(groups.first()).toBeVisible();
 const labels=await groups.evaluateAll(list=>list.map(g=>g.getAttribute('aria-label')));
 const order=['Страницы и разделы','Термины глоссария','Памятка','Текст и примеры'];
 expect(labels.length).toBeGreaterThan(1);expect(labels).toEqual(order.filter(label=>labels.includes(label)));
 const term=group(page,'Термины глоссария').getByRole('option').first();
 await expect(term).toHaveAttribute('href','/reference/glossary#term-harness');await expect(term.locator('.result-meta')).toContainText('Профессиональное');
 await expect(page.locator('.search-count')).toHaveText(/^\d+ результат/);
 // Arrow down to the first term, Enter.
 const options=page.locator('#search-results [role=option]'),target=await term.getAttribute('id');
 const index=Number(target!.replace('search-result-',''));
 for(let i=0;i<index;i++)await page.keyboard.press('ArrowDown');
 await expect(input(page)).toHaveAttribute('aria-activedescendant',target!);await expect(options.nth(index)).toHaveAttribute('aria-selected','true');
 await page.keyboard.press('Enter');
 await expect(page).toHaveURL(/\/glossary#term-harness$/);await expect(page.locator('#term-harness')).toBeFocused();
});

test('an empty query suggests the glossary, the memo and pages opened recently',async({page})=>{
 await ready(page,'/chapters/03');await ready(page,'/chapters/05');
 await page.keyboard.press('Control+k');
 await expect(group(page,'Быстрый переход').getByRole('option')).toContainText(['Глоссарий','Операционная памятка']);
 const recent=group(page,'Недавние страницы').getByRole('option');
 await expect(recent).toHaveCount(1);await expect(recent).toHaveAttribute('href','/chapters/03');
 await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
 await expect(page).toHaveURL(/\/reference\/22-cheatsheet$/);await expect(page.locator('main#reader')).toBeFocused();
 // A chapter tab is remembered as its chapter.
 await ready(page,'/flow/08-preflight/check');await ready(page,'/chapters/05');await page.keyboard.press('Control+k');
 await expect(group(page,'Недавние страницы').getByRole('option').first()).toHaveAttribute('href','/flow/08-preflight');
});

test('the palette: one input field, filter chips, popular queries and the other keyboard layout',async({page})=>{
 await ready(page,'/flow/08-preflight');await page.keyboard.press('Control+k');
 // One field: the input draws no border or background of its own inside the row (the «input in an input» bug).
 const field=await input(page).evaluate(node=>{const s=getComputedStyle(node);return [s.borderTopWidth,s.backgroundColor];});
 expect(field).toEqual(['0px','rgba(0, 0, 0, 0)']);
 // A popular query fills the input.
 const popular=group(page,'Часто ищут').getByRole('option',{name:/worktree/});await popular.click();
 await expect(input(page)).toHaveValue('worktree');await expect(input(page)).toBeFocused();
 // A filter chip leaves one group and keeps the focus in the input.
 const scopes=page.getByRole('group',{name:'Показать в результатах'});
 await scopes.getByRole('button',{name:/^Термины/}).click();
 await expect(page.locator('#search-results [role=group]')).toHaveCount(1);await expect(group(page,'Термины глоссария')).toBeVisible();
 await expect(input(page)).toBeFocused();
 await scopes.getByRole('button',{name:/^Все/}).click();await expect(page.locator('#search-results [role=group]').nth(1)).toBeVisible();
 // A new query starts without a filter.
 await scopes.getByRole('button',{name:/^Термины/}).click();await input(page).fill('preflight');
 await expect(scopes.getByRole('button',{name:/^Все/})).toHaveAttribute('aria-pressed','true');
 // «кумшуц» is «review» typed in the Russian layout.
 await input(page).fill('кумшуц');
 await expect(page.locator('.cmdk-swapped')).toContainText('review');await expect(page.locator('#search-results [role=option]').first()).toBeVisible();
 // Nothing found: one message, no listbox.
 await input(page).fill('zzqqxx');await expect(page.locator('.cmdk-empty')).toContainText('Ничего не найдено');await expect(page.locator('#search-results')).toHaveCount(0);
 // Arrows wrap around.
 await input(page).fill('');await page.keyboard.press('ArrowUp');
 const last=await page.locator('#search-results [role=option]').count();
 await expect(input(page)).toHaveAttribute('aria-activedescendant',`search-result-${last-1}`);
});

test('when the index fails to load, suggestions stay and the error sits outside the listbox',async({page})=>{
 await page.route('**/data/search-*.json',route=>route.abort());
 await ready(page,'/flow/08-preflight');await page.keyboard.press('Control+k');
 await expect(page.locator('.search-dialog [role=status]',{hasText:'Поиск не загрузился.'})).toBeVisible();
 await expect(page.locator('#search-results [role=status]')).toHaveCount(0);
 await expect(group(page,'Быстрый переход').getByRole('option').first()).toHaveText(/Глоссарий/);
 // Every child of the listbox is a group of options.
 expect(await page.locator('#search-results').evaluate(box=>[...box.children].every(child=>child.getAttribute('role')==='group'&&[...child.querySelectorAll('[role=option]')].length>0))).toBe(true);
 // A second opening starts at the first suggestion.
 await page.keyboard.press('ArrowDown');await page.keyboard.press('Escape');await page.keyboard.press('Control+k');
 await expect(page.locator('#search-result-0')).toHaveAttribute('aria-selected','true');
});

test('on a phone the bottom bar opens search and a result navigates',async({page})=>{
 await ready(page,'/flow/08-preflight',360);
 await page.getByRole('navigation',{name:'Навигация'}).getByRole('button',{name:'Поиск'}).click();
 await expect(dialog(page)).toBeVisible();await input(page).fill('preflight');
 await expect(group(page,'Страницы и разделы').getByRole('option').first()).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.keyboard.press('Enter');await expect(dialog(page)).toBeHidden();await expect(page).toHaveURL(/#/);
});

test('breadcrumbs on every page lead to existing addresses; none on the home page',async({page,request})=>{
 await ready(page,'/');await expect(page.getByRole('navigation',{name:'Хлебные крошки'})).toHaveCount(0);
 const checked=new Set<string>();
 // A chapter that moved (P5) is opened at its new address.
 for(const chapter of data.chapters.map(c=>({...c,path:c.href??c.path}))){
  await ready(page,chapter.path);
  const crumbs=page.getByRole('navigation',{name:'Хлебные крошки'});
  await expect(crumbs,chapter.path).toBeVisible();
  await expect(crumbs.locator('li').first()).toHaveText('Главная');
  await expect(crumbs.locator('[aria-current=page]'),chapter.path).toHaveCount(1);
  for(const href of await crumbs.locator('a').evaluateAll(links=>links.map(a=>a.getAttribute('href')!))){
   expect(href).not.toBe(chapter.path);
   if(checked.has(href))continue;checked.add(href);
   expect((await request.get(href)).status(),href).toBe(200);
  }
 }
 // A chapter tab (P5-02b): the chapter is a link, the tab is the current crumb.
 await ready(page,'/flow/08-preflight/apply');
 const crumbs=page.getByRole('navigation',{name:'Хлебные крошки'});
 await expect(crumbs.locator('li')).toHaveCount(4);
 await expect(crumbs.locator('li').nth(2).locator('a')).toHaveAttribute('href','/flow/08-preflight');
 await expect(crumbs.locator('[aria-current=page]')).toHaveCount(1);await expect(crumbs.locator('li').last().locator('[aria-current=page]')).toHaveCount(1);
});

test('axe: no serious or critical violations with search open, in results and suggestions',async({page})=>{
 for(const scheme of ['light','dark'] as const){
  await page.emulateMedia({colorScheme:scheme});await ready(page,'/flow/08-preflight');
  await page.addScriptTag({path:'node_modules/axe-core/axe.min.js'});
  for(const query of ['','review']){
   await page.keyboard.press('Control+k');await input(page).fill(query);
   await expect(page.locator('#search-results [role=option]').first()).toBeVisible();
   // Contrast is measured once the dialog and result transitions have finished, not mid-fade.
   await page.waitForFunction(()=>document.getAnimations().every(a=>a.playState!=='running'||!Number.isFinite(Number(a.effect?.getComputedTiming().endTime))));
   const violations=await page.evaluate(async()=>{const result=await(window as unknown as {axe:{run:(context:unknown,options:object)=>Promise<{violations:{id:string;impact:string}[]}>}}).axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}});return result.violations.filter(v=>v.impact==='serious'||v.impact==='critical').map(v=>v.id);});
   expect(violations,`${scheme} «${query}»`).toEqual([]);
   await page.keyboard.press('Escape');
  }
  // Breadcrumbs too.
  const violations=await page.evaluate(async()=>{const result=await(window as unknown as {axe:{run:(context:unknown,options:object)=>Promise<{violations:{id:string;impact:string}[]}>}}).axe.run('.breadcrumbs',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}});return result.violations.filter(v=>v.impact==='serious'||v.impact==='critical').map(v=>v.id);});
  expect(violations,scheme).toEqual([]);
 }
});

// Polish of the test slice (P3-06).
test('on a chapter tab the chapter itself is not among recent pages',async({page})=>{
 await ready(page,'/flow/08-preflight');await ready(page,'/chapters/05');await ready(page,'/flow/08-preflight/check');
 await page.keyboard.press('Control+k');
 const recent=group(page,'Недавние страницы').getByRole('option');
 await expect(recent).toHaveCount(1);await expect(recent).toHaveAttribute('href','/chapters/05');
});

test('on a phone the breadcrumbs of a chapter tab stay on one line',async({page})=>{
 for(const width of [320,360]){
  await ready(page,'/flow/08-preflight/apply',width);
  const crumbs=page.getByRole('navigation',{name:'Хлебные крошки'});
  // One line: every shown crumb shares the vertical middle of the first.
  const middles=await crumbs.locator('li').evaluateAll(items=>items.filter(li=>li.getClientRects().length).map(li=>{const r=li.getBoundingClientRect();return (r.top+r.bottom)/2;}));
  for(const middle of middles)expect(Math.abs(middle-middles[0]),`${width}`).toBeLessThan(2);
  await expect(crumbs.locator('[aria-current=page]')).toBeInViewport();
  // The chapter crumb stays a usable link: wide enough to read and to tap (WCAG 2.5.8).
  const chapter=await crumbs.locator('.crumb-page a').boundingBox();
  expect(chapter!.width,`${width}`).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
});
