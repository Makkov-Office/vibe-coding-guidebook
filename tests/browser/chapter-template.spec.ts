import {test,expect,type Page} from '@playwright/test';
// P5-02: шаблон страницы главы на служебных образцах /design/chapters/07 и /08.
async function open(page:Page,path:string){await page.goto(path);await page.waitForSelector('html.js-enabled');await expect(page.locator('main.ct')).toBeVisible();await page.locator('.ct-live').waitFor({state:'attached'});}
// axe проверяет устоявшийся вид: конечные анимации (переход страницы P3-05) должны закончиться.
async function settled(page:Page){await page.evaluate(()=>Promise.all(document.getAnimations().filter(a=>Number.isFinite(Number(a.effect?.getComputedTiming().endTime))).map(a=>a.finished.catch(()=>undefined))));}
const errorsOf=(page:Page)=>{const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});return errors;};

test('chapter template: hero, tabs, on this page, neighbours and empty tab',async({page})=>{
 const errors=errorsOf(page);
 // ≥ 1360 px оглавление таба показывает правая колонка Reader, блок в тексте скрыт.
 await open(page,'/design/chapters/08/apply');
 await expect(page.locator('.ct-toc')).toBeHidden();await expect(page.locator('.local-outline a')).toHaveText(['8.1. Последовательность','8.2. Отчёт preflight']);
 await page.setViewportSize({width:1024,height:900});
 await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content',/noindex/);
 await expect(page.getByRole('heading',{level:1})).toHaveText('08. Preflight: начать правильно');
 await expect(page.locator('.ct-chips li')).toHaveText([/\d+ мин/,'2 · Инженер','Отчёт preflight']);
 const tabs=page.getByRole('navigation',{name:'Табы главы'}).getByRole('link');
 await expect(tabs).toHaveCount(4);
 await expect(page.locator('.ct-tabs a[aria-current="page"]')).toHaveAttribute('href','/design/chapters/08/apply');
 // «На этой странице»: два пункта таба, переход по якорю, текущий пункт отмечается.
 const toc=page.locator('.ct-toc');await toc.locator('summary').click();
 await expect(toc.getByRole('link')).toHaveText(['8.1. Последовательность','8.2. Отчёт preflight']);
 await toc.getByRole('link',{name:'8.2. Отчёт preflight'}).click();
 await expect(page).toHaveURL(/#ch-08-8-2-/);await expect(toc.locator('a[aria-current="location"]')).toHaveText('8.2. Отчёт preflight');
 // Заголовок не прячется под шапкой и прилипшей полосой.
 const heading=await page.locator('.ct-prose h2[id^="ch-08-8-2-"]').boundingBox();const bar=await page.locator('.ct-tabs').boundingBox();expect(heading!.y).toBeGreaterThanOrEqual(bar!.y+bar!.height);
 const pager=page.getByRole('navigation',{name:'Соседние страницы'});
 await expect(pager.getByRole('link')).toHaveText([/Предыдущий таб\s*Как устроено/,/Дальше\s*Проверь себя/]);
 await pager.getByRole('link',{name:/Проверь себя/}).click();await expect(page).toHaveURL(/\/design\/chapters\/08\/check$/);
 // Пустой таб: понятное состояние и путь к заполненному табу, на краю — соседняя глава.
 await expect(page.locator('.ct-empty')).toContainText('Таб «Проверь себя» готовится');
 await expect(pager.getByRole('link')).toHaveText([/Предыдущий таб\s*Как применять/,/Следующая глава\s*09\./]);
 await open(page,'/design/chapters/08');await expect(page.locator('.ct-empty').getByRole('link')).toHaveAttribute('href','/design/chapters/08/how-it-works');
 await expect(pager.getByRole('link').first()).toHaveText(/Предыдущая глава\s*07\./);
 // Таб без текста, но с интерактивной панелью — без «готовится».
 await open(page,'/design/chapters/07/check');await expect(page.locator('.ct-empty')).toHaveCount(0);await expect(page.locator('#lifecycle-panel')).toBeVisible();
 expect(errors).toEqual([]);
});

test('chapter template: sticky tab bar condenses into a pill right under the header',async({page})=>{
 for(const width of [1440,360]){
  await page.setViewportSize({width,height:900});await open(page,'/design/chapters/08/apply');
  const bar=page.locator('.ct-tabs');await expect(bar).not.toHaveAttribute('data-stuck');await expect(page.locator('.ct-tabs-pill')).toBeHidden();
  await page.mouse.wheel(0,1200);
  await expect(bar).toHaveAttribute('data-stuck','true');await expect(page.locator('.ct-tabs-pill')).toHaveText('Preflight');
  // Между шапкой и полосой нет щели, через которую виден текст.
  const header=(await page.locator('.topbar').boundingBox())!;expect(Math.abs((await bar.boundingBox())!.y-(header.y+header.height)),`${width}`).toBeLessThanOrEqual(1);
  await page.mouse.wheel(0,-5000);await expect(bar).not.toHaveAttribute('data-stuck');
 }
});

test('chapter template: copy link, keyboard and clipboard refusal',async({page})=>{
 await page.addInitScript(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async(text:string)=>{if((window as unknown as {deny?:boolean}).deny)throw Error('denied');(window as unknown as {copied:string}).copied=text;}}});});
 await open(page,'/design/chapters/08/apply');
 const copy=page.getByRole('button',{name:'Скопировать ссылку на раздел «8.1. Последовательность»'});
 await expect(page.locator('.ct-prose .permalink')).toHaveCount(0);
 await copy.focus();await expect(copy).toHaveCSS('outline-style','solid');await page.keyboard.press('Enter');
 await expect(page.locator('.ct-live')).toHaveText('Ссылка на раздел «8.1. Последовательность» скопирована.');
 const id=await page.locator('.ct-prose h2').first().getAttribute('id');
 expect(await page.evaluate(()=>(window as unknown as {copied:string}).copied)).toBe(`${new URL(page.url()).origin}/design/chapters/08/apply#${encodeURIComponent(id!)}`);
 // Второе копирование того же раздела снова объявляется.
 await page.evaluate(()=>{(window as unknown as {seen:string[]}).seen=[];new MutationObserver(()=>(window as unknown as {seen:string[]}).seen.push(document.querySelector('.ct-live')!.textContent!)).observe(document.querySelector('.ct-live')!,{childList:true,characterData:true,subtree:true});});
 await copy.click();await expect.poll(()=>page.evaluate(()=>(window as unknown as {seen:string[]}).seen.filter(Boolean).length)).toBeGreaterThan(0);
 await page.evaluate(()=>{(window as unknown as {deny:boolean}).deny=true;});await copy.click();
 await expect(page.locator('.ct-live')).toContainText('Не удалось скопировать. Адрес раздела:');
 // С клавиатуры по табам: фокус видим, переход меняет текущий таб.
 const tab=page.locator('.ct-tabs a[href="/design/chapters/08/how-it-works"]');await tab.focus();await expect(tab).toHaveCSS('outline-style','solid');await page.keyboard.press('Enter');
 await expect(page).toHaveURL(/\/how-it-works$/);await expect(page.locator('.ct-tabs a[aria-current="page"]')).toHaveAttribute('href','/design/chapters/08/how-it-works');
});

