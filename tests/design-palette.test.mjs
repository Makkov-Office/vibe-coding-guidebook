// «Чертёж» v2 palette (P2-02): every pair passes WCAG thresholds, the report
// and the spec table are fresh, and the values match the approved concept.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  PALETTE, REPORT, SPEC, checkPalette, contrast, renderReport, renderSpec,
} from '../scripts/design-contrast.mjs';

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const palette = JSON.parse(read(PALETTE));
const rows = checkPalette(palette);

test('contrast formula matches WCAG reference values', () => {
  assert.equal(contrast('#000000', '#FFFFFF').toFixed(2), '21.00');
  assert.equal(contrast('#777777', '#FFFFFF').toFixed(2), '4.48');
});

test('every palette pair passes its threshold in both themes', () => {
  assert.ok(rows.length > 0);
  assert.deepEqual(new Set(rows.map((r) => r.theme)), new Set(['light', 'dark']));
  assert.deepEqual(rows.filter((r) => r.status !== 'PASS'), []);
});

test('contrast report and spec table are generated from the palette', () => {
  assert.equal(read(REPORT), renderReport(rows), 'run: node scripts/design-contrast.mjs --write');
  assert.equal(read(SPEC), renderSpec(read(SPEC), rows), 'run: node scripts/design-contrast.mjs --write');
});

test('check fails closed on low contrast and unknown roles', () => {
  const bad = structuredClone(palette);
  bad.themes.light['on-surface-variant'] = '#B2B2B2';
  assert.ok(checkPalette(bad).some((r) => r.status === 'FAIL'));
  bad.pairs.push({ fg: 'no-such-role', bg: ['background'], kind: 'text', use: 'x' });
  assert.throws(() => checkPalette(bad), /unknown role/);
  assert.throws(() => checkPalette({ ...palette, pairs: [] }), /no themes or pairs/);
  const forbidden = structuredClone(palette);
  forbidden.pairs[2].bg.push('surface-container-high');
  assert.throws(() => checkPalette(forbidden), /forbidden pair/);
  const uneven = structuredClone(palette);
  delete uneven.themes.dark.rail;
  assert.throws(() => checkPalette(uneven), /role set differs/);
});

test('threshold is compared without rounding up', () => {
  const edge = { themes: { light: { a: '#767676', b: '#FFFFFF' } }, pairs: [{ fg: 'a', bg: ['b'], kind: 'text', use: 'x' }] };
  const [row] = checkPalette(edge);
  assert.ok(contrast('#767676', '#FFFFFF') >= 4.5);
  assert.equal(row.status, 'PASS');
  edge.themes.light.a = '#647A86'; // 4.4969: rounds to 4.50, must still FAIL
  assert.equal(checkPalette(edge)[0].status, 'FAIL');
});

test('pairs and forbidden rules fail closed on typos', () => {
  const typo = structuredClone(palette);
  typo.pairs[0].theme = 'ligth';
  assert.throws(() => checkPalette(typo), /unknown theme/);
  const empty = structuredClone(palette);
  empty.pairs[0].bg = [];
  assert.throws(() => checkPalette(empty), /empty bg/);
  const rule = structuredClone(palette);
  rule.forbidden[0].bg = 'surface-containr-high';
  assert.throws(() => checkPalette(rule), /unknown role/);
  const typoKey = structuredClone(palette);
  typoKey.pairs[0].themes = 'dark';
  assert.throws(() => checkPalette(typoKey), /unknown key themes/);
  const typoRule = structuredClone(palette);
  typoRule.forbidden[0].themes = typoRule.forbidden[0].theme;
  assert.throws(() => checkPalette(typoRule), /unknown key themes/);
  const darkOnly = structuredClone(palette);
  darkOnly.pairs.push({ fg: 'primary', bg: ['surface-container-high'], kind: 'text', theme: 'dark', use: 'x' });
  assert.ok(checkPalette(darkOnly).some((r) => r.theme === 'dark' && r.bg === 'surface-container-high' && r.kind === 'text'));
});

test('every non-decorative role is checked in at least one pair', () => {
  const used = new Set(palette.pairs.flatMap((p) => [p.fg, ...p.bg]));
  const unchecked = Object.keys(palette.themes.light)
    .filter((role) => !used.has(role) && !palette.decorative.includes(role));
  assert.deepEqual(unchecked, []);
});

test('palette keeps the approved brand and concept values', () => {
  assert.deepEqual(palette.brand.gradient.map(([hex]) => hex),
    ['#FFFFFF', '#FDDCD4', '#FBB9A9', '#F9967D', '#F87352', '#AA6858', '#84635A', '#5D5D5D']);
  assert.deepEqual([palette.brand['module-lilac'], palette.brand['module-mint'], palette.brand['module-peach']],
    ['#E4CAFF', '#CAFFDA', '#FFE9CA']);
  const { light, dark } = palette.themes;
  assert.deepEqual([light.background, light['on-surface'], light['on-surface-variant'], light.primary],
    ['#FAFAFA', '#101010', '#595959', '#B4401F']);
  assert.deepEqual([light['primary-container'], light['on-primary-container'], light['on-action-gradient']],
    ['#FDE6DF', '#7A2A16', '#101010']);
  assert.deepEqual(light['action-gradient'], ['#F9967D', '#F87352', '#E8613F']);
  assert.deepEqual([dark.background, dark.primary, dark['on-surface-variant']], ['#101010', '#F87352', '#B2B2B2']);
});
