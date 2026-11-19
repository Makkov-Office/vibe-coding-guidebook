# ADR 0003: Redesign on the Material 3 model — the "Blueprint" concept, 9 sections, no flag

Status: Accepted — 2026-10-26, founder decisions 01–08 on plan RD-01 (21:15Z; here and below, times are the UTC times of the founder's messages in the project thread; the RD-01 log shows them rounded). Recorded in the repository by ticket P2-01 (https://github.com/Makkov-Office/vibe-coding-guidebook/issues/35) together with brief v1.3 (`docs/PLATFORM_BRIEF.md`, sections 5, 6 and 14).

## Context

- Brief v1.2 ran the project in the order "content → presentation → gamification → landing → Agent Pack" and kept the original's design (Linear style: background `#010102`, accent `#5e6ad2`, Manrope) until a founder decision on a new visual direction (principle 9, section 8.5 of v1.2).
- On 2026-10-26 the founder asked to carry over the m3.material.io model in full: a navigation rail with a mega menu on hover, a home page made of cards, "Start" with a sticky visual, page tabs that collapse into the header; the visual language of interfaces.dev; in the roadmap — simpler texts, gamification, Agent Pack, music later.
- Site facts (plan RD-01, `src/content/generated.json` on `main` 876b0e9): 27 pages; the glossary and the Claude Code and Codex overviews are over 80 thousand characters of HTML each; Mermaid diagrams appear on only 6 of 27 pages (chapters 01, 02, 04, 07, 13, 17).
- M3 mechanics were checked on the live site in Chromium on 2026-10-26 (RD-01): the home page, Get started, the Buttons page with all 4 tabs (each tab has its own address), the Components mega menu, the tab bar collapsing into a floating "pill" on scroll.
- Production from `main` was enabled on 2026-10-23 (P1-16, ADR-0002): every merge is a production deploy. The founder delegated merge to the orchestrator after independent review READY (2026-10-22).
- Founder, 2026-10-26: "nobody uses the site, we can change it boldly, speed is the priority"; the founder does not want to be a bottleneck in accepting every PR and in proofreading texts.

## Options

| Question | Option | Outcome |
|---|---|---|
| Visual concept | A · "Lilac" (draft): closest to M3 — tonal surfaces with a lilac tint, 24–28 px corner radii, Manrope with no new fonts | Rejected: without our own illustrations it looks like an M3 clone; the dark theme is weaker |
| | B · "Aurora" (draft): gradients and depth, a glowing hero, the dark theme as primary, Unbounded + Onest | Rejected: gradients are hard to keep in one style across ~70 pages, heavier for weak phones; the wide Unbounded works worse in long headings |
| | C · "Blueprint" with a blue accent: interfaces.dev minimalism, thin outlines, annotations | Basis chosen 2026-10-26 19:43Z; the blue accent was replaced with the brand colors (downsides: less color than the founder asked for, a weaker sense of renewal next to the Linear style) |
| | C in a bronze palette | Rejected by the founder 2026-10-26 |
| | **C · "Blueprint" in the UIX PRO brand colors** | **Chosen** (2026-10-26 20:40Z, fonts — 21:02Z) |
| Rollout | A `NEXT_UI` flag: the new UI behind a switch, a permanent "New version" link, enabled after acceptance | Rejected: nobody uses the site yet, speed matters more; any step can be rolled back by reverting its PR anyway |
| | **No flag: every verified merge goes straight to production** | **Chosen** (decision 03) |
| Icons | Material Symbols: 3,932 icons in each of 3 styles, Apache 2.0, closest to M3 | Rejected: 29 of the 34 needed spots; the git icons are approximate, no AI "sparkles" and no GitHub, OpenAI, Vercel, Figma logos; a new dependency |
| | Lucide: ≈ 1,900 icons, ISC; the `lucide-react` package is present but unused in the code | Rejected: 30 of 34 spots, no logos and no filled variants for the active menu item |
| | **Tabler: 5,184 outline + 1,054 filled, MIT, already in the project (`@tabler/icons-react` 3.49.0)** | **Chosen** (decision 06): 34 of 34 spots, adjustable stroke width |
| Site entry | A landing page for a new visitor + a dashboard for a returning one (v1.2, phase 5) | Replaced: an M3 home page for everyone + a "Continue" block |
| Rail sections | 7 items, as in M3 | Rejected: we build for our material, not for M3's number of sections |
| Proofreading of simplified texts | The founder proofreads every text PR | Rejected: the founder is a bottleneck across the 5 waves of P6 |

The icon numbers come from the latest npm package versions as of 2026-10-26; coverage is measured against the list of 34 spots in the guide (RD-01).

## Decision

1. **The M3 model is carried over in full — mechanics and structure, not visuals.** Navigation rail (search at the top, 9 items, theme and animation Play/Pause buttons at the bottom), a mega menu on hover with the section tree, progress and "Continue", reachable by focus, tap and keyboard; a home page made of cards (hero, 8 section cards, "Continue", Next steps, footer); "Start" — a scroll story of 5 steps with a sticky visual; a topic page with 4 tabs **Overview / How it works / How to apply / Check yourself**, each with its own address, the tab bar collapsing into the header; On this page, Previous / Up next, copy link, "Do / Don't", numbered anatomy. The brand, illustrations and the Google Sans font are not used: we draw our own visuals and shapes.
2. **Structure:** 9 rail items — Home, Start, Basics, Process, Control, Reliability, Practice, Tools, Agent Pack; the reference section (cheat sheet, glossary) lives in search and the footer. About 27 → about 70 pages. The v1.2 "Short / Full" switch is replaced by tabs: "Overview" is the short layer, and the full text of the original is in "How it works" and "How to apply". Learning content stays in `content/` and is built by the standard compiler.
3. **Visual language — the "Blueprint" concept in the UIX PRO brand colors** (makkov.com/uixpro): graphite `#101010` and white; the accent is the brand coral gradient (white → `#F87352` → `#5D5D5D`), accent text on light `#B4401F`, only for action and progress ("Your path"). The brand's three module colors carry three fixed meanings: `#E4CAFF` "Agent", `#CAFFDA` "Practice", `#FFE9CA` "Human decides". A background without decoration; the "+" pattern from the brand site appears only on the hero of the home page and "Start". Fonts: Unbounded 500 (hero, H1), Geist (headings, text, UI), Martian Mono (code, annotations, diagrams), Pixelify Sans (game labels of up to three words) — as self-hosted files in the project. Motion: one curve `cubic-bezier(.2, 0, 0, 1)`, 120 / 240 / 480 ms, four techniques (appearance, draw-in, movement, step change). Full specification — `docs/design/visual-language.md` (P2-02), tokens — P2-03.
4. **Icons — Tabler**, 1.5 px stroke, a vocabulary by role; the active menu item gets a tonal "pill" and a filled icon where one exists; `lucide-react` is removed from the dependencies (P2-06).
5. **Phase order:** P2 design foundation, P3 shell and navigation, P4 home page + "Start" + rebranding to Mastering Agentic Engineering (P4-05), P5 topic page and splitting, P6 simpler content (waves; the gaps from the old phase 2 audit go here too), P7 gamification v2, P8 Agent Pack (in parallel), P9 music. 40 tickets, 14 weeks — an upper estimate (brief, section 6).
6. **No `NEXT_UI` flag.** Each PR is merged after independent review READY on HEAD and green CI (`validate` and `e2e`) and goes straight to production; rollback is a PR revert. The orchestrator merges — the session that runs a wave or stream on behalf of the project coordinator; the ticket author stops before merge. The founder reviews 4 checkpoints: week 2 — the showcase (P2-04), week 5 — the shell (P3-01), week 6 — the pilot of chapters 01/08/12 (P5-04), week 7 — the home page and rebranding (P4-01, P4-05).
7. **Proofreading of simplified texts — a separate editor agent**: it checks definitions, MUST rules, terms and links against the original; the verdict is bound to HEAD; disputed meaning goes to the founder as a separate line. The founder does not proofread texts, except the new learning content of P6-06: it still requires founder approval (brief, section 9.5).
8. **Founder gates that remain:** a custom domain or alias, ChatGPT Sites, weakening Deployment Protection (and manual promote/rollback per ADR-0002), new runtime dependencies outside the brief, disputed meaning of learning content, music tracks and licenses.

## Consequences

- Pros: one clear navigation and page model for all sections; long pages are split into tabs, and each tab has a visual; meaning-colors help read a page without captions; the founder does not stand in the way of every PR.
- For a while the site is half old, half new: the shell is built first, and old chapters open in it as a single tab. Mitigation — `validate` and `e2e` on every merge, 308 redirects and a test of all old addresses (P2-05, P5-03, P5-05).
- An error in production is visible immediately; the protection is independent review, CI and a fast revert, not a flag.
- The main risk is the meaning of simplified text, not the code: the editor agent covers it; the full text of the original stays in the "How it works" and "How to apply" tabs.
- Four fonts require role discipline; coral is too light for text on white, so in the light theme the accent text is darker (`#B4401F`); text contrast is 4.5:1 or higher in both themes (WCAG 2.2 AA, principle 7).
- Brief v1.3: principle 9 of v1.2 ("Linear style until a founder decision") is replaced by a reference to this ADR; the phase 5 landing page of v1.2 is replaced by the M3 home page and the "Continue" block; the requirements of the old phases 2–6 are remapped to P2–P9 (brief, section 6.4).
- AGENTS.md: rebranding is in phase P4 (P4-05); proofreading of simplified texts by the editor agent is an exception to the rule "changes to learning content — founder", within the limits of the brief, section 9.5 (P5-04, P6-01…P6-05, P6-07).
- ADR-0001 (merge only by founder decision) is in practice replaced by delegating merge to the orchestrator (founder decisions of 2026-10-22 and 2026-10-26, brief v1.3, section 14); the rule "the ticket author stops before merge" still applies.
- Icons: `lucide-react` leaves `package.json` in P2-06; no new icon packages. Fonts are included as files, without loading from Google on every visit.
- Addresses (P2-05): sections `/start`, `/base`, `/flow`, `/control`, `/reliability`, `/practice`, `/tools`, `/agents`, reference `/reference`; a chapter — `/<section>/<NN-slug>`, tabs — path segments (Overview — the chapter address, `/how-it-works`, `/apply`, `/check`). Source — `src/content/url-map.json`, rules and test — README, section "URL map". A 308 from the old address turns on by itself once the new page is in the build; a page outside the map breaks the Vercel build.

## Validation

- P2-01: brief v1.3 and this ADR, `npm run validate` PASS on HEAD, CI `validate` and `e2e` green.
- Founder checkpoints 1–4 (brief, section 6.3) — a package with a link to the main site, screenshots at 320 / 360 / 768 / 1024 / 1440 px in both themes and "what to try" items.
- P5-04: a usability test of the pilot with 3 people; P5-05: old addresses, LCP < 2.5 s, Lighthouse ≥ 90/95, accessibility.

## Rollback

A documentation decision: rollback is a revert of PR P2-01 (the brief returns to v1.2, the ADR is deleted). Each later redesign step is rolled back by reverting its own PR; a manual rollback in Vercel happens only by founder decision (ADR-0002).

## Revisit trigger

The site gets regular users (then return to the question of a flag or a staged rollout); a founder checkpoint FAIL; the editor agent misses a distortion of a rule's meaning; a re-estimate of timelines after P2 (P9-02); the founder changes the decision on the palette, fonts or icons.

## Sources

- Plan RD-01 "MAE redesign plan" of 2026-10-26 (a founder artifact; copy at `/mnt/project-files/redesign/mae-redesign.html`): sections "Structure", "Roadmap", "Tickets", "Decisions", "Testing", "Risks".
- m3.material.io: home page, `/get-started`, `/components/buttons/overview`, `/specs`, `/guidelines`, `/accessibility`, the Components mega menu — checked in Chromium 2026-10-26 (RD-01).
- interfaces.dev: home page and the issue "Details that make interfaces feel better" — 2026-10-26 (RD-01).
- makkov.com/uixpro — the UIX PRO brand colors (RD-01, 2026-10-26).
- Icon npm packages, latest versions as of 2026-10-26: `@tabler/icons-react`, Material Symbols, `lucide-react` (RD-01); the Google Fonts catalog — the fonts' Cyrillic coverage was checked 2026-10-26 (RD-01).
