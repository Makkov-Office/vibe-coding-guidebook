// Local check of the Vercel static export (P1-06, ADR-0002). No Vercel account,
// no deploy: serves a Build Output API directory with a small emulation of
// Vercel routing and checks every route in Chromium.
//   node scripts/vercel-output.mjs
//   CHROMIUM_PATH=/path/to/chrome node scripts/check-vercel-output.mjs [options]
// Options:
//   --out <dir>        Build Output directory (default .vercel/output)
//   --url <origin>     check a running site instead (P1-07/P1-08 preview);
//                      (no byte comparison with the local build then)
//   --variant <name>   negative controls for the ADR, local only:
//                      no-compat  drop X-Vinext-RSC-Compatibility-Id
//                      no-rsc     no RSC rewrite (plain static site)
//   --json <file>      also write the results as JSON
// Protected preview (Vercel Authentication, P1-08): CHECK_COOKIE="name=value"
// from a share link is sent with every request and set in the browser; never printed.
// Browser: CHROMIUM_PATH (executable) or HANDBOOK_BROWSER_CHANNEL, else the
// Chromium that @playwright/test installs. Exit 1 on any FAIL.
//
// The emulation covers what config.json uses: source routes (src, has,
// missing, headers, dest, status, continue), handle: filesystem, overrides
// (path, contentType) and the directory index. It is not Vercel itself; the
// same checks with --url against a real preview close that gap (P1-07).
import { createHash } from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { parseArgs } from "node:util";
import { chromium } from "@playwright/test";

// Strict: an unknown option or an option without its value is an error.
const { values } = parseArgs({
  options: { out: { type: "string" }, url: { type: "string" }, variant: { type: "string" }, json: { type: "string" } },
  strict: true,
  allowPositionals: false,
});
for (const [name, value] of Object.entries(values)) if (value.trim() === "") throw new Error(`--${name} is empty`);
const root = process.cwd();
const outDir = path.resolve(root, values.out ?? ".vercel/output");
const remote = values.url ?? null;
const variant = values.variant ?? "full";
const jsonFile = values.json ?? null;
if (!["full", "no-compat", "no-rsc"].includes(variant)) throw new Error(`unknown variant ${variant}`);
if (remote && variant !== "full") throw new Error("--variant works only locally");
const cookie = process.env.CHECK_COOKIE || null;
const cookieParts = cookie?.match(/^([^=;\s]+)=([^;\s]+)$/);
if (cookie && (!remote || !cookieParts)) throw new Error("CHECK_COOKIE needs --url and the form name=value");

const sha = (buffer) => createHash("sha256").update(buffer).digest("hex");
const prerenderDir = path.join(root, "dist/server/prerendered-routes");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "dist/server/vinext-prerender.json"), "utf8"));
const pages = manifest.routes.filter((route) => route.route !== "/404").map((route) => {
  const urlPath = route.path ?? route.route;
  const file = urlPath === "/" ? "index" : urlPath.slice(1);
  const html = fs.readFileSync(path.join(prerenderDir, `${file}.html`));
  const title = html.toString("utf8").match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
  const h1 = html.toString("utf8").match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1].replace(/<[^>]+>/g, "").trim() ?? "";
  return { urlPath, file, html: sha(html), rsc: sha(fs.readFileSync(path.join(prerenderDir, `${file}.rsc`))), title, h1 };
});

// ---------- Build Output API emulation ----------
const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".avif": "image/avif",
  ".woff2": "font/woff2", ".woff": "font/woff", ".txt": "text/plain; charset=utf-8", ".ico": "image/x-icon",
};

