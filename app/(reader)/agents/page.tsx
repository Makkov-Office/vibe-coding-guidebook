import {AgentsPage} from '../../../src/components/AgentsPage';
import {brandTitle} from '../../../src/design/brand';
export const dynamic='force-static';
export const revalidate=false;
export const metadata={title:`Agent Pack · ${brandTitle}`};
export default function Agents(){return <AgentsPage/>;}
