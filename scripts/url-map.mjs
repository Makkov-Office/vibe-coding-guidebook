// URL map of the 9-section structure (P2-05, RD-01 «Структура»).
// src/content/url-map.json says where every current page and anchor goes;
// this module validates it, resolves anchors to their new page and tab, and
// builds the 308 redirects. Used by scripts/vercel-output.mjs (redirects,
// fail closed) and tests/url-map.test.mjs. No dependencies.
import fs from "node:fs";
import path from "node:path";

const PATH = /^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*)?$/;
const PAGE_KEYS = new Set(["old", "new", "section", "chapter", "keep", "alias", "tabs", "lead", "anchors"]);

export function loadUrlMap(root = process.cwd()) {
  return JSON.parse(fs.readFileSync(path.join(root, "src/content/url-map.json"), "utf8"));
}

// An entry redirects when its content leaves the old address and the old
// address does not stay a live page of its own (`keep`, e.g. `/` → Главная).
export const redirects = (entry) => entry.old !== entry.new && !entry.keep;

export function tabPath(map, entry, tabId) {
  const tab = map.tabs.find((item) => item.id === tabId);
  return tab.segment ? `${entry.new}/${tab.segment}` : entry.new;
}

// Every address the map knows: section roots, old and new addresses and the
// tabs of each chapter. A built page outside this set fails the build.
export function mappedPaths(map) {
  return new Set([
    ...map.sections.map((section) => section.path),
    ...map.pages.flatMap((entry) => [entry.old, entry.new, ...(entry.tabs ? map.tabs.map((tab) => tabPath(map, entry, tab.id)) : [])]),
  ]);
}

// Every route the current build serves, from the compiled content: the intro
// (`/`), each chapter's own path and the print page. Same list as
// dist/server/vinext-prerender.json without /404.
export function currentRoutes(generated) {
  return ["/", ...generated.chapters.map((chapter) => chapter.path), "/print"];
}

// Anchor id → { path, tab } in the new structure. Anchors of a tabbed chapter
// follow the section heading before them in the chapter HTML (or the
// chapter's `lead` tab before the first heading); explicit entries in
// `anchors` win; the chapter id itself is the overview. Throws on an anchor
// that cannot be placed, so nothing is silently sent to a wrong page.
export function resolveAnchors(map, generated) {
  const byOld = new Map(map.pages.filter((entry) => !entry.alias).map((entry) => [entry.old, entry]));
  const chapters = new Map(generated.chapters.map((chapter) => [chapter.id, chapter]));
  const sectionOf = new Map();
  for (const entry of map.pages) {
    if (!entry.tabs) continue;
    const chapter = chapters.get(entry.chapter);
    if (!chapter) throw new Error(`url-map: ${entry.old}: chapter ${entry.chapter} is not in generated.json`);
    const headings = new Set(chapter.outline.map((item) => item.id));
    let current = entry.lead;
    for (const [, id] of chapter.html.matchAll(/ id="([^"]+)"/g)) {
      if (headings.has(id)) current = (entry.anchors ?? {})[id];
      sectionOf.set(id, current);
    }
  }
  const resolved = {};
  for (const [id, anchor] of Object.entries(generated.anchors)) {
    const entry = byOld.get(anchor.path);
    if (!entry) throw new Error(`url-map: anchor ${id}: page ${anchor.path} is not in the map`);
    let tab = "overview";
    if (entry.tabs && id !== entry.chapter) tab = (entry.anchors ?? {})[id] ?? sectionOf.get(id);
    if (!tab) throw new Error(`url-map: anchor ${id} on ${anchor.path}: not in the chapter HTML and not listed in anchors`);
    resolved[id] = { path: tabPath(map, entry, tab), tab };
  }
  return resolved;
}

