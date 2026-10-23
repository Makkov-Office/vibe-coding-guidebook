// Parity audit (P1-08): the same routes and behaviours on two origins, the
// reference (ChatGPT Sites, version 20) and the candidate (Vercel preview).
// Read-only: GET requests and a headless browser; nothing is changed on either site.
//   CHROMIUM_PATH=/path/to/chrome CHECK_COOKIE=name=value \
//     node scripts/parity-audit.mjs --old <origin> --new <origin> --out <dir>
// CHECK_COOKIE (optional) is sent only to --new (Vercel Authentication share
// link); never printed. Writes <out>/parity.json, first-screen WebP of both
// sites (<out>/shots/<width>/<slug>.<old|new>.webp) and, where the full pages
// differ, <out>/diff/<width>/<slug>.webp (new page, differing pixels red) and
// crops of the differing area from both sites (<slug>.crop.<old|new>.webp).
// Routes come from the local build (dist/server/vinext-prerender.json): run
// `npm run build` on the audited revision first. Exit 1 if a check could not run.
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { chromium } from "@playwright/test";
import sharp from "sharp";

const { values } = parseArgs({
  options: { old: { type: "string" }, new: { type: "string" }, out: { type: "string" }, routes: { type: "string" } },
  strict: true,
  allowPositionals: false,
});
for (const name of ["old", "new", "out"]) if (!values[name]?.trim()) throw new Error(`--${name} is required`);
const origins = { old: values.old.replace(/\/$/, ""), new: values.new.replace(/\/$/, "") };
const outDir = path.resolve(values.out);
const cookie = process.env.CHECK_COOKIE || null;
const cookieParts = cookie?.match(/^([^=;\s]+)=([^;\s]+)$/);
if (cookie && !cookieParts) throw new Error("CHECK_COOKIE needs the form name=value");

const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync(path.join(root, "dist/server/vinext-prerender.json"), "utf8"));
const pages = manifest.routes.filter((route) => route.route !== "/404").map((route) => route.path ?? route.route);
// --routes /a,/b limits the page pass (re-checking a difference); behaviours always run.
const routes = values.routes ? values.routes.split(",") : [...pages, "/nope"];
const widths = [{ width: 1440, height: 1000 }, { width: 360, height: 800 }];
const slug = (route) => (route === "/" ? "index" : route.slice(1).replaceAll("/", "-"));
const sha = (buffer) => createHash("sha256").update(buffer).digest("hex");
const norm = (text) => text.replace(/\s+/g, " ").trim();

// errors: a check could not run (exit 1); pageErrors: uncaught exceptions of the sites themselves, compared, not fatal.
const report = { generated: new Date().toISOString(), origins: { old: origins.old, new: origins.new }, http: {}, pages: {}, screenshots: {}, behaviour: {}, pageErrors: { old: [], new: [] }, hydration: { old: [], new: [] }, errors: [] };

// ---------- HTTP ----------
async function get(site, pathname) {
  const headers = site === "new" && cookie ? { Cookie: cookie } : {};
  const response = await fetch(origins[site] + pathname, { headers, redirect: "manual" });
  return { status: response.status, type: response.headers.get("content-type"), location: response.headers.get("location"), body: Buffer.from(await response.arrayBuffer()) };
}
{
  const local = fs.readFileSync(path.join(root, "content/handbook.md"));
  const http = {};
  for (const site of ["old", "new"]) {
    const md = await get(site, "/handbook.md");
    const text = md.body.toString("utf8");
    http[site] = {
      handbook: { status: md.status, type: md.type, bytes: md.body.length, sha256: sha(md.body), equalsSource: md.body.equals(local), equalsSourceIgnoringCR: text.replaceAll("\r\n", "\n") === local.toString("utf8") },
      notFound: await Promise.all(["/nope", "/chapters/99", "/chapters"].map(async (route) => ({ route, status: (await get(site, route)).status }))),
      trailingSlash: await get(site, "/chapters/01/").then((result) => ({ status: result.status, location: result.location })),
    };
  }
  report.http = http;
}

