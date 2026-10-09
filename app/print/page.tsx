import Link from 'next/link';
import {BrandSignature} from '../../src/components/BrandSignature';
import {handbook} from '../../src/components/HandbookPage';
import {InteractivePanel} from '../../src/components/InteractivePanel';
import {brandTitle} from '../../src/design/brand';
export const metadata={title:`Для печати · ${brandTitle}`};
export default function Print(){const expanded=handbook.html.replace(/<details\b/g,'<details open');return <main id="reader" className="print-reader"><BrandSignature/><p className="print-note">Полный handbook для печати. Используйте печать браузера. <Link href="/">Вернуться к чтению</Link></p><div className="reader-prose" dangerouslySetInnerHTML={{__html:expanded}}/>{handbook.panels.map(panel=><InteractivePanel key={panel.id} panel={panel}/>)}</main>;}
