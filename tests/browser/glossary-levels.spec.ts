import {test,expect} from '@playwright/test';
import fs from 'node:fs';
// P6-07: level filter, collapsed basic Git terms and the level in the term preview.
const data:{terms:{id:string;topic:string;level:string}[]}=JSON.parse(fs.readFileSync('src/content/generated.json','utf8'));
const basic=data.terms.filter(term=>term.level==='basic'),professional=data.terms.filter(term=>term.level==='professional');
const gitBasic=basic.filter(term=>term.topic.startsWith('23.3.'));
async function ready(page:import('@playwright/test').Page,path:string){await page.goto(path);await page.waitForSelector('html.js-enabled');await expect(page.locator('.search-trigger')).toBeEnabled();}

test('level filter counts and hides terms; basic Git terms are collapsed until needed',async({page})=>{
 await ready(page,'/glossary');
 const group=page.locator('details.glossary-basics');const status=page.locator('.glossary-filter [role=status]');
 await expect(group).toHaveCount(1);await expect(group).not.toHaveAttribute('open','');
 await expect(group.locator('summary')).toHaveText(`Базовые термины Git · ${gitBasic.length}`);
 await expect(page.locator('#term-commit')).toBeHidden();await expect(page.locator('#term-trunk')).toBeVisible();
 const levels=page.getByRole('group',{name:'Уровень'});
 await expect(levels.getByRole('button',{name:'Все'})).toHaveAttribute('aria-pressed','true');
 await expect(levels.getByRole('button',{name:/^Базовое/})).toContainText(String(basic.length));
 await expect(levels.getByRole('button',{name:/^Профессиональное/})).toContainText(String(professional.length));
 await levels.getByRole('button',{name:/^Профессиональное/}).click();
 await expect(status).toHaveText(`Найдено определений: ${professional.length}`);
 await expect(page.locator('.term-definition[data-level=basic]:visible')).toHaveCount(0);await expect(group).toBeHidden();
 await expect(page.locator('#term-harness')).toBeVisible();
 await levels.getByRole('button',{name:/^Базовое/}).click();
 await expect(status).toHaveText(`Найдено определений: ${basic.length}`);
 await expect(page.locator('.term-definition[data-level=professional]:visible')).toHaveCount(0);
 await expect(group).toHaveAttribute('open','');await expect(page.locator('#term-commit')).toBeVisible();
 // Level, topic and query combine; the level counts follow the query.
 await page.getByLabel('Термин',{exact:true}).fill('rebase');
 await expect(page.locator('#term-rebase')).toBeVisible();
 await page.getByRole('button',{name:'Сбросить фильтр'}).click();
 await expect(levels.getByRole('button',{name:'Все'})).toHaveAttribute('aria-pressed','true');
 await expect(status).toHaveText(`Найдено определений: ${data.terms.length}`);
 // A search in the closed group opens it.
 await page.reload();await page.waitForSelector('html.js-enabled');await expect(group).not.toHaveAttribute('open','');
 await page.getByLabel('Термин',{exact:true}).fill('fast-forward');await expect(group).toHaveAttribute('open','');await expect(page.locator('#term-fast-forward')).toBeVisible();
 // Keyboard: the level buttons are reachable and pressable.
 await page.getByRole('button',{name:'Сбросить фильтр'}).click();
 await levels.getByRole('button',{name:'Все'}).focus();await page.keyboard.press('Tab');await expect(levels.getByRole('button',{name:/^Базовое/})).toBeFocused();await page.keyboard.press('Enter');await expect(levels.getByRole('button',{name:/^Базовое/})).toHaveAttribute('aria-pressed','true');
});

test('arrival at a collapsed term opens its group, from a link and from search',async({page})=>{
 await ready(page,'/glossary#term-commit');
 await expect(page.locator('details.glossary-basics')).toHaveAttribute('open','');await expect(page.locator('#term-commit')).toBeFocused();
 await ready(page,'/glossary');await page.getByRole('group',{name:'Уровень'}).getByRole('button',{name:/^Профессиональное/}).click();
 await page.keyboard.press('Control+k');await page.getByLabel('Термин, фраза или текст примера').fill('Squash merge');
 const result=page.locator('.search-results>a',{hasText:'Squash merge'}).first();await expect(result).toBeVisible();await result.click();
 await expect(page.locator('#term-squash')).toBeVisible();await expect(page.locator('#term-squash')).toBeFocused();
 await expect(page.getByRole('group',{name:'Уровень'}).getByRole('button',{name:'Все'})).toHaveAttribute('aria-pressed','true');
});

test('the term preview shows the level of the term',async({page})=>{
 await ready(page,'/chapters/01');
 const term=page.locator('main .term-link').first();const id=(await term.getAttribute('href'))!.split('#')[1];
 const level=data.terms.find(t=>t.id===id)!.level;
 await term.click();const tip=page.getByRole('tooltip');await expect(tip).toBeVisible();
 await expect(tip.locator('.term-level')).toHaveText(level==='basic'?'Базовое':'Профессиональное');
 await expect(tip.locator('.term-level')).toHaveAttribute('data-level',level);
});
