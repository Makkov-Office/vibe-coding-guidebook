import {test,expect} from '@playwright/test';
import fs from 'node:fs';
// localStorage captured from a real session on the main build before P7-01 (tests/fixtures/progress-v1-main.json).
const fixture:{storage:Record<string,string>;shown:{completed:string;xp:number;exercises:string}}=JSON.parse(fs.readFileSync('tests/fixtures/progress-v1-main.json','utf8'));
async function ready(page:import('@playwright/test').Page,path:string){await page.goto(path);await page.waitForSelector('html.js-enabled');await expect(page.locator('.search-trigger')).toBeEnabled();}

test('progress saved by the previous version is shown after the update, once migrated',async({page})=>{
 // Only the first document gets the old keys: later loads must read the migrated record.
 await page.addInitScript(storage=>{if(sessionStorage.getItem('seeded'))return;sessionStorage.setItem('seeded','1');localStorage.clear();for(const [key,value] of Object.entries(storage))localStorage.setItem(key,value);},fixture.storage);
 // The learning profile moved with the introduction (P4-01).
 await ready(page,'/start/00-how-to-read');
 const profile=page.locator('.learning-progress');
 await expect(page.locator('.learning-heading strong')).toHaveText(fixture.shown.completed);
 await expect(profile.locator('.profile-xp strong')).toHaveText(String(fixture.shown.xp));
 await expect(profile).toContainText(`Упражнения для брата: ${fixture.shown.exercises}`);
 await expect(page.locator('.resume-button')).toHaveAttribute('href','/flow/08-preflight?resume=1');
 const record=await page.evaluate(()=>JSON.parse(localStorage.getItem('mae-progress')??'null'));
 expect(record).toMatchObject({version:2,reading:{page:'ch-08',y:960}});
 expect(record.completed.sort()).toEqual(['ch-01','ch-02','ch-08']);
 // The old keys are kept for a rollback.
 expect(await page.evaluate(()=>localStorage.getItem('handbook-learning-v2'))).toBe(fixture.storage['handbook-learning-v2']);
 await page.reload();await expect(page.locator('.learning-heading strong')).toHaveText(fixture.shown.completed);
 // «Продолжить» on Главная goes back to the saved position of chapter 08 (y 960, or the bottom of a shorter page).
 await ready(page,'/');await page.locator('.resume-button').click();await expect(page).toHaveURL(/\/flow\/08-preflight$/);await expect.poll(()=>page.evaluate(()=>scrollY===Math.min(960,document.documentElement.scrollHeight-innerHeight))).toBe(true);
 await expect(page.getByRole('button',{name:/Глава изучена · отменить/})).toHaveAttribute('aria-pressed','true');
 await ready(page,'/chapters/20');const exercises=page.locator('[data-exercise]');
 await expect(exercises.nth(0)).toBeChecked();await expect(exercises.nth(1)).not.toBeChecked();await expect(exercises.nth(2)).toBeChecked();
 await ready(page,'/reference/22-cheatsheet');
 await expect(page.locator('[data-practice="ch-22-b003-15"]')).toBeChecked();await expect(page.locator('[data-practice="ch-22-b003-16"]')).not.toBeChecked();
});

test('damaged saved progress does not break the page',async({page})=>{
 await page.addInitScript(()=>{if(sessionStorage.getItem('seeded'))return;sessionStorage.setItem('seeded','1');localStorage.clear();localStorage.setItem('mae-progress','{broken');localStorage.setItem('handbook-learning-v2','not json');localStorage.setItem('practice:ch-22-b003-15','1');});
 await ready(page,'/start/00-how-to-read');
 await expect(page.locator('.learning-heading strong')).toHaveText('0 из 22');
 await expect(page.locator('.learning-progress')).toContainText('Сохранённый прогресс не удалось прочитать');
 await ready(page,'/reference/22-cheatsheet');await expect(page.locator('[data-practice="ch-22-b003-15"]')).toBeChecked();
});
