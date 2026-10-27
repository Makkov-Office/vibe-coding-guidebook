import {test,expect,type Page} from '@playwright/test';
// Rail controls (P3-04): theme in three states and the animation switch, stored and applied before paint.
async function ready(page:Page,path:string){await page.goto(path);await page.waitForSelector('html.js-enabled');await expect(page.locator('.search-trigger')).toBeEnabled();}
const controls=(page:Page)=>page.locator('.rail-controls');
const theme=(page:Page)=>controls(page).getByRole('button',{name:/^Тема:/});
const motion=(page:Page)=>controls(page).getByRole('button',{name:'Анимации'});
const html=(page:Page,name:string)=>page.evaluate(attr=>document.documentElement.getAttribute(attr),name);
const canvas=(page:Page)=>page.evaluate(()=>getComputedStyle(document.body).backgroundColor);

test('theme cycles system → opposite → same as system → system and survives a reload without a flash',async({page})=>{
 await page.setViewportSize({width:1440,height:900});await page.emulateMedia({colorScheme:'light'});
 await ready(page,'/flow/08-preflight');
 const light=await canvas(page);
 // The visible label is in the name; the first click always changes the page.
 await expect(theme(page)).toHaveAccessibleName('Тема: Авто (как в системе). Переключить на «Тёмная»');await expect(theme(page)).toContainText('Авто');expect(await html(page,'data-theme')).toBeNull();
 await theme(page).click();await expect(theme(page)).toHaveAccessibleName(/^Тема: Тёмная/);expect(await html(page,'data-theme')).toBe('dark');
 await expect(controls(page).getByRole('status')).toHaveText('Тема: Тёмная');
 const dark=await canvas(page);expect(dark).not.toBe(light);
 // Client navigation keeps the choice.
 await page.locator('.nav-rail .rail-item[href="/"]').first().click();await expect(page).toHaveURL(/\/$/);expect(await html(page,'data-theme')).toBe('dark');
 // The stored theme is painted before any script of the app runs: the server HTML has no data-theme.
 await page.goto('/flow/08-preflight',{waitUntil:'commit'});await page.waitForSelector('body',{state:'attached'});
 expect(await html(page,'data-theme')).toBe('dark');expect(await canvas(page)).toBe(dark);
 await page.waitForSelector('html.js-enabled');await expect(theme(page)).toHaveAccessibleName(/^Тема: Тёмная/);
 await theme(page).click();await expect(theme(page)).toHaveAccessibleName(/^Тема: Светлая/);expect(await html(page,'data-theme')).toBe('light');
 await theme(page).click();expect(await html(page,'data-theme')).toBeNull();
 // «Как в системе» follows the system setting.
 await page.emulateMedia({colorScheme:'dark'});expect(await canvas(page)).toBe(dark);
});

test('the animation switch sets data-motion, is shared with the mobile menu and respects reduced motion',async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await ready(page,'/flow/08-preflight');
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
 await expect(motion(page)).toHaveAttribute('aria-disabled','true');await expect(motion(page)).toHaveAttribute('aria-pressed','false');
 await expect(motion(page)).toHaveAccessibleDescription(/уменьшение движения/);
 await motion(page).focus();await page.keyboard.press('Enter');await expect(motion(page)).toHaveAttribute('aria-pressed','false');expect(await html(page,'data-motion')).toBeNull();
 // No animation runs: the switch only reports what the system decided.
 await page.locator('.nav-rail .rail-item').nth(2).hover();
 expect(await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length)).toBe(0);
});

test('on a 1366×768 and a 1024×600 screen both controls stay in view',async({page})=>{
 for(const [width,height] of [[1366,768],[1024,600]]){
  await page.setViewportSize({width,height});await ready(page,'/flow/08-preflight');
  for(const button of [theme(page),motion(page)]){const box=(await button.boundingBox())!;expect(box.y+box.height,`${width}×${height}`).toBeLessThanOrEqual(height);}
 }
});

test('keyboard focus in the rail is never hidden under the pinned controls',async({page})=>{
 await page.setViewportSize({width:1024,height:600});await ready(page,'/');
 const panel=(await page.locator('.rail-controls').boundingBox())!;
 await page.locator('.nav-rail .rail-item').first().focus();
 const count=await page.locator('.nav-rail .rail-item').count();
 for(let i=1;i<count;i++){
  await page.keyboard.press('ArrowDown');
  const box=(await page.locator('.nav-rail .rail-item:focus').boundingBox())!;
  expect(box.y+box.height,`item ${i}`).toBeLessThanOrEqual(panel.y+1);
 }
});

test('another tab changing the choice updates this one',async({page,context})=>{
 await page.setViewportSize({width:1440,height:900});await ready(page,'/flow/08-preflight');
 const other=await context.newPage();await other.setViewportSize({width:1440,height:900});await ready(other,'/chapters/02');
 await motion(other).click();expect(await html(other,'data-motion')).toBe('off');
 await expect(motion(page)).toHaveAttribute('aria-pressed','false');expect(await html(page,'data-motion')).toBe('off');
 // A stale copy would write motion back on.
 await theme(page).click();await other.reload();await other.waitForSelector('html.js-enabled');expect(await html(other,'data-motion')).toBe('off');
});

test('without storage the choice still applies for the page',async({page})=>{
 await page.addInitScript(()=>{Object.defineProperty(window,'localStorage',{configurable:true,get(){throw new DOMException('denied','SecurityError');}});});
 await page.setViewportSize({width:1440,height:900});await page.emulateMedia({colorScheme:'light'});await ready(page,'/');
 await theme(page).click();expect(await html(page,'data-theme')).toBe('dark');
});

test('axe: no serious or critical violations in both themes, rail and mobile menu, label in name',async({page})=>{
 const check=async(context:string,label:string)=>{
  // Contrast is measured on the final frame: the menu opens with a fade (motion.css).
  await page.waitForFunction(()=>document.getAnimations().every(a=>a.playState!=='running'||!Number.isFinite(Number(a.effect?.getComputedTiming().endTime))));
  await page.addScriptTag({path:'node_modules/axe-core/axe.min.js'});
  const violations=await page.evaluate(async selector=>{const result=await(window as unknown as {axe:{run:(context:unknown,options:object)=>Promise<{violations:{id:string;impact:string}[]}>}}).axe.run(selector,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']},rules:{'label-content-name-mismatch':{enabled:true}}});return result.violations.filter(v=>v.impact==='serious'||v.impact==='critical').map(v=>v.id);},context);
  expect(violations,label).toEqual([]);
 };
 for(const scheme of ['light','dark'] as const){
  await page.emulateMedia({colorScheme:scheme});await page.setViewportSize({width:1440,height:900});await ready(page,'/flow/08-preflight');
  await check('.nav-rail',`rail ${scheme}`);
  // An explicit theme against the opposite system theme.
  await theme(page).click();await check('.nav-rail',`rail ${scheme} → ${await html(page,'data-theme')}`);await theme(page).click();await theme(page).click();
  await page.setViewportSize({width:360,height:800});await page.getByRole('button',{name:'Разделы',exact:true}).click();
  await check('#section-menu',`menu ${scheme}`);await page.keyboard.press('Escape');
 }
});
