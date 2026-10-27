// P7-01: ProgressStore and the v1 → v2 migration of reader progress.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createProgressStore, migrateLegacy, normalizeProgress, PROGRESS_KEY, PROGRESS_VERSION, LEGACY_KEYS, TABS } from '../src/components/progress-store.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const fixture = JSON.parse(fs.readFileSync(`${root}tests/fixtures/progress-v1-main.json`, 'utf8'));
const urlMap = JSON.parse(fs.readFileSync(`${root}src/content/url-map.json`, 'utf8'));
const xp = progress => progress.completed.length * 100 + progress.exercises.length * 50;

// localStorage double: a Map, with a write log and optional refusals.
function memory(entries = {}, { refuse = [] } = {}) {
  const data = new Map(Object.entries(entries)), writes = [];
  const deny = name => { if (refuse.includes(name)) throw Error('denied'); };
  return {
    data, writes,
    storage: () => ({
      getItem: key => { deny('getItem'); return data.has(key) ? data.get(key) : null; },
      setItem: (key, value) => { deny('setItem'); writes.push(key); data.set(key, String(value)); },
      keys: () => { deny('keys'); return [...data.keys()]; },
    }),
  };
}

test('a real v1 session migrates to the same XP, chapters, exercises, checklists and position', () => {
  const store = memory(fixture.storage);
  const progress = createProgressStore(store.storage).get();
  assert.deepEqual(progress.completed.sort(), ['ch-01', 'ch-02', 'ch-08']);
  assert.deepEqual(progress.exercises.sort(), ['exercise-1', 'exercise-3']);
  assert.equal(xp(progress), fixture.shown.xp);
  assert.deepEqual(progress.practice, { 'exercise-1': true, 'exercise-3': true, 'ch-22-b003-15': true });
  assert.deepEqual(progress.reading, { page: 'ch-08', y: 960 });
  // The record is written once; the v1 keys stay for a rollback.
  assert.deepEqual(store.writes, [PROGRESS_KEY]);
  assert.deepEqual(JSON.parse(store.data.get(PROGRESS_KEY)), progress);
  assert.equal(progress.version, PROGRESS_VERSION);
  for (const [key, value] of Object.entries(fixture.storage)) assert.equal(store.data.get(key), value, key);
});

test('the migration runs once: a second load reads the record and writes nothing', () => {
  const store = memory(fixture.storage);
  const first = createProgressStore(store.storage).get();
  const writes = store.writes.length;
  const second = createProgressStore(store.storage).get();
  assert.deepEqual(second, first);
  assert.equal(store.writes.length, writes);
  // v1 keys changed after the migration (an old tab still open) do not override v2.
  store.data.set(LEGACY_KEYS.learning, JSON.stringify({ completed: ['ch-05'], exercises: [] }));
  assert.deepEqual(createProgressStore(store.storage).get().completed, first.completed);
  // Migrating the already migrated data again gives the same record.
  assert.deepEqual(migrateLegacy(key => fixture.storage[key] ?? null, Object.keys(fixture.storage)).progress, first);
  assert.deepEqual(normalizeProgress(first), first);
});

test('damaged data does not throw; the readable parts are kept', () => {
  const store = memory({ ...fixture.storage, [LEGACY_KEYS.learning]: '{"completed":["ch-01"', [LEGACY_KEYS.reading]: '[]' });
  const progressStore = createProgressStore(store.storage);
  const progress = progressStore.get();
  assert.equal(progressStore.damaged(), true);
  assert.deepEqual(progress.completed, []);
  assert.equal(progress.reading, null);
  assert.equal(progress.practice['ch-22-b003-15'], true);
  // A damaged v2 record falls back to the v1 keys.
  const broken = memory({ ...fixture.storage, [PROGRESS_KEY]: '{oops' });
  const recovered = createProgressStore(broken.storage);
  assert.equal(xp(recovered.get()), fixture.shown.xp);
  assert.equal(recovered.damaged(), true);
  // Wrong types and unknown ids are dropped, not stored.
  assert.deepEqual(normalizeProgress({ version: 2, completed: ['ch-01', 'ch-01', 'ch-23', 7, '/chapters/02'], exercises: ['exercise-9', 'exercise-2'], practice: { 'ch-22-b003-15': true, 'x y': true, 'ch-22-b003-16': '1' }, reading: { page: 'ch-08', tab: 'nope', y: -5 } }),
    { version: 2, completed: ['ch-01'], exercises: ['exercise-2'], practice: { 'ch-22-b003-15': true }, reading: { page: 'ch-08', y: 0 } });
  for (const value of [null, 'text', 42, [], { version: 2, reading: 'ch-08' }]) assert.doesNotThrow(() => normalizeProgress(value));
});

