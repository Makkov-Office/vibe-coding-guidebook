import {test,expect} from '@playwright/test';
// B1 (P1-15): the 404 page has no #reader; the reader shell must still hydrate without a client error screen.
test('unknown route keeps the rail and 404 text after hydration without page errors',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 const response=await page.goto('/nope');expect(response!.status()).toBe(404);
 await page.waitForSelector('html.js-enabled');await expect(page.locator('.rail-search')).toBeEnabled();
 await expect(page.locator('.nav-rail')).toBeVisible();await expect(page.getByRole('heading',{name:'404'})).toBeVisible();await expect(page.getByText('This page could not be found.')).toBeVisible();
 await expect(page.getByText(/This page couldn.t load/)).toHaveCount(0);expect(errors).toEqual([]);
});
