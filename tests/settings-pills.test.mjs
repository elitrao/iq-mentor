import test from 'node:test';
import assert from 'node:assert/strict';
import { SETTINGS_GROUPS, SETTINGS_PILL_SECTIONS, resolveSettingsSection } from '../src/settings/schema.js';

test('pills expose every top-level setting once in a single level', () => {
  const expected = SETTINGS_GROUPS.flatMap((group) => group.items.map((item) => item.id));
  assert.deepEqual(SETTINGS_PILL_SECTIONS.map((item) => item.id), expected);
  assert.equal(SETTINGS_PILL_SECTIONS.length, 6);
  assert.equal(new Set(SETTINGS_PILL_SECTIONS.map((item) => item.label)).size, 6);
});

test('every existing report type resolves to a visible parent pill', () => {
  for (const group of SETTINGS_GROUPS) for (const parent of group.items) {
    for (const child of parent.children || []) {
      const resolved = resolveSettingsSection(child.id);
      const pill = SETTINGS_PILL_SECTIONS.find((item) => item.id === resolved.parent.id);
      assert.equal(pill.id, parent.id);
      assert.equal(pill.group, group.id);
    }
  }
});