test('the oldest position format reopens its chapter at the top', () => {
  const { progress } = migrateLegacy(key => ({ [LEGACY_KEYS.position]: JSON.stringify({ id: 'ch-23', y: 300 }) })[key] ?? null, [LEGACY_KEYS.position]);
  assert.deepEqual(progress.reading, { page: 'ch-23', y: 0 });
  const fromPath = migrateLegacy(key => ({ [LEGACY_KEYS.reading]: JSON.stringify({ path: '/chapters/12', y: 40 }) })[key] ?? null, []);
  assert.deepEqual(fromPath.progress.reading, { page: 'ch-12', y: 40 });
});

test('without storage the store works in memory and says so', () => {
  for (const refuse of [['getItem', 'setItem', 'keys'], ['setItem']]) {
    const store = memory(fixture.storage, { refuse });
    const progressStore = createProgressStore(store.storage);
    const seen = [];
    progressStore.subscribe((progress, meta) => seen.push([progress.completed.length, meta?.reward]));
    assert.doesNotThrow(() => progressStore.get());
    assert.equal(progressStore.set(({ completed }) => ({ completed: [...completed, 'ch-03'] }), { reward: 100 }), false);
    assert.ok(progressStore.get().completed.includes('ch-03'));
    assert.equal(progressStore.unavailable(), true);
    assert.equal(seen.length, 1);
    assert.equal(seen[0][1], 100);
    assert.equal(store.data.get(PROGRESS_KEY), undefined);
  }
  const absent = createProgressStore(() => null);
  assert.deepEqual(absent.get().completed, []);
  assert.equal(absent.unavailable(), true);
});

test('set keeps the other fields and notifies; unsubscribe stops it', () => {
  const store = memory();
  const progressStore = createProgressStore(store.storage);
  let calls = 0;
  const off = progressStore.subscribe(() => calls++);
  assert.equal(progressStore.set(() => ({ completed: ['ch-01'] })), true);
  progressStore.set(() => ({ reading: { page: 'ch-01', tab: 'apply', y: 12.6 } }));
  off();
  progressStore.set(({ practice }) => ({ practice: { ...practice, 'ch-22-b003-15': true } }));
  assert.equal(calls, 2);
  assert.deepEqual(JSON.parse(store.data.get(PROGRESS_KEY)), { version: 2, completed: ['ch-01'], exercises: [], practice: { 'ch-22-b003-15': true }, reading: { page: 'ch-01', tab: 'apply', y: 13 } });
});

test('page and tab ids are the stable ids of the url map', () => {
  assert.deepEqual(TABS, urlMap.tabs.map(tab => tab.id));
  const chapters = urlMap.pages.filter(page => /^ch-\d{2}$/.test(page.chapter ?? '') && page.chapter !== 'ch-00').map(page => page.chapter);
  for (const page of chapters) assert.deepEqual(normalizeProgress({ reading: { page, y: 0 } }).reading?.page, page, page);
  assert.deepEqual(chapters.sort(), Array.from({ length: 23 }, (_, i) => `ch-${String(i + 1).padStart(2, '0')}`));
  assert.equal(normalizeProgress({ reading: { page: 'ch-00', y: 0 } }).reading, null);
  assert.equal(normalizeProgress({ reading: { page: '/chapters/08', y: 0 } }).reading, null);
});
