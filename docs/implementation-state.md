# Learning portal implementation checkpoint

Current 2026-10-11: tool reviews `/tools`, `/tools/codex`, `/tools/claude-code` added from canonical handbook.md. Official docs/releases/pricing research plus independent Claude factual review recorded in codex-research.md and claude-code-research.md. Auxiliary routes excluded from learning completion and resume; 22 chapter count retained. Global search, exact targets, glossary previews, raw-copy, download and print share source. Compiler now preserves only authored details markers through sanitation and drops other comments; formerly ignored manual disclosures now work. 27 content sections, 394 terms, 2706 links, 0 ambiguities/unexplained gaps. Typecheck,5 focused tests and native build30 prerendered routes/audit159 passed. Browser SPA/reload/history/hidden search/copy/mobile menu/term preview/320–1440 reviewed; final table-wrap fix rebuilt and spot checked (110px first cells). Native PUBLIC publication follows receipt; current local changes not yet claimed live.

Approved: editorial audit 1–5, 7–9; retain brother exercises and every appropriate term occurrence. Routes /, /chapters/01–22, /glossary, /print. Linear, self-hosted Cyrillic fonts, Tabler 20/1.75. No added backend/runtime/integrations. Latest user explicitly authorized parallel agents; two agents performed independent review/production QA and scoped fixes.

Content: single teaching source content/handbook.md; original parent documents unchanged and hash-checked. 22 teaching chapters + glossary, orientation 00, 394 definitions, 11 topics, 6 Mermaid. 2344 annotated occurrences; 0 ambiguities and 0 unexplained gaps. Private provenance, chapter24 and implementation appendix excluded; source/download identical.

UI: paged reader, fixed 264px left rail, mobile navigation; authored details; contextual tooltip <=160 visible characters/plain paragraph, otherwise nonmodal desktop drawer/modal mobile sheet. Two exact-source template panels 06/14. All current definitions are short; real overlay long branch verified with isolated hydration fixtures. Manual 22 chapter completions, five exercises, four badges; shared memory fallback until tab reload; explicit resume/reset. Overview/ten-stage system map; mobile sequence.

## Verified
- [x] Editorial source, stable IDs, route registry, source/download/publication audits.
- [x] Reader/overlays/templates/progress/map and all controls.
- [x] 5 content tests; typecheck and lint.
- [x] 16 browser scenarios on production Worker, including widths320/360/768/1024/1440, 200% CSS zoom stress, keyboard, storage/clipboard refusal, no-JS, print, reduced motion, all Mermaid.
- [x] Automated accessibility: no violations in audited states; no production console/page errors.
- [x] Screenshots and README/implementation notes.
- [x] Production build and 298-asset postbuild exclusion scan.

Release uses existing Site appgprj_6ac7663d93808191be53ad452b2eb4d7 and PUBLIC access explicitly approved by user. Opened source d76e9a62d08c39e94aa0725d0e769e5eb7e4b9bd. Native source push/build/archive/save/deploy follows validated state. Final native deployment status, commit and URL are recorded after success in local .sites-runtime/release-receipt.json and the task handoff; credentials are never saved there.

Production compatibility fix: client Rolldown preserveEntrySignatures=strict retains dynamically consumed Vinext router exports. Confirmed SPA/history/search operation without dependency updates. Independent review also fixed mobile tooltip top-layer rendering, exact reading return, storage fallback and sidebar scrolling.


Branding approved 2026-10-09: FLOW symbol, ULTIMATE Vibe-coder guidebook [BETA], exact byMakkov SVG and standalone Open Source badge. Ten fresh responsive/asset/metadata/control checks and axe/console pass;5content tests/typecheck/lint pass. New screenshots and brand-qa-results.json record this update. Original user asset byte parity verified; final deployment receipt follows native publication.

Resources and UX audit update 2026-10-09 (verified local/build): added /resources from canonical handbook.md,29 links6categories, exact item search targets, no iframe/runtime/dependencies, excluded from completion22. New independent agent ux_ui_audit_new audits local UI. Fixes: keyboard search scroll+combobox semantics, full checklist text activation excluding links/controls, conditional checklist reset (server bool), route titles, preview copy-status cleanup, preview term accessibility roles, consecutive reader/panel headings, modal navigation/search backdrop dismissal. Verification results follow in implementation-notes.

Performance/profile implementation2026-10-09: shared app/(reader)/layout; ReaderPageData perpage53definitions/27KB for03; lazyglobal search/legacyanchor hashedassets; buildtime strict MermaidSVG6/6 no browserrenderer; nativeprerender27 incl404 andframeworkstaticcache. LocalWorker03HTML129KB/RSC52KB; totalclientJS500KB37chunks. ProfileXP100chapter/50exercise,4levels,4groupbadges+optionalexercisebadge,existingkeys. Browserverifiedpersistedsearch/XPundo/reload,loadingskeleton/mobilemenu/06sheet/tooltips,320/360overflow. Typecheck5testsbuild passed. Coldproduction latency/cache notbenchmark; completehistoricalmatrixnotrerun. NativeSites PUBLICupdate packaging/deploy next;receipt .sites-runtime/release-receipt.json. Screenshotslearning-profile-desktop/mobile.jpg. Exactnotes docs/implementation-notes.md.

Home navigation2026-10-09:5nestedMarkdown groups compiledinto semanticcards,24whole-row links (22chapters+resources+glossary),old ch-00-b1006 preserved. src/design/home-route.css/rootlayout +ASTcompiler/identityregistry; Reader captures route-chapter crosspage links forSPA. No addedclientcomponent/dependency. 320/360/768/1024/1440 nooverflow,56pxtargets; prodkeyboard/querypersist/Back/console checked, sourceparity/0gaps/typecheck/5tests/nativebuild27routes passed. Desktop/mobilehome-navigation screenshots. PUBLICSiteupdatepackagesverifieddist withoutrepeatbuild; finalreceipt .sites-runtime/release-receipt.json.


Current2026-10-09: unified architecture map (no modes/stepper),23 official product links in canonical glossary; short linked definitions=popover, short plain=tooltip, long/structured=panel. 394definitions/2382links/0gaps,5contenttests/typecheck/nativebuild27routes passed. Browser1440/320/360, dynamicpanels/SPA/keyboard/mobileexample verified; no consoleerrors. Screenshots service-popover-desktop/mobile.jpg; exact notes implementation-notes.md. Public native release pending; receipt stores final IDs.

Compact service preview update2026-10-09: no close button; plain official-site text link + sharedTabler arrowUpRight20/1.75, no fill/border. Interaction preserved; keyboard/repeat/outside/mobile320/360 verified.5tests/typecheck/build27/audit149 passed,0gaps. Screenshots service-tooltip-compact-desktop/mobile.jpg; native PUBLIC release receipt follows.

Homepage polish2026-10-11: left Map icon/filled secondary action; one four-stage weighted XP track; existing awards and XP rules preserved. Download/print only in desktop/mobile navigation. No empty outline or duplicate glossary shortcut; one footer separator, canonical source anchors retained. Browser320/360/768/1024/1440 no overflow, keyboard map/mobile print/500→600XP/real chapter outline/footer verified; application console clean. Screenshots home-polish-desktop/mobile.png. Typecheck5tests/nativebuild27/audit149/diffcheck passed; source unchanged. Existing public release17 opened from24e181737b30b7b0aa026b01c65babac06b73a85; native update receipt follows.
