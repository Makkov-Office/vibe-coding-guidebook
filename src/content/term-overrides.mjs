// Additional Russian inflections; definitions stay in content/handbook.md.
export const inflections = {
  'term-agent': ['агенты','агенту','агенте'], 'term-repository':['репозиторию','репозиториев','репозиториях'],
  'term-ticket':['тикета','тикету','тикеты','тикетов','тикетами'], 'term-commit':['коммиту','коммитами'],
  'term-branch':['ветками'], 'term-source-truth':['источников истины','источником истины'],
};
// Explicit per-block/per-occurrence mappings are applied before contextual rules.
export const occurrenceOverrides = {
  'ch-02-b007:1:enforced':'term-enforcement',
  'ch-10-b006:20:enforced':'term-enforcement',
  'ch-14-b011:0:BLOCKER':'term-severity',
  'ch-21-b003:1:Enforced':'term-maturity',
  'ch-22-b007:0:BLOCKER':'term-severity',
  'maturity-label-4:1:Enforced':'term-maturity',
};
export const contextualTokens={
  'ch-08-b007':{index:'term-docs-index'},
  'ch-10-b007':{index:'term-docs-index'},
  'ch-13-b005':{index:'term-docs-index'},
  'ch-19-b010':{tokens:'term-token'},
};
export function resolveContext(candidates, text, context, value) {
  const ids = candidates.map(t => t.id);
  const pick = id => candidates.find(t => t.id === id);
  if (ids.includes('term-risk') && ids.includes('term-severity')) return pick(value === value.toUpperCase() ? 'term-severity' : 'term-risk');
  if (ids.includes('term-interface') && ids.includes('term-ui-ux')) return pick(/UI|UX|интерфейс|читател|сайт|кнопк/.test(text) || context.chapter === 'ch-00' ? 'term-ui-ux' : 'term-interface');
  return null;
}
