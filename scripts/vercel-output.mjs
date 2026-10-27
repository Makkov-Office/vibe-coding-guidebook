// Vercel static export (P1-06, ADR-0002): turns the existing build into a
// Build Output API v3 directory. Run after `npm run build`:
//   node scripts/vercel-output.mjs [--out <dir>/.vercel/output]
//   (default .vercel/output; any other shape of --out is refused, since the
//   directory is deleted and rewritten)
//
// Input, all produced by `npm run build` and not changed here:
//   dist/client                      public assets (/_next/static, fonts, ...)
//   dist/server/prerendered-routes   HTML + RSC payload of every route
//   dist/server/vinext-prerender.json  route list, params pattern, headers
//   dist/client/_headers             Cloudflare header rules (translated)
//
// Output: <out>/static (files) and <out>/config.json (routes, overrides).
// The Cloudflare/Sites build in dist/ stays as it is; nothing is deployed.
//
// Why config.json and not only vercel.json: on a client-side transition the
// Vinext router fetches `<path>?_rsc` with `RSC: 1` and accepts the answer
// only with `Content-Type: text/x-component` and the build's own
// `X-Vinext-RSC-Compatibility-Id`. That id is a random UUID per build, so a
// static vercel.json cannot carry it; this script writes it per build.
// Fails closed (exit 1) on anything it does not recognise.
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { livePaths, loadUrlMap, mappedPaths, redirectRoutes, staleAnchors } from "./url-map.mjs";

function fail(message) {
  console.error(`vercel-output: FAIL ${message}`);
  process.exit(1);
}

const root = process.cwd();
let parsed;
try {
  parsed = parseArgs({ options: { out: { type: "string" } }, strict: true, allowPositionals: false });
} catch (error) {
  fail(`arguments: ${error.message}`);
}
// <out> is deleted and rewritten, so it must be a directory named `output`
// inside a directory named `.vercel` (the Build Output API location), must
// not contain the project, and must not lie inside dist, node_modules or .git.
const outValue = parsed.values.out ?? ".vercel/output";
if (outValue.trim() === "") fail("--out is empty");
const out = path.resolve(root, outValue);
const inside = (child, parent) => {
  const relative = path.relative(parent, child);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
};
if (path.basename(out) !== "output" || path.basename(path.dirname(out)) !== ".vercel") fail(`--out ${outValue}: must be <dir>/.vercel/output`);
if (inside(root, out)) fail(`--out ${outValue}: contains the project`);
for (const protectedDir of ["dist", "node_modules", ".git"]) {
  if (inside(out, path.join(root, protectedDir))) fail(`--out ${outValue}: inside ${protectedDir}`);
}
for (const candidate of [path.dirname(out), out]) {
  let stat = null;
  try {
    stat = fs.lstatSync(candidate);
  } catch {
    // Missing is fine: it is created below.
  }
  // lstat, not exists: a dangling symlink must fail too.
  if (stat?.isSymbolicLink()) fail(`--out ${outValue}: ${candidate} is a symlink`);
  if (stat && !stat.isDirectory()) fail(`--out ${outValue}: ${candidate} is not a directory`);
}
const clientDir = path.join(root, "dist/client");
const serverDir = path.join(root, "dist/server");
const prerenderDir = path.join(serverDir, "prerendered-routes");
const staticDir = path.join(out, "static");

// Files that Cloudflare does not serve: dist/client/.assetsignore lists them;
// _headers and .assetsignore themselves are Cloudflare configuration.
const CLOUDFLARE_CONFIG = new Set(["_headers", ".assetsignore"]);
// Same Vary as the Vinext server sends for HTML and RSC responses.
const VARY = "RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch, Next-Url, X-Vinext-Interception-Context, X-Vinext-Mounted-Slots, X-Vinext-Rsc-Render-Mode";
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g;

function walk(directory, base = directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(file, base));
    else if (entry.isFile()) files.push(path.relative(base, file).split(path.sep).join("/"));
    else fail(`unexpected entry ${file}`);
  }
  return files;
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

for (const required of [clientDir, prerenderDir, path.join(serverDir, "vinext-prerender.json"), path.join(clientDir, "_headers")]) {
  if (!fs.existsSync(required)) fail(`${path.relative(root, required)} is missing: run npm run build first`);
}

