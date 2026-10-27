// Линтер палитры «Чертежа» (P2-04): CSS, SVG и код интерфейса в src/, app/, public/brand
// используют только токены app/tokens.css (var(--…), currentColor) или файлы из разрешённого списка.
// Запуск: node scripts/palette-lint.mjs [файл…]; входит в npm test (tests/palette-lint.test.mjs).
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const ROOTS = ['src', 'app', 'public/brand'];
const EXTENSIONS = /\.(?:css|svg|tsx?|jsx?|mjs)$/; // JSON (в том числе сгенерированный контент) не проверяется

// Разрешённые файлы с цветовыми литералами — каждый с причиной.
export const ALLOWED = {
  'app/tokens.css': 'источник токенов: значения из docs/design/palette.json',
  'public/brand/flow.svg': 'утверждённый знак FLOW, меняется с ребрендингом P4-05',
  'public/brand/makkov.svg': 'подпись автора by Makkov, байты не меняются (белая, инвертируется --signature-filter)',
};

const LITERAL = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|oklch|oklab|lab|lch|color)\(/gi;
// Все 148 именованных цветов CSS Color 4 и системные цвета; transparent и currentColor разрешены.
export const NAMED_COLORS = new Set(`aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood
cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey
darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey
darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite
gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon
lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue
lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid
mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin
navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff
peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver
skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow
yellowgreen accentcolor accentcolortext activetext buttonborder buttonface buttontext canvas canvastext field fieldtext graytext
highlight highlighttext linktext mark marktext selecteditem selecteditemtext visitedtext`.split(/\s+/));

// Свойства и атрибуты, где значение — цвет или содержит цвет (CSS, SVG, JSX, объекты style в JS).
const COLOR_ATTR = /(?<![-\w])(fill|stroke|stop-?color|flood-?color|lighting-?color|color)\s*=\s*\{?\s*(["'`])([^"'`]*)\2/gi;
const STYLE_ATTR = /(?<![-\w])style\s*=\s*(["'])([^"']*)\1/gi;
const JS_COLOR_KEY = /(?<![-\w$])(["']?)([a-z]*(?:color|background|border|outline|shadow|fill|stroke|caret|accent|decoration)[a-z]*)\1\s*:\s*(["'`])([^"'`]*)\3/gi;

function stripComments(text, file) {
  if (file.endsWith('.css')) return text.replace(/\/\*[\s\S]*?\*\//g, '');
  if (file.endsWith('.svg')) return text.replace(/<!--[\s\S]*?-->/g, '');
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

/** Именованные цвета в значении: отдельные слова, не имена функций, не части var(--…) и не строки. */
function namedIn(value) {
  const clean = value.replace(/(["'])[^"']*\1/g, ' ').replace(/url\([^)]*\)/gi, ' ');
  return [...clean.matchAll(/(?<![-\w#.])([a-z]+)(?![-\w(])/gi)].map((m) => m[1].toLowerCase()).filter((w) => NAMED_COLORS.has(w));
}

/** Декларации CSS «свойство: значение» внутри блоков без вложенных скобок (и в атрибуте style). */
function* declarations(css, offset = 0) {
  for (const block of css.matchAll(/\{([^{}]*)\}/g)) {
    const base = offset + block.index + 1;
    for (const d of block[1].matchAll(/([-\w]+)\s*:\s*([^;]+)/g)) yield { prop: d[1], value: d[2], index: base + d.index };
  }
}

const SYSTEM_COLORS = new Set('accentcolor accentcolortext activetext buttonborder buttonface buttontext canvas canvastext field fieldtext graytext highlight highlighttext linktext mark marktext selecteditem selecteditemtext visitedtext'.split(' '));

/** Диапазоны [начало, конец] блоков @media (forced-colors: active). */
function forcedColorRanges(css) {
  const ranges = [];
  for (const m of css.matchAll(/@media[^{]*forced-colors\s*:\s*active[^{]*\{/gi)) {
    let depth = 1, i = m.index + m[0].length;
    for (; i < css.length && depth; i++) depth += css[i] === '{' ? 1 : css[i] === '}' ? -1 : 0;
    ranges.push([m.index, i]);
  }
  return ranges;
}

/** Цветовые литералы и именованные цвета в тексте файла: [{match, line}]. */
export function findColors(text, file) {
  const code = stripComments(text, file);
  const found = [];
  const lineOf = (index) => code.slice(0, index).split('\n').length;
  const named = (prop, value, index) => { for (const w of namedIn(value)) found.push({ match: `${prop}:${w}`, line: lineOf(index) }); };
  for (const m of code.matchAll(LITERAL)) {
    // В коде «#…» после href — якорь ссылки, а не цвет.
    if (!/\.(?:css|svg)$/.test(file) && m[0].startsWith('#') && /href\s*[=:]\s*\{?\s*["'`]$/.test(code.slice(Math.max(0, m.index - 16), m.index))) continue;
    found.push({ match: m[0], line: lineOf(m.index) });
  }
  if (file.endsWith('.css')) {
    const forced = forcedColorRanges(code);
    for (const d of declarations(code)) {
      // В @media (forced-colors: active) системные цвета обязательны (Windows High Contrast).
      if (forced.some(([from, to]) => d.index > from && d.index < to)) { for (const w of namedIn(d.value)) if (!SYSTEM_COLORS.has(w)) found.push({ match: `${d.prop}:${w}`, line: lineOf(d.index) }); }
      else named(d.prop, d.value, d.index);
    }
  } else {
    for (const m of code.matchAll(COLOR_ATTR)) named(m[1], m[3], m.index);
    for (const m of code.matchAll(STYLE_ATTR)) for (const d of declarations(`{${m[2]}}`, m.index)) named(d.prop, d.value, d.index);
    if (file.endsWith('.svg')) for (const m of code.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) for (const d of declarations(m[1], m.index)) named(d.prop, d.value, d.index);
    else for (const m of code.matchAll(JS_COLOR_KEY)) named(m[2], m[4], m.index);
  }
  return found.sort((a, b) => a.line - b.line);
}

export function listFiles(root = process.cwd()) {
  const out = [];
  const walk = (dir) => {
    const abs = path.join(root, dir);
    if (!fs.existsSync(abs)) throw new Error(`palette-lint: ${dir} is missing`);
    for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
      const rel = path.posix.join(dir, entry.name);
      if (entry.isDirectory()) walk(rel);
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

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const files = process.argv.length > 2 ? process.argv.slice(2) : listFiles();
  const problems = lint(files);
  for (const p of problems) console.log(`FAIL ${p.file}:${p.line} ${p.match}`);
  console.log(`palette-lint: ${problems.length ? 'FAIL' : 'PASS'} (${files.length} files, ${problems.length} foreign colours)`);
  process.exit(problems.length ? 1 : 0);
}
