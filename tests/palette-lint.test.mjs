// Линтер палитры (P2-04): текущее дерево чистое, фикстуры с чужими цветами ловятся, fail closed.
import test from 'node:test';
import assert from 'node:assert/strict';
import { ALLOWED, NAMED_COLORS, findColors, lint, listFiles } from '../scripts/palette-lint.mjs';

test('current tree uses only tokens or allowed files', () => {
  const files = listFiles();
  for (const dir of ['src/', 'app/', 'public/brand/']) assert.ok(files.some((f) => f.startsWith(dir)), dir);
  assert.ok(files.includes('src/design/primitives.css'));
  assert.deepEqual(lint(files), []);
});

test('foreign colours in CSS, SVG and code fail the lint', () => {
  const dir = 'tests/fixtures/palette-lint';
  const problems = lint([`${dir}/foreign.css`, `${dir}/foreign.svg`, `${dir}/foreign.tsx`]);
  const found = problems.map((p) => `${p.file.split('/').pop()}:${p.match}`);
  assert.deepEqual(found, [
    'foreign.css:#ff0000', 'foreign.css:rgb(', 'foreign.css:border-color:red', 'foreign.css:border:darkred', 'foreign.css:box-shadow:black',
    'foreign.css:background:white', 'foreign.css:color:canvas', 'foreign.svg:fill:white', 'foreign.svg:stroke:red',
    'foreign.tsx:#123456', 'foreign.tsx:backgroundColor:white',
  ]);
});

test('allowed files are explicit and really carry literals', () => {
  for (const [file, reason] of Object.entries(ALLOWED)) {
    assert.ok(reason.length > 10, file);
    assert.ok(listFiles().includes(file), `${file} is listed but missing`);
  }
  assert.ok(findColors('<path fill="#5e6ad2"/>', 'x.svg').length === 1);
  // Все 148 именованных цветов CSS Color 4 плюс системные; системные допустимы только в forced-colors.
  assert.equal(NAMED_COLORS.size, 148 + 19);
  assert.deepEqual(findColors('@media (forced-colors:active){a{color:Highlight;fill:red}}', 'x.css').map((h) => h.match), ['fill:red']);
  assert.deepEqual(findColors('a{color:var(--color-x, red);font:600 13px var(--font-text)}', 'x.css').map((h) => h.match), ['color:red']);
  assert.throws(() => lint([]), /no files/);
  assert.throws(() => listFiles('/nonexistent'), /missing/);
});
