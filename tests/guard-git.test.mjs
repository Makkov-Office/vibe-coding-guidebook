// Regression test for the PreToolUse guard (.claude/hooks/guard-git.sh), P1-01b.
// Matrix D01–D53 from docs/evidence/p1-01-guard-hook.md plus bypass and
// fail-closed cases. Every command is passed to the hook as a JSON payload on
// stdin and is never executed. Git repositories live in a temporary directory.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const hook = path.join(root, '.claude/hooks/guard-git.sh');
const baseHook = path.join(root, 'tests/fixtures/guard-git.base-1aa11d9.sh');
const settingsPath = path.join(root, '.claude/settings.json');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-git-'));
process.on('exit', () => fs.rmSync(tmp, { recursive: true, force: true }));

// Isolated git environment: no user/system config, fixed identity.
const env = {
  PATH: process.env.PATH,
  HOME: tmp,
  LANG: 'C.UTF-8',
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_CONFIG_GLOBAL: path.join(tmp, 'gitconfig'),
  GIT_AUTHOR_NAME: 'probe', GIT_AUTHOR_EMAIL: 'probe@example.invalid',
  GIT_COMMITTER_NAME: 'probe', GIT_COMMITTER_EMAIL: 'probe@example.invalid',
};
fs.writeFileSync(env.GIT_CONFIG_GLOBAL, '');
function git(cwd, ...args) {
  const r = spawnSync('git', args, { cwd, env, encoding: 'utf8' });
  assert.equal(r.status, 0, `git ${args.join(' ')}: ${r.stderr}`);
  return r.stdout.trim();
}

// main checkout on main + linked worktrees, the layout CLAUDE.md prescribes
const R = {
  remote: path.join(tmp, 'remote.git'),
  main: path.join(tmp, 'checkout'),          // main checkout, branch main
  task: path.join(tmp, 'checkout/.claude/worktrees/task'), // worktree, branch p1-01-task
  up: path.join(tmp, 'up'),                  // worktree whose upstream is main
  det: path.join(tmp, 'det'),                // detached HEAD worktree
  plain: path.join(tmp, 'plain'),            // not a git repository
  missing: path.join(tmp, 'does-not-exist'),
};
git(tmp, 'init', '-q', '--bare', R.remote);
git(tmp, 'init', '-q', '-b', 'main', R.main);
git(R.main, 'commit', '-q', '--allow-empty', '-m', 'seed');
git(R.main, 'remote', 'add', 'origin', R.remote);
git(R.main, 'worktree', 'add', '-q', '-b', 'p1-01-task', R.task, 'main');
git(R.task, 'config', 'branch.p1-01-task.remote', 'origin');
git(R.task, 'config', 'branch.p1-01-task.merge', 'refs/heads/p1-01-task');
git(R.main, 'worktree', 'add', '-q', '-b', 'p1-up-main', R.up, 'main');
git(R.up, 'config', 'branch.p1-up-main.remote', 'origin');
git(R.up, 'config', 'branch.p1-up-main.merge', 'refs/heads/main');
git(R.main, 'worktree', 'add', '-q', '--detach', R.det, 'main');
git(R.task, 'config', 'alias.pf', 'push -f');
git(R.task, 'config', 'alias.wipe', '!git reset --hard');
git(R.task, 'config', 'alias.st', 'status');
fs.mkdirSync(R.plain);
// a fake git that records being started: the hook must never run it (finding 3 of review 4347f95)
const fakebin = path.join(tmp, 'fakebin');
const fakeMarker = path.join(tmp, 'fake-git-ran');
fs.mkdirSync(fakebin);
fs.writeFileSync(path.join(fakebin, 'git'), `#!/bin/sh\necho ran >> '${fakeMarker}'\necho p1-01-task\n`, { mode: 0o755 });
assert.equal(git(R.main, 'symbolic-ref', '--short', 'HEAD'), 'main');
assert.equal(git(R.task, 'symbolic-ref', '--short', 'HEAD'), 'p1-01-task');

function payload(command, cwd) {
  const p = { session_id: 'test', hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command } };
  if (cwd !== undefined) p.cwd = cwd;
  return JSON.stringify(p);
}
function runHook(input, { script = hook, projectDir = R.main, extraEnv = {}, cwd = tmp } = {}) {
  const e = { ...env, ...extraEnv };
  if (projectDir === null) delete e.CLAUDE_PROJECT_DIR; else e.CLAUDE_PROJECT_DIR = projectDir;
  const r = spawnSync('bash', [script], { input, env: e, cwd, encoding: 'utf8', timeout: 30000 });
  return { code: r.status, stderr: r.stderr };
}
const verdict = (code) => (code === 2 ? 'block' : code === 0 ? 'allow' : `exit ${code}`);

