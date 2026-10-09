# Implementation notes — learning portal 1.2

## Delivered behavior

Separate chapter URLs /chapters/01–22, orientation /, glossary /glossary and expanded /print. Source data is compiled during build; the page's teaching HTML is present on first response. Fixed left rail 264px >=1024px; local outline >=1360px; accessible drawer below desktop. Linear tokens/fonts retained; Tabler 20px / stroke 1.75.

Editorial audit 1–5 and 7–9 applied. Private repo/conversation links, real internal ticket/PR identifiers, product provenance and chapter 24 removed. Chapter 18 is four anonymized transferable cases; integration sequence is an illustrative plan, not a completed merge. Future Control Center shortened to an optional disclosure. Brother exercises retained, five optional checkboxes added, four small humorous inserts. Additional examples/explanations folded with authored disclosure boundaries; mandatory rules and operational checklist remain visible.

Current inventory: **22 teaching chapters + glossary, orientation 00, 394 definitions, 11 topics, 6 Mermaid diagrams**. The prior inventory was deliberately reduced by approved editorial cleanup. Parent prompt and handbook remain unchanged (SHA256 verification). Source/download byte parity is retained.

All appropriate term occurrences remain annotated. <=160 visible characters in a single plain paragraph -> anchored tooltip; long or structured -> nonmodal side panel >=768 / modal bottom sheet below 768. Actual definitions remain short; the long branch is browser-tested with isolated hydration fixtures, not artificial production text. Tooltip preserves URL/history/scroll and supports keyboard, repeated activation, Escape, outside/focus dismissal and viewport clamping. Context panels use native dialog, focus return, safe-area/scroll handling, breakpoint modality adaptation and mobile backdrop dismissal.

Template drawers apply only to the chapter 06 ticket and chapter 14 review prompt, alongside the original disclosures. Exact source copy and term references are available in both. A long definition temporarily replaces an example panel with a return action. Explicit glossary links clear filters, focus/highlight the exact record, and preserve a stable originating occurrence for return. Preview itself adds no history entries.

Learning is explicit and local: 22 completion marks with undo, four group achievements, five optional exercises, resume and reset. Existing practice keys survive; old longread position migrates to the corresponding chapter's beginning rather than misusing an absolute scroll coordinate. When browser storage is refused, a shared tab-memory fallback retains completion, exercises, practice and reading state across SPA routes until reload; the message names this limit. Clipboard refusal retains manually selectable source.

System map supports overview and ten guided stages, highlighted connections, role authority, named responsible owner, expected evidence and chapter links. Mobile guided mode shows one stage with previous/next; overview nodes scroll to their detail. Lifecycle preserves happy/review-findings/unavailable-evidence and separate post-merge sync. All diagrams and simulations are educational only.

## Evidence

- Content suite: **5 passed**; hashes/parity, inventory/targets/safe HTML, appendix rejection, matcher and 160/161/structured preview cases.
- Coverage: **2347 annotated occurrences, 0 ambiguous, 0 unexplained gaps**. Final fragments include owner/evidence states and glossary preview HTML with declared recursive-annotation exceptions. Unique IDs and route targets validated; old block/checklist IDs retained where source meaning is unchanged.
- Browser: **16 passed** against the local production Worker; results are recorded in `browser-results.json`. It includes mobile tooltip top-layer hit testing, full-width sheet geometry, exact scroll/focus restoration at 1440/360px, and storage-denied marks/reset across SPA routes.
- Widths **320, 360, 768, 1024, 1440** and 200% CSS zoom stress (640px viewport / effective 320px layout): reader/filter/checklist/map/drawer overflow and geometry checked. Tooltip zoom/clamping tested separately. Canonical paths, reload, native history, old bookmarks, global search and hidden results verified.
- Tooltip does not change URL/history/scroll; template copy equals registry raw source including Unicode/newlines; mobile sheet is modal, desktop drawer nonmodal; long-definition fixture/return-to-example/explicit glossary return tested.
- Storage and clipboard denial, reduced motion, no-JS chapter/glossary navigation, full-source print and all six strict Mermaid renderings verified.
- axe-core: **0 WCAG 2 A/AA and 2.1 AA violations** in tested chapter, map, glossary, open tooltip and mobile template modal states. No page errors observed in audited reader/map/glossary routes. This is automated/keyboard evidence, not manual screen-reader certification.
- Typecheck and lint passed. Production build passed. The client build preserves entry signatures (`strict`) because Vinext dynamically consumes router namespace exports; production sidebar/search/history smoke verifies the fix without changing dependencies. Vite reports existing large lazy Mermaid chunks and Vinext route-classification limitations. No performance score is claimed.
- Postbuild publication scanner checks public/dist text assets for excluded provenance/appendix and exact downloadable source. Current scan passed on 298 assets; native packaging reruns the build/audit.

## Artifacts and release

