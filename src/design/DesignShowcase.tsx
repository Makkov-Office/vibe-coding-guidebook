'use client';
// Витрина /design (P2-04): все примитивы, цвета-смыслы, шрифты, четыре приёма движения, обе темы.
// Страница служебная: noindex, не в навигации; для контрольной точки founder (неделя 2).
import {useEffect,useRef,useState} from 'react';
import {iconRoles} from './icons.mjs';
import {Annotation,Blueprint,BpArrow,BpLabel,BpNode,BpRunDot,Button,ButtonLink,Card,Chip,GameLabel,Pill,PlusBanner,ProgressDots,RoleIcon,StepLine,type Meaning} from './primitives';

type Theme='system'|'light'|'dark';
const meanings:{meaning:Meaning;name:string;use:string}[]=[
  {meaning:'path',name:'Твой путь',use:'главная кнопка, текущий шаг, прогресс'},
  {meaning:'agent',name:'Агент',use:'что делает или получает агент'},
  {meaning:'practice',name:'Практика',use:'где ты действуешь сам'},
  {meaning:'human',name:'Решает человек',use:'gate, merge, правило MUST'},
];
const fonts=[
  {name:'Unbounded 500',role:'hero и H1',className:'ds-font-display',sample:'Агентная инженерия'},
  {name:'Geist 400 / 600',role:'текст, заголовки, интерфейс',className:'ds-font-text',sample:'Агент делает, практика проверяет, человек решает.'},
  {name:'Martian Mono 400 / 500',role:'код, аннотации, статусы',className:'ds-font-mono',sample:'git switch -c p2-04-visual-grammar'},
  {name:'Pixelify Sans 500',role:'игровые метки',className:'ds-font-game',sample:'XP 120 · LVL 2'},
];
const steps=['Тикет','Preflight','Правки','Evidence','Review'];
// Один непрерывный путь задачи: агент → практика → человек.
const taskPath='M168 60 H 452';

