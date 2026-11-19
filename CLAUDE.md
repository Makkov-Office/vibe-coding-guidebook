@AGENTS.md

## Claude Code specifics

- Work in a separate branch/worktree per ticket, not in the main checkout.
- Plan mode for Medium/High tickets: plan first, then edits.
- Independent review is a separate subagent without the author's context: give it the PR, the ticket and links to the rules, not your summary.
- Proofreading of simplified learning texts (P5-04, P6-01…P6-05, P6-07) is likewise a separate editor subagent (the new text of P6-06 also needs founder approval): the PR, the ticket and the original at the base SHA; without its READY on HEAD a text PR is not merged (brief, section 9.5).
- `.claude/settings.json` contains deny rules and the PreToolUse hook `.claude/hooks/guard-git.sh` (analyzer `guard_git.py`, regression test `tests/guard-git.test.mjs` in `npm test`). Do not weaken them; changing these files is High risk and needs the founder.
- Where this applies: a local session and a cloud session with a single repository outside Projects read `.claude/settings.json`. In Claude Code Projects cloud threads, repository permission rules and hooks are **not applied**: the Claude Code documentation's Settings page says so, and this was observed in sessions P1-01 and P1-01b. Caveat: the Projects page claims the opposite for a project with one repository; the contradiction is unresolved (`docs/evidence/p1-01b-harness-enforcement.md`). So do not rely on the hook and deny rules in Projects. There you follow the AGENTS.md rules yourself, and the technical protection of `main` is only on the GitHub side. The hook runs from `$CLAUDE_PROJECT_DIR` (the session's start directory), that is, in the version from `main`.
- Hosting is Vercel (project `vibe-coding-guidebook`, team `makkov-design`): a preview for every PR, behind Deployment Protection. Production from `main` was enabled by founder decision on 2026-10-23 (P1-16, ADR-0002): a merge to `main` creates a production deploy to `vibe-coding-guidebook-ivory.vercel.app`; after merge, check that the deploy is READY on the merge commit's SHA. ChatGPT Sites stays a separate address; do not touch it.
- Reports to the founder are in the founder's language, short: done, evidence, BLOCKED, decisions needed, next step.