// [id, command, payload cwd, expected, CLAUDE_PROJECT_DIR (default: main checkout on main)]
const T = R.task;
const M = R.main;
const matrix = [
  ['D01', 'git push origin main', T, 'block'],
  ['D02', 'git push origin HEAD:main', T, 'block'],
  ['D03', 'git push origin HEAD:refs/heads/main', T, 'block'],
  ['D04', 'git push origin refs/heads/main', T, 'block'],
  ['D05', 'git push origin +main', T, 'block'],
  ['D06', 'git push origin main:main', T, 'block'],
  ['D07', 'git  push  origin  main', T, 'block'],
  ['D08', 'git\tpush origin main', T, 'block'],
  ['D09', 'git -C /tmp/x push origin main', T, 'block'],
  ['D10', 'git push -u origin main', T, 'block'],
  ['D11a', 'git push', T, 'allow'],              // upstream of the task branch is itself
  ['D11b', 'git push', R.up, 'block'],           // upstream is main
  ['D11c', 'git push', M, 'block'],              // current branch is main
  ['D12a', 'git push origin HEAD', T, 'allow'],
  ['D12b', 'git push origin HEAD', M, 'block'],
  ['D13', 'git push --force origin p1-x', T, 'block'],
  ['D14', 'git push -f origin p1-x', T, 'block'],
  ['D15', 'git push origin p1-x -f', T, 'block'],
  ['D16', 'git push --force-with-lease origin p1-x', T, 'block'],
  ['D17', 'git push origin +p1-x', T, 'block'],
  ['D18', 'git -C /tmp/x push --force origin p1-x', T, 'block'],
  ['D19', 'git reset --hard', T, 'block'],
  ['D20', 'git reset  --hard', T, 'block'],
  ['D21', 'git -C /tmp/x reset --hard', T, 'block'],
  ['D22', 'git reset --hard=HEAD', T, 'block'],
  ['D23', 'git clean -fd', T, 'block'],
  ['D24', 'git clean -fdx', T, 'block'],
  ['D25', 'git clean -df', T, 'block'],
  ['D26', 'git clean -x -f -d', T, 'block'],
  ['D27', 'git clean --force -d', T, 'block'],
  ['D28', 'git commit -m x', M, 'block'],
  ['D29a', `cd ${M} && git commit -m x`, T, 'block'],
  ['D29b', `cd ${T} && git commit -m x`, M, 'allow'],
  ['D30', `git -C ${M} commit -m x`, T, 'block'],
  ['D31', 'git -c user.name=x commit -m x', M, 'block'],
  ['D32', 'git commit -m x', T, 'allow', T],
  ['D33', 'git commit -m x', T, 'allow', null],
  ['D34', 'git merge origin/main', M, 'block'],
  ['D35', 'git rebase origin/main', M, 'block'],
  ['D36', 'git branch -D p1-x', T, 'block'],
  ['D37', 'git branch --delete --force p1-x', T, 'block'],
  ['D38', 'git worktree remove --force /tmp/x', T, 'block'],
  ['D39', 'git worktree remove -f /tmp/x', T, 'block'],
  ['D40', 'git push origin p1-01-task', T, 'allow'],
  ['D41', 'git push -u origin p1-01-task', T, 'allow'],
  ['D42', 'git push origin maintenance', T, 'allow'],
  ['D43', 'echo "git reset --hard"', T, 'allow'],
  ['D44', "git log --grep='git push origin main'", T, 'allow'],
  ['D45', 'git status', T, 'allow'],
  ['D49', 'git commit -m x', T, 'allow', R.up],  // CLAUDE_PROJECT_DIR on a branch other than the target
  ['D50', 'git commit -m x', T, 'allow', M],     // CLAUDE_PROJECT_DIR = main checkout on main
  ['D51', 'git push --mirror origin', T, 'block'],
  ['D52', 'git push origin :main', T, 'block'],
  ['D53', 'git push origin --delete main', T, 'block'],
];

