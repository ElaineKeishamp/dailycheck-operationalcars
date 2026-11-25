const { test } = require('node:test');
const assert = require('node:assert/strict');
const { databaseTypes } = require('../src/config/databaseTime');

test('database calendar dates remain strings without a host timezone conversion', () => {
  assert.equal(databaseTypes.getTypeParser(1082)('2026-11-24'), '2026-11-24');
});

test('timezone-free database timestamps are interpreted as WIB regardless of server timezone', () => {
  assert.equal(databaseTypes.getTypeParser(1114)('2026-11-24 00:15:00.123').toISOString(), '2026-11-23T17:15:00.123Z');
  assert.equal(databaseTypes.getTypeParser(1114)('2026-11-23 23:59:59').toISOString(), '2026-11-23T16:59:59.000Z');
});

test('timezone-aware timestamps and other PostgreSQL types keep their standard parsers', () => {
  assert.equal(databaseTypes.getTypeParser(1184)('2026-11-24 00:15:00+07').toISOString(), '2026-11-23T17:15:00.000Z');
  assert.equal(databaseTypes.getTypeParser(23)('42'), 42);
});
