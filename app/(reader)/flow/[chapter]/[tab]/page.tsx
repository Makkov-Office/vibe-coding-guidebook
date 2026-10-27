import {notFound} from 'next/navigation';
import {ChapterTabPage} from '../../../../../src/components/ChapterTabPage';
import {DrillPlayer,DrillStatic} from '../../../../../src/components/DrillPlayer';
import {chapterTabs,liveChapters} from '../../../../../src/content/chapter-routes';
import {handbook} from '../../../../../src/components/HandbookPage';
import {brandTitle} from '../../../../../src/design/brand';
export const dynamic='force-static';
export const revalidate=false;
export const dynamicParams=false;
// The other tabs of a live chapter of the «flow» section (P5-02b); the overview is the chapter address itself.
const entryOf=(slug:string)=>liveChapters.find(entry=>entry.new===`/flow/${slug}`);
const tabOf=(segment:string)=>chapterTabs.find(tab=>tab.segment&&tab.segment===segment);
export function generateStaticParams(){return liveChapters.filter(entry=>entry.new.startsWith('/flow/')).flatMap(entry=>chapterTabs.filter(tab=>tab.segment).map(tab=>({chapter:entry.new.slice('/flow/'.length),tab:tab.segment})));}
export async function generateMetadata({params}:{params:Promise<{chapter:string;tab:string}>}){const {chapter,tab}=await params;const title=handbook.chapters.find(c=>c.id===entryOf(chapter)?.chapter)?.title,label=tabOf(tab)?.label;return {title:title&&label?`${label} · ${title} · ${brandTitle}`:brandTitle};}
export default async function FlowChapterTabPage({params}:{params:Promise<{chapter:string;tab:string}>}){const {chapter,tab}=await params;const entry=entryOf(chapter),found=tabOf(tab);if(!entry||!found)notFound();
 // The «check» tab holds the drill of the chapter (P7-03); its last step leads to the next chapter.
 const drill=found.id==='check'?handbook.drills.find(item=>item.chapter===entry.chapter):undefined;
 const reading=handbook.chapters.filter(c=>/^ch-\d{2}$/.test(c.id)),after=reading[reading.findIndex(c=>c.id===entry.chapter)+1];
 return <ChapterTabPage chapterId={entry.chapter} tabId={found.id}>{drill&&<><DrillPlayer drill={drill} next={after?{href:after.href,label:after.title}:undefined}/><noscript><DrillStatic drill={drill}/></noscript></>}</ChapterTabPage>;}