// Bypass forms of the same actions and fail-closed cases (E = extra).
const extra = [
  ['E01', 'bash -c "git push origin main"', T, 'block'],
  ['E02', "sh -lc 'git reset --hard'", T, 'block'],
  ['E03', 'eval git push --force origin x', T, 'block'],
  ['E04', 'echo $(git push origin main)', T, 'block'],
  ['E05', 'echo `git reset --hard`', T, 'block'],
  ['E06', 'env FOO=1 git push origin main', T, 'block'],
  ['E07', 'sudo -n git reset --hard', T, 'block'],
  ['E08', '/usr/bin/git push origin main', T, 'block'],
  ['E09', '\\git push origin main', T, 'block'],
  ['E10', 'command git push -f origin x', T, 'block'],
  ['E11', 'timeout 5 git push origin x --force', T, 'block'],
  ['E12', "git -c alias.p='push --force' p origin x", T, 'block'],
  ['E13', 'git pf origin x', T, 'block'],                 // repo alias pf = push -f
  ['E14', 'git wipe', T, 'block'],                        // repo alias !git reset --hard
  ['E15', 'git st', T, 'allow'],                          // harmless alias
  ['E16', 'echo "git reset --hard" | bash', T, 'block'],
  ['E17', 'echo "git push origin main" > run.sh', T, 'block'],
  ['E18', `python3 -c "import os; os.system('git reset --hard')"`, T, 'block'],
  ['E19', 'git push origin "$BRANCH"', T, 'block'],
  ['E20', 'git push --all origin', T, 'block'],
  ['E21', 'git push --prune origin', T, 'block'],
  ['E22', 'git push origin :', T, 'block'],
  ['E23', "git push origin 'refs/heads/*:refs/heads/*'", T, 'block'],
  ['E24', 'git push origin -uf p1-x', T, 'block'],
  ['E25', 'git push -d origin main', T, 'block'],
  ['E26', 'git push origin HEAD:mainline', T, 'allow'],
  ['E27', 'git push origin feature main', T, 'block'],
  ['E28', 'git clean -n', T, 'allow'],
  ['E29', 'git clean -nd', T, 'allow'],
  ['E30', 'git clean -fdx -n', T, 'block'],
  ['E31', 'git clean -d', T, 'block'],
  ['E32', 'git reset --ha', T, 'block'],
  ['E33', 'git reset --soft HEAD~1', T, 'allow'],
  ['E34', 'git commit -am "docs: git push origin main is forbidden"', T, 'allow'],
  ['E35', 'git commit -am "docs: git push origin main is forbidden"', M, 'block'],
  ['E36', "git commit -m \"$(cat <<'EOF'\nfix: guard\n\nbody line\nEOF\n)\"", T, 'allow'],
  ['E37', "git commit -m \"$(cat <<'EOF'\nfix: guard\nEOF\n)\"", M, 'block'],
  ['E38', 'git checkout main && git commit -m x', T, 'block'],
  ['E39', 'git commit -m x', undefined, 'block'],         // no cwd in payload
  ['E40', 'git commit -m x', 'relative/dir', 'block'],    // cwd not absolute
  ['E41', 'git commit -m x', R.plain, 'block'],           // not a repository: branch unknown
  ['E42', `cd ${R.missing} && git commit -m x`, T, 'block'],
  ['E43', 'git commit -m x', R.det, 'allow'],             // detached HEAD does not move main
  ['E44', 'git rebase origin/p1-x main', T, 'block'],
  ['E45', "git rebase -x 'git push -f origin x' origin/main", T, 'block'],
  ['E46', 'git fetch origin && git log --oneline -3', T, 'allow'],
  ['E47', `git worktree add -b p1-02-x ${tmp}/wt2 origin/main`, T, 'allow'],
  ['E48', 'cd $SOMEWHERE && git commit -m x', T, 'block'],
  ['E49', 'git -C "$DIR" commit -m x', T, 'block'],
  ['E50', 'echo ok; git status; ls -la', T, 'allow'],
  ['E51', 'npm test', T, 'allow'],
  ['E52', 'xargs git reset < list.txt', T, 'block'],
  ['E53', 'find . -name x -exec git reset --hard \\;', T, 'block'],
  ['E54', "git config alias.z '!git reset --hard'", T, 'block'],
  ['E55', 'env -C /tmp git push origin main', T, 'block'],
  ['E56', `git -C ${M} -c user.name=x commit -m x`, T, 'block'],
  ['E57', 'GIT_DIR=$X git commit -m x', T, 'block'],
  ['E58', 'git push origin HEAD', R.det, 'block'],        // detached: destination unknown
  ['E59', 'git cherry-pick abc', M, 'block'],
  ['E60', 'git revert HEAD', M, 'block'],
  ['E61', 'git push origin p1-01-task --dry-run', T, 'allow'],
  ['E62', 'git push origin main --dry-run', T, 'block'],
  ['E63', 'git branch -d p1-merged', T, 'allow'],
  ['E64', "printf '%s\\n' 'git clean -fdx' | sh", T, 'block'],
  ['E65', 'git worktree remove /tmp/x', T, 'allow'],
  ['E66', 'git -C /tmp git push origin main', T, 'block'],
  ['E67', "cat <<'EOF' > notes.txt\ngit reset --hard\nEOF", T, 'block'], // file output: data may become a script
  ['E68', "cat <<'EOF'\ngit clean\nEOF", T, 'allow'],            // heredoc body is data, not a command
  ['E69', `export GIT_DIR=${M}/.git && git commit -m x`, T, 'block'],
  ['E70', `GIT_WORK_TREE=${M}; git push`, T, 'block'],
  ['E71', `GIT_DIR=${M}/.git git commit -m x`, T, 'block'],
  ['E72', 'export FOO=1 && git commit -m x', T, 'allow'],
  // review 4347f95, finding 1: brace expansion and globs produce other words
  ['B01', 'git reset --hard{,}', T, 'block'],
  ['B02', 'git push {--force,} origin p1-01-task', T, 'block'],
  ['B03', 'git push origin main{,}', T, 'block'],
  ['B04', 'git push origin HEAD:main{,}', T, 'block'],
  ['B05', 'git push origin :main{,}', T, 'block'],
  ['B06', 'git push origin {HEAD:main,x}', T, 'block'],
  ['B07', 'git worktree remove --force{,} ../task', T, 'block'],
  ['B08', 'git reset --hard*', T, 'block'],
  ['B09', 'git push origin {main,}', T, 'block'],
  ['B10', 'git push origin ma{i,}n', T, 'block'],
  ['B11', 'git {push,} origin main', T, 'block'],
  ['B12', 'git push --mirror{,}', T, 'block'],
  ['B13', 'git branch --delete --force{,} x', T, 'block'],
  ['B14', 'touch ./--hard && git reset --har[d]', T, 'block'],
  ['B15', 'git push origin {m..m}ain', T, 'block'],
  ['B16', 'git push origin @(main)', T, 'block'],        // extglob
  ['B17', '{git,x} push origin main', T, 'block'],
  ['B18', 'git -{C,x} . push origin main', T, 'block'],
  ['B19', 'git branch $OPT x', T, 'block'],
  ['B20', 'git worktree $SUB --force x', T, 'block'],
  ['B21', 'git push $R', T, 'block'],
  ['B30', 'git reset --soft HEAD@{1}', T, 'allow'],      // no comma: not a brace expansion
  ['B31', 'git log --oneline @{u}..HEAD', T, 'allow'],
  ['B32', 'git add docs/*.md && git commit -m x', T, 'allow'],
  ['B33', '[ -f x ] && git push origin p1-01-task', T, 'allow'],
  ['B34', 'git commit -m "fix: {a,b} and *"', T, 'allow'],  // quoted: no expansion
  ['B35', 'for f in *.md; do echo $f; done', T, 'allow'],
  // finding 2: state changed earlier in the same call
  ['S01', 'git checkout main && git push origin HEAD', T, 'block'],
  ['S02', 'git switch main; git push', T, 'block'],
  ['S03', 'git checkout -B main && git push origin HEAD', T, 'block'],
  ['S04', 'git config alias.p push && git p origin main', T, 'block'],
  ['S05', 'git config push.default matching && git push', T, 'block'],
  ['S06', "git config remote.origin.push 'refs/heads/*:refs/heads/*' && git push", T, 'block'],
  ['S07', 'git branch -m main && git push origin HEAD', T, 'block'],
  ['S08', 'git symbolic-ref HEAD refs/heads/main && git commit -m x', T, 'block'],
  ['S09', "bash -c 'git checkout main' && git commit -m x", T, 'block'],
  ['S10', 'git checkout -b x --track origin/main && git push', T, 'block'],
  ['S11', 'git branch -u origin/main && git push', T, 'block'],
  ['S12', 'git remote set-url origin /tmp/x && git push', T, 'block'],
  ['S20', 'git switch -c p1-new && git push -u origin HEAD', T, 'allow'],
  ['S21', 'git checkout p1-01-task && git push origin HEAD', T, 'allow'],
  ['S22', 'git push -u', T, 'allow'],
  ['S23', 'git config user.name && git push', T, 'allow'],
  ['S24', 'git config --get push.default; git push', T, 'allow'],
  ['S25', 'git branch --show-current && git push', T, 'allow'],
  ['S26', 'git remote -v && git push', T, 'allow'],
  // finding 3: the command's PATH / LD_* / DYLD_* never select the git the hook runs
  ['P01', `PATH=${fakebin} git push origin HEAD`, T, 'block'],
  ['P02', `PATH+=:${fakebin} git push origin HEAD`, T, 'block'],
  ['P03', `export PATH=${fakebin} && git status`, T, 'block'],
  ['P04', 'LD_PRELOAD=/x.so git status', T, 'block'],
  ['P05', 'env DYLD_INSERT_LIBRARIES=/x git push origin p1-01-task', T, 'block'],
  ['P06', `GIT_DIR="${M}/.git" git commit -m x`, T, 'block'],  // quoted value is still an assignment
  ['P10', 'FOO="a b" git status', T, 'allow'],
  ['P11', 'export PATH="$HOME/bin:$PATH" && npm test', T, 'allow'],
  // finding 5: computed program name
  ['C01', '$(printf git) push origin main', T, 'block'],
  ['C02', '${GIT:-git} reset --hard', T, 'block'],
  ['C03', '$X push origin main', T, 'block'],
  ['C10', '"$PY" script.py --verbose', T, 'allow'],
];

