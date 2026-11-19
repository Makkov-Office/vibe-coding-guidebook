# Mastering Agentic Engineering — specification for moving and developing the platform

> Product name: **Mastering Agentic Engineering** (founder decision of 2026-10-22, section 2). Basis: "ULTIMATE Vibe-coder guidebook [BETA]" v1.2, built in Codex; source: the repository `Makkov-Office/vibe-coding-guidebook`.
> This document is the canonical brief (Product HQ) for the agents and people working on the project. Brief version: 1.3 · 2026-10-26 · owner: Makkov.
> Source priority: founder decision → this brief → `docs/cloud-handoff.md` (the original's rules, unless the brief explicitly changes them) → the code at a specific SHA.
> v1.3 records the founder's redesign decisions of 2026-10-26 (plan RD-01): the m3.material.io model, a new structure, a new phase order P2–P9, a process without a flag. Rationale and rejected options: `docs/adr/0003-m3-redesign.md` (ADR-0003).

The keywords **MUST / MUST NOT / SHOULD / MAY** are used in the RFC 2119 sense: MUST is mandatory, SHOULD is yes by default with any deviation explained in the PR, MAY is at discretion.

---

## 0. TL;DR

1. **Phase 1 — move and parity.** The original 1:1 is already in this repository and builds. The task is to make it a working home for Claude Code: sync the lockfile, harness, CI, move hosting to Vercel with a preview on every PR. Content and UI do not change in this phase.
2. **Redesign on the Material 3 model (ADR-0003).** We adopt the m3.material.io model as a whole: a navigation rail with a hover mega menu, a home page made of cards, "Get started" with a scroll story and a sticky visual, a topic page with 4 tabs (Overview / How it works / How to apply / Test yourself) that collapse into the header on scroll. 9 rail items, about 27 → about 70 pages (section 5).
3. **Phase P2 — design foundation:** brief v1.3 and ADR-0003, the "Blueprint" concept in brand colors, tokens, visual grammar, Tabler icons, URL map.
4. **Phase P3 — shell and navigation:** rail, mega menu, mobile navigation, ⌘K search, theme and animation buttons, motion.
5. **Phase P4 — home page, "Get started" and rebranding** to Mastering Agentic Engineering (P4-05). The v1.2 sales landing page is replaced by the M3 home page; the dashboard becomes the "Continue" block.
6. **Phase P5 — topic page and splitting:** content format with tabs, page template, pilot on chapters 01, 08, 12.
7. **Phase P6 — simpler content.** Waves by section: the Overview layer, a visual on every tab, "Do / Don't". The audit gaps also go here: reference harness, enforcement, memory, observability, auto-merge, isolation, orchestration.
8. **Phase P7 — gamification v2.** Mastery levels M0–M5 instead of bare XP, drills based on real decisions from the guide, rewards for competence rather than for scrolling.
9. **Phase P8 — Agent Pack.** A machine-readable set: AGENTS.md/CLAUDE.md, skills, JSON Schema, hooks, `llms.txt`. Runs as a parallel stream.
10. **Phase P9 — music.** At the very end, once there are tracks and licenses.
11. **No flag for the new UI.** Every merge after independent review READY on HEAD and green CI goes straight to production; rollback is a revert PR. The founder looks at 4 checkpoints (section 6.3, section 14).
12. **The project follows the rules of the guide itself** (dogfooding): ticket → branch → PR → independent review → merge under founder delegation.

### 0.1. What changed in v1.3

| Topic | Was (v1.2) | Now (v1.3) |
|---|---|---|
| Site entry | Phase 5: sales landing page + separate dashboard | M3-style home page + "Get started"; the dashboard becomes the "Continue" block on the home page (section 7.3) |
| Phase order | Content → presentation → gamification → landing → Agent Pack | Design → shell → home page → topic page → content → gamification; Agent Pack in parallel, music at the end (section 6) |
| Presentation | "Short / Full" switch | 4 tabs: "Overview" = the short layer, the full text is in "How it works" and "How to apply" (section 5.3) |
| Visuals | System mini map, 4 callout types | A visual on every tab following the MAE visual grammar, "Do / Don't", numbered anatomy (sections 7.1, 9.4) |
| Design | Principle 9: Linear style is kept until a founder decision | Decision made: the "Blueprint" concept in UIX PRO brand colors (ADR-0003) |
| Controls | None | Theme (3 states) and animation Play/Pause at the bottom of the rail; music in P9 |
| Rollout | Production from `main` (P1-16), merge by founder decision | No `NEXT_UI` flag: every verified merge goes straight to production, 4 checkpoints instead of accepting every PR (section 14) |
| Text proofreading | Changes to learning content need founder approval | A separate editor agent checks simplified texts against the original; the founder handles only disputed meaning; the new text of P6-06 still needs founder approval (section 9.5) |

---

## 1. Context and goals

### 1.1. What exists now

The site `agentic-engineering-handbook-makkov.makkov.chatgpt.site` is a guide to managed development with AI agents. Audit score of 2026-10-22:

| Axis | Score | Main reason |
|---|---|---|
| System architecture | 78/100 | Strong governance; no executable core, memory or observability |
| Presentation for people | 70/100 | Good structure; conflicting tone, mixed languages, defensive style, no end-to-end example |
| Presentation for AI | 80/100 | Clean Markdown and templates; no RFC 2119, JSON Schema or splitting into loadable parts |

### 1.2. Goals

| # | Goal | How we check |
|---|---|---|
| G1 | Full parity with the original | Phase 1 acceptance (section 4.5) — 100% of items PASS |
| G2 | Presentation for people ≥ 85/100 | Repeat audit + the test "a beginner completes chapter 01 and explains the rule in their own words" |
| G3 | Presentation for AI ≥ 90/100 | Fresh-agent exit test on the Agent Pack (section 11.4) |
| G4 | Architecture ≥ 88/100 | There is a working reference harness and the new chapters from section 9.6 |
| G5 | The home page and "Get started" lead into the start of learning | The event "started chapter 01 / completed the diagnostic" is tracked (section 7.4) |

### 1.3. Non-goals

- Do not build the Agent Control Center as a working runtime — only describe it (as in the original).
- Do not build a backend with accounts in phases P1–P9 of this brief. Progress is stored on the user's side (section 10.7).
- Do not translate into English within this brief (the architecture MUST allow i18n later).

---

## 2. Platform name

### 2.1. Founder decision (2026-10-22): **Mastering Agentic Engineering**

**Subtitle:** "The full development cycle with AI agents — from vibe coding to top-tier SDLC".
**Caption in the site's content language (where needed):** the equivalent of "Mastery of agentic engineering".
**Short form in the UI:** MAE (only where space is short; the main name is written in full).

Why:
- The previous name "ULTIMATE Vibe-coder guidebook [BETA]" promised a light guide for vibe coders, while the inside is an engineering discipline; meanwhile the URL said "agentic-engineering-handbook". The new name matches the content and, in meaning, the current URL.
- "Mastering" describes a person's path to mastery; the M0–M5 scale from chapter 21 becomes the natural scale of that path (section 2.2).
- "SDLC" in the subtitle anchors the expertise without scaring off a beginner in the main name.
- Not tied to a vendor (Codex/Claude), it will survive a change of tools.
- The words "ULTIMATE" and "[BETA]" are dropped from the name.

### 2.2. Mastery levels (M0–M5, chapter 21)

The original's current 4 levels (Explorer → Practitioner → Orchestrator → Engineer) are extended to 6 and tied to the maturity model. A level is confirmed by a check (section 10.4), not only by accumulated XP.

| Level | Maturity | What the person can do | Exit criterion (chapter 21) |
|---|---|---|---|
| 0 · Explorer | M0 · Conversational | Gets working code from a chat | There is a prototype |
| 1 · Practitioner | M1 · Repeatable | Reproducible environment, one check command | A clean environment passes the checks following the docs |
| 2 · Engineer | M2 · Governed | Ticket, PR, independent review, human gate | One full delivery cycle can be traced |
| 3 · Orchestrator | M3 · Coordinated | Parallel agents, risk, collisions, merge order, sync | A parallel wave without losing contracts or data |
| 4 · Architect | M4 · Enforced | Rules are enforced technically: permissions, gates, audit | A violation is impossible or explicitly blocked |
| 5 · Master | M5 · Adaptive | Resilient orchestration, budgets, recovery | Interrupted runs recover without losing authority or evidence |

Existing user progress migrates: accumulated XP and chapter marks are kept, the level is recalculated on the new scale (section 10.7).

### 2.3. What changes with the rebranding (ticket P4-05)

- The rebranding goes together with the new home page (founder decision of 2026-10-26, ADR-0003): ticket P4-05 after P4-01.
- The name in `content/handbook.md` (first line), `src/design/brand.ts`, metadata, `<title>`, Open Graph, footer, home page.
- The FLOW symbol, the `by Makkov` SVG and the Open Source badge are kept (approved in the original).
- The rebranding changes the approved brand from `docs/cloud-handoff.md` ("Design and style") — this is a deliberate founder decision, recorded in an ADR (ADR-0003).
- Before launch the team SHOULD check that the domain (options: `masteringagentic.dev`, `agentic-engineering.guide`, etc.) and handles are free. Choosing the domain is a founder decision.

### 2.4. Attribution

In the footer and on the home page: "by Makkov".

---

## 3. Working principles for the project

1. **Dogfooding.** The project MUST follow the process from the guide itself: `1 ticket = 1 branch = 1 author session = 1 PR`, independent review in a clean session, merge only after independent review READY on HEAD and green CI — under founder delegation (section 14).
2. **Parity before improvements.** Phase 1 MUST be finished (acceptance 4.5) before changes to learning content and UI. New features in phase 1 MAY be developed only switched off (feature flag).
3. **Content is separate from code.** Learning content MUST live in `content/handbook.md` (and in new Markdown/JSON sources connected to the standard compiler), not in JSX.
4. **The source is the truth.** `content/handbook.md` at a specific SHA is the canonical learning content; generated files are not edited by hand.
5. **The existing pipeline is extended, not replaced.** The compiler, the coverage audit, the block identity registry and the publication audit MUST keep passing; new layers (Overview, drills, Agent Pack) plug into them.
6. **Fail closed** in build tools: if a chapter, term or anchor is not found, the build fails instead of silently skipping it.
7. **Accessibility and mobile** are not optional: WCAG 2.2 AA, 360 px width without horizontal scrolling, keyboard operation.
8. **No dark patterns in gamification** (section 10.8).
9. **The visual direction follows ADR-0003.** The founder chose a new direction on 2026-10-26 (the "Blueprint" concept in UIX PRO brand colors, the M3 model). The new style is introduced by tickets P2–P5 following the roadmap (section 6); the FLOW symbol, the `by Makkov` SVG and the Open Source badge are kept (section 2.3). Specification: `docs/design/visual-language.md` (P2-02).

---

## 4. Phase 1 — moving to Claude Code and parity

### 4.1. What already exists (checked 2026-10-22)

The source of the published site is in `Makkov-Office/vibe-coding-guidebook` (branch `main`, HEAD `292ee23`, 2026-10-11). The code and content match the published PUBLIC version 20 (commit `a99332c`); only handoff documents (`docs/cloud-handoff.md`) were added after it. **This is the original 1:1 — there is no need to recreate it from scratch.**

| What | Fact |
|---|---|
| Stack | React 19, TypeScript, **Vinext** (Next-compatible App Router on Vite 8), RSC, Tailwind 4, shadcn/base-ui, Tabler Icons, Cloudflare Workers (wrangler), npm + package-lock |
| Content | A single source `content/handbook.md` (≈2400 lines, 12.6k words): 22 chapters, orientation 00, tool overviews, resources, glossary of 394 definitions / 11 topics |
| Pipeline | `npm run content`: AST/GFM compiler → `src/content/generated.json`, search index and anchors in `public/data/`, static Mermaid SVGs (6 diagrams, rebuilt only on change, Chrome required), coverage audit "0 unexplained gaps" |
| Routes | `/`, `/chapters/01–22`, `/glossary`, `/resources`, `/tools`, `/tools/codex`, `/tools/claude-code`, `/print`, `/handbook.md` — 30 prerendered routes |
| Progress | localStorage: `handbook-learning-v2`, `handbook-reading-v2`, `practice:*`; in-memory fallback when storage is refused |
| Design | Linear style: background `#010102`, graphite, accent `#5e6ad2`; Manrope + JetBrains Mono self-hosted; Tabler 20 px / 1.75; rail 264 px |
| Checks | `npm test` (7 content tests), `typecheck`, `lint`, `build` + `postbuild` publication audit, Playwright e2e (needs a running server) |
| Hosting | ChatGPT native Sites, `project_id` in `.openai/hosting.json`. **It cannot be published there from Claude Code.** |
| Documentation | `README.md`, `docs/cloud-handoff.md`, `docs/implementation-notes.md`, audits (UX/UI, editorial, performance, contrast), 40+ screenshots, sources and SHA-256 of logos/screenshots |

Check in the Claude Code cloud environment (Node 22.22, npm 10.9):
- `npm ci` — **FAIL**: the lockfile is out of sync with package.json (`Missing: playwright-core@1.57.0 from lock file`).
- `npm install --no-save` → `npm test` 7/7 PASS, `typecheck` PASS, `build` PASS: 30 routes, publication audit 163 assets, source/download identical.
- The build references assets by absolute paths (`/_next/...`): static hosting at the domain root (Vercel) works without reworking the paths.

### 4.2. Rules inherited from the original handoff (MUST)

- Continue the existing project, do not create the portal from scratch; preserve the Git history.
- Learning content, definitions, collections, overviews and captions live only in `content/handbook.md`; generated files are updated by the standard `npm run content`.
- Preserve the Linear design, the FLOW symbol, the `by Makkov` SVG without changing its bytes, and the Open Source badge — **until the founder decides on the rebranding** (section 2).
- Do not invent images or brand marks; facts in the overviews come only from official sources with a check date.
- Do not treat the gaps from `docs/cloud-handoff.md` ("Latest update and limitations") as agreed tasks.
- Do not change ChatGPT Sites or its public access; a push to GitHub is not the same as publishing the site.

### 4.3. New goal of phase 1

Make the repository a **working home for Claude Code**: reproducible setup, harness, CI on GitHub, hosting on Vercel that Claude can update through PRs. User-facing content and UI MUST NOT change in this phase (parity with version 20).

### 4.4. Phase 1 tickets

| ID | Ticket | Risk | Depends on |
|---|---|---|---|
| P1-01 | Harness: AGENTS.md, CLAUDE.md, `.claude/settings.json` + guard-hook, PR/Issue templates, ADR-0001. Evidence: attempts to push to main / reset --hard / force push are blocked | Medium | — |
| P1-02 | Sync `package-lock.json` (`npm install` → `npm ci` passes from scratch), pin `.nvmrc`/engines | Medium | P1-01 |
| P1-03 | `npm run doctor` and `npm run validate` (content + test + typecheck + lint + build) as a single entry point | Low | P1-02 |
| P1-04 | GitHub Actions CI: `npm ci`, validate, upload `dist` as an artifact; Mermaid without Chrome (reuse SVGs; if a diagram changed, a job with Chrome) | Medium | P1-03 |
| P1-05 | Playwright e2e in CI against the built server (`npm start`), keep the report | Medium | P1-04 |
| P1-06 | Vercel: deployment method. Option A (default) — static export: `dist/server/prerendered-routes` (HTML + `.rsc`) + `dist/client` as a static site with `vercel.json` (rewrites for `.rsc`, headers from `_headers`, 404). Option B — Vinext server rendering on Vercel, if A breaks SPA navigation. Spike + ADR with evidence | Medium | P1-04 |
| P1-07 | Connect the repository to Vercel: production from `main`, a preview on every PR, status checks in the PR | High (new infrastructure) | P1-06, founder gate |
| P1-08 | Parity audit: ChatGPT Sites (version 20) vs Vercel — visual snapshots at 360/1440, SPA navigation, search, glossary tooltips, XP, print, `/handbook.md`, 404, direct entry to any chapter | Low | P1-07 |

### 4.5. Phase 1 acceptance

- [ ] `npm ci && npm run validate` passes from a clean clone in a Claude Code cloud session.
- [ ] CI on GitHub is green on `main` and on every PR; `main` ruleset: PR required, required checks, no force push.
- [ ] Guard-hook and deny rules are confirmed by evidence.
- [ ] Vercel serves all 30 routes, including direct entry and page reload; the PR preview works.
- [ ] Parity audit: content, anchors, search, glossary tooltips, XP profile, print and `/handbook.md` match version 20; visual differences are documented and approved by the founder.
- [ ] The old site on ChatGPT Sites is untouched.

---

## 5. Redesign on the Material 3 model (ADR-0003)

Founder decisions of 2026-10-26 (plan RD-01, decisions 01–08). Rationale and rejected alternatives: `docs/adr/0003-m3-redesign.md`. Specification of color, fonts and motion: `docs/design/visual-language.md` (P2-02); URL map: P2-05.

### 5.1. Model: what we take from m3.material.io

The m3.material.io model is adopted **as a whole**: mechanics and structure. We draw our own visuals, illustrations and shapes; the brand, the illustrations and the Google Sans font belong to Google and MUST NOT be copied. The mechanics were checked on the live site in Chromium on 2026-10-26 (RD-01: home page, Get started, the Buttons page with all 4 tabs, the Components mega menu).

| M3 element | How M3 does it | How we do it | Phase |
|---|---|---|---|
| Navigation rail | 7 items with icon and label, search at the top | 9 items, ⌘K search at the top (section 5.2) | P3 |
| Hover mega menu | A panel with the section tree over the content | The same, plus progress by chapter and a "Continue" card | P3 |
| Buttons at the bottom of the rail | Pause animations and video, dark theme | Theme (3 states), animation Play/Pause; music in P9 | P3, P9 |
| Home page hero | Two cards: heading and CTA, collage | "Start learning", a live diagram of a task's path | P4 |
| Section cards | Visual on top, heading, one line | 8 cards, each with its own visual in a single style | P4 |
| Next steps | Link cards in two columns | Diagnostic, chapter 01, cheat sheet, Agent Pack | P4 |
| Get started | Text on the left, the visual on the right changes on scroll | "Get started" in 5 steps with a sticky visual (scroll story) | P4 |
| 4 page tabs | Overview, Specs, Guidelines, Accessibility, each with its own URL | Overview, How it works, How to apply, Test yourself (section 5.3) | P5 |
| Tabs → header | The bar sticks and narrows into a floating "pill" | The same, plus the chapter's short name in the "pill" | P5 |
| On this page | On the right, the current item in a "pill" | The same, plus reading time | P5 |
| Previous / Up next | Neighbouring tab or component | Neighbouring tab or chapter | P5 |
| Copy link on headings | A button on every section | The same; "Copy for agent" (removed by founder decision of 2026-10-29, P8-05) | P5, P8 |
| Block appearance | From blur on load | A soft appearance without blur, can be switched off with a button | P3 |
| Do / Don't / Caution | Image pairs with a colored label | "Do" / "Don't" / "Caution" for rules | P6 |
| Numbered anatomy | Numbered circles and a legend | Breakdown of the guide's templates by number (preflight report, ticket, finding) | P6 |

### 5.2. Structure: 9 rail items

The guide is currently 27 pages (`src/content/generated.json` on `main` 876b0e9), and the most important ones are too long: the glossary and the Claude Code and Codex overviews are each over 80 thousand characters of HTML; Mermaid diagrams exist only in chapters 01, 02, 04, 07, 13 and 17. We split along the M3 model: section → page → 4 tabs. The result is **about 70 pages** (RD-01 estimate).

| # | Rail item | What is inside | Chapters | Pages (estimate) |
|---|---|---|---|---|
| 1 | Home | Hero, 8 section cards, "Continue", Next steps, footer (section 7.3) | — | 1 |
| 2 | Get started | Platform overview, how to read and what to trust, from vibe coding to a system, levels M0–M5, a 2-minute diagnostic | 00, 01 | ~5 |
| 3 | Foundations | Architecture and sources of truth, agent harness, WSL2 + Dev Container, roles | 02–05 | ~4 |
| 4 | Process | Ticket and DoR, lifecycle, preflight, context engineering, spec/ADR/Docs Impact, Git/GitHub/CI | 06–11 | ~6 |
| 5 | Control | Change risk, parallel agents, independent review, human gates, post-merge sync | 12–16 | ~5 |
| 6 | Reliability | Security and least privilege, four typical mistakes, failure modes and recovery | 17–19 | ~3 |
| 7 | Practice | Drills, level certification, missions in your own repository, evidence log, maturity model | 20, 21 | ~5 |
| 8 | Tools | Tool overviews, Claude Code (14 topics), Codex (15 topics), useful materials | — | ~31 |
| 9 | Agent Pack | What is inside, AGENTS.md and 6 skills, 6 JSON Schemas, `llms.txt` and .zip | — | ~4 |

The **Reference** (chapter 22 "Operational cheat sheet", glossary of 394 terms) does not get its own rail item: it is reachable from ⌘K search and the footer. Exact addresses, slugs and 308 redirects from old URLs are set by the URL map (P2-05); old addresses and anchors MUST keep working.

### 5.3. Anatomy of a topic page: 4 tabs

Instead of one long page, each chapter gets 4 tabs; each tab has its own address (scheme: P2-05). On scroll the tab bar sticks to the top and shrinks into a "pill" header with the chapter's short name.

| Tab | M3 counterpart | What is inside |
|---|---|---|
| **Overview** | Overview | The short layer: why, the rule, a visual, three things, a common mistake, where we are in the DEMO-42 case. Up to 350 words (template: section 8.2) |
| **How it works** | Specs | Mechanics and the original's full text: diagrams, numbered anatomy of templates, terms |
| **How to apply** | Guidelines | Steps, "Do / Don't", the step of the end-to-end DEMO-42 case, templates with a "Copy" button |
| **Test yourself** | Accessibility | The chapter's 2–5 minute drill, skill progress, a link to the next step |

The "Short / Full" switch from v1.2 becomes the tabs: "Overview" is the short layer, and the original's full text is laid out across "How it works" and "How to apply" without loss. Learning content still lives only in `content/` and is built by the standard compiler (principles 3–5).

### 5.4. Visual language (in brief)

Decision 01 (2026-10-26): concept C **"Blueprint"** in the UIX PRO brand colors (makkov.com/uixpro). Details: `docs/design/visual-language.md` (P2-02) and tokens v2 (P2-03); here only what frames all tickets.

- **Color.** Cool graphite and white; one warm pastel accent (apricot, flat fill) — only on action and progress ("Your path"). Three colors carry three constant meanings: "Agent", "Practice", "Human decides". One color means one thing on every page.
- **Flat style (founder decision of 2026-10-29, P2-07, #108).** No gradients anywhere (the home page banner frame, buttons, progress), no shadows anywhere in either theme; card hover is a change of background and border color. Neutrals and background are slightly cooler; the meaning colors are replaced by a harmonious set (periwinkle, sage, dusty rose), with muted deep tones in the dark theme. Values: `docs/design/visual-language.md` and `docs/design/palette.json`.
- **Fonts** (approved by the founder on 2026-10-26): Unbounded for the hero and H1; Geist for headings, text and interface; Martian Mono for code, annotations and diagrams; Pixelify Sans for game labels of up to three words. They are included as the project's own files, without loading from Google on every visit.
- **Icons:** Tabler (already a dependency), 1.5 px outline, a vocabulary by role; the unused `lucide-react` is removed (P2-06).
- **Motion:** one curve and three durations, four techniques (appearance, draw-on, movement, step change); the system "reduce motion" mode switches animations off completely (the pause button in the rail was removed by founder decision of 2026-10-29, P3-09).
- **Shape and response (founder decision of 2026-10-29, P2-08, #110).** Stronger rounding, on the M3 Expressive scale (card 28 px, hero 32 px, buttons and tabs are pills). Clickable elements change shape: at rest they are as round as possible, on hover the corners blunt slightly, on press more strongly, and they spring back. On click, a light glow trail from the touch point in the spirit of Apple Liquid Glass (brief, not a fill). Hover comes in faster than it goes out; appearance and exit share a pair of curves. Without animation, only a color change. Details: `docs/design/visual-language.md`, sections 6 and 7.
- **A visual on every tab** following the MAE visual grammar (section 7.1).

### 5.5. Transition without a flag

There is no `NEXT_UI` flag (decision 03, ADR-0003): every verified step goes straight to production (section 14). To keep the site working at every step:

- the new shell is built first (P3), then the home page (P4) and the page template (P5); until chapters have moved, old pages open inside the new shell as a single tab;
- every merge passes `validate` and `e2e` in CI; old addresses work through 308 redirects (P2-05) and are checked by a test of all old addresses;
- any step can be rolled back with a revert PR.

---

## 6. Roadmap and tickets P2–P9

### 6.1. Phase order

Week 1 starts on 2026-10-27; 14 weeks (until ≈ 2027-01-26) is the upper estimate with 3 authors. The first 2 weeks run 3 streams, from week 3 up to 5, so the real duration may be shorter; recalculation after P2 (P9-02). Phases overlap: the order of work is set by the ticket dependency graph (section 6.2), not by the phase number.

| Phase | Name | Weeks (estimate) | What it delivers | Stream |
|---|---|---|---|---|
| P2 | Design foundation | 1–2 | Brief v1.3 and ADR-0003, final concept, tokens (color, font, shapes, motion), visual grammar, Tabler icons, URL map | Critical path |
| P3 | Shell and navigation | 3–5 | Rail, mega menu, mobile navigation, ⌘K search, theme and animation buttons, page transitions | Critical path |
| P4 | Home page and "Get started" | 5–7 | Hero, 8 cards with visuals, Next steps, footer, a 5-step scroll story; rebranding to Mastering Agentic Engineering | Critical path |
| P5 | Topic page and splitting | 3–6 | Content format with tabs, compiler, page template with collapsing tabs, pilot on chapters 01, 08, 12 | Critical path |
| P6 | Simpler content with visuals | 7–13 | 5 waves by section: the Overview tab, a visual on every tab, "Do / Don't"; the audit gaps of the old phase 2 | Critical path |
| P7 | Gamification v2 | 8–14 | Levels M0–M5, skill map, 10 drills, certification, mentor, progress in the mega menu | Parallel |
| P8 | Agent Pack | 3–7 | AGENTS.md, 6 skills, 6 JSON Schemas, `llms.txt`, the `/agents` page, "Copy for agent" (removed by founder decision of 2026-10-29, P8-05), fresh-agent test | Parallel |
| P9 | Music | after the tracks (estimate 12–13) | A player without autoplay, once there are tracks and licenses | Depends on an external input |

Critical path: design foundation → shell → home page and topic page → content. Agent Pack and gamification run as a parallel stream.

### 6.2. Tickets P2–P9

Matches plan RD-01 (40 tickets). Each ticket becomes a GitHub issue following the chapter 06 template: one branch, one PR, independent review. Created on 2026-10-26: P2-01…P2-06 are #35–#40, P8-01…P8-04 are #41–#44. Risk is the chapter 12 classification; "Founder gate: yes" is a founder checkpoint (section 6.3); size is S / M / L.

| ID | Ticket | Risk | Founder gate | Depends on | Size |
|---|---|---|---|---|---|
| P2-01 | Brief v1.3 and ADR-0003: the M3 model, new structure, phase order | Low | no | — | S |
| P2-02 | Final "Blueprint" concept in brand colors: palette, meaning colors, fonts, motion | Low | no | — | M |
| P2-03 | Design tokens v2: color from a seed, roles, surfaces, font, shapes, motion | Medium | no | P2-02 | M |
| P2-04 | Visual grammar: primitives, SVG templates, palette linter | Medium | yes | P2-03 | M |
| P2-05 | URL map of the new structure and 308 redirects from old addresses | Medium | no | P2-01 | M |
| P2-06 | Tabler icons: icon vocabulary by role, 1.5 px outline, remove lucide-react | Low | no | P2-03 | S |
| P2-07 | Flat style: no gradients or shadows, one warm pastel accent, cooler neutrals, new meaning colors (founder decision of 2026-10-29) | Medium | no | P2-03 | M |
| P3-01 | Navigation rail and mega menu: hover, focus, tap, keyboard | Medium | yes | P2-03, P2-05 | L |
| P3-02 | Mobile navigation: bottom bar and full-screen menu | Medium | no | P3-01 | M |
| P3-03 | ⌘K search, breadcrumbs, glossary access | Medium | no | P3-01 | M |
| P3-04 | Rail buttons: theme (3 states), animation Play/Pause (Play/Pause removed by founder decision of 2026-10-29, P3-09) | Low | no | P3-01 | S |
| P3-09 | Rail: no "Animations" button, even hover on search and theme, mega menu without a shadow, a custom "Outline" hover (founder decision of 2026-10-29) | Medium | no | P3-01, P3-04 | S |
| P3-05 | Motion: page transitions, springs, reduced motion | Medium | no | P2-03 | M |
| P4-01 | Home page: hero, 8 section cards, "Continue", Next steps, footer | Medium | yes | P3-01, P4-02 | M |
| P4-02 | Illustrations: hero and 8 sections, two themes, animation | Medium | no | P2-04 | M |
| P4-03 | "Get started": a 5-step scroll story with a sticky visual | Medium | no | P3-05 | M |
| P4-04 | Home page and "Get started" texts in content/ | Low | no | P2-01 | S |
| P4-05 | Rebranding to Mastering Agentic Engineering | Medium | no | P4-01 | S |
| P5-01 | Content format: pages and tabs in content/, compiler, coverage audit | High | no | P2-05 | L |
| P5-02 | Page template: hero, tabs → header, On this page, neighbouring pages | Medium | no | P3-01, P5-01 | L |
| P5-03 | Search and anchors across the new pages, old anchors work | Medium | no | P5-01 | M |
| P5-04 | Pilot: chapters 01, 08, 12 in the new format + a test with 3 people | Medium | yes | P5-02 | M |
| P5-05 | Final production check: old addresses, speed, accessibility | Medium | no | P4-01, P5-04 | S |
| P6-01 | Wave 1: Get started and Foundations (00–05) | Medium | no | P5-04 | L |
| P6-02 | Wave 2: Process (06–11) | Medium | no | P6-01 | L |
| P6-03 | Wave 3: Control (12–16) | Medium | no | P6-01 | L |
| P6-04 | Wave 4: Reliability and Practice (17–22) | Medium | no | P6-01 | L |
| P6-05 | Wave 5: Tools (Claude Code and Codex, 29 topics) | Medium | no | P6-01 | L |
| P6-06 | Audit gaps: reference harness, memory, observability | Medium | no | P5-01 | L |
| P6-07 | Glossary: "Basic / Professional" filter, hints in the new style | Low | no | P5-01 | M |
| P7-01 | ProgressStore and lossless migration of current XP | Medium | no | — | M |
| P7-02 | Levels M0–M5, skill map, progress in the mega menu | Medium | no | P7-01, P3-01 | M |
| P7-03 | Drill engine on a JSON schema + 10 drills | Medium | no | P7-01 | L |
| P7-04 | Level certification and missions in your own repository | Medium | no | P7-03 | M |
| P7-05 | Mentor and the "no character" / "no gamification" modes | Low | no | P7-02 | M |
| P7-06 | The "Continue" block on the home page for returning users | Low | no | P7-02, P4-01 | S |
| P8-01 | agent-pack/ structure, AGENTS.md, CLAUDE.md | Low | no | — | M |
| P8-02 | 6 skills and 6 JSON Schemas with examples | Medium | no | P8-01 | L |
| P8-03 | The /agents page, .zip, llms.txt, "Copy for agent" (removed by founder decision of 2026-10-29, P8-05) | Medium | no | P8-02, P3-01 | M |
| P8-04 | Fresh-agent test, protocol in docs/evals | Low | no | P8-03 | S |
| P8-05 | Remove "Copy for agent" and "Page Markdown" from the interface (founder decision of 2026-10-29) | Low–Medium | no | P8-03 | S |
| P9-01 | Music at the very end: tracks and licenses, player, no autoplay | Low | yes | P3-04 | S |
| P9-02 | Wave report and brief update after each phase | Low | no | — | S |

### 6.3. Founder checkpoints

The founder does not accept every PR. They get a line in the thread after every merge (looking is optional), a Friday "build of the week" and 4 checkpoints. A ticket with "Founder gate: yes" is a checkpoint: the merge follows the normal process (section 14), and afterwards the founder gets a package. Replying is optional: "redo: …" becomes a new ticket, silence means all is well. The exception is P9-01: tracks and licenses are an input from the founder, and without them the ticket does not start (section 12).

| Checkpoint | When | Ticket | What the founder looks at |
|---|---|---|---|
| 1 · Showcase | end of week 2 | P2-04 | Colors, fonts, icons and motion live in both themes |
| 2 · Shell | week 5 | P3-01 | Rail, mega menu, mobile navigation, search |
| 3 · Pilot | week 6 | P5-04 | Chapters 01, 08 and 12 with tabs — can be worked through as a learner |
| 4 · Home page and rebranding | week 7 | P4-01 (+ P4-05) | The new home page, "Get started" and the name Mastering Agentic Engineering |

Checkpoint package: a link to the main site, 3–5 "things to try", screenshots at 320 / 360 / 768 / 1024 / 1440 px in both themes, status (merged, CI green, review READY).

### 6.4. Remapping v1.2 requirements → P2–P9

Every requirement of the old phases 2–6 gets a home in a new phase; none is dropped without a record here. The "v1.2 section" column has section numbers of brief v1.2, the "Where now" column has v1.3 tickets and sections.

| v1.2 requirement | v1.2 section | Where now |
|---|---|---|
| Reference harness: template repo, scripts, tests on real-Git repositories | 5.1 | P6-06 (section 9.6.1) |
| Chapter "From rule to enforcement" | 5.2 | P6-06 (9.6.2) |
| Chapter "Agent memory" | 5.3 | P6-06 (9.6.3) |
| Chapter "Agent observability and quality": run log, 5 metrics, evals, budgets | 5.4 | P6-06 (9.6.4) |
| Risk-based auto-merge (addition to chapters 12 and 15) | 5.5 | P6-06 (9.6.5) |
| Execution isolation (addition to chapters 04 and 17) | 5.6 | P6-06 (9.6.6) |
| Minimal executable orchestration (addition to chapter 21) | 5.7 | P6-06 (9.6.7) |
| The "Tools" layer: fact dates, a staleness badge, scheduled source checks | 5.8 | P6-05 (9.6.8) |
| MUST / SHOULD / MAY normativity with badges | 5.9 | P6-01…P6-05 in the Overview tab, P8-02 (9.6.9) |
| "New in v2" badge for new chapters and sections | 5 | P6 (section 9) |
| Presentation diagnosis | 6.1 | P6 (9.1) |
| Two layers "Short / Full" and the template of the "Short" layer | 6.2 | 4 tabs (5.3): format P5-01, Overview template (8.2), texts P6-01…P6-05 |
| Storing the layer in `content/short/NN.md` with compiler, search, auto-links and coverage audit | 6.2 | Format P5-01 in `content/` with the same compiler coverage (8.1) |
| Content language first (no language mixing), the tone of a calm mentor | 6.3 | P6-01…P6-05 (9.2) |
| Glossary filter "Basic / Professional" | 6.3 | P6-07 |
| The end-to-end DEMO-42 case and the "where we are now" mini timeline | 6.4 | P5-02 (place in the template), P6-01…P6-05 (filling it) (9.3) |
| System mini map, 4 callout types, tables → cards on mobile | 6.5 | P2-04 (callout), P5-02 (template, table cards), P6 (mini map) (9.4) |
| The "Short" layer for all 22 chapters, a constraint linter | 6.6 | P6 acceptance (9.7) |
| Usability test with 3 people, protocol in `docs/research/` | 6.6 | P5-04 (8.4) |
| Repeat presentation audit ≥ 85/100 | 6.6 | P6 acceptance (9.7) |
| Gamification principle and core mechanics, XP as currency | 7.1–7.2 | P7 (10.1–10.2): levels and map in P7-02 |
| Drills on a JSON schema (at least 8) | 7.3 | P7-03: engine + 10 drills |
| Level certification, missions in a real repository, evidence log | 7.4, 7.6 | P7-04 |
| Mentor and the "No character" mode | 7.5 | P7-05 |
| `ProgressStore`, XP migration, export/import, schema version | 7.7 | P7-01 |
| Spaced repetition | 7.2 | P7-03 (card format), P7-06 (today's review) |
| Gamification ethics (MUST NOT) | 7.8 | All P7 tickets (10.8) |
| Gamification acceptance | 7.9 | P7 acceptance (10.9) |
| Hybrid "landing for new users / dashboard for returning users", `/about`, a manual switch | 8.1 | Replaced: the M3 home page for everyone (P4-01) + the "Continue" block for returning users (P7-06); `/about` is not needed |
| `/start` — the former "How to read" page | 8.1 | The "Get started" rail item (P4-03), address from the URL map (P2-05) |
| Hero with a promise and 2 CTAs | 8.2.1 | P4-01: "Start learning" and "Find your level" |
| "Pain": before / after from chapter 01 | 8.2.2 | "Get started", steps 1–2 (P4-03, texts P4-04) |
| Interactive system map and counters | 8.2.3 | The home page hero is a live diagram of a task's path (P4-01, P4-02); "Get started", step 2 (P4-03). Dropped: the clickable map nodes from acceptance 8.6 of v1.2 — the diagram shows the path, the section cards provide the navigation |
| The M0–M5 mastery path | 8.2.4 | "Get started", step 4 (P4-03); levels in P7-02 |
| 2-minute diagnostic (8 questions → level and route) | 8.2.5 | P7-04; entry via "Get started" and Next steps on the home page (P4-01) |
| "Try it right here", a built-in mini drill | 8.2.6 | The drill of the day in the "Continue" block (P7-06) on the P7-03 engine. Dropped: a mini drill for a new visitor on the first screen — a new visitor goes to "Get started" (P4-03), returning users see the drill of the day |
| "Templates you will take away" with a "Copy" button | 8.2.7 | The "How to apply" tab (P6), "Copy for agent" (P8-03; removed by founder decision of 2026-10-29, P8-05) |
| "For agents too" | 8.2.8 | The Agent Pack card in Next steps (P4-01), the Agent Pack rail item (P8-03) |
| About the author | 8.2.9 | Footer "by Makkov" (P4-01, section 2.4) |
| FAQ (5–6 questions) | 8.2.10 | "Get started", step 1 "What is MAE" (P4-03, texts P4-04) |
| Final CTA | 8.2.11 | "Get started", step 5: chapter 01 / diagnostic (P4-03) |
| Dashboard: level, "Continue", skill mini map, review, log, quick links | 8.3 | The "Continue" block (P7-06), progress in the mega menu (P7-02), Next steps and footer (P4-01) |
| Landing metrics (Vercel Web Analytics, events) | 8.4 | Home page metrics (7.4), P4-01 |
| 2–3 visual directions for the founder to choose from | 8.5 | Done on 2026-10-26: the "Blueprint" concept (ADR-0003); specification in P2-02 |
| Light and dark theme, design tokens, `prefers-reduced-motion` | 8.5 | P2-03 (tokens), P3-04 (theme), P3-05 (motion) |
| LCP < 2.5 s, Lighthouse ≥ 90/95 | 8.6 | P5-05 |
| Old URLs work | 8.6 | P2-05 (308), P5-03 (anchors), P5-05 (final check) |
| Agent Pack contents, rules, delivery | 9.1–9.3 | P8-01, P8-02, P8-03 (11.1–11.3) |
| Fresh-agent exit test | 9.4 | P8-04 (11.4) |

---

## 7. Phases P2–P4: design, shell, home page

### 7.1. P2 — design foundation

- **P2-01** — this brief v1.3 and ADR-0003.
- **P2-02** — the final "Blueprint" concept in brand colors: palette, meaning colors, fonts, motion (`docs/design/visual-language.md`).
- **P2-03** — design tokens v2: color from a seed, roles, surfaces, font, shapes, motion; light and dark theme.
- **P2-04** — visual grammar and showcase (checkpoint 1). Every visual MUST follow 8 rules:

| Rule | How we check |
|---|---|
| One picture, one idea | The visual's caption fits in 1 sentence |
| Primitives only: "pill", rounded rectangle, circle, line, document card, token | The SVG is assembled from the primitive library, with no free paths |
| Radii only from the concept's shape scale | The SVG linter checks rx against the scale |
| Visual palette: 4 tones + accent | The linter forbids colors outside the tokens |
| One "camera": frontal, no perspective, 24 px margins | Artboard template 240×140 and 600×300 |
| Mono captions, 1–3 words | Caption length check in the build |
| Motion explains the process rather than decorating | Every animation has a meaning: "the token travels along the task's path" |
| Every visual in both themes and without animation | Screenshot test: light, dark, reduced motion |

- **P2-05** — URL map of the new structure and 308 redirects from old addresses.
- **P2-06** — Tabler icon vocabulary by role, 1.5 px outline; `lucide-react` is removed from the dependencies.
- **P2-07** — flat style (founder decision of 2026-10-29): no gradients or shadows, one warm pastel accent, cool neutrals, new meaning colors; card hover by a color change.

### 7.2. P3 — shell and navigation

- **Rail (P3-01):** a search button on top, below it 9 items with icon and label (section 5.2); the active item is a tonal "pill" around the icon. Hover opens a mega menu over the content with the section tree; the current page is highlighted. The mega menu MUST also open on focus, tap and arrow key and close on Esc; the behavior is covered by e2e.
- **Mobile navigation (P3-02):** a bottom bar instead of the rail and a full-screen menu.
- **⌘K search, breadcrumbs, glossary access (P3-03);** the reference (cheat sheet, glossary) is reachable from search.
- **Buttons at the bottom of the rail (P3-04):** theme in 3 states (light, dark, system). Animation Play/Pause was removed by founder decision of 2026-10-29 (P3-09). There is no music button until P9.
- **Hover and mega menu (P3-09, founder decision of 2026-10-29):** a custom "Outline" hover instead of the Material one (a blueprint line traces the icon pill), the same on items, search and theme; the mega menu is flat, without a shadow.
- **Motion (P3-05):** page transitions, spring motion of the menu and cards without overshoot, soft appearance of blocks; `prefers-reduced-motion` switches animations off completely.

### 7.3. P4 — home page, "Get started" and rebranding

The v1.2 sales landing page and separate dashboard are replaced by a home page on the M3 model — one for new and returning visitors alike; a returning visitor sees the "Continue" block.

**Home page (P4-01, checkpoint 4):**
1. **Hero:** name, subtitle (section 2.1), CTAs "Start learning" and "Find your level"; next to it, a live diagram of a task's path (Founder → ticket → agent → branch → review → human decision → `main` → deploy).
2. **8 section cards** (Get started … Agent Pack): visual on top, heading, one line; hover "draws" the diagram on the card.
3. **"Continue"** — for returning users: the next chapter or tab, the drill of the day (filled in P7-06).
4. **Next steps:** the 2-minute diagnostic, chapter 01, the operational cheat sheet, Agent Pack.
5. **Footer:** Learn (Get started, levels M0–M5, drills), Reference (glossary, cheat sheet, materials), For agents (Agent Pack, `llms.txt`, GitHub); "by Makkov", Open Source.

**"Get started" (P4-03):** a 5-step scroll story; text and link cards on the left, a sticky visual on the right that changes with the step.
1. What MAE is: what it teaches and for whom (this takes the v1.2 FAQ answers, the "before / after" pain from chapter 01, the chapter and term counters).
2. How the work is organised: the path of one task from idea to deploy, the end-to-end DEMO-42 case.
3. 8 sections: what is where, each chapter has 4 tabs.
4. Levels M0–M5: where to grow; a level is confirmed by certification, not by pages read.
5. How to learn: overview → practice → check; CTAs "Go to chapter 01" and "Take the diagnostic".

**Illustrations (P4-02):** hero and 8 sections, in two themes, animated according to the rules of section 7.1. The "+" pattern from the brand site is used only on the home page hero and in "Get started".
**Texts (P4-04):** the home page and "Get started" texts live in `content/`, not in JSX (principle 3).
**Rebranding (P4-05):** section 2.3.

### 7.4. Home page metrics

No external trackers by default (privacy). The Vercel version MAY connect Vercel Web Analytics with the events: `landing_view` (home page view), `diagnostic_started`, `diagnostic_completed`, `chapter_01_started`, `drill_completed`. If this needs a new runtime dependency, it is a founder gate (section 14).

### 7.5. Acceptance of phases P2–P4

- [ ] Tokens v2 and visual grammar: SVGs pass the palette and radius linter; the showcase was shown to the founder (checkpoint 1).
- [ ] Rail and mega menu work with the mouse, tap and keyboard (Tab, arrows, Esc); on a phone, the bottom bar and full-screen menu; e2e green.
- [ ] Theme in 3 states and animation Play/Pause work; in reduced motion there are no animations.
- [ ] Home page: hero, 8 cards, Next steps, footer; every card and link leads to an existing section or chapter.
- [ ] "Get started": 5 steps with a sticky visual, readable without animation too.
- [ ] Rebranding: the name in all places from section 2.3; the FLOW symbol and the `by Makkov` SVG without byte changes.
- [ ] Old URLs open (308 to the new address).
- [ ] UI checked at 320 / 360 / 768 / 1024 / 1440 px, in both themes, with the keyboard and in reduced motion.

---

## 8. Phase P5 — topic page and splitting

### 8.1. Content format (P5-01, High)

- Pages and tabs are described in `content/` and built by the standard compiler `src/content/compiler.mjs`; search, glossary auto-links, the block identity registry and the coverage audit MUST extend to all tabs (principles 3–6).
- The original's full text MUST remain available: laid out across "How it works" and "How to apply", not shortened.
- P5-01 settles Docs Impact for the rules about where learning content lives (AGENTS.md, README) in the same PR.
- Search and anchors across the new pages, old anchors work (P5-03).

### 8.2. The Overview tab: template of the short layer

By default a chapter opens on the Overview tab. Template (MUST for every chapter; storage is the P5-01 format, which replaces the v1.2 path `content/short/NN.md`):

```markdown
---
chapter: "08"
title: "Preflight: start right"
minutes: 3
rule_strength: MUST
---
## Зачем
One sentence: what pain this removes.

## Правило
> One phrase to remember. (Mandatory)

## Как это выглядит
The step of the end-to-end DEMO-42 case at this stage — 3–6 lines, real output.

## Три вещи, которые нужно сделать
1. …
2. …
3. …

## Частая ошибка
One mistake + how to notice it.

## Проверь себя
A link to the chapter's drill (section 10).
```

The `##` headings are literal tokens the compiler parses (`OVERVIEW_SECTIONS` in `src/content/compiler.mjs`) and must stay exactly as written. In English: Why, Rule, What it looks like, Three things to do, Common mistake, Test yourself.

Limits of the Overview tab: ≤ 350 words, ≤ 1 table, ≤ 1 diagram, no nested caveats.

### 8.3. Page template (P5-02)

- Hero: chapter name, one line, chips (reading time, level, template).
- A bar of 4 tabs under the hero; on scroll it sticks and shrinks into a "pill" with the chapter's short name.
- "On this page" with the current item and reading time; at the bottom, "Previous" and "Next" (neighbouring tab or chapter).
- Every heading has a "copy link". The "Copy for agent" button (Markdown, P8-03) was removed by founder decision of 2026-10-29, P8-05.
- A place for the DEMO-42 mini timeline and the system mini map (sections 9.3–9.4); tables turn into cards on mobile.

### 8.4. Pilot (P5-04, checkpoint 3)

Chapters 01, 08 and 12 in the new format. A usability test with 3 people at the "tried vibe coding" level: after the Overview tab of chapter 01, each states the main rule in their own words (protocol in `docs/research/`).

### 8.5. Final production check (P5-05)

Old addresses and anchors, speed (LCP < 2.5 s on mobile, Lighthouse ≥ 90/95), accessibility (WCAG 2.2 AA, keyboard).

### 8.6. Phase P5 acceptance

- [ ] The tab format passes the compiler and the coverage audit "0 unexplained gaps"; search finds the text of all tabs.
- [ ] Page template: tabs collapse into the header, On this page, neighbouring pages, copy link.
- [ ] The pilot of chapters 01, 08, 12 is published; the protocol of the test with 3 people is in `docs/research/`.
- [ ] All old URLs and anchors work (test of all old addresses).
- [ ] LCP < 2.5 s on mobile, Lighthouse ≥ 90/95.

---

## 9. Phase P6 — simpler content with visuals

Five waves by rail section: P6-01 Get started and Foundations (00–05), P6-02 Process (06–11), P6-03 Control (12–16), P6-04 Reliability and Practice (17–22), P6-05 Tools (Claude Code and Codex, 29 topics). In each wave the chapters get the Overview tab (section 8.2), a visual on every tab following the grammar (section 7.1), "Do / Don't" and the numbered anatomy of templates. Plus P6-06 (audit gaps) and P6-07 (glossary). New chapters and sections are marked with a "New in v2" badge.

### 9.1. Diagnosis

- The tone is split: "bro" and XP versus enterprise terminology.
- Mixed languages within one sentence.
- Almost every paragraph is a caveat; the main action gets lost.
- There is no single example that runs through all chapters.
- The glossary is overloaded with basic terms.

### 9.2. Language

- **Content language first:** in the Overview tab an English term appears only as a hint on hover/tap (a native-language phrase followed by "· preflight"). In "How it works" and "How to apply" the original's text is unchanged, apart from being laid out across tabs (sections 5.3 and 8.1).
- The glossary gets a "Basic / Professional" filter; basic Git terms are collapsed by default; hints in the new style (P6-07).
- New tone: **a calm mentor**, informal "you", no "bro" in the main text. The playful voice lives only in gamification (the mentor character, section 10.5) and can be switched off in settings.

### 9.3. End-to-end case

One ticket, **DEMO-42 "Search by name in the catalog"** (already in the original), runs through all chapters: ticket (06) → lifecycle (07) → preflight (08) → context (09) → Docs Impact (10) → branch and PR (11) → Medium risk (12) → collision with DEMO-43 (13) → review with a finding (14) → founder decision (15) → post-merge sync (16). Each chapter has a "where we are now" mini timeline of the case.

### 9.4. Visual presentation

- A visual on every tab following the MAE visual grammar (section 7.1).
- The system mini map (from chapter 02) as a permanent navigation element: the current chapter is highlighted on the diagram.
- Callout types: "Rule", "Trap", "Example", "Check" — 4 kinds, no more.
- Rules come in "Do" / "Don't" (and "Caution") pairs, templates (preflight report, ticket, finding) as numbered anatomy.
- Tables turn into cards on mobile.

### 9.5. Proofreading simplified texts: the editor agent

Decision 08 (2026-10-26): simplified texts are proofread by **a separate editor agent**; the founder does not proofread them. This is an exception to the rule "changes to learning content are a founder decision" for tickets that simplify and split existing text (P5-04, P6-01…P6-05, P6-07). New learning content (new chapters and the P6-06 additions) still requires founder approval (v1.2 rule, section 5): the editor agent checks it before the founder but does not replace the founder.

- The editor is a separate clean session, not the PR author; it gets the PR, the ticket and the original at the base SHA, not the author's summary.
- It checks against the original with a checklist: **definitions, MUST rules, terms, links and anchors**. The meaning of a rule MUST NOT change.
- Verdict READY or findings, bound to the HEAD SHA; after a new push the proofreading is repeated.
- The editor raises disputed points of meaning as a separate line to the founder — this is a founder gate; until the answer, the disputed point is not merged.
- Merge of a text PR: independent review READY + editor agent READY on the same HEAD + green CI.

### 9.6. Audit gaps (P6-06; formerly phase 2)

P6-06 is an umbrella ticket: each item 9.6.1–9.6.7 is created as a separate sub-issue with its own branch and PR. Item 9.6.8 is part of wave P6-05, item 9.6.9 is part of all waves and of P8-02. The original's text changes only through tickets with founder approval; the editor agent checks the meaning before the founder (section 9.5). The place of new chapters in the rail is set by the URL map (P2-05).

#### 9.6.1. Reference harness (the main gap)

- A new section "Template repository": a working template repo `mastering-agentic-engineering-harness-template` (a separate repository or a `templates/harness/` folder), where **all the learning scripts exist and work**: `bootstrap.sh`, `doctor.sh`, `validate.sh`, `preflight.sh`, `post-merge-sync.sh`, a PR template with an `Implements TICKET-XX` and Docs Impact parser (one grammar, one source), a GitHub ruleset in JSON.
- Tests for the scripts on temporary real-Git repositories (as described in chapter 18.2): ignored-file collision, restricted refspec, divergence, dirty state, lock.
- Chapter 20 gets a link "Clone it and do the exercises on this template".

#### 9.6.2. Enforcement in practice

A new chapter **"From rule to enforcement"** (between 03 and 04, or as 03.4):
- How to turn every text rule of the guide into a check or a restriction. A table: rule → text → executable check → enforcement (Claude Code permissions deny, PreToolUse hook, CI check, branch ruleset, a separate identity).
- Ready-made examples: blocking `git push` to `main`, `reset --hard`, `clean -fdx`, `rm -rf` outside the worktree, `--force`; a reviewer session with read-only permissions; a hook that checks that work happens in a task worktree.
- An honest note: which of these really block and which only warn.

#### 9.6.3. The memory layer

A new chapter **"Agent memory"** (after 09 Context engineering):
- Three kinds of memory: project instructions (AGENTS.md/CLAUDE.md), the session's working memory and handoff, long-term decisions (ADRs, docs).
- Rule: memory is not a source of truth; in a conflict, the canonical source from chapter 02 wins.
- Who writes to memory, when, how stale entries are cleaned up, how to keep memory from turning into a dump.
- Contract: what MUST go into durable docs and what stays in the session.

#### 9.6.4. Observability, evals, cost

A new chapter **"Agent observability and quality"** (in the "Practice and growth" part):
- Run log: ticket, session, model, HEAD, tokens/cost, result, time.
- 5 process metrics: share of PRs that pass review on the first try; share of scope creep; average number of review cycles; share of INCOMPLETE evidence; cost per merged PR.
- Evals for instructions and skills: a set of reference tasks, a run after changing AGENTS.md/a skill, comparison of the results.
- Budgets: a token/cost limit per ticket, a stop rule.

#### 9.6.5. Risk-based auto-merge

Addition to chapters 12 and 15:
- A delegated policy: **Low risk + all required checks PASS on the current HEAD + an independent review with no findings ≥ MEDIUM → MAY merge without a manual decision**, if the founder approved this policy in advance (ADR).
- Medium and High still have an explicit gate.
- How, technically: required checks + required review + GitHub auto-merge; a separate identity without bypass.

#### 9.6.6. Execution isolation

Addition to chapters 04 and 17:
- Alternatives to the Docker socket: rootless Docker / Podman, a dev container without the socket, a separate sandbox environment for untrusted code, cloud sessions.
- Egress policy: a domain allowlist for the agent.
- A table "what provides isolation and what does not" (in the original's style).

#### 9.6.7. Orchestration (minimal executable)

Addition to chapter 21: how to do "M3 without a Control Center" — a queue of ready tickets (Todo), one orchestrator prompt that picks a ticket by the dependency DAG and launches an author in a separate session/worktree, scheduled tasks for post-merge sync and for checking stale PRs.

#### 9.6.8. The "Tools" layer separate from the principles (wave P6-05)

- Tool overviews MUST store the check date of every fact (prices, versions, beta statuses) in the frontmatter.
- A fact older than 45 days is shown with a "May be out of date" badge.
- A separate ticket: a scheduled task every 2 weeks checks the official sources and opens a PR with updates (with links to the source). No numbers from the model's memory.

#### 9.6.9. Normativity

- The key rules in all chapters get an explicit strength: `MUST`, `SHOULD`, `MAY` (in the UI, colored badges "Mandatory / Recommended / Depends on the situation").
- This is done in the Overview tab (waves P6-01…P6-05) and in the Agent Pack (P8-02); the original text is not rewritten.

### 9.7. Phase P6 acceptance

- [ ] The Overview tab exists for all 22 chapters and passes the constraint linter (words, tables, diagrams).
- [ ] Every tab has a visual following the MAE grammar (section 7.1).
- [ ] Every text PR of a wave has an editor agent READY on HEAD; disputed points are resolved by the founder.
- [ ] Items 9.6.1–9.6.9 are closed by their own PRs; new chapters carry the "New in v2" badge.
- [ ] Repeat audit of presentation for people ≥ 85/100.

---

## 10. Phase P7 — gamification v2

### 10.1. Principle

**Reward competence, not scrolling.** A chapter read gives a few points; the main progress comes from decisions in drills that replay real forks from the guide. A belt cannot be "read" — it can only be earned by passing a test.

### 10.2. Core mechanics

| Mechanic | What it gives | Source in the guide |
|---|---|---|
| **Mastery levels** M0–M5 (section 2.2) | A long-term goal, status | Chapter 21 |
| **Skill map** (skill tree) | Visibility of the path, non-linearity | Routes from chapter 00 |
| **Drills** (section 10.3) | Practising decisions | Chapters 06–19 |
| **Level certification** | A check, not accumulation | Scenarios from chapter 18 |
| **Missions in a real repo** | Transfer to real life | Exercises from chapter 20 |
| **Spaced repetition** | Knowledge retention | Glossary, rules |
| **Evidence log** | Pride in what you did | The evidence record idea |

XP stays as the internal currency of progress, but on screen the mastery level and the map come first. Levels, the skill map and chapter progress in the mega menu are P7-02; spaced repetition is the card format of the P7-03 engine, while "today's review" and the drill of the day are the "Continue" block on the home page (P7-06).

### 10.3. Drills (interactive, MUST at least 8; P7-03 delivers 10)

Each drill is a short 2–5 minute session, 5–8 scenario cards, instant feedback with a link to a paragraph of the guide.

1. **"Is the ticket ready?"** (ch. 06) — a ticket is shown; the user marks which DoR fields are missing. Mistake → an explanation of why the AC "make it pretty" is not testable.
2. **"Preflight dispatcher"** (ch. 08) — the repo/ticket state; choose PASS / FAIL / BLOCKED / INCOMPLETE. Key traps: an unavailable diff ≠ an empty diff.
3. **"Risk sorting"** (ch. 12) — drag-and-drop change cards into Low / Medium / High. The catch: one line of CI permissions is more dangerous than hundreds of lines of docs.
4. **"Collision class"** (ch. 13) — two PRs side by side; choose isolated / file overlap / contract dependency / direct conflict.
5. **"Merge order"** (ch. 13.3) — build the dependency graph by dragging; a cycle → the correct answer is "there is no plan, the tickets need splitting".
6. **"Bug hunt"** (ch. 14) — a diff with a planted defect (for example `|| true` on fetching the diff); find the line, choose the severity, describe the scenario using the finding template.
7. **"What 'done' really means"** (ch. 07.2) — an agent's phrase → what is proven and what is not (READY TO MERGE ≠ permission to merge).
8. **"Source of truth"** (ch. 02.2) — a conflict between two sources; choose the canonical one and the next action.
9. **"Safe sync"** (ch. 16) — a checkout state; choose the safe action (no reset/clean).
10. **"Prompt injection"** (ch. 17) — text from a PR/page; recognise an instruction that is data.

The drill data format is JSON following the schema `content/gamification/schema/drill.schema.json` (scenario, options, correct answer, explanation, link to a chapter anchor, difficulty). Adding a new drill = adding a JSON file, no code.

### 10.4. Level certification and diagnostic (P7-04)

- A mixed set from the drills of the relevant chapters + one "boss case" (a multi-step scenario from chapter 18, for example "Dependent changes and an incomplete diff").
- Pass mark 80%; on failure, the topics to review are shown; a retake after 10 minutes (anti-guessing).
- Levels 4 · Architect and 5 · Master (M4–M5) MUST require a mission in a real repository (section 10.6), not only a test.
- **The 2-minute diagnostic** (a former v1.2 landing block): 8 questions → the current level and a personal route (one of the three routes from chapter 00); the result is saved in progress. Ticket P7-04; entry via the "Get started" rail item and Next steps on the home page.

### 10.5. Mentor (character, P7-05)

- The guide's playful voice ("bro") moves into a mentor character. It appears in drills, in exams and in empty states.
- Short lines, humour as in the original's epigraphs ("the tracker has its own opinion on this").
- A "No character" setting for those who want a strict mode.
- The character is original (its own design), with no borrowing of other people's mascots.

### 10.6. Missions in a real repository (P7-04)

The five exercises of chapter 20 become missions with an evidence checklist:
- the user pastes links (PR URL, SHA, CI run URL) and ticks items; the platform checks only the format (it does not call GitHub without authorisation);
- the result goes into the **Evidence log** — a personal "what I did" page that can be exported to Markdown.

### 10.7. Progress storage (P7-01)

- A `ProgressStore` interface (get/set/export/import/reset) on top of the existing keys `handbook-learning-v2`, `handbook-reading-v2`, `practice:*` (`src/components/localState.ts`, `learning-profile.ts`). Existing user progress MUST migrate without loss: the current XP rules (chapter +100, exercise +50) are carried into the new system, not reset.
- Adapter 1: `localStorage`, all calls in try/catch, the application works without it too.
- Adapter 2 (later, if accounts appear): sync through a backend — a separate founder decision, not done in phases P1–P9 of this brief.
- Export/import of progress to a JSON file.
- The progress schema is versioned (`progress.version`), migrations are covered by tests.

### 10.8. Gamification ethics (MUST NOT)

- Do not punish for skipped days (a streak only as a soft indicator, without "burning out").
- Do not give points for time on page or scroll speed.
- Do not use fake counters, artificial scarcity, "2 hours left" pressure.
- Do not hide content behind levels: all of the guide's text is always available, gamification is a layer on top.

### 10.9. Phase P7 acceptance

- [ ] 8+ drills on the JSON schema, each with links to chapter anchors.
- [ ] Certifications for 6 levels; levels 4 and 5 require a mission.
- [ ] The skill map reflects real progress.
- [ ] Progress survives a reload, is exported and imported; works with storage blocked (no crashes).
- [ ] All mechanics are keyboard accessible, drag-and-drop has a button alternative.
- [ ] The "No character" and "No gamification" modes.
- [ ] Chapter progress is visible in the mega menu; the "Continue" block on the home page leads to the next step (P7-02, P7-06).
- [ ] The diagnostic gives a level and a route and saves the result.

---

## 11. Phase P8 — Agent Pack (presentation for AI)

### 11.1. Contents (P8-01, P8-02)

```text
agent-pack/
├─ AGENTS.md            # ≤ 150 lines: roles, lifecycle, gates, links to skills
├─ CLAUDE.md            # @AGENTS.md + Claude Code specifics
├─ skills/
│  ├─ preflight/SKILL.md
│  ├─ independent-review/SKILL.md
│  ├─ post-merge-sync/SKILL.md
│  ├─ docs-impact/SKILL.md
│  ├─ spec-conflict/SKILL.md
│  └─ handoff/SKILL.md
├─ schemas/             # JSON Schema
│  ├─ ticket.schema.json
│  ├─ preflight-report.schema.json
│  ├─ evidence-record.schema.json
│  ├─ finding.schema.json
│  ├─ handoff.schema.json
│  └─ decision-packet.schema.json
├─ claude/
│  ├─ settings.json     # deny list of dangerous commands, hooks
│  └─ hooks/
├─ llms.txt             # a map for LLMs: what to read and in what order
└─ README.md
```

### 11.2. Rules

- Every rule has an explicit MUST/SHOULD/MAY strength.
- No explanations for people, no humour, no epigraphs.
- Every skill ≤ 300 lines, loaded on demand (progressive disclosure).
- The original's templates become JSON Schema + an example of a valid document.

### 11.3. Delivery (P8-03)

- A "Download Agent Pack (.zip)" button and an `/agents` page with a description.
- `/llms.txt` and `/llms-full.txt` at the site root.
- The Markdown of every chapter is served at the page address + `.md` (via `/agents` and `llms.txt`). The "Copy for agent" button and the "Page Markdown" link on pages and tabs (section 8.3) were removed by founder decision of 2026-10-29 (P8-05): they do not fit the style.
- The "Agent Pack" rail item (section 5.2).

### 11.4. Acceptance (fresh-agent exit test, P8-04)

A new Claude Code session in an empty test repository gets only the Agent Pack and the ticket DEMO-42. Success: the agent finds the rules by itself, writes a preflight report following the schema, works in a separate branch/worktree, opens a PR with evidence following the schema and stops before merge. The run protocol is saved in `docs/evals/`.

---

## 12. Phase P9 — music

- **P9-01** — music at the very end: tracks and licenses, player, no autoplay. Input: tracks and licenses from the founder (gate); a track without a confirmed license is not added. Until P9-01 there is no music button in the rail.
- Sound is switched on only with a button; there is a volume control, and the choice is remembered.
- **P9-02** — wave report and brief update after each phase (recalculating timelines, remapping, new founder decisions).

---

## 13. Publication

| Channel | What | When |
|---|---|---|
| ChatGPT Sites | The current PUBLIC version 20 — frozen as is | Not touched |
| Vercel | Production from `main` on `vibe-coding-guidebook-ivory.vercel.app` (P1-16, ADR-0002): every merge is a production deploy; a preview on every PR behind Deployment Protection | From phase 1; the redesign without a flag (section 14) |
| GitHub | Sources, Agent Pack, harness template | Always |

A custom domain or alias, moving the audience from the old address, changes on ChatGPT Sites and weakening Deployment Protection are a founder gate.

---

## 14. Development process (dogfooding)

- **Tracker:** GitHub Issues + Projects in the repository (MAY be Linear, if the founder decides). Every ticket follows the chapter 06 template (a YAML block in the issue description).
- **Branches:** `p1-04-content-pipeline` (phase-number-slug).
- **PR:** a template with `Implements #NN`, Risk, Docs Impact, Evidence, Limitations.
- **Review:** a separate clean session (a subagent or a separate run) using the reviewer prompt from chapter 14.4; the verdict is bound to the HEAD SHA. For simplified learning texts, additionally the editor agent (section 9.5).
- **No `NEXT_UI` flag** (ADR-0003): the new UI and new texts ship straight away, without a switch or a parallel version of the site.
- **Merge** (founder delegation of 2026-10-22 and 2026-10-26): every PR is merged after independent review READY on the current HEAD and green CI on that HEAD — both checks, `validate` and `e2e`; for texts, also an editor agent READY. The merge is done by the orchestrator — the session that runs a wave or stream of tickets on behalf of the project coordinator (founder delegation of 2026-10-22: "merge everything yourself after independent reviews"; 2026-10-26: no flag, speed is the priority); the ticket author, helper subagents and the reviewer do not merge — the author stops before merge and hands over the package (AGENTS.md). Merge is a squash with a check of the expected HEAD SHA; then post-merge sync.
- **Production:** a merge to `main` immediately creates a production deploy; after the merge you MUST check that the deploy is READY on the merge commit's SHA. **Rollback is a revert PR** through the same process; manual promote and rollback in Vercel only by founder decision (ADR-0002).
- **What the founder sees:** a line in the thread after every merge, a Friday "build of the week", 4 checkpoints (section 6.3). A PR package before merge (if the founder wants it): the Vercel preview, for UI — screenshots at 320 / 360 / 768 / 1024 / 1440 px in both themes and 3–5 "things to try"; sent only after green CI and review READY. For a phone, a temporary Vercel share link; Deployment Protection is not weakened. A local run on the founder's machine only at their request, via Remote Control.
- **Founder gate (remains):** a custom domain or alias; ChatGPT Sites and `.openai/hosting.json`; weakening Deployment Protection, manual promote/rollback; new runtime dependencies outside the brief; disputed meaning of learning content (section 9.5); music tracks and licenses (P9-01); a backend with accounts (section 10.7).
- **Parallelism:** the first 2 weeks, 3 streams; from week 3, up to 5; collisions and merge order per chapter 13.
- **GitHub auto-merge** (merge without the orchestrator) is not enabled until the founder approves an ADR (section 9.6.5).
- **Report after each wave:** what was done, PRs, evidence, what is blocked, the next tickets (P9-02).

---

## 15. Project risks

| Risk | Impact | Mitigation |
|---|---|---|
| Vinext is in beta (1.0.0-beta.5) | Breakage on updates, harder hosting migration | Pinned versions, updates as separate tickets, hosting ADR (P1-06) |
| Mermaid rendering requires Chrome | New diagrams do not build in CI | Reuse SVGs by hash; a separate CI job with Chrome |
| Two live addresses (ChatGPT Sites and the new one) | Readers see diverging versions | The old address is frozen; after the new one launches, a founder decision on redirection |
| Rights to screenshots of third-party products | Legal | Keep only official frames with a link to the source; when in doubt, a link without a copy |
| Facts in the tool overviews go stale | Trust | Fact dates, a staleness badge, scheduled updates (9.6.8) |
| Gamification distracts from the meaning | Learning quality | Rewards for decisions, a "no gamification" mode, ethics 10.8 |
| Static export breaks SPA navigation (RSC) on Vercel | Parity | Spike P1-06 with evidence; fallback option B — server rendering |
| Scope creep | Timelines | Order by the ticket dependency graph (section 6.2), everything new as separate tickets |
| Simplified text quietly changes the meaning of rules, and the founder does not proofread it | High | The editor agent checks against the original: definitions, MUST rules, terms, links; disputed points as a separate line to the founder (9.5) |
| Without a flag the site is for a while half old, half new | Low | The site is not in use yet; the new shell comes first, old chapters open inside it as a single tab; every merge passes `validate` and `e2e` (5.5) |
| "Adopt it as a whole" turns into a copy: the illustrations, brand and Google Sans font belong to Google | Medium | We take the mechanics and structure and draw our own visuals and shapes (5.1) |
| The hover mega menu is inaccessible from a phone and the keyboard | Medium | Opening on focus, tap and arrow key, closing on Esc, e2e tests (7.2) |
| Animations slow down loading and cause motion sickness | Medium | Reduced motion (the pause button was removed, P3-09), calm motion without constant animations, an LCP budget < 2.5 s (8.5) |
| Splitting breaks old links and anchors | Medium | 308 redirects and a test of all old addresses (P2-05, P5-03, P5-05) |
| Simplification distorts the meaning of rules | Medium | The full text stays in "How it works" and "How to apply", review and the editor check the meaning |
| Music is annoying or turns on by itself | Low | Only with a button, volume control, the choice is remembered (section 12) |

---

## 16. Decisions needed from the founder

Made on 2026-10-26 (plan RD-01, ADR-0003): the "Blueprint" concept in UIX PRO brand colors and the fonts (01); the new phase order and replacing the landing page with the M3 home page (02); no flag for the new UI (03); rebranding together with the new home page, P4-05 (04); 9 rail sections (05); Tabler icons (06); music at the end, P9 (07); text proofreading by the editor agent (08).

Open:

1. ~~Name~~ — decided: Mastering Agentic Engineering, rebranding in P4-05. Open: the domain (section 2.3).
2. Hosting — Vercel (decided 2026-10-22), production from `main` (2026-10-23, P1-16). Open: a custom domain and what to do with the old address on ChatGPT Sites.
3. ~~Visual direction~~ — decided on 2026-10-26 (ADR-0003).
4. Tracker: GitHub Issues (default) or Linear.
5. Approval of the GitHub auto-merge policy without the orchestrator (ADR) — later (section 9.6.5).
6. Public or private repository and license (the original is labelled "Open Source" — a specific license is needed, for example MIT for code and CC BY 4.0 for text).
7. Tracks and licenses for the music (P9-01).
