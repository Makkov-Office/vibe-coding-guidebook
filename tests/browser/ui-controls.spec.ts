import {test,expect,type Page} from '@playwright/test';
// Rail controls (P3-04): theme in three states, stored and applied before paint (the animation switch was removed in P3-09).
async function ready(page:Page,path:string){await page.goto(path);await page.waitForSelector('html.js-enabled');await expect(page.locator('.rail-search')).toBeEnabled();}
const controls=(page:Page)=>page.locator('.rail-controls');
const theme=(page:Page)=>controls(page).getByRole('button',{name:/^Тема:/});
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

// The animation switch was removed (founder 29.10.2026, P3-09): nothing in the rail or the mobile menu,
// an old stored «off» neither turns animation off nor stays in the record, reduced motion still holds.
test('no animation switch: an old stored «off» is ignored and cleared, reduced motion still holds',async({page})=>{
 await page.addInitScript(key=>{if(!sessionStorage.getItem('seeded')){sessionStorage.setItem('seeded','1');localStorage.setItem(key,JSON.stringify({theme:'dark',motion:'off'}));}},'mae-ui');
 await page.setViewportSize({width:1440,height:900});
 await ready(page,'/flow/08-preflight');
 await expect(page.getByRole('button',{name:/Анимаци/})).toHaveCount(0);
 await expect(controls(page).getByRole('button')).toHaveCount(1);
 // The theme from the same record survives; the motion key does not.
 expect(await html(page,'data-theme')).toBe('dark');expect(await html(page,'data-motion')).toBeNull();
 await expect.poll(()=>page.evaluate(()=>localStorage.getItem('mae-ui'))).toBe('{"theme":"dark"}');
 // Hovering a rail item runs its transition: animation is on.
 await page.locator('.nav-rail .rail-item').nth(2).hover();
 await expect(page.locator('.nav-rail .rail-item').nth(2).locator('.rail-trace path').first()).toHaveCSS('transition-duration',/^0\.24s/);
 await page.setViewportSize({width:360,height:800});
 await page.getByRole('button',{name:'Разделы',exact:true}).click();
 await expect(page.locator('.menu-controls').getByRole('button')).toHaveCount(1);
 await page.keyboard.press('Escape');
 // The system's reduced motion still turns every transition off.
 await page.setViewportSize({width:1440,height:900});await page.emulateMedia({reducedMotion:'reduce'});
 await expect(page.locator('.nav-rail .rail-item').nth(2).locator('.rail-trace path').first()).toHaveCSS('transition-duration','0s');
});

test('on a 1366×768 and a 1024×600 screen the theme control stays in view',async({page})=>{
 for(const [width,height] of [[1366,768],[1024,600]]){
  await page.setViewportSize({width,height});await ready(page,'/flow/08-preflight');
  for(const button of [theme(page)]){const box=(await button.boundingBox())!;expect(box.y+box.height,`${width}×${height}`).toBeLessThanOrEqual(height);}
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
 await page.setViewportSize({width:1440,height:900});await page.emulateMedia({colorScheme:'light'});await ready(page,'/flow/08-preflight');
 const other=await context.newPage();await other.setViewportSize({width:1440,height:900});await other.emulateMedia({colorScheme:'light'});await ready(other,'/chapters/02');
 await theme(other).click();expect(await html(other,'data-theme')).toBe('dark');
 await expect(theme(page)).toHaveAccessibleName(/^Тема: Тёмная/);expect(await html(page,'data-theme')).toBe('dark');
 // A stale copy would write the old theme back.
 await theme(page).click();expect(await html(page,'data-theme')).toBe('light');await other.reload();await other.waitForSelector('html.js-enabled');expect(await html(other,'data-theme')).toBe('light');
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