for (const [id, command, cwd, expected, projectDir] of [...matrix, ...extra]) {
  test(`${id}: ${JSON.stringify(command)} → ${expected}`, () => {
    const r = runHook(payload(command, cwd), { projectDir: projectDir === undefined ? M : projectDir });
    assert.equal(verdict(r.code), expected, `stderr: ${r.stderr}`);
    if (expected === 'block') assert.match(r.stderr, /^guard-git: /);
  });
}

test('D46/D47: unparseable payload is blocked only when it mentions git', () => {
  assert.equal(verdict(runHook('{"tool_input":{"command":"git push origin main"').code), 'block');
  assert.equal(verdict(runHook('{"tool_input":{"command":"ls -la"').code), 'allow');
  assert.equal(verdict(runHook('{"tool_input":{}}').code), 'allow');
});

// D48 and F2: the hook command line from settings.json must fail closed.
const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
const entry = settings.hooks.PreToolUse.find((h) => h.matcher === 'Bash').hooks[0];

test('settings: guard hook is a blocking command hook on Bash', () => {
  assert.equal(entry.type, 'command');
  assert.equal(entry.onFailure, 'block');
  assert.ok(Number.isInteger(entry.timeout) && entry.timeout > 0);
  assert.match(entry.command, /\$CLAUDE_PROJECT_DIR\/\.claude\/hooks\/guard-git\.sh/);
});

