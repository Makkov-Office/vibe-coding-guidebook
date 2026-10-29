import {test,expect,type Page} from '@playwright/test';
import fs from 'node:fs';
// P4-01: Главная на «/», вводная глава 00 на /start/00-how-to-read. Вид P4-06 (RD-01): hero из двух карточек, карточки с иллюстрацией.
const home=JSON.parse(fs.readFileSync('src/content/generated.json','utf8')).home;
async function ready(page:Page,path:string){await page.goto(path);await page.waitForSelector('html.js-enabled');await expect(page.locator('.search-trigger')).toBeEnabled();}
async function settled(page:Page){await page.evaluate(()=>Promise.all(document.getAnimations().filter(a=>Number.isFinite(Number(a.effect?.getComputedTiming().endTime))).map(a=>a.finished.catch(()=>undefined))));}
const errorsOf=(page:Page)=>{const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});return errors;};

test('home: hero, task path, 8 sections, next steps and footer; every link answers 200',async({page,request})=>{
 const errors=errorsOf(page);
 await ready(page,'/');
 await expect(page.getByRole('heading',{level:1})).toHaveText('Mastering Agentic Engineering');
 await expect(page.locator('.home-subtitle')).toHaveText('Полный цикл разработки с AI-агентами — от вайбкодинга до top-tier SDLC');
 const actions=page.locator('.home-actions a');
 await expect(actions).toHaveText(['Начать изучение','Определить уровень']);
 await expect(actions.first()).toHaveAttribute('href','/start/00-how-to-read');
 await expect(page.locator('.home-eyebrow')).toHaveText(home.eyebrow);
 // Справа одна спокойная схема: 8 шагов пути, один акцент, без бегущей точки и цветных блоков.
 await expect(page.getByRole('img',{name:home.path.title})).toBeVisible();
 await expect(page.locator('.home-path .hi-o')).toHaveCount(7);
 await expect(page.locator('.home-path .hi-accent')).toHaveText(home.path.steps.at(-1).label);
 await expect(page.locator('.home-path :is(.bp-run,.bp-node,.motion-dot)')).toHaveCount(0);
 await expect(page.locator('#home-path-steps')).toContainText(home.path.steps.map((step:{label:string;sub:string})=>`${step.label}: ${step.sub}`).join(' → '));
 await expect(page.locator('.home-cards h3')).toHaveText(['Начать','Основы','Процесс','Контроль','Надёжность','Практика','Инструменты','Agent Pack']);
 await expect(page.locator('.home-cards a.home-card')).toHaveCount(8);
 await expect(page.locator('.home-cards a.home-card').last()).toHaveAttribute('href','/agents');
 // У каждой карточки иллюстрация сверху; мета-строка — из данных сборки.
 await expect(page.locator('.home-cards .home-card-vis svg')).toHaveCount(8);
 await expect(page.locator('.home-card[data-section=flow] .home-card-meta')).toHaveText('главы 06–11');
 await expect(page.locator('.home-card[data-section=control] .home-card-vis')).toHaveClass(/home-card-vis--human/);
 await expect(page.locator('.home-next h3')).toHaveText(home.next.items.map((item:{label:string})=>item.label));
 await expect(page.getByRole('navigation',{name:home.footer.heading}).getByRole('heading')).toHaveText(['Учиться','Справочник','Для агентов']);
 // Новичок не видит «Продолжить».
 await expect(page.locator('.home-resume')).toHaveCount(0);
 const hrefs=[...new Set(await page.locator('main a[href^="/"]').evaluateAll(links=>links.map(link=>link.getAttribute('href')!)))];
 expect(hrefs.length).toBeGreaterThanOrEqual(13);
 for(const href of hrefs)expect((await request.get(href)).status(),href).toBe(200);
 // Карточка раздела ведёт на его первую страницу без перезагрузки.
 await page.locator('.home-cards a.home-card').first().click();await expect(page).toHaveURL(/\/start\/00-how-to-read$/);await expect(page.locator('main .intro')).toBeVisible();
 expect(errors).toEqual([]);
});

