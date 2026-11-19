# Interactive components audit — 2026-10-08

## Scope

The interface buttons and links actually in use; the checklists of chapter 22 and other reader contexts; the DEMO-42 radio scenarios; the search fields and glossary filter; the native theme dropdown; drawer/dialog; code/diagram/static panel disclosures. Desktop and widths 320, 360, 768, 1024, 1440. Inline glossary links keep the text size and were checked separately as navigation.

## Found and fixed

| Problem | Cause | Fix |
| --- | --- | --- |
| Checklist sprawls | A universal input rule: the checkbox was actually 774 × 44 px on desktop | Text input rules separated from checkbox/radio; checkbox 20 × 20 px, label hit area 44 × 44 px |
| Unclear checkbox labels | Each input was given the text of the whole list | The accessible name holds only its own item; storage keys kept |
| Alignment and mobile wrapping | Checkbox and text were one ordinary inline flow | Grid with a fixed control column and wrapping text; graphite groups, dividers, hover/checked/focus states |
| Radio controls inherit text field styles | Partial width/min-height overrides | Separate dimensions/padding; the selected scenario has a visible background/border and focus state |
| Dropdown and filter fields | Browser arrow and free width of the flex label | Native select kept; Tabler ChevronDown, enough right padding, mobile stack, long values do not widen the page |
| Inconsistent control states | Implicit placeholders and disabled appearance | Explicit muted placeholder, hover borders, disabled appearance; reset is not active until hydration |
| Jumping to a chapter leaves the wrong active chapter on mobile | scroll-padding 120px and scroll-margin 128px at the same time: heading top 247.6px | A single offset on html; the target is visible under the sticky chrome, the active chapter matches the jump |

## Verification

The regression first reproduced the bug: expected checkbox width 20, received 774. After the fix, keyboard Space, persistence/reload/reset and the individual names of all items passed. Label clickable area measured: 44px, focus outline 2px, checked state works. Text input/select in the mobile filter is 48px high, the reset button is 44px; the fields stay inside the container.

A separate regression reproduced the double navigation offset: expected heading top <=160px, received 247.6px. After the margin duplication was removed, the heading position and active chapter are checked at all five widths.

11 browser tests passed: in addition, narrow-width form geometry, dropdown keyboard selection/reset, radio dimensions and the Enter disclosure toggle. The other tests cover search/clear/close, drawer, glossary navigation, panel selection, copy success/failure, storage denial, print/no-JS, axe and Mermaid. Typecheck, ESLint and 4 content tests passed. The learning source/download was not changed; 0 unexplained glossary gaps.

Visually reviewed: desktop/mobile checklist, checked/focused state, mobile filter/dropdown and lifecycle. Captures: `screenshots/checklist-desktop.png`, `checklist-mobile.png`, `checklist-focused.png`, `controls-mobile.png`. The native select popup is controlled by the browser; no custom dropdown runtime was added. A manual screen-reader run was not performed.
