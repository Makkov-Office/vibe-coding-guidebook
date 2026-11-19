# ADR 0002: Deploying to Vercel — static export via the Build Output API

Status: Accepted — 2026-10-23, founder decision "turn on production" (P1-16, https://github.com/Makkov-Office/vibe-coding-guidebook/issues/33). History: Proposed 2026-10-22, spike P1-06 (https://github.com/Makkov-Office/vibe-coding-guidebook/issues/8); project connection and preview — P1-07 (https://github.com/Makkov-Office/vibe-coding-guidebook/issues/9, section "P1-07" below); production stayed off until a founder decision after P1-08; enabling it — section "P1-16" below.

## Context

- The `npm run build` build (Vinext 1.0.0-beta.5 + `@cloudflare/vite-plugin`) produces a Cloudflare Worker (`dist/server`) and assets (`dist/client`). Prerender writes the HTML and RSC payload of 29 pages and `404.html` to `dist/server/prerendered-routes/` (vinext prints "Prerendered 30 routes" — 29 pages + `/404`). All pages are static (`revalidate: false`); there are no API routes, route handlers or middleware. The thirtieth route in the brief is the `/handbook.md` file from `public/`.
- The brief (4.4, P1-06) proposed option A — `prerendered-routes` + `dist/client` as a static site with `vercel.json` (rewrites for `.rsc`, headers from `_headers`, 404) — and option B — Vinext server rendering, if A breaks SPA navigation (a risk from section 12).
- Spike finding (code in `node_modules/vinext/dist`, version 1.0.0-beta.5, and the browser): a client-side navigation via `Link` requests not `/<path>.rsc` but `/<path>?_rsc[=<hash>]` with the header `RSC: 1` (`createRscRequestUrl`, `createRscRequestHeaders` in `server/app-rsc-cache-busting.js`). The response is accepted only with 200, `Content-Type: text/x-component` and an `X-Vinext-RSC-Compatibility-Id` equal to the id in the client bundle (`classifyRscFetchResult` in `server/navigation-planner.js`). Otherwise the router does a hard navigation — a full page load: the content is correct, but the shared layout, the navigation indicator and prefetch are lost (parity with version 20 is broken).
- The compatibility id is `randomUUID()` on every build unless there is a deployment id: `deploymentId` in `next.config`, or, if it is absent, the env `NEXT_DEPLOYMENT_ID` at build time (`resolveDeploymentId` and `createRscCompatibilityId`, `config/next-config.js`). With a deployment id, the compatibility id equals it rather than a UUID. A static `vercel.json` cannot carry a value that changes with every build: environment variables are substituted only in `dest` and `transforms[].args` of routes, and only from the project env (vercel.json, section "Using environment variables in routes").

## Options

| Option | Essence | Outcome |
|---|---|---|
| A1 | `vercel.json`: `outputDirectory` built from `dist/client` + `prerendered-routes`, `cleanUrls`, `rewrites` with `has: header rsc` → `.rsc`, `headers` from `_headers`, 404 | Rejected: without the compatibility id an SPA navigation is a full load on 29/29 pages (negative control `--variant no-compat`); without the rewrite — the same (`--variant no-rsc`) |
| **A2** | Static export via Build Output API v3: a postbuild script writes `.vercel/output/static` and `config.json` (routes, overrides) with this build's compatibility id; `vercel.json` holds only build settings | **Chosen** |
| A3 | A permanent id via `deploymentId` in `next.config.ts` + rules in `vercel.json` | Rejected: changes the build config shared with Cloudflare/Sites; a permanent id disables Vinext's protection against client/payload mismatch between deploys |
| B | Vinext server rendering on Vercel (Functions) | Not needed: A2 preserves SPA navigation. Requires an adapter for a beta framework, functions, cold start and costs. Remains a fallback |

## Decision

Option A2. The build is the same as for Cloudflare/Sites; `dist/` does not change, and the deploy is static files only, with no server code.

- `vercel.json`: `framework: null` (Framework Preset "Other"), `installCommand: npm ci --include=dev`, `buildCommand: npm run build && node scripts/vercel-output.mjs`.
- `scripts/vercel-output.mjs` → `.vercel/output`:
  - `static/` = `dist/client` without Cloudflare-only files (`_headers`, `.assetsignore` and what it lists: `wrangler.json`, `.dev.vars`, `.vite`) + `prerendered-routes` (HTML, RSC, `404.html`). A name collision is a FAIL.
  - `overrides`: `<page>.html` → URL without extension (as on the Worker: `/chapters/01`); `*.rsc` → `text/x-component`; `handbook.md` → `text/markdown; charset=utf-8`.
  - `routes`: `/<path>/` → 308 `/<path>` (Vinext `trailingSlash: false`); `_headers` → headers (`/_next/static/*` → `public, max-age=31536000, immutable`); page HTML gets `Vary` and `Link` (preload) from `vinext-prerender.json`; a request with `RSC: 1` to a page → `/<page>.rsc` with `X-Vinext-RSC-Compatibility-Id`, `Vary` and `X-Vinext-Params` (for `/chapters/:number`); `handle: filesystem`; a miss → `404.html` with status 404.
  - The compatibility id is the single UUID that is present both in the client bundle next to `X-Vinext-RSC-Compatibility-Id` and in the server bundle, and is not equal to `BUILD_ID`. Any deviation is exit 1, and the Vercel build fails before deploy: 0 or 2+ candidates (including with `NEXT_DEPLOYMENT_ID`), a page missing `.html`/`.rsc`, `revalidate` ≠ false, an unknown prerendered file, a prerender header other than `link`, `_headers` not in the simple form (placeholders, `!` lines), an `.assetsignore` entry with `*`, `?`, `[`, `]`, `!`, `\` or `/` (only simple names are supported; as in gitignore, a name matches at any depth).
  - `--out` is deleted and rewritten, so only a path `<directory>/.vercel/output` is allowed: it does not contain the project, is not inside `dist`, `node_modules`, `.git`, and has no symlink; an empty or missing value or an unknown argument is a FAIL before any changes.
- `scripts/check-vercel-output.mjs` — a local check without an account: an emulation of Build Output API routing (source routes with `has`/`missing`/`headers`/`dest`/`status`/`continue`/`caseSensitive`, the `filesystem` and `error` phases, `overrides`, directory index) and Chromium; unknown route keys (`check`, `methods`, `transforms`, `locale`, …) and `MatchableValue` are errors; a string `has.value` is a regex ("A regex like string", vercel.json docs), full match; `--url` runs the same checks against a real preview in P1-07/P1-08.
- `eslint.config.mjs`: `.vercel/**` in ignores — otherwise `npm run lint` after a local build checks the minified bundle in `.vercel/output`.

## Consequences

- Pros: SPA navigation, direct entry and refresh work the same as on the Worker; HTML and RSC are byte-for-byte the prerender files; no functions or server code on Vercel; Cloudflare/Sites and `.openai/hosting.json` are untouched.
- Coupling to Vinext beta internals: header names, the `?_rsc` format, the `prerendered-routes` layout, the UUID in the bundle. The script fails closed; with a wrong id the degradation is soft — full page loads, correct content. A Vinext upgrade is a separate ticket with a repeat `check-vercel-output` (brief, section 15).
- The RSC payload in prerender differs from the Worker response (`wrangler dev`): the Worker renders per request and adds streaming metadata, which prerender lacks. The browser check of navigation on the prerender files is PASS; the difference is recorded here for P1-08 (parity).
- `vercel build` (CLI 62.7.0) carries our `config.json` over as is, but places the 308 route after the routes with `continue` and adds its own `handle: error` section → `404.html`. The check was run against the final `config.json` after `vercel build`.
- The CLI picks the `@vercel/next` builder when there is a `next` dependency if the project was created before 2020-03-01 or no framework is set; for a new project with `framework: null` — a static build and passthrough of `.vercel/output` (observed in the CLI code `detectFrontBuilder` and in a local run). In P1-07, check that the preview was built without `@vercel/next`.
- Node.js: Vercel takes the major from `engines`; `>=22.13.0` gives the latest 24.x, not the 22.x from `.nvmrc` (documentation "Supported Node.js versions"). A build on Node 24 was not checked. P1-07: `engines` → `^22.13.0` (the same minimum, major 22 — the latest 22.x on Vercel), section "P1-07".
- Install: `npm ci --include=dev` installs devDependencies (vite, vinext, wrangler are needed by the build) and 29 `@img/sharp-*` entries with `"dev": true` even with `NODE_ENV=production` (an input condition from the comment on #8).
- Input for P1-07 (Skew Protection): if `NEXT_DEPLOYMENT_ID` is set at build time (project or platform env), the compatibility id equals it, there is no UUID in the bundle, and `vercel-output.mjs` fails with `expected one RSC compatibility id, found 0` (verified by a build with `NEXT_DEPLOYMENT_ID=p106probe`). The build fails closed, and there is no deploy. In P1-07, check the preview/production env; Skew Protection is a separate decision (then the script takes the id from `NEXT_DEPLOYMENT_ID`, a separate ticket). The Vercel documentation describes the system `VERCEL_DEPLOYMENT_ID` for Skew Protection; whether the platform sets `NEXT_DEPLOYMENT_ID` for a static build has not been checked.
- The final `config.json` after `vercel build` contains `framework` (`{"slug": "nextjs", …}` — the CLI detected Next.js from the dependency). According to the Build Output Configuration documentation, this field is "used for display purposes only"; it does not change the builder or routing (the `vercel build` log has no `@vercel/next` and no `Detected Next.js`).
- Production is still ChatGPT Sites; two addresses and a redirect are a founder decision (brief, section 16).

## Validation

Evidence — the section below and the PR. Commands in a fresh `git clone`: `npm ci`, `npm run validate`, `npx --yes vercel@62.7.0 build` with a local `.vercel/project.json` and no account, `node scripts/check-vercel-output.mjs` (full, `--variant no-compat`, `--variant no-rsc`) and `--url` against `npm start` (Worker) as the baseline.

Not checked (INCOMPLETE until P1-07): real Vercel routing and CDN (emulation here), header case in `has`, a build on Node 24, compression, default cache headers, `/chapters/01.html` and `/index.html` (404 on the Worker; not checked on Vercel with `overrides`), Deployment Protection on preview.

## Rollback

Nothing is deployed. Rolling back the PR is a `git revert` of the merge commit: it removes `vercel.json`, the two scripts, the line in `eslint.config.mjs`, the README paragraph and this ADR; `dist/` and Sites are not affected. After P1-07 — Instant Rollback / disconnecting the project in Vercel (a separate ADR or P1-07).

## Revisit trigger

A Vinext or `@cloudflare/vite-plugin` upgrade; a `check-vercel-output` FAIL on preview; the appearance of ISR, API routes, auth or middleware (then option B); an official Vinext adapter for Vercel.

## Sources

Checked 2026-10-22 (page update date — `last_updated` on the page):

- Build Output API — https://vercel.com/docs/build-output-api (2026-08-11): "create the `.vercel/output` directory and populate it according to this specification yourself".
- Build Output Configuration — https://vercel.com/docs/build-output-api/configuration (2026-07-27): `routes` (src, dest, headers, continue, status, has, missing), handle `filesystem`/`error`, `overrides` (`path`, `contentType`).
- vercel.json — https://vercel.com/docs/project-configuration/vercel-json (2026-08-14): `framework: null` = "Other", `installCommand`, `buildCommand`, `cleanUrls`, `trailingSlash`, `headers`, `rewrites`, env only in `dest`/`transforms.args`.
- vercel build — https://vercel.com/docs/cli/build (2026-10-07): artifacts in `.vercel/output`.
- Supported Node.js versions — https://vercel.com/docs/functions/runtimes/node-js/node-js-versions (2026-02-27): 24.x (default), 22.x; `>=22.0.0` → latest 24.x.
- Code of Vinext 1.0.0-beta.5 (`node_modules/vinext/dist`, lockfile) and Vercel CLI 62.7.0 (npm, published 2026-10-07; run via `npx`, not in `package.json`).

## Evidence

Code and configuration — SHA `3ff1245fe2d54e368f1b3310f0b1cd8c604ff260` (after review fixes; base `origin/main` `80b066e5c44a611df305db517f514bf56a8d6ed9`), a fresh `git clone` of branch `p1-06-vercel-spike` in a temporary directory, 2026-10-22. The run on `6568fe3` before review gave the same route results and no longer counts as evidence. Node 22.22.0, npm 10.9.4, Chromium 1194 (`/opt/pw-browsers`, `CHROMIUM_PATH`), Vercel CLI 62.7.0 via `npx` (not recorded in `package.json`/lockfile). No Vercel account, login, tokens or `vercel link/deploy` were used; `.vercel/project.json` is a local stub (`framework: null`, `createdAt` 2026); egress to vercel.com from the environment is closed.

| Step | Command | Result |
|---|---|---|
| Install | `NODE_ENV=production npm ci --include=dev` | PASS: 958 packages, `@img/sharp-linux-x64` and `vite` in place |
| Project | `npm run validate` | PASS: content, test, typecheck, lint, build, tree |
| Vercel build | `VERCEL_TELEMETRY_DISABLED=1 npx --yes vercel@62.7.0 build` | PASS: install `npm ci --include=dev`, build command, `vercel-output: PASS 29 pages (+404), 127 client files (3 Cloudflare-only skipped)`, `Build completed successfully`; final `config.json` — 65 routes (`error`, `filesystem`), 58 overrides |
| A2, emulation | `node scripts/check-vercel-output.mjs` (output of `vercel build`) | PASS 155/155 |
| A1 without id | `--variant no-compat` | FAIL 58/155 (expected): SPA 0/29 — "full page load", HTTP RSC without id 0/29 |
| A1 without rewrite | `--variant no-rsc` | FAIL 58/155 (expected): SPA 0/29, `?_rsc` returns HTML |
| Baseline Worker | `npm start -- --port 35675` (a free port, checked before start) + `--url http://127.0.0.1:35675` | PASS 155/155; the Worker returns the same compatibility id `11832da2-…` that the script extracted from this build |
| `--out` (finding 1) | 18 negative probes: no value, `--out=`, a space, `.`, `dist`, `..`, `/`, `node_modules/…`, `dist/…`, `.git/…`, `foo/output`, `.vercel`, `--out --foo`, `--foo`, a positional argument, `.vercel` as a symlink, a dangling symlink, a file | All exit 1 before changes; files outside `.vercel` before/after: 98568/98568, `.git`, `node_modules`, `dist` in place. Positive control `<tmp>/.vercel/output` — exit 0 |
| Inputs (finding 2) | `.assetsignore` + `*.map`, `/wrangler.json`, `!wrangler.json`, `a/b`, `dir/`, `wrangler.[jt]son`, `file?`; prerender header `x-robots-tag`; `_headers` `/:splat`, line `! Cache-Control` | All exit 1 with a reason; control without changes — exit 0 |
| `NEXT_DEPLOYMENT_ID` | `NEXT_DEPLOYMENT_ID=p106probe npm run build`, then `node scripts/vercel-output.mjs` | exit 1 `expected one RSC compatibility id, found 0` (fail closed) |
| `framework` in the output | `config.json` after `vercel build` | `{"slug":"nextjs","version":"16.3.4"}`; the log has no `@vercel/next`/`Detected Next.js` |

Routes (option A2, output of `vercel build`, local emulation). HTTP — status and type; the bytes equal the prerender files (`.html`, `.rsc`) and `content/handbook.md`; Direct/Refresh — Chromium 1440×1000, status 200, the page's `title` and `h1`; SPA — a click on a visible rail link from `/` (for `/` — from `/glossary`, for `/chapters/01` — from `/chapters/02`), with no new document load and the `window` marker preserved.

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

Other checks of the same run: 404 and the `404.html` body — `/nope`, `/chapters/99`, `/chapters`, `/_headers`, `/.vite/manifest.json`, `/wrangler.json` (6/6 PASS, as on the Worker); `/chapters/01/` → 308 `/chapters/01` (PASS); `/_next/static/*.js` — `public, max-age=31536000, immutable` (PASS); no page errors in the browser (PASS). In A2 all 29 navigations happen without loading a new document; RSC requests per navigation 1–17 (with prefetch of rail links; exactly 1 in 9 of 29), on the Worker 1–23. In the negative variants — a full document load on 29/29.

Logs, JSON and probe scripts are not committed (the temporary directory was deleted); to reproduce, use the commands above. The PR HEAD and the CI run are in the PR.

## P1-07: connecting the project (preview only)

Founder decision 2026-10-22 09:21 UTC (founder gate #9): the project lives in team `makkov-design`, preview only on every PR; production from `main` is off — neither now nor at the P1-07 merge; it is turned on by a separate founder decision after the P1-08 parity audit. Name `vibe-coding-guidebook`, address `*.vercel.app`, Framework Preset Other, default Deployment Protection; no custom domain, and ChatGPT Sites is not touched.

- The production ban lives in the code and in the project, as three independent layers:
  1. `vercel.json` `git.deploymentEnabled: {"main": false}` — a push to `main` does not create a deploy ("Specify branches that should not trigger a deployment upon commits", Git Configuration). It applies from the `main` commits where this `vercel.json` already exists, i.e. after merge.
  2. `vercel.json` `ignoreCommand` — the build continues (exit 1) only with `VERCEL_ENV=preview`; production, development and an empty value give exit 0 and the build is canceled (fail closed).
  3. The same Ignored Build Step in the project settings (`commandForIgnoringBuildStep`, set at project creation in the same request that connects the repository): it covers `main` commits before merge, where the `vercel.json` from P1-06 lacks rules 1–2 (`ignoreCommand` in `vercel.json` overrides the project setting; the command is the same).
  Deployment Policies (blocking production by source) are available only on Pro/Enterprise; the team is Hobby. `github.autoAlias: false` was not chosen: it makes post-merge deploys preview, but a deploy is still created.
- Node.js 22.x: `engines` `^22.13.0` (documentation: `^22.0.0` → "latest 22.x"; `engines` overrides Project Settings, `.nvmrc` is not mentioned). The same minimum of 22.13 as before; `npm run doctor` understands `^X.Y.Z` (major fixed). `package-lock.json` is in sync (`npm install --package-lock-only`, npm 10.9.4): only `packages[""].engines.node` changes.
- Connection status: until 2026-10-22 16:38 UTC — BLOCKED (history below); then the project was created, evidence — section "P1-07: evidence". The original blocker: `create_project` with `gitRepository` (Vercel MCP) — 400 "You need to add a Login Connection to your GitHub account first"; `git_namespaces` (github) — empty; the team still had a single project belonging to someone else. In addition, team `makkov-design` is Hobby, and the repository was private in an organization: "You cannot deploy to a Hobby team from a private repository in a GitHub organization… Consider making the repository public or upgrading to Pro" (https://vercel.com/docs/git, 2026-09-18); for a private repository a deploy proceeds only if the commit author is the owner of the Hobby team (on Pro — a team member) via Login Connections, and the agent's commits are signed `Claude <noreply@anthropic.com>`. Founder decision 2026-10-22 11:44 UTC — option A: the repository becomes public; the founder adds a GitHub Login Connection in Vercel, installs the Vercel GitHub App on `Makkov-Office` and changes the visibility, after which the agent creates the project (with the Ignored Build Step). Rejected: B — Pro (paid, and the agent's commits still fail the author check), C — GitHub Actions + Vercel CLI (a token in Secrets, a new workflow).
- Enabling production later: a separate PR (remove rules 1–2) and a change of the project setting (rule 3) — a founder decision; until then, 0 production deploys.
- Sources, checked 2026-10-22: Git Configuration — https://vercel.com/docs/project-configuration/git-configuration (2026-08-25); vercel.json `ignoreCommand` — https://vercel.com/docs/project-configuration/vercel-json (exit 1 — build, exit 0 — skip); Ignored Build Step — https://vercel.com/kb/guide/how-do-i-use-the-ignored-build-step-field-on-vercel (2026-10-16); Supported Node.js versions — https://vercel.com/docs/functions/runtimes/node-js/node-js-versions (2026-02-27); Deployment Policies — https://vercel.com/docs/deployments/deployment-policy (2026-07-14); Vercel for GitHub — https://vercel.com/docs/git/vercel-for-github (2026-09-17); commit author on Hobby — https://vercel.com/kb/guide/why-aren-t-commits-triggering-deployments-on-vercel (2026-10-16).

## P1-07: evidence

2026-10-22, after the founder's steps for option A (repository public; `git_namespaces` github — `Makkov-design` and `Makkov-Office`, `isAccessRestricted: false`).

- Project `vibe-coding-guidebook`, id `prj_1oIAEY587WXA2lJKQHmoZXH1go9r`, team `makkov-design` (Hobby): created by a single `create_project` (Vercel MCP) with `gitRepository`, `framework: null`, install/build command and `commandForIgnoringBuildStep`; then `nodeVersion` 22.x. Default Deployment Protection: Vercel Authentication, `all_except_custom_domains`. The platform added the domain `vibe-coding-guidebook-ivory.vercel.app`; there is no ready deploy behind it. The value of `commandForIgnoringBuildStep` is not returned in the `get_project` response (Vercel MCP), so layer 3 is not independently confirmed.
- The first git build of the new project (push `96df653` to `p1-07-vercel-integration`, `dpl_Hsme8ifuiND52vDk49zjfE7Tz7zj`) arrived with `target: production`, although production Branch Tracking is `main` (a settings screenshot from the founder; the founder changed nothing). The Ignored Build Step canceled it: "The deployment was canceled because the Ignored Build Step command returned exit code 0"; state CANCELED. The deploy's `alias` field had `vibe-coding-guidebook-makkov-design.vercel.app` and a branch alias planned; neither was assigned to this deploy (`list_aliases`: only the branch alias, and it points to a preview). The cause of `target: production` was not established, and the observation happened once: the following git pushes to the branch (`c06ab38` → `dpl_2Qe1bDSyYTP59vUQkhUv4AfgghW1` and onward) arrived with `target` preview. The build was canceled by the `ignoreCommand` from this commit's `vercel.json` (layer 2; it overrides the project setting). The GitHub commit status `Vercel` of the canceled deploy is also success, so the evidence is the deploy state (READY/CANCELED), not this status.
- Preview `dpl_143C63MSLKrQ7o5p1usv6TynhkAp` (`create_deployment` without `target`, ref `p1-07-vercel-integration`, SHA `96df653`): `target` preview, READY in 54 s. Log: the Ignored Build Step let it through (preview), `npm ci --include=dev` (958 packages), "Prerendered 30 routes", publication audit PASS, `vercel-output: PASS 29 pages (+404), 127 client files (3 Cloudflare-only skipped)`, no `@vercel/next` in the log.
- Routes, HTTP GET via Vercel MCP `web_fetch_vercel_url` (bypassing Deployment Protection): 29 pages — 200 `text/html`, `title` and `h1` equal to the prerender of the same revision (the HTML bytes differ from the local build — a different build, other hashes and compatibility id); `/handbook.md` — 200 `text/markdown; charset=utf-8`, byte-for-byte `content/handbook.md`; `/nope`, `/wrangler.json` — 404, the 404 page. In total 30/30 routes PASS over HTTP.
- Production: 0 READY production deploys (`list_deployments target=production` — one CANCELED entry, above); the project's `list_aliases` — only the branch alias on a preview.
- Not checked (INCOMPLETE): `node scripts/check-vercel-output.mjs --url <preview>` — the environment's egress proxy answers 403 to CONNECT to `*.vercel.app`, so there are no browser direct/refresh/SPA checks, RSC responses (`RSC: 1`), 308 or immutable cache on the real CDN — left for P1-08 (or a run from the founder's machine). The actual Node version on Vercel is not printed in the log (settings: `nodeVersion` 22.x, `engines` `^22.13.0`). `git.deploymentEnabled.main` on the platform — after merge.

## P1-08: check on a real preview

2026-10-22, preview `dpl_DWbnTrFD1AgNrNrMtGPbuidg3KPG` (SHA `e36fb13`, target preview), access via a Vercel MCP share link (cookie `_vercel_jwt` in `CHECK_COOKIE`; Deployment Protection was not changed). Closes the INCOMPLETE items from "P1-07: evidence":

- `node scripts/check-vercel-output.mjs --url <preview>` — PASS 155/155 on the real Vercel CDN: HTTP HTML and RSC (`RSC: 1` → `text/x-component` with the compatibility id), direct, refresh and SPA navigation without a document load on 29/29 pages, `/handbook.md`, 404 (6/6), `/chapters/01/` → 308 `/chapters/01`, `/_next/static/*` — `immutable`, no page errors.
- Parity with ChatGPT Sites (version 20) — `docs/audits/parity-2026-10-22.md`: content and anchors on 29/29 pages, screenshots 60/60 equal within tolerance; the differences are the expected ones from P1-12 plus HTTP headers; the 404 page falls into an error screen on both sites (B1, founder decision).
- On preview, Vercel adds `X-Robots-Tag: noindex`; check production separately when it is enabled.

## P1-16: enabling production

Founder decision 2026-10-23 11:57 UTC: "turn on production" — after the P1-08 parity audit and the fix of the 404 page (P1-15, audit item B1). All three ban layers from section "P1-07" are removed:

1. `vercel.json`: `git.deploymentEnabled: {"main": false}` removed — a push to `main` creates a deploy again; for the Branch Tracking branch (`main`) it is production.
2. `vercel.json`: `ignoreCommand` removed — the build is not canceled for any `VERCEL_ENV`.
3. Project setting: `commandForIgnoringBuildStep` set to `null` (Vercel MCP `update_project`, 2026-10-23, before merge — otherwise after merge it would cancel the production build, because `vercel.json` no longer overrides it).

Unchanged: preview on every PR and Deployment Protection (Vercel Authentication, `all_except_custom_domains`), framework, install/build command, Node from `engines`. No custom domain is attached; ChatGPT Sites and `.openai/hosting.json` are not touched, both addresses run in parallel, and a redirect is a founder decision (brief, section 16). Rollback: restore rules 1–2 in `vercel.json` (a separate PR) and, if needed, Instant Rollback in Vercel — by founder decision.

Post-merge check (evidence in PR P1-16): a production deploy READY on the merge commit SHA, `target: production`, the project domain `vibe-coding-guidebook-ivory.vercel.app` points to it; 29 pages, `/handbook.md` and 404 as on preview; `X-Robots-Tag` on production; access without signing in to Vercel.
