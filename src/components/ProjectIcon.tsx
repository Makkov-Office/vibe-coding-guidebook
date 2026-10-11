import {icons,iconProps,chapterIcons} from '../design/icons.mjs';
import {ProductMark} from './ProductMark';
export function ProjectIcon({name}:{name:keyof typeof icons}){
  const Icon=icons[name];
  return <Icon {...iconProps}/>;
}
export function ChapterIcon({id}:{id:string}){
  if(id==='ch-codex'||id==='ch-claude-code')return <ProductMark id={id==='ch-codex'?'codex':'claude'}/>;
  return <ProjectIcon name={(chapterIcons[id as keyof typeof chapterIcons]??'book') as keyof typeof icons}/>;
}
