import {handbook} from './HandbookPage';
import {LearningProgress} from './LearningProgress';
import {chapterTabHrefs} from '../content/chapter-routes';
import type {ReactNode} from 'react';
import type {TabId} from '../content/types';
import {ChapterTemplate} from '../design/ChapterTemplate';
// One tab of a live chapter (P5-02b) in the chapter template (P5-02): at the edges the pager leads to the neighbouring chapters.
export function ChapterTabPage({chapterId,tabId,children}:{chapterId:string;tabId:TabId;children?:ReactNode}){
 const reading=handbook.chapters.filter(c=>/^ch-\d{2}$/.test(c.id)),index=reading.findIndex(c=>c.id===chapterId);
 const link=(i:number)=>reading[i]&&{href:reading[i].href,label:reading[i].title};
 return <><ChapterTemplate chapterId={chapterId} tabId={tabId} hrefs={chapterTabHrefs(chapterId)} prev={link(index-1)} next={link(index+1)}>{children}</ChapterTemplate><LearningProgress chapter={chapterId}/></>;
}
