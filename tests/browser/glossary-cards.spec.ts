import {test,expect} from '@playwright/test';
// P6-07b: a glossary card shows its level and copies a link to the term; the note on the source format is not shown.
async function ready(page:import('@playwright/test').Page,path:string){await page.goto(path);await page.waitForSelector('html.js-enabled');await expect(page.locator('.search-trigger')).toBeEnabled();}

test('a term card shows its level and copies a link to the term',async({page,context,browserName})=>{
 test.skip(browserName!=='chromium','clipboard permissions are Chromium-only');
 await context.grantPermissions(['clipboard-read','clipboard-write']);
 await ready(page,'/reference/glossary');
 const card=page.locator('#term-agent');
 await expect(card.locator('.term-level')).toHaveText('Уровень: Базовое');
 await expect(page.locator('#term-preflight .term-level')).toHaveText('Уровень: Профессиональное');
 const copy=card.getByRole('button',{name:'Скопировать ссылку на термин «Agent»'});
 await copy.focus();await expect(copy).toBeFocused();await page.keyboard.press('Enter');
 await expect(page.locator('.term-copy-status')).toHaveText('Ссылка на термин «Agent» скопирована.');
 expect(await page.evaluate(()=>navigator.clipboard.readText())).toMatch(/\/glossary#term-agent$/);
 // Every term has one button, also the ones in the collapsed Git group.
 await expect(page.locator('.term-copy')).toHaveCount(await page.locator('.term-definition').count());
});

test('the note on the source format is not shown and the cards fit narrow screens',async({page})=>{
 await page.setViewportSize({width:320,height:800});
 await ready(page,'/reference/glossary');
 await expect(page.locator('.glossary-service-note')).toBeHidden();
 await expect(page.locator('main')).not.toContainText('Служебный формат',{useInnerText:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
 const box=await page.locator('#term-agent .term-copy').boundingBox();
 expect(box!.width).toBeGreaterThanOrEqual(44);expect(box!.height).toBeGreaterThanOrEqual(44);
});

test('without clipboard access the address is shown under the card',async({page})=>{
 await page.addInitScript(()=>{Object.defineProperty(navigator,'clipboard',{value:{writeText:()=>Promise.reject(new Error('denied'))}});});
 await ready(page,'/reference/glossary');
 const card=page.locator('#term-agent');
 await expect(card.locator('.term-copy-fallback')).toBeHidden();
 await card.getByRole('button',{name:'Скопировать ссылку на термин «Agent»'}).click();
 const fallback=card.locator('.term-copy-fallback');
 await expect(fallback).toBeVisible();await expect(fallback).toContainText('Не удалось скопировать ссылку. Адрес термина:');
 await expect(fallback.locator('code')).toHaveText(/\/glossary#term-agent$/);
 await expect(page.locator('.term-copy-status')).toContainText('Не удалось скопировать ссылку.');
});
