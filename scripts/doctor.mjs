// npm run doctor: checks that this checkout can run the project (P1-03).
// PASS/WARN/FAIL per check; any FAIL exits 1. Fail closed: data that cannot be
// read is reported, never treated as "fine". No dependencies beyond Node.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const results = [];
const report = (status, name, detail) => results.push({ status, name, detail });

function readJson(file) {
  return JSON.parse(readFileSync(path.join(root, file), "utf8"));
}

function parseVersion(value) {
  const match = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(String(value).trim());
  return match ? match.slice(1).map(Number) : null;
}

function compareVersions(a, b) {
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    shell: process.platform === "win32" && command === "npm",
  });
  if (result.error || result.status !== 0) return null;
  return result.stdout.trim();
}

let pkg;
try {
  pkg = readJson("package.json");
} catch (error) {
  report("FAIL", "package", `package.json не прочитан: ${error.message}`);
}

// Node: engines.node is the hard contract, .nvmrc is the reference version.
const current = parseVersion(process.versions.node);
const engines = pkg?.engines?.node;
const minimum = /^>=\s*(\d+\.\d+\.\d+)$/.exec(engines ?? "")?.[1];
if (!minimum) {
  report("FAIL", "node", `engines.node "${engines}" не в формате ">=X.Y.Z"; doctor не может его проверить`);
} else if (compareVersions(current, parseVersion(minimum)) < 0) {
  report("FAIL", "node", `Node v${process.versions.node} не удовлетворяет engines.node ${engines}; выполните nvm use (эталон .nvmrc)`);
} else {
  report("PASS", "node", `v${process.versions.node} удовлетворяет engines.node ${engines}`);
}

let nvmrc;
try {
  nvmrc = readFileSync(path.join(root, ".nvmrc"), "utf8").trim();
} catch (error) {
  report("FAIL", "nvmrc", `.nvmrc не прочитан: ${error.message}`);
}
if (nvmrc !== undefined) {
  const reference = parseVersion(nvmrc);
  if (!reference) {
    report("FAIL", "nvmrc", `.nvmrc "${nvmrc}" не в формате X.Y.Z`);
  } else if (minimum && compareVersions(reference, parseVersion(minimum)) < 0) {
    report("FAIL", "nvmrc", `.nvmrc ${nvmrc} не удовлетворяет engines.node ${engines}`);
  } else if (compareVersions(current, reference) !== 0) {
    report("WARN", "nvmrc", `Node v${process.versions.node} отличается от эталона .nvmrc ${nvmrc}; для воспроизводимости: nvm use`);
  } else {
    report("PASS", "nvmrc", `Node совпадает с .nvmrc ${nvmrc}`);
  }
}

// npm: the lockfile format must be readable by this npm.
let lock;
try {
  lock = readJson("package-lock.json");
} catch (error) {
  report("FAIL", "lockfile", `package-lock.json не прочитан: ${error.message}`);
}
const npmVersion = process.env.npm_execpath && process.env.npm_execpath.endsWith(".js")
  ? run(process.execPath, [process.env.npm_execpath, "--version"])
  : run("npm", ["--version"]);
const npmParsed = npmVersion ? parseVersion(npmVersion) : null;
if (!npmParsed) {
  report("FAIL", "npm", "npm не найден или не вернул версию");
} else if (lock?.lockfileVersion >= 2 && npmParsed[0] < 7) {
  report("FAIL", "npm", `npm ${npmVersion} не поддерживает lockfileVersion ${lock.lockfileVersion}; нужен npm >= 7`);
} else {
  report("PASS", "npm", `npm ${npmVersion}`);
}

// Lockfile ↔ package.json: the same check npm ci makes before installing.
if (pkg && lock) {
  const locked = lock.packages?.[""];
  if (!locked) {
    report("FAIL", "lockfile", `lockfileVersion ${lock.lockfileVersion} без packages[""]; нужен lockfileVersion 2 или 3`);
  } else {
    const drift = [];
    for (const field of ["dependencies", "devDependencies", "optionalDependencies"]) {
      const want = pkg[field] ?? {};
      const have = locked[field] ?? {};
      for (const name of new Set([...Object.keys(want), ...Object.keys(have)])) {
        if (want[name] !== have[name]) drift.push(`${name} (${want[name] ?? "—"} ≠ ${have[name] ?? "—"})`);
      }
    }
    if (drift.length) {
      report("FAIL", "lockfile", `package.json и package-lock.json расходятся: ${drift.slice(0, 5).join(", ")}${drift.length > 5 ? ` и ещё ${drift.length - 5}` : ""}`);
    } else {
      report("PASS", "lockfile", "package.json согласован с package-lock.json");
    }
  }
}

