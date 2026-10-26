import {
  IconArrowRight, IconArrowLeft, IconArrowUp, IconArrowDown, IconArrowUpRight,
  IconChevronRight, IconChevronDown, IconSearch, IconMenu2, IconX, IconBook2, IconDownload,
  IconRotateClockwise, IconCompass, IconTopologyStar3, IconRobot,
  IconTerminal2, IconUsers, IconChecklist, IconRoute, IconPlaneDeparture,
  IconBrain, IconFileText, IconGitBranch, IconAlertTriangle, IconGitMerge,
  IconEyeCheck, IconUserCheck, IconRefresh, IconShieldLock, IconFlask,
  IconFirstAidKit, IconSettings, IconChartBar, IconNotes, IconVocabulary,
  IconBooks, IconTimeline, IconTags, IconCheck, IconCopy, IconMap,
  IconWorld, IconCircleDot, IconPalette, IconCloud, IconCalendarClock, IconPhoto,
  IconHome, IconHomeFilled, IconFlag, IconFlagFilled, IconStack2, IconStack2Filled,
  IconShieldCheck, IconShieldCheckFilled, IconLifebuoy, IconLifebuoyFilled, IconTarget, IconTool,
  IconPackage, IconInfoCircle, IconInfoCircleFilled, IconLayoutGrid, IconLayoutGridFilled,
  IconListCheck, IconListCheckFilled, IconChecks, IconSun, IconMoon, IconDeviceDesktop,
  IconPlayerPause, IconPlayerPlay, IconExternalLink, IconLink, IconSparkles, IconBarbell,
  IconProgressCheck, IconBolt, IconTrophy, IconGitPullRequest, IconBrandGithub, IconBrandOpenai,
  IconChevronLeft, IconChevronUp, IconDots, IconCircle, IconMinus, IconGripVertical,
  IconLayoutSidebar, IconCircleCheck, IconLoader2, IconAlertOctagon,
} from '@tabler/icons-react';
import {createElement,forwardRef} from 'react';

// The only module that imports @tabler/icons-react (P2-06). All interface icons share
// one optical size and the «Чертёж» stroke 1.5 px; no per-instance overrides.
export const ICON_STROKE=1.5;
export const iconProps={size:20,stroke:ICON_STROKE,'aria-hidden':true,focusable:false,className:'project-icon'};
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
  check:IconCheck,copy:IconCopy,map:IconMap,world:IconWorld,dots:IconCircleDot,design:IconPalette,cloud:IconCloud,schedule:IconCalendarClock,photo:IconPhoto,
};
export const chapterIcons={
  'ch-00':'compass','ch-01':'compass','ch-02':'architecture','ch-03':'robot',
  'ch-04':'terminal','ch-05':'users','ch-06':'checklist','ch-07':'lifecycle',
  'ch-08':'preflight','ch-09':'context','ch-10':'docs','ch-11':'git','ch-12':'risk',
  'ch-13':'collisions','ch-14':'review','ch-15':'gates','ch-16':'sync',
  'ch-17':'security','ch-18':'cases','ch-19':'recovery','ch-20':'setup',
  'ch-21':'maturity','ch-22':'notes','ch-23':'glossary','ch-24':'sources','ch-resources':'sources','ch-tools':'setup','ch-codex':'terminal','ch-claude-code':'context',
};