test('home: «Продолжить» for a returning reader, introduction at its new address and old /#ch-00 links',async({page})=>{
 await ready(page,'/flow/08-preflight/apply');
 await page.evaluate(()=>scrollTo(0,600));await page.waitForTimeout(900);await page.evaluate(()=>scrollTo(0,640));
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('mae-progress')??'null')?.reading?.tab)).toBe('apply');
 await ready(page,'/');
 const resume=page.locator('.home-resume');
 await expect(resume.getByRole('heading',{level:2})).toHaveText('Продолжить');
 await expect(resume.locator('.home-resume-eyebrow').first()).toHaveText('Процесс · глава 08');
 await expect(resume.locator('.home-resume-place')).toHaveText('Preflight: начать правильно');
 await expect(resume.locator('.home-resume-tab')).toHaveText('Как применять · таб 3 из 4');
 await expect(resume.locator('.resume-button')).toHaveAttribute('href','/flow/08-preflight/apply?resume=1');
 // Рядом тренажёр этой же главы 08 (P7-03).
 await expect(resume.locator('.home-drill')).toHaveAttribute('href','/flow/08-preflight/check');
 // axe для вернувшегося читателя: «Продолжить» и карточка тренажёра в обеих темах.
 for(const theme of ['light','dark']){
  await page.evaluate(t=>document.documentElement.setAttribute('data-theme',t),theme);
  await settled(page);await page.addScriptTag({path:'node_modules/axe-core/axe.min.js'});
  const violations=await page.evaluate(async()=>{const result=await(window as unknown as {axe:{run:(context:string,options:object)=>Promise<{violations:{id:string}[]}>}}).axe.run('.home-resume',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});return result.violations.map(v=>v.id);});
  expect(violations,`resume ${theme}`).toEqual([]);
 }
 await page.evaluate(()=>document.documentElement.removeAttribute('data-theme'));
 // Главная не записывает позицию чтения.
 await page.evaluate(()=>scrollTo(0,400));await page.waitForTimeout(900);
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('mae-progress')??'null')?.reading?.page)).toBe('ch-08');
 // У главы без тренажёра карточки тренажёра нет, «Продолжить» во всю ширину.
 await page.evaluate(()=>localStorage.setItem('mae-progress',JSON.stringify({version:2,completed:[],exercises:[],practice:{},drills:{},reading:{page:'ch-01',y:0}})));
 await ready(page,'/');
 await expect(resume.locator('.home-resume-place')).toHaveText('От vibe coding к инженерной системе');
 await expect(resume.locator('.home-drill')).toHaveCount(0);
 await expect(resume.locator('.home-resume-grid')).toHaveClass(/home-resume-grid--single/);
 // Вводная глава: учебный профиль и прежний текст.
 await ready(page,'/start/00-how-to-read');
 await expect(page.locator('main .intro')).toBeVisible();await expect(page.locator('.learning-profile-home')).toBeVisible();
 await expect(page.locator('.rail-entry[data-section=start] .rail-item')).toHaveAttribute('aria-current',/page|true/);
 // Из главы 01 «Предыдущий раздел» ведёт на вводную главу, а не на Главную.
 await ready(page,'/chapters/01');
 await expect(page.locator('.pagination-previous')).toHaveAttribute('href','/start/00-how-to-read');
 // Старая ссылка /#ch-00-… приводит на новый адрес с якорем.
 await page.goto('/#ch-00-b1002');
 await expect(page).toHaveURL(/\/start\/00-how-to-read#ch-00-b1002$/);
 await expect(page.locator('#ch-00-b1002')).toBeAttached();
});

test('home: widths, keyboard, reduced motion and axe',async({page})=>{
 for(const width of [320,360,768,1024,1440]){
  await page.setViewportSize({width,height:900});await ready(page,'/');
  // Шаги пути доступны скринридеру и тогда, когда узко и схема скрыта.
  expect(await page.locator('#home-path-steps').evaluate(e=>e.checkVisibility()&&e.textContent!.includes('Deploy')),`${width}: path steps`).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),`${width}: no page scroll`).toBe(true);
  const small=await page.evaluate(()=>[...document.querySelectorAll('main a, main button')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&(r.height<44||r.width<44);}).map(e=>e.textContent));
  expect(small,`${width}: 44 px`).toEqual([]);
 }
 // Клавиатура: первая кнопка hero получает видимый фокус.
 await page.setViewportSize({width:1440,height:900});await ready(page,'/');
 const cta=page.locator('.home-actions a').first();await cta.focus();await expect(cta).toHaveCSS('outline-style','solid');
 const card=page.locator('a.home-card').first();await card.focus();await expect(card).toHaveCSS('outline-style','solid');
 // Фокус и наведение прорисовывают линии иллюстрации один раз; постоянной анимации на главной нет.
 await expect(card.locator('.hi-ln[pathLength]').first()).toHaveCSS('animation-name','home-draw');
 await page.locator('body').click({position:{x:1,y:1}});await settled(page);
 expect(await page.evaluate(()=>document.getAnimations().filter(a=>a.effect?.getComputedTiming().iterations===Infinity&&(a.effect as KeyframeEffect).target?.closest('main')).length)).toBe(0);
 // Reduced motion и data-motion="off": схема сразу в итоговом состоянии, точка стоит в конце пути.
 for(const mode of ['reduce','off']){
  if(mode==='reduce')await page.emulateMedia({reducedMotion:'reduce'});else{await page.emulateMedia({reducedMotion:'no-preference'});await page.evaluate(()=>document.documentElement.setAttribute('data-motion','off'));}
  await ready(page,'/');if(mode==='off')await page.evaluate(()=>document.documentElement.setAttribute('data-motion','off'));
  await expect(page.locator('.home-path .hi-ln')).toHaveCSS('animation-name','none');
  await expect(page.locator('.home-path .hi-ln')).toHaveCSS('stroke-dashoffset','0px');
  const card=page.locator('a.home-card').first();await card.focus();
  await expect(card.locator('.hi-ln[pathLength]').first()).toHaveCSS('animation-name','none');
  await expect(card).toHaveCSS('transition-duration','0s');
 }
 await page.evaluate(()=>document.documentElement.removeAttribute('data-motion'));
 for(const [width,theme] of [[320,'light'],[320,'dark'],[1440,'light'],[1440,'dark']] as const){
  await page.setViewportSize({width,height:900});
  await page.evaluate(t=>document.documentElement.setAttribute('data-theme',t),theme);
  await settled(page);await page.addScriptTag({path:'node_modules/axe-core/axe.min.js'});
  const violations=await page.evaluate(async()=>{const result=await(window as unknown as {axe:{run:(context:string,options:object)=>Promise<{violations:{id:string}[]}>}}).axe.run('main',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});return result.violations.map(v=>v.id);});
  expect(violations,`${width} ${theme}`).toEqual([]);
 }
});
