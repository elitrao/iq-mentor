import test from 'node:test';
import assert from 'node:assert/strict';
import { resetLocalEmployeeDirectory, LOCAL_DIRECTORY_RESET_KEY, LOCAL_DIRECTORY_BACKUP_KEY } from '../src/settings/local-directory-reset.js';

function storedDirectory() {
  const values = new Map([
    ['iq-mentor-departments', '[{"id":"opk","name":"ОРК 1"}]'],
    ['iq-mentor-demo-employees-v1', '[{"id":"demo-opk-1","name":"Анна"}]'],
    ['iq-mentor-employee-departments', '{"samoilenko":"opk","demo-opk-1":"opk"}'],
    ['iq-mentor-employee-roles', '{"samoilenko":"user","demo-opk-1":"admin"}'],
    ['iq-mentor-employee-view', 'cards'],
    ['unrelated-settings', 'keep'],
  ]);
  return { values, getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}

test('cleanup reaches independently stored browser rosters and preserves the owner role and unrelated preferences', () => {
  for (const hostname of ['localhost', '127.0.0.1', '[::1]']) {
    const storage = storedDirectory();
    const before = Object.fromEntries(storage.values);
    assert.equal(resetLocalEmployeeDirectory(storage, { hostname, port: '4170' }), true);
    assert.equal(storage.getItem('iq-mentor-departments'), '[]');
    assert.equal(storage.getItem('iq-mentor-demo-employees-v1'), '[]');
    assert.deepEqual(JSON.parse(storage.getItem('iq-mentor-employee-departments')), { samoilenko: '' });
    assert.deepEqual(JSON.parse(storage.getItem('iq-mentor-employee-roles')), { samoilenko: 'user' });
    assert.equal(storage.getItem('iq-mentor-employee-view'), 'cards');
    assert.equal(storage.getItem('unrelated-settings'), 'keep');
    const backup = JSON.parse(storage.getItem(LOCAL_DIRECTORY_BACKUP_KEY));
    assert.equal(backup['iq-mentor-departments'], before['iq-mentor-departments']);
    assert.equal(backup['iq-mentor-demo-employees-v1'], before['iq-mentor-demo-employees-v1']);
    storage.setItem('iq-mentor-departments', '[{"id":"new","name":"Новый"}]');
    assert.equal(resetLocalEmployeeDirectory(storage, { hostname, port: '4170' }), false);
    assert.equal(storage.getItem('iq-mentor-departments'), '[{"id":"new","name":"Новый"}]');
  }
});

test('hosted deployments and other local apps are not reset', () => {
  for (const location of [{ hostname: 'mentor.iqgroup.ai', port: '4170' }, { hostname: 'localhost', port: '4171' }]) {
    const storage = storedDirectory();
    const before = [...storage.values];
    assert.equal(resetLocalEmployeeDirectory(storage, location), false);
    assert.deepEqual([...storage.values], before);
    assert.equal(storage.getItem(LOCAL_DIRECTORY_RESET_KEY), null);
  }
});