for (const shell of ['sh', 'bash']) {
  test(`D48 (${shell}): settings command line fails closed without CLAUDE_PROJECT_DIR`, () => {
    const e = { ...env };
    delete e.CLAUDE_PROJECT_DIR;
    for (const command of ['git push origin main', 'ls']) {
      const r = spawnSync(shell, ['-c', entry.command], { input: payload(command, T), env: e, cwd: tmp, encoding: 'utf8' });
      assert.equal(r.status, 2, `${command}: ${r.stderr}`);
      assert.match(r.stderr, /fail closed/);
    }
  });
  test(`settings command line (${shell}): a normal block prints only the hook's reason`, () => {
    const e = { ...env, CLAUDE_PROJECT_DIR: root };
    const r = spawnSync(shell, ['-c', entry.command], { input: payload('git push origin main', T), env: e, cwd: tmp, encoding: 'utf8' });
    assert.equal(r.status, 2);
    assert.match(r.stderr, /^guard-git: заблокировано — push в main/);
    assert.doesNotMatch(r.stderr, /не запустился/);
    assert.equal(r.stderr.trim().split('\n').length, 1, r.stderr);
  });
  test(`settings command line (${shell}) with CLAUDE_PROJECT_DIR = repository root`, () => {
    const e = { ...env, CLAUDE_PROJECT_DIR: root };
    const run = (command, cwd) => spawnSync(shell, ['-c', entry.command], { input: payload(command, cwd), env: e, cwd: tmp, encoding: 'utf8' }).status;
    assert.equal(run('git push origin main', T), 2);
    assert.equal(run('git status', T), 0);
    assert.equal(run('git commit -m x', T), 0);
    assert.equal(run('git commit -m x', M), 2);
  });
}

