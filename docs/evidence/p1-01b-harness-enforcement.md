# Evidence P1-01b: enforcement harness in cloud sessions and the guard hook

Ticket: [#17](https://github.com/Makkov-Office/vibe-coding-guidebook/issues/17) (P1-01b). Risk: High. Founder gate: a comment in the issue of 2026-10-22 04:28 UTC (changing `.claude/` is allowed within the ticket; merge is a separate founder decision).
Branch base: `1aa11d9d7a08b2b768b1dcff724724ee014d5f66`; after the review, `origin/main` was merged into the branch: `a4d1215` (P1-03 #14, P1-04 #15) with merge commit `66cc48c`, then `80b066e` (P1-09 #19) with merge commit `8d99ac1`.
The code the checks below refer to: commit `08ce6f69a351048d9596a9108a180eeb6bf3f9e9` (branch `p1-01b-harness-enforcement`; the M-F4 fix is `b3e758b` and `08ce6f6`, with a merge of `origin/main` `5d0b6df`, P1-06 #23, between them in commit `0a16ee2`). This revision of the document was added by the next commit and changes only documentation. History: code `47c0282`, review on `4347f95` — NOT READY (fixes `050ebe2`); review on `2b2e740` — NOT READY (`fdbe7fe`); review on `a3cbe31` — NOT READY, one MEDIUM (`b3e758b`, `08ce6f6`); see the "Review …" sections below.
Check date: 2026-10-22, 04:30–13:00 UTC. Input data: `docs/evidence/p1-01-guard-hook.md` (findings F1–F7, matrix D01–D53, probes L01–L22) and the review findings — rechecked, not accepted as a decision.

| File at `08ce6f6` | sha256 |
|---|---|
| `.claude/settings.json` | `9cb0b80f40f1e092ecd7a549e113aced1d52dd80d09ce4aaa84b13344b85ac37` |
| `.claude/hooks/guard-git.sh` | `62d79cf12d71fc65f3b1f85034727b0ff913edb4960d7df5f63e667933d80b7e` |
| `.claude/hooks/guard_git.py` | `5b2b0190efa3b4c3970a8cd7cc76a62dc5127f8c0000b59a22754dc73acb7538` |
| `tests/guard-git.test.mjs` | `ef35bfdff323d9a26f1b94d56646552c2e6a09ff1acf14de400490746c2b7f11` |
| `tests/fixtures/guard-git.base-1aa11d9.sh` (copy of the hook from base) | `b1d3439eddfd1637bf9e75ef8796cba6945c6174ae47ed294f208ec852a3e6bc` (matches P1-01) |

## Result

| Acceptance criterion (#17) | Result | Basis |
|---|---|---|
| Probes L01–L22 in a live cloud session: BLOCKED where expected; a commit in a task worktree goes through | **BLOCKED → moved to #21** | Founder decision: AC1 (live probes) moved to a separate ticket #21; live probes are not required in this PR. Reason for BLOCKED: in a Claude Code Projects cloud thread, permission rules and hooks from the repository's `.claude/settings.json` are not applied (documentation, section F1). This is a property of the environment and cannot be switched on from the repository. Repeat probes in this session after the change are still NOT BLOCKED (part C). A probe in a nested local `claude -p` session was rejected by the auto mode classifier (`[Create Unsafe Agents]`). A commit in a task worktree goes through (`47c0282`) |
| The matrix regression test is green in CI | **PASS** | CI (P1-04, #15 in `main`): run `39760750479`, head `08ce6f6` — success (`npm ci`, `npm run validate`, including `npm test`); CI on the HEAD with this revision of the document is in the PR body. Fresh clone of `08ce6f6`: `npm test` 253/253, `npm run validate` PASS |
| A hook with a missing script/error blocks (fail closed) | **PASS** (test), live — not checked | `tests/guard-git.test.mjs`: D48 via the command line from `settings.json` under `sh` and `bash`, missing python3, missing/crashing analyzer — exit 2. `onFailure: "block"` is supported by the installed CLI 2.1.307 (section F2) |

## F1: why deny and the hook are not applied in this session

### Observations in the session

| Parameter | Value |
|---|---|
| Session type | Claude Code project cloud thread: `CLAUDE_CODE_ENTRYPOINT=remote_projects`, `CLAUDE_CODE_PROJECTS_SESSION=1`, `CLAUDE_CODE_REMOTE=true`, `CLAUDE_CODE_REMOTE_ENVIRONMENT_TYPE=cloud_default` (Anthropic-hosted); the author is a subagent (`CLAUDE_CODE_CHILD_SESSION=1`) in an isolated worktree |
| CLI version | `claude --version` → `2.1.307`; the session's diagnostic log, event `started` → `"version": "2.1.307"`. The variable `CLAUDE_CODE_VERSION=2.1.42` does not match this; what it denotes is not established |
| Project directory | the main checkout `/home/claude/vibe-coding-guidebook` (branch `main`); `CLAUDE.md` from it is loaded |
| Diagnostic log | `settings_load_completed {"source_count": 2, "error_count": 0}` (8 times); the log does not name the sources, so no conclusion about which files were loaded can be drawn from the log |
| Probes | L01, L05, L06, L07, L10, L20, L21, L22 after the change — neither a deny message nor the `guard-git:` text (part C). L01 (`echo "git reset --hard"`) went through, although the hook from the main checkout (base version) blocks it (D43 in P1-01): the hook does not run in this session |
| Not checked | `/status` (`Setting sources`) and `claude doctor` are not available in this session; reading the session launch settings (`launcher-settings.json`) was rejected by the classifier (`[Credential Exploration]`) and was not performed |

### Claude Code documentation (checked 2026-10-22)

1. [Settings → Settings in cloud sessions](https://code.claude.com/docs/en/settings#settings-in-cloud-sessions):
   > **Cloud threads in a project**: in a cloud thread in a project, none of a repository's `.claude/settings.json` permission rules, hooks, or `env` apply, however many repositories the project has.

   > **Shared project settings** (`.claude/settings.json`): read in a session with one repository outside a project's threads, because the file is part of the clone and the session starts inside it.

   > **User and project local settings** (`~/.claude/settings.json` and `.claude/settings.local.json`): not read.

   > **Managed settings**: a `managed-settings.json` file or MDM profile on your device doesn't reach a cloud session. Your organization's server-managed settings do.
2. [Projects → What threads pick up from your repositories](https://code.claude.com/docs/en/claude-projects#what-threads-pick-up-from-your-repositories):
   > Permission rules, hooks, and `env` come only from the `.claude/settings.json` in the directory the thread starts in.

   The table there: for a project with **one** repository — "Apply to the thread"; with **several** — "Don't apply in an Anthropic-hosted environment". Section "Unblock a thread waiting on approval":
   > **Several repositories, Anthropic-hosted environment**: no repository's permission rules reach a cloud thread, so you rely on auto mode and on the approvals you give inside each thread.
3. [Cloud environments → What carries over from your setup](https://code.claude.com/docs/en/cloud-environments#what-carries-over-from-your-setup): "Your repo's `.claude/settings.json` hooks and permission rules — Yes, in a session with one repository".
4. [Hooks reference](https://code.claude.com/docs/en/hooks): "Hooks from settings files, managed policy settings, and plugins also run inside subagents" — per the documentation, the fact that the author works as a subagent is not the cause.
5. [Server-managed settings](https://code.claude.com/docs/en/server-managed-settings): "Server-managed settings are available for Claude for Teams and Claude for Enterprise customers"; [Projects](https://code.claude.com/docs/en/claude-projects): "Projects are in public beta on Pro and Max plans … They aren't available on Team or Enterprise plans yet". So right now it is impossible to both work in Projects and deliver policy through server-managed settings.
6. [Projects → Run a thread on your own computer](https://code.claude.com/docs/en/claude-projects#run-a-thread-on-your-own-computer): such a thread "Works with the files, tools, MCP servers, and Claude Code settings on that machine, including its hooks and permission rules".

### Conclusion

- **Confirmed (documentation + observation):** the cause of F1 is the environment, not the repository. This project's sessions are Claude Code Projects cloud threads; per the Settings page, permission rules and hooks from the repository's `.claude/settings.json` are not applied in such threads. The observation in two sessions (P1-01 and this one) matches this: deny and the hook never fire.
- **A contradiction between sources (external ones, not the ticket):** the Projects page claims that in a project with one repository the rules and hooks are applied. How many repositories this project has and where the thread starts could not be established from the session (viewing directories outside the worktree was rejected by isolation). Hypotheses: H1 — the project has more than one repository, or the thread starts above the clone; H2 — the Settings page is right (project threads never apply the rules). Neither hypothesis opens a way to switch on enforcement from the repository.
- **A hypothesis not confirmed by a source:** write `managed-settings.json` inside the VM via the cloud environment's setup script. The documentation describes reading such a file only for a self-hosted environment; not for Anthropic-hosted. Do not rely on it without a separate live check.
- In addition (per the Hooks documentation, "Reference scripts by path"): the hook command refers to `$CLAUDE_PROJECT_DIR/.claude/hooks/guard-git.sh`, and `CLAUDE_PROJECT_DIR` is the root where the session started (the main checkout). Where settings are applied, until merge it is the hook version from `main` that runs, not the one from the PR branch.

### What the founder needs to do outside the repository

1. **A GitHub ruleset for `main`** (Settings → Rules → Rulesets): a required PR, no force push or deletion, no bypass for agents. The only protection of `main` that works in Projects cloud threads and for any tools, including GitHub MCP (F8). Outside the scope of this ticket; part of acceptance 4.5.
2. For work that needs a working hook and deny: run the thread on your own computer via Remote Control (documentation, item 6) or a cloud session with one repository **outside** Projects (items 1, 3). Both options are described in the documentation but not checked in this ticket: after merge, repeat the probes from part D in such a session.
3. Project instructions (Project settings → Memory → Project instructions): duplicate the MUST NOT rules from AGENTS.md. Per the Projects documentation this is "Text sent to each new thread", that is, a text rule, not enforcement.
4. Server-managed settings — only on moving to Team/Enterprise (item 5).

## F2: fail closed on a hook launch error

- The hook command line in `settings.json`: `bash "…/guard-git.sh"; rc=$?; [ "$rc" -eq 0 ] && exit 0; [ "$rc" -eq 2 ] || echo "…fail closed…" >&2; exit 2`. No `CLAUDE_PROJECT_DIR`, no file, no bash, any exit code other than 0 → exit 2 (block). The "hook did not start" message is printed only for codes other than 0 and 2: an ordinary block shows one reason from the hook (review 4347f95, item 4). Works without relying on the CLI version.
- `onFailure: "block"` and `timeout: 30` on the same entry — for a timeout and for the case when the shell itself does not start. Hooks documentation: "To block the action instead, set `"onFailure": "block"` on a `command` or `http` hook. Requires Claude Code v2.1.295 or later"; "With `"block"` set, a failure does what exit code 2 does on that event". The installed CLI 2.1.307 supports the field: the binary `/opt/claude-code/bin/claude` contains the string `blocking because onFailure is "block"` (a static check, not a live one). The schemastore JSON schema (`www.schemastore.org/claude-code-settings.json`) does not yet contain the `onFailure` field and sets `additionalProperties: false` for the hook object; the documentation warns that the schema lags behind the CLI. How a CLI older than 2.1.295 behaves with an unknown field was not checked, so the `|| exit 2` fallback is kept in the command itself.
- `guard-git.sh`: before starting python3 it uses only bash builtins; no python3 or `guard_git.py` → Git commands are blocked; the analyzer returned something other than 0 or 2 → block. `guard_git.py` on an internal error → exit 2.

## F3–F5: the new guard

Design (the orchestrator's decision after the review of `2b2e740`): **the substring rules of the base hook (`1aa11d9`) are always applied to the raw text of each line** — with no exceptions for "clean" lines, inert programs or text in `-m`. The analyzer `guard_git.py` only adds blocks on top (union). So "nothing that base blocked gets through" holds by construction; the only intentional difference is F4: the commit/merge/rebase/cherry-pick rule checks the branch of the repository from the payload `cwd`; `CLAUDE_PROJECT_DIR` is checked **additionally** if the line contains a program the analyzer does not parse (an interpreter `python3`/`node`/`perl`…, `npm`, a script `bash run.sh`, `sh` without `-c`, `find`, `test -v`, a computed program name, git with a subcommand that is not among the built-in ones — it runs an external `git-<sub>`): such a program can change the directory. Block if any of the directories is on `main` or the branch cannot be determined. If the line has only git and "transparent" programs (`cd`, `echo`, `ls`, `cat`, `[ … ]` without `-v`, etc.), `CLAUDE_PROJECT_DIR` is not checked — this is how a commit in a task worktree goes through when the session started in the main checkout on `main`. The base false positives (F5: text in `echo`/`grep`/`-m`, branches `main<suffix>`, `HEAD:mainline`) are kept intentionally; fixing them is a follow-up (the orchestrator will open the ticket).

The analyzer parses the command rather than searching for substrings:
- tokenisation: quotes, escaping, `;` `&&` `||` `|` `&` newline, parentheses, comments, redirections, heredoc, `$(...)` and backticks (analysed recursively);
- stripping wrappers (`env`, `sudo`, `timeout`, `nice`, `nohup`, `time`, `command`, `exec`, `xargs`, `find -exec`, `watch`), recursive parsing of `bash -c`/`sh -c`, `eval`, `env -S`, git aliases (`-c alias.*` and from the repository config), `rebase --exec`, `bisect run`, `submodule foreach`;
- git: global options `-C`, `-c`, `--git-dir`, `--work-tree`; push — refspec with `+`, `refs/heads/`, `HEAD`/`@`, deletion, patterns, `--all`/`--branches`/`--mirror`/`--prune`, abbreviations of long options — any prefix of a dangerous option counts as that option (`--h`, `--de`, `--forc`, `--f`, `--m`; git itself rejects an ambiguous abbreviation), implicit destination (`push.default`, upstream, `remote.*.push`), `remote.<name>.mirror` (from `-c` and config — blocks any push), `remote.<name>.push` with a refspec without `:` — block; `reset --hard`; `clean` — only dry-run without force is allowed; `branch -D`/`--delete --force`; `worktree remove -f/--force`;
- the branch for commit/merge/rebase/cherry-pick/revert/am — from the payload `cwd` field, then `cd`/`pushd`/`env -C`/`sudo -D`/`git -C` inside the command and `checkout`/`switch` earlier in the same command; `CLAUDE_PROJECT_DIR` — only for the base rule when there is an opaque program in the line (F4, above). An unknown directory, a non-repository, a computed path, a change to `GIT_*` in the command → block (fail closed);
- dynamic words: `$var`, `$(...)`, brace expansion (`{a,b}`, `{1..3}`), glob (`*`, `?`, `[...]`), extglob (`@(...)`) — the value is known only at execution time. A dynamic git subcommand, global option, any push argument, options of `reset`/`clean`/`branch`/`worktree` → block;
- state within one Bash call (shared also by `bash -c`, aliases, `$(...)`): `checkout`/`switch`, `branch -m/-M/-c/-C`, `symbolic-ref HEAD …` earlier in the command add candidate branches for commit/merge/… and for `push HEAD`/`@`; writing `git config`, upstream (`branch -u`, `--track`, `push -u`, creating a branch), `git remote` earlier in the command → push without a refspec and an unknown alias are blocked;
- the git that the hook itself runs (`symbolic-ref`, `config --get`) is an absolute path from the hook's own PATH. Of the command's variables only `GIT_DIR`, `GIT_WORK_TREE`, `GIT_COMMON_DIR`, `GIT_CONFIG*`, `HOME`, `XDG_CONFIG_HOME` pass through. If the command changes `PATH`, `LD_*`, `DYLD_*` (prefix, `env`, `export`, `+=`) → block without running git;
- a computed program name (`$(printf git) push …`, `${GIT:-git}`, `{git,x}`) → block if it contains `git` or the first argument is a git subcommand from the list of dangerous ones (push, reset, clean, branch, worktree, checkout, switch, config, commit, merge, rebase, etc.);
- git arguments with spaces (including the values of `-m`, `--grep`) are analysed as commands: an editor (`GIT_EDITOR=sh`, `core.editor`) can execute them;
- `$'…'` accounts for `\'`; `${…}` accounts for quotes, and `$(...)` and backticks inside are analysed.

### Review 4347f95: findings and fixes

Each finding was reproduced before the fix (scratch repository: a checkout on `main` + worktree `task1`; the base hook and the `4347f95` hook).

| # | Finding (review) | Reproduction on `4347f95` | Fix (`050ebe2`) | Tests |
|---|---|---|---|---|
| 1 HIGH | brace/glob in an unquoted word was a literal; for a "git only" line the base rules were not applied | 8 forms: base block → new allow (`git reset --hard{,}`, `git push {--force,} origin task1`, `… main{,}`, `… HEAD:main{,}`, `… :main{,}`, `… {HEAD:main,x}`, `worktree remove --force{,}`, `reset --hard*`); 6 more passed both | a word with brace/glob/extglob → dyn, the line is not "clean" (the base rules apply again); dyn arguments of push, global options, `branch`, `worktree` → block | B01–B21 block, B30–B35 allow; in the differential corpus |
| 2 MEDIUM | push did not take into account `checkout`/`switch`/config earlier in the line | 6 forms: allow | `push HEAD`/`@` — candidates from the current branch and switches; push without a refspec — block on any switch or config/upstream/remote write; alias — block after a config write | S01–S12 block, S20–S26 allow |
| 3 MEDIUM | the hook ran `git` from the command's PATH | `PATH=<dir>/fakebin git push origin HEAD` — the fake git ran | absolute git from the hook's PATH, a variable allowlist, PATH/LD_*/DYLD_* → block; the assignment `X="…"` is recognised (before, the quotes made it a "program") | P01–P11; a test with a fake git and a marker: it does not run from the command's PATH, it runs from the hook's PATH (control) |
| 4 LOW | the fallback appended "hook did not start" to every block | confirmed by reading the command | the message only for codes ≠ 0, 2 | "normal block prints only the hook's reason" (`sh`, `bash`) |
| 5 LOW | CLAUDE.md without a caveat about the contradiction; the docstring "unparseable is blocked" is wrong for `$(printf git) push origin main` | allow | a caveat in CLAUDE.md; a computed program name with a git marker → block; the docstring fixed, the limitations listed | C01–C03 block, C10 allow |
| 6 LOW | the branch was behind `main` | — | merge of `origin/main` (`a4d1215`, including #14 and #15) with merge commit `66cc48c`; then `80b066e` (#19) — `8d99ac1`; no conflicts | CI run `39734047043` |

Found during the fixes and closed there as well: `PATH+=… git`, `GIT_DIR="…" git commit` (quotes in the value), `git branch -m main`, `git symbolic-ref HEAD refs/heads/main`, `bash -c 'git checkout main' && git commit` (the switch in the nested command was lost), `git push $R`, `git branch $OPT x`, `git worktree $SUB --force x`.

### Review 2b2e740: findings and fixes

Reproduced before the fix (the same scratch probes, base and the `2b2e740` hook): H1 — 6 forms base block → new allow; H2 — 9 forms base block → new allow; M1 — 4 forms and M2 — 2 forms passed both; L1 — block on a checkout of `main`; L2 — `git push origin main:feature`, `git push origin x; grep -f pat file`: base block → new allow.

| # | Finding | Fix (`fdbe7fe`) | Tests |
|---|---|---|---|
| H1 HIGH | `${…}` and `$'…'` did not make a line "unclean"; `$'…'` did not account for `\'`, `${…}` for quotes | the base rules are unconditional (the class is closed); scanning of `$'…'` and `${…}` fixed, `$(...)` inside `${…}` is analysed | R01–R07 |
| H2 HIGH | a waiver for inert programs (`printf -v`, `test -v`, `sort -o`, `rg --pre`, `--compress-program`) and for `-m` text with `GIT_EDITOR=sh` / `core.editor=sh` / `GIT_SEQUENCE_EDITOR=sh` | the waiver removed: the base rules are unconditional; the values of `-m`/`--grep` are analysed as commands | R10–R19 |
| M1 MEDIUM | abbreviations of long options (`--h`, `--de --forc`, `--f`, `--m`) | any prefix of a dangerous option (reset `--hard`; clean/branch/worktree/push `--force`; branch/push `--delete`; push `--mirror`/`--all`/`--branches`/`--prune`) | R20–R25 |
| M2 MEDIUM | the push destination from `remote.<name>.push` / `remote.<name>.mirror` | `git config --get-regexp` with the command's `-c`: mirror → block; push mapping (or a write of `remote.*` earlier in the command) + a refspec without `:` → block | R30–R35 |
| L1 LOW | `git switch -c y && git push -u origin HEAD` is blocked from a checkout on `main` | not fixed: a known false positive (HEAD candidates are the current branch plus the switches) | L1 (expects block) |
| L2 LOW | the evidence says the fuzz differences were "only mainx", but there are more | the base rules are unconditional: no differences (fuzz below); the reviewer's forms are in the differential corpus | X-mainfeature2, X-grepf |

### Review a3cbe31: finding and fix

M-F4 (MEDIUM): the base rule for commit checked only the repository from `cwd`. With `cwd` = task worktree and `CLAUDE_PROJECT_DIR` = the main checkout on `main`, a line with an interpreter that itself changes the directory went through; base blocked it (by `CLAUDE_PROJECT_DIR`), and the commit would have landed in `main`. The fuzz in the previous revision ran with `cwd` = `CLAUDE_PROJECT_DIR` and did not see this case.

Reproduced before the fix (probes, base and `a3cbe31`, `cwd` = task, `CLAUDE_PROJECT_DIR` = main): `python3 -c "…os.chdir('<main>'); os.system('true; git commit …')"`, the same scenario via `node -e` and `perl -e`, `$RUNNER sh -c 'cd <main> && git commit -m x'`, `bash run.sh; git commit -m x`, `find <main> -maxdepth 0 -execdir git commit -m x \;` — base block, new allow.

Fix (`b3e758b`; `08ce6f6` — based on the fuzz result below: an external git subcommand `git -C /tmp python3 -c …` is also opaque): if the rule matched and the line has an opaque program, `CLAUDE_PROJECT_DIR` is checked too; `CLAUDE_PROJECT_DIR` not set or not absolute → block. A computed wrapper program (`$RUNNER …`): its arguments are analysed as a command in an unknown directory: `$RUNNER sh -c "git commit -m x"` is blocked even with `cwd` = `CLAUDE_PROJECT_DIR` = task (base let it through).

Tests: F01–F11 block, F12 and F20–F25 allow; a new differential test "cwd = task worktree, CLAUDE_PROJECT_DIR = main checkout": across the whole corpus, base block → new allow is allowed only for lines that an independent oracle in the test recognises as transparent (segment heads from a fixed list, without `$`/backticks and `-v`); control — such differences exist. The oracle knows wrappers that do not change the directory (`timeout N`, `env` without `-C`/`-S`, `nice`, `nohup`, `time`, `command`).

### Regression test (`tests/guard-git.test.mjs`, in `npm test`)

A temporary structure as in CLAUDE.md: the main checkout on `main`, a worktree on a task branch, a worktree with upstream `main`, a detached worktree, a directory without git; an isolated git config. The commands are passed to the hook in the payload and are not executed.

| Group | Cases | Result at `08ce6f6` |
|---|---|---|
| P1-01 matrix | D01–D53: D11 and D12 in both conditions (a/b/c), D29 both ways, D32/D33/D49/D50 with different `CLAUDE_PROJECT_DIR` | PASS |
| Bypasses and fail closed | E01–E72 | PASS |
| Review 4347f95 | B01–B35 (brace/glob), S01–S26 (state in the command), P01–P11 (PATH/LD_*), C01–C10 (computed name) | PASS |
| Review 2b2e740 | R01–R35 (H1, H2, M1, M2), L1 | PASS |
| Review a3cbe31 | F01–F25 (M-F4, `cwd` ≠ `CLAUDE_PROJECT_DIR`) | PASS |
| D46/D47, D48 and a single message on block (`sh` and `bash`), settings, no python3, missing/crashing analyzer, fake git in PATH | 11 tests | PASS |
| Differential test against the base hook (fixture) | the whole corpus above (including B/S/P/C/R and the L2 forms) in two directories (`cwd` = `CLAUDE_PROJECT_DIR`): everything base blocked is blocked now too — **without exceptions**; the third configuration `cwd` = task, `CLAUDE_PROJECT_DIR` = main: exceptions only F4 for transparent lines (oracle) | PASS |
| Total `npm test` (content 7 + guard 246) | 253 | PASS (fresh clone of `08ce6f6`, `npm ci`; CI run `39760750479`) |

Changes in expectations compared with P1-01 (all per the findings text):
- was ALLOW, now BLOCK — the 19 unconditional F3 bypasses (D03–D05, D07–D09, D15, D17, D18, D20, D21, D25–D27, D30, D31, D37, D39, D51) and the conditional D11b/c, D12b;
- was BLOCK, now ALLOW — only F4: D49, D50, F12, F20–F23, F25 (a commit in a task worktree when `CLAUDE_PROJECT_DIR` is the main checkout on `main` and the line has no opaque programs);
- a known false positive, as in base: F07 `npm test && git commit -m x` with `CLAUDE_PROJECT_DIR` on `main` — split it into two calls;
- the F5 false positives — D42 (`maintenance`), D43 (`echo`), D44 (`git log --grep`), E26 (`HEAD:mainline`), E34 (text in `-m`) — stay BLOCK, as in base (follow-up). D29b (`cd <task> && git commit` from a checkout on `main`) — BLOCK: the base rule checks the branch by the payload `cwd`; a known false positive;
- D48: was exit 127 (fail open), now exit 2.

### The "does not weaken" check beyond the test

A differential fuzz (a script in the scratchpad, outside the repository) on the `08ce6f6` code.

Corpus:
- 30 dangerous commands: the commands of the previous revision, plus `git push origin main:feature`, `git push origin x`, the H1 form `echo $'\'' ; git push origin main # '` and `python3 -c "import os; os.chdir('<main>'); os.system('true; git commit -m x')"`;
- for each, 6 forms with brace/glob/extglob, 210 cores in total;
- 16 prefixes, including `npm test && `, `python3 x.py; `, `$RUNNER `, `bash run.sh; `;
- up to 6 suffixes;
- three directory configurations: (a) `cwd` = `CLAUDE_PROJECT_DIR` = task worktree, (b) `cwd` = `CLAUDE_PROJECT_DIR` = checkout on `main`, (c) `cwd` = task worktree, `CLAUDE_PROJECT_DIR` = checkout on `main`.

In total **51 030 cases**:
- in (a) and (b), base blocks and the new one lets through — **0**;
- in (c) — 900 cases, all recognised as intentional F4 by the same oracle as in the test (lines with only git and transparent programs, for example `timeout 9 git commit -m x`, `git commit -m x ; ls`); unexpected differences — **0**.

The new hook's exit codes are only 0 and 2.

The first run of this configuration on `0a16ee2` gave 228 unexpected cases. 200 of them were `timeout 9 git …` and `env git …`: wrappers that do not change the directory; this was an oracle error, and it was fixed. 28 were `git -C /tmp python3 -c "…chdir(<main>)…git commit…"`: an external git subcommand; this was a real gap, fixed in `08ce6f6` (test F11).

The previous revision (`fdbe7fe`, only `cwd` = `CLAUDE_PROJECT_DIR`): 39 382 cases, 0 differences.

L2, the exact list of differences in past iterations (now closed by the unconditional base rules):
- `2b2e740`, fuzz of 30 940 cases: 126 differences, all `git push origin mainx …` (63 in the task worktree + 63 on `main`; the corpus prefixes and suffixes); the fuzz did not contain the reviewer's forms, so the conclusion "only mainx" was incomplete;
- `2b2e740`, the reviewer's forms (reproduced by a probe): `git push origin main:feature` and `git push origin x; grep -f pat file` — base block, new allow; and also all the H1 and H2 forms (section "Review 2b2e740");
- `47c0282`, fuzz of 2080 × 2 cases: 63 differences `git push origin mainx …`.

### What the new guard does not close (no worse than base)

- scripts from files (`bash script.sh`, `npm run x`, Makefile), an interpreter reading code from a file, obfuscation (base64, etc.), environment variables left over from previous Bash calls;
- a computed program name without a git marker: neither `git` in the text nor a git subcommand as the first argument (`$X $Y`, `$X "$Y"`);
- **follow-up F5:** the false positives of the base rules (text in `echo`/`grep`/`-m`, branches with the `main` prefix, `HEAD:mainline`) are kept so that the base rules stay unconditional;
- **known fail-closed false positives:** L1 (`git switch -c y && git push -u origin HEAD` from a checkout on `main`), D29b; git after `export PATH=…`/`alias`/`hash` in the same command; push without a refspec after switching the branch or writing config; a refspec without `:` after writing `remote.*`; `git --git-dir=$X …`; push when the directory does not exist (config cannot be read).
- **F8 (new, out of scope):** the hook matcher is only `Bash`. The GitHub MCP tools (for example, `push_files`, `create_or_update_file`, `merge_pull_request`) write to the repository directly and do not pass through the hook. Closed by the `main` ruleset (founder) or by a separate ticket for a PreToolUse matcher for `mcp__github__*`.
- the deny list was not changed (F6 remains: the prefix rules cover only literal forms; their matching form cannot be checked until F1 is fixed).

## Part C. Repeat probes in this session after the change

Session: a project cloud thread, a subagent in a worktree, branch `p1-01b-harness-enforcement`, HEAD `47c0282`, clean tree (`git status --porcelain` empty). Time 05:15–05:20 UTC. All probes are harmless: non-existent refs, `-n`, `--dry-run` with `main == origin/main == 1aa11d9`.

| # | Command | Result | Conclusion |
|---|---|---|---|
| L01 | `echo "git reset --hard"` | text printed, exit 0 | NOT BLOCKED (the hook does not run: the base version from the main checkout blocks this) |
| L05 | `sudo -n true` | exit 0 | NOT BLOCKED (deny `Bash(sudo:*)` not applied) |
| L06 | `git reset --hard refs/heads/p1probe-does-not-exist` | exit 128, `fatal: ambiguous argument …` — Git refused | NOT BLOCKED |
| L07 | `git clean -fdx -n` | exit 0, empty | NOT BLOCKED |
| L10 | `git push origin main --dry-run` (GitHub) | `Everything up-to-date` | NOT BLOCKED |
| L20 | `git branch -D p1probe-does-not-exist` | exit 1, `error: branch … not found` | NOT BLOCKED |
| L21 | Edit `public/handbook.md`, a non-existent string | `String to replace not found in file.` | NOT BLOCKED |
| L22 | `git commit -F <msg>` in the task worktree | `47c0282` created | goes through (expected) |
| — | a nested `claude -p` session in a scratch repository with these settings (local CLI mode) | the call was rejected by the auto mode classifier: `[Create Unsafe Agents]` | INCOMPLETE: no live confirmation that the hook and deny work in a session that reads settings |

Probes against scratch repositories (push to `main`, commit on `main`) were not performed in this session: worktree isolation rejects git commands that point outside the worktree (F7 from P1-01). These cases are covered by the test.

## Part D. Probes for the founder to repeat after merge

Live probes are ticket #21 (founder decision). The list below is the input for it.

Run them in a session where settings are applied (a thread on your own computer via Remote Control, or a cloud session with one repository outside Projects), in a scratch clone with a local bare remote. Expected: the hook's `guard-git: blocked — …` message or a deny refusal:

```text
echo "git reset --hard"                     → goes through (F5)
sudo -n true                                → deny
git push origin main --dry-run              → deny + hook
git push origin HEAD:refs/heads/main --dry-run → hook
git  push  origin  main --dry-run           → hook
git -C <scratch> push origin main --dry-run → hook
git clean -fdx -n                           → deny + hook
git reset --hard refs/heads/does-not-exist  → deny + hook
git commit --allow-empty -m x  (scratch on main) → hook
git commit --allow-empty -m x  (task worktree)   → goes through
```

and a fail closed check: temporarily rename `.claude/hooks/guard-git.sh` in the scratch clone → any Bash command is blocked with the text `fail closed`.

## Limitations and what was not checked

1. A live firing of the new hook, the deny rules and `onFailure` in a Claude Code session was not observed (moved to #21): in this environment the repository settings are not applied (F1), and the nested session was rejected by the classifier.
2. The contradiction between the Settings and Projects pages about single-repository projects is not resolved; the number of repositories in the project is not established.
3. The behaviour of a CLI older than 2.1.295 with the `onFailure` field was not checked; what `CLAUDE_CODE_VERSION=2.1.42` denotes is not established.
4. Which shell Claude Code uses to run a command hook is not specified in the documentation; the fallback is checked by a test under `sh` and `bash`.
5. New blocks for the sake of fail closed (they may get in the way of ordinary work; all of them occur when the outcome is unknown): git after `export PATH=…`/`alias`/`hash` in the same command; `git push` without a refspec after switching the branch or writing config in the same command; `git --git-dir=$X …`; a computed program name with the first argument `push`/`config`/`commit`, etc.
6. The deny list (F6) and the matcher for GitHub MCP (F8) are out of scope, follow-up.
7. The F5 false positives are kept intentionally (the base rules are unconditional) — follow-up; L1 and D29b are known false positives.
8. F4: a line with commit/merge/rebase/cherry-pick and an opaque program (for example `npm test && git commit`) with `CLAUDE_PROJECT_DIR` on `main` is blocked, as in base (F07). A computed wrapper program (`$RUNNER git …`) is analysed in an unknown directory, so push and commit through it are blocked.
