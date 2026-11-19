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
  if (!Array.isArray(diagrams)) throw new Error("generated.json: diagrams is not an array");
  if (!manifest || typeof manifest !== "object") throw new Error("diagram-assets.json: not an object");
} catch (error) {
  problems.push(`diagram data not read: ${error.message}`);
  diagrams = [];
  manifest = {};
}

const ids = new Set(diagrams.map((diagram) => diagram.id));
for (const id of ids) {
  const entry = manifest[id];
  if (!entry?.src) {
    problems.push(`${id}: no SVG in src/content/diagram-assets.json (${entry?.error ? `error: ${entry.error}` : "no entry"})`);
    continue;
  }
  for (const file of [`public${entry.src}`, `dist/client${entry.src}`]) {
    if (!existsSync(file)) problems.push(`${id}: file ${file} missing`);
  }
}
for (const id of Object.keys(manifest)) {
  if (!ids.has(id)) problems.push(`${id}: manifest entry without a diagram in generated.json`);
}

if (problems.length) {
  for (const problem of problems) console.log(`::error title=Mermaid SVG::${problem}`);
  console.log(
    "A diagram is new or changed, but its SVG is not rendered. Locally with Chrome (MERMAID_CHROME_PATH) " +
      "run npm run content and commit public/diagrams/*.svg and src/content/diagram-assets.json.",
  );
  console.log(`Mermaid SVG: FAIL (${problems.length})`);
  process.exitCode = 1;
} else {
  console.log(`Mermaid SVG: PASS, ${ids.size}/${ids.size} diagrams with SVG in public/ and dist/client/`);
}
