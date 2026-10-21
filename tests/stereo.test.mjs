import test from 'node:test';
import assert from 'node:assert/strict';
import { getStereoFormat, setStereoFormat } from '../src/settings/stereo.js';

test('stereo restores explicit formats and legacy automatic/manual settings', () => {
  assert.equal(getStereoFormat({ format: 'operator-left', mode: 'Автоматически' }), 'operator-left');
  assert.equal(getStereoFormat({ mode: 'Автоматически' }), 'auto');
  assert.equal(getStereoFormat({ mode: 'Стерео', left: 'Клиент' }), 'client-left');
  assert.equal(getStereoFormat({ mode: 'Стерео', left: 'Сотрудник' }), 'operator-left');
});

test('each manual format assigns both channels without mutating saved data', () => {
  const original = { mode: 'Автоматически', extra: true };
  const client = setStereoFormat(original, 'client-left');
  assert.deepEqual([client.left, client.right, client.mode], ['Клиент', 'Сотрудник', 'Стерео']);
  const operator = setStereoFormat(client, 'operator-left');
  assert.deepEqual([operator.left, operator.right], ['Сотрудник', 'Клиент']);
  assert.deepEqual(original, { mode: 'Автоматически', extra: true });
  assert.equal(operator.extra, true);
});

test('automatic mode retains manual mapping and survives serialization', () => {
  const original = setStereoFormat({}, 'client-left');
  const automatic = setStereoFormat(original, 'auto');
  assert.equal(automatic.mode, 'Автоматически');
  assert.equal(automatic.left, 'Клиент');
  assert.equal(getStereoFormat(JSON.parse(JSON.stringify(automatic))), 'auto');
  assert.equal(setStereoFormat(original, 'invalid'), original);
});