README documents editing, routes, preview classification, compatibility registries, storage and coverage. Screenshots: desktop, mobile-navigation, lifecycle, system-map-desktop/mobile, term-tooltip-desktop, template-mobile. Implementation checkpoint is in `implementation-state.md`.

The existing native Site is owner-controlled and **public by explicit user authorization**. Publishing uses its current project ID, native source workflow and archive-backed save/deploy. The deployment status and URL are confirmed only from native hosting output; see the final task handoff for that result.

Manual NVDA/VoiceOver and Lighthouse were not run. No backend, real agent runtime, analytics, accounts or cross-device synchronization were introduced.


## Branding update — 2026-10-09

Approved name: **ULTIMATE Vibe-coder guidebook [BETA]**. FLOW is now a clean two-path, rotationally balanced violet SVG in the header and favicon. Author credit **by Makkov** uses the exact provided white vector (SHA256 `4e23aa7ae374ed45e2aae4fd7b876ac556460b3862acf3ed68f63a17cf933fde`); original Desktop file is untouched. A separate noninteractive **Open Source** badge appears on the home page and reader footer. The print page includes author credit; printed SVG becomes black through CSS.

Fresh branding verification: 10 browser combinations (home and chapter22 at320/360/768/1024/1440), complete title/metadata, loaded SVGs, viewport bounds, mobile drawer and print author contrast. axe returned0 violations and browser console/page errors were0 after waiting for hydration before inspection. Evidence: `brand-qa-results.json`, `screenshots/brand-desktop.png`, `screenshots/brand-mobile.png`. Typecheck, lint and all5 content tests pass. Teaching/source/download parity is unchanged apart from the approved title; current coverage2344 occurrences,0ambiguities/0unexplained gaps (three removed old title occurrences). Existing portal behavior is preserved.

### Primary actions and progress alignment — 2026-10-09

Continue reading now uses the shared filled accent action style. Progress actions use a wrapping flex row with aligned 44 px controls; mobile actions occupy full width. Removed the legacy resume top margin. Unmarked chapter completion uses the same accent style; reset remains secondary. Verified local browser at 320, 360, 768, 1024, 1052 and 1440 px: no horizontal overflow, equal desktop button positions/heights, no link underline, successful resume navigation, no browser console errors. Typecheck and lint passed.

### Navigation scrollbars and reading position — 2026-10-09

Added thin graphite scrollbars to desktop navigation, chapter outline and mobile navigation drawer. The main page uses a 2 px accent reading-position line immediately below the header; native vertical page scrollbar is hidden after hydration. Position updates on scroll, resize and content expansion (ResizeObserver). No-JS and forced-colors retain native page scrollbars. Local browser verified top=0, intermediate scroll=0.723125, bottom=1, desktop outline at 1440 px and mobile drawer at 360 px; keyboard scrolling and menu Escape work, console errors=0.

### Chapter navigation cards — 2026-10-09

Replaced loose previous/next text with full clickable cards, clear direction labels, stronger chapter titles and filled accent next action. Desktop cards share equal row height; mobile cards stack and grow for long titles. Explicit previous/next classes fix the final glossary card alignment. Browser checked all 22 chapter routes at 320 px: correct neighbors and no page/card overflow. Checked equal 120 px desktop cards at 1052 px, 1440 px grid, keyboard Enter into glossary and the single final previous card. Browser errors=0; typecheck passed.

### Footer alignment and interface copy — 2026-10-09

Footer actions now share a three-column grid, icons and equal 44 px height; mobile uses a single column. Removed repeated sticky chapter title and chapter-number/pace kicker globally. Removed the footer example disclaimer, permanent table-scroll caption and repeated term-click hint. Teaching content and essential limitations are unchanged. Local browser verified footer geometry at 320/360/768/1052/1440 px, no overflow, and removal across home/chapter 22/glossary; console errors=0. Typecheck passed.

### Navigation hierarchy and redundant labels — 2026-10-09

Removed chapter numbers, sidebar content heading and repeated group icons from desktop/mobile navigation. Five milestone groups have stronger headings, borders and spacing. Removed visible local-outline/filter/selected-node captions and generic empty search instructions. Drawer/search titles remain screen-reader-only with intact dialog names and input labels. Map retains its educational-model limitation and guided step counter. Browser verified 0 chapter-number/sidebar-label nodes, active chapter, all group separators, 360 px drawer with no overflow and Escape, chapter 02 caption; console errors=0. Typecheck/lint passed.

### Motion and interactive feedback — 2026-10-09

Added reader entry, hover lift/arrow motion, press response, selected-node pulse, staggered achievements, drawer/search entry and progressive CSS details height transitions. Panel selection animates existing detail content with Web Animations without remounting focused controls. All effects are gated by prefers-reduced-motion; print restores fully visible details. No dependencies added. Browser verified node selection updates to Linear, selected animation name, expanded details with 260 ms transition, mobile drawer animation and no overflow, Escape and no console errors. Typecheck/lint passed. Reduced-motion gating checked in source; OS preference was not changed.

