import {notFound,redirect} from 'next/navigation';
import {HandbookPage} from '../../../src/components/HandbookPage';
export function generateStaticParams(){return Array.from({length:22},(_,i)=>({number:String(i+1).padStart(2,'0')}));}
export default async function ChapterPage({params}:{params:Promise<{number:string}>}){const {number}=await params;if(number==='23')redirect('/glossary');if(!/^(0[1-9]|1\d|2[0-2])$/.test(number))notFound();return <HandbookPage id={`ch-${number}`}/>;}
