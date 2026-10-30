// Появление при прокрутке (приём 7, app/motion.css): дети групп каскада (motion-groups.mjs), которые при показе
// страницы ниже экрана, ждут (data-reveal="wait") и появляются каскадом, когда входят в экран. Видимые сразу
// анимирует CSS при отрисовке, поэтому скрипт их не трогает и не вызывает мигания. Один IntersectionObserver на
// страницу; элемент снимается с наблюдения после появления. При выключенном движении ничего не делает.
import {STAGGER_CHILDREN,STAGGER_GROUPS} from './motion-groups.mjs';
import {motionEnabled} from './motion';

const GROUP=STAGGER_GROUPS.join(',');

/** Готовит появление при прокрутке внутри root; возвращает отмену (снимает наблюдение и показывает всё). */
export function revealOnScroll(root:HTMLElement|null):()=>void{
  // Страница, открытая на якоре или с восстановлением позиции (?return, ?resume), сразу прыгает вниз: прятать нечего.
  if(!root||!motionEnabled()||typeof IntersectionObserver==='undefined'||location.hash||/[?&](return|resume)\b/.test(location.search))return ()=>{};
  const fold=innerHeight;
  // Одно чтение геометрии на всю страницу; вложенная группа целиком не появляется (каскад идёт по её детям).
  const waiting=[...root.querySelectorAll<HTMLElement>(STAGGER_CHILDREN)].filter(el=>!el.matches(GROUP)&&!el.dataset.reveal&&el.getBoundingClientRect().top>fold);
  if(!waiting.length)return ()=>{};
  const observer=new IntersectionObserver(entries=>{
    const shown=entries.filter(entry=>entry.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top||a.boundingClientRect.left-b.boundingClientRect.left);
    shown.forEach((entry,i)=>{const el=entry.target as HTMLElement;el.style.setProperty('--i',String(i));el.dataset.reveal='in';observer.unobserve(el);});
  },{rootMargin:'0px 0px -6% 0px'});
  for(const el of waiting){el.dataset.reveal='wait';observer.observe(el);}
  return ()=>{observer.disconnect();for(const el of waiting)if(el.dataset.reveal==='wait')delete el.dataset.reveal;};
}