// ---------- browser ----------
const executablePath = process.env.CHROMIUM_PATH || undefined;
const browser = await chromium.launch({ executablePath, headless: true });
async function open(site, viewport, options = {}) {
  const context = await browser.newContext({ viewport, reducedMotion: "reduce", ...options });
  if (site === "new" && cookieParts) await context.addCookies([{ name: cookieParts[1], value: cookieParts[2], url: origins.new }]);
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  page.on("pageerror", (error) => {
    const entry = `${new URL(page.url()).pathname} ${viewport.width}: ${error.message.split("\n")[0]}`;
    if (!report.pageErrors[site].includes(entry)) report.pageErrors[site].push(entry);
  });
  let documents = 0;
  page.on("request", (request) => { if (request.isNavigationRequest() && request.frame() === page.mainFrame()) documents++; });
  return { context, page, documents: () => documents };
}
// "load" can wait on a slow third-party resource; the page is ready when the
// DOM is parsed, fonts are loaded and the reader has hydrated: js-enabled is
// set and the buttons that wait for it (search, "Глава изучена") are enabled.
// Pages without the reader (404) have nothing to hydrate.
const hydrated = () => !document.querySelector(".topbar") || (document.documentElement.classList.contains("js-enabled") && !document.querySelector(".search-trigger[disabled], .completion-button[disabled]"));
async function settle(page, js = true) {
  await page.waitForLoadState("domcontentloaded");
  const ready = !js || await page.waitForFunction(hydrated, null, { timeout: 20000 }).then(() => true, () => false);
  await page.evaluate(() => document.fonts.ready.then(() => true));
  await page.waitForTimeout(400);
  return ready;
}
// A page that has not hydrated in 20 s is loaded again (up to 3 times);
// every slow or failed attempt is recorded in report.hydration.
async function go(page, site, route, js = true) {
  let response;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const started = Date.now();
    response = await page.goto(origins[site] + route, { waitUntil: "domcontentloaded" });
    const ready = await settle(page, js);
    if (!ready) report.hydration[site].push({ route, attempt, width: page.viewportSize()?.width, seconds: Math.round((Date.now() - started) / 1000) });
    if (ready) break;
    if (attempt === 3) throw new Error(`${site} ${route}: not hydrated after 3 loads`);
  }
  return response;
}
// Lazy images load only near the viewport, and a long page (/print) can be
// captured before they arrive: make them eager, scroll through, wait for all.
async function loadLazy(page) {
  await page.evaluate(async () => {
    document.querySelectorAll("img[loading=lazy]").forEach((image) => { image.loading = "eager"; });
    for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight) { scrollTo(0, y); await new Promise((resolve) => setTimeout(resolve, 60)); }
    scrollTo(0, 0);
    await Promise.all([...document.images].map((image) => (image.complete ? null : new Promise((resolve) => { image.onload = image.onerror = resolve; setTimeout(resolve, 15000); }))));
  });
  await page.mouse.move(0, 0);
  await page.waitForTimeout(500);
}
const dom = (page) => page.evaluate(() => {
  const main = document.querySelector("main#reader") ?? document.querySelector("main");
  const ids = [...document.querySelectorAll("[id]")].map((node) => node.id).filter((id) => !/^(S|B|P):\d+$|^_R_|^«|^:r/.test(id)).sort();
  const links = [...document.querySelectorAll("main a[href]")].map((link) => link.getAttribute("href")).sort();
  return { title: document.title, h1: document.querySelector("h1")?.textContent?.trim() ?? "", text: main?.innerText ?? "", ids, links, terms: document.querySelectorAll(".term-link").length, images: [...document.querySelectorAll("main img")].map((image) => image.getAttribute("src")) };
});

async function raw(png) {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}
async function compare(oldPng, newPng, file) {
  const [a, b] = await Promise.all([raw(oldPng), raw(newPng)]);
  const width = Math.min(a.width, b.width), height = Math.min(a.height, b.height);
  let differing = 0, top = Infinity, bottom = -1;
  const mask = Buffer.from(b.data);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * a.width + x) * 4, j = (y * b.width + x) * 4;
      if (Math.abs(a.data[i] - b.data[j]) > 24 || Math.abs(a.data[i + 1] - b.data[j + 1]) > 24 || Math.abs(a.data[i + 2] - b.data[j + 2]) > 24) {
        differing++;
        top = Math.min(top, y); bottom = y;
        mask[j] = 255; mask[j + 1] = 0; mask[j + 2] = 0; mask[j + 3] = 255;
      }
    }
  }
  const same = differing === 0 && a.width === b.width && a.height === b.height;
  if (!same) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    await sharp(mask, { raw: { width: b.width, height: b.height, channels: 4 } }).resize({ width: Math.min(b.width, 720), height: Math.min(b.height, 4000), fit: "inside" }).webp({ quality: 70 }).toFile(file);
    if (bottom >= 0) {
      const cropTop = Math.max(0, top - 40), cropHeight = Math.min(height - cropTop, bottom - top + 81, 2400);
      for (const [site, png] of [["old", oldPng], ["new", newPng]]) {
        await sharp(png).extract({ left: 0, top: cropTop, width, height: cropHeight }).webp({ quality: 80 }).toFile(file.replace(/\.webp$/, `.crop.${site}.webp`));
      }
    }
  }
  return { same, old: `${a.width}x${a.height}`, new: `${b.width}x${b.height}`, differingPixels: differing, comparedPixels: width * height, rows: bottom >= 0 ? [top, bottom] : null };
}

