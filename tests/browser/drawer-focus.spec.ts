import {test,expect} from '@playwright/test';

// Choosing a chapter in the mobile drawer moves focus to the new page, not back to the menu button (P1-12, review of PR #28).
for(const via of ['click','Enter'] as const)test(`mobile drawer chapter choice by ${via} focuses the new page`,async({page})=>{
 await page.setViewportSize({width:360,height:800});
 await page.goto('/chapters/01');await page.waitForSelector('html.js-enabled');await expect(page.locator('.menu-trigger')).toBeEnabled();
 await page.locator('.menu-trigger').click();await expect(page.locator('.drawer')).toBeVisible();
 const link=page.locator('.drawer a[href="/chapters/05"]');
 if(via==='click')await link.click();else{await link.focus();await page.keyboard.press('Enter');}
 await expect(page).toHaveURL(/\/chapters\/05$/);await expect(page.locator('main [data-chapter="ch-05"]')).toBeVisible();await expect(page.locator('.drawer')).not.toBeVisible();
 // The drawer close event and the route commit may land in either order; give both time to settle.
 await page.waitForTimeout(800);
 await expect(page.locator('main#reader')).toBeFocused();
});
