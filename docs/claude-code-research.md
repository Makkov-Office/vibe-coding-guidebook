# Claude Code: research map for the overview

Checked October 11, 2026. Only official documentation, the help center, announcements and the Anthropic repository. These are working notes for the editor, not a separately published learning source. The wording below is a paraphrase; do not copy the documentation in large fragments. Each web source page has a paraphrase limit of 200 words; when preparing public material, spread the details across separate pages rather than inflating one source.

## 1. Freshness check

- The latest published GitHub release is **v2.1.296 of October 9, 2026**: [release](https://github.com/anthropics/claude-code/releases/tag/v2.1.296).
- The [full CHANGELOG](https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md) also starts with 2.1.296. It has new subagent auto-compaction settings and numerous fixes to permissions, MCP, Remote Control, gateway, Windows and UI. This confirms the version is current; it is not a reason to list every bug fix to the reader.
- The [Help center release notes](https://support.claude.com/en/articles/12138966-release-notes) confirm Haiku 5.5 and monthly API credits on October 7; Sonnet 5.5 on September 28.
- The [product announcements catalog](https://claude.com/resources/product-announcements) has Mods on October 1, Haiku 5.5 on October 7 and Docs/Slides/Design leaving beta on October 8. The weekly digest in the docs lags behind: the latest visible week is 37; do not use it as the only proof of freshness.

## 2. What the product is

Source: [Overview](https://code.claude.com/docs/en/overview), checked 2026-10-11; status: a documented core capability.

Claude Code reads the repository, changes several files, runs commands and works with development tools. It is an agentic workflow with a real checkout, diff and verification of the result. Surfaces: CLI, VS Code, JetBrains, Desktop Code tab, web/cloud and mobile. Capabilities and authentication differ; do not promise the same set on every surface. CLI/VS Code/JetBrains also support the API and third-party model providers. Desktop has a visual diff, several sessions and cloud tasks. The API does not automatically make all the cloud/mobile infrastructure available.

## 3. Subscriptions and prices

Source: [Pricing](https://claude.com/pricing), checked 2026-10-11. USD, excluding taxes; prices may change.

| Plan | Claude Code | Price and essential difference |
| --- | --- | --- |
| Free | Not included | $0; Claude chat/Artifacts do not mean access to Code |
| Pro | Included | $20/month or $200/year; the official screen rounds the annual price to $17/month |
| Max 5x | Included | $100/month; 5x the Pro allowance |
| Max 20x | Included | $200/month; 20x the Pro allowance |
| Team Standard | Included | $25/seat monthly, $20/seat/month annual; Team of 2–150 people |
| Team Premium | Included | $125 monthly, $100 annual; 5x Standard |
| Enterprise | Included | $20/seat/month annual **plus all usage at API rates** |

The limit depends on the model, context, complexity and tools; do not promise a fixed number of requests. Paid plans have five-hour windows and weekly limits; other caps may be added. Claude and Code share one allowance. API PAYG is a separate billing scheme, not a Pro/Max subscription. Fable on Pro requires usage credits; Max and Team Premium have separate limits for the family.

## 4. What changed in Team/Enterprise

Sources: [Team/Enterprise Code access](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan), [Enterprise plan](https://support.claude.com/en/articles/9797531-what-is-the-enterprise-plan), checked 2026-10-11.

On **every Team seat**, including Standard, Code is already included. The old claim "Premium only" is wrong. The new Enterprise scheme is one seat type, a fee for access, usage separately; a token allowance is not part of the seat fee, the administrator sets user/org spend limits. Legacy Enterprise Chat/Chat+Code or Standard/Premium may still exist until the contract is renewed. On legacy, check the assigned seat; do not carry the new model over to an old contract. Also check the exact availability of cloud and preview in the organization settings: some docs still use the legacy seat names.

## 5. API credits and extra usage are different wallets

Source: [Monthly API credits for Max and Team](https://support.claude.com/en/articles/17154008-monthly-api-credits-for-max-and-team-plans), checked 2026-10-11; rollout announced October 7.

Max 5x gets $100 and Max 20x $200 of API credits per billing cycle. Team: $20 Standard/$100 Premium per seat, a single pool of at most $500/month. You need to link a Console organization; the offer gradually appears after seven days on an eligible plan. Credits expire and do not roll over.

They are meant for your own API/SDK product and **do not pay for interactive Claude Code or extra usage**. Self-launched `claude -p`/Agent SDK with an API key of the linked Console org are covered; the same commands with a Claude subscription login spend the allowance. GitHub Action, IDE extension and Desktop runs are classified as Code usage and are not covered by this bonus. Do not confuse them with the separate paid usage credits for continuing Code after the limit.

An additional payment source: [Manage usage credits](https://support.claude.com/en/articles/12429409-manage-usage-credits-for-paid-claude-plans). When the included session/weekly limit runs out, you can continue with usage credits at consumption rates; enable this deliberately with a spend cap.

## 6. Practical start and checking billing

Source: [Pro/Max setup](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan), checked 2026-10-11.

For a subscription, sign in with the same Claude account. `/login` changes the sign-in method, `claude update` updates the CLI, `/status` helps check the account/provider. `ANTHROPIC_API_KEY` can switch authentication to API billing instead of the subscription. Do not promise that an installed Pro will automatically pay for all runs with an exported API key.

Windows install from the [Overview](https://code.claude.com/docs/en/overview): `winget install Anthropic.ClaudeCode`; then `claude --version`, go to the project and run `claude`. The native install auto-updates; WinGet requires `winget upgrade Anthropic.ClaudeCode`. Do not put long installs for every OS in the main text: give a short Windows start and the official setup link.

## 7. Models, effort and context

Source: [Model configuration](https://code.claude.com/docs/en/model-config), checked 2026-10-11.

Anthropic API aliases now: `opus`→Opus 5.5, `sonnet`→Sonnet 5.5, `haiku`→Haiku 5.5. `default` for Pro/Max/Team/Enterprise/API is Opus 5.5 on the current version, unless settings/admin set something else. On provider clouds, aliases may point to older versions.

Fable 5.1 is available via `/model fable`; it is a separate choice for long complex tasks, not the default. It may require usage credits. In the Claude apps, the gateway alias may resolve to Fable 5. Do not promise the same Fable availability on all seats.

`/model` picks the model, `/effort` the effort. `opusplan` uses Opus for the plan, then Sonnet for execution. The new Opus/Sonnet have a native 1M context; context is not persistent memory, and auto-compaction still compresses a long conversation. For reproducibility, pin the version; for an ordinary user, use the alias and check `/status`. Minimum CLI: Opus 5.5 2.1.280, Sonnet 5.5 2.1.284, Haiku 5.5 2.1.293.

## 8. Fast mode

Source: [Fast mode](https://code.claude.com/docs/en/fast-mode), checked 2026-10-11; **research preview**.

`/fast` enables a faster configuration of the same Opus, not a different model. Opus 5.5/5/4.8 are supported, not Sonnet/Haiku. It means lower latency and a higher per-token cost; useful for short iterations and live debugging. On subscriptions it spends **only separate usage credits**, even if the allowance has not run out. A Team/Enterprise Owner must allow the feature. The API Console needs provisioned access; the Bedrock/Google/Foundry cloud providers do not support it. Opus 5.5 fast: $8 input/$40 output per million tokens. Do not make fast the default in a learning recipe. Effort and fast are independent settings; lowering effort changes the amount of reasoning, fast changes the service priority.

## 9. Plan, approvals and sandbox

Source: [Permission modes](https://code.claude.com/docs/en/permission-modes), checked 2026-10-11.

`/plan` or `claude --permission-mode plan` explores the code and proposes a plan before edits. `Shift+Tab` switches the mode in the CLI. Plan allows read-only/classifier-approved commands; do not promise the absolute absence of any action.

Manual (`default`/`manual`) asks before actions; Accept edits pre-allows file edits; Auto uses a background classifier; DontAsk rejects actions that were not pre-approved. On CLI/VS Code >=2.1.283, Auto is the starting default, with caveats about settings/provider/availability. It is not "full access without checks". Do not recommend Bypass to a beginner; a container/VM is needed for unattended workflows.

Source: [Sandbox](https://code.claude.com/docs/en/sandboxing). `/sandbox` restricts shell commands with OS facilities: macOS, Linux, WSL2; **native Windows has no such sandbox**. File tools, hooks, MCP and mods are not isolated by this layer. Permissions control whether an action is allowed; the sandbox controls where an already allowed action can reach.

## 10. Instructions and memory

Source: [Memory](https://code.claude.com/docs/en/memory), checked 2026-10-11.

`CLAUDE.md` holds your build commands, conventions and project boundaries. `.claude/rules/` sets narrower rules, including by paths. `/init` proposes a starter; `/memory` edits the memory settings, `/context` shows the memory files actually loaded. Claude Code now supports `AGENTS.md` through a built-in capability with conditions: do not write that it is always ignored or always equivalent to CLAUDE.md.

Auto memory is Claude's notes about preferences and corrections, per repository, shared across worktrees. It is editable context, **not a guaranteed enforced policy**. Set the security boundary with permissions/hooks. `/doctor prompt-audit` (>=2.1.283) looks for outdated/contradictory instructions and shows proposals; it does not apply edits until the user asks.

## 11. Skills and reusable app checks

Source: [Skills](https://code.claude.com/docs/en/skills), checked 2026-10-11.

`.claude/skills/<name>/SKILL.md` defines a workflow; it can be invoked as `/<name>` or automatically by relevance. Personal skills live in `~/.claude/skills/`, project skills are committed with the repo; account synced skills have a separate scope. They are loaded when needed and do not replace the whole CLAUDE.md.

The bundled `/run`, `/verify`, `/run-skill-generator` launch the application and check behaviour. `/verify` confirms the result on the running app, not only typecheck/tests; a special procedure can be recorded as a project skill. `/run-skill-generator` records a working launch recipe for later agents. Useful for a beginner: "check the screen at 360px, reproduce the user scenario, show the evidence". The capability does not mean any browser/GUI is available without setup.

## 12. Plugins, code intelligence and Mods

Source: [Plugins overview](https://code.claude.com/docs/en/plugins/overview). A plugin packages skills, agents, hooks, MCP and other components; marketplaces let you install one repeatable set. `/plugin` manages them; scopes differ. These are executable extensions, not just a text hint.

Source: [Code intelligence](https://code.claude.com/docs/en/plugins/code-intelligence). An LSP plugin gives symbol navigation, references and diagnostics after edits; you need to install the matching language server. Useful for large TypeScript projects, but do not promise built-in support for all languages without dependencies.

Source: [Mods overview](https://code.claude.com/docs/en/plugins/mods/overview), checked 2026-10-11; introduced into the public docs, CLI >=2.1.287, Desktop runtime >=2.1.286.

Mods are JS/TS event handlers in a plugin: a custom panel, command, tool-call guard, interface styling. The UI is drawn in CLI/Desktop; VS Code/cloud/headless can run the hooks but do not show panes. Mods are not sandboxed and run with user permissions; trust in the author is mandatory. A beginner needs only an overview and examples like "context counter / visible diff", not a large execution template.

## 13. MCP and hooks

Source: [MCP](https://code.claude.com/docs/en/mcp). It is access to external tools/data, not additional model knowledge by itself. HTTP is preferred; local stdio is also supported. Verified commands: `claude mcp add --transport http notion https://mcp.notion.com/mcp`, `claude mcp list`, `/mcp`. OAuth, scopes, approvals and separate credentials will be required. A project `.mcp.json` cannot grant itself trust. The Claude Desktop config and the standalone CLI do not have to match.

Source: [Hooks guide](https://code.claude.com/docs/en/hooks-guide). Hooks automatically run scripts/HTTP/prompt logic on lifecycle events: formatting after an edit, protection before a tool call, a notification on completion. `PreToolUse` can block an action with a deterministic check. Unlike a skill, it is a reaction to an event, not a workflow on request. Hooks are executable code; avoid installing unverified third-party scripts.

## 14. Subagents, teams and workflows

Source: [Subagents](https://code.claude.com/docs/en/sub-agents). A worker has its own context, tools/model/instructions; useful for repo exploration, independent review or research. Foreground blocks until the result, background runs concurrently; approvals come to the main session. `/tasks` shows the work. Custom definitions live in `.claude/agents/`, `/agents` helps create them. Do not promise free parallelism: tokens/allowance are spent.

Source: [Agent teams](https://code.claude.com/docs/en/agent-teams); **experimental**, off by default. `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` enables coordination of peer sessions, shared tasks and messaging. Desktop does not support coordinated teams. One team/session, no nested teams, resumption is limited; do not enable by default for an ordinary feature.

Source: [Dynamic workflows](https://code.claude.com/docs/en/workflows). JS runtime orchestration keeps intermediate state in a script, allows many workers and a repeatable cross-check. Paid/API/provider access; Pro enables it from `/config`. `/deep-research` and `/workflows` are verified commands. Useful for a large migration/audit, not for every CSS change.

## 15. Background agents and worktrees

Source: [Agent view](https://code.claude.com/docs/en/agent-view); **research preview**.

`claude agents` is a panel of several full local sessions, `claude --bg` starts a background session. You can read the status, open a session, send it a message, see Needs input. The session lives on your machine; shutdown stops it; it is not cloud. Parallel sessions use up the allowance faster. For isolation use a worktree; do not give several writers the same files.

Source: [Worktrees](https://code.claude.com/docs/en/worktrees). `claude --worktree feature-name` gives a separate working directory/branch. `.worktreeinclude` helps with needed gitignored local files. This is checkout isolation, not automatic independence of APIs/contracts; merge/review remains an explicit step. The repository must have a first commit. Do not promise that .env is always carried over by itself.

## 16. Undo, checkpoints and saving the conversation

Source: [Checkpointing](https://code.claude.com/docs/en/checkpointing).

`/rewind` or Esc Esc lets you restore a conversation/code checkpoint or summarise the needed part. **It does not replace Git.** Shell file operations, external edits and most subagent edits are not restored by this mechanism; symlink/hardlink paths are skipped. Useful for an experimental UI iteration, but a snapshot/commit remains the reliable boundary.

Source: [Sessions](https://code.claude.com/docs/en/sessions). `/resume`/`claude --continue` restore the local history; `/branch` keeps the original conversation for another idea. `/fork` is a separate background session, not the same thing. `/compact` with a focus on contracts and unresolved tasks supports a long process; after compaction, critical instructions are better kept in the repo.

## 17. Desktop and browser verification

Source: [Desktop](https://code.claude.com/docs/en/desktop), checked 2026-10-11.

Code tab: local/SSH/cloud sessions, side-by-side panes, visual diff, integrated terminal/file editor, app preview and PR monitoring. The browser pane uses a **clean separate profile**; the Chrome extension uses your logged-in browser. This is an important difference for auth testing. Desktop Linux is beta; Computer Use is not available on Linux. Coordinated agent teams are in the CLI, not Desktop. Do not describe autocomplete as a Desktop feature: the work is conversational + explicit edits.

Source: [Chrome](https://code.claude.com/docs/en/chrome). `claude --chrome`, `/chrome`; a Chromium browser, the Claude in Chrome extension >=1.0.36 and a Pro/Max/Team/Enterprise subscription login. Not an API-key/provider-only session. Allows real clicks, screenshots, console/network debugging and UX verification with site permissions. General availability is confirmed by [week27](https://code.claude.com/docs/en/whats-new/2026-w27) of June 29–July 3.

Source: [CLI Computer use](https://code.claude.com/docs/en/computer-use); **research preview**, Pro/Max, macOS interactive CLI, not `-p`, not Team/Enterprise. Desktop also macOS/Windows, off by default. This is the actual screen/apps; do not mix it up with browser-only inspection.

## 18. Projects — new coordination of long-running work

Source: [Claude Projects](https://code.claude.com/docs/en/claude-projects), checked 2026-10-11; **public beta, gradual rollout, Pro/Max**, not Team/Enterprise.

One ongoing conversation takes related tasks and coordinates parallel threads with shared repos, instructions/memory. Threads are usually cloud; local-only resources are available through Remote Control. Web/Desktop/mobile, not CLI/VS Code/JetBrains. Useful for several related bugs or an API+web+mobile migration. Do not mix it up with ordinary Chat Projects, a Desktop folder or agent teams. If there is no such item in the UI, the account has not yet received the rollout.

Announcement source: [Projects redesigned](https://claude.com/blog/projects-redesigned), **September 17, 2026**, confirms the beta and the new coordinator model. Use a short "what's new" link rather than carrying over marketing claims.

## 19. Remote Control and Cloud — a fundamental boundary

Source: [Remote Control](https://code.claude.com/docs/en/remote-control).

`/remote-control`/`claude remote-control` is a window into a local session from a phone/web. Local files/MCP are available, but the computer and the process must be running. Pro/Max/Team/Enterprise, with Owner enablement for an org; API keys, provider-only and a custom gateway are not supported. Opening it on mobile does not move the computation to a server.

Source: [Cloud sessions](https://code.claude.com/docs/en/claude-code-on-the-web).

Web/mobile/Desktop/`claude --cloud` start a separate cloud checkout; the work continues after the laptop is closed. `claude --teleport` brings branch+history back into a local checkout, with requirements: same repo/account, clean git state and a pushed branch. Later local messages do not sync the cloud copy automatically. Repo access/setup scripts/network policy are prepared separately. There is no separate VM price; usage comes from the plan; API/provider authentication has separate limits. The Enterprise availability document still names legacy seats — do not promise cloud for any Enterprise configuration.

## 20. Artifacts, design and presentation

Source: [Artifacts](https://code.claude.com/docs/en/artifacts).

From a session's output you can make a live interactive page at a private claude.ai URL, show an annotated diff, UI variants, a dashboard or an investigation timeline. Sharing must be chosen separately. Pro/Max/Team/Enterprise and a Claude subscription login; API-only does not give this publishing surface. An Artifact is a self-contained single page without its own backend and multi-route hosting. So a preview/report is useful for vibe coding, while a production app needs a separate deploy.

`/design <brief>` makes editable artboards on a canvas; `/slides <brief>` makes a presentation. The Docs integration uses a connector; do not invent `/docs`. The Artifacts documentation still calls templates beta. The more recent [official announcement catalog](https://claude.com/resources/product-announcements) of October 8 reports Docs/Slides/Design **out of beta** in the Claude apps: clearly distinguish the product status from the Code template integration; do not extend Free chat support to Free Claude Code.

## 21. Three kinds of scheduling

Source: [Routines](https://code.claude.com/docs/en/routines). A cloud routine runs while the computer is off; triggers: schedule/API/GitHub. Pro/Max/Team/Enterprise; an org can disable it. `/schedule` creates a routine from a local CLI subscription session; in a cloud session this command is not available; the web UI works. The runtime clones the repo and uses the configured connectors; it does not get the whole local environment automatically.

Source: [Desktop scheduled tasks](https://code.claude.com/docs/en/desktop-scheduled-tasks). A local task is available in Desktop Routines, persistent across restarts, but runs only while the app is open and the machine is awake. An example of a useful workflow: a review of yesterday's changes, a dependency audit; do not create speculative unattended production actions.

Source: [Goal](https://code.claude.com/docs/en/goal). `/goal` sets an observable completion condition; Claude continues until success/impossibility/error. This is sustained task execution, not a calendar event. `/loop` repeats a prompt inside a live session; do not promise execution after shutdown. For polling CI, loop fits; for a nightly run without a laptop, a cloud routine.

## 22. Review, CI and API automation

Source: [Code Review](https://code.claude.com/docs/en/code-review); a managed GitHub service, **research preview, Team/Enterprise**.

A fleet analyses the PR and publishes severity findings; it does not approve/merge. It is configured with CLAUDE.md/REVIEW.md; token billing is separate through usage credits, not the included allowance (the official estimate is an average of $15–25, **not a fixed price**). The local `/code-review` is available on other plans too and checks the diff; `--fix` changes code, so the choice is explicit.

Source: [Ultrareview](https://code.claude.com/docs/en/ultrareview); **research preview**. `/code-review ultra` runs multi-agent verification in the cloud and requires subscription auth; a dialog shows the scope/estimated spend. Pro/Max have 3 free runs, then usage credits. API-key-only/providers/ZDR/HIPAA are excluded; when unavailable, the command may perform a local review. Do not guarantee that the word ultra always means cloud.

Source: [GitHub Actions](https://code.claude.com/docs/en/github-actions). The GitHub Action runs tasks/review on your own runner; account credentials or a supported provider + repo permissions are required. This is a scheme and costs separate from managed Review. For programmatic flows, use `claude -p`/Agent SDK with explicit permissions/budget; do not publish magic auth secrets in YAML.

## 23. Data boundary

Source: [Data usage](https://code.claude.com/docs/en/data-usage).

Local execution does not mean offline inference: prompts/code context go to the model provider. For consumer Pro/Max, use for model improvement depends on the privacy setting; commercial Team/Enterprise/API do not train on code/prompts by default. Session transcripts are stored locally in plaintext for resume. The cloud checkout and transcripts are on server-side infrastructure under the plan policies. Remote Control also syncs the transcript. In the public overview a short practical block is enough: check the privacy setting, exclude secrets, do not connect production write credentials for the sake of a first UI iteration. Do not promise ZDR on all Enterprise seats.

Source: [Self-hosted environments](https://code.claude.com/docs/en/self-hosted-environments); **public beta Team/Enterprise, off by default**. Execution can be placed on your own infrastructure, but requests to the model API and session coordination do not become offline/local-only. A separate advanced block, not a mandatory install for a beginner.

## 24. Verified commands for a compact cheat sheet

Below are only documented commands; availability depends on the surface and account. [Commands](https://code.claude.com/docs/en/commands) confirms the names, the detail pages above confirm the semantics.

| Intent | Command | Caveat |
| --- | --- | --- |
| Start | `claude` | In the project folder |
| Check the environment | `claude --version`, `/status`, `/doctor` | CLI/app runtime versions may differ |
| Explore before edits | `/plan` | Or `claude --permission-mode plan` |
| Project instructions | `/init`, `/memory` | Check the proposed rules |
| Choose model/effort | `/model`, `/effort` | Provider/admin restrictions |
| Context | `/context`, `/compact` | Compaction is not infinite memory |
| Side question | `/btw` | Does not add an ordinary turn to the main history |
| Diff/review | `/diff`, `/code-review` | Review is not merge |
| Run app | `/run`, `/verify` | Browser/GUI tools need setup |
| Extensions | `/plugin`, `/mcp` | Trusted sources/credentials |
| Parallel tasks | `/tasks`, `/agents`, `claude agents` | Subagent definitions != Agent view |
| Isolation | `claude --worktree ui-polish` | A first commit is required |
| Restore | `/rewind`, `/resume` | Checkpoint limitations above |
| Browser | `claude --chrome`, `/chrome` | Subscription + extension |
| Remote | `/remote-control` | The computer is on |
| Cloud handoff | `claude --cloud`, `claude --teleport` | Git state/account/repo requirements |
| Schedule | `/schedule` | A local subscription CLI creates a cloud routine |
| Long task | `/goal` | A clear completion condition |

## 25. Editorial decisions and independent practical examples

Recommendation: the overview as a separate reference page, outside the 22 chapters and XP. At the start: what the product does and a short route "install → define scope → plan → build → run/verify → diff/review". Then expandable cards by task: UI iteration; existing repo; repeating workflow; parallel work; work from a phone; subscription/budget. Keep the core billing differences visible.

Independent authored scenario prompts (not documentation quotes):

- "First find the components of this screen and propose a plan. After approval, fix only the mobile header; show which files changed."
- "Reproduce the dialog clipping at 360px in a real browser. Fix the cause, then repeat the same scenario and attach the evidence."
- "Prepare a review of the current diff: look for regressions, keyboard accessibility and broken states; do not change files until the findings are discussed."
- "Record our procedure as a project skill: launching the dev app, checking login, 360px and desktop, confirming the exact source copy."
- "Two independent subagents investigate the causes of slow navigation and UI overflow. Writers must not change the same files at the same time."

Do not compare products, do not rank them, do not write a guaranteed "does everything by itself", do not tie fast/parallel/model effort to a number of guaranteed requests.