// Pages: content, anchors and screenshots at both widths.
for (const viewport of widths) {
  const sessions = { old: await open("old", viewport), new: await open("new", viewport) };
  for (const route of routes) {
    const key = `${viewport.width} ${route}`;
    try {
      const seen = {}, full = {};
      for (const site of ["old", "new"]) {
        const { page } = sessions[site];
        const response = await go(page, site, route);
        await loadLazy(page);
        seen[site] = { status: response?.status() ?? null, ...(await dom(page)) };
        const shotDir = path.join(outDir, "shots", String(viewport.width));
        fs.mkdirSync(shotDir, { recursive: true });
        await sharp(await page.screenshot()).webp({ quality: 72 }).toFile(path.join(shotDir, `${slug(route)}.${site}.webp`));
        full[site] = await page.screenshot({ fullPage: true });
      }
      if (viewport.width === 1440) {
        const { old, new: candidate } = seen;
        const missing = old.ids.filter((id) => !candidate.ids.includes(id)), extra = candidate.ids.filter((id) => !old.ids.includes(id));
        report.pages[route] = {
          status: { old: old.status, new: candidate.status },
          title: old.title === candidate.title, h1: old.h1 === candidate.h1, h1Text: candidate.h1,
          text: norm(old.text) === norm(candidate.text), textLength: { old: norm(old.text).length, new: norm(candidate.text).length },
          ids: { old: old.ids.length, new: candidate.ids.length, missing, extra },
          links: JSON.stringify(old.links) === JSON.stringify(candidate.links),
          terms: { old: old.terms, new: candidate.terms },
          images: JSON.stringify(old.images) === JSON.stringify(candidate.images),
        };
      }
      report.screenshots[key] = await compare(full.old, full.new, path.join(outDir, "diff", String(viewport.width), `${slug(route)}.webp`));
    } catch (error) {
      report.errors.push(`${key}: ${error.message.split("\n")[0]}`);
    }
  }
  for (const site of ["old", "new"]) await sessions[site].context.close();
}

