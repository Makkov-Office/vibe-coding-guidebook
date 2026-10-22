// npm run validate: the whole project check in one command (P1-03).
// Runs the npm scripts below in order and stops at the first failure; then
// checks that validate itself left the working tree as it found it, so stale
// generated files fail. Exit 0 only when every step and the tree are PASS.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const STEPS = ["content", "test", "typecheck", "lint", "build"];
// Tracked files that a passing step rewrites by design. Reported, not failed.
const KNOWN_CHANGES = {
  "tsconfig.tsbuildinfo": "его переписывает npm run typecheck, incremental: true",
};

if (!process.env.npm_execpath) {
  throw new Error("Run validate with npm run validate.");
}
const root = fileURLToPath(new URL("../", import.meta.url));

// Path → status + content hash for every changed, untracked or deleted path.
// Ignored files (node_modules, dist, .wrangler, …) are outside the contract.
function snapshot() {
  const result = spawnSync("git", [
    "status", "--porcelain=v1", "-z", "--untracked-files=all", "--no-renames",
  ], { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (result.error || result.status !== 0) return null;
  const state = new Map();
  for (const record of result.stdout.split("\0")) {
    if (!record) continue;
    const file = record.slice(3);
    let hash = "absent";
    try {
      hash = createHash("sha256").update(readFileSync(path.join(root, file))).digest("hex");
    } catch (error) {
      if (error.code !== "ENOENT") hash = `unreadable:${error.code}`;
    }
    state.set(file, `${record.slice(0, 2)} ${hash}`);
  }
  return state;
}

const results = [];
const before = snapshot();

let failed = false;
for (const [index, step] of STEPS.entries()) {
  if (failed) {
    results.push({ name: step, status: "SKIP", detail: "не запускался: предыдущий шаг FAIL" });
    continue;
  }
  console.log(`\n==> validate ${index + 1}/${STEPS.length}: npm run ${step}\n`);
  const started = Date.now();
  const run = spawnSync(process.execPath, [process.env.npm_execpath, "run", step], {
    cwd: root,
    stdio: "inherit",
  });
  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  if (run.error || run.status !== 0) {
    failed = true;
    const reason = run.error?.message ?? (run.signal ? `signal ${run.signal}` : `exit ${run.status}`);
    results.push({ name: step, status: "FAIL", detail: `${seconds} s, ${reason}`, seconds: Number(seconds) });
  } else {
    results.push({ name: step, status: "PASS", detail: `${seconds} s`, seconds: Number(seconds) });
  }
}

// Tree: validate must not leave changes it did not find (stale generated
// files, new untracked output). git unavailable means "not verified" → FAIL.
const after = before && snapshot();
if (!before || !after) {
  results.push({ name: "tree", status: "FAIL", detail: "git status не выполнился; чистоту дерева проверить нельзя" });
} else {
  const changed = [...new Set([...before.keys(), ...after.keys()])]
    .filter((file) => before.get(file) !== after.get(file))
    .sort();
  const unexpected = changed.filter((file) => !(file in KNOWN_CHANGES));
  const known = changed.filter((file) => file in KNOWN_CHANGES);
  const note = known.map((file) => `${file} (${KNOWN_CHANGES[file]})`).join("; ");
  if (unexpected.length) {
    results.push({ name: "tree", status: "FAIL", detail: `validate изменил файлы: ${unexpected.join(", ")}`, changed: unexpected, known });
  } else if (known.length) {
    results.push({ name: "tree", status: "WARN", detail: `без неожиданных изменений; известное: ${note}`, changed: [], known });
  } else {
    results.push({ name: "tree", status: "PASS", detail: "validate не изменил рабочее дерево", changed: [], known });
  }
}

const failures = results.filter((r) => r.status === "FAIL").map((r) => r.name);
const width = Math.max(...results.map((r) => r.name.length));
console.log("\nvalidate: сводка");
for (const { status, name, detail } of results) console.log(`  ${status.padEnd(4)}  ${name.padEnd(width)}  ${detail}`);
console.log(failures.length ? `validate: FAIL (${failures.join(", ")})` : "validate: PASS");
console.log(JSON.stringify({
  validate: failures.length ? "FAIL" : "PASS",
  failed: failures,
  steps: results.map(({ name, status, seconds, changed, known }) => ({ name, status, seconds, changed, known })),
}));
if (failures.length) process.exitCode = 1;
