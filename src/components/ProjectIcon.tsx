import {icons,iconProps,chapterIcons} from '../design/icons.mjs';
export function ProjectIcon({name}:{name:keyof typeof icons}){
  const Icon=icons[name];
  return <Icon {...iconProps}/>;
}
export function ChapterIcon({id}:{id:string}){
  return <ProjectIcon name={(chapterIcons[id as keyof typeof chapterIcons]??'book') as keyof typeof icons}/>;
}