function startEmulator() {
  const config = JSON.parse(fs.readFileSync(path.join(outDir, "config.json"), "utf8"));
  const staticDir = path.join(outDir, "static");
  const overrides = config.overrides ?? {};
  const byUrl = new Map();
  const hidden = new Set();
  for (const [file, override] of Object.entries(overrides)) {
    if (override.path !== undefined) { byUrl.set(`/${override.path}`, file); hidden.add(file); }
  }
  let routes = config.routes;
  if (variant === "no-rsc") routes = routes.filter((route) => !route.dest?.endsWith(".rsc"));
  if (variant === "no-compat") {
    routes = routes.map((route) => {
      if (!route.headers) return route;
      const headers = { ...route.headers };
      delete headers["X-Vinext-RSC-Compatibility-Id"];
      return { ...route, headers };
    });
  }
  // Phases: routes before the first `handle`, then the sections that start
  // with `handle: filesystem` (checked after a filesystem miss) and
  // `handle: error` (checked when the result is 404). `vercel build` adds the
  // error section itself, so its position in the array varies.
  // Keys the emulation implements; any other route key (check, methods,
  // transforms, locale, middlewarePath, ...) fails instead of being ignored.
  const SOURCE_KEYS = new Set(["src", "dest", "headers", "status", "continue", "caseSensitive", "has", "missing"]);
  const HANDLER_KEYS = new Set(["handle"]);
  const sections = { main: [] };
  let section = "main";
  for (const route of routes) {
    const known = route.handle ? HANDLER_KEYS : SOURCE_KEYS;
    for (const key of Object.keys(route)) if (!known.has(key)) throw new Error(`route key ${key} is not emulated: ${JSON.stringify(route)}`);
    if (route.handle) {
      if (!["filesystem", "error"].includes(route.handle)) throw new Error(`handle ${route.handle} is not emulated`);
      section = route.handle;
      sections[section] ??= [];
    } else sections[section].push(route);
  }
  const before = sections.main;
  const afterMiss = [...(sections.filesystem ?? [])];
  const onError = [...(sections.error ?? [])];

  const conditions = (route, request, url) => {
    const test = (list, wanted) => (list ?? []).every((condition) => {
      let actual;
      if (condition.type === "header") actual = request.headers[condition.key.toLowerCase()];
      else if (condition.type === "query") actual = url.searchParams.get(condition.key) ?? undefined;
      else throw new Error(`condition ${condition.type} is not emulated`);
      // A string value is regex-like on Vercel; matched here as a full regex.
      if (condition.value !== undefined && typeof condition.value !== "string") throw new Error(`MatchableValue ${JSON.stringify(condition.value)} is not emulated`);
      const matches = actual !== undefined && (condition.value === undefined || new RegExp(`^(?:${condition.value})$`).test(actual));
      return matches === wanted;
    });
    return test(route.has, true) && test(route.missing, false);
  };
  const substitute = (template, match) => template.replace(/\$(\d+)/g, (_, index) => match[Number(index)] ?? "");
  const lookup = (pathname) => {
    if (byUrl.has(pathname)) return byUrl.get(pathname);
    const relative = pathname === "/" ? "index.html" : decodeURIComponent(pathname.slice(1));
    if (relative.includes("..") || hidden.has(relative)) return null;
    const file = path.join(staticDir, relative);
    if (fs.existsSync(file) && fs.statSync(file).isFile()) return relative;
    const index = path.join(relative, "index.html");
    return fs.existsSync(path.join(staticDir, index)) ? index : null;
  };

  const server = http.createServer((request, response) => {
    const url = new URL(request.url, "http://localhost");
    let pathname = url.pathname;
    const headers = {};
    let status = 200;
    for (const route of before) {
      const match = new RegExp(route.src, route.caseSensitive ? "" : "i").exec(pathname);
      if (!match || !conditions(route, request, url)) continue;
      for (const [key, value] of Object.entries(route.headers ?? {})) headers[key] = substitute(value, match);
      if (route.status) status = route.status;
      if (route.status && !route.dest && headers.Location) {
        response.writeHead(status, headers).end();
        return;
      }
      if (route.dest) pathname = substitute(route.dest, match);
      if (!route.continue) break;
    }
    let file = lookup(pathname);
    for (const list of file ? [] : [afterMiss, onError]) {
      for (const route of list) {
        const match = new RegExp(route.src, "i").exec(pathname);
        if (!match || !conditions(route, request, url)) continue;
        file = route.dest ? lookup(substitute(route.dest, match)) : null;
        status = route.status ?? status;
        break;
      }
      if (file) break;
    }
    if (!file) {
      response.writeHead(404, { "Content-Type": "text/plain" }).end("404 (emulator: no file)");
      return;
    }
    const body = fs.readFileSync(path.join(staticDir, file));
    headers["Content-Type"] = overrides[file]?.contentType ?? MIME[path.extname(file)] ?? "application/octet-stream";
    headers["Content-Length"] = body.length;
    response.writeHead(status, headers).end(request.method === "HEAD" ? undefined : body);
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

// ---------- checks ----------
const results = [];
const record = (route, check, ok, detail = "") => {
  results.push({ route, check, result: ok === null ? "SKIP" : ok ? "PASS" : "FAIL", detail });
};

let server = null;
let origin = remote;
if (!remote) {
  server = await startEmulator();
  origin = `http://127.0.0.1:${server.address().port}`;
}
const local = !remote;
const compatibilityId = local
  ? JSON.parse(fs.readFileSync(path.join(outDir, "config.json"), "utf8")).routes.find((route) => route.headers?.["X-Vinext-RSC-Compatibility-Id"])?.headers["X-Vinext-RSC-Compatibility-Id"]
  : null;

async function get(pathname, headers = {}) {
  const response = await fetch(origin + pathname, { headers: cookie ? { ...headers, Cookie: cookie } : headers, redirect: "manual" });
  return { response, body: Buffer.from(await response.arrayBuffer()) };
}

// HTTP: HTML and RSC payload of every page, byte-exact against the build.
for (const page of pages) {
  const { response, body } = await get(page.urlPath);
  record(page.urlPath, "http-html", response.status === 200 && response.headers.get("content-type")?.startsWith("text/html") && (!local || sha(body) === page.html),
    `${response.status} ${response.headers.get("content-type")}${local ? ` sha ${sha(body) === page.html ? "=" : "≠"} prerendered` : ""}`);
  const rsc = await get(`${page.urlPath}?_rsc`, { RSC: "1", Accept: "text/x-component" });
  const id = rsc.response.headers.get("x-vinext-rsc-compatibility-id");
  record(page.urlPath, "http-rsc", rsc.response.status === 200 && rsc.response.headers.get("content-type")?.startsWith("text/x-component") && Boolean(id) && (!local || (id === compatibilityId && sha(rsc.body) === page.rsc)),
    `${rsc.response.status} ${rsc.response.headers.get("content-type")} id=${id ?? "none"}${local ? ` sha ${sha(rsc.body) === page.rsc ? "=" : "≠"} .rsc` : ""}`);
}
{
  const { response, body } = await get("/handbook.md");
  const source = fs.readFileSync(path.join(root, "content/handbook.md"));
  record("/handbook.md", "http-file", response.status === 200 && response.headers.get("content-type")?.startsWith("text/markdown") && (!local || body.equals(source)),
    `${response.status} ${response.headers.get("content-type")}${local ? ` ${body.equals(source) ? "=" : "≠"} content/handbook.md` : ""}`);
  const notFoundHtml = fs.readFileSync(path.join(prerenderDir, "404.html"));
  for (const missing of ["/nope", "/chapters/99", "/chapters", "/_headers", "/.vite/manifest.json", "/wrangler.json"]) {
    const result = await get(missing);
    record(missing, "http-404", result.response.status === 404 && (!local || result.body.equals(notFoundHtml)), `${result.response.status}${local ? ` ${result.body.equals(notFoundHtml) ? "=" : "≠"} 404.html` : ""}`);
  }
  const slash = await get("/chapters/01/");
  record("/chapters/01/", "http-308", slash.response.status === 308 && slash.response.headers.get("location") === "/chapters/01", `${slash.response.status} → ${slash.response.headers.get("location")}`);
  const html = (await get("/")).body.toString("utf8");
  const asset = html.match(/\/_next\/static\/[^"]+\.js/)?.[0];
  const assetResponse = asset ? (await get(asset)).response : null;
  record(asset ?? "/_next/static/*", "http-immutable", assetResponse?.status === 200 && assetResponse.headers.get("cache-control") === "public, max-age=31536000, immutable", `${assetResponse?.status} ${assetResponse?.headers.get("cache-control")}`);
}

// Browser: direct visit, reload and client-side transition for every page.
const executablePath = process.env.CHROMIUM_PATH || undefined;
const channel = executablePath ? undefined : process.env.HANDBOOK_BROWSER_CHANNEL || undefined;
const browser = await chromium.launch({ executablePath, channel, headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
if (cookieParts) await context.addCookies([{ name: cookieParts[1], value: cookieParts[2], url: origin }]);
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
let documents = 0;
page.on("request", (request) => { if (request.isNavigationRequest() && request.frame() === page.mainFrame()) documents++; });
const settle = async () => { await page.waitForLoadState("load"); await page.waitForTimeout(300); };
const state = async () => page.evaluate(() => ({ title: document.title, h1: document.querySelector("h1")?.textContent?.trim() ?? "", path: location.pathname }));

for (const target of pages) {
  const direct = await page.goto(origin + target.urlPath);
  await settle();
  let now = await state();
  record(target.urlPath, "direct", direct?.status() === 200 && now.title === target.title && now.h1 === target.h1, `${direct?.status()} "${now.h1.slice(0, 40)}"`);
  const reload = await page.reload();
  await settle();
  now = await state();
  record(target.urlPath, "refresh", reload?.status() === 200 && now.title === target.title && now.h1 === target.h1, `${reload?.status()} "${now.h1.slice(0, 40)}"`);
}

for (const target of pages) {
  // Start from a page that links to the target; the rail links every page.
  const start = target.urlPath === "/" ? "/glossary" : target.urlPath === "/chapters/01" ? "/chapters/02" : "/";
  await page.goto(origin + start);
  await settle();
  const link = page.locator(`a[href="${target.urlPath}"]`).filter({ visible: true }).first();
  if (await link.count() === 0) { record(target.urlPath, "spa", false, `no visible link on ${start}`); continue; }
  await page.evaluate(() => { window.__spaMarker = "kept"; });
  const before = documents;
  const rscRequests = [];
  const onRequest = (request) => { if (request.headers()["rsc"] === "1") rscRequests.push(request.url()); };
  page.on("request", onRequest);
  await link.click();
  await page.waitForURL((url) => url.pathname === target.urlPath, { timeout: 15000 }).catch(() => {});
  await page.waitForFunction((title) => document.title === title, target.title, { timeout: 15000 }).catch(() => {});
  await settle();
  page.off("request", onRequest);
  const now = await state();
  const marker = await page.evaluate(() => window.__spaMarker ?? null);
  const soft = marker === "kept" && documents === before;
  record(target.urlPath, "spa", soft && now.path === target.urlPath && now.title === target.title && now.h1 === target.h1,
    `${start} → ${now.path}: ${soft ? "client transition" : "full page load"}, rsc requests ${rscRequests.length}, "${now.h1.slice(0, 30)}"`);
}
record("(all pages)", "page-errors", errors.length === 0, errors.slice(0, 3).join(" | "));
await browser.close();
server?.close();

// ---------- report ----------
const routesInTable = [...pages.map((page) => page.urlPath), "/handbook.md"];
const cell = (route, check) => results.find((entry) => entry.route === route && entry.check === check)?.result ?? "—";
console.log(`\nVercel output check: variant ${variant}, ${remote ? `remote ${remote}` : `local emulation of ${path.relative(root, outDir)}`}\n`);
console.log("| # | Route | HTTP HTML/file | HTTP RSC | Direct | Refresh | SPA |");
console.log("|---|---|---|---|---|---|---|");
routesInTable.forEach((route, index) => {
  const file = route === "/handbook.md";
  console.log(`| ${index + 1} | \`${route}\` | ${cell(route, file ? "http-file" : "http-html")} | ${file ? "n/a" : cell(route, "http-rsc")} | ${file ? "n/a" : cell(route, "direct")} | ${file ? "n/a" : cell(route, "refresh")} | ${file ? "n/a" : cell(route, "spa")} |`);
});
console.log("\nOther checks:");
for (const entry of results.filter((item) => !routesInTable.includes(item.route) || ["page-errors"].includes(item.check))) {
  console.log(`- ${entry.result} ${entry.check} ${entry.route} ${entry.detail}`);
}
const failed = results.filter((entry) => entry.result === "FAIL");
for (const entry of failed) console.log(`FAIL ${entry.check} ${entry.route}: ${entry.detail}`);
const summary = { variant, origin: remote ?? "local-emulation", checks: results.length, pass: results.filter((entry) => entry.result === "PASS").length, fail: failed.length, skip: results.filter((entry) => entry.result === "SKIP").length };
console.log(`\ncheck-vercel-output: ${failed.length === 0 ? "PASS" : "FAIL"} ${JSON.stringify(summary)}`);
if (jsonFile) fs.writeFileSync(jsonFile, `${JSON.stringify({ summary, results }, null, 2)}\n`);
process.exit(failed.length === 0 ? 0 : 1);
