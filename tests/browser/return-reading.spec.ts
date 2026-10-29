import {test,expect} from '@playwright/test';

for(const width of [1440,360])test(`return from a long definition restores saved scroll and focus at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:1000});
 await page.addInitScript(()=>{const parse=JSON.parse;JSON.parse=function(...args:Parameters<typeof JSON.parse>){const result=parse.apply(JSON,args);const visit=(item:unknown)=>{if(!item||typeof item!=='object')return;const term=item as Record<string,unknown>;if(term.id==='term-harness'&&term.previewKind){term.previewKind='panel';term.definition='Развёрнутое учебное определение. '.repeat(8);term.definitionHtml='<p>'+term.definition+'</p>';}for(const value of Object.values(term))visit(value);};visit(result);return result;};});
 await page.goto('/chapters/01');await expect(page.locator('.rail-search')).toBeEnabled();
 const term=page.locator('main .term-link[href$="#term-harness"]').last();await term.scrollIntoViewIfNeeded();await term.click();
 await page.locator('.context-panel a[href$="#term-harness"]').click();await expect(page).toHaveURL(/glossary#term-harness$/);
 const saved=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('handbook-return')!) as {y:number;id:string});
 await page.locator('.return-reading').click();await expect(page).toHaveURL(/chapters\/01/);await expect(page.locator(`[id="${saved.id}"]`)).toBeFocused();
 await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
 await page.waitForTimeout(250);expect(await page.evaluate(()=>scrollY)).toBe(saved.y);
 expect(await page.evaluate(()=>sessionStorage.getItem('handbook-return'))).toBeNull();
});
