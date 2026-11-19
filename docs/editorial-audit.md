# Editorial audit: proposals, no changes made

All the learning Markdown and the site's additional presentation blocks were checked. The learning content, navigation, search index and the published site were not changed. Below are separate decisions for approval.

Link source: `content/handbook.md`. 19 external links found: 4 to private PRs, 1 to a personal ChatGPT conversation, 14 to public technical documentation (7 distinct pages, each duplicated in chapter 24). The Markdown has 33 occurrences of AI Artefacts / ai-artefacts, including URLs. Names and internal numbers are not needed to understand the transferable lessons.

## 1. Remove chapter 24 entirely

Lines 1684–1704. "The basis of AI Artefacts" describes the user's request, personal correspondence, local context files, the provided Claude guide and past reviews. This is the history of how the document was prepared. The private conversation link is on line 1689. The seven public technical sources repeat inline links that already exist in chapters 04/11.

Recommendation: remove the chapter, its navigation item and previous/next references. Keep the useful public links in the matching learning explanations. Do not replace the chapter with a large block of service caveats.

## 2. Remove all private PR links

- Line 937: chapter 18.2, PR #3, TICKET-19.
- Line 945: chapter 18.3, PR #12 and PR #13, TICKET-25 and TICKET-23.
- Line 969: chapter 18.4, PR #8, TICKET-21; a temporary PR #9 is mentioned nearby.

Recommendation: remove the URLs, the numbers of real PRs/tickets and the provenance. Keep the technical problems themselves as anonymised learning examples. This does not mean removing the lessons about ignored files, restricted refspec, fail closed and hosted CI wiring.

## 3. Anonymise all of chapter 18

Lines 923–973. Remove the description of the product "Your Personal AI Source of Truth" (925), the internal TICKET-37/22/24/26 and PR #10/11 (929–931), PR #12/13 and ADR 0005/0006 (943–965), TICKET-21/37 and the temporary PR #9 (969–971).

New direction for the heading: "Four typical mistakes and how to prevent them". Keep the four cases: a forgotten issue transition; green CI without safety coverage; dependent PRs and an incomplete diff; unit tests without a check of CI event wiring. Replace the real numbers with tasks/branches A and B.

The additional UI timeline also needs this decision: `src/content/compiler.mjs:190`, rendered in `app/page.tsx:18`. It separately repeats PR #12 → refresh #13 and ADR 0005/0006. Removing only the Markdown links is not enough. Recommendation: replace with the transferable sequence review A → integrate A → refresh B → revalidate B → review/integrate B.

## 4. Shorten the service introduction and orientation

Line 3: remove "Case study — AI Artefacts". Lines 23–33: remove the origin from the correspondence/Claude guide, the dates of additions, the results of a live audit that was not performed, three provenance labels and the status of the internal TICKET-24/26/23/25.

Keep the audience, the reading outcomes, the three routes and a short useful rule: learning examples must be adapted to your own repository's current rules. Do not show the reader the history of preparation and implementation.

## 5. Remove project ties in the other learning chapters

Specific places:

| Lines | What it is now | Recommendation |
| --- | --- | --- |
| 105 | "AI Artefacts practice" and its set of services | "Example of distributing sources of truth", with no obligation to copy the stack |
| 158, 170 | "AI Artefacts example", scripts "from history" | "Implementation example"; script names as learning examples |
| 194, 219, 259 | History of a specific Windows/WSL/Docker machine, the Claude guide of October 6, the project's pnpm, a future PR | Keep the transferable environment rules and lifecycle hooks; remove the machine's history |
| 294 | "not the exact Linear schema of AI Artefacts" in the template | Just "Learning task template" |
| 340 | "The canonical AI Artefacts lifecycle" | "Example task lifecycle" |
| 438 | The project's set of context docs and a historical snapshot | A universal example of distributing context; keep the freshness principle |
| 506 | ADR "not existing ... in AI Artefacts" | "Learning ADR example"; keep the rule of preserving decisions |
| 518 | The history of its PR header/parser | A general rule for machine-readable PR declarations |
| 545, 552 | Comments "not the AI Artefacts bootstrap", the branch workflow of a specific repo | A universal worktree example; keep the ownership protections |
| 599 | Advisory checks and the limits of its private repo | A general explanation of required checks/branch rules, without the project's historical subscription |
| 608 | Risk matrix "agreed with ... AI Artefacts" | Label it a learning matrix and adapt it to the risk policy |
| 1066, 1077, 1097 | Maturity assessment and implementation status of AI Artefacts | Remove the project assessment; keep the maturity model and the conceptual status of the architecture |
| 1210 | Linear "where in AI Artefacts..." | A neutral definition of the service |
| 1586–1587 | AI Artefacts as a glossary term, Standalone as "not a feature" of this project | Remove AI Artefacts; rewrite Standalone neutrally if the term is needed |

