import test from 'node:test';
import assert from 'node:assert/strict';
import { initialNavigation, navigatePrototype, navigationHash, closeNavigationModal } from '../src/settings/navigation.js';

test('all settings links open the single modal with safe direct-entry return', () => {
  for (const hash of ['#settings', '#employees', '#settings-2', '#settings-3']) {
    const opened = initialNavigation(hash);
    assert.deepEqual(opened, { page: 'home', settingsModal: true });
    assert.equal(navigationHash(opened), '#settings');
    assert.deepEqual(closeNavigationModal(opened), { page: 'home' });
  }
});

test('ordinary direct links stay unchanged', () => {
  for (const page of ['home', 'clients', 'analytics', 'summary-report', 'category-report', 'trainer', 'documents', 'templates', 'account', 'settings-4']) {
    assert.deepEqual(initialNavigation('#' + page), { page });
  }
  assert.deepEqual(initialNavigation(''), { page: 'home' });
});

test('opening and reopening preserve the origin without mutation', () => {
  for (const page of ['home', 'clients', 'analytics', 'summary-report', 'category-report', 'trainer', 'templates', 'documents', 'settings-4']) {
    const current = Object.freeze({ page });
    const opened = navigatePrototype(current, 'settings');
    assert.deepEqual(opened, { page, settingsModal: true });
    assert.deepEqual(closeNavigationModal(opened), current);
    for (const alias of ['settings', 'settings-2', 'settings-3', 'employees']) {
      assert.deepEqual(navigatePrototype(opened, alias), opened);
    }
    assert.deepEqual(current, { page });
  }
});

test('reload restores the saved background', () => {
  assert.deepEqual(initialNavigation('#settings', { page: 'documents', settingsModal: true }), { page: 'documents', settingsModal: true });
});

test('previous prototype history entries migrate safely', () => {
  assert.deepEqual(initialNavigation('#settings', { page: 'settings' }), { page: 'home', settingsModal: true });
  assert.deepEqual(initialNavigation('#settings-2', { page: 'settings', settingsModal: true }), { page: 'home', settingsModal: true });
  assert.deepEqual(initialNavigation('#settings-3', { page: 'settings-3', returnPage: 'trainer' }), { page: 'trainer', settingsModal: true });
  for (const returnPage of [undefined, '', 'settings', 'settings-2', 'settings-3', 'employees']) {
    assert.deepEqual(initialNavigation('#settings-3', { page: 'settings-3', returnPage }), { page: 'home', settingsModal: true });
  }
});

test('ordinary navigation clears modal state', () => {
  for (const current of [{ page: 'trainer', settingsModal: true }, { page: 'documents', feedbackModal: true }, { page: 'settings-3', returnPage: 'trainer' }]) {
    assert.deepEqual(navigatePrototype(current, '#analytics'), { page: 'analytics' });
    assert.equal(navigationHash(navigatePrototype(current, 'home')), '#home');
  }
  const ordinary = Object.freeze({ page: 'templates' });
  assert.equal(closeNavigationModal(ordinary), ordinary);
});

test('feedback direct links and old page history open a modal over Home', () => {
  for (const saved of [undefined, { page: 'feedback' }, { page: 'settings-3', returnPage: 'feedback' }]) {
    const opened = initialNavigation('#feedback', saved);
    assert.deepEqual(opened, { page: 'home', feedbackModal: true });
    assert.equal(navigationHash(opened), '#feedback');
    assert.deepEqual(closeNavigationModal(opened), { page: 'home' });
  }
});

test('feedback preserves and restores every background on close and reload', () => {
  for (const page of ['home', 'analytics', 'trainer', 'templates', 'documents', 'account']) {
    const current = Object.freeze({ page });
    const opened = navigatePrototype(current, 'feedback');
    assert.deepEqual(opened, { page, feedbackModal: true });
    assert.deepEqual(initialNavigation('#feedback', opened), opened);
    assert.deepEqual(navigatePrototype(opened, 'feedback'), opened);
    assert.deepEqual(closeNavigationModal(opened), current);
  }
});

test('switching modal destinations preserves background without stacking', () => {
  const feedback = { page: 'documents', feedbackModal: true };
  const settings = { page: 'documents', settingsModal: true };
  assert.deepEqual(navigatePrototype(feedback, 'settings'), settings);
  assert.deepEqual(navigatePrototype(settings, 'feedback'), feedback);
});

test('fourth settings page stays distinct from the modal and supports comparison', () => {
  const page = { page: 'settings-4' };
  const modal = { page: 'settings-4', settingsModal: true };
  assert.equal(navigationHash(page), '#settings-4');
  assert.deepEqual(navigatePrototype(page, 'settings'), modal);
  assert.deepEqual(closeNavigationModal(modal), page);
  assert.deepEqual(navigatePrototype(modal, 'settings-4'), page);
});
