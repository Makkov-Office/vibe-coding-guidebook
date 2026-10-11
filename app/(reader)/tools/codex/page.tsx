import {HandbookPage} from '../../../../src/components/HandbookPage';
import {brandTitle} from '../../../../src/design/brand';
export const dynamic='force-static';
export const revalidate=false;
export const metadata={title:`Codex · ${brandTitle}`};
export default function Codex(){return <HandbookPage id="ch-codex"/>;}
