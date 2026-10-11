import {
  IconArrowRight, IconArrowLeft, IconArrowUp, IconArrowDown, IconArrowUpRight,
  IconChevronRight, IconChevronDown, IconSearch, IconMenu2, IconX, IconBook2, IconDownload,
  IconRotateClockwise, IconCompass, IconTopologyStar3, IconRobot,
  IconTerminal2, IconUsers, IconChecklist, IconRoute, IconPlaneDeparture,
  IconBrain, IconFileText, IconGitBranch, IconAlertTriangle, IconGitMerge,
  IconEyeCheck, IconUserCheck, IconRefresh, IconShieldLock, IconFlask,
  IconFirstAidKit, IconSettings, IconChartBar, IconNotes, IconVocabulary,
  IconBooks, IconTimeline, IconTags, IconCheck, IconCopy, IconMap,
} from '@tabler/icons-react';

// All interface icons share one optical size and stroke; no per-instance overrides.
export const iconProps={size:20,stroke:1.75,'aria-hidden':true,focusable:false,className:'project-icon'};
export const icons={
  arrowRight:IconArrowRight,arrowLeft:IconArrowLeft,arrowUp:IconArrowUp,
  arrowDown:IconArrowDown,arrowUpRight:IconArrowUpRight,chevronRight:IconChevronRight,chevronDown:IconChevronDown,
  search:IconSearch,menu:IconMenu2,close:IconX,book:IconBook2,download:IconDownload,
  reset:IconRotateClockwise,compass:IconCompass,architecture:IconTopologyStar3,
  robot:IconRobot,terminal:IconTerminal2,users:IconUsers,checklist:IconChecklist,
  lifecycle:IconRoute,preflight:IconPlaneDeparture,context:IconBrain,docs:IconFileText,
  git:IconGitBranch,risk:IconAlertTriangle,collisions:IconGitMerge,review:IconEyeCheck,
  gates:IconUserCheck,sync:IconRefresh,security:IconShieldLock,cases:IconFlask,
  recovery:IconFirstAidKit,setup:IconSettings,maturity:IconChartBar,notes:IconNotes,
  glossary:IconVocabulary,sources:IconBooks,timeline:IconTimeline,tags:IconTags,
  check:IconCheck,copy:IconCopy,map:IconMap,
};
export const chapterIcons={
  'ch-00':'compass','ch-01':'compass','ch-02':'architecture','ch-03':'robot',
  'ch-04':'terminal','ch-05':'users','ch-06':'checklist','ch-07':'lifecycle',
  'ch-08':'preflight','ch-09':'context','ch-10':'docs','ch-11':'git','ch-12':'risk',
  'ch-13':'collisions','ch-14':'review','ch-15':'gates','ch-16':'sync',
  'ch-17':'security','ch-18':'cases','ch-19':'recovery','ch-20':'setup',
  'ch-21':'maturity','ch-22':'notes','ch-23':'glossary','ch-24':'sources','ch-resources':'sources','ch-tools':'setup','ch-codex':'terminal','ch-claude-code':'context',
};
