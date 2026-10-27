import {test,expect,type Page} from '@playwright/test';
import fs from 'node:fs';
// P7-03: the drill of chapter 08 in its «Проверь себя» tab.
type Card={id:string;scenario:string;question:string;options:{id:string;label:string}[];answer:string;explanation:string;href:string};
const data:{drills:{id:string;chapter:string;title:string;cards:Card[]}[]}=JSON.parse(fs.readFileSync('src/content/generated.json','utf8'));
const drill=data.drills.find(item=>item.chapter==='ch-08')!;
const total=drill.cards.length;
async function ready(page:Page,path:string){await page.goto(path);await page.waitForSelector('html.js-enabled');await expect(page.locator('.search-trigger')).toBeEnabled();}
const label=(card:Card,id:string)=>card.options.find(option=>option.id===id)!.label;

test('the drill is played card by card, with feedback, a result and a saved best',async({page})=>{
 await ready(page,'/flow/08-preflight/check');
 const box=page.locator('section.drill');
 await expect(box.getByRole('heading',{level:2})).toHaveText(drill.title);
 await expect(page.locator('.ct-empty')).toHaveCount(0);
 await box.getByRole('button',{name:'Начать'}).click();
 for(const [i,card] of drill.cards.entries()){
  const heading=box.getByRole('heading',{level:2});
  await expect(heading).toHaveText(card.scenario);await expect(heading).toBeFocused();
  await expect(box.locator('.drill-meta')).toContainText(`Ситуация ${i+1} из ${total}`);
  await expect(box.locator('legend')).toHaveText(card.question);
  // The first card is answered wrong, the others right.
  const pick=i===0?card.options.find(option=>option.id!==card.answer)!.id:card.answer;
  await box.getByRole('button',{name:label(card,pick),exact:false}).first().click();
  const feedback=box.locator('.drill-feedback');
  if(i===0){
   await expect(feedback).toContainText(`Неверно. Правильный ответ: ${label(card,card.answer)}.`);
   await expect(box.locator('.drill-option[data-state=wrong]')).toContainText('Твой ответ');
  }else await expect(feedback).toContainText('Верно.');
  await expect(box.locator('.drill-option[data-state=right]')).toContainText('Верный ответ');
  await expect(feedback).toContainText(card.explanation);
  await expect(feedback.getByRole('link',{name:'Перечитать в главе'})).toHaveAttribute('href',card.href);
  const next=box.getByRole('button',{name:i<total-1?'Следующая ситуация':'Посмотреть результат'});
  await expect(next).toBeFocused();await page.keyboard.press('Enter');
 }
 const result=box.getByRole('heading',{level:2});
 await expect(result).toHaveText(`Результат: ${total-1} из ${total}`);await expect(result).toBeFocused();
 await expect(box).toContainText('Навык засчитан');
 await expect(box.locator('.drill-missed a')).toHaveAttribute('href',drill.cards[0].href);
 await expect(box.getByRole('link',{name:/^Дальше:/})).toHaveAttribute('href','/chapters/09');
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('mae-progress')??'null'));
 expect(stored.drills[drill.id]).toEqual({best:total-1,total});
 await page.reload();await page.waitForSelector('html.js-enabled');
 await expect(box).toContainText(`Лучший результат: ${total-1} из ${total} · навык засчитан`);
 await expect(box.getByRole('button',{name:'Пройти ещё раз'})).toBeEnabled();
});

test('the drill works from the keyboard and a weaker run keeps the best result',async({page})=>{
 await page.addInitScript(({id,total})=>{if(sessionStorage.getItem('seeded'))return;sessionStorage.setItem('seeded','1');localStorage.setItem('mae-progress',JSON.stringify({version:2,completed:[],exercises:[],practice:{},drills:{[id]:{best:total,total}},reading:null}));},{id:drill.id,total});
 await ready(page,'/flow/08-preflight/check');
 const box=page.locator('section.drill');
 await expect(box).toContainText(`Лучший результат: ${total} из ${total}`);
 await box.getByRole('button',{name:'Пройти ещё раз'}).focus();await page.keyboard.press('Enter');
 for(let i=0;i<total;i++){
  // Tab from the focused scenario to the first option and pick it, right or wrong.
  await page.keyboard.press('Tab');await expect(box.locator('.drill-option').first()).toBeFocused();await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
 }
 await expect(box.getByRole('heading',{level:2})).toContainText('Результат:');
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('mae-progress')??'null'));
 expect(stored.drills[drill.id]).toEqual({best:total,total});
});

test('a best result saved for another number of cards is not shown',async({page})=>{
 await page.addInitScript(({id,total})=>{localStorage.setItem('mae-progress',JSON.stringify({version:2,completed:[],exercises:[],practice:{},drills:{[id]:{best:total+1,total:total+1}},reading:null}));},{id:drill.id,total});
 await ready(page,'/flow/08-preflight/check');
 const box=page.locator('section.drill');
 await expect(box.getByRole('button',{name:'Начать'})).toBeEnabled();await expect(box.locator('.drill-best')).toHaveCount(0);
});

test('without JavaScript the drill is readable with its answers',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();
 await page.goto('/flow/08-preflight/check');
 const fallback=page.locator('.drill-static');
 // The player needs JavaScript, so it is hidden: no dead «Начать» button above the answers.
 await expect(page.locator('section.drill:not(.drill-static)')).toBeHidden();
 await expect(fallback.locator('li')).toHaveCount(total);
 await fallback.locator('summary').first().click();
 await expect(fallback.locator('details').first()).toContainText(drill.cards[0].explanation);
 await context.close();
});
