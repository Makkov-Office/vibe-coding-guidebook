// P2-05: URL map of the 9-section structure (src/content/url-map.json).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { currentRoutes, loadUrlMap, mappedPaths, redirectRoutes, resolveAnchors, staleAnchors, validateUrlMap } from '../scripts/url-map.mjs';

const generated = JSON.parse(fs.readFileSync(new URL('../src/content/generated.json', import.meta.url), 'utf8'));
const root = fileURLToPath(new URL('../', import.meta.url));
const map = loadUrlMap(root);
const clone = () => structuredClone(map);
const page = (copy, old) => copy.pages.find((entry) => entry.old === old);

test('url map is valid and covers every route and anchor', () => {
  assert.deepEqual(validateUrlMap(map, generated), []);
  const olds = new Set(map.pages.map((entry) => entry.old));
  for (const route of currentRoutes(generated)) assert.ok(olds.has(route), route);
  assert.equal(currentRoutes(generated).length, 29);
  const resolved = resolveAnchors(map, generated);
  assert.deepEqual(Object.keys(resolved).sort(), Object.keys(generated.anchors).sort());
});

test('every static page of the app is in the map', () => {
  // Same set as the build check in vercel-output.mjs: a page may already live
  // at its new address, a tab or a section root.
  const routes = mappedPaths(map);
  for (const known of ['/chapters/08', '/flow/08-preflight', '/flow/08-preflight/apply', '/flow', '/reference/glossary']) assert.ok(routes.has(known), known);
  for (const unknown of ['/flow/08-preflight/specs', '/chapters/99', '/design-x']) assert.ok(!routes.has(unknown), unknown);
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((item) => item.isDirectory() ? walk(`${dir}/${item.name}`) : item.name === 'page.tsx' ? [dir] : []);
  const app = fileURLToPath(new URL('../app', import.meta.url));
  for (const dir of walk(app)) {
    const route = `/${dir.slice(app.length + 1).split('/').filter((segment) => !segment.startsWith('(')).join('/')}`.replace(/\/$/, '') || '/';
    if (route.includes('[')) continue;
    assert.ok(routes.has(route), `${route} is served but not in src/content/url-map.json`);
  }
});

test('anchors land on the tab of their section', () => {
  const resolved = resolveAnchors(map, generated);
  assert.deepEqual(resolved['ch-08'], { path: '/flow/08-preflight', tab: 'overview' });
  assert.deepEqual(resolved['ch-08-8-2-отчет-preflight'], { path: '/flow/08-preflight/apply', tab: 'apply' });
  assert.deepEqual(resolved['ch-08-b004'], { path: '/flow/08-preflight/apply', tab: 'apply' });
  assert.deepEqual(resolved['lifecycle-panel'], { path: '/flow/07-lifecycle/check', tab: 'check' });
  assert.equal(resolved['ch-00-навигация'].path, '/start/00-how-to-read');
  assert.equal(resolved['term-agent'].path, '/reference/glossary');
  assert.equal(resolved['ch-codex'].path, '/tools/codex');
});

test('redirects only to pages that exist in the build, one hop', () => {
  assert.deepEqual(redirectRoutes(map, new Set(currentRoutes(generated))), []);
  const routes = redirectRoutes(map, new Set([...currentRoutes(generated), '/flow/08-preflight', '/reference/glossary']));
  assert.deepEqual(routes.map((route) => [route.src, route.headers.Location]), [
    ['^/chapters/08/?$', '/flow/08-preflight'],
    ['^/glossary/?$', '/reference/glossary'],
    ['^/chapters/23/?$', '/reference/glossary'],
  ]);
  assert.ok(routes.every((route) => route.status === 308));
  const regex = new RegExp(routes[0].src);
  assert.ok(regex.test('/chapters/08') && regex.test('/chapters/08/') && !regex.test('/chapters/081'));
  // `/` keeps serving Главная: its content moves, the address does not redirect.
  assert.ok(!redirectRoutes(map, new Set(['/start/00-how-to-read'])).length);
});

test('a redirect is refused while the anchor registry still points to the old address', () => {
  const built = new Set([...currentRoutes(generated), '/flow/08-preflight']);
  // The registry as it was before chapter 08 went live.
  const before = structuredClone(generated);
  for (const anchor of Object.values(before.anchors)) if (anchor.path.startsWith('/flow/08-preflight')) anchor.path = '/chapters/08';
  assert.equal(staleAnchors(map, before, new Set(currentRoutes(generated))).length, 0);
  const stale = staleAnchors(map, before, built);
  assert.ok(stale.length > 50);
  assert.equal(stale.length, Object.values(generated.anchors).filter((anchor) => anchor.path.startsWith('/flow/08-preflight')).length);
  const moved = structuredClone(before);
  for (const [id, target] of Object.entries(resolveAnchors(map, generated))) moved.anchors[id] = { id, path: target.path };
  assert.deepEqual(staleAnchors(map, moved, built), []);
  // `/` stays Главная, but once the intro page exists its anchors must follow it.
  assert.equal(staleAnchors(map, generated, new Set(['/start/00-how-to-read'])).length, Object.values(generated.anchors).filter((anchor) => anchor.path === '/').length);
});

