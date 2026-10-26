// Agent Pack contract (P8-02): every example is valid against its JSON Schema,
// invalid documents are rejected, skills stay within limits and reference
// existing schemas, agent-pack/claude does not weaken this repository's .claude/.
// The validator below covers only the keywords listed in KEYWORDS; a schema that
// uses any other keyword fails the test (fail closed), so no dependency is needed.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const pack = path.join(root, 'agent-pack');
const SCHEMAS = ['ticket', 'preflight-report', 'evidence-record', 'finding', 'handoff', 'decision-packet'];
const SKILLS = ['preflight', 'independent-review', 'post-merge-sync', 'docs-impact', 'spec-conflict', 'handoff'];
const KEYWORDS = new Set(['$schema', '$id', 'title', 'description', 'type', 'properties', 'required', 'additionalProperties',
  'items', 'enum', 'const', 'pattern', 'minLength', 'minItems', 'format', 'anyOf']);
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const loadSchema = (name) => readJson(path.join(pack, 'schemas', `${name}.schema.json`));

function typeOf(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  if (Number.isInteger(v)) return 'integer';
  return typeof v;
}
function checkKeywords(s, at = '#') {
  if (typeof s === 'boolean') return;
  for (const k of Object.keys(s)) assert.ok(KEYWORDS.has(k), `${at}: unsupported keyword ${k}`);
  for (const [k, sub] of Object.entries(s.properties ?? {})) checkKeywords(sub, `${at}/properties/${k}`);
  if (s.items) checkKeywords(s.items, `${at}/items`);
  if (typeof s.additionalProperties === 'object') checkKeywords(s.additionalProperties, `${at}/additionalProperties`);
  (s.anyOf ?? []).forEach((sub, i) => checkKeywords(sub, `${at}/anyOf/${i}`));
}
// Returns a list of errors; empty list = valid.
function validate(s, v, at = '$') {
  if (s === true) return [];
  if (s === false) return [`${at}: not allowed`];
  const errors = [];
  if (s.type) {
    const t = typeOf(v);
    const ok = [s.type].flat().some((x) => x === t || (x === 'number' && t === 'integer'));
    if (!ok) return [`${at}: expected ${s.type}, got ${t}`];
  }
  if ('const' in s && JSON.stringify(v) !== JSON.stringify(s.const)) errors.push(`${at}: expected const ${JSON.stringify(s.const)}`);
  if (s.enum && !s.enum.some((e) => JSON.stringify(e) === JSON.stringify(v))) errors.push(`${at}: ${JSON.stringify(v)} not in enum`);
  if (typeof v === 'string') {
    if (s.minLength !== undefined && [...v].length < s.minLength) errors.push(`${at}: shorter than ${s.minLength}`);
    if (s.pattern && !new RegExp(s.pattern, 'u').test(v)) errors.push(`${at}: does not match ${s.pattern}`);
    if (s.format === 'date-time' && !(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(v) && !Number.isNaN(Date.parse(v)))) errors.push(`${at}: not date-time`);
  }
  if (Array.isArray(v)) {
    if (s.minItems !== undefined && v.length < s.minItems) errors.push(`${at}: fewer than ${s.minItems} items`);
    if (s.items) v.forEach((item, i) => errors.push(...validate(s.items, item, `${at}[${i}]`)));
  }
  if (typeOf(v) === 'object') {
    for (const k of s.required ?? []) if (!Object.hasOwn(v, k)) errors.push(`${at}: missing ${k}`);
    for (const [k, val] of Object.entries(v)) {
      if (s.properties && Object.hasOwn(s.properties, k)) errors.push(...validate(s.properties[k], val, `${at}.${k}`));
      else if (s.additionalProperties !== undefined) errors.push(...validate(s.additionalProperties, val, `${at}.${k}`));
    }
  }
  if (s.anyOf && !s.anyOf.some((sub) => validate(sub, v, at).length === 0)) errors.push(`${at}: matches no anyOf branch`);
  return errors;
}

test('6 schemas: draft 2020-12, supported keywords, valid example', () => {
  const files = fs.readdirSync(path.join(pack, 'schemas')).filter((f) => f.endsWith('.schema.json')).sort();
  assert.deepEqual(files, SCHEMAS.map((n) => `${n}.schema.json`).sort());
  for (const name of SCHEMAS) {
    const schema = loadSchema(name);
    assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema', name);
    checkKeywords(schema, name);
    const example = readJson(path.join(pack, 'schemas/examples', `${name}.json`));
    assert.deepEqual(validate(schema, example), [], `${name} example`);
  }
});

