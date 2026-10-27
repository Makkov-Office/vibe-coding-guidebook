import type {Metadata} from 'next';
import {DesignShowcase} from '../../src/design/DesignShowcase';
import {brandTitle} from '../../src/design/brand';
import '../../src/design/showcase.css';

export const dynamic='force-static';
export const revalidate=false;
// Служебная витрина P2-04: не индексируется и не попадает в навигацию.
export const metadata:Metadata={title:`Витрина «Чертёж» · ${brandTitle}`,robots:{index:false,follow:false}};

export default function DesignPage(){return <DesignShowcase/>;}
