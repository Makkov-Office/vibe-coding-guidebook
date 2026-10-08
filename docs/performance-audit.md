# Performance audit — 2026-10-09

Independent read-only review by a separate agent, cross-checked against source and live HTTP samples. No runtime changes or deployment were made during this audit.

## Confirmed measurements

Chapter 03 client metadata: 645,157 UTF-8 JSON bytes (111,639 gzip in a local estimate). Search: 244,758 bytes / 687 entries; glossary: 197,943 bytes / 394 terms; anchor registry: 190,098 bytes / 2,779 entries. The initial chapter HTML is additional.

Live `/chapters/03`: decoded HTML 802,742 bytes. First HTTP fetch took 2,164 ms including connection setup; second took 267 ms. These are small network samples, not cold-start or browser-interaction measurements.

Live `/chapters/03?_rsc` with `RSC: 1` and `Accept: text/x-component`: 664,723 decoded bytes. Main-agent samples: 621/479/423 ms total, 566/428/369 ms to headers. Independent-agent samples: 552/454 ms total, 497/402 ms to headers. No Cache-Control, X-Vinext-Cache or CF-Cache-Status response headers observed. This does not prove that all platform caching is absent.

Chapter 03 HTML references 53 unique terms. Their complete registry definitions total 26,870 bytes, compared with 197,943 bytes for all definitions. Any subset must additionally cover interactive panels and code-example terms.

## Findings and implementation order

1. **High impact: reduce repeated route data.** `src/components/HandbookPage.tsx:14` sends global search, terms and anchors into every Reader. Generate a versioned static search asset, load on search activation and cache it across routes. Supply only chapter-relevant terms or a shared cached registry. Reduce/lazily load legacy anchor mapping while preserving old links. Preserve server-rendered teaching HTML and no-JS links.
2. **High impact: persistent reader shell.** `HandbookPage.tsx:15` forces Reader remount with `key={id}`. Use shared layout/stable shell and reset only chapter-specific state. Verify preview closure, selected search results, glossary return, storage restoration, observers and listeners across navigation.
3. **Secondary: verify prerender/cache support.** `app/chapters/[number]/page.tsx:3` has generateStaticParams, but the current artifact contains no prerendered HTML/RSC pages. Investigate the supported Sites/Vinext build path rather than assuming one route export will work. Distinguish HTML/RSC cache variants and preserve hosting access semantics.
4. **Secondary: generate static diagram SVG during build.** Reader already lazy-loads Mermaid when diagrams enter the viewport. Production JS files total 5,593,161 bytes across 134 chunks, including ELK 1,465,401 / Cytoscape 435,480 / KaTeX 258,882 bytes. These are artifact sizes, not proof they are loaded on every page. Build-render the six static diagrams with strict mode and textual fallback, or use a supported limited renderer.
5. **Small improvement: search computation.** Reader normalizes all entry texts on each keystroke and filters the full corpus before slicing 40 results. Precompute normalized search text, normalize query once and stop when the limit is reached.

## Existing optimizations and verification limits

Vinext Link already implements viewport/intent prefetch, a queue and shared RSC cache. Do not enable full prefetch for every sidebar link blindly; current repeated metadata would magnify bandwidth use. Mermaid is already viewport-lazy. Icon and diagram file sizes alone do not establish initial bundle cost.

The user's open browser tab held an earlier UI version. It was inspected without reloading or disturbing reading. The browser inspection interface did not expose Performance entries, so no click-to-render, LCP, INP or Lighthouse numbers are claimed.

## Acceptance checks for optimization

- Record HTML/RSC decoded and compressed sizes before and after on chapters 01/03/07/22 and glossary.
- Measure cold and warm browser navigation separately, cache/prefetch reuse and throttled mobile behavior.
- Target a substantial route-payload reduction; do not promise a specific latency improvement without measurements.
- Verify search hidden results, term coverage, legacy hashes, no-JS, restored reading, preview closure and checklist persistence.
- Run typecheck, focused tests, publication audit and production build; publish through existing native Sites workflow.