// node_modules ↔ lockfile: every locked package is installed at its locked
// version. Optional packages may be absent (other platforms), never different.
let modulesReady = false;
if (!existsSync(path.join(root, "node_modules"))) {
  report("FAIL", "node_modules", "node_modules нет; выполните npm ci");
} else if (lock?.packages) {
  const missing = [];
  const mismatched = [];
  let checked = 0;
  const short = (key) => key.replace(/^.*node_modules\//, "");
  for (const [key, entry] of Object.entries(lock.packages)) {
    if (!key || entry.link) continue;
    let installed;
    try {
      installed = JSON.parse(readFileSync(path.join(root, key, "package.json"), "utf8")).version;
    } catch (error) {
      if (error.code !== "ENOENT") mismatched.push(`${short(key)} не прочитан (${error.code ?? error.message})`);
      else if (!entry.optional && !entry.devOptional) missing.push(short(key));
      continue;
    }
    checked++;
    if (installed !== entry.version) mismatched.push(`${short(key)} ${installed} ≠ ${entry.version}`);
  }
  const problems = [
    ...(missing.length ? [`нет ${missing.length}: ${missing.slice(0, 3).join(", ")}${missing.length > 3 ? ", …" : ""}`] : []),
    ...(mismatched.length ? [`другая версия у ${mismatched.length}: ${mismatched.slice(0, 3).join(", ")}${mismatched.length > 3 ? ", …" : ""}`] : []),
  ];
  if (problems.length) {
    report("FAIL", "node_modules", `не совпадает с package-lock.json (${problems.join("; ")}); выполните npm ci`);
  } else {
    modulesReady = true;
    report("PASS", "node_modules", `${checked} пакетов совпадают с package-lock.json`);
  }
} else {
  report("FAIL", "node_modules", "не с чем сверить: package-lock.json не прочитан");
}

// Git: informational. Unknown state is reported as unknown, not as clean.
const inside = run("git", ["rev-parse", "--is-inside-work-tree"]);
if (inside !== "true") {
  report("WARN", "git", "git недоступен или это не рабочее дерево git; ветка и состояние не проверены");
} else {
  const branch = run("git", ["symbolic-ref", "--short", "-q", "HEAD"]);
  const head = run("git", ["rev-parse", "--short", "HEAD"]);
  if (branch === "main") {
    report("WARN", "git-branch", "текущая ветка main; правки — только в ветке тикета (AGENTS.md)");
  } else if (branch) {
    report("PASS", "git-branch", `ветка ${branch} @ ${head ?? "?"}`);
  } else {
    report("PASS", "git-branch", `detached HEAD @ ${head ?? "?"}`);
  }
  const status = run("git", ["status", "--porcelain", "--untracked-files=all"]);
  if (status === null) {
    report("WARN", "git-tree", "git status не выполнился; состояние дерева не проверено");
  } else if (status) {
    report("WARN", "git-tree", `рабочее дерево не чистое, путей в git status: ${status.split("\n").length}`);
  } else {
    report("PASS", "git-tree", "рабочее дерево чистое");
  }
}

// Chrome for Mermaid: needed only for new or changed diagrams. Unchanged SVG
// are reused by scripts/render-diagrams.mjs (same hash), so absence is a WARN
// while every diagram in the manifest has its SVG.
let svg;
try {
  const manifest = readJson("src/content/diagram-assets.json");
  const entries = Object.entries(manifest);
  const absent = entries
    .filter(([, asset]) => !asset?.src || !existsSync(path.join(root, "public", asset.src)))
    .map(([id]) => id);
  svg = { total: entries.length, absent };
} catch (error) {
  report("FAIL", "mermaid", `src/content/diagram-assets.json не прочитан: ${error.message}`);
}
if (svg) {
  let chrome = process.env.MERMAID_CHROME_PATH
    ?? (process.platform === "win32" ? "C:/Program Files/Google/Chrome/Application/chrome.exe" : undefined);
  let source = process.env.MERMAID_CHROME_PATH ? "MERMAID_CHROME_PATH" : "Chrome по умолчанию (Windows)";
  if (!chrome && modulesReady) {
    try {
      const require = createRequire(fileURLToPath(import.meta.resolve("@mermaid-js/mermaid-cli")));
      // puppeteer >= 24 returns a Promise here; await covers both forms.
      chrome = await require("puppeteer").executablePath();
      source = "puppeteer";
    } catch {
      chrome = undefined;
    }
  }
  const found = Boolean(chrome) && existsSync(chrome) && statSync(chrome).isFile();
  const reuse = `${svg.total - svg.absent.length}/${svg.total} SVG на месте`;
  if (found) {
    report("PASS", "mermaid", `Chrome: ${chrome} (${source}); ${reuse}`);
  } else if (svg.absent.length) {
    report("FAIL", "mermaid", `Chrome не найден (${chrome ?? "путь не определён"}), а у схем нет SVG: ${svg.absent.join(", ")}; задайте MERMAID_CHROME_PATH`);
  } else {
    report("WARN", "mermaid", `Chrome не найден (${chrome ? `${source}: ${chrome}` : modulesReady ? "путь не определён" : "puppeteer не проверен: node_modules не готов"}); ${reuse} — переиспользуются, пока схемы в content/handbook.md не меняются. Для новых схем: MERMAID_CHROME_PATH`);
  }
}

const width = Math.max(...results.map((r) => r.name.length));
console.log(`doctor: ${root}`);
for (const { status, name, detail } of results) console.log(`  ${status.padEnd(4)}  ${name.padEnd(width)}  ${detail}`);
const failed = results.filter((r) => r.status === "FAIL").map((r) => r.name);
const warned = results.filter((r) => r.status === "WARN").length;
if (failed.length) {
  console.log(`doctor: FAIL (${failed.join(", ")})`);
  process.exitCode = 1;
} else {
  console.log(`doctor: PASS${warned ? ` (предупреждений: ${warned})` : ""}`);
}
