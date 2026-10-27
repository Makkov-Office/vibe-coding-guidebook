import {notFound} from 'next/navigation';
import {ChapterDemo,demoChapters,demoMetadata} from '../demo';
export const dynamic='force-static';
export const revalidate=false;
export const metadata=demoMetadata;
export function generateStaticParams(){return demoChapters.map(number=>({number}));}
export default async function ChapterDemoPage({params}:{params:Promise<{number:string}>}){const {number}=await params;if(!demoChapters.includes(number))notFound();return <ChapterDemo number={number} tab="overview"/>;}
