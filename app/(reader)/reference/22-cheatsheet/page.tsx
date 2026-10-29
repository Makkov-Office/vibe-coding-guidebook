import {HandbookPage,handbook} from '../../../../src/components/HandbookPage';
import {brandTitle} from '../../../../src/design/brand';
export const dynamic='force-static';
export const revalidate=false;
export const metadata={title:`${handbook.chapters.find(c=>c.id==='ch-22')!.title} · ${brandTitle}`};
export default function CheatSheet(){return <HandbookPage id="ch-22"/>;}