test('fail closed: python3 unavailable', () => {
  const noPython = { PATH: path.join(tmp, 'empty-path') };
  fs.mkdirSync(noPython.PATH, { recursive: true });
  const r = spawnSync('/bin/bash', [hook], { input: payload('git status', T), env: noPython, encoding: 'utf8' });
  assert.equal(r.status, 2, r.stderr);
  const ok = spawnSync('/bin/bash', [hook], { input: payload('ls', T), env: noPython, encoding: 'utf8' });
  assert.equal(ok.status, 0, ok.stderr);
});

test("the hook never runs a git chosen by the command's PATH", () => {
  fs.rmSync(fakeMarker, { force: true });
  for (const command of [`PATH=${fakebin} git push origin HEAD`, `PATH=${fakebin}:$PATH git commit -m x`,
    `env PATH=${fakebin} git push`, `export PATH=${fakebin}; git push`]) {
    assert.equal(verdict(runHook(payload(command, T)).code), 'block', command);
  }
  assert.ok(!fs.existsSync(fakeMarker), 'fake git from the command PATH was started');
  // the hook's own PATH decides: a fake git first in it is used, so the check is meaningful
  const r = runHook(payload('git push origin HEAD', T), { extraEnv: { PATH: `${fakebin}:${env.PATH}` } });
  assert.equal(verdict(r.code), 'allow', r.stderr);
  assert.ok(fs.existsSync(fakeMarker), 'control: fake git from the hook PATH was not started');
  fs.rmSync(fakeMarker, { force: true });
  assert.equal(verdict(runHook(payload(`PATH=${fakebin} git push origin HEAD`, T)).code), 'block');
  assert.ok(!fs.existsSync(fakeMarker), 'fake git from the command PATH was started');
});

test('fail closed: analyzer script missing or crashing', () => {
  const dir = fs.mkdtempSync(path.join(tmp, 'hookcopy-'));
  fs.copyFileSync(hook, path.join(dir, 'guard-git.sh'));
  assert.equal(runHook(payload('git status', T), { script: path.join(dir, 'guard-git.sh') }).code, 2);
  fs.writeFileSync(path.join(dir, 'guard_git.py'), 'import sys\nsys.exit(1)\n');
  assert.equal(runHook(payload('ls', T), { script: path.join(dir, 'guard-git.sh') }).code, 2);
  fs.writeFileSync(path.join(dir, 'guard_git.py'), 'raise RuntimeError("boom")\n');
  assert.equal(runHook(payload('ls', T), { script: path.join(dir, 'guard-git.sh') }).code, 2);
});

// Differential test: nothing the previous hook (base 1aa11d9) blocked is allowed
// now, except the false positives F5 named and the F4 fix (target repository
// comes from cwd, not CLAUDE_PROJECT_DIR; here both point to the same repository).
const INTENDED = new Set(['D29b', 'D42', 'D43', 'D44', 'E26', 'E34', 'X-commit-msg', 'X-grep', 'X-mainfeature']);
test('fixture is the hook from base 1aa11d9', () => {
  const sha = crypto.createHash('sha256').update(fs.readFileSync(baseHook)).digest('hex');
  assert.equal(sha, 'b1d3439eddfd1637bf9e75ef8796cba6945c6174ae47ed294f208ec852a3e6bc');
});
test('differential: no weakening against the base hook', () => {
  const corpus = [
    ...matrix, ...extra,
    ['X-commit-msg', 'git commit -m "note: git push --force is banned"', T],
    ['X-grep', "grep -rn 'git branch -D' docs", T],
    ['X-mainfeature', 'git push origin main-feature', T],
    ['X-sub', 'npm run x -- "git push origin main"', T],
    ['X-py', "python3 -c 'print(\"git worktree remove --force\")'", T],
    ['X-cat', 'cat <<EOF | sh\ngit reset --hard\nEOF', T],
  ];
  const differences = [];
  for (const [id, command, cwd] of corpus) {
    if (cwd === undefined || !path.isAbsolute(cwd)) continue;
    for (const dir of [cwd, M]) {
      const before = verdict(runHook(payload(command, dir), { script: baseHook, projectDir: dir, cwd: fs.existsSync(dir) ? dir : tmp }).code);
      const after = verdict(runHook(payload(command, dir), { projectDir: dir }).code);
      if (before === 'block' && after !== 'block' && !INTENDED.has(id)) differences.push(`${id} @${dir}: ${command}`);
    }
  }
  assert.deepEqual(differences, []);
});