// 1. RSC compatibility id: the one UUID literal that both the client bundle
//    and the server bundle contain, next to the header name, and that is not
//    the BUILD_ID. Anything else than exactly one candidate is a FAIL.
function uuidsIn(directory, mustMention) {
  const found = new Set();
  for (const file of walk(directory)) {
    if (!file.endsWith(".js")) continue;
    const text = fs.readFileSync(path.join(directory, file), "utf8");
    if (mustMention && !text.includes(mustMention)) continue;
    for (const match of text.matchAll(UUID)) found.add(match[0]);
  }
  return found;
}
const buildId = fs.readFileSync(path.join(serverDir, "BUILD_ID"), "utf8").trim();
const clientIds = uuidsIn(path.join(clientDir, "_next"), "X-Vinext-RSC-Compatibility-Id");
const serverIds = uuidsIn(serverDir, null);
const candidates = [...clientIds].filter((id) => serverIds.has(id) && id !== buildId);
if (candidates.length !== 1) fail(`expected one RSC compatibility id, found ${candidates.length} (${candidates.join(", ")})`);
const compatibilityId = candidates[0];

// 2. Routes from the prerender manifest. Every page must have .html and .rsc.
const manifest = JSON.parse(fs.readFileSync(path.join(serverDir, "vinext-prerender.json"), "utf8"));
if (manifest.trailingSlash !== false) fail(`trailingSlash ${manifest.trailingSlash} is not supported`);
const pages = [];
let notFound = false;
for (const route of manifest.routes) {
  if (route.status !== "rendered" || route.router !== "app") fail(`route ${route.route}: status ${route.status}, router ${route.router}`);
  if (route.revalidate !== false) fail(`route ${route.route}: revalidate ${route.revalidate} needs a server`);
  if (route.route === "/404") { notFound = true; continue; }
  const urlPath = route.path ?? route.route;
  if (urlPath.includes(":")) fail(`route ${route.route} has no concrete path`);
  const file = urlPath === "/" ? "index" : urlPath.slice(1);
  for (const extension of [".html", ".rsc"]) {
    if (!fs.existsSync(path.join(prerenderDir, file + extension))) fail(`${file}${extension} is missing for ${urlPath}`);
  }
  // Params of a dynamic segment, as the server sends them in X-Vinext-Params.
  const params = {};
  const patternSegments = route.route.split("/");
  const pathSegments = urlPath.split("/");
  if (patternSegments.length !== pathSegments.length) fail(`route ${route.route}: path ${urlPath} does not match`);
  patternSegments.forEach((segment, index) => {
    if (segment.startsWith(":")) params[segment.slice(1)] = pathSegments[index];
    else if (segment !== pathSegments[index]) fail(`route ${route.route}: path ${urlPath} does not match`);
  });
  // Only `link` (preload hints) is known; any other prerender header is a FAIL.
  const routeHeaders = route.headers ?? {};
  for (const key of Object.keys(routeHeaders)) {
    if (key.toLowerCase() !== "link") fail(`route ${urlPath}: prerender header ${key} is not supported`);
  }
  pages.push({ urlPath, file, params, link: routeHeaders.link ?? null });
}
if (!notFound || !fs.existsSync(path.join(prerenderDir, "404.html"))) fail("404.html is missing");
const prerenderFiles = walk(prerenderDir);
const expectedFiles = new Set(["404.html", ...pages.flatMap((page) => [`${page.file}.html`, `${page.file}.rsc`])]);
for (const file of prerenderFiles) if (!expectedFiles.has(file)) fail(`unexpected prerendered file ${file}`);

// 2b. URL map (P2-05): every built page must be in src/content/url-map.json
//     (fail closed); an old address gets a 308 only once its new page is in
//     this build, so the map switches on page by page as the structure moves.
const urlMap = loadUrlMap(root);
const mapped = mappedPaths(urlMap);
const builtPaths = new Set(pages.map((page) => page.urlPath));
for (const page of pages) if (!mapped.has(page.urlPath)) fail(`page ${page.urlPath} is not in src/content/url-map.json`);
const legacyRedirects = redirectRoutes(urlMap, builtPaths);
const stale = staleAnchors(urlMap, JSON.parse(fs.readFileSync(path.join(root, "src/content/generated.json"), "utf8")), builtPaths);
if (stale.length > 0) fail(`anchor registry points to ${stale.length} redirected old addresses (first: ${stale[0]}); build it from resolveAnchors`);
// A `live` page has its anchors registered at its new address (a chapter with tabs: at the tab addresses): every one of them must be built.
for (const entry of urlMap.pages.filter((item) => item.live)) for (const address of livePaths(urlMap, entry)) if (!builtPaths.has(address)) fail(`${entry.old} is live, but ${address} is not built`);

