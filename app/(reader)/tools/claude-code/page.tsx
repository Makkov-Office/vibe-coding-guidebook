import {HandbookPage} from '../../../../src/components/HandbookPage';
import {brandTitle} from '../../../../src/design/brand';
export const dynamic='force-static';
export const revalidate=false;
export const metadata={title:`Claude Code · ${brandTitle}`};
export default function ClaudeCode(){return <HandbookPage id="ch-claude-code"/>;}
