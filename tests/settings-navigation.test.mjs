import test from 'node:test';
import assert from 'node:assert/strict';
import { initialNavigation, navigatePrototype, navigationHash, closeSettingsVariant } from '../src/settings/navigation.js';

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

test('direct links to settings variants have a safe Home return', () => {
  const modal = initialNavigation('#settings-2');
  assert.deepEqual(modal, { page: 'home', settingsModal: true });
  assert.equal(navigationHash(modal), '#settings-2');
  assert.deepEqual(closeSettingsVariant(modal), { page: 'home' });

  const dedicated = initialNavigation('#settings-3');
  assert.deepEqual(dedicated, { page: 'settings-3', returnPage: 'home' });
  assert.equal(navigationHash(dedicated), '#settings-3');
  assert.deepEqual(closeSettingsVariant(dedicated), { page: 'home' });
});

test('modal settings preserves the current page and closes back to it', () => {
  for (const page of ['home', 'analytics', 'trainer', 'templates', 'documents', 'settings']) {
    const current = Object.freeze({ page });
    const opened = navigatePrototype(current, 'settings-2');
    assert.deepEqual(opened, { page, settingsModal: true });
    assert.deepEqual(closeSettingsVariant(opened), current);
    assert.deepEqual(navigatePrototype(opened, '#settings-2'), opened);
    assert.deepEqual(current, { page });
  }
});

test('dedicated settings returns to its origin even when reopened', () => {
  for (const page of ['home', 'analytics', 'trainer', 'templates', 'documents', 'settings']) {
    const current = Object.freeze({ page });
    const opened = navigatePrototype(current, 'settings-3');
    assert.deepEqual(opened, { page: 'settings-3', returnPage: page });
    assert.deepEqual(closeSettingsVariant(opened), current);
    assert.deepEqual(navigatePrototype(opened, '#settings-3'), opened);
    assert.deepEqual(current, { page });
  }
});

test('switching between variants retains the original product page', () => {
  const original = Object.freeze({ page: 'documents' });
  const modal = Object.freeze(navigatePrototype(original, 'settings-2'));
  const dedicated = Object.freeze(navigatePrototype(modal, 'settings-3'));
  assert.deepEqual(dedicated, { page: 'settings-3', returnPage: 'documents' });
  assert.deepEqual(navigatePrototype(dedicated, 'settings-2'), modal);
  assert.deepEqual(closeSettingsVariant(dedicated), original);
  assert.deepEqual(closeSettingsVariant(modal), original);
});

test('ordinary navigation leaves either variant and drops its return metadata', () => {
  for (const current of [{ page: 'trainer', settingsModal: true }, { page: 'settings-3', returnPage: 'trainer' }]) {
    assert.deepEqual(navigatePrototype(current, '#analytics'), { page: 'analytics' });
    assert.deepEqual(navigatePrototype(current, '#employees'), { page: 'settings' });
    assert.deepEqual(navigatePrototype(current, '#settings'), { page: 'settings' });
    assert.equal(navigationHash(navigatePrototype(current, 'home')), '#home');
  }
});

test('return handles missing or recursive origins without reopening a variant', () => {
  for (const returnPage of [undefined, '', 'settings-2', 'settings-3']) {
    const current = { page: 'settings-3', returnPage };
    assert.deepEqual(closeSettingsVariant(current), { page: 'home' });
    assert.deepEqual(navigatePrototype(current, 'settings-2'), { page: 'home', settingsModal: true });
  }
  const ordinary = Object.freeze({ page: 'templates' });
  assert.equal(closeSettingsVariant(ordinary), ordinary);
});