test('invalid documents fail', () => {
  const sha = 'a'.repeat(40);
  const cases = [
    ['ticket', (d) => { delete d.acceptance_criteria; }],
    ['ticket', (d) => { d.risk = 'Critical'; }],
    ['ticket', (d) => { d.scope = []; }],
    ['ticket', (d) => { d.extra = 'x'; }],
    ['preflight-report', (d) => { d.result = 'OK'; }],
    ['preflight-report', (d) => { d.base.sha = 'abc1234'; }],
    ['preflight-report', (d) => { d.collisions[0].class = 'probably isolated'; }],
    ['evidence-record', (d) => { d.timestamp = 'yesterday'; }],
    ['evidence-record', (d) => { d.result = 'BLOCKED'; }],
    ['finding', (d) => { d.severity = 'P1'; }],
    ['finding', (d) => { delete d.location.file; }],
    ['handoff', (d) => { d.tests[0].tested_state = 'latest'; }],
    ['handoff', (d) => { d.head_sha = sha.toUpperCase(); }],
    ['handoff', (d) => { delete d.ci; }],
    ['evidence-record', (d) => { d.working_tree = { state: 'dirty' }; }],
    ['preflight-report', (d) => { d.local_state = { state: 'dirty', changes: [] }; }],
    ['evidence-record', (d) => { d.timestamp = '2026-13-45T99:99:99Z'; }],
    ['decision-packet', (d) => { d.decision_requested = ''; }],
    ['decision-packet', (d) => { delete d.rollback; }],
  ];
  for (const [name, mutate] of cases) {
    const doc = readJson(path.join(pack, 'schemas/examples', `${name}.json`));
    mutate(doc);
    assert.notDeepEqual(validate(loadSchema(name), doc), [], `${name}: ${mutate}`);
  }
  assert.throws(() => checkKeywords({ type: 'object', oneOf: [] }), /unsupported keyword oneOf/);
});

test('6 skills: frontmatter, <= 300 lines, reference existing schemas', () => {
  const dirs = fs.readdirSync(path.join(pack, 'skills'), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
  assert.deepEqual(dirs, [...SKILLS].sort());
  for (const name of SKILLS) {
    const text = fs.readFileSync(path.join(pack, 'skills', name, 'SKILL.md'), 'utf8');
    assert.ok(text.split('\n').length <= 300, `${name}: more than 300 lines`);
    const fm = text.match(/^---\n([\s\S]*?)\n---\n/);
    assert.ok(fm, `${name}: frontmatter`);
    assert.match(fm[1], new RegExp(`^name: ${name}$`, 'm'), `${name}: name`);
    assert.match(fm[1], /^description: \S.{19,}$/m, `${name}: description`);
    const refs = [...text.matchAll(/schemas\/([a-z-]+)\.schema\.json/g)].map((m) => m[1]);
    assert.ok(refs.length > 0, `${name}: references no schema`);
    for (const ref of refs) assert.ok(SCHEMAS.includes(ref), `${name}: unknown schema ${ref}`);
  }
});

test('agent-pack/claude does not weaken .claude/', () => {
  const repo = readJson(path.join(root, '.claude/settings.json'));
  const packed = readJson(path.join(pack, 'claude/settings.json'));
  // Repository-only paths (generated content, hosting config) are not part of the pack.
  const repoOnly = (rule) => /\((\.openai|src\/content|public)\//.test(rule);
  for (const rule of repo.permissions.deny.filter((r) => !repoOnly(r))) assert.ok(packed.permissions.deny.includes(rule), `missing deny ${rule}`);
  // No permission may be widened: only keys the repository has, no allow/ask/defaultMode beyond it.
  for (const key of Object.keys(packed)) assert.ok(Object.hasOwn(repo, key), `extra settings key ${key}`);
  assert.deepEqual(Object.keys(packed.permissions), Object.keys(repo.permissions));
  assert.deepEqual(packed.hooks, repo.hooks);
  for (const file of ['guard-git.sh', 'guard_git.py']) {
    assert.ok(fs.readFileSync(path.join(pack, 'claude/hooks', file)).equals(fs.readFileSync(path.join(root, '.claude/hooks', file))), `${file} differs from .claude/hooks`);
  }
});
