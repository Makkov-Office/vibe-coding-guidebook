// Tabler icons (P2-06): one library, one stroke, a 34-role dictionary, no lucide-react.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import * as tabler from '@tabler/icons-react';
import { ICON_STROKE, iconProps, iconRoles, icons } from '../src/design/icons.mjs';

const root = new URL('../', import.meta.url);
const read = (file) => fs.readFileSync(new URL(file, root), 'utf8');
const tablerComponents = new Set(Object.values(tabler));

function sources(dir) {
  return fs.readdirSync(new URL(dir, root), { withFileTypes: true }).flatMap((entry) => {
    const rel = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) return sources(rel);
    return /\.(?:[cm]?[jt]sx?)$/.test(entry.name) ? [rel] : [];
  });
}

test('every interface icon uses the 1.5 px stroke', () => {
  assert.equal(ICON_STROKE, 1.5);
  assert.equal(iconProps.stroke, ICON_STROKE);
  assert.equal(iconProps['aria-hidden'], true);
});

test('role dictionary covers 34 meanings with real Tabler icons', () => {
  const roles = Object.entries(iconRoles);
  assert.equal(roles.length, 34);
  assert.equal(roles.filter(([, r]) => r.group === 'rail').length, 9);
  assert.equal(roles.filter(([, r]) => r.group === 'tabs').length, 4);
  for (const [name, role] of roles) {
    assert.ok(tablerComponents.has(role.icon), `${name}: icon is not a Tabler export`);
    if (role.filled) assert.ok(tablerComponents.has(role.filled), `${name}: filled is not a Tabler export`);
  }
  for (const [name, Icon] of Object.entries(icons)) assert.ok(tablerComponents.has(Icon), name);
});

test('only src/design/icons.mjs imports Tabler; lucide-react is gone', () => {
  const files = ['app', 'src', 'components', 'hooks', 'lib'].flatMap(sources);
  const tablerImports = files.filter((file) => /from\s*['"]@tabler\/icons-react['"]/.test(read(file)));
  assert.deepEqual(tablerImports, ['src/design/icons.mjs']);
  assert.deepEqual(files.filter((file) => read(file).includes('lucide-react')), []);
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.dependencies['lucide-react'], undefined);
  assert.equal(JSON.parse(read('package-lock.json')).packages['node_modules/lucide-react'], undefined);
});

test('generated content renders icons with the 1.5 px stroke', () => {
  const html = read('src/content/generated.json');
  assert.match(html, /stroke-width=\\"1\.5\\"/);
  assert.doesNotMatch(html, /stroke-width=\\"1\.75\\"/);
});