// Returns a list of problems; empty means the map is valid.
export function validateUrlMap(map, generated) {
  const errors = [];
  const tabIds = new Set((map.tabs ?? []).map((tab) => tab.id));
  const sections = new Map((map.sections ?? []).map((section) => [section.id, section]));
  if ((map.sections ?? []).filter((section) => section.rail).length !== 9) errors.push("rail must have 9 sections");
  for (const tab of ["overview", "how-it-works", "apply", "check"]) if (!tabIds.has(tab)) errors.push(`tab ${tab} is missing`);
  const olds = new Map();
  for (const entry of map.pages ?? []) {
    const name = entry.old ?? JSON.stringify(entry);
    for (const key of Object.keys(entry)) if (!PAGE_KEYS.has(key)) errors.push(`${name}: unknown key ${key}`);
    for (const key of ["old", "new"]) if (typeof entry[key] !== "string" || !PATH.test(entry[key])) errors.push(`${name}: ${key} ${entry[key]} is not a lowercase path`);
    if (olds.has(entry.old)) errors.push(`${name}: listed twice`);
    olds.set(entry.old, entry);
    const section = sections.get(entry.section);
    if (!section) errors.push(`${name}: unknown section ${entry.section}`);
    else if (section.path !== "/" && entry.new !== section.path && !entry.new?.startsWith(`${section.path}/`)) errors.push(`${name}: ${entry.new} is outside section ${section.path}`);
    if (entry.keep && entry.old === entry.new) errors.push(`${name}: keep without a move`);
    // `/` is Главная and a section root is that section's landing page: only
    // the page that already lives there may map onto it. A service page
    // (outside the rail) does not move.
    if (entry.new === "/" || (section && entry.new === section.path && entry.old !== entry.new)) errors.push(`${name}: ${entry.new} is a section landing page`);
    if (section?.id === "service" && entry.old !== entry.new) errors.push(`${name}: a service page keeps its address`);
    if (entry.tabs) {
      if (!tabIds.has(entry.lead)) errors.push(`${name}: lead tab ${entry.lead} is unknown`);
      if (typeof entry.anchors !== "object" || entry.anchors === null) errors.push(`${name}: tabs need an anchors object`);
      for (const [id, tab] of Object.entries(entry.anchors ?? {})) if (!tabIds.has(tab)) errors.push(`${name}: anchor ${id} → unknown tab ${tab}`);
    }
  }
  // Tab addresses are segments of the chapter path, so they must not collide
  // with another page or another chapter's tab.
  // An old address that stays live (`keep`) is owned by that entry too.
  const owners = new Map((map.pages ?? []).filter((entry) => entry.keep).map((entry) => [entry.old, entry.old]));
  for (const entry of map.pages ?? []) {
    if (entry.alias) continue;
    const addresses = entry.tabs ? [...tabIds].map((tab) => tabPath(map, entry, tab)) : [entry.new];
    for (const address of addresses) {
      if (owners.has(address) && owners.get(address) !== entry.old) errors.push(`${entry.old}: ${address} is also the address of ${owners.get(address)}`);
      owners.set(address, entry.old);
    }
  }
  // At most one hop and no cycles: a redirect target must not redirect again.
  for (const entry of map.pages ?? []) {
    if (!redirects(entry)) continue;
    const next = olds.get(entry.new);
    if (next && redirects(next)) errors.push(`${entry.old} → ${entry.new} → ${next.new}: chain or cycle`);
  }
  // Coverage: every current route and every chapter heading and panel.
  for (const route of currentRoutes(generated)) if (!olds.has(route)) errors.push(`route ${route} is not in the map`);
  const chapterIds = new Set(generated.chapters.map((chapter) => chapter.id));
  const mappedChapters = new Set();
  for (const entry of map.pages ?? []) {
    if (entry.alias) {
      if (entry.chapter || entry.tabs) errors.push(`${entry.old}: an alias has no chapter or tabs`);
      else if (!(map.pages ?? []).some((other) => !other.alias && other.new === entry.new)) errors.push(`${entry.old}: alias target ${entry.new} is not a mapped page`);
      continue;
    }
    if (!entry.chapter) continue;
    mappedChapters.add(entry.chapter);
    const chapter = generated.chapters.find((item) => item.id === entry.chapter);
    if (entry.chapter !== "ch-00" && !chapter) { errors.push(`${entry.old}: chapter ${entry.chapter} is not in generated.json`); continue; }
    if (chapter && chapter.path !== entry.old) errors.push(`${entry.old}: chapter ${entry.chapter} lives at ${chapter.path}`);
    if (!entry.tabs) continue;
    const listed = new Set([...chapter.outline.map((item) => item.id), ...generated.panels.filter((panel) => panel.chapter === entry.chapter).map((panel) => `${panel.id}-panel`)]);
    for (const id of listed) if (!(id in (entry.anchors ?? {}))) errors.push(`${entry.old}: heading or panel ${id} has no tab`);
    for (const id of Object.keys(entry.anchors ?? {})) if (!listed.has(id)) errors.push(`${entry.old}: anchor ${id} is not a heading or panel of ${entry.chapter}`);
  }
  for (const id of chapterIds) if (!mappedChapters.has(id)) errors.push(`chapter ${id} is not in the map`);
  if (errors.length === 0) {
    try {
      resolveAnchors(map, generated);
    } catch (error) {
      errors.push(error.message);
    }
  }
  return errors;
}

// Anchors whose registry path (generated.json, used by Reader to restore old
// links) is an old address that this build already redirects. Reader would
// send such a link back to the old address, the 308 would bring it to the
// overview again: a loop (for a `keep` entry the link just stays on the old
// page, which no longer has that content). When a page moves, the registry
// must take its paths from resolveAnchors; until then the build fails here.
export function staleAnchors(map, generated, builtPaths) {
  // A `keep` entry has no 308, but its content has left the old address too.
  const moved = new Set(map.pages.filter((entry) => entry.old !== entry.new && builtPaths.has(entry.new)).map((entry) => entry.old));
  return Object.values(generated.anchors).filter((anchor) => moved.has(anchor.path)).map((anchor) => `${anchor.id} → ${anchor.path}`);
}

// Vercel routes for the entries whose target page is in this build. The
// optional trailing slash keeps `/chapters/08/` at one hop too.
export function redirectRoutes(map, builtPaths) {
  const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return map.pages
    .filter((entry) => redirects(entry) && builtPaths.has(entry.new))
    .map((entry) => ({ src: `^${escape(entry.old)}/?$`, status: 308, headers: { Location: entry.new } }));
}
