# Independent UX/UI audit — October 9, 2026

The audit was performed by a separate agent. The sources and the local site `http://127.0.0.1:5173` were checked through a temporary browser tab. The user's tab and production were not changed. Fixes were made by the main agent; this agent did not change interface code.

## Findings

| Priority | Location | Problem and evidence | Fix / recheck |
| --- | --- | --- | --- |
| P2 | `src/components/Reader.tsx`, search | Query "agent", 8 ArrowDown presses: the selected entry had top 1479 px while the visible results area was 281–655 px. The input had no `aria-activedescendant`. The selection was invisible and not announced to assistive technology. | Fixed by the main agent. Repeat browser check: the selected result is visible, input `role=combobox`, `aria-activedescendant=search-result-8`, entry `role=option`. Escape returns focus to the search button. |
| P2 | `src/content/compiler.mjs`, `Reader.tsx`, checklists | The full item text was in the neighbouring `div.practice-text`, and the label held only the checkbox. The text did not activate the checkbox. | The main agent added activation of the text area, excluding links/controls. Browser: clicking the text changes false→true; our own test mark was set back to false. |
| P2 | `app/chapters/[number]/page.tsx`, `/glossary`, `/print` | All pages inherited the same brand title: tabs and history did not distinguish sections. | Separate metadata added. Browser: glossary title "Glossary · ULTIMATE Vibe-coder guidebook [BETA]". |
| P2 | `Reader.tsx`, footer | Checklist reset was shown even on pages without checklists. With the first fix it was also hidden in chapter 06: chapter.html in the client metadata is intentionally empty. | The main agent passed a server-side flag for whether checklists exist. Browser: chapter06 and chapter22 show reset; chapter03 does not. |
| P2 | `ContextPreview.tsx` | Terms in the example panel did not get role/button and "Explain term", because the MutationObserver watched only the reader. The reader and the contextual panel had different semantics for the same feature. | Observation extended to the panel. Browser: term links in the example panel get `role=button`, the tooltip is inside the dialog. |
| P2 | `ContextPreview.tsx`, copy status | The copy message was not cleared when other panel content opened and could refer to the previous example. Confirmed by reading the state/update code. | The main agent added clearing of the status on content change. A real clipboard failure or repeated copying was not checked in the browser. |
| P2 | `Reader.tsx`, mobile drawer | Tapping the backdrop did not close the menu. Browser320: drawer rect left38/right320; click x8/y400 left `open=true`. | Handed to the main agent for closing on backdrop with a bounds check. The fix state must be rechecked after the final changes. |
| P2 | `Reader.tsx`, Enter in search | The main agent, during its own browser QA, reproduced search reopening: Enter closed the dialog, onClose returned focus to the trigger, the default Enter activated the trigger. | The main agent added preventDefault and suppressed the focus return when jumping to a result. The independent agent did not recheck this finding. |

## Actual verification

- Chapter 02 map at 320, 360, 768, 1024 and 1440 px: no horizontal document overflow; the sidebar is hidden below 1024 and visible from 1024; the outline appears at 1440. Reading column: 288/328/688/680/800 px respectively.
- Mobile menu: jumping to chapter02 ends in actual navigation and a closed drawer. The earlier hypothesis that the menu does not close was rejected: the Reader remount closes the dialog.
- Guided map 320: one visible node; the "Next" transition changes step 1→2 and the detail to Repository knowledge.
- DEMO-42: Happy path, Review findings and Unavailable evidence checked. The result text matches the selected scenario. A separate Post-merge sync node changes the detail.
- The Entrypoint tooltip in chapter03 opens above the term, gets `aria-describedby=term-tooltip`, closes with Escape.
- Example drawer on desktop: non-modal `dialog.show()`. Mobile360: `:modal=true`, body scroll locked, height 680px at viewport 800px (85dvh), no horizontal overflow; the tooltip fits within the horizontal bounds; closing removes the lock and returns focus to "Open alongside".
- Chapter06 after the fix: outline headings H1→H2→H2. Chapter22@320: 20 checkboxes, each 20px; no horizontal overflow.
- Glossary: 394 definitions; an impossible query hides all, reset returns 394 and an empty query.
- The checked tab had no captured console errors during the checkbox check stage.
- Desktop screenshot of lifecycle visually checked: pagination cards aligned, radio labels do not overlap, detail and nodes are readable.
- Collision panel13: all 4 buttons change the detail title and the matching SVG aria-label. The contract disclosure opens, the copy control is enabled.
- Maturity21: M0–M5 checked; the detail changes and contains capabilities / exit criteria.
- Progress21: the first mark changes 1→2, undoing returns 1. The Reset click led to a CDP timeout; getJsDialog returned undefined, the following DOM/close calls also timed out. Test tab 2 may have been left with a native confirm. Reset was not accepted; a successful cancel is not claimed. Reported to the main agent to restore the browser.

## Verification limits

Not performed: a full screen-reader pass, measurement of all rendered contrast pairs, real 200% browser zoom, browser no-JS/print, artificial storage/clipboard failures and a full sweep of all glossary definitions/anchors. The native mobile focus trap relies on showModal; a full cyclic keyboard traversal needs separate confirmation (Tab from the last element may move focus into the browser chrome). During the local audit the main agent was editing code, so some observations were made before/after HMR; this is stated explicitly in the table.

The check is an audit of the main interactions and responsive states, not proof of the absence of all possible bugs.

## Recheck by the main agent

After the final edits: mobile320 click on backdrop x8/y400 closes the drawer, focus returns to "Open chapter menu". Search for the How I use LLMs resource + Enter: 0 open dialogs, hash and focus on ch-resources-item-how-i-use-llms-andrej-karpathy. The backdrop and Enter fixes were confirmed by root browser QA. Heading levels normalised: reader H1/H2/H3 and interactive panels H2/H3, typography kept. Copy status clearing confirmed by code; a repeated browser failure-injection was not performed. All 8 accepted findings fixed; the listed verification limits remain.
