// npm run doctor: checks that this checkout can run the project (P1-03).
// PASS/WARN/FAIL per check; any FAIL exits 1. Fail closed: data that cannot be
// read is reported, never treated as "fine". No dependencies beyond Node.
import { spawnSync } from "node:child_process";
import { accessSync, constants, existsSync, readFileSync, statSync } from "node:fs";
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
  report("FAIL", "package", `package.json not read: ${error.message}`);
}

// Node: engines.node is the hard contract, .nvmrc is the reference version.
// "^X.Y.Z" (X >= 1) = at least X.Y.Z within major X: Vercel picks its Node
// major from engines, and ">=" would give the newest major (P1-07, ADR-0002).
const current = parseVersion(process.versions.node);
const engines = pkg?.engines?.node;
const enginesMatch = /^(>=|\^)\s*(\d+\.\d+\.\d+)$/.exec(engines ?? "");
const minimum = enginesMatch && !(enginesMatch[1] === "^" && enginesMatch[2].startsWith("0.")) ? enginesMatch[2] : undefined;
const fixedMajor = minimum && enginesMatch[1] === "^" ? parseVersion(minimum)[0] : null;
const satisfiesEngines = (version) =>
  compareVersions(version, parseVersion(minimum)) >= 0 && (fixedMajor === null || version[0] === fixedMajor);
if (!minimum) {
  report("FAIL", "node", `engines.node "${engines}" is not in the form ">=X.Y.Z" or "^X.Y.Z"; doctor cannot check it`);
} else if (!satisfiesEngines(current)) {
  report("FAIL", "node", `Node v${process.versions.node} does not satisfy engines.node ${engines}; run nvm use (reference: .nvmrc)`);
} else {
  report("PASS", "node", `v${process.versions.node} satisfies engines.node ${engines}`);
}

let nvmrc;
try {
  nvmrc = readFileSync(path.join(root, ".nvmrc"), "utf8").trim();
} catch (error) {
  report("FAIL", "nvmrc", `.nvmrc not read: ${error.message}`);
}
if (nvmrc !== undefined) {
  const reference = parseVersion(nvmrc);
  if (!reference) {
    report("FAIL", "nvmrc", `.nvmrc "${nvmrc}" is not in the form X.Y.Z`);
  } else if (minimum && !satisfiesEngines(reference)) {
    report("FAIL", "nvmrc", `.nvmrc ${nvmrc} does not satisfy engines.node ${engines}`);
  } else if (compareVersions(current, reference) !== 0) {
    report("WARN", "nvmrc", `Node v${process.versions.node} differs from the .nvmrc reference ${nvmrc}; for reproducibility: nvm use`);
  } else {
    report("PASS", "nvmrc", `Node matches .nvmrc ${nvmrc}`);
  }
}

// npm: the lockfile format must be readable by this npm.
let lock;
try {
  lock = readJson("package-lock.json");
} catch (error) {
  report("FAIL", "lockfile", `package-lock.json not read: ${error.message}`);
}
const npmVersion = process.env.npm_execpath && process.env.npm_execpath.endsWith(".js")
  ? run(process.execPath, [process.env.npm_execpath, "--version"])
  : run("npm", ["--version"]);
const npmParsed = npmVersion ? parseVersion(npmVersion) : null;
if (!npmParsed) {
  report("FAIL", "npm", "npm not found or did not return a version");
} else if (lock?.lockfileVersion >= 2 && npmParsed[0] < 7) {
  report("FAIL", "npm", `npm ${npmVersion} does not support lockfileVersion ${lock.lockfileVersion}; npm >= 7 is required`);
} else {
  report("PASS", "npm", `npm ${npmVersion}`);
}

// Lockfile ↔ package.json: the same check npm ci makes before installing.
if (pkg && lock) {
  const locked = lock.packages?.[""];
  if (!locked) {
    report("FAIL", "lockfile", `lockfileVersion ${lock.lockfileVersion} without packages[""]; lockfileVersion 2 or 3 is required`);
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
      report("FAIL", "lockfile", `package.json and package-lock.json disagree: ${drift.slice(0, 5).join(", ")}${drift.length > 5 ? ` and ${drift.length - 5} more` : ""}`);
    } else {
      report("PASS", "lockfile", "package.json is consistent with package-lock.json");
    }
  }
}

