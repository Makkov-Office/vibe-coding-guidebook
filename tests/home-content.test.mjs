// P4-01: тексты главной — content/home.md, разбор parseHome (src/content/compiler.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseHome } from '../src/content/compiler.mjs';
import { loadUrlMap, mappedPaths } from '../scripts/url-map.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = fs.readFileSync(`${root}content/home.md`, 'utf8');
const urlMap = loadUrlMap(root);
const rail = urlMap.sections.filter(section => section.rail && section.id !== 'home').map(section => section.label);
const generated = JSON.parse(fs.readFileSync(`${root}src/content/generated.json`, 'utf8'));
const broken = (from, to) => { assert.ok(source.includes(from), from); return source.replace(from, to); };

test('content/home.md compiles into generated.home', () => {
  const home = parseHome(source, rail);
  assert.deepEqual(generated.home, home);
  assert.equal(home.title, 'Mastering Agentic Engineering');
  assert.equal(home.subtitle, 'Полный цикл разработки с AI-агентами — от вайбкодинга до top-tier SDLC.');
  assert.deepEqual(home.actions.map(action => action.label), ['Начать изучение', 'Определить уровень']);
  assert.equal(home.path.steps.length, 8);
  assert.deepEqual(home.sections.cards.map(card => card.label), rail);
});

test('every link of Главная is a page the map knows or a published file', () => {
  const home = parseHome(source, rail);
  const known = mappedPaths(urlMap);
  const links = [...home.actions, ...home.next.items.filter(item => item.href), ...home.footer.groups.flatMap(group => group.links)];
  for (const { href } of links) assert.ok(known.has(href) || href === '/print' || fs.existsSync(`${root}public${href}`), href);
});

test('a broken home.md fails with the rule', () => {
  const cases = [
    [broken('## Разделы', '## Карточки'), /sections must be exactly/],
    [broken('- Контроль: Риск, параллельная работа и проверка\n', ''), /rail sections in order/],
    [broken('- Deploy: production\n', ''), /8 steps/],
    [broken('(/chapters/21)\n\n## Путь', '(https://example.com)\n\n## Путь'), /must be a site path/],
    [broken('Путь одной задачи', '<b>Путь</b> одной задачи'), /raw HTML/],
    [broken('- Founder: ставит цель', '- Founder ставит цель'), /is not «Название: текст»/],
    [broken('## Продолжить\n', '## Продолжить\n\n**Важно.**\n'), /only plain text and links|one paragraph/],
  ];
  for (const [text, message] of cases) assert.throws(() => parseHome(text, rail), message);
});
