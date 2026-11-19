# ADR 0001: One primary author per ticket, work only in task branches

Status: Accepted — 2026-10-22, founder decision, together with the merge of PR #1 (https://github.com/Makkov-Office/vibe-coding-guidebook/pull/1). Amended 2026-10-27 (founder decision): the merge rule was replaced by delegation to the orchestrator — ADR-0003, Decision 6; brief v1.3, section 14.

Context: The project is developed by agents in cloud sessions, and part of the work runs in parallel. Parallel edits in one checkout hide ownership and corrupt evidence.

Decision: Each ticket has one primary author, one branch `p<phase>-<number>-<slug>` and one PR. Direct commits and pushes to `main` are forbidden and blocked by `.claude/settings.json` and `.claude/hooks/guard-git.sh`. Merge happens after independent review READY on HEAD and green CI; it is done by the orchestrator under the founder's delegation (decisions of 2026-10-22 and 2026-10-26), and the ticket author stops before merge. Before the 2026-10-27 amendment: only on an explicit founder decision.

Alternatives: a shared checkout; sequential work in main; independent clones.

Consequences: extra branch/worktree lifecycle; clear ownership, reproducible evidence.

Validation: an attempt to run `git push origin main` or `git reset --hard` from an agent session is blocked (evidence in PR P1-01). On GitHub — a branch ruleset for `main` (required PR, required checks, no force push).
Check status: P1-01 (`docs/evidence/p1-01-guard-hook.md`) — FAIL in a live session. P1-01b (`docs/evidence/p1-01b-harness-enforcement.md`) — the hook was rewritten, with a regression test in `npm test`; according to the documentation, repository settings do not apply in Claude Code Projects cloud threads, so there the block is enforced only by the `main` ruleset; a live check in a session that reads settings comes after merge.

Revisit trigger: the founder approves an ADR on low-risk auto-merge (brief, section 9.6.5).