// 3. Cloudflare _headers → routes. Only the plain form is supported:
//    an unindented URL pattern (optional trailing *) and indented headers.
const headerRoutes = [];
let current = null;
for (const line of fs.readFileSync(path.join(clientDir, "_headers"), "utf8").split(/\r?\n/)) {
  if (!line.trim() || line.trim().startsWith("#")) continue;
  if (!/^\s/.test(line)) {
    const pattern = line.trim();
    if (!/^\/[^\s:!*]*\*?$/.test(pattern)) fail(`_headers pattern ${pattern} is not supported`);
    const src = pattern.endsWith("*") ? `^${escapeRegex(pattern.slice(0, -1))}.*$` : `^${escapeRegex(pattern)}$`;
    current = { src, headers: {}, continue: true };
    headerRoutes.push(current);
  } else {
    const header = line.trim().match(/^([A-Za-z0-9-]+):\s*(.+)$/);
    if (!current || !header || header[1].startsWith("!")) fail(`_headers line ${line.trim()} is not supported`);
    current.headers[header[1]] = header[2];
  }
}
if (headerRoutes.length === 0) fail("_headers has no rules");

// 4. Static files: dist/client minus Cloudflare-only files, plus the
//    prerendered HTML and RSC. A name clash between the two is a FAIL.
//    .assetsignore uses gitignore syntax; only plain names are supported: a
//    name without `/` matches that file or directory at any depth (as in
//    gitignore). Globs, negation, anchors and paths are a FAIL.
const ignored = fs.readFileSync(path.join(clientDir, ".assetsignore"), "utf8").split(/\r?\n/).map((entry) => entry.trim()).filter((entry) => entry && !entry.startsWith("#"));
for (const entry of ignored) {
  if (/[*?[\]!\\/]/.test(entry)) fail(`.assetsignore entry ${entry} is not supported`);
}
const isIgnored = (file) => CLOUDFLARE_CONFIG.has(file) || file.split("/").some((segment) => ignored.includes(segment));
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(staticDir, { recursive: true });
const copied = new Set();
let skipped = 0;
for (const file of walk(clientDir)) {
  if (isIgnored(file)) { skipped++; continue; }
  fs.cpSync(path.join(clientDir, file), path.join(staticDir, file));
  copied.add(file);
}
for (const file of prerenderFiles) {
  if (copied.has(file)) fail(`${file} exists in dist/client and in prerendered-routes`);
  fs.cpSync(path.join(prerenderDir, file), path.join(staticDir, file));
}

// 5. config.json. Phase before filesystem: trailing-slash redirect, headers
//    (continue), RSC rewrite for requests with `RSC: 1`. Then filesystem,
//    then every miss is the prerendered 404 page with status 404.
//    `vercel build` keeps these routes but moves the redirect after the
//    `continue` routes and adds its own `handle: error` → 404.html section.
const overrides = {};
for (const page of pages) {
  // HTML is served without the extension, like the Vinext server: /chapters/01.
  if (page.file !== "index") overrides[`${page.file}.html`] = { path: page.file };
  overrides[`${page.file}.rsc`] = { contentType: "text/x-component" };
}
if (fs.existsSync(path.join(staticDir, "handbook.md"))) overrides["handbook.md"] = { contentType: "text/markdown; charset=utf-8" };

const rsc = [{ type: "header", key: "rsc", value: "1" }];
const routes = [
  // Old address → new page, 308, before everything else (one hop, also for
  // the trailing-slash form).
  ...legacyRedirects,
  // /chapters/01/ → 308 /chapters/01, as with trailingSlash: false in Vinext.
  { src: "^/(.*[^/])/+$", status: 308, headers: { Location: "/$1" } },
  ...headerRoutes,
  // Direct /chapters/01.rsc gets the same identity headers as ?_rsc requests.
  { src: "^/.*\\.rsc$", headers: { Vary: VARY, "X-Vinext-RSC-Compatibility-Id": compatibilityId }, continue: true },
];
for (const page of pages) {
  const src = `^${escapeRegex(page.urlPath)}$`;
  routes.push({ src, missing: rsc, headers: { Vary: VARY, ...(page.link ? { Link: page.link } : {}) }, continue: true });
}
for (const page of pages) {
  const headers = { Vary: VARY, "X-Vinext-RSC-Compatibility-Id": compatibilityId };
  if (Object.keys(page.params).length > 0) headers["X-Vinext-Params"] = encodeURIComponent(JSON.stringify(page.params));
  routes.push({ src: `^${escapeRegex(page.urlPath)}$`, has: rsc, dest: `/${page.file}.rsc`, headers });
}
routes.push({ handle: "filesystem" }, { src: "^/.*$", dest: "/404.html", status: 404 });

fs.writeFileSync(path.join(out, "config.json"), `${JSON.stringify({ version: 3, routes, overrides }, null, 2)}\n`);
console.log(`vercel-output: PASS ${pages.length} pages (+404), ${legacyRedirects.length} legacy redirects, ${copied.size} client files (${skipped} Cloudflare-only skipped), RSC compatibility id ${compatibilityId} → ${path.relative(root, out)}`);