// Словарь ролей: 34 смысла интерфейса → иконка Tabler; filled — для активного пункта rail
// (docs/design/visual-language.md, раздел «Иконки»).
export const iconRoles={
  // Rail: 9 разделов.
  home:{group:'rail',icon:IconHome,filled:IconHomeFilled},
  start:{group:'rail',icon:IconFlag,filled:IconFlagFilled},
  foundations:{group:'rail',icon:IconStack2,filled:IconStack2Filled},
  process:{group:'rail',icon:IconRoute},
  control:{group:'rail',icon:IconShieldCheck,filled:IconShieldCheckFilled},
  reliability:{group:'rail',icon:IconLifebuoy,filled:IconLifebuoyFilled},
  practice:{group:'rail',icon:IconTarget},
  tools:{group:'rail',icon:IconTool},
  agentPack:{group:'rail',icon:IconPackage},
  // Табы главы.
  tabOverview:{group:'tabs',icon:IconInfoCircle,filled:IconInfoCircleFilled},
  tabMechanics:{group:'tabs',icon:IconLayoutGrid,filled:IconLayoutGridFilled},
  tabApply:{group:'tabs',icon:IconListCheck,filled:IconListCheckFilled},
  tabCheck:{group:'tabs',icon:IconChecks},
  // Интерфейс.
  search:{group:'ui',icon:IconSearch},
  menu:{group:'ui',icon:IconMenu2},
  close:{group:'ui',icon:IconX},
  themeLight:{group:'ui',icon:IconSun},
  themeDark:{group:'ui',icon:IconMoon},
  themeSystem:{group:'ui',icon:IconDeviceDesktop},
  motionPause:{group:'ui',icon:IconPlayerPause},
  motionPlay:{group:'ui',icon:IconPlayerPlay},
  copy:{group:'ui',icon:IconCopy},
  externalLink:{group:'ui',icon:IconExternalLink},
  anchorLink:{group:'ui',icon:IconLink},
  // Цвета-смыслы.
  agent:{group:'meaning',icon:IconSparkles},
  practiceMeaning:{group:'meaning',icon:IconBarbell},
  human:{group:'meaning',icon:IconUserCheck},
  // Прогресс и игровой слой.
  progress:{group:'game',icon:IconProgressCheck},
  xp:{group:'game',icon:IconBolt},
  level:{group:'game',icon:IconTrophy},
  // Git и разработка.
  branch:{group:'git',icon:IconGitBranch},
  pullRequest:{group:'git',icon:IconGitPullRequest},
  // Логотипы без официального пресс-кита в проекте.
  github:{group:'logo',icon:IconBrandGithub},
  openai:{group:'logo',icon:IconBrandOpenai},
};

// Иконки для компонентов components/ui (раньше — отдельная библиотека Lucide): те же Tabler, тот же контур.
// Контур не переопределяется пропсами; aria-hidden по умолчанию, как было у Lucide (кнопка-иконка получает aria-label сама).
/** @param {import('@tabler/icons-react').Icon} Icon @returns {import('@tabler/icons-react').Icon} */
const ui=(Icon)=>{
  const Wrapped=/** @type {import('@tabler/icons-react').Icon} */(forwardRef((props,ref)=>createElement(Icon,{'aria-hidden':true,...props,stroke:ICON_STROKE,strokeWidth:ICON_STROKE,ref})));
  Wrapped.displayName=Icon.displayName;
  return Wrapped;
};
export const ArrowDownIcon=ui(IconArrowDown);
export const ArrowLeftIcon=ui(IconArrowLeft);
export const ArrowRightIcon=ui(IconArrowRight);
export const CheckIcon=ui(IconCheck);
export const ChevronDownIcon=ui(IconChevronDown);
export const ChevronLeftIcon=ui(IconChevronLeft);
export const ChevronRightIcon=ui(IconChevronRight);
export const ChevronUpIcon=ui(IconChevronUp);
export const CircleCheckIcon=ui(IconCircleCheck);
export const CircleIcon=ui(IconCircle);
export const GripVerticalIcon=ui(IconGripVertical);
export const InfoIcon=ui(IconInfoCircle);
export const LinkIcon=ui(IconLink);
export const Loader2Icon=ui(IconLoader2);
export const MinusIcon=ui(IconMinus);
export const MoreHorizontalIcon=ui(IconDots);
export const OctagonXIcon=ui(IconAlertOctagon);
export const PanelLeftIcon=ui(IconLayoutSidebar);
export const SearchIcon=ui(IconSearch);
export const TriangleAlertIcon=ui(IconAlertTriangle);
export const XIcon=ui(IconX);
