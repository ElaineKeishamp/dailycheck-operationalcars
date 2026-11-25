const { test } = require('node:test');
const assert = require('node:assert/strict');
const users = require('../src/models/user.model');
const vehicles = require('../src/models/vehicle.model');
const checks = require('../src/models/dailyCheck.model');
const { getTodayStatus } = require('../src/controllers/admin.controller');

test('dashboard counts only active drivers and vehicles, excluding former roles and inactive records', async (t) => {
  const activeDrivers = [
    { users_id: 'checked-driver' }, { users_id: 'pending-driver' },
  ];
  t.mock.method(users, 'getActiveDrivers', async () => activeDrivers);
  t.mock.method(checks, 'getCheckedTodayUserIds', async () => [
    'checked-driver', 'inactive-driver', 'former-driver-now-admin',
  ]);
  t.mock.method(vehicles, 'getAllVehicles', async () => [
    { vehicle_id: 'checked-car', status: 'active' },
    { vehicle_id: 'pending-car', status: 'active' },
    { vehicle_id: 'inactive-car', status: 'inactive' },
  ]);
  t.mock.method(checks, 'getCheckedTodayVehicleIds', async () => [
    'checked-car', 'inactive-car',
  ]);
  let body;
  await getTodayStatus({}, { json(value) { body = value; } });
  assert.equal(body.total_driver, 2);
  assert.equal(body.sudah_checking, 1);
  assert.deepEqual(body.belum_checking, [{ users_id: 'pending-driver' }]);
  assert.equal(body.driver_stats.total, body.driver_stats.sudah_checking + body.driver_stats.belum_checking.length);
  assert.equal(body.vehicle_stats.total, 2);
  assert.equal(body.vehicle_stats.sudah_checking, 1);
  assert.deepEqual(body.vehicle_stats.belum_checking, [{ vehicle_id: 'pending-car', status: 'active' }]);
});

test('dashboard with no active accounts or vehicles reports zero even if historical checks exist', async (t) => {
  t.mock.method(users, 'getActiveDrivers', async () => []);
  t.mock.method(checks, 'getCheckedTodayUserIds', async () => ['inactive-driver']);
  t.mock.method(vehicles, 'getAllVehicles', async () => [{ vehicle_id: 'inactive-car', status: 'inactive' }]);
  t.mock.method(checks, 'getCheckedTodayVehicleIds', async () => ['inactive-car']);
  let body;
  await getTodayStatus({}, { json(value) { body = value; } });
  assert.equal(body.sudah_checking, 0);
  assert.equal(body.vehicle_stats.sudah_checking, 0);
  assert.deepEqual(body.belum_checking, []);
});
