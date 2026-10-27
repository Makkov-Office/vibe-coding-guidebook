import {test,expect} from '@playwright/test';
import {railNavigate} from './nav';

test('storage refusal retains learning and practice marks across SPA routes, then resets them',async({page})=>{
 async function navigate(path:string){await railNavigate(page,path);await expect(page).toHaveURL(new RegExp(path==='/'?'/$':path+'$'));await expect(page.locator(path==='/'?'main .intro':`main [data-chapter="ch-${path.match(/\d{2}/)?.[0]}"]`)).toBeVisible();}
 await page.addInitScript(()=>{for(const name of ['getItem','setItem','removeItem'])Object.defineProperty(Storage.prototype,name,{value:()=>{throw Error('denied');}});});
 await page.goto('/chapters/01');await expect(page.locator('.completion-button')).toBeEnabled();await page.locator('.completion-button').click();await expect(page.locator('.learning-heading')).toContainText('1 из 22');
 await navigate('/');await expect(page).toHaveURL(/\/$/);await expect(page.locator('.learning-heading')).toContainText('1 из 22');await expect(page.locator('.learning-progress')).toContainText('до перезагрузки вкладки');
 await navigate('/chapters/20');const exercise=page.locator('[data-exercise]').first();await exercise.check();await navigate('/');await expect(page.locator('.learning-progress')).toContainText('Упражнения для брата: 1 из 5');
 await navigate('/chapters/20');await expect(exercise).toBeChecked();await navigate('/reference/22-cheatsheet');const operational=page.locator('[data-practice]').first();await operational.check();await navigate('/');page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Сбросить прогресс'}).click();await expect(page.locator('.learning-heading')).toContainText('0 из 22');
 await navigate('/chapters/20');await expect(exercise).not.toBeChecked();await navigate('/reference/22-cheatsheet');await expect(operational).toBeChecked();await page.getByRole('button',{name:'Сбросить чеклисты',exact:true}).click();await navigate('/');await navigate('/reference/22-cheatsheet');await expect(operational).not.toBeChecked();
});
