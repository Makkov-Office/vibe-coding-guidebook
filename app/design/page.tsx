import type {Metadata} from 'next';
import {DesignShowcase} from '../../src/design/DesignShowcase';
import {brandTitle} from '../../src/design/brand';
import '../../src/design/showcase.css';

export const dynamic='force-static';
export const revalidate=false;
// Internal P2-04 showcase: not indexed and not in the navigation.
export const metadata:Metadata={title:`Витрина «Чертёж» · ${brandTitle}`,robots:{index:false,follow:false}};

export default function DesignPage(){return <DesignShowcase/>;}
