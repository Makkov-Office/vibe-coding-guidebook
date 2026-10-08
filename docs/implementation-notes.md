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
