# Continuing development in the cloud

Handoff date: 2026-10-11. Repository: https://github.com/Makkov-Office/vibe-coding-guidebook, branch `main`. This is an existing project: continue development, do not create the portal from scratch.

## Current version

Site: https://agentic-engineering-handbook-makkov.makkov.chatgpt.site. PUBLIC version 20 was published successfully from commit `a99332ce9cd9d8e40a88552c7803b5bd5ccbf0f7`. Only context-handoff documentation was added after it; the learning content and the application code match the published version. Git history is preserved.

## What we are building

ULTIMATE Vibe-coder guidebook [BETA] is a learning portal, built for the author's brother, about engineering work with AI agents. React, TypeScript, Vinext, npm and package-lock.json. Do not add a backend or a real agent runtime without a separate request.

- Learning content, definitions, collections, overviews and image captions are edited only in `content/handbook.md`; the chapters' Overview layer with tabs lives in `content/overview/NN.md` (brief 8.1–8.2, P5-01). Generated files are updated by the standard pipeline.
- Home page `/`, 22 chapters `/chapters/01`–`/chapters/22`, `/glossary`, `/resources`, `/tools`, `/tools/codex`, `/tools/claude-code`, `/print`. Orientation 00; 394 definitions, 11 topics, 6 Mermaid diagrams.
- Implemented: global search, expandable details, in-context definitions while reading, example panels, an interactive map, local checklists and a learning profile: 100 XP per chapter, 50 per exercise, four levels and achievements. There are no exams and no mandatory completion.
- The shared interface persists across pages; the search index loads separately, definitions are delivered per page, Mermaid is generated at build time. There is a navigation progress indicator and a skeleton; the text is available in the initial HTML.
- Short definitions open above the term: plain ones as a tooltip, ones with a link to a service as a compact popover without a close button. Long ones open as a desktop drawer / mobile bottom sheet. The official link is text with an up-right arrow. Preserve keyboard support, focus, history, no-JS and reduced motion.

## Design and style

Replaced by the "Blueprint" v2 visual language (brief v1.3, ADR-0003, `docs/design/visual-language.md`, tokens `app/tokens.css`); below is the original style description.

Linear: background #010102, graphite surfaces, violet #5e6ad2, thin borders. Self-hosted Manrope and JetBrains Mono. Tabler Outline 20 px / stroke 1.75. Service brand marks 20 × 20 px, not stretched; Context7 is the wide original wordmark at 20 px height.

Approved: the FLOW symbol, the name ULTIMATE Vibe-coder guidebook [BETA], the source SVG by Makkov and the Open Source badge. The desktop rail is pinned on the left; the mobile menu is a drawer. Navigation has no extra chapter numbers. Primary buttons are filled; do not bring back underlined links in place of important buttons. Avoid repeated actions, empty tables of contents, double dividers and explanatory UI noise. The user asks for strong design in every detail and concise text without filler.

## Latest update and limitations

The Codex/Claude overviews gained Dots, Mods, Artifacts and other capabilities, subscriptions and limits; the research date is shown: 2026-10-11. There are 29 verified illustrations (15 Codex / 14 Claude), 26 "Where to find / Benefit / When to use" blocks, 26 official logos. Sources and SHA-256: `docs/codex-screenshot-sources.json`, `docs/claude-screenshot-sources.json`, `docs/product-logo-sources.json`. Illustrations are local, lazy-loaded and open at full size.

The latest audit honestly established incomplete coverage; these are not new agreed tasks:

- Screenshots are given per group of capabilities, not separately for each sub-feature. Six Claude illustrations show documentation, not product UI. Historical frames are labelled.
- Feature icons are still mostly Tabler; Sites is marked with a plain globe, not a confirmed brand mark.
- Not every name has its own logo: JetBrains, npm/pnpm/Yarn, Corepack, Dev Container.

Do not declare these items done and do not fix them automatically in place of a new user request. Do not invent images or brand icons. For changes to the overviews, check the current official documentation, releases, pricing and limits.

## How to continue

1. Read this file, `README.md`, the current part of `docs/implementation-notes.md`, then the relevant code and `content/handbook.md`.
2. Check `git status`, the current branch and the actual environment. Work with the existing history, without force push and without unagreed refactorings.
3. Standard setup: Node.js >=22.13, `npm ci`. Development: `npm run dev`. Checks: `npm test`, `npm run typecheck`, `npm run build`. To change Mermaid in a new environment you need an available Chrome and, if necessary, `MERMAID_CHROME_PATH`; unchanged SVGs are reused.
4. The latest confirmed checks of the published version: 7 content tests, typecheck, production build with 30 prerendered routes, 0 unexplained gaps. The overviews were checked at 320/360/768/1024/1440 px. Detailed results and limitations are in implementation-notes; do not present old checks as fresh ones.
5. `.sites-runtime`, node_modules, dist, local credentials and browser state are not in GitHub. The original documents from the parent Windows folder are not in this nested repository; the working learning source is already inside it.
6. GitHub stores the sources; the published site is served by native Sites. Publishing uses the existing project_id `appgprj_6ac7663d93808191be53ad452b2eb4d7` from `.openai/hosting.json` and keeps the agreed public access. Do not create a new Site and do not change hosting. If native Sites is unavailable in a cloud session, report the limitation honestly; a push to GitHub by itself does not count as publishing the site.

## Prompt for the first cloud session

```text
We are continuing development of ULTIMATE Vibe-coder guidebook [BETA] in the repository Makkov-Office/vibe-coding-guidebook, branch main. This is an existing project moved to GitHub; do not create anything from scratch.

First read docs/cloud-handoff.md, README.md and the last part of docs/implementation-notes.md. Check git status, the environment and the current implementation. Preserve the current Linear design, the FLOW/by Makkov brand, the content pipeline and the Git history. Change learning content through content/handbook.md. Write concisely in the founder's language, without filler. Do not treat the gaps listed in the handoff as automatically agreed tasks.

After reviewing, briefly confirm your understanding of the current state. In my next message I will give a specific change to implement.
```

## Prompt for the next change

```text
Continue the existing project using the context in docs/cloud-handoff.md. Task: [insert the change]. Make only the necessary changes, check the relevant scenarios and responsive layout, run the appropriate checks. Deliver the result through the normal workflow of this cloud session and state what was changed and checked. Describe the GitHub state and the site publication separately; do not change hosting or public access.
```
