// Линтер палитры (P2-04): текущее дерево чистое, фикстуры с чужими цветами ловятся, fail closed.
import test from 'node:test';
import assert from 'node:assert/strict';
import { ALLOWED, findColors, lint, listFiles } from '../scripts/palette-lint.mjs';

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
  assert.deepEqual(found, ['foreign.css:#ff0000', 'foreign.css:rgb(', 'foreign.css:border-color:red', 'foreign.svg:fill="white', 'foreign.tsx:#123456']);
});

test('allowed files are explicit and really carry literals', () => {
  for (const [file, reason] of Object.entries(ALLOWED)) {
    assert.ok(reason.length > 10, file);
    assert.ok(listFiles().includes(file), `${file} is listed but missing`);
  }
  assert.ok(findColors('<path fill="#5e6ad2"/>', 'x.svg').length === 1);
  assert.throws(() => lint([]), /no files/);
  assert.throws(() => listFiles('/nonexistent'), /missing/);
});
