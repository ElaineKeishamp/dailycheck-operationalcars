import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatDate, formatTime, formatDateTime } from '../src/utils/businessDate.js';

test('report calendar dates stay on the same day regardless of the device timezone', () => {
  assert.equal(formatDate('2026-11-24'), '24 Nov 2026');
});

test('report timestamps change day at midnight WIB, not midnight UTC', () => {
  assert.equal(formatDate('2026-11-23T16:59:59Z'), '23 Nov 2026');
  assert.equal(formatDate('2026-11-23T17:00:00Z'), '24 Nov 2026');
  assert.equal(formatTime('2026-11-23T17:00:00Z'), '00:00 WIB');
  assert.equal(formatDateTime('2026-11-23T17:15:00Z'), '24 Nov 2026, 00:15 WIB');
});

test('missing or invalid dates do not display an invalid time', () => {
  for (const value of [null, undefined, '', 'invalid']) {
    assert.equal(formatDate(value), '—');
    assert.equal(formatTime(value), '—');
    assert.equal(formatDateTime(value), '—');
  }
});
