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

// Motion (P3-05): durations and curves live only in app/tokens.css. The one exception is the
// loading spinner, which turns at a constant speed (`linear`); see visual-language.md, section 7.
test('stylesheets outside app/tokens.css use motion tokens, not durations or curves', () => {
  const files = [...cssFiles('app'), ...cssFiles('src')].filter((file) => file !== 'app/tokens.css');
  const offenders = [];
  for (const file of files) {
    const css = read(file).replace(/\/\*[\s\S]*?\*\//g, '').replace(/linear-gradient\(/g, '');
    for (const match of css.matchAll(/(?<![\w-])\d*\.?\d+(?:e[+-]?\d+)?m?s\b|(?<![\w-])(?:ease(?:-in|-out|-in-out)?|linear|cubic-bezier|steps|step-start|step-end)\b(?!-)/gi)) {
      const line = css.slice(css.lastIndexOf('\n', match.index) + 1, css.indexOf('\n', match.index));
      if (match[0].toLowerCase() === 'linear' && /loading-spin/.test(line)) continue;
      offenders.push(`${file}: ${match[0]} in ${line.trim().slice(0, 80)}`);
    }
  }
  assert.deepEqual(offenders, []);
});

test('reduced motion and data-motion="off" zero every duration token', () => {
  const durations = [...new Set([...tokens.matchAll(/(--dur-[\w-]+):\d/g)].map((m) => m[1]))];
  assert.ok(durations.length >= 6, durations.join());
  const media = tokens.slice(tokens.indexOf('@media (prefers-reduced-motion:reduce)'));
  const off = tokens.slice(tokens.indexOf(':root[data-motion=off]{'));
  for (const body of [media.slice(0, media.indexOf('}')), off.slice(0, off.indexOf('}'))]) {
    for (const name of [...durations, '--shift-appear']) assert.match(body, new RegExp(`${name}:0(?:ms|px)`), name);
  }
});

// Плоский стиль (P2-07, решение founder 29.10.2026): ни градиентов, ни теней — в светлой и тёмной теме.
// Разрешены: жёсткая полоса фона rail (linear-gradient в globals.css, не виден как градиент) и световой след
// по клику P2-08 (radial-gradient в ::after на время нажатия, src/design/interaction.css). Тени: только none; токены --shadow-* остаются со значением none.
test('flat style: no gradient roles, no shadows, no visible gradients, no hover lift in stylesheets', () => {
  assert.equal(palette.aliases, undefined, 'palette.json: псевдонимы *-gradient удалены (P2-07)');
  assert.doesNotMatch(tokens, /--color-[\w-]*gradient/);
  for (const theme of Object.values(palette.themes)) {
    for (const [role, value] of Object.entries(theme)) {
      assert.ok(!Array.isArray(value) && !/gradient\(/.test(value), `palette role ${role} is a gradient`);
    }
  }
  for (const [, name, value] of tokens.matchAll(/(--shadow-[\w-]+):([^;]+);/g)) assert.equal(value.trim(), 'none', name);
  const offenders = [];
  for (const file of [...cssFiles('app'), ...cssFiles('src')]) {
    const css = read(file).replace(/\/\*[\s\S]*?\*\//g, '');
    for (const match of css.matchAll(/(?:box|text)-shadow\s*:\s*([^;}]+)/g)) {
      const value = match[1].replace(/!important/, '').trim();
      if (value !== 'none' && !/^var\(--shadow-[\w-]+\)$/.test(value)) offenders.push(`${file}: ${match[0]}`);
    }
    for (const match of css.matchAll(/drop-shadow\(|(?:radial|conic|repeating-linear)-gradient\(/g)) {
      // Исключение одно: световой след по клику P2-08 — кратковременный ::after с radial-gradient, в покое его нет.
      const line = css.slice(css.lastIndexOf('\n', match.index) + 1, css.indexOf('\n', match.index));
      if (file === 'src/design/interaction.css' && /^\s*background:radial-gradient\(circle var\(--glow-r\)/.test(line)) continue;
      offenders.push(`${file}: ${match[0]}`);
    }
    // Hover меняет цвет, а не поднимает карточку: translateY на :hover запрещён.
    for (const [, selector, body] of css.matchAll(/([^{}]*:hover[^{}]*)\{([^{}]*)\}/g)) {
      if (/translateY\(/.test(body)) offenders.push(`${file}: translateY on ${selector.trim().slice(0, 80)}`);
    }
    for (const match of css.matchAll(/linear-gradient\(/g)) {
      const line = css.slice(css.lastIndexOf('\n', match.index) + 1, css.indexOf('\n', match.index));
      if (file === 'app/globals.css' && /body:has\(\.nav-rail\)\{background-image:linear-gradient\(to right,var\(--color-rail\)/.test(line)) continue;
      offenders.push(`${file}: linear-gradient in ${line.trim().slice(0, 80)}`);
    }
  }
  assert.deepEqual(offenders, []);
});