test('a live chapter: its registry is the resolved one, its old address redirects', () => {
  const live = map.pages.filter((entry) => entry.live);
  assert.deepEqual(live.map((entry) => entry.chapter), ['ch-08', 'ch-22', 'ch-23']);
  const resolved = resolveAnchors(map, generated);
  const own = Object.values(generated.anchors).filter((anchor) => anchor.path.startsWith('/flow/08-preflight'));
  assert.ok(own.length > 50);
  for (const anchor of own) assert.equal(resolved[anchor.id].path, anchor.path, anchor.id);
  assert.ok(!Object.values(generated.anchors).some((anchor) => anchor.path === '/chapters/08'));
  // The build serves the tabs instead of the old address: no stale anchor, one 308.
  const built = new Set([...currentRoutes(generated).filter((route) => !['/chapters/08', '/chapters/22', '/glossary'].includes(route)), '/flow/08-preflight', '/flow/08-preflight/how-it-works', '/flow/08-preflight/apply', '/flow/08-preflight/check', '/reference/22-cheatsheet', '/reference/glossary']);
  assert.deepEqual(staleAnchors(map, generated, built), []);
  assert.deepEqual(redirectRoutes(map, built).map((route) => [route.src, route.headers.Location]), [
    ['^/chapters/08/?$', '/flow/08-preflight'],
    ['^/chapters/22/?$', '/reference/22-cheatsheet'],
    ['^/glossary/?$', '/reference/glossary'],
    ['^/chapters/23/?$', '/reference/glossary'],
  ]);
});

test('a live page without tabs (P2-05b): every anchor of it, terms included, is at its new address', () => {
  const resolved = resolveAnchors(map, generated);
  const own = (path) => Object.values(generated.anchors).filter((anchor) => anchor.path === path);
  assert.ok(own('/reference/glossary').length > 394);
  assert.ok(own('/reference/22-cheatsheet').length > 10);
  for (const anchor of [...own('/reference/glossary'), ...own('/reference/22-cheatsheet')]) assert.deepEqual(resolved[anchor.id], { path: anchor.path, tab: 'overview' }, anchor.id);
  assert.equal(generated.anchors['term-agent'].path, '/reference/glossary');
  assert.ok(!Object.values(generated.anchors).some((anchor) => ['/glossary', '/chapters/22'].includes(anchor.path)));
  // The old addresses stay in generated.json for the map, the pages are read at the new ones.
  const chapter = (id) => generated.chapters.find((item) => item.id === id);
  assert.deepEqual([chapter('ch-23').path, chapter('ch-23').href], ['/glossary', '/reference/glossary']);
  assert.deepEqual([chapter('ch-22').path, chapter('ch-22').href], ['/chapters/22', '/reference/22-cheatsheet']);
});

test('broken entries fail the check', () => {
  const cases = [
    ['missing route', (copy) => { copy.pages = copy.pages.filter((entry) => entry.old !== '/chapters/14'); }, /route \/chapters\/14 is not in the map/],
    ['chain', (copy) => { page(copy, '/chapters/22').new = '/glossary'; page(copy, '/chapters/22').section = 'service'; }, /chain or cycle/],
    ['cycle', (copy) => { copy.pages.push({ old: '/reference/glossary', new: '/glossary', section: 'service', alias: true }); }, /chain or cycle/],
    ['heading without tab', (copy) => { delete page(copy, '/chapters/08').anchors['ch-08-8-3-fail-closed']; }, /ch-08-8-3-fail-closed has no tab/],
    ['stale anchor', (copy) => { page(copy, '/chapters/08').anchors['ch-08-8-9-нет'] = 'apply'; }, /ch-08-8-9-нет is not a heading/],
    ['unknown tab', (copy) => { page(copy, '/chapters/08').anchors['ch-08-8-3-fail-closed'] = 'specs'; }, /unknown tab specs/],
    ['outside section', (copy) => { page(copy, '/chapters/08').new = '/base/08-preflight'; }, /outside section \/flow/],
    ['query instead of path', (copy) => { page(copy, '/chapters/08').new = '/flow/08-preflight?tab=apply'; }, /not a lowercase path/],
    ['duplicate address', (copy) => { page(copy, '/chapters/09').new = '/flow/08-preflight'; }, /also the address/],
    ['listed twice', (copy) => { copy.pages.push({ ...page(copy, '/print') }); }, /listed twice/],
    ['chapter left out', (copy) => { page(copy, '/tools/codex').chapter = undefined; delete page(copy, '/tools/codex').chapter; }, /chapter ch-codex is not in the map/],
    ['moved onto Главная', (copy) => { page(copy, '/chapters/22').new = '/'; page(copy, '/chapters/22').section = 'service'; }, /section landing page/],
    ['moved onto a section root', (copy) => { page(copy, '/chapters/06').new = '/flow'; }, /section landing page/],
    ['service page moves', (copy) => { page(copy, '/chapters/22').new = '/flow/22-x'; page(copy, '/chapters/22').section = 'service'; }, /service page keeps its address/],
    ['tabs without anchors', (copy) => { delete page(copy, '/chapters/01').anchors; }, /tabs need an anchors object/],
    ['live on a page that stays', (copy) => { page(copy, '/tools/codex').live = true; }, /live is only true/],
    ['live without a chapter', (copy) => { page(copy, '/chapters/23').live = true; }, /live is only true/],
    ['live false', (copy) => { page(copy, '/chapters/08').live = false; }, /live is only true/],
    ['eight sections', (copy) => { copy.sections = copy.sections.filter((section) => section.id !== 'agents'); }, /9 sections/],
  ];
  for (const [name, breakIt, expected] of cases) {
    const copy = clone();
    breakIt(copy);
    const errors = validateUrlMap(copy, generated);
    assert.ok(errors.some((error) => expected.test(error)), `${name}: ${errors.join('; ') || 'no errors'}`);
  }
});
