# Фактическая проверка — 2026-10-08

## Реализация

Учебная часть оригинального руководства выделена до маркера «Конец учебного руководства». Исходные документы не редактировались. Single source `content/handbook.md` генерирует initial HTML, index и downloadable Markdown. Inventory: orientation 00, 24 главы, 451 определение, 12 тем, 7 Mermaid-схем.

Compiler использует AST, GFM и HTML allowlist. Canonical chapter/term anchors и детерминированные subsection IDs проверяются на уникальность и targets. Longest-match применяется к reader HTML и всем динамическим состояниям. Неоднозначности заданы explicit map. Executable fences сохраняют source; glossary не размечает сам себя. Final rendered audit: 2470 linked occurrences, 0 ambiguous, 0 rendered gaps, **0 unexplained gaps**. Structural exceptions перечислены в `coverage-report.json`.

## Проверки и результаты

- Content tests: 4/4 passed; source/download parity, appendix rejection, inventory, targets, unsafe HTML, exact code source, longest-match.
- TypeScript: `tsc --noEmit`, exit 0.
- ESLint: source, application, scripts and tests, exit 0; derived glossary count avoids redundant effect state, hydration readiness is deferred until handlers attach.
- Browser suite: 9/9 passed, Microsoft Edge / Playwright. Initial HTML, navigation/history/reload, required search queries, hidden prompt results, glossary reveal/focus/repeated 1000 ms highlight, every panel node and lifecycle scenario, exact copy/failure, storage denial, reduced motion, print and no-JS.
- Widths 320, 360, 768, 1024, 1440: no document horizontal overflow. 200% zoom stress tested at 640px (effective 320px). Mobile drawer and search dialog: keyboard/Escape/focus verified.
- axe-core: no WCAG 2 A/AA and 2.1 AA violations in tested reader/dialog states. Measured token contrast: primary text 19.61:1, muted 13.04:1, subtle 6.98:1, primary button 4.70:1, focus/selected 8.19:1. All seven Mermaid diagrams rendered in strict mode without runtime errors.
- Production build verified locally with native Sites helper. Vite emits large-chunk warnings for lazy Mermaid dependencies; Vinext warns about route classification static analysis. Build succeeds. No performance score is claimed.
- Screenshots: desktop, mobile drawer, lifecycle including unavailable-evidence scenario and separate post-merge sync.

## Review fixes

Controls remain disabled until event handlers hydrate, preventing lost pre-hydration actions. Term scrolling is immediate so highlight lasts after arrival. Print explicitly exposes closed Chromium details content. Glossary filter heading does not break heading order. Mobile icon-only search has an accessible name. Ambiguous `tokens` in credential context resolves to credential-token; Done requires confirmed merge and shows post-merge sync separately.

## Границы проверки

Ручной прогон NVDA/VoiceOver и Lighthouse не выполнялся. Автоматический accessibility scan и keyboard checks не являются полной сертификацией доступности. Browser regression выполнялся на локальном dev server; production bundle проверен сборкой. Исторический PR #12 → refresh #13 показан как план, без утверждения о merge. Control Center — будущая архитектура. Демонстрации не запускают агентов и не меняют Git/Linear.

Private publication выполняется отдельно через native Sites workflow. Итоговый deployment status и URL сообщаются после подтверждения хостинга; локальные проверки сами по себе не подтверждают публикацию.
