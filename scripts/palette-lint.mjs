// Линтер палитры «Чертежа» (P2-04): CSS, SVG и код интерфейса в src/, app/, public/brand
// используют только токены app/tokens.css (var(--…), currentColor) или файлы из разрешённого списка.
// Запуск: node scripts/palette-lint.mjs [файл…]; входит в npm test (tests/palette-lint.test.mjs).
import fs from 'node:fs';
import path from 'node:path';

export const ROOTS = ['src', 'app', 'public/brand'];
const EXTENSIONS = /\.(?:css|svg|tsx?|jsx?|mjs)$/;
const SKIP_DIRS = new Set(['src/content']); // сгенерированный контент (npm run content)

// Разрешённые файлы с цветовыми литералами — каждый с причиной.
export const ALLOWED = {
  'app/tokens.css': 'источник токенов: значения из docs/design/palette.json',
  'public/brand/flow.svg': 'утверждённый знак FLOW, меняется с ребрендингом P4-05',
  'public/brand/makkov.svg': 'подпись автора by Makkov, байты не меняются (белая, инвертируется --signature-filter)',
};

const LITERAL = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|oklch|oklab|lab|lch|color)\(/gi;
// Именованные цвета в атрибутах и свойствах цвета (fill="white", color: red).
const NAMED = /\b(?:fill|stroke|stop-color|flood-color|lighting-color|color|background(?:-color)?|border(?:-color)?|outline-color)\s*[=:]\s*["']?\s*(?!none\b|currentColor\b|transparent\b|inherit\b|initial\b|unset\b|var\(|url\(|context-)([a-z]+)\b/gi;
const NAMED_COLORS = new Set(['white', 'black', 'red', 'green', 'blue', 'yellow', 'orange', 'purple', 'pink', 'gray', 'grey', 'silver', 'gold', 'navy', 'teal', 'lime', 'maroon', 'olive', 'aqua', 'fuchsia', 'cyan', 'magenta', 'brown', 'coral', 'salmon', 'violet', 'indigo', 'crimson', 'tomato', 'orchid', 'plum', 'khaki', 'beige', 'ivory', 'lavender', 'tan', 'wheat', 'snow', 'linen']);

function stripComments(text, file) {
  if (file.endsWith('.css')) return text.replace(/\/\*[\s\S]*?\*\//g, '');
  if (file.endsWith('.svg')) return text.replace(/<!--[\s\S]*?-->/g, '');
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

/** Цветовые литералы в тексте файла: [{match, line}]. */
export function findColors(text, file) {
  const code = stripComments(text, file);
  const found = [];
  const lineOf = (index) => code.slice(0, index).split('\n').length;
  for (const m of code.matchAll(LITERAL)) {
    // В коде «#…» после href — якорь ссылки, а не цвет.
    if (!/\.(?:css|svg)$/.test(file) && m[0].startsWith('#') && /href\s*[=:]\s*\{?\s*["'`]$/.test(code.slice(Math.max(0, m.index - 16), m.index))) continue;
    found.push({ match: m[0], line: lineOf(m.index) });
  }
  for (const m of code.matchAll(NAMED)) {
    if (NAMED_COLORS.has(m[1].toLowerCase())) found.push({ match: m[0].trim(), line: lineOf(m.index) });
  }
  return found;
}

export function listFiles(root = process.cwd()) {
  const out = [];
  const walk = (dir) => {
    const abs = path.join(root, dir);
    if (!fs.existsSync(abs)) throw new Error(`palette-lint: ${dir} is missing`);
    for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
      const rel = path.posix.join(dir, entry.name);
      if (entry.isDirectory()) { if (!SKIP_DIRS.has(rel)) walk(rel); }
      else if (EXTENSIONS.test(entry.name)) out.push(rel);
    }
  };
  for (const dir of ROOTS) walk(dir);
  return out.sort();
}

/** Нарушения по файлам; разрешённые файлы пропускаются. Fail closed: пустой список файлов — ошибка. */
export function lint(files, root = process.cwd()) {
  if (files.length === 0) throw new Error('palette-lint: no files to check');
  const problems = [];
  for (const file of files) {
    if (Object.hasOwn(ALLOWED, file)) continue;
    for (const hit of findColors(fs.readFileSync(path.join(root, file), 'utf8'), file)) problems.push({ file, ...hit });
  }
  return problems;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const files = process.argv.length > 2 ? process.argv.slice(2) : listFiles();
  const problems = lint(files);
  for (const p of problems) console.log(`FAIL ${p.file}:${p.line} ${p.match}`);
  console.log(`palette-lint: ${problems.length ? 'FAIL' : 'PASS'} (${files.length} files, ${problems.length} foreign colours)`);
  process.exit(problems.length ? 1 : 0);
}
