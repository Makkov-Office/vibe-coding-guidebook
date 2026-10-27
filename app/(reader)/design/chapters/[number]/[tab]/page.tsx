import {notFound} from 'next/navigation';
import {ChapterDemo,demoChapters,demoMetadata,demoTabs} from '../../demo';
import type {TabId} from '../../../../../../src/design/ChapterTemplate';
export const dynamic='force-static';
export const revalidate=false;
export const metadata=demoMetadata;
export function generateStaticParams(){return demoChapters.flatMap(number=>demoTabs.map(tab=>({number,tab})));}
export default async function ChapterDemoTabPage({params}:{params:Promise<{number:string;tab:string}>}){const {number,tab}=await params;if(!demoChapters.includes(number)||!demoTabs.includes(tab as TabId))notFound();return <ChapterDemo number={number} tab={tab as TabId}/>;}
