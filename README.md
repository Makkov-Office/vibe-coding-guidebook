# Agentic Engineering Handbook

Русскоязычное учебное руководство: 24 главы, orientation 00, 451 определение, 12 тем и 7 Mermaid-схем. React + TypeScript + Vinext, native Sites starter. Данные готовятся при сборке; полный учебный текст входит в первоначальный HTML. Backend и агентный runtime не добавлены.

## Запуск

Node.js >=22.13, npm. Установка: `npm ci`. Затем `npm run dev`; адрес выводится в терминале. Production: `npm run build`, затем `npm start`. В Windows при проблемах npm shim можно запускать npm CLI непосредственно установленным Node.

## Контент

Редактируйте только `content/handbook.md`: это источник учебного текста, навигации, поиска, определений и скачиваемого Markdown. Исходные документы родительской папки сохранены. Implementation appendix не входит в учебный source.

`npm run content` компилирует Markdown AST с GFM, sanitization allowlist и canonical anchors. Результаты: `src/content/generated.json`, `public/handbook.md`, `docs/coverage-report.json`. Скачать Markdown означает получить точную копию учебного source.

Glоssary registry извлекается из главы 23. Explicit disambiguation/словоформы находятся в `src/content/term-overrides.mjs`, интерактивные представления — в `src/interactive/registry.mjs`. При структурном изменении Markdown проверьте стабильные ID блоков и occurrence в overrides. Build отклоняет неоднозначные aliases и необъяснённые пропуски. Аудит проверяет конечную разметку, включая все состояния динамических панелей; raw executable fences снабжены отдельными ссылками на термины, Copy сохраняет исходник.

## Проверки

- `npm run typecheck`
- `npm test` — inventory, content parity, anchors, sanitization, appendix exclusion, longest-match.
- `npm run test:e2e` — установленный Microsoft Edge, Playwright; сервер должен быть запущен. Другой адрес: переменная `HANDBOOK_URL`.
- `npm run build` — повторяет content audit перед production build.

Фактические результаты и ограничения: `docs/implementation-notes.md`. Holistic UI review: `docs/interface-review.md`. Скриншоты: `docs/screenshots/`.

## Дизайн и хранение

[Linear design reference](https://getdesign.md/linear.app/design-md), фон #010102, графитовые поверхности, акцент #5e6ad2. Manrope и JetBrains Mono self-hosted, Latin/Cyrillic; лицензии в `public/fonts/`. Прогресс и чеклисты хранятся локально в браузере. Нет внешнего поиска, аналитики, интеграций или настоящего исполнения демонстрационных сценариев.

Sites ID хранится в `.openai/hosting.json`; публикация выполняется native Sites workflow, owner-private. Build не требует доступов к исходным историческим ссылкам. Эти ссылки сохранены с оговоркой о доступности.
