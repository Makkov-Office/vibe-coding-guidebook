// Нижний лист (P3-12, мобильный адаптив): лист тянут вниз за ручку или шапку — он едет за пальцем, а отпущенный ниже
// порога или брошенный вниз закрывается. Иначе возвращается на место по той же кривой, что и при открытии.
// Скрипт только двигает translate; появление и уход — переходы CSS (mobile-nav.css, app/globals.css).

/** Порог закрытия: четверть высоты листа, но не больше 120 px; бросок — быстрее 0,5 px/мс. */
const distance=(sheet:HTMLElement)=>Math.min(120,sheet.offsetHeight*.25),flick=.5;

/** Подключает жест к листу; возвращает отписку. Начало жеста на кнопке или ссылке не мешает их нажатию:
 *  лист сдвигается только после 6 px движения вниз. enabled — жест действует сейчас (панель стала листом). */
export function sheetDrag(sheet:HTMLElement,grip:HTMLElement,close:()=>void,enabled:()=>boolean=()=>true){
  let start=0,offset=0,last=0,time=0,speed=0,pointer=-1,moving=false;
  const down=(event:PointerEvent)=>{
    if(pointer>=0||(event.pointerType==='mouse'&&event.button!==0)||!enabled())return;
    pointer=event.pointerId;start=last=event.clientY;time=event.timeStamp;offset=speed=0;moving=false;
  };
  const move=(event:PointerEvent)=>{
    if(event.pointerId!==pointer)return;
    const dy=event.clientY-start;
    if(!moving){if(dy<6)return;moving=true;grip.setPointerCapture(pointer);sheet.dataset.dragging='';}
    offset=Math.max(0,dy);
    const dt=event.timeStamp-time;if(dt>0)speed=(event.clientY-last)/dt;last=event.clientY;time=event.timeStamp;
    sheet.style.translate=`0 ${offset}px`;
  };
  const up=(event:PointerEvent)=>{
    if(event.pointerId!==pointer)return;pointer=-1;
    if(!moving)return;moving=false;delete sheet.dataset.dragging;
    // Ушёл в CSS: закрытый лист уезжает вниз из текущего положения, открытый возвращается на место.
    sheet.style.translate='';
    if(event.type==='pointerup'&&(offset>distance(sheet)||speed>flick))close();
  };
  // Клик после жеста не нажимает кнопку, на которой жест начался.
  const click=(event:MouseEvent)=>{if(offset>6){event.preventDefault();event.stopPropagation();offset=0;}};
  grip.addEventListener('pointerdown',down);grip.addEventListener('pointermove',move);
  grip.addEventListener('pointerup',up);grip.addEventListener('pointercancel',up);grip.addEventListener('click',click,true);
  return()=>{
    grip.removeEventListener('pointerdown',down);grip.removeEventListener('pointermove',move);
    grip.removeEventListener('pointerup',up);grip.removeEventListener('pointercancel',up);grip.removeEventListener('click',click,true);
  };
}
