import {HandbookPage} from '../../../../src/components/HandbookPage';
import {brandTitle} from '../../../../src/design/brand';
export const dynamic='force-static';
export const revalidate=false;
// The introduction (ch-00) in «Начать» (P4-01): «/» is Главная; old /#ch-00-… links come here through the anchor registry.
export const metadata={title:`Как читать руководство · ${brandTitle}`};
export default function HowToRead(){return <HandbookPage id="ch-00"/>;}
