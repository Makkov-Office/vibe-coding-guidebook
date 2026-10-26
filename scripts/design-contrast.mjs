// Contrast check for the «Чертёж» v2 palette (P2-02).
// Reads docs/design/palette.json, computes WCAG 2.x contrast for every pair in
// both themes and fails closed: an unknown role or a ratio below the threshold
// is a FAIL. `--write` refreshes docs/design/contrast-v2.json and the table
// between the markers in docs/design/visual-language.md.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
export const PALETTE = "docs/design/palette.json";
export const REPORT = "docs/design/contrast-v2.json";
export const SPEC = "docs/design/visual-language.md";
export const MARKERS = ["<!-- contrast-table:start -->", "<!-- contrast-table:end -->"];
// WCAG 2.2: 1.4.3 text, 1.4.11 non-text (control borders, icons, focus).
export const THRESHOLDS = { text: 4.5, ui: 3 };

function channel(value) {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function luminance(hex) {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) throw new Error(`not a #RRGGBB colour: ${hex}`);
  const [r, g, b] = [0, 2, 4].map((i) => channel(parseInt(match[1].slice(i, i + 2), 16)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function resolve(theme, name, role) {
  if (!Object.hasOwn(theme, role)) throw new Error(`${name}: unknown role ${role}`);
  const value = theme[role];
  return Array.isArray(value) ? value.map((hex, i) => [`${role}[${i}]`, hex]) : [[role, value]];
}

export function checkPalette(palette) {
  const rows = [];
  for (const [name, theme] of Object.entries(palette.themes)) {
    for (const pair of palette.pairs) {
      if (pair.theme && pair.theme !== name) continue;
      const threshold = THRESHOLDS[pair.kind];
      if (!threshold) throw new Error(`unknown pair kind ${pair.kind}`);
      for (const [fgRole, fg] of resolve(theme, name, pair.fg)) {
        for (const bgRole of pair.bg) {
          for (const [bgName, bg] of resolve(theme, name, bgRole)) {
            const ratio = Math.round(contrast(fg, bg) * 100) / 100;
            rows.push({
              theme: name, fg: fgRole, fgHex: fg, bg: bgName, bgHex: bg,
              kind: pair.kind, use: pair.use, ratio, threshold,
              status: ratio >= threshold ? "PASS" : "FAIL",
            });
          }
        }
      }
    }
  }
  return rows;
}

export function markdownTable(rows) {
  const head = "| Тема | Цвет | Фон | Где | Порог | Контраст | Итог |\n|---|---|---|---|---|---|---|";
  const body = rows.map((r) =>
    `| ${r.theme} | \`${r.fg}\` ${r.fgHex} | \`${r.bg}\` ${r.bgHex} | ${r.use} | ${r.threshold}:1 | ${r.ratio.toFixed(2)} | ${r.status} |`);
  return [head, ...body].join("\n");
}

export function renderSpec(spec, rows) {
  const [start, end] = MARKERS;
  const from = spec.indexOf(start);
  const to = spec.indexOf(end);
  if (from < 0 || to < from) throw new Error(`${SPEC}: contrast table markers missing`);
  return `${spec.slice(0, from + start.length)}\n${markdownTable(rows)}\n${spec.slice(to)}`;
}

export function renderReport(rows) {
  return `${JSON.stringify(rows, null, 2)}\n`;
}

const read = (file) => readFileSync(path.join(root, file), "utf8");

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const rows = checkPalette(JSON.parse(read(PALETTE)));
  const failed = rows.filter((r) => r.status !== "PASS");
  if (process.argv.includes("--write")) {
    writeFileSync(path.join(root, REPORT), renderReport(rows));
    writeFileSync(path.join(root, SPEC), renderSpec(read(SPEC), rows));
  }
  for (const r of failed) console.log(`FAIL ${r.theme} ${r.fg} on ${r.bg}: ${r.ratio} < ${r.threshold}`);
  const min = Math.min(...rows.map((r) => r.ratio));
  console.log(`contrast: ${failed.length ? "FAIL" : "PASS"} (${rows.length} pairs, ${failed.length} below threshold, min ${min.toFixed(2)})`);
  process.exit(failed.length ? 1 : 0);
}
