import {test,expect,type Page} from '@playwright/test';
// Rail controls (P3-04): theme in three states and the animation switch, stored and applied before paint.
async function ready(page:Page,path:string){await page.goto(path);await page.waitForSelector('html.js-enabled');await expect(page.locator('.search-trigger')).toBeEnabled();}
const controls=(page:Page)=>page.locator('.rail-controls');
const theme=(page:Page)=>controls(page).getByRole('button',{name:/^Тема:/});
const motion=(page:Page)=>controls(page).getByRole('button',{name:'Анимации'});
const html=(page:Page,name:string)=>page.evaluate(attr=>document.documentElement.getAttribute(attr),name);
const canvas=(page:Page)=>page.evaluate(()=>getComputedStyle(document.body).backgroundColor);

test('theme cycles system → light → dark → system and survives a reload without a flash',async({page})=>{
 await page.setViewportSize({width:1440,height:900});await page.emulateMedia({colorScheme:'light'});
 await ready(page,'/chapters/08');
 const light=await canvas(page);
 await expect(theme(page)).toHaveAccessibleName('Тема: Как в системе. Переключить на «Светлая»');expect(await html(page,'data-theme')).toBeNull();
 await theme(page).click();await expect(theme(page)).toHaveAccessibleName(/^Тема: Светлая/);expect(await html(page,'data-theme')).toBe('light');
 await theme(page).click();await expect(theme(page)).toHaveAccessibleName(/^Тема: Тёмная/);expect(await html(page,'data-theme')).toBe('dark');
 const dark=await canvas(page);expect(dark).not.toBe(light);
 // The stored theme is on <html> before any script of the app runs: the server HTML has no data-theme.
 await page.goto('/chapters/08',{waitUntil:'commit'});await page.waitForSelector('body',{state:'attached'});
 expect(await html(page,'data-theme')).toBe('dark');
 await page.waitForSelector('html.js-enabled');await expect(theme(page)).toHaveAccessibleName(/^Тема: Тёмная/);
 await theme(page).click();expect(await html(page,'data-theme')).toBeNull();
 // «Как в системе» follows the system setting.
 await page.emulateMedia({colorScheme:'dark'});expect(await canvas(page)).toBe(dark);
});

test('the animation switch sets data-motion, is shared with the mobile menu and respects reduced motion',async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await ready(page,'/chapters/08');
 await expect(motion(page)).toHaveAttribute('aria-pressed','true');
 await motion(page).click();await expect(motion(page)).toHaveAttribute('aria-pressed','false');expect(await html(page,'data-motion')).toBe('off');
 await ready(page,'/chapters/02');expect(await html(page,'data-motion')).toBe('off');await expect(motion(page)).toHaveAttribute('aria-pressed','false');
 // The mobile «Разделы» menu shows the same choice.
 await page.setViewportSize({width:360,height:800});
 await page.getByRole('button',{name:'Разделы',exact:true}).click();
 const menuMotion=page.locator('.menu-controls').getByRole('button',{name:'Анимации'});
 await expect(menuMotion).toHaveAttribute('aria-pressed','false');
 await menuMotion.click();await expect(menuMotion).toHaveAttribute('aria-pressed','true');expect(await html(page,'data-motion')).toBeNull();
 await page.keyboard.press('Escape');
 // With the system's reduced motion, animations stay off and the switch says so.
 await page.setViewportSize({width:1440,height:900});await page.emulateMedia({reducedMotion:'reduce'});
 await expect(motion(page)).toBeDisabled();await expect(motion(page)).toHaveAttribute('aria-pressed','false');
});

test('without storage the choice still applies for the page',async({page})=>{
 await page.addInitScript(()=>{Object.defineProperty(window,'localStorage',{configurable:true,get(){throw new DOMException('denied','SecurityError');}});});
 await page.setViewportSize({width:1440,height:900});await ready(page,'/');
 await theme(page).click();expect(await html(page,'data-theme')).toBe('light');
});

test('axe: no serious or critical violations in both themes',async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 for(const scheme of ['light','dark'] as const){
  await page.emulateMedia({colorScheme:scheme});await ready(page,'/chapters/08');
  await page.addScriptTag({path:'node_modules/axe-core/axe.min.js'});
  const violations=await page.evaluate(async()=>{const result=await(window as unknown as {axe:{run:(context:unknown,options:object)=>Promise<{violations:{id:string;impact:string}[]}>}}).axe.run('.nav-rail',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}});return result.violations.filter(v=>v.impact==='serious'||v.impact==='critical').map(v=>v.id);});
  expect(violations,scheme).toEqual([]);
 }
});
