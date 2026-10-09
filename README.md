# ULTIMATE Vibe-coder guidebook [BETA]

Русскоязычный учебный портал для брата: 22 учебные главы, orientation 00 и единый глоссарий (394 определения / 11 тем), 6 Mermaid-схем. React, TypeScript, Vinext и npm lockfile; native Sites starter. Учебные данные компилируются при сборке, текст текущей страницы входит в первоначальный HTML. Backend, аккаунты, аналитика и агентный runtime не добавлены.

## Запуск и проверка

Node.js >=22.13 и npm: `npm ci`, затем `npm run dev`. Адрес выводится в терминале. Production: `npm run build`, затем `npm start`.

- `npm run content` — AST/GFM, allowlist HTML, glossary/search/anchors, independent coverage audit.
- `npm test` — content/download parity, оригинальные SHA256, inventory, targets, sanitization, appendix rejection, longest-match и preview threshold.
- `npm run typecheck` и `npm run lint`.
- `npm run test:e2e` — Playwright / установленный Microsoft Edge. Нужен запущенный сервер; `HANDBOOK_URL` задаёт другой адрес (по умолчанию localhost:3000).
- `npm run build` — production Worker build и автоматический `postbuild` audit public/dist на приватный provenance и implementation appendix.

PowerShell для текущего dev-порта: `$env:HANDBOOK_URL='http://127.0.0.1:5173'`, затем `npm run test:e2e`.

## Контент

Редактируйте `content/handbook.md`: это источник учебного текста, определений и скачиваемого Markdown. Родительские исходники сохранены без изменений; их SHA256 находятся в `docs/original-source-hashes.json`. После согласованной редакторской очистки учебный source намеренно отличается от исходного документа.

Результаты компиляции: `src/content/generated.json`, `public/handbook.md`, `docs/coverage-report.json`. Скачиваемый Markdown точно совпадает с учебным source. Главная `/`, главы `/chapters/01`–`/chapters/22`, глоссарий `/glossary`, весь раскрытый материал `/print`.

Дополнительный материал помечайте парными HTML-комментариями `<!-- details: Название -->` и `<!-- /details -->`. Compiler сначала размечает и индексирует отдельные блоки, затем оборачивает их в `<details>`: поиск и canonical anchors продолжают работать внутри закрытых блоков. Обязательные шаги и предупреждения оставляйте снаружи.

Glossary registry извлекается из главы 23. Определения до 160 видимых символов, состоящие из одного обычного абзаца, получают tooltip; длинные/структурированные — panel. Название и aliases не входят в подсчёт. Все нынешние определения короткие; длинная ветка проверяется отдельной браузерной fixture без изменения production текста.

Автоссылки сохраняются для всех подходящих вхождений. Словоформы и неоднозначности: `src/content/term-overrides.mjs`. Compatibility registry `block-identities.json` сохраняет IDs неизменённых блоков, `practice-identities.json` — прежние ключи чеклистов. Новые блоки получают отдельный namespace. После редактирования проверьте overrides, targets и **0 unexplained gaps**. Coverage включает динамические evidence/owner panels и definitions previews с явным исключением рекурсивной разметки. Raw executable source защищён; Copy возвращает исходник из registry.

## Чтение и обучение

При JavaScript термины открывают пояснение рядом; без JavaScript это canonical glossary links. Tooltip не меняет scroll, URL или history. Длинные определения и два шаблона (глава 06 / глава 14) используют немодальный desktop drawer / модальный mobile sheet. Явный переход в глоссарий сохраняет точный origin для возврата.

Прогресс локален: `handbook-learning-v2` — главы/упражнения; `handbook-reading-v2` — последняя страница/scroll; `practice:*` — чеклисты. Старые операционные отметки сохранены. Старый longread progress переносится на соответствующую главу, начиная с её начала: прежняя абсолютная координата не применима к новой странице. Есть явное продолжение, отмена completion, четыре достижения и сброс. При отказе localStorage отметки сохраняются в памяти между страницами до перезагрузки вкладки; интерфейс сообщает об этом. При отказе clipboard исходник можно скопировать вручную.

