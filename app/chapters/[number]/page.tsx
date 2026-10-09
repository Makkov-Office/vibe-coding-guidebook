import {notFound,redirect} from 'next/navigation';
import {HandbookPage,handbook} from '../../../src/components/HandbookPage';
import {brandTitle} from '../../../src/design/brand';
export async function generateMetadata({params}:{params:Promise<{number:string}>}){const {number}=await params;const chapter=handbook.chapters.find(c=>c.id===`ch-${number}`);return {title:chapter?`${chapter.title} · ${brandTitle}`:brandTitle};}
export function generateStaticParams(){return Array.from({length:22},(_,i)=>({number:String(i+1).padStart(2,'0')}));}
export default async function ChapterPage({params}:{params:Promise<{number:string}>}){const {number}=await params;if(number==='23')redirect('/glossary');if(!/^(0[1-9]|1\d|2[0-2])$/.test(number))notFound();return <HandbookPage id={`ch-${number}`}/>;}