test('chapter template: widths, table cards, reduced motion and axe',async({page})=>{
 for(const width of [320,360,768,1024,1440]){
  await page.setViewportSize({width,height:900});await open(page,'/design/chapters/07/how-it-works');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),`${width}: no page scroll`).toBe(true);
  const small=await page.evaluate(()=>[...document.querySelectorAll('.ct-tabs a, .ct-copy, .ct-pager-link, .ct-toc summary, .ct-empty a')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&(r.height<44||r.width<44);}).map(e=>e.className));expect(small,`${width}: 44 px`).toEqual([]);
  // Ниже 600 px строка таблицы — карточка с подписью столбца.
  const cell=page.locator('.ct-prose table.ct-cards tbody td').first();await expect(cell).toHaveAttribute('data-label',/.+/);
  expect(await cell.evaluate(td=>getComputedStyle(td).display)).toBe(width<=600?'block':'table-cell');
  // На узком экране текущий таб виден в прокручиваемой полосе.
  const current=await page.locator('.ct-tabs a[aria-current="page"]').boundingBox();expect(current!.x).toBeGreaterThanOrEqual(0);expect(current!.x+current!.width).toBeLessThanOrEqual(width);
 }
 // Переход по табу без перезагрузки: новый текущий таб тоже в зоне видимости.
 await page.setViewportSize({width:320,height:900});await open(page,'/design/chapters/07');
 await page.getByRole('navigation',{name:'Соседние страницы'}).getByRole('link',{name:/Как устроено/}).click();await page.getByRole('navigation',{name:'Соседние страницы'}).getByRole('link',{name:/Как применять/}).click();
 await expect(page).toHaveURL(/\/07\/apply$/);
 await expect.poll(async()=>{const b=(await page.locator('.ct-tabs a[aria-current="page"]').boundingBox())!;return b.x>=0&&b.x+b.width<=320;}).toBe(true);
 // data-motion="off" (P3-05) выключает переход так же, как reduced motion.
 await page.evaluate(()=>document.documentElement.setAttribute('data-motion','off'));await expect(page.locator('.ct-tabs')).toHaveCSS('transition-duration','0s');await page.evaluate(()=>document.documentElement.removeAttribute('data-motion'));
 await page.emulateMedia({reducedMotion:'reduce'});await expect(page.locator('.ct-tabs')).toHaveCSS('transition-duration','0s');
 for(const [width,theme] of [[320,'light'],[320,'dark'],[1440,'light'],[1440,'dark']] as const){
  await page.setViewportSize({width,height:900});
  await page.evaluate(t=>document.documentElement.setAttribute('data-theme',t),theme);
  await settled(page);await page.addScriptTag({path:'node_modules/axe-core/axe.min.js'});
  const violations=await page.evaluate(async()=>{const result=await(window as unknown as {axe:{run:(context:string,options:object)=>Promise<{violations:{id:string}[]}>}}).axe.run('main.ct',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});return result.violations.map(v=>v.id);});
  expect(violations,`${width} ${theme}`).toEqual([]);
 }
});
