"use client";
// Rail controls (P3-04, docs/design/visual-language.md «Навигация»): the theme in three states.
// Shown at the bottom of the rail and in the mobile «Разделы» menu; both copies share one record
// (src/design/ui-prefs.mjs). The animation switch is gone (founder 29.10.2026, P3-09): motion
// follows prefers-reduced-motion only.
import {useState,useSyncExternalStore} from 'react';
import {readPrefs,writePrefs,subscribePrefs,nextTheme,type UiPrefs} from '../design/ui-prefs.mjs';
import {RailTrace} from './RailTrace';
import {RoleIcon} from './RoleIcon';

// The visible label is part of every accessible name (label in name, WCAG 2.5.3).
const themeShort={system:'Авто',light:'Светлая',dark:'Тёмная'} as const;
const themeName={system:'Авто (как в системе)',light:'Светлая',dark:'Тёмная'} as const;
const defaults:UiPrefs={theme:'system'};
function media(query:string){
 return [(listener:()=>void)=>{const list=matchMedia(query);list.addEventListener('change',listener);return()=>list.removeEventListener('change',listener);},()=>matchMedia(query).matches,()=>false] as const;
}
const darkMedia=media('(prefers-color-scheme: dark)');
const themeIcon={system:'themeSystem',light:'themeLight',dark:'themeDark'} as const;

export function UiControls({className}:{className:string}){
 // Server HTML and hydration use the defaults; the stored choice follows right after (the inline
 // script has already applied it to <html>, so nothing flashes).
 const prefs=useSyncExternalStore(subscribePrefs,readPrefs,()=>defaults);
 const systemDark=useSyncExternalStore(...darkMedia);
 const next=nextTheme(prefs.theme,systemDark);
 // A changed name on the focused button is rarely read out, so the new state is announced.
 const [announcement,setAnnouncement]=useState('');
 function setTheme(){writePrefs({theme:next});setAnnouncement(`Тема: ${themeName[next]}`);}
 return <div className={`ui-controls ${className}`} role="group" aria-label="Настройки интерфейса">
  <button type="button" className="ui-control" aria-label={`Тема: ${themeName[prefs.theme]}. Переключить на «${themeShort[next]}»`} title={`Тема: ${themeName[prefs.theme]}`} onClick={setTheme}>
   <span className="ui-control-indicator"><RoleIcon role={themeIcon[prefs.theme]}/><RailTrace/></span><span className="ui-control-label">{themeShort[prefs.theme]}</span>
  </button>
  <span className="sr-only" role="status">{announcement}</span>
 </div>;
}
