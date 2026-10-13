import test from 'node:test';
import assert from 'node:assert/strict';
import { initialNavigation, navigatePrototype, navigationHash } from '../src/settings/navigation.js';

test('direct Settings and legacy links open a modal over Home', () => {
  for (const hash of ['#settings', '#employees']) assert.deepEqual(initialNavigation(hash), { page: 'home', settingsOpen: true });
  assert.deepEqual(initialNavigation('#documents'), { page: 'documents', settingsOpen: false });
  assert.deepEqual(initialNavigation('#templates'), { page: 'templates', settingsOpen: false });
  assert.deepEqual(initialNavigation(''), { page: 'home', settingsOpen: false });
  assert.deepEqual(initialNavigation('#analytics'), { page: 'analytics', settingsOpen: false });
});
test('Settings opens without replacing the current background page', () => {
  const current = { page: 'trainer', settingsOpen: false };
  const next = navigatePrototype(current, 'settings');
  assert.deepEqual(next, { page: 'trainer', settingsOpen: true });
  assert.deepEqual(current, { page: 'trainer', settingsOpen: false });
  assert.equal(navigationHash(next), '#settings');
});
test('closing restores the background route and browser navigation dismisses the modal', () => {
  const open = { page: 'feedback', settingsOpen: true };
  const closed = navigatePrototype(open, open.page);
  assert.deepEqual(closed, { page: 'feedback', settingsOpen: false });
  assert.equal(navigationHash(closed), '#feedback');
  assert.deepEqual(navigatePrototype(open, '#analytics'), { page: 'analytics', settingsOpen: false });
});
test('reopening and legacy links retain the current background', () => {
  const current = { page: 'home', settingsOpen: true };
  assert.deepEqual(navigatePrototype(current, '#documents'), { page: 'documents', settingsOpen: false });
  assert.deepEqual(navigatePrototype(current, '#templates'), { page: 'templates', settingsOpen: false });
  assert.deepEqual(navigatePrototype(current, '#employees'), current);
  assert.deepEqual(navigatePrototype(current, '#settings'), current);
});