// node_modules ↔ lockfile: every locked package is installed at its locked
// version. Optional packages may be absent (other platforms), never different;
// devOptional (e.g. @types/react, sharp) must be present.
let modulesReady = false;
if (!existsSync(path.join(root, "node_modules"))) {
  report("FAIL", "node_modules", "node_modules missing; run npm ci");
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
      if (error.code !== "ENOENT") mismatched.push(`${short(key)} not read (${error.code ?? error.message})`);
      // Only "optional" may be skipped by npm ci. "devOptional" is optional on
      // one path but a required dev dependency on another, so it must exist.
      else if (!entry.optional) missing.push(short(key));
      continue;
    }
    checked++;
    if (installed !== entry.version) mismatched.push(`${short(key)} ${installed} ≠ ${entry.version}`);
  }
  const problems = [
    ...(missing.length ? [`missing ${missing.length}: ${missing.slice(0, 3).join(", ")}${missing.length > 3 ? ", …" : ""}`] : []),
    ...(mismatched.length ? [`different version for ${mismatched.length}: ${mismatched.slice(0, 3).join(", ")}${mismatched.length > 3 ? ", …" : ""}`] : []),
  ];
  if (problems.length) {
    report("FAIL", "node_modules", `does not match package-lock.json (${problems.join("; ")}); run npm ci`);
  } else {
    modulesReady = true;
    report("PASS", "node_modules", `${checked} packages match package-lock.json`);
  }
} else {
  report("FAIL", "node_modules", "nothing to compare against: package-lock.json not read");
}

// Git: informational. Unknown state is reported as unknown, not as clean.
const inside = run("git", ["rev-parse", "--is-inside-work-tree"]);
if (inside !== "true") {
  report("WARN", "git", "git unavailable or not a git working tree; branch and state not checked");
} else {
  const branch = run("git", ["symbolic-ref", "--short", "-q", "HEAD"]);
  const head = run("git", ["rev-parse", "--short", "HEAD"]);
  if (branch === "main") {
    report("WARN", "git-branch", "current branch is main; edits only in a ticket branch (AGENTS.md)");
  } else if (branch) {
    report("PASS", "git-branch", `branch ${branch} @ ${head ?? "?"}`);
  } else {
    report("PASS", "git-branch", `detached HEAD @ ${head ?? "?"}`);
  }
  const status = run("git", ["status", "--porcelain", "--untracked-files=all"]);
  if (status === null) {
    report("WARN", "git-tree", "git status failed; tree state not checked");
  } else if (status) {
    report("WARN", "git-tree", `working tree not clean, paths in git status: ${status.split("\n").length}`);
  } else {
    report("PASS", "git-tree", "working tree clean");
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
  report("FAIL", "mermaid", `src/content/diagram-assets.json not read: ${error.message}`);
}
if (svg) {
  let chrome = process.env.MERMAID_CHROME_PATH
    ?? (process.platform === "win32" ? "C:/Program Files/Google/Chrome/Application/chrome.exe" : undefined);
  let source = process.env.MERMAID_CHROME_PATH ? "MERMAID_CHROME_PATH" : "default Chrome (Windows)";
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
  const problem = probeChrome(chrome);
  const why = chrome
    ? `${source}: ${chrome}: ${problem.error}`
    : modulesReady ? "path not determined" : "puppeteer not checked: node_modules not ready";
  const reuse = `${svg.total - svg.absent.length}/${svg.total} SVG present`;
  if (!problem.error) {
    report("PASS", "mermaid", `Chrome: ${chrome} (${source}${problem.version ? `, ${problem.version}` : ""}); ${reuse}`);
  } else if (svg.absent.length) {
    report("FAIL", "mermaid", `Chrome unusable (${why}), and these diagrams have no SVG: ${svg.absent.join(", ")}; set MERMAID_CHROME_PATH`);
  } else {
    report("WARN", "mermaid", `Chrome unusable (${why}); ${reuse}, reused while the diagrams in content/handbook.md do not change. For new diagrams: MERMAID_CHROME_PATH`);
  }
}

// Usable means what puppeteer.launch needs: an executable file that runs.
// Windows: chrome.exe --version opens the browser instead of printing, so
// there only the file itself is checked.
function probeChrome(file) {
  if (!file) return { error: "path not determined" };
  try {
    if (!statSync(file).isFile()) return { error: "not a file" };
  } catch {
    return { error: "file missing" };
  }
  if (process.platform === "win32") return {};
  try {
    accessSync(file, constants.X_OK);
  } catch {
    return { error: "no execute permission" };
  }
  const result = spawnSync(file, ["--version"], { encoding: "utf8", timeout: 10_000 });
  if (result.error || result.status !== 0) {
    return { error: `--version failed (${result.error?.code ?? `exit ${result.status}`})` };
  }
  const version = result.stdout.trim().split("\n")[0];
  if (!/chrom/i.test(version)) return { error: `--version did not return Chrome/Chromium: "${version.slice(0, 60)}"` };
  return { version };
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
  console.log(`doctor: PASS${warned ? ` (warnings: ${warned})` : ""}`);
}
