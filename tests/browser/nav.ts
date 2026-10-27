import type {Page} from '@playwright/test';
// Desktop navigation (P3-01): open the rail section that lists the page, then follow its mega-menu link.
export async function railNavigate(page:Page,path:string){
 if(path==='/'){await page.locator('.rail-entry[data-section=home] .rail-item').click();return;}
 const link=page.locator(`.mega-menu .mega-item[href="${path}"]`);
 await page.locator('.rail-entry').filter({has:link}).locator('.rail-item').hover();
 await link.click();
}
