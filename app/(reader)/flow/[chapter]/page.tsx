import {notFound} from 'next/navigation';
import {ChapterTabPage} from '../../../../src/components/ChapterTabPage';
import {liveChapters} from '../../../../src/content/chapter-routes';
import {handbook} from '../../../../src/components/HandbookPage';
import {brandTitle} from '../../../../src/design/brand';
export const dynamic='force-static';
export const revalidate=false;
export const dynamicParams=false;
// Overview tab of a live chapter of the «flow» section (P5-02b).
const entryOf=(slug:string)=>liveChapters.find(entry=>entry.new===`/flow/${slug}`);
export function generateStaticParams(){return liveChapters.filter(entry=>entry.new.startsWith('/flow/')).map(entry=>({chapter:entry.new.slice('/flow/'.length)}));}
export async function generateMetadata({params}:{params:Promise<{chapter:string}>}){const {chapter}=await params;const entry=entryOf(chapter);const title=handbook.chapters.find(c=>c.id===entry?.chapter)?.title;return {title:title?`${title} · ${brandTitle}`:brandTitle};}
export default async function FlowChapterPage({params}:{params:Promise<{chapter:string}>}){const {chapter}=await params;const entry=entryOf(chapter);if(!entry)notFound();return <ChapterTabPage chapterId={entry.chapter} tabId="overview"/>;}
