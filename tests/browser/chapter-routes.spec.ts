import {test,expect,type Page} from '@playwright/test';
// P5-02b: chapter 08 lives at /flow/08-preflight and its tabs; the old address and its anchors lead to the right tab.
async function ready(page:Page,path:string){await page.goto(path);await page.waitForSelector('html.js-enabled');await expect(page.locator('.search-trigger')).toBeEnabled();}
const tabs=(page:Page)=>page.getByRole('navigation',{name:'Разделы главы'});

test('the chapter opens on its overview tab and switches tabs by address',async({page})=>{
 await ready(page,'/flow/08-preflight');
 await expect(page.locator('main h1')).toContainText('Preflight: начать правильно');
 await expect(page.locator('main [data-chapter="ch-08"]')).toHaveAttribute('data-tab','overview');
 const bar=tabs(page);await expect(bar.getByRole('link')).toHaveText(['Обзор','Как устроено','Как применять','Проверь себя']);
 await expect(bar.getByRole('link',{name:'Обзор'})).toHaveAttribute('aria-current','page');
 await expect(page).toHaveTitle(/^08\. Preflight: начать правильно · /);
 await expect(page.locator('.sidebar a[href="/flow/08-preflight"]')).toHaveAttribute('aria-current','page');
 await bar.getByRole('link',{name:'Как применять'}).click();
 await expect(page).toHaveURL(/\/flow\/08-preflight\/apply$/);
 await expect(tabs(page).getByRole('link',{name:'Как применять'})).toHaveAttribute('aria-current','page');
 await expect(page.locator('#ch-08-8-1-последовательность')).toBeVisible();await expect(page.locator('#ch-08-8-3-fail-closed')).toHaveCount(0);
 await expect(page.locator('.sidebar a[href="/flow/08-preflight"]')).toHaveAttribute('aria-current','page');
 await expect(page).toHaveTitle(/^Как применять · 08\. Preflight/);
 // Keyboard: the tab bar is reachable and opens a tab.
 await tabs(page).getByRole('link',{name:'Как применять'}).focus();await page.keyboard.press('Tab');await expect(tabs(page).getByRole('link',{name:'Проверь себя'})).toBeFocused();await page.keyboard.press('Enter');
 await expect(page).toHaveURL(/\/flow\/08-preflight\/check$/);await expect(page.locator('section.drill')).toBeVisible();
 // The links between tabs go on to the next chapter at the last tab.
 await expect(page.locator('.pagination-previous')).toHaveAttribute('href','/flow/08-preflight/apply');
 await expect(page.locator('.pagination-next')).toHaveAttribute('href','/chapters/09');
});

test('the old address and its anchors land on the tab that holds them',async({page})=>{
 const response=await page.request.get('/chapters/08',{maxRedirects:0});
 expect(response.status()).toBe(308);expect(new URL(response.headers().location,'http://x').pathname).toBe('/flow/08-preflight');
 await ready(page,'/chapters/08#ch-08-8-2-отчет-preflight');
 await expect(page).toHaveURL(/\/flow\/08-preflight\/apply#ch-08-8-2-/);
 await expect(page.locator('#ch-08-8-2-отчет-preflight')).toBeFocused();
 await ready(page,'/chapters/08#ch-08-8-3-fail-closed');
 await expect(page).toHaveURL(/\/flow\/08-preflight\/how-it-works#ch-08-8-3-fail-closed$/);
 await expect(page.locator('#ch-08-8-3-fail-closed')).toBeFocused();
 // A link from another chapter goes straight to the tab.
 await ready(page,'/tools/codex');
 const link=page.locator('main a[href="/flow/08-preflight#ch-08"]').first();await link.scrollIntoViewIfNeeded();await link.click();
 await expect(page).toHaveURL(/\/flow\/08-preflight#ch-08$/);await expect(page.locator('#ch-08')).toBeFocused();
 await ready(page,'/chapters/07');await page.locator('.pagination-next').click();await expect(page).toHaveURL(/\/flow\/08-preflight$/);
});

test('search opens the tab of the result',async({page})=>{
 await ready(page,'/glossary');
 await page.keyboard.press('Control+k');await page.getByLabel('Термин, фраза или текст примера').fill('Fail closed');
 const result=page.locator('.search-results>a[href="/flow/08-preflight/how-it-works#ch-08-8-3-fail-closed"]');await expect(result).toBeVisible();await result.click();
 await expect(page).toHaveURL(/\/flow\/08-preflight\/how-it-works#ch-08-8-3-fail-closed$/);await expect(page.locator('#ch-08-8-3-fail-closed')).toBeFocused();
});

test('reading position is kept per tab',async({page})=>{
 await ready(page,'/flow/08-preflight/apply');
 await page.evaluate(()=>scrollTo(0,600));await page.waitForTimeout(900);await page.evaluate(()=>{scrollTo(0,640);});
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('mae-progress')??'null')?.reading)).toMatchObject({page:'ch-08',tab:'apply'});
 await ready(page,'/');await expect(page.locator('.resume-button')).toHaveAttribute('href','/flow/08-preflight/apply?resume=1');
});
