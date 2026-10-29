import {HandbookPage} from '../../../../src/components/HandbookPage';
import {brandTitle} from '../../../../src/design/brand';
export const dynamic='force-static';
export const revalidate=false;
export const metadata={title:`Глоссарий · ${brandTitle}`};
export default function Glossary(){return <HandbookPage id="ch-23"/>;}
