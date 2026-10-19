import test from 'node:test';
import assert from 'node:assert/strict';
import { initialNavigation, navigatePrototype, navigationHash } from '../src/settings/navigation.js';

test('direct Settings and legacy employee links open a standalone page', () => {
  for (const hash of ['#settings', '#employees']) assert.deepEqual(initialNavigation(hash), { page: 'settings' });
  assert.deepEqual(initialNavigation('#documents'), { page: 'documents' });
  assert.deepEqual(initialNavigation('#templates'), { page: 'templates' });
  assert.deepEqual(initialNavigation(''), { page: 'home' });
  assert.deepEqual(initialNavigation('#analytics'), { page: 'analytics' });
});
test('Settings replaces the current page without preserving a modal background', () => {
  const current = { page: 'trainer' };
  const next = navigatePrototype(current, 'settings');
  assert.deepEqual(next, { page: 'settings' });
  assert.deepEqual(current, { page: 'trainer' });
  assert.equal(navigationHash(next), '#settings');
});
test('leaving Settings follows normal page and browser navigation', () => {
  const current = { page: 'settings' };
  assert.deepEqual(navigatePrototype(current, 'feedback'), { page: 'feedback' });
  assert.equal(navigationHash(navigatePrototype(current, 'home')), '#home');
  assert.deepEqual(navigatePrototype(current, '#analytics'), { page: 'analytics' });
});
test('reopening and legacy links consistently resolve to Settings', () => {
  const current = { page: 'settings' };
  assert.deepEqual(navigatePrototype(current, '#documents'), { page: 'documents' });
  assert.deepEqual(navigatePrototype(current, '#templates'), { page: 'templates' });
  assert.deepEqual(navigatePrototype(current, '#employees'), current);
  assert.deepEqual(navigatePrototype(current, '#settings'), current);
});
