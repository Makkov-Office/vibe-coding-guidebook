// CI gate for Mermaid SVG (P1-04). Run after `npm run validate`.
// scripts/render-diagrams.mjs does not fail when a diagram cannot be rendered
// (no Chrome): it writes `error` to the manifest and the site shows the source
// text. Locally that fallback is intended; in CI it would ship silently, so
// every diagram must have its committed SVG. Exit 1 on any gap or read error.
import { existsSync, readFileSync } from "node:fs";

const problems = [];
let diagrams = [];
let manifest = {};
try {
  ({ diagrams } = JSON.parse(readFileSync("src/content/generated.json", "utf8")));
  manifest = JSON.parse(readFileSync("src/content/diagram-assets.json", "utf8"));
  if (!Array.isArray(diagrams)) throw new Error("generated.json: diagrams не массив");
  if (!manifest || typeof manifest !== "object") throw new Error("diagram-assets.json: не объект");
} catch (error) {
  problems.push(`не прочитаны данные схем: ${error.message}`);
  diagrams = [];
  manifest = {};
}

const ids = new Set(diagrams.map((diagram) => diagram.id));
for (const id of ids) {
  const entry = manifest[id];
  if (!entry?.src) {
    problems.push(`${id}: нет SVG в src/content/diagram-assets.json (${entry?.error ? `error: ${entry.error}` : "записи нет"})`);
    continue;
  }
  for (const file of [`public${entry.src}`, `dist/client${entry.src}`]) {
    if (!existsSync(file)) problems.push(`${id}: нет файла ${file}`);
  }
}
for (const id of Object.keys(manifest)) {
  if (!ids.has(id)) problems.push(`${id}: запись в manifest без схемы в generated.json`);
}

if (problems.length) {
  for (const problem of problems) console.log(`::error title=Mermaid SVG::${problem}`);
  console.log(
    "Схема новая или изменилась, а SVG не отрендерен. Локально с Chrome (MERMAID_CHROME_PATH) " +
      "выполните npm run content и закоммитьте public/diagrams/*.svg и src/content/diagram-assets.json.",
  );
  console.log(`Mermaid SVG: FAIL (${problems.length})`);
  process.exitCode = 1;
} else {
  console.log(`Mermaid SVG: PASS, ${ids.size}/${ids.size} схем с SVG в public/ и dist/client/`);
}
