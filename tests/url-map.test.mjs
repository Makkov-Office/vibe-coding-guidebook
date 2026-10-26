// P2-05: URL map of the 9-section structure (src/content/url-map.json).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { currentRoutes, loadUrlMap, redirectRoutes, resolveAnchors, staleAnchors, validateUrlMap } from '../scripts/url-map.mjs';

const generated = JSON.parse(fs.readFileSync(new URL('../src/content/generated.json', import.meta.url), 'utf8'));
const map = loadUrlMap(new URL('..', import.meta.url).pathname);
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
  const routes = new Set(map.pages.map((entry) => entry.old));
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((item) => item.isDirectory() ? walk(`${dir}/${item.name}`) : item.name === 'page.tsx' ? [dir] : []);
  const app = new URL('../app', import.meta.url).pathname;
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
  assert.equal(staleAnchors(map, generated, new Set(currentRoutes(generated))).length, 0);
  const stale = staleAnchors(map, generated, built);
  assert.equal(stale.length, Object.values(generated.anchors).filter((anchor) => anchor.path === '/chapters/08').length);
  const moved = structuredClone(generated);
  for (const [id, target] of Object.entries(resolveAnchors(map, generated))) moved.anchors[id] = { id, path: target.path };
  assert.deepEqual(staleAnchors(map, moved, built), []);
  // `/` stays Главная, but once the intro page exists its anchors must follow it.
  assert.equal(staleAnchors(map, generated, new Set(['/start/00-how-to-read'])).length, Object.values(generated.anchors).filter((anchor) => anchor.path === '/').length);
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
    ['eight sections', (copy) => { copy.sections = copy.sections.filter((section) => section.id !== 'agents'); }, /9 sections/],
  ];
  for (const [name, breakIt, expected] of cases) {
    const copy = clone();
    breakIt(copy);
    const errors = validateUrlMap(copy, generated);
    assert.ok(errors.some((error) => expected.test(error)), `${name}: ${errors.join('; ') || 'no errors'}`);
  }
});
