> **Replaced (2026-10-22).** This prompt is no longer used. The current starting prompt is [`docs/ORCHESTRATOR_PROMPT.md`](ORCHESTRATOR_PROMPT.md). The file is kept for the record.

# Starting prompt for Claude Code

Paste the block below as the first message in a new Claude Code session (claude.ai/code → repository `Makkov-Office/vibe-coding-guidebook`). The brief is in `docs/PLATFORM_BRIEF.md`, the rules are in `AGENTS.md` and `CLAUDE.md`.

---

```text
We are continuing the existing project ULTIMATE Vibe-coder guidebook (the product's new
name is Mastering Agentic Engineering) in the repository Makkov-Office/vibe-coding-guidebook.
The project was built in Codex and published on ChatGPT Sites:
https://agentic-engineering-handbook-makkov.makkov.chatgpt.site/
Development now continues in Claude Code. Do not create anything from scratch: the code and content
in the repository are the original 1:1 (PUBLIC version 20).

I am the founder (Makkov). I make the decisions on merge, production deploy, hosting, name/domain,
changes to learning content and UI, and new dependencies outside the brief.

## Canonical sources (in this order)
1. docs/PLATFORM_BRIEF.md — Product HQ: goals, phases, tickets, acceptance.
2. AGENTS.md and CLAUDE.md — how to work in the repository.
3. docs/cloud-handoff.md and README.md — rules and structure of the original.
   They apply unless the brief explicitly changes them.
4. The code and content/handbook.md at a specific SHA.
Sources disagree → stop and send a SPEC CONFLICT (chapter 10.4).

## How we work (the project lives by the rules of the guide itself)
- 1 ticket = 1 branch = 1 author session = 1 PR. We do not write to main.
- Tickets are GitHub Issues using the template .github/ISSUE_TEMPLATE/task.md.
- Before any edits — a preflight report (chapter 08.2). FAIL / BLOCKED / INCOMPLETE ≠ PASS.
- Evidence is bound to a SHA. An old PASS does not carry over to a new HEAD.
- After implementation — an independent review by a separate subagent without the author's
  context, using the reviewer prompt from chapter 14.4.
- Stop before merge and send the decision package (chapter 15.1).
- Learning content only in content/handbook.md, generation via npm run content.
- Do not touch ChatGPT Sites or .openai/hosting.json.

## Task for this session — phase 1, wave 1
1. Read PLATFORM_BRIEF.md (especially section 4), AGENTS.md, cloud-handoff.md.
   Ask questions only if you cannot start without an answer; for the open decisions
   in section 13 take the defaults from the brief.
2. Create GitHub Issues for P1-01 … P1-08 (section 4.4) with dependencies and risk.
   If that fails, create docs/backlog.md in the same format and say so.
3. P1-01 (harness): check that the guard-hook and the deny rules really block
   push to main, reset --hard, force push and clean; attach evidence.
4. P1-02: sync package-lock.json so that npm ci passes from scratch
   (it currently fails: Missing playwright-core@1.57.0). Then npm test, typecheck,
   lint, build — evidence with SHA.
5. P1-03 and P1-04: npm run doctor / npm run validate and GitHub Actions CI.
6. Propose the wave 2 plan (P1-05 … P1-08: what runs in parallel, collision class,
   merge order per chapter 13) and stop.

## How to report
One report at the end: done (issues, branches, PRs, SHA); evidence (commands and
results); BLOCKED / INCOMPLETE with reasons; decisions needed from me
(concrete actions); next step. Short, in the founder's language.
```

---

## Short commands for later

| What you need | What to write |
|---|---|
| Next wave | `Take the next wave from the brief. Preflight, authors per ticket, independent review, stop before merge.` |
| One ticket | `Take P1-06.` |
| Review | `Independent review of PR #NN per chapter 14.4. Do not change the code.` |
| After merge | `PR #NN is merged. Post-merge sync per chapter 16: main SHA, result, dependent PRs to refresh.` |
| Deploy | `Check the Vercel preview deploy for PR #NN: all routes, search, tooltips, XP. Report with a link.` |
