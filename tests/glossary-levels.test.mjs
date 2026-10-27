// P6-07: level of each glossary term (content/glossary-levels.json) and the collapsed basic Git terms.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { compileHandbook, LEVELS } from '../src/content/compiler.mjs';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const source = read('content/handbook.md');
const levels = JSON.parse(read('content/glossary-levels.json'));
const generated = JSON.parse(read('src/content/generated.json'));
let compiled, plain;
const data = async () => compiled ??= await compileHandbook(source, { glossaryLevels: levels });
const without = async () => plain ??= await compileHandbook(source);
const glossary = result => result.chapters.find(chapter => chapter.id === 'ch-23').html;
const cards = html => Object.fromEntries([...html.matchAll(/<article id="([^"]+)"[\s\S]*?<\/article>/g)].map(([card, id]) => [id, card]));
const copy = () => structuredClone(levels);

test('every term has exactly one level, and generated.json carries it', async () => {
  const { terms, levels: names } = await data();
  assert.equal(terms.length, 394);
  for (const term of terms) assert.ok(LEVELS.includes(term.level), term.id);
  assert.deepEqual(names, { basic: 'Базовое', professional: 'Профессиональное' });
  const listed = Object.values(levels.terms).flatMap(lists => [...lists.basic, ...lists.professional]);
  assert.equal(listed.length, new Set(listed).size);
  assert.deepEqual(new Set(listed), new Set(terms.map(term => term.id)));
  // The committed build is the one this file produces.
  assert.deepEqual(generated.terms.map(term => [term.id, term.level]), terms.map(term => [term.id, term.level]));
  assert.deepEqual(generated.levels, names);
});

test('levels change no definition, alias, anchor or search entry', async () => {
  const leveled = await data(), base = await without();
  assert.deepEqual(leveled.terms.map(term => Object.fromEntries(Object.entries(term).filter(([key]) => key !== 'level'))), base.terms);
  assert.deepEqual(leveled.search, base.search);
  assert.deepEqual(Object.keys(leveled.anchors).sort(), Object.keys(base.anchors).sort());
  assert.equal(base.levels, null);
  assert.ok(base.terms.every(term => !('level' in term)));
  const before = cards(glossary(base)), after = cards(glossary(leveled));
  assert.deepEqual(Object.keys(after).sort(), Object.keys(before).sort());
  // A level adds data-level and the visible level label (P6-07b), nothing else.
  for (const [id, card] of Object.entries(after)) assert.equal(card.replace(/ data-level="(basic|professional)"/, '').replace(/<p class="term-meta"><span class="term-level" data-level="(basic|professional)"><span class="sr-only">Уровень: <\/span>[^<]+<\/span><\/p>/, ''), before[id], id);
  for (const term of leveled.terms) {
    assert.match(after[term.id], new RegExp(`data-level="${term.level}"`));
    assert.ok(after[term.id].includes(`<span class="term-level" data-level="${term.level}"><span class="sr-only">Уровень: </span>${leveled.levels[term.level]}</span>`), term.id);
  }
  // Every other chapter is unchanged.
  assert.deepEqual(leveled.chapters.filter(c => c.id !== 'ch-23'), base.chapters.filter(c => c.id !== 'ch-23'));
  assert.doesNotMatch(glossary(base), /glossary-basics/);
});

test('basic Git terms sit in one closed group at the end of their topic', async () => {
  const { terms } = await data();
  const html = glossary(await data());
  const groups = [...html.matchAll(/<details class="glossary-basics" data-level="basic">([\s\S]*?)<\/details>/g)];
  assert.equal(groups.length, 1);
  const git = terms.filter(term => term.topic.startsWith('23.3.'));
  const basic = git.filter(term => term.level === 'basic').map(term => term.id);
  assert.ok(basic.length > 0 && basic.length < git.length);
  assert.match(groups[0][1], /<summary>.*Базовые термины Git<\/summary>/);
  assert.deepEqual(Object.keys(cards(groups[0][1])), basic);
  // Professional Git terms stay open, before the group, in source order.
  const topic = html.slice(html.indexOf('23.3. Git'), groups[0].index);
  const open = git.filter(term => term.level === 'professional').map(term => term.id);
  assert.deepEqual(Object.keys(cards(topic)), open);
  // Other topics are not collapsed.
  assert.doesNotMatch(html.slice(groups[0].index + groups[0][0].length), /<details class="glossary-basics"/);
});

test('fail closed: the build stops on a missing, repeated, unknown or misplaced term', async () => {
  const cases = [
    ['missing', value => { value.terms['23.1'].professional = value.terms['23.1'].professional.filter(id => id !== 'term-harness'); }, /no level for term-harness/],
    ['twice', value => { value.terms['23.1'].basic.push('term-harness'); }, /term-harness is listed twice/],
    ['unknown', value => { value.terms['23.1'].basic.push('term-nope'); }, /unknown term term-nope/],
    ['wrong topic', value => { value.terms['23.1'].professional = value.terms['23.1'].professional.filter(id => id !== 'term-harness'); value.terms['23.2'].basic.push('term-harness'); }, /term-harness belongs to 23\.1, not 23\.2/],
    ['unknown topic', value => { value.terms['23.99'] = { basic: [] }; }, /unknown topic 23\.99/],
    ['unknown level', value => { value.terms['23.1'].expert = []; }, /only basic, professional lists/],
    ['not a list', value => { value.terms['23.1'].basic = 'term-ai'; }, /expected a list of term ids/],
    ['no label', value => { delete value.levels.basic; }, /levels\.basic needs a label/],
    ['collapsed topic', value => { value.collapsed['23.42'] = 'Нет такой темы'; }, /collapsed: unknown topic 23\.42/],
    ['empty summary', value => { value.collapsed['23.3'] = ' '; }, /collapsed\.23\.3 needs a summary/],
    ['shape', () => null, /expected \{levels, collapsed, terms\}/],
    ['null', () => 'null', /expected \{levels, collapsed, terms\}/],
    ['false', () => 'false', /expected \{levels, collapsed, terms\}/],
  ];
  for (const [name, change, error] of cases) {
    const value = copy(), changed = change(value);
    // null and false are valid JSON in the file: they must fail too, not compile without levels.
    const supplied = changed === null ? 'broken' : changed === 'null' ? null : changed === 'false' ? false : value;
    await assert.rejects(() => compileHandbook(source, { glossaryLevels: supplied }), error, name);
  }
});

test('the note on the source format stays in the Markdown, hidden on the page and from search (P6-07b)', async () => {
  const { search } = await data(), html = glossary(await data());
  assert.ok(source.includes('**Служебный формат для сайта:**'));
  assert.match(html, /<p id="ch-23-[^"]+" hidden class="glossary-service-note"><strong>Служебный формат для сайта:<\/strong>/);
  assert.equal(html.match(/Служебный формат/g).length, 1);
  assert.ok(!search.some(entry => entry.text.includes('Служебный формат')));
});