### Tooltip placement — 2026-10-09

Tooltip placement now prefers above the trigger with an 8 px gap; falls below when top space is insufficient, clamped to a 12 px viewport margin. Existing zoom and horizontal constraints retained. Browser verified Entrypoint tooltip above its trigger at desktop and 360 px, within horizontal viewport, Escape closes. Typecheck/lint passed.

## 2026-10-09 — Useful resources and independent UX/UI audit

- Added /resources,29 curated external links in6categories: videos3, channels3, articles/standards6, original-documentation7, repositories6, services4. Descriptions include language/level/chapter context; vendor material distinguished from independent evidence; no private provenance restored. Sources checked through web on2026-10-09; YouTube channel pages may show consent rather than full catalog, so video playback is not claimed. Canonical source remains content/handbook.md; download and print/search include resources. Each item has its own anchor/search entry;22learningchapters unaffected.
- Fresh compiler:24contentpages (22chapters,glossary,resources),394terms11topics6diagrams,2382linkedoccurrences,0ambiguities/0unexplainedgaps.5contenttests passed; typecheck and lint passed before packaging.
- New independent UX/UI audit report docs/ux-ui-audit-2026-10-09.md.8acceptedfindings corrected: keyboardsearchscroll+combobox semantics, checklisttextactivation, per-routetitles, resetbuttononlywithchecklists, contextualtermsemantics, clearingstalecopystatus, modalbackdropclose, Entersearchreopen/focusrace. Reader/panelheadinghierarchy also corrected.
- Browser: resources320/360/768/1024/1440 no document/cardoverflow;29cards/links; active sidebar matchesresources; no chaptercompletion shown; searchHowIuseLLMs targets exactitem; Enter leaves0dialogs andfocusonitem. Mobile320backdropclose verified withfocusreturn. Newagentcheckedmapall5widths,03tooltipabove/Escape,06desktopdrawer/360sheet85dvh/bodylock/focusreturn,22checkbox20px/textclick, glossaryfilter/reset,07all3scenarios,13all4collisions,21M0–M5 andcompletion/undo. Capturedconsoleerrorsnone incheckedstates. Native-resetcancel test encountered automationtimeout andwasnotaccepted; no reset-successclaim. No new OSzoom/noJS/print/storagefailure/screenreader fullpass; previous baseline results remain historical, not rerunclaims.

Production build and postbuild publication audit passed for resources/UX release: source/download identical; no appendix/private provenance. Screenshots: resources-desktop.png, resources-mobile.png. Native deployment receipt follows.

## 2026-10-09 — Performance implementation and learning profile

- Implemented persistent reader route-group layout, compact per-page definitions/blocks/outline, lazy hash-versioned search and legacy-anchor assets. Search text normalized once after loading. Internal profile and glossary-panel navigation uses Link. Removed per-page Reader key and browser Mermaid import/render observers.
- Build-time Mermaid strict SVG: 6/6 cached assets, 140211 bytes combined, no external/script/event/foreignObject SVG content. Individual failure opens source with a visible diagnostic. No modification to teaching Markdown/download.
- Chapter03 page-specific metadata is 27262 bytes/53 definitions versus prior audited645157 bytes of global metadata. Local production Worker measured HTML129476 bytes/gzip21237; RSC51937/gzip11485. Prior live snapshot was HTML802742/RSC664723; different environments mean this is a payload comparison, not a production latency claim.
- Client artifact inventory37 JS files/499651 bytes versus prior134/5593161. Totals cover all emitted chunks, not initial transfer. No Mermaid/ELK/Cytoscape/KaTeX client chunks remain.
- Native prerender succeeded:27 routes including404,0 skipped,26 warmup paths; reader routes force-static/revalidate=false. Local Worker HTML headers HIT; RSC STATIC; resume query HIT. Cold production isolate, cross-region cache and real-network latency not benchmarked. Native Node prerender artifacts do not by themselves prove Worker artifact seeding; default framework cache retained, no auth response cache introduced.
- Gamification: deterministic100XP/chapter,50XP/exercise, levels0/500/1100/1700, maximum2450; four group badges plus voluntary exercise badge. Existing local keys and memory fallback retained. No educational testing, streak penalties, accounts or backend.
- Browser on local production build: search preflight26results; query retained after03→04; route skeleton and pending status observed; chapter mark +100XP, persisted after reload, undo returned0; mobile menu closes on route selection;06 template sheet and term tooltip work with chapter-specific data. Home profile320/360 no document overflow. Browser console errors empty in checked states. Desktop/mobile screenshots saved. Full prior no-JS/print/OSzoom/storage-failure matrix not rerun.
- Typecheck and5 focused content tests passed; production builds/publication exclusion audit passed. Independent review caught and fixed shortcut stale data and diagram failure fallback. Native release receipt follows packaging/deployment.
