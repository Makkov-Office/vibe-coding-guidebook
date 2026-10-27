import {Reader} from '../../src/components/Reader';
import generated from '../../src/content/generated.json';
import assets from '../../src/content/reader-assets.json';
export default function ReaderLayout({children}:{children:React.ReactNode}){const chapters=generated.chapters.map(({id,number,title,href})=>({id,number,title,path:href}));return <Reader chapters={chapters} assets={assets}>{children}</Reader>;}
