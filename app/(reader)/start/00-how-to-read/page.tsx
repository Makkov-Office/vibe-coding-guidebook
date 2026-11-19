import {HandbookPage} from '../../../../src/components/HandbookPage';
import {brandTitle} from '../../../../src/design/brand';
export const dynamic='force-static';
export const revalidate=false;
// The introduction (ch-00) in "Start" (P4-01): "/" is the home page; old /#ch-00-… links come here through the anchor registry.
export const metadata={title:`Как читать руководство · ${brandTitle}`};
export default function HowToRead(){return <HandbookPage id="ch-00"/>;}