## Дизайн и публикация

Linear: #010102, графитовые поверхности, #5e6ad2. Manrope и JetBrains Mono self-hosted с кириллицей; лицензии в `public/fonts/`. Tabler Outline: единый размер **20px / stroke 1.75 / currentColor**, registry `src/design/icons.mjs`; декоративные SVG не заменяют accessible labels. Rail 264px закреплён слева от 1024px; мобильная навигация — drawer.

Sites project ID хранится в `.openai/hosting.json`. Используйте native Sites workflow для source push, build/archive и save/deploy. **Текущий public-доступ сохраняется по явному разрешению владельца.** Не создавайте новый Site и не меняйте хостинг.

Фактические проверки: `docs/implementation-notes.md`, raw results `docs/browser-results.json`. Контекст продолжения: `docs/implementation-state.md`. Screenshots в `docs/screenshots/`: desktop, mobile-navigation, lifecycle, system-map-desktop/mobile, term-tooltip-desktop и template-mobile.


## Брендинг

FLOW — основной символ (`public/brand/flow.svg`) и favicon. Подпись **by Makkov** использует предоставленный автором `public/brand/makkov.svg` без изменения исходных байтов. Отдельная плашка **Open Source** размещена на главной и в footer. Название учебного source задаётся первой строкой `content/handbook.md`; UI/metadata brand title — `src/design/brand.ts`. Screenshots: `docs/screenshots/brand-desktop.png`, `brand-mobile.png`. Проверка адаптации/доступности — `docs/brand-qa-results.json`.

## Полезные материалы

`/resources` — отдельная ненумерованная страница в группе «Справочник», перед глоссарием. Подборка содержит 29 внешних материалов в шести категориях; язык, уровень и соответствующие главы указаны в описаниях. Редактировать раздел `## Полезные материалы` в `content/handbook.md`: те же изменения попадут в SSR, поиск, печать и скачиваемый Markdown. Каждая запись имеет собственный anchor по названию; поиск переводит на конкретную карточку. Страница не входит в прогресс 22 глав. Новые ссылки добавляйте обычными пунктами списка с названием-ссылкой и отдельным абзацем описания; после изменения запускайте content/test и coverage audit.

## Скорость и учебный профиль

Общий интерфейс находится в `app/(reader)/layout.tsx` и сохраняется при переходах через Link. Страница передаёт только собственные определения, outline и исходники примеров через ReaderPageData. Поиск и совместимость старых anchors — отдельные файлы `public/data/` с hash в имени: поиск загружается при открытии, registry — только для старой неразрешённой ссылки. Pending-переход показывает индикатор, route loading — скелетон; reduced motion отключает декоративное движение.

`npm run content` также генерирует static SVG Mermaid и ленивые assets. SVG переиспользуется при совпадении source/config hash. Для новой или изменённой схемы нужен Chrome: Windows использует установленный Google Chrome, другую среду настройте через `MERMAID_CHROME_PATH`. Browser renderer не включается в client bundle. Ошибка отдельной схемы раскрывает текст и показывает диагностику. Учебный Markdown остаётся единственным источником схем.

Сборка включает native Vinext prerender; HTML/RSC artifacts находятся в `dist/server/prerendered-routes/`. Reader routes используют штатный static cache. Не добавлен ручной response cache поверх Sites access control. Prerender Node seeding не следует считать доказательством cache hit на холодном production Worker: фактические локальные headers и ограничения записаны в implementation notes.

Профиль вычисляет XP из существующих отметок: глава +100, упражнение +50, максимум 2450. Четыре уровня, четыре знака за группы глав и добровольный знак за упражнения. Повторная отметка не приносит дополнительные очки, отмена уменьшает XP. Новых аккаунтов, quizzes, штрафов за пропущенные дни и обязательных заданий нет. Screenshots: `learning-profile-desktop.jpg`, `learning-profile-mobile.jpg`.
