// Addresses of chapters that already live in the new structure (P5-02b).
// A url-map entry with `live: true` is served at its tab pages
// (`new` + `tabs[].segment`); its old address answers 308. Shared with the
// chapter template (P5-02): it takes the tab links from chapterTabHrefs.
import urlMap from './url-map.json';
import type {TabId} from './types';
interface LiveEntry {old:string;new:string;chapter:string}
export const chapterTabs=urlMap.tabs as {id:TabId;segment:string;label:string}[];
const liveEntries=urlMap.pages.filter((entry):entry is typeof entry&LiveEntry=>'live' in entry&&entry.live===true);
export const liveChapters:LiveEntry[]=liveEntries.filter(entry=>'tabs' in entry&&entry.tabs===true);
// A live page without tabs (glossary, cheat sheet: P2-05b) is served at its new address; its old one answers 308.
export const movedPages:LiveEntry[]=liveEntries.filter(entry=>!('tabs' in entry));
export const movedPage=(chapterId:string)=>movedPages.find(entry=>entry.chapter===chapterId);
const tabHref=(entry:LiveEntry,tab:TabId)=>{const segment=chapterTabs.find(item=>item.id===tab)!.segment;return segment?`${entry.new}/${segment}`:entry.new;};
export const liveChapter=(chapterId:string)=>liveChapters.find(entry=>entry.chapter===chapterId);
export function chapterTabHrefs(chapterId:string):Record<TabId,string>{
  const entry=liveChapter(chapterId);if(!entry)throw new Error(`${chapterId} is not a live chapter`);
  return Object.fromEntries(chapterTabs.map(tab=>[tab.id,tabHref(entry,tab.id)])) as Record<TabId,string>;
}
// Page address of a page id: the tab when the chapter is live, the new address when the page has moved.
export function pageHref(chapterId:string,tab?:string){
  const entry=liveChapter(chapterId);if(entry)return tabHref(entry,chapterTabs.find(item=>item.id===tab)?.id??'overview');
  return movedPage(chapterId)?.new??urlMap.pages.find(item=>item.chapter===chapterId&&!('alias' in item))?.old??'/';
}
// Chapter and tab of a live chapter's address, or null.
export function liveRoute(pathname:string):{chapterId:string;tab:TabId}|null{
  for(const entry of liveChapters)for(const tab of chapterTabs)if(tabHref(entry,tab.id)===pathname)return {chapterId:entry.chapter,tab:tab.id};
  return null;
}
