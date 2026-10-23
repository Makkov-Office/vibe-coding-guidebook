# ADR 0002: Деплой на Vercel — статический экспорт через Build Output API

Status: Proposed — 22.10.2026, spike P1-06 (https://github.com/Makkov-Office/vibe-coding-guidebook/issues/8). Accepted — только решением founder при merge PR. Подключение проекта и preview — P1-07 (https://github.com/Makkov-Office/vibe-coding-guidebook/issues/9, раздел «P1-07» ниже); production выключен до отдельного решения founder после P1-08.

## Context

- Сборка `npm run build` (Vinext 1.0.0-beta.5 + `@cloudflare/vite-plugin`) даёт Cloudflare Worker (`dist/server`) и ассеты (`dist/client`). Prerender пишет HTML и RSC payload 29 страниц и `404.html` в `dist/server/prerendered-routes/` (vinext печатает «Prerendered 30 routes» — 29 страниц + `/404`). Все страницы static (`revalidate: false`), API routes, route handlers и middleware нет. Тридцатый маршрут брифа — файл `/handbook.md` из `public/`.
- Бриф (4.4, P1-06) предлагал вариант A — `prerendered-routes` + `dist/client` как статичный сайт с `vercel.json` (rewrites для `.rsc`, заголовки из `_headers`, 404) и вариант B — серверный рендер Vinext, если A ломает SPA-переходы (риск из раздела 12).
- Факт spike (код `node_modules/vinext/dist`, версия 1.0.0-beta.5, и браузер): клиентский переход по `Link` запрашивает не `/<path>.rsc`, а `/<path>?_rsc[=<hash>]` с заголовком `RSC: 1` (`createRscRequestUrl`, `createRscRequestHeaders` в `server/app-rsc-cache-busting.js`). Ответ принимается только при 200, `Content-Type: text/x-component` и `X-Vinext-RSC-Compatibility-Id`, равном id в клиентском bundle (`classifyRscFetchResult` в `server/navigation-planner.js`). Иначе роутер делает hard navigation — полную загрузку страницы: контент верный, но общий layout, индикатор перехода и prefetch теряются (паритет с версией 20 нарушен).
- Compatibility id — `randomUUID()` на каждую сборку, если нет deployment id: `deploymentId` в `next.config`, а при его отсутствии — env `NEXT_DEPLOYMENT_ID` во время сборки (`resolveDeploymentId` и `createRscCompatibilityId`, `config/next-config.js`). С deployment id compatibility id равен ему, а не UUID. Статичный `vercel.json` не может нести значение, которое меняется с каждой сборкой: переменные окружения подставляются только в `dest` и `transforms[].args` маршрутов и только из env проекта (vercel.json, раздел «Using environment variables in routes»).

## Options

| Вариант | Суть | Итог |
|---|---|---|
| A1 | `vercel.json`: `outputDirectory` со сборкой из `dist/client` + `prerendered-routes`, `cleanUrls`, `rewrites` с `has: header rsc` → `.rsc`, `headers` из `_headers`, 404 | Отвергнут: без compatibility id SPA-переход — полная загрузка на 29/29 страниц (negative control `--variant no-compat`); без rewrite — то же (`--variant no-rsc`) |
| **A2** | Static export через Build Output API v3: postbuild-скрипт пишет `.vercel/output/static` и `config.json` (routes, overrides) с compatibility id этой сборки; `vercel.json` — только настройки сборки | **Выбран** |
| A3 | Постоянный id через `deploymentId` в `next.config.ts` + правила в `vercel.json` | Отвергнут: меняет конфиг сборки, общий с Cloudflare/Sites; постоянный id отключает защиту Vinext от рассинхрона клиента и payload между деплоями |
| B | Серверный рендер Vinext на Vercel (Functions) | Не нужен: A2 сохраняет SPA-переходы. Требует адаптера для beta-фреймворка, функций, cold start и затрат. Остаётся запасным вариантом |

## Decision

Вариант A2. Сборка та же, что для Cloudflare/Sites; `dist/` не меняется, деплой — только статические файлы, без серверного кода.

- `vercel.json`: `framework: null` (Framework Preset «Other»), `installCommand: npm ci --include=dev`, `buildCommand: npm run build && node scripts/vercel-output.mjs`.
- `scripts/vercel-output.mjs` → `.vercel/output`:
  - `static/` = `dist/client` без Cloudflare-only файлов (`_headers`, `.assetsignore` и то, что он перечисляет: `wrangler.json`, `.dev.vars`, `.vite`) + `prerendered-routes` (HTML, RSC, `404.html`). Совпадение имён — FAIL.
  - `overrides`: `<page>.html` → URL без расширения (как у Worker: `/chapters/01`); `*.rsc` → `text/x-component`; `handbook.md` → `text/markdown; charset=utf-8`.
  - `routes`: `/<path>/` → 308 `/<path>` (Vinext `trailingSlash: false`); `_headers` → заголовки (`/_next/static/*` → `public, max-age=31536000, immutable`); HTML страниц — `Vary` и `Link` (preload) из `vinext-prerender.json`; запрос с `RSC: 1` на страницу → `/<page>.rsc` с `X-Vinext-RSC-Compatibility-Id`, `Vary` и `X-Vinext-Params` (для `/chapters/:number`); `handle: filesystem`; промах → `404.html` со статусом 404.
  - Compatibility id — единственный UUID, который есть и в клиентском bundle рядом с `X-Vinext-RSC-Compatibility-Id`, и в серверном bundle, и не равен `BUILD_ID`. Любое отклонение — exit 1, сборка на Vercel падает до деплоя: 0 или 2+ кандидата (в том числе при `NEXT_DEPLOYMENT_ID`), нет `.html`/`.rsc` у страницы, `revalidate` ≠ false, незнакомый prerendered-файл, заголовок prerender кроме `link`, `_headers` не в простой форме (плейсхолдеры, `!`-строки), запись `.assetsignore` с `*`, `?`, `[`, `]`, `!`, `\` или `/` (поддержаны только простые имена; как в gitignore, имя совпадает на любой глубине).
  - `--out` удаляется и пишется заново, поэтому допустим только путь `<каталог>/.vercel/output`: не содержит проект, не внутри `dist`, `node_modules`, `.git`, без symlink; пустое или отсутствующее значение, неизвестный аргумент — FAIL до любых изменений.
- `scripts/check-vercel-output.mjs` — локальная проверка без аккаунта: эмуляция маршрутизации Build Output API (source routes с `has`/`missing`/`headers`/`dest`/`status`/`continue`/`caseSensitive`, фазы `filesystem` и `error`, `overrides`, directory index) и Chromium; незнакомые ключи маршрута (`check`, `methods`, `transforms`, `locale`, …) и `MatchableValue` — ошибка, строковый `has.value` — regex («A regex like string», vercel.json docs), полное совпадение; `--url` — те же проверки против реального preview в P1-07/P1-08.
- `eslint.config.mjs`: `.vercel/**` в ignores — иначе `npm run lint` после локальной сборки проверяет минифицированный bundle в `.vercel/output`.

## Consequences

- Плюсы: SPA-переходы, прямой заход и refresh работают так же, как на Worker; HTML и RSC — байт-в-байт файлы prerender; нет функций и серверного кода на Vercel; Cloudflare/Sites и `.openai/hosting.json` не тронуты.
- Связность с внутренностями Vinext beta: имена заголовков, формат `?_rsc`, раскладка `prerendered-routes`, UUID в bundle. Скрипт падает закрыто; при ошибочном id деградация мягкая — полная загрузка страниц, контент верный. Обновление Vinext — отдельный тикет с повторным `check-vercel-output` (бриф, раздел 12).
- RSC payload в prerender отличается от ответа Worker (`wrangler dev`): Worker рендерит на запрос и добавляет streaming metadata, в prerender её нет. Браузерная проверка переходов на prerender-файлах — PASS; расхождение для P1-08 (parity) записано здесь.
- `vercel build` (CLI 62.7.0) переносит наш `config.json` как есть, но ставит 308-маршрут после маршрутов с `continue` и добавляет свою секцию `handle: error` → `404.html`. Проверка выполнялась по итоговому `config.json` после `vercel build`.
- CLI выбирает builder `@vercel/next` при зависимости `next`, если проект создан до 01.03.2020 или framework не задан; для нового проекта с `framework: null` — static build и passthrough `.vercel/output` (наблюдение в коде CLI `detectFrontBuilder` и в локальном прогоне). В P1-07 проверить, что preview собран без `@vercel/next`.
- Node.js: Vercel берёт major из `engines`; `>=22.13.0` даёт последнюю 24.x, не 22.x из `.nvmrc` (документация «Supported Node.js versions»). Сборка на Node 24 не проверялась. P1-07: `engines` → `^22.13.0` (тот же минимум, major 22 — последняя 22.x на Vercel), раздел «P1-07».
- Установка: `npm ci --include=dev` ставит devDependencies (vite, vinext, wrangler нужны сборке) и 29 записей `@img/sharp-*` с `"dev": true` даже при `NODE_ENV=production` (входное условие из комментария к #8).
- Вход для P1-07 (Skew Protection): если при сборке задан `NEXT_DEPLOYMENT_ID` (env проекта или платформы), compatibility id равен ему, UUID в bundle нет, и `vercel-output.mjs` падает с `expected one RSC compatibility id, found 0` (проверено сборкой с `NEXT_DEPLOYMENT_ID=p106probe`). Сборка падает закрыто, деплоя нет. В P1-07 проверить env preview/production; Skew Protection — отдельное решение (тогда скрипт берёт id из `NEXT_DEPLOYMENT_ID`, отдельный тикет). Документация Vercel описывает системную `VERCEL_DEPLOYMENT_ID` для Skew Protection; ставит ли платформа `NEXT_DEPLOYMENT_ID` для static build — не проверено.
- Итоговый `config.json` после `vercel build` содержит `framework` (`{"slug": "nextjs", …}` — CLI определил Next.js по зависимости). По документации Build Output Configuration это поле «used for display purposes only»; builder и маршрутизацию оно не меняет (в логе `vercel build` нет `@vercel/next` и `Detected Next.js`).
- Production по-прежнему ChatGPT Sites; два адреса и переадресация — решение founder (бриф, раздел 13).

## Validation

Evidence — раздел ниже и PR. Команды в свежем `git clone`: `npm ci`, `npm run validate`, `npx --yes vercel@62.7.0 build` с локальным `.vercel/project.json` без аккаунта, `node scripts/check-vercel-output.mjs` (full, `--variant no-compat`, `--variant no-rsc`) и `--url` против `npm start` (Worker) как baseline.

Не проверено (INCOMPLETE до P1-07): реальная маршрутизация и CDN Vercel (здесь эмуляция), регистр заголовка в `has`, сборка на Node 24, сжатие, заголовки кэша по умолчанию, `/chapters/01.html` и `/index.html` (на Worker — 404; на Vercel с `overrides` — не проверено), Deployment Protection на preview.

## Rollback

Ничего не задеплоено. Откат PR — `git revert` merge-коммита: удаляет `vercel.json`, два скрипта, строку в `eslint.config.mjs`, абзац README и этот ADR; `dist/` и Sites не затронуты. После P1-07 — Instant Rollback / отключение проекта в Vercel (отдельный ADR или P1-07).

## Revisit trigger

Обновление Vinext или `@cloudflare/vite-plugin`; FAIL `check-vercel-output` на preview; появление ISR, API routes, auth или middleware (тогда вариант B); официальный адаптер Vinext для Vercel.

## Sources

Проверено 22.10.2026 (дата обновления страницы — `last_updated` на странице):

- Build Output API — https://vercel.com/docs/build-output-api (11.08.2026): «create the `.vercel/output` directory and populate it according to this specification yourself».
- Build Output Configuration — https://vercel.com/docs/build-output-api/configuration (27.07.2026): `routes` (src, dest, headers, continue, status, has, missing), handle `filesystem`/`error`, `overrides` (`path`, `contentType`).
- vercel.json — https://vercel.com/docs/project-configuration/vercel-json (14.08.2026): `framework: null` = «Other», `installCommand`, `buildCommand`, `cleanUrls`, `trailingSlash`, `headers`, `rewrites`, env только в `dest`/`transforms.args`.
- vercel build — https://vercel.com/docs/cli/build (07.10.2026): артефакты в `.vercel/output`.
- Supported Node.js versions — https://vercel.com/docs/functions/runtimes/node-js/node-js-versions (27.02.2026): 24.x (default), 22.x; `>=22.0.0` → latest 24.x.
- Код Vinext 1.0.0-beta.5 (`node_modules/vinext/dist`, lockfile) и Vercel CLI 62.7.0 (npm, опубликован 07.10.2026; запуск через `npx`, не в `package.json`).

## Evidence

Код и конфигурация — SHA `3ff1245fe2d54e368f1b3310f0b1cd8c604ff260` (после review-исправлений; base `origin/main` `80b066e5c44a611df305db517f514bf56a8d6ed9`), свежий `git clone` ветки `p1-06-vercel-spike` во временном каталоге, 22.10.2026. Прогон на `6568fe3` до review дал те же результаты маршрутов и больше не считается evidence. Node 22.22.0, npm 10.9.4, Chromium 1194 (`/opt/pw-browsers`, `CHROMIUM_PATH`), Vercel CLI 62.7.0 через `npx` (в `package.json`/lockfile не записан). Аккаунт Vercel, логин, токены, `vercel link/deploy` не использовались; `.vercel/project.json` — локальная заглушка (`framework: null`, `createdAt` 2026), egress к vercel.com из среды закрыт.

| Шаг | Команда | Результат |
|---|---|---|
| Установка | `NODE_ENV=production npm ci --include=dev` | PASS: 958 пакетов, `@img/sharp-linux-x64` и `vite` на месте |
| Проект | `npm run validate` | PASS: content, test, typecheck, lint, build, tree |
| Vercel build | `VERCEL_TELEMETRY_DISABLED=1 npx --yes vercel@62.7.0 build` | PASS: install `npm ci --include=dev`, build command, `vercel-output: PASS 29 pages (+404), 127 client files (3 Cloudflare-only skipped)`, `Build completed successfully`; итоговый `config.json` — 65 routes (`error`, `filesystem`), 58 overrides |
| A2, эмуляция | `node scripts/check-vercel-output.mjs` (итог `vercel build`) | PASS 155/155 |
| A1 без id | `--variant no-compat` | FAIL 58/155 (ожидаемо): SPA 0/29 — «full page load», HTTP RSC без id 0/29 |
| A1 без rewrite | `--variant no-rsc` | FAIL 58/155 (ожидаемо): SPA 0/29, на `?_rsc` отдаётся HTML |
| Baseline Worker | `npm start -- --port 35675` (свободный порт, проверен до старта) + `--url http://127.0.0.1:35675` | PASS 155/155; Worker отдаёт тот же compatibility id `11832da2-…`, что извлёк скрипт из этой сборки |
| `--out` (finding 1) | 18 негативных проб: без значения, `--out=`, пробел, `.`, `dist`, `..`, `/`, `node_modules/…`, `dist/…`, `.git/…`, `foo/output`, `.vercel`, `--out --foo`, `--foo`, позиционный аргумент, `.vercel` — symlink, dangling symlink, файл | Все exit 1 до изменений; файлов вне `.vercel` до/после: 98568/98568, `.git`, `node_modules`, `dist` на месте. Позитивный контроль `<tmp>/.vercel/output` — exit 0 |
| Входы (finding 2) | `.assetsignore` + `*.map`, `/wrangler.json`, `!wrangler.json`, `a/b`, `dir/`, `wrangler.[jt]son`, `file?`; заголовок prerender `x-robots-tag`; `_headers` `/:splat`, строка `! Cache-Control` | Все exit 1 с причиной; контроль без изменений — exit 0 |
| `NEXT_DEPLOYMENT_ID` | `NEXT_DEPLOYMENT_ID=p106probe npm run build`, затем `node scripts/vercel-output.mjs` | exit 1 `expected one RSC compatibility id, found 0` (fail closed) |
| `framework` в итоге | `config.json` после `vercel build` | `{"slug":"nextjs","version":"16.3.4"}`; в логе нет `@vercel/next`/`Detected Next.js` |

Маршруты (вариант A2, итог `vercel build`, локальная эмуляция). HTTP — статус и тип, байты равны файлам prerender (`.html`, `.rsc`) и `content/handbook.md`; Direct/Refresh — Chromium 1440×1000, статус 200, `title` и `h1` страницы; SPA — клик по видимой ссылке rail с `/` (для `/` — с `/glossary`, для `/chapters/01` — с `/chapters/02`), без новой загрузки документа и с сохранённым `window`-маркером.

| # | Route | HTTP HTML/file | HTTP RSC | Direct | Refresh | SPA |
|---|---|---|---|---|---|---|
| 1 | `/` | PASS | PASS | PASS | PASS | PASS |
| 2 | `/glossary` | PASS | PASS | PASS | PASS | PASS |
| 3 | `/print` | PASS | PASS | PASS | PASS | PASS |
| 4 | `/resources` | PASS | PASS | PASS | PASS | PASS |
| 5 | `/tools` | PASS | PASS | PASS | PASS | PASS |
| 6 | `/tools/claude-code` | PASS | PASS | PASS | PASS | PASS |
| 7 | `/tools/codex` | PASS | PASS | PASS | PASS | PASS |
| 8 | `/chapters/01` | PASS | PASS | PASS | PASS | PASS |
| 9 | `/chapters/02` | PASS | PASS | PASS | PASS | PASS |
| 10 | `/chapters/03` | PASS | PASS | PASS | PASS | PASS |
| 11 | `/chapters/04` | PASS | PASS | PASS | PASS | PASS |
| 12 | `/chapters/05` | PASS | PASS | PASS | PASS | PASS |
| 13 | `/chapters/06` | PASS | PASS | PASS | PASS | PASS |
| 14 | `/chapters/07` | PASS | PASS | PASS | PASS | PASS |
| 15 | `/chapters/08` | PASS | PASS | PASS | PASS | PASS |
| 16 | `/chapters/09` | PASS | PASS | PASS | PASS | PASS |
| 17 | `/chapters/10` | PASS | PASS | PASS | PASS | PASS |
| 18 | `/chapters/11` | PASS | PASS | PASS | PASS | PASS |
| 19 | `/chapters/12` | PASS | PASS | PASS | PASS | PASS |
| 20 | `/chapters/13` | PASS | PASS | PASS | PASS | PASS |
| 21 | `/chapters/14` | PASS | PASS | PASS | PASS | PASS |
| 22 | `/chapters/15` | PASS | PASS | PASS | PASS | PASS |
| 23 | `/chapters/16` | PASS | PASS | PASS | PASS | PASS |
| 24 | `/chapters/17` | PASS | PASS | PASS | PASS | PASS |
| 25 | `/chapters/18` | PASS | PASS | PASS | PASS | PASS |
| 26 | `/chapters/19` | PASS | PASS | PASS | PASS | PASS |
| 27 | `/chapters/20` | PASS | PASS | PASS | PASS | PASS |
| 28 | `/chapters/21` | PASS | PASS | PASS | PASS | PASS |
| 29 | `/chapters/22` | PASS | PASS | PASS | PASS | PASS |
| 30 | `/handbook.md` | PASS | n/a | n/a | n/a | n/a |

Прочие проверки того же прогона: 404 и тело `404.html` — `/nope`, `/chapters/99`, `/chapters`, `/_headers`, `/.vite/manifest.json`, `/wrangler.json` (6/6 PASS, как на Worker); `/chapters/01/` → 308 `/chapters/01` (PASS); `/_next/static/*.js` — `public, max-age=31536000, immutable` (PASS); ошибок страниц в браузере нет (PASS). В A2 все 29 переходов — без загрузки нового документа; RSC-запросов за переход 1–17 (с prefetch ссылок rail; ровно 1 — в 9 из 29), у Worker 1–23. В негативных вариантах — полная загрузка документа на 29/29.

Логи, JSON и скрипты проб не коммитятся (временный каталог удалён); воспроизведение — команды выше. HEAD PR и run CI — в PR.

## P1-07: подключение проекта (только preview)

Решение founder 22.10.2026 09:21 UTC (founder gate #9): проект в команде `makkov-design`, только preview на каждый PR; production из `main` выключен — ни сейчас, ни при merge P1-07; включается отдельным решением founder после parity-аудита P1-08. Имя `vibe-coding-guidebook`, адрес `*.vercel.app`, Framework Preset Other, Deployment Protection по умолчанию; свой домен и ChatGPT Sites не трогаются.

- Запрет production — в коде и в проекте, три независимых слоя:
  1. `vercel.json` `git.deploymentEnabled: {"main": false}` — push в `main` не создаёт деплой («Specify branches that should not trigger a deployment upon commits», Git Configuration). Действует с коммитов `main`, где этот `vercel.json` уже есть, то есть после merge.
  2. `vercel.json` `ignoreCommand` — сборка продолжается (exit 1) только при `VERCEL_ENV=preview`; production, development и пустое значение — exit 0, сборка отменяется (fail closed).
  3. Тот же Ignored Build Step в настройках проекта (`commandForIgnoringBuildStep`, задан при создании проекта в одном запросе с подключением репозитория): закрывает коммиты `main` до merge, где `vercel.json` из P1-06 без правил 1–2 (`ignoreCommand` в `vercel.json` переопределяет настройку проекта, команда та же).
  Deployment Policies (блокировка production по источникам) доступны только на Pro/Enterprise, команда — Hobby. `github.autoAlias: false` не выбран: он делает деплои после merge preview, но деплой всё равно создаётся.
- Node.js 22.x: `engines` `^22.13.0` (документация: `^22.0.0` → «latest 22.x»; `engines` переопределяет Project Settings, `.nvmrc` не упоминается). Тот же минимум 22.13, что и раньше; `npm run doctor` понимает `^X.Y.Z` (major фиксирован). `package-lock.json` синхронизирован (`npm install --package-lock-only`, npm 10.9.4): меняется только `packages[""].engines.node`.
- Статус подключения: до 22.10.2026 16:38 UTC — BLOCKED (история ниже); затем проект создан, evidence — раздел «P1-07: evidence». Первоначальная блокировка: `create_project` с `gitRepository` (Vercel MCP) — 400 «You need to add a Login Connection to your GitHub account first»; `git_namespaces` (github) — пусто; в команде по-прежнему один чужой проект. Кроме того, команда `makkov-design` — Hobby, а репозиторий приватный в организации: «You cannot deploy to a Hobby team from a private repository in a GitHub organization… Consider making the repository public or upgrading to Pro» (https://vercel.com/docs/git, 18.09.2026); для приватного репозитория деплой идёт, только если автор коммита — владелец Hobby-команды (Pro — член команды) по Login Connections, а коммиты агента подписаны `Claude <noreply@anthropic.com>`. Решение founder 22.10.2026 11:44 UTC — вариант A: репозиторий становится публичным; founder подключает GitHub Login Connection в Vercel, ставит Vercel GitHub App на `Makkov-Office` и меняет visibility, после этого агент создаёт проект (с Ignored Build Step). Отвергнуты: B — Pro (платно, коммиты агента всё равно не проходят проверку автора), C — GitHub Actions + Vercel CLI (токен в Secrets, новый workflow).
- Включение production позже: отдельный PR (убрать правила 1–2) и смена настройки проекта (правило 3) — решение founder; до этого 0 production-деплоев.
- Источники, проверено 22.10.2026: Git Configuration — https://vercel.com/docs/project-configuration/git-configuration (25.08.2026); vercel.json `ignoreCommand` — https://vercel.com/docs/project-configuration/vercel-json (exit 1 — сборка, exit 0 — пропуск); Ignored Build Step — https://vercel.com/kb/guide/how-do-i-use-the-ignored-build-step-field-on-vercel (16.10.2026); Supported Node.js versions — https://vercel.com/docs/functions/runtimes/node-js/node-js-versions (27.02.2026); Deployment Policies — https://vercel.com/docs/deployments/deployment-policy (14.07.2026); Vercel for GitHub — https://vercel.com/docs/git/vercel-for-github (17.09.2026); commit author на Hobby — https://vercel.com/kb/guide/why-aren-t-commits-triggering-deployments-on-vercel (16.10.2026).

## P1-07: evidence

22.10.2026, после шагов founder по варианту A (репозиторий публичный; `git_namespaces` github — `Makkov-design` и `Makkov-Office`, `isAccessRestricted: false`).

- Проект `vibe-coding-guidebook`, id `prj_1oIAEY587WXA2lJKQHmoZXH1go9r`, команда `makkov-design` (Hobby): создан одним `create_project` (Vercel MCP) с `gitRepository`, `framework: null`, install/build command и `commandForIgnoringBuildStep`; затем `nodeVersion` 22.x. Deployment Protection по умолчанию: Vercel Authentication, `all_except_custom_domains`. Платформа добавила домен `vibe-coding-guidebook-ivory.vercel.app`; готового деплоя за ним нет. Значение `commandForIgnoringBuildStep` в ответе `get_project` (Vercel MCP) не возвращается, поэтому слой 3 независимо не подтверждён.
- Первая git-сборка нового проекта (push `96df653` в `p1-07-vercel-integration`, `dpl_Hsme8ifuiND52vDk49zjfE7Tz7zj`) пришла с `target: production`, хотя Branch Tracking production — `main` (скриншот настроек от founder; founder ничего не менял). Ignored Build Step её отменил: «The deployment was canceled because the Ignored Build Step command returned exit code 0»; состояние CANCELED. В поле `alias` деплоя были запланированы `vibe-coding-guidebook-makkov-design.vercel.app` и branch-alias; ни один не назначен на этот деплой (`list_aliases`: только branch-alias, и он указывает на preview). Причина `target: production` не установлена, наблюдение однократное: следующие git push в ветку (`c06ab38` → `dpl_2Qe1bDSyYTP59vUQkhUv4AfgghW1` и далее) пришли с `target` preview. Отменил сборку `ignoreCommand` из `vercel.json` этого коммита (слой 2; он переопределяет настройку проекта). GitHub commit status `Vercel` у отменённого деплоя тоже success, поэтому evidence — состояние деплоя (READY/CANCELED), а не этот статус.
- Preview `dpl_143C63MSLKrQ7o5p1usv6TynhkAp` (`create_deployment` без `target`, ref `p1-07-vercel-integration`, SHA `96df653`): `target` preview, READY за 54 s. Лог: Ignored Build Step пропустил (preview), `npm ci --include=dev` (958 пакетов), «Prerendered 30 routes», publication audit PASS, `vercel-output: PASS 29 pages (+404), 127 client files (3 Cloudflare-only skipped)`, `@vercel/next` в логе нет.
- Маршруты, HTTP GET через Vercel MCP `web_fetch_vercel_url` (bypass Deployment Protection): 29 страниц — 200 `text/html`, `title` и `h1` равны prerender той же ревизии (байты HTML отличаются от локальной сборки — другой build, иные хэши и compatibility id); `/handbook.md` — 200 `text/markdown; charset=utf-8`, байт-в-байт `content/handbook.md`; `/nope`, `/wrangler.json` — 404, страница 404. Итого 30/30 маршрутов PASS по HTTP.
- Production: READY production-деплоев 0 (`list_deployments target=production` — одна запись CANCELED, выше); `list_aliases` проекта — только branch-alias на preview.
- Не проверено (INCOMPLETE): `node scripts/check-vercel-output.mjs --url <preview>` — egress-прокси среды отвечает 403 на CONNECT к `*.vercel.app`, поэтому нет браузерных direct/refresh/SPA, RSC-ответов (`RSC: 1`), 308 и immutable cache на реальном CDN — остаётся для P1-08 (или запуск с машины founder). Фактическая версия Node на Vercel в логе не печатается (настройки: `nodeVersion` 22.x, `engines` `^22.13.0`). `git.deploymentEnabled.main` на платформе — после merge.

## P1-08: проверка на реальном preview

22.10.2026, preview `dpl_DWbnTrFD1AgNrNrMtGPbuidg3KPG` (SHA `e36fb13`, target preview), доступ через share-ссылку Vercel MCP (cookie `_vercel_jwt` в `CHECK_COOKIE`; Deployment Protection не менялась). Закрывает INCOMPLETE из «P1-07: evidence»:

- `node scripts/check-vercel-output.mjs --url <preview>` — PASS 155/155 на реальном CDN Vercel: HTTP HTML и RSC (`RSC: 1` → `text/x-component` с compatibility id), direct, refresh и SPA-переход без загрузки документа на 29/29 страницах, `/handbook.md`, 404 (6/6), `/chapters/01/` → 308 `/chapters/01`, `/_next/static/*` — `immutable`, ошибок страниц нет.
- Parity с ChatGPT Sites (версия 20) — `docs/audits/parity-2026-10-22.md`: контент и якоря 30/30, скриншоты 60/60 равны; расхождения — ожидаемые из P1-12 и заголовки HTTP.
- На preview Vercel добавляет `X-Robots-Tag: noindex`; для production проверить отдельно при его включении.