## 6. Remove the personal address

Line 1051: "20.2. Exercises for my brother". Recommendation: "Practical exercises". The five exercises themselves are useful and stay.

## 7. Remove or substantially shorten glossary 23.12

Lines 1622–1682, 55 definitions. A large share describes the implementation of this particular site: reading progress, term highlight, dotted underline, Manrope/JetBrains Mono, localStorage, Clipboard API, longest-match, favicon, glow/glassmorphism, Lighthouse.

48 of the 55 terms have no links from the intro and chapters 01–22 (a check of the generated reader HTML; this does not prove that each technical concept is unnecessary). Recommendation: remove the topic "Interface, reading and site accessibility" from the learning glossary; keep the truly needed UI/UX, responsive and similar terms, if necessary, with neutral definitions in a suitable topic. Line 1682 "Coverage when updating..." is an instruction to the site's author; remove it from the reader-facing text regardless of what happens to the topic.

## 8. Selectively clean up glossary 23.11

Lines 1582–1620, 35 definitions. Remove AI Artefacts, Sites, Manifest with the aliases hosting.json/project_id, and the explanations of how this handbook is built/hosted. Rewrite Backend, Markdown, Build-time, CMS and Hosting, if they stay, without ties to the current site and its handover procedure.

I do not recommend removing the whole topic: API, MCP, JSON, YAML, README and other concepts can be useful for development with agents. The absence of a term link is not by itself a reason to remove a term. 21 of 35 have no links from the intro/chapters 01–22 — this is a signal for selection, not an automatic delete list.

## 9. A separate decision: the future Control Center

Chapter 21.1–21.3, lines 1079–1127; glossary 23.10, lines 1553–1581 (24 terms). This belongs to agentic engineering, but it leads the basic handbook into designing a future runtime: adapters, normalized events, ownership leases, durable workflows and the control plane.

Recommendation: keep maturity M0–M5; shorten the Control Center architecture to a short optional advanced block. The alternative is to keep it whole, if the guide should teach the design of orchestration platforms. This is not obvious junk and is not proposed for unconditional removal.

## 10. Reduce the density of glossary links

The current content audit counts 2470 marked-up occurrences. These are internal links, not private URLs, but repeated links on common words create visual noise.

Recommendation: a link on the first mention of a term in a chapter, plus a repeat for a complex concept when it helps the reader. Later ordinary occurrences are plain text. Keep search, the glossary and the exact definition targets. This is a separate change to the previously agreed all-occurrences rule and needs the user's decision.

## What I recommend keeping

The public inline links to Git worktree, VS Code WSL, Docker persistence/WSL backend, the Dev Container specification and GitHub checks/branch rules (221, 245, 251, 259, 540, 597, 599) directly support the technical explanations. The lessons about safety, authority, the current HEAD and preserving data remain after anonymisation. DEMO-42 is a self-contained learning simulation, not a link to a private repo; we keep it. Generic TICKET-XX and placeholders in templates stay if they are needed for the example format.

To apply, decisions 1–10 can be approved by number. No removals or publications were made within this audit.
