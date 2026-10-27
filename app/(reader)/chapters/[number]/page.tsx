import {notFound,permanentRedirect,redirect} from 'next/navigation';
import {liveChapter,movedPage,pageHref} from '../../../../src/content/chapter-routes';
import {HandbookPage,handbook} from '../../../../src/components/HandbookPage';
import {brandTitle} from '../../../../src/design/brand';
export const dynamic='force-static';
export const revalidate=false;
export async function generateMetadata({params}:{params:Promise<{number:string}>}){const {number}=await params;const chapter=handbook.chapters.find(c=>c.id===`ch-${number}`);return {title:chapter?`${chapter.title} · ${brandTitle}`:brandTitle};}
// A live chapter (P5-02b) or page (P2-05b) has moved: its old address is not built; Vercel answers 308, other servers get the redirect below.
export function generateStaticParams(){return Array.from({length:22},(_,i)=>({number:String(i+1).padStart(2,'0')})).filter(({number})=>!liveChapter(`ch-${number}`)&&!movedPage(`ch-${number}`));}
export default async function ChapterPage({params}:{params:Promise<{number:string}>}){const {number}=await params;if(number==='23')redirect(pageHref('ch-23'));if(!/^(0[1-9]|1\d|2[0-2])$/.test(number))notFound();const live=liveChapter(`ch-${number}`)??movedPage(`ch-${number}`);if(live)permanentRedirect(live.new);return <HandbookPage id={`ch-${number}`}/>;}
