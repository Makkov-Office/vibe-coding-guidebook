export function createPanels({tables,rich}) {
  const panel=(id,chapter,title,label,rows)=>({id,chapter,title,label,choices:rows.map((row,i)=>({id:`${id}-${i}`,label:row[0],titleHtml:rich(row[0],`${id}-label-${i}`,chapter).replace(/^<p>|<\/p>$/g,''),html:rich(row.slice(1).join(' · '),`${id}-${i}`,chapter)}))});
  const architecture=[
    ['Founder','Цель и consequential decisions. Разрешает значимые действия; PR approval не заменяет merge authorization.'],
    ['Linear','Product HQ, roadmap, ticket и lifecycle. Фраза агента не изменяет состояние issue.'],
    ['Repository knowledge','AGENTS.md, architecture, ADR и contracts. Исторический snapshot не заменяет fresh main.'],
    ['Harness','Контекст, правила, preflight, validation. Недоступный diff делает assessment INCOMPLETE.'],
    ['Agents','Bounded execution. Один primary author на ticket; independent reviewer проверяет assumptions отдельно.'],
    ['Worktree','Изолированные рабочие files и Git index; общие refs и objects. Не изолирует semantic dependencies.'],
    ['GitHub / CI','PR, diff и checks на конкретном HEAD. Green CI не доказывает весь Scope и не разрешает merge.'],
    ['Reviewer','Findings и verdict по актуальному HEAD. Новый push требует relevant re-review.'],
    ['Merge','Founder authorization и confirmed merge. После подтверждения ticket становится Done.'],
    ['Deployment','Deployment record подтверждает развёрнутую версию. Merge и Done не доказывают deployment.'],
  ];
  const panels=[panel('architecture','ch-02','Карта системы','Выберите узел: роль, полномочия и предотвращаемая ошибка',architecture),
    panel('lifecycle','ch-07','Путь задачи DEMO-42','Учебная симуляция',tables['ch-07'][0].slice(1).map((row,i)=>[
      ['Backlog','Todo','In Progress','In Review','Done','Post-merge sync'][i],
      `Ответственный: ${row[1]}. Условие входа: ${['Планирование задачи','DoR принят','Preflight PASS','PR передан reviewer','Confirmed merge','Merge подтверждён, delivery ещё проверяется'][i]}. Условие выхода: ${i===3?'Findings исправлены, review нового HEAD, founder authorization и confirmed merge':i===4?'Post-merge sync проверен отдельно':row[2]}. Обязательное evidence: ${row[3]}. Следующее действие: ${['Todo после DoR','In Progress после Preflight PASS','In Review после PR handoff','Fix + новый HEAD review; остаться In Review до confirmed merge','Post-merge sync с защитой local data','Проверить delivery и deployment отдельно'][i]}.`,
      ['DoR не принят: остаться Backlog.','Preflight INCOMPLETE: не начинать substantive edits.','PR handoff не подтверждён: статус не изменяется от фразы автора.','Findings требуют fixes и review нового HEAD; merge требует founder authorization.','Done только после confirmed merge. Не доказывает deployment или sync.','Dirty checkout / ignored-file collision: сохранить данные, остановить sync.'][i]
    ])),
    panel('collisions','ch-13','Четыре вида пересечений','Учебное сравнение',tables['ch-13'][0].slice(1)),
    panel('maturity','ch-21','Ступени зрелости','Диагностическая модель, без live score',tables['ch-21'][0].slice(1))];
  const targets=['ch-15','ch-06','ch-09','ch-03','ch-05','ch-11','ch-11','ch-14','ch-15','ch-16'];
  panels[0].choices.forEach((c,i)=>{c.chapter=targets[i];});
  panels[1].scenarios=[
    {id:'happy',label:'Happy path',html:rich('DoR → Preflight PASS → author PR → independent review → founder authorization → confirmed merge → Done. Post-merge sync и deployment проверяются отдельно.','scenario-happy','ch-07')},
    {id:'findings',label:'Review findings',html:rich('CHANGES REQUIRED: тикет остаётся In Review. Fix findings → новый HEAD → revalidation → independent re-review. READY TO MERGE — technical verdict, не Linear state и не permission.','scenario-findings','ch-07')},
    {id:'unavailable',label:'Unavailable evidence',html:rich('Недоступный diff: preflight / collision assessment INCOMPLETE. Unknown не является isolated. Следующее действие — получить evidence; до этого зависимый переход остановлен.','scenario-unavailable','ch-07')}
  ];
  return panels;
}
