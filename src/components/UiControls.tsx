"use client";
// Rail controls (P3-04, docs/design/visual-language.md «Навигация»): the theme in three states and
// the animation switch. Shown at the bottom of the rail and in the mobile «Разделы» menu; both
// copies share one record (src/design/ui-prefs.mjs).
import {useId,useState,useSyncExternalStore} from 'react';
import {readPrefs,writePrefs,subscribePrefs,nextTheme,type UiPrefs} from '../design/ui-prefs.mjs';
import {RoleIcon} from './RoleIcon';

// The visible label is part of every accessible name (label in name, WCAG 2.5.3).
const themeShort={system:'Авто',light:'Светлая',dark:'Тёмная'} as const;
const themeName={system:'Авто (как в системе)',light:'Светлая',dark:'Тёмная'} as const;
const defaults:UiPrefs={theme:'system',motion:'on'};
function media(query:string){
 return [(listener:()=>void)=>{const list=matchMedia(query);list.addEventListener('change',listener);return()=>list.removeEventListener('change',listener);},()=>matchMedia(query).matches,()=>false] as const;
}
const reducedMedia=media('(prefers-reduced-motion: reduce)'),darkMedia=media('(prefers-color-scheme: dark)');
const themeIcon={system:'themeSystem',light:'themeLight',dark:'themeDark'} as const;

export function UiControls({className}:{className:string}){
 // Server HTML and hydration use the defaults; the stored choice follows right after (the inline
 // script has already applied it to <html>, so nothing flashes).
 const prefs=useSyncExternalStore(subscribePrefs,readPrefs,()=>defaults);
 const reduced=useSyncExternalStore(...reducedMedia),systemDark=useSyncExternalStore(...darkMedia);
 const next=nextTheme(prefs.theme,systemDark);
 const playing=prefs.motion==='on'&&!reduced;
 // A changed name on the focused button is rarely read out, so the new state is announced.
 const [announcement,setAnnouncement]=useState(''),reason=useId();
 function setTheme(){writePrefs({theme:next});setAnnouncement(`Тема: ${themeName[next]}`);}
 function toggleMotion(){if(reduced)return;writePrefs({motion:playing?'off':'on'});setAnnouncement(playing?'Анимации остановлены':'Анимации включены');}
 return <div className={`ui-controls ${className}`} role="group" aria-label="Настройки интерфейса">
  <button type="button" className="ui-control" aria-label={`Тема: ${themeName[prefs.theme]}. Переключить на «${themeShort[next]}»`} title={`Тема: ${themeName[prefs.theme]}`} onClick={setTheme}>
   <span className="ui-control-indicator"><RoleIcon role={themeIcon[prefs.theme]}/></span><span className="ui-control-label">{themeShort[prefs.theme]}</span>
  </button>
  {/* Under reduced motion the switch stays focusable and says why it does nothing. */}
  <button type="button" className="ui-control" aria-pressed={playing} aria-disabled={reduced||undefined} aria-describedby={reduced?reason:undefined} title={reduced?'Анимации выключены настройкой системы (уменьшение движения)':playing?'Остановить анимации':'Включить анимации'} onClick={toggleMotion}>
   <span className="ui-control-indicator"><RoleIcon role={playing?'motionPause':'motionPlay'}/></span><span className="ui-control-label">Анимации</span>
  </button>
  {reduced&&<span id={reason} className="sr-only">Выключены настройкой системы: уменьшение движения</span>}
  <span className="sr-only" role="status">{announcement}</span>
 </div>;
}
