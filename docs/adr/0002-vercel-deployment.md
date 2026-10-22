# ADR 0002: Деплой на Vercel — статический экспорт через Build Output API

Status: Proposed — 22.10.2026, spike P1-06 (https://github.com/Makkov-Office/vibe-coding-guidebook/issues/8). Accepted — только решением founder при merge PR. Подключение проекта, preview и production — P1-07 (founder gate).

## Context

- Сборка `npm run build` (Vinext 1.0.0-beta.5 + `@cloudflare/vite-plugin`) даёт Cloudflare Worker (`dist/server`) и ассеты (`dist/client`). Prerender пишет HTML и RSC payload 29 страниц и `404.html` в `dist/server/prerendered-routes/` (vinext печатает «Prerendered 30 routes» — 29 страниц + `/404`). Все страницы static (`revalidate: false`), API routes, route handlers и middleware нет. Тридцатый маршрут брифа — файл `/handbook.md` из `public/`.
- Бриф (4.4, P1-06) предлагал вариант A — `prerendered-routes` + `dist/client` как статичный сайт с `vercel.json` (rewrites для `.rsc`, заголовки из `_headers`, 404) и вариант B — серверный рендер Vinext, если A ломает SPA-переходы (риск из раздела 12).
- Факт spike (код `node_modules/vinext/dist`, версия 1.0.0-beta.5, и браузер): клиентский переход по `Link` запрашивает не `/<path>.rsc`, а `/<path>?_rsc[=<hash>]` с заголовком `RSC: 1` (`createRscRequestUrl`, `createRscRequestHeaders` в `server/app-rsc-cache-busting.js`). Ответ принимается только при 200, `Content-Type: text/x-component` и `X-Vinext-RSC-Compatibility-Id`, равном id в клиентском bundle (`classifyRscFetchResult` в `server/navigation-planner.js`). Иначе роутер делает hard navigation — полную загрузку страницы: контент верный, но общий layout, индикатор перехода и prefetch теряются (паритет с версией 20 нарушен).
- Compatibility id — `randomUUID()` на каждую сборку, если в `next.config` нет `deploymentId` (`createRscCompatibilityId`, `config/next-config.js`). Статичный `vercel.json` не может нести значение, которое меняется с каждой сборкой: переменные окружения подставляются только в `dest` и `transforms[].args` маршрутов и только из env проекта (vercel.json, раздел «Using environment variables in routes»).

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
  - Compatibility id — единственный UUID, который есть и в клиентском bundle рядом с `X-Vinext-RSC-Compatibility-Id`, и в серверном bundle, и не равен `BUILD_ID`. Любое отклонение (0 или 2+ кандидата, нет `.html`/`.rsc` у страницы, неизвестный формат `_headers`, `revalidate` ≠ false, незнакомый prerendered-файл) — exit 1, сборка на Vercel падает до деплоя.
- `scripts/check-vercel-output.mjs` — локальная проверка без аккаунта: эмуляция маршрутизации Build Output API (source routes с `has`/`missing`/`headers`/`dest`/`status`/`continue`, фазы `filesystem` и `error`, `overrides`, directory index) и Chromium; `--url` — те же проверки против реального preview в P1-07/P1-08.
- `eslint.config.mjs`: `.vercel/**` в ignores — иначе `npm run lint` после локальной сборки проверяет минифицированный bundle в `.vercel/output`.

## Consequences

- Плюсы: SPA-переходы, прямой заход и refresh работают так же, как на Worker; HTML и RSC — байт-в-байт файлы prerender; нет функций и серверного кода на Vercel; Cloudflare/Sites и `.openai/hosting.json` не тронуты.
- Связность с внутренностями Vinext beta: имена заголовков, формат `?_rsc`, раскладка `prerendered-routes`, UUID в bundle. Скрипт падает закрыто; при ошибочном id деградация мягкая — полная загрузка страниц, контент верный. Обновление Vinext — отдельный тикет с повторным `check-vercel-output` (бриф, раздел 12).
- RSC payload в prerender отличается от ответа Worker (`wrangler dev`): Worker рендерит на запрос и добавляет streaming metadata, в prerender её нет. Браузерная проверка переходов на prerender-файлах — PASS; расхождение для P1-08 (parity) записано здесь.
- `vercel build` (CLI 62.7.0) переносит наш `config.json` как есть, но ставит 308-маршрут после маршрутов с `continue` и добавляет свою секцию `handle: error` → `404.html`. Проверка выполнялась по итоговому `config.json` после `vercel build`.
- CLI выбирает builder `@vercel/next` при зависимости `next`, если проект создан до 01.03.2020 или framework не задан; для нового проекта с `framework: null` — static build и passthrough `.vercel/output` (наблюдение в коде CLI `detectFrontBuilder` и в локальном прогоне). В P1-07 проверить, что preview собран без `@vercel/next`.
- Node.js: Vercel берёт major из `engines`; `>=22.13.0` даёт последнюю 24.x, не 22.x из `.nvmrc` (документация «Supported Node.js versions»). Сборка на Node 24 не проверялась — решение founder в P1-07: `engines` `22.x` или проверка на 24.
- Установка: `npm ci --include=dev` ставит devDependencies (vite, vinext, wrangler нужны сборке) и 29 записей `@img/sharp-*` с `"dev": true` даже при `NODE_ENV=production` (входное условие из комментария к #8).
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