// Behaviours: each one in a fresh context per site, results side by side.
const focusOf = (page) => page.evaluate(() => {
  const node = document.activeElement;
  return node ? `${node.tagName.toLowerCase()}${node.id ? `#${node.id}` : ""}${node.className && typeof node.className === "string" ? `.${node.className.split(" ")[0]}` : ""}${node.getAttribute("aria-label") ? `[${node.getAttribute("aria-label")}]` : ""}` : null;
});
const behaviours = {
  async spa(site) {
    const { page, documents, context } = await open(site, widths[0]);
    const result = [];
    for (const [start, target] of [["/", "/chapters/01"], ["/chapters/01", "/glossary"], ["/glossary", "/chapters/22"]]) {
      await go(page, site, start);
      await page.evaluate(() => { window.__spaMarker = "kept"; });
      const before = documents();
      await page.locator(`a[href="${target}"]`).filter({ visible: true }).first().click();
      await page.waitForURL((url) => url.pathname === target, { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(800);
      const marker = await page.evaluate(() => window.__spaMarker ?? null);
      result.push({ from: start, to: target, path: new URL(page.url()).pathname, client: marker === "kept" && documents() === before, h1: (await dom(page)).h1 });
    }
    await context.close();
    return result;
  },
  async search(site) {
    const { page, context } = await open(site, widths[0]);
    await go(page, site, "/chapters/01");
    await page.keyboard.press("Control+k");
    await page.locator("#handbook-search").waitFor({ state: "visible" });
    await page.locator("#handbook-search").fill("preflight");
    await page.locator("#search-results [role=option]").first().waitFor({ timeout: 15000 });
    const count = await page.locator(".search-count").innerText();
    const titles = await page.locator("#search-results [role=option] strong").allInnerTexts();
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    const focusAfterEscape = await focusOf(page);
    await page.keyboard.press("Control+k");
    await page.locator("#handbook-search").fill("preflight");
    await page.locator("#search-results [role=option]").first().waitFor({ timeout: 15000 });
    await page.keyboard.press("Enter");
    await page.waitForTimeout(1500);
    const url = new URL(page.url());
    const result = { count, first: titles.slice(0, 5), total: titles.length, focusAfterEscape, afterEnter: { path: url.pathname, hash: url.hash, focus: await focusOf(page) } };
    await context.close();
    return result;
  },
  // A click on a term opens a tooltip, a popover or the side panel (previewKind); Escape closes it.
  async glossary(site) {
    const result = [];
    for (const viewport of widths) {
      const { page, context } = await open(site, viewport);
      await go(page, site, "/chapters/01");
      const links = page.locator("main .term-link");
      for (let index = 0; index < Math.min(6, await links.count()); index++) {
        const link = links.nth(index);
        await link.scrollIntoViewIfNeeded();
        await link.click();
        await page.waitForTimeout(400);
        const tooltip = norm(await page.locator("#term-tooltip").innerText({ timeout: 1000 }).catch(() => ""));
        const panel = norm(await page.locator("dialog.context-panel[open]").innerText({ timeout: 1000 }).catch(() => ""));
        await page.keyboard.press("Escape");
        await page.waitForTimeout(300);
        const closed = !(await page.locator("#term-tooltip, dialog.context-panel[open]").count());
        result.push({ width: viewport.width, term: await link.getAttribute("href"), kind: tooltip ? "tooltip" : panel ? "panel" : "none", text: (tooltip || panel).slice(0, 160), closed });
      }
      await context.close();
    }
    return result;
  },
  async xp(site) {
    const { page, context } = await open(site, widths[0]);
    await go(page, site, "/chapters/01");
    await page.locator(".completion-button").first().click();
    await page.waitForTimeout(400);
    const reward = norm(await page.locator(".profile-reward").first().innerText().catch(() => ""));
    await go(page, site, "/");
    const profile = norm(await page.locator(".learning-profile").first().innerText().catch(() => ""));
    const stored = await page.evaluate(() => localStorage.getItem("handbook-learning-v2"));
    await context.close();
    return { reward, stored, profile: profile.slice(0, 400) };
  },
  async print(site) {
    const { page, context } = await open(site, widths[0]);
    await go(page, site, "/print");
    await loadLazy(page);
    await page.emulateMedia({ media: "print" });
    const pdf = await page.pdf({ format: "A4", printBackground: true });
    const text = norm(await page.evaluate(() => document.body.innerText));
    await context.close();
    return { pdfPages: (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length, textLength: text.length, textSha256: sha(Buffer.from(text)) };
  },
  async drawer(site) {
    const { page, context } = await open(site, widths[1]);
    await go(page, site, "/");
    await page.locator(".menu-trigger").click();
    await page.locator("dialog.drawer[open] a[href='/chapters/02']").click();
    await page.waitForURL((url) => url.pathname === "/chapters/02", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1000);
    const result = { path: new URL(page.url()).pathname, focus: await focusOf(page) };
    await context.close();
    return result;
  },
  async noJs(site) {
    const { page, context } = await open(site, widths[0], { javaScriptEnabled: false });
    await go(page, site, "/chapters/01", false);
    const result = await page.evaluate(() => ({ skeleton: Boolean(document.querySelector(".reader-skeleton")), visibleH1: [...document.querySelectorAll("h1")].some((node) => node.offsetParent !== null), textLength: (document.querySelector("main:not(.reader-skeleton)")?.innerText ?? "").length }));
    await context.close();
    return result;
  },
  async prefetch(site) {
    const { page, context } = await open(site, widths[0]);
    const rsc = [];
    page.on("request", (request) => { if (request.headers()["rsc"] === "1") rsc.push(new URL(request.url()).pathname); });
    await go(page, site, "/");
    await page.waitForTimeout(2000);
    const onLoad = rsc.length;
    await page.locator(".sidebar a[href='/chapters/05']").hover();
    await page.waitForTimeout(1000);
    const result = { rscOnLoad: onLoad, rscAfterHover: rsc.length - onLoad, hovered: rsc.slice(onLoad) };
    await context.close();
    return result;
  },
};
for (const [name, run] of Object.entries(behaviours)) {
  report.behaviour[name] = {};
  for (const site of ["old", "new"]) {
    try { report.behaviour[name][site] = await run(site); } catch (error) { report.behaviour[name][site] = { error: error.message.split("\n")[0] }; report.errors.push(`${name} ${site}: ${error.message.split("\n")[0]}`); }
  }
}
await browser.close();

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "parity.json"), `${JSON.stringify(report, null, 2)}\n`);
const pageRows = Object.entries(report.pages);
const shots = Object.values(report.screenshots);
console.log(`pages: ${pageRows.length}, text equal ${pageRows.filter(([, row]) => row.text).length}, ids equal ${pageRows.filter(([, row]) => !row.ids.missing.length && !row.ids.extra.length).length}`);
console.log(`screenshots: ${shots.length} compared, identical ${shots.filter((shot) => shot.same).length}`);
console.log(`not hydrated in 20 s: old ${report.hydration.old.length}, new ${report.hydration.new.length}`);
console.log(`page errors: old ${report.pageErrors.old.length}, new ${report.pageErrors.new.length}`);
console.log(`errors: ${report.errors.length}${report.errors.length ? `\n${report.errors.join("\n")}` : ""}`);
process.exit(report.errors.length ? 1 : 0);
