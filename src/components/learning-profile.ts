export type LearningMarks={completed:string[];exercises:string[]};
export const learningGroups=[
 {name:'Основы',start:1,end:5,icon:'compass'},
 {name:'Рабочий процесс',start:6,end:11,icon:'lifecycle'},
 {name:'Качество и доставка',start:12,end:17,icon:'review'},
 {name:'Практика',start:18,end:22,icon:'setup'},
] as const;
export const learningLevels=[
 {name:'Исследователь',xp:0},
 {name:'Практик',xp:500},
 {name:'Оркестратор',xp:1100},
 {name:'Инженер',xp:1700},
] as const;
export const maxLearningXp=2450;
export function normalizeMarks(value:Partial<LearningMarks>|null|undefined):LearningMarks{
 return {completed:[...new Set((Array.isArray(value?.completed)?value.completed:[]).filter(id=>typeof id==='string'&&/^ch-(0[1-9]|1\d|2[0-2])$/.test(id)))],exercises:[...new Set((Array.isArray(value?.exercises)?value.exercises:[]).filter(id=>typeof id==='string'&&/^exercise-[1-5]$/.test(id)))]};
}
export function learningProfile(value:LearningMarks){
 const marks=normalizeMarks(value),xp=marks.completed.length*100+marks.exercises.length*50;
 const levelIndex=learningLevels.findLastIndex(level=>xp>=level.xp),level=learningLevels[levelIndex],nextLevel=learningLevels[levelIndex+1];
 const nextChapter=Array.from({length:22},(_,i)=>`ch-${String(i+1).padStart(2,'0')}`).find(id=>!marks.completed.includes(id));
 return {marks,xp,levelIndex,level,nextLevel,nextChapter,levelProgress:xp-level.xp,levelTotal:(nextLevel?.xp??maxLearningXp)-level.xp};
}
