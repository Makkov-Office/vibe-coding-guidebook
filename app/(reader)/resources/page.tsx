import {HandbookPage} from '../../../src/components/HandbookPage';
import {brandTitle} from '../../../src/design/brand';
export const dynamic='force-static';
export const revalidate=false;
export const metadata={title:`Полезные материалы · ${brandTitle}`};
export default function Resources(){return <HandbookPage id="ch-resources"/>;}
