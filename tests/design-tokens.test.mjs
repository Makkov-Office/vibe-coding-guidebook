// Design tokens v2 (P2-03): every --color-* token traces to docs/design/palette.json,
// both dark-theme blocks agree, and stylesheets outside app/tokens.css carry no colour literals.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = new URL('../', import.meta.url);
const read = (file) => fs.readFileSync(new URL(file, root), 'utf8');
const palette = JSON.parse(read('docs/design/palette.json'));
const tokens = read('app/tokens.css');

function block(selector) {
  const start = tokens.indexOf(`${selector}{`);
  assert.ok(start >= 0, `app/tokens.css: block ${selector} is missing`);
  const end = tokens.indexOf('}', start);
  return tokens.slice(start + selector.length + 1, end);
}

function colors(body) {
  const map = new Map();
  for (const [, name, value] of body.matchAll(/--color-([a-z-]+):([^;]+);/g)) map.set(name, value.trim());
  return map;
}

function expected(theme) {
  const map = new Map();
  for (const [role, value] of Object.entries(palette.themes[theme])) {
    map.set(role, Array.isArray(value) ? `linear-gradient(120deg,${value.join(',')})` : value);
  }
  return map;
}

test('light tokens equal palette.json light roles', () => {
  assert.deepEqual(colors(block(':root')), expected('light'));
});

test('dark tokens equal palette.json dark roles in both dark blocks', () => {
  const media = colors(block(':root:not([data-theme="light"])'));
  const explicit = colors(block(':root[data-theme="dark"]'));
  assert.deepEqual(media, explicit);
  assert.deepEqual(explicit, expected('dark'));
});

function cssFiles(dir) {
  return fs.readdirSync(new URL(dir, root), { withFileTypes: true }).flatMap((entry) => {
    const rel = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) return cssFiles(rel);
    return entry.name.endsWith('.css') ? [rel] : [];
  });
}

test('stylesheets outside app/tokens.css use tokens, not colour literals', () => {
  const files = [...cssFiles('app'), ...cssFiles('src')].filter((file) => file !== 'app/tokens.css');
  assert.ok(files.includes('app/globals.css'));
  const offenders = [];
  for (const file of files) {
    const css = read(file).replace(/\/\*[\s\S]*?\*\//g, '');
    for (const match of css.matchAll(/#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|lab|lch)\(/gi)) {
      offenders.push(`${file}: ${match[0]}`);
    }
  }
  assert.deepEqual(offenders, []);
});

test('old fonts are gone and new fonts are self-hosted with licences', () => {
  for (const file of [...cssFiles('app'), ...cssFiles('src')]) assert.doesNotMatch(read(file), /Manrope|JetBrains Mono/, file);
  const fonts = fs.readdirSync(new URL('public/fonts/', root));
  assert.deepEqual(fonts.filter((f) => /^(?:manrope|jetbrains-mono)-/.test(f)), []);
  const pkg = JSON.parse(read('package.json'));
  assert.deepEqual(Object.keys(pkg.dependencies).filter((d) => /manrope|jetbrains-mono/.test(d)), []);
  for (const family of ['geist', 'unbounded', 'martian-mono', 'pixelify-sans']) {
    assert.ok(fonts.some((f) => f.startsWith(`${family}-cyrillic`)), `${family} cyrillic`);
    assert.ok(fonts.some((f) => f.startsWith(`${family}-latin`)), `${family} latin`);
    assert.ok(fs.existsSync(new URL(`public/licenses/${family}-OFL.txt`, root)), `${family} licence`);
  }
  for (const [, url] of tokens.matchAll(/url\('([^']+)'\)/g)) {
    assert.ok(fs.existsSync(new URL(`public${url}`, root)), url);
  }
});
