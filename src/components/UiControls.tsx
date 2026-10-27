"use client";
// Rail controls (P3-04, docs/design/visual-language.md «Навигация»): the theme in three states and
// the animation switch. Shown at the bottom of the rail and in the mobile «Разделы» menu; both
// copies share one record (src/design/ui-prefs.mjs).
import {useSyncExternalStore} from 'react';
import {readPrefs,writePrefs,subscribePrefs,THEMES,type UiPrefs} from '../design/ui-prefs.mjs';
import {RoleIcon} from './RoleIcon';

const themeName={system:'Как в системе',light:'Светлая',dark:'Тёмная'} as const;
const themeShort={system:'Авто',light:'Светлая',dark:'Тёмная'} as const;
const defaults:UiPrefs={theme:'system',motion:'on'},reducedQuery='(prefers-reduced-motion: reduce)';
const subscribeReduced=(listener:()=>void)=>{const media=matchMedia(reducedQuery);media.addEventListener('change',listener);return()=>media.removeEventListener('change',listener);};
const themeIcon={system:'themeSystem',light:'themeLight',dark:'themeDark'} as const;

export function UiControls({className}:{className:string}){
 // Server HTML and hydration use the defaults; the stored choice follows right after (the inline
 // script has already applied it to <html>, so nothing flashes).
 const prefs=useSyncExternalStore(subscribePrefs,readPrefs,()=>defaults);
 const reduced=useSyncExternalStore(subscribeReduced,()=>matchMedia(reducedQuery).matches,()=>false);
 const next=THEMES[(THEMES.indexOf(prefs.theme)+1)%THEMES.length];
 const playing=prefs.motion==='on'&&!reduced;
 return <div className={`ui-controls ${className}`} role="group" aria-label="Настройки интерфейса">
  <button type="button" className="ui-control" aria-label={`Тема: ${themeName[prefs.theme]}. Переключить на «${themeName[next]}»`} title={`Тема: ${themeName[prefs.theme]}`} onClick={()=>writePrefs({theme:next})}>
   <span className="ui-control-indicator"><RoleIcon role={themeIcon[prefs.theme]}/></span><span className="ui-control-label">{themeShort[prefs.theme]}</span>
  </button>
  <button type="button" className="ui-control" aria-pressed={playing} disabled={reduced} title={reduced?'Анимации выключены настройкой системы (уменьшение движения)':playing?'Остановить анимации':'Включить анимации'} onClick={()=>writePrefs({motion:playing?'off':'on'})}>
   <span className="ui-control-indicator"><RoleIcon role={playing?'motionPause':'motionPlay'}/></span><span className="ui-control-label">Анимации</span>
  </button>
 </div>;
}
