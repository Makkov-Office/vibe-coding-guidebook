// P7-03: drills by content/gamification/schema/drill.schema.json, checked by the compiler (fail closed).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { compileDrills, checkSchema } from '../src/content/drills.mjs';

const read = path => JSON.parse(fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const schema = read('content/gamification/schema/drill.schema.json');
const file = 'content/gamification/drills/08-preflight.json';
const drill = read(file);
const generated = read('src/content/generated.json');
const pathOf = id => generated.anchors[id]?.path;
const copy = () => structuredClone(drill);

test('the drill of chapter 08 is valid and the build carries it', () => {
  assert.deepEqual(checkSchema(drill, schema, file), []);
  const [compiled] = compileDrills([{ file, data: drill }], schema, pathOf);
  assert.deepEqual(generated.drills, [compiled]);
  assert.equal(compiled.chapter, 'ch-08');
  assert.ok(compiled.cards.length >= 5 && compiled.cards.length <= 8);
  const tabs = generated.chapters.find(chapter => chapter.id === 'ch-08').tabs;
  for (const card of compiled.cards) {
    assert.ok(card.options.some(option => option.id === card.answer), card.id);
    // The link goes to the tab that holds the paragraph.
    const [path, hash] = card.href.split('#');
    const id = decodeURIComponent(hash);
    const tab = tabs.find(item => item.html.includes(` id="${id}"`));
    assert.ok(tab, `${card.id}: ${id} is in no tab`);
    assert.equal(path, tab.id === 'overview' ? '/flow/08-preflight' : `/flow/08-preflight/${tab.id}`, card.id);
  }
  // Every answer kind of the chapter is trained at least once.
  const answers = new Set(compiled.cards.map(card => card.answer));
  for (const result of ['pass', 'fail', 'blocked', 'incomplete']) assert.ok(answers.has(result), result);
});

test('fail closed: a broken drill stops the build', () => {
  const cases = [
    ['unknown key', d => { d.cards[0].hint = 'x'; }, /unknown key hint/],
    ['answer outside options', d => { d.cards[0].answer = 'maybe'; }, /answer maybe is not an option/],
    ['missing anchor', d => { d.cards[0].anchor = 'ch-08-нет'; }, /missing anchor ch-08-нет/],
    ['anchor of another chapter', d => { d.cards[0].anchor = 'ch-07'; }, /outside ch-08/],
    ['card twice', d => { d.cards[1].id = d.cards[0].id; }, /listed twice/],
    ['option twice', d => { d.cards[0].options[1].id = d.cards[0].options[0].id; }, /option id is repeated/],
    ['too few cards', d => { d.cards = d.cards.slice(0, 4); }, /fewer than 5 items/],
    ['too many options', d => { d.cards[0].options.push({ id: 'e', label: 'E' }); }, /more than 4 items/],
    ['too long', d => { d.cards[0].scenario = 'а'.repeat(401); }, /longer than 400/],
    ['minutes', d => { d.minutes = 10; }, /above 5/],
    ['no title', d => { delete d.title; }, /title is missing/],
    ['wrong type', d => { d.cards[0].difficulty = '2'; }, /expected integer/],
    ['bad chapter', d => { d.chapter = 'ch-23'; }, /does not match/],
  ];
  for (const [name, change, error] of cases) {
    const data = copy();change(data);
    assert.throws(() => compileDrills([{ file, data }], schema, pathOf), error, name);
  }
  assert.throws(() => compileDrills([{ file, data: drill }, { file: 'b.json', data: { ...copy(), id: 'other' } }], schema, pathOf), /already has a drill/);
  assert.throws(() => compileDrills([{ file, data: drill }, { file: 'b.json', data: { ...copy(), chapter: 'ch-09' } }], schema, pathOf), /id preflight-dispatcher is already used/);
  // A keyword the checker does not know is an error, not a silently skipped rule.
  assert.throws(() => compileDrills([{ file, data: drill }], { ...schema, enum: [] }, pathOf), /schema keyword enum is not supported/);
});