export function DesignShowcase(){
  const [theme,setTheme]=useState<Theme>('system');
  const [motion,setMotion]=useState(true);
  const [run,setRun]=useState(0);
  const [chips,setChips]=useState<string[]>(['Основы']);
  // Витрина меняет html только по нажатию и при уходе возвращает то, что было до неё (выбор пользователя, P3-04).
  const initial=useRef<{theme?:string;motion?:string}>({});
  const setData=(key:'theme'|'motion',value?:string)=>{const data=document.documentElement.dataset;if(value===undefined)delete data[key];else data[key]=value;};
  useEffect(()=>{
    const data=document.documentElement.dataset;initial.current={theme:data.theme,motion:data.motion};
    return()=>{setData('theme',initial.current.theme);setData('motion',initial.current.motion);};
  },[]);
  const chooseTheme=(t:Theme)=>{setTheme(t);setData('theme',t==='system'?undefined:t);};
  const toggleMotion=()=>{const next=!motion;setMotion(next);setData('motion',next?undefined:'off');};
  const toggleChip=(name:string)=>setChips(list=>list.includes(name)?list.filter(x=>x!==name):[...list,name]);

  return <main className="ds" id="design">
    <header className="ds-head">
      <div>
        <p className="ds-eyebrow"><Annotation>P2-04 · витрина</Annotation></p>
        <h1>Визуальная грамматика «Чертёж»</h1>
        <p>Служебная страница: всё, из чего собираются экраны и схемы. Переключи тему и движение, пройди Tab-ом по элементам.</p>
      </div>
      <div className="ds-controls" role="group" aria-label="Тема и движение">
        {(['light','dark','system'] as Theme[]).map(t=><Chip key={t} pressed={theme===t} onClick={()=>chooseTheme(t)}>
          <RoleIcon role={t==='light'?'themeLight':t==='dark'?'themeDark':'themeSystem'}/>{t==='light'?'Светлая':t==='dark'?'Тёмная':'Системная'}
        </Chip>)}
        <Chip pressed={!motion} onClick={toggleMotion}><RoleIcon role={motion?'motionPause':'motionPlay'}/>Пауза анимаций</Chip>
      </div>
    </header>

    <section className="ds-section" aria-labelledby="ds-meanings">
      <h2 id="ds-meanings">Цвета-смыслы</h2>
      <div className="ds-grid">
        {meanings.map(m=><Card key={m.meaning}><Pill meaning={m.meaning}>{m.name}</Pill><p>{m.use}</p></Card>)}
      </div>
    </section>

    <section className="ds-section" aria-labelledby="ds-fonts">
      <h2 id="ds-fonts">Шрифты</h2>
      <div className="ds-stack">
        {fonts.map(f=><Card key={f.name} tone="low"><Annotation>{f.name} · {f.role}</Annotation><p className={f.className}>{f.sample}</p></Card>)}
      </div>
    </section>

    <section className="ds-section" aria-labelledby="ds-actions">
      <h2 id="ds-actions">Кнопки и чипы</h2>
      <div className="ds-row">
        <Button icon="progress">Начать путь</Button>
        <Button variant="tonal">Продолжить главу</Button>
        <Button variant="text" icon="externalLink">Источник</Button>
        <ButtonLink variant="tonal" href="#ds-blueprint">Ссылка-кнопка</ButtonLink>
      </div>
      <div className="ds-row" role="group" aria-label="Фильтр по разделам">
        {['Основы','Процесс','Контроль','Практика'].map(name=><Chip key={name} pressed={chips.includes(name)} onClick={()=>toggleChip(name)}>{name}</Chip>)}
      </div>
    </section>

    <section className="ds-section" aria-labelledby="ds-cards">
      <h2 id="ds-cards">Карточки, метки, прогресс</h2>
      <div className="ds-grid">
        <Card href="#ds-cards"><Pill meaning="practice">Практика</Pill><h3>Проверь себя</h3><p>Карточка-ссылка: тон меняется при наведении, фокус виден.</p></Card>
        <Card><Annotation>аннотация · 12 px</Annotation><h3>Аннотация «чертежа»</h3><p>Моноширинная подпись в пунктирной рамке.</p></Card>
        <Card><GameLabel>XP 120</GameLabel><h3>Игровая метка</h3><p>Pixelify, до трёх слов, никогда в абзацах.</p><ProgressDots total={5} current={2} label="Шаг 3 из 5"/></Card>
      </div>
      <Card><StepLine label="Путь задачи" steps={steps} current={3}/></Card>
    </section>

    <section className="ds-section" aria-labelledby="ds-banner">
      <h2 id="ds-banner">Баннер с паттерном «+»</h2>
      <PlusBanner><Annotation>только hero главной и «Начать»</Annotation><h2>Mastering Agentic Engineering</h2><p>Паттерн бренда 8 px в ячейке 28 px и фирменная рамка 1 px.</p><div className="ds-row"><Button icon="progress">Начать</Button></div></PlusBanner>
    </section>

    <section className="ds-section" aria-labelledby="ds-blueprint">
      <h2 id="ds-blueprint">Шаблон SVG и движение</h2>
      <p className="ds-note">Четыре приёма: появление, прорисовка линии, бег точки, смена шага. При reduced motion и выключенных анимациях всё сразу в итоговом состоянии.</p>
      <div className="ds-row"><Button variant="tonal" icon="motionPlay" onClick={()=>setRun(n=>n+1)}>Повторить движение</Button></div>
      <div key={run} className="ds-stack">
        <Card className="bp-appear">
          <Blueprint viewBox="0 0 620 144" title="Путь задачи: агент делает, практика проверяет, человек решает">
            <BpNode x={20} y={32} meaning="agent" label="Агент" sub="делает правки"/>
            <BpArrow d="M168 60 H 236" draw/>
            <BpNode x={236} y={32} meaning="practice" label="Практика" sub="тесты, evidence"/>
            <BpArrow d="M384 60 H 452" draw/>
            <BpNode x={452} y={32} meaning="human" label="Человек" sub="merge, gate"/>
            <BpArrow d="M526 92 V 108 H 94 V 92" dashed/>
            <BpLabel x={236} y={134}>новый цикл · review</BpLabel>
            <BpRunDot d={taskPath}/>
          </Blueprint>
        </Card>
        <Card><StepLine label="Смена шага" steps={steps} current={4} animate/></Card>
      </div>
    </section>

    <section className="ds-section" aria-labelledby="ds-icons">
      <h2 id="ds-icons">Иконки rail</h2>
      <ul className="ds-icons">
        {(Object.entries(iconRoles) as [keyof typeof iconRoles,(typeof iconRoles)[keyof typeof iconRoles]][]).filter(([,r])=>r.group==='rail').map(([name])=><li key={name}><RoleIcon role={name}/><RoleIcon role={name} filled/><span>{name}</span></li>)}
      </ul>
    </section>
  </main>;
}
