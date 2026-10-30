// Световой след в месте нажатия (P2-08, docs/design/visual-language.md, «Движение»): одно делегированное событие
// pointerdown на документе. Скрипт только ставит точку касания (--glow-x/--glow-y), размер (--glow-reach) и атрибут
// data-glowing; само свечение — псевдоэлемент из src/design/interaction.css. Без зависимостей; работает и до гидрации,
// поэтому подключается встроенным скриптом, как ui-prefs.mjs. При reduced motion и data-motion="off" ничего не делает.

/** Кликабельные элементы со следом; тот же список — в src/design/interaction.css (сверяет tests/press-glow.test.mjs). */
export const PRESS_SELECTOR='.bp-press,.bp-button,.bp-chip,.page-tabs a,.ct-copy,a.bp-card,a.home-card,a.home-drill,a.home-next-item,.ct-pager-link,[data-glow]';

/**
 * Ставит обработчик. Функция самодостаточна: её исходный текст встраивается в страницу (pressGlowScript).
 * @param {Document} doc @param {Window} win @param {string} selector
 */
export function installPressGlow(doc,win,selector){
  var root=doc.documentElement;
  if(root.hasAttribute('data-press-glow'))return;
  root.setAttribute('data-press-glow','');
  var reduce=win.matchMedia?win.matchMedia('(prefers-reduced-motion: reduce)'):null;
  doc.addEventListener('pointerdown',function(event){
    if(event.button!==0||root.getAttribute('data-motion')==='off'||(reduce&&reduce.matches))return;
    var target=event.target,host=target&&target.closest?target.closest(selector):null;
    if(!host||host.matches(':disabled,[aria-disabled="true"]'))return;
    var box=host.getBoundingClientRect(),x=event.clientX-box.left,y=event.clientY-box.top;
    // До самого дальнего угла, но не больше 240 px: на большой карточке след остаётся локальным.
    var reach=Math.min(240,Math.max(Math.hypot(x,y),Math.hypot(box.width-x,y),Math.hypot(x,box.height-y),Math.hypot(box.width-x,box.height-y)));
    host.style.setProperty('--glow-x',x.toFixed(1)+'px');
    host.style.setProperty('--glow-y',y.toFixed(1)+'px');
    host.style.setProperty('--glow-reach',reach.toFixed(1)+'px');
    // Повторное нажатие перезапускает след с новой точки.
    host.removeAttribute('data-glowing');
    void host.offsetWidth;
    host.setAttribute('data-glowing','');
  },{capture:true,passive:true});
  doc.addEventListener('animationend',function(event){
    var host=event.target;
    if(event.animationName==='press-glow'&&host&&host.removeAttribute)host.removeAttribute('data-glowing');
  },true);
}

/** Встроенный скрипт для <head>: тот же код, что installPressGlow, без импортов. */
export const pressGlowScript=`(${installPressGlow.toString()})(document,window,${JSON.stringify(PRESS_SELECTOR)});`;
