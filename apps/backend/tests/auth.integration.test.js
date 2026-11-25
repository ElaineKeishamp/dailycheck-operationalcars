const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('session revocation against PostgreSQL and the HTTP API', {
  skip: !process.env.TEST_DATABASE_URL,
}, async (t) => {
  const databaseUrl = new URL(process.env.TEST_DATABASE_URL);
  assert.equal(databaseUrl.pathname, '/dailycheck_session_test', 'Use a disposable dailycheck_session_test database');
  process.env.DATABASE_URL = databaseUrl.toString();
  Object.assign(process.env, {
    JWT_SECRET: 'isolated-integration-test-secret',
    S3_ENDPOINT: 'http://127.0.0.1:1', S3_REGION: 'us-east-1',
    S3_ACCESS_KEY: 'test', S3_SECRET_KEY: 'test', S3_BUCKET_NAME: 'test',
  });

  const pool = require('../src/config/db');
  const bcrypt = require('bcrypt');
  const jwt = require('jsonwebtoken');
  const users = require('../src/models/user.model');
  const { createSession } = require('../src/services/authSession.service');
  let schemaCreated = false;
  let server;
  t.after(async () => {
    try {
      if (server) await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
      if (schemaCreated) await pool.query('DROP TABLE public.check_photos, public.daily_checks, public.vehicles, public.users');
    } finally {
      await pool.end();
    }
  });
  const existing = await pool.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
  assert.equal(existing.rowCount, 0, 'The test database must not contain application tables');

  const { migrateDatabase } = require('../scripts/migrate-db');
  const initClient = await pool.connect();
  try {
    await migrateDatabase(initClient, { initialize: true, log() {} });
    schemaCreated = true;
    assert.equal((await pool.query('SELECT COUNT(*) FROM users')).rows[0].count, '0');
    await migrateDatabase(initClient, { log() {} });
    assert.equal((await pool.query("SELECT count(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'session_version'")).rows[0].count, '1');
    await pool.query('DROP TABLE public.check_photos, public.daily_checks, public.vehicles, public.users');
    schemaCreated = false;
  } finally {
    initClient.release();
  }

  const schema = fs.readFileSync(path.resolve(__dirname, '../../../deploy/staging/postgres/001-schema.sql'), 'utf8');
  const previousSchema = schema.replace(/^.*session_version.*\r?\n/gm, '');
  await pool.query(previousSchema);
  schemaCreated = true;
  const passwordHash = await bcrypt.hash('initial-password', 4);
  const existingUser = await pool.query(
    "INSERT INTO users (name, email, password_hash, role) VALUES ('Existing', 'existing@example.test', $1, 'driver') RETURNING users_id",
    [passwordHash]
  );
  const migration = fs.readFileSync(path.resolve(__dirname, '../db/2026-11-23-add-user-session-version.sql'), 'utf8');
  await pool.query(migration);
  assert.equal((await users.findById(existingUser.rows[0].users_id)).session_version, 0);

  const app = require('../src/app');
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  async function request(route, { token, method = 'GET', body } = {}) {
    const response = await fetch(base + route, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: response.status, body: await response.json(), headers: response.headers };
  }

  let admin;
  let target;
  t.beforeEach(async () => {
    await pool.query('TRUNCATE users CASCADE');
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES
       ('Reviewer', 'reviewer@example.test', $1, 'admin'),
       ('Target', 'target@example.test', $1, 'admin') RETURNING *`,
      [passwordHash]
    );
    [admin, target] = result.rows;
  });

  await t.test('login issues a versioned token and allows protected access', async () => {
    const login = await request('/api/auth/login', { method: 'POST', body: { email: target.email, password: 'initial-password' } });
    assert.equal(login.status, 200);
    assert.ok(login.headers.get('ratelimit'), 'Login endpoint must apply the rate limiter');
    assert.equal(jwt.verify(login.body.token, process.env.JWT_SECRET).session_version, 0);
    assert.equal((await request('/api/admin/users', { token: login.body.token })).status, 200);
  });

  await t.test('database dates and timestamps use WIB across the midnight boundary', async () => {
    const result = await pool.query(`SELECT
      current_setting('TimeZone') AS timezone,
      CURRENT_DATE AS today,
      (now() AT TIME ZONE 'Asia/Jakarta')::date AS jakarta_today,
      '2026-11-24 00:15:00'::timestamp AS local_timestamp,
      ('2026-11-23T16:59:59Z'::timestamptz AT TIME ZONE current_setting('TimeZone'))::date AS before_midnight,
      ('2026-11-23T17:00:00Z'::timestamptz AT TIME ZONE current_setting('TimeZone'))::date AS after_midnight`);
    const row = result.rows[0];
    assert.equal(row.timezone, 'Asia/Jakarta');
    assert.equal(row.today, row.jakarta_today);
    assert.equal(typeof row.today, 'string');
    assert.equal(row.before_midnight, '2026-11-23');
    assert.equal(row.after_midnight, '2026-11-24');
    assert.equal(row.local_timestamp.toISOString(), '2026-11-23T17:15:00.000Z');
  });

  await t.test('database migrations can be rerun without changing accounts and refuse initialization over data', async () => {
    const { migrateDatabase } = require('../scripts/migrate-db');
    const client = await pool.connect();
    try {
      await migrateDatabase(client, { log() {} });
      await migrateDatabase(client, { log() {} });
      const saved = await users.findById(target.users_id);
      assert.equal(saved.email, target.email);
      assert.equal(saved.password_hash, target.password_hash);
      assert.equal(saved.session_version, target.session_version);
      await assert.rejects(migrateDatabase(client, { initialize: true, log() {} }), /Database tidak kosong/);
      assert.equal((await pool.query('SELECT COUNT(*) FROM users')).rows[0].count, '2');
    } finally {
      client.release();
    }
  });

  await t.test('deactivation invalidates a token and reactivation does not restore it', async () => {
    const token = createSession(target).token;
    await users.updateUser(target.users_id, { status: 'inactive' });
    assert.equal((await request('/api/admin/users', { token })).status, 401);
    await users.updateUser(target.users_id, { status: 'active' });
    assert.equal((await users.findById(target.users_id)).session_version, 2);
    assert.equal((await request('/api/admin/users', { token })).status, 401);
    const fresh = createSession(await users.findById(target.users_id)).token;
    assert.equal((await request('/api/admin/users', { token: fresh })).status, 200);
  });

  await t.test('role changes revoke tokens; a fresh driver session cannot access admin routes', async () => {
    const token = createSession(target).token;
    const result = await request(`/api/admin/users/${target.users_id}`, {
      token: createSession(admin).token, method: 'PATCH', body: { role: 'driver' },
    });
    assert.equal(result.status, 200);
    assert.equal((await request('/api/admin/users', { token })).status, 401);
    const fresh = createSession(await users.findById(target.users_id)).token;
    assert.equal((await request('/api/admin/users', { token: fresh })).status, 403);
    assert.equal((await request('/api/vehicles', { token: fresh })).status, 200);
  });

  await t.test('saving unchanged role and status preserves the session', async () => {
    await users.updateUser(target.users_id, { role: 'admin', status: 'active' });
    assert.equal((await users.findById(target.users_id)).session_version, 0);
    assert.equal((await request('/api/admin/users', { token: createSession(target).token })).status, 200);
  });

  await t.test('admin password reset revokes every previous token and permits login with the temporary password', async () => {
    const token = createSession(target).token;
    const reset = await request(`/api/admin/users/${target.users_id}/reset-password`, {
      token: createSession(admin).token, method: 'PATCH',
    });
    assert.equal(reset.status, 200);
    assert.equal((await request('/api/admin/users', { token })).status, 401);
    const login = await request('/api/auth/login', { method: 'POST', body: { email: target.email, password: reset.body.temporary_password } });
    assert.equal(login.status, 200);
    assert.equal(login.body.user.must_change_password, true);
    assert.equal(jwt.verify(login.body.token, process.env.JWT_SECRET).session_version, 1);
    const blocked = await request('/api/admin/users', { token: login.body.token });
    assert.equal(blocked.status, 403);
    assert.equal(blocked.body.code, 'PASSWORD_CHANGE_REQUIRED');
    assert.equal((await request('/api/vehicles', { token: login.body.token })).status, 403);
    const changed = await request('/api/auth/change-password', {
      token: login.body.token, method: 'POST',
      body: { old_password: reset.body.temporary_password, new_password: 'replacement-password' },
    });
    assert.equal(changed.status, 200);
    assert.equal(changed.body.user.must_change_password, false);
    assert.equal((await request('/api/admin/users', { token: changed.body.token })).status, 200);
  });

  await t.test('password change replaces the current token and revokes the old one', async () => {
    const token = createSession(target).token;
    const changed = await request('/api/auth/change-password', {
      token, method: 'POST', body: { old_password: 'initial-password', new_password: 'replacement-password' },
    });
    assert.equal(changed.status, 200);
    assert.equal(changed.body.user.must_change_password, false);
    assert.equal(jwt.verify(changed.body.token, process.env.JWT_SECRET).session_version, 1);
    assert.equal((await request('/api/admin/users', { token })).status, 401);
    assert.equal((await request('/api/admin/users', { token: changed.body.token })).status, 200);
    assert.equal((await request('/api/auth/login', { method: 'POST', body: { email: target.email, password: 'initial-password' } })).status, 401);
  });

  await t.test('incorrect old password leaves the valid session intact', async () => {
    const token = createSession(target).token;
    const changed = await request('/api/auth/change-password', {
      token, method: 'POST', body: { old_password: 'incorrect', new_password: 'replacement-password' },
    });
    assert.equal(changed.status, 401);
    assert.equal(changed.body.code, undefined);
    assert.equal((await request('/api/admin/users', { token })).status, 200);
  });

  await t.test('a password change cannot overwrite a concurrent session revocation', async () => {
    await users.updatePassword(target.users_id, passwordHash, true);
    assert.equal(await users.updatePassword(target.users_id, 'stale-password-hash', false, 0), null);
    const current = await users.findById(target.users_id);
    assert.equal(current.password_hash, passwordHash);
    assert.equal(current.must_change_password, true);
    assert.equal(current.session_version, 1);
  });

  await t.test('deleted users and pre-migration tokens are rejected', async () => {
    const token = createSession(target).token;
    await pool.query('DELETE FROM users WHERE users_id = $1', [target.users_id]);
    assert.equal((await request('/api/admin/users', { token })).status, 401);
    const legacy = jwt.sign({ id: admin.users_id, role: 'admin' }, process.env.JWT_SECRET);
    assert.equal((await request('/api/admin/users', { token: legacy })).status, 401);
  });

  await t.test('invalid login and password types return 400 without echoing sensitive values', async () => {
    const login = await request('/api/auth/login', {
      method: 'POST', body: { email: target.email, password: { secret: 'private-test-value' } },
    });
    assert.equal(login.status, 400);
    assert.equal(typeof login.body.error, 'string');
    assert.equal(JSON.stringify(login.body).includes('private-test-value'), false);
    assert.ok(login.body.errors.every(error => !Object.hasOwn(error, 'value')));
    for (const newPassword of [123456, ['replacement-password'], { password: 'replacement-password' }]) {
      const result = await request('/api/auth/change-password', {
        token: createSession(target).token, method: 'POST',
        body: { old_password: 'initial-password', new_password: newPassword },
      });
      assert.equal(result.status, 400);
    }
    assert.equal((await users.findById(target.users_id)).session_version, 0);
  });

  await t.test('admin rejects malformed IDs, dates, text fields, and shared-account flags', async () => {
    const token = createSession(admin).token;
    for (const [route, method, body] of [
      ['/api/admin/users/not-a-uuid', 'PATCH', { status: 'inactive' }],
      ['/api/admin/users/not-a-uuid/reset-password', 'PATCH'],
      ['/api/admin/vehicles/not-a-uuid', 'PATCH', { status: 'inactive' }],
      ['/api/admin/daily-checks/not-a-uuid', 'GET'],
      ['/api/admin/daily-checks?date=2026-02-30', 'GET'],
      ['/api/admin/daily-checks?date=2026-11-23T12:00:00Z', 'GET'],
      ['/api/admin/daily-checks?driver_id=invalid', 'GET'],
      ['/api/admin/daily-checks?vehicle_id=invalid', 'GET'],
      ['/api/admin/users', 'POST', { name: '   ', email: 'new@example.test', role: 'driver' }],
      ['/api/admin/users', 'POST', { name: 'New', email: 'new@example.test', role: 'driver', is_shared_account: 'false' }],
      ['/api/admin/users', 'POST', { name: 'New', email: 'new@example.test', role: ['driver'] }],
      [`/api/admin/users/${target.users_id}`, 'PATCH', { status: ['active'] }],
      ['/api/admin/users', 'POST', { name: 'x'.repeat(101), email: 'new@example.test', role: 'driver' }],
      ['/api/admin/vehicles', 'POST', { plate_number: '   ', brand: 'Brand', model: 'Model' }],
      ['/api/admin/vehicles', 'POST', { plate_number: 'B 123 TEST', brand: 'x'.repeat(51), model: 'Model' }],
    ]) {
      const result = await request(route, { token, method, body });
      assert.equal(result.status, 400, `${method} ${route}`);
      assert.equal(typeof result.body.error, 'string');
    }
    assert.equal((await request('/api/admin/daily-checks?date=2024-02-29', { token })).status, 200);
    assert.equal((await pool.query('SELECT COUNT(*) FROM users')).rows[0].count, '2');
  });

  await t.test('driver rejects malformed IDs and out-of-range or nonnumeric coordinates', async () => {
    await users.updateUser(target.users_id, { role: 'driver' });
    const token = createSession(await users.findById(target.users_id)).token;
    const vehicleId = '448c2f14-924f-48f2-a43f-dd4d6cbbdd4a';
    for (const [route, method, body] of [
      ['/api/daily-checks', 'POST', { vehicle_id: 'invalid' }],
      ['/api/daily-checks/active?vehicle_id=invalid', 'GET'],
      ['/api/daily-checks/invalid/photos', 'GET'],
      ['/api/daily-checks/invalid/submit', 'POST'],
      ['/api/daily-checks', 'POST', { vehicle_id: vehicleId, gps_lat: 91, gps_long: 0 }],
      ['/api/daily-checks', 'POST', { vehicle_id: vehicleId, gps_lat: 0, gps_long: -181 }],
      ['/api/daily-checks', 'POST', { vehicle_id: vehicleId, gps_lat: [0], gps_long: 0 }],
      ['/api/daily-checks', 'POST', { vehicle_id: vehicleId, gps_lat: '0', gps_long: 0 }],
    ]) {
      assert.equal((await request(route, { token, method, body })).status, 400, `${method} ${route}`);
    }
  });

  await t.test('valid daily check preserves zero coordinates and trims shared driver name', async () => {
    await pool.query("UPDATE users SET role = 'driver', is_shared_account = TRUE WHERE users_id = $1", [target.users_id]);
    const vehicle = await pool.query("INSERT INTO vehicles (plate_number, brand, model) VALUES ('ZERO-GPS-TEST', 'Test', 'Model') RETURNING vehicle_id");
    const result = await request('/api/daily-checks', {
      token: createSession(await users.findById(target.users_id)).token,
      method: 'POST', body: {
        vehicle_id: vehicle.rows[0].vehicle_id, actual_driver_name: '  Test Driver  ', gps_lat: 0, gps_long: 0,
      },
    });
    assert.equal(result.status, 201);
    assert.equal(Number(result.body.daily_check.gps_lat), 0);
    assert.notEqual(result.body.daily_check.gps_lat, null);
    assert.equal(Number(result.body.daily_check.gps_long), 0);
    assert.notEqual(result.body.daily_check.gps_long, null);
    assert.equal(result.body.daily_check.actual_driver_name, 'Test Driver');
  });

  await t.test('admin edits persist name and shared-account flag; changing the flag revokes the old session', async () => {
    const oldToken = createSession(target).token;
    const updated = await request(`/api/admin/users/${target.users_id}`, {
      token: createSession(admin).token, method: 'PATCH',
      body: { name: '  Updated Name  ', is_shared_account: true },
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.user.name, 'Updated Name');
    assert.equal(updated.body.user.is_shared_account, true);
    const saved = await users.findById(target.users_id);
    assert.equal(saved.name, 'Updated Name');
    assert.equal(saved.is_shared_account, true);
    assert.equal(saved.role, 'admin');
    assert.equal(saved.status, 'active');
    assert.equal(saved.session_version, 1);
    assert.equal((await request('/api/admin/users', { token: oldToken })).status, 401);
    assert.equal((await request('/api/admin/users', { token: createSession(saved).token })).status, 200);
  });

  await t.test('name-only editing preserves the session, and false shared flag is saved correctly', async () => {
    const token = createSession(admin).token;
    const renamed = await request(`/api/admin/users/${target.users_id}`, {
      token, method: 'PATCH', body: { name: 'Renamed' },
    });
    assert.equal(renamed.status, 200);
    assert.equal((await users.findById(target.users_id)).session_version, 0);
    await users.updateUser(target.users_id, { is_shared_account: true });
    const unshared = await request(`/api/admin/users/${target.users_id}`, {
      token, method: 'PATCH', body: { is_shared_account: false },
    });
    assert.equal(unshared.status, 200);
    assert.equal(unshared.body.user.is_shared_account, false);
    assert.equal((await users.findById(target.users_id)).session_version, 2);
    assert.equal((await request(`/api/admin/users/${target.users_id}`, {
      token, method: 'PATCH', body: { name: '  ' },
    })).status, 400);
  });

  await t.test('admin cannot deactivate their own account and missing users or vehicles return 404', async () => {
    const token = createSession(admin).token;
    assert.equal((await request(`/api/admin/users/${admin.users_id}`, {
      token, method: 'PATCH', body: { status: 'inactive' },
    })).status, 400);
    assert.equal((await users.findById(admin.users_id)).status, 'active');
    const missing = '740ba058-e5b0-4f60-bd59-8ec61fe33771';
    for (const [route, body] of [
      [`/api/admin/users/${missing}`, { status: 'inactive' }],
      [`/api/admin/users/${missing}/reset-password`, undefined],
      [`/api/admin/vehicles/${missing}`, { status: 'inactive' }],
    ]) assert.equal((await request(route, { token, method: 'PATCH', body })).status, 404);
  });

  await t.test('inactive vehicles are excluded from driver selection and cannot start a check', async () => {
    const adminToken = createSession(admin).token;
    const created = await request('/api/admin/vehicles', {
      token: adminToken, method: 'POST', body: { plate_number: 'B 987 UJI', brand: 'Test', model: 'Model' },
    });
    assert.equal(created.status, 201);
    const vehicleId = created.body.vehicle.vehicle_id;
    assert.equal((await request(`/api/admin/vehicles/${vehicleId}`, {
      token: adminToken, method: 'PATCH', body: { status: 'inactive' },
    })).status, 200);
    await users.updateUser(target.users_id, { role: 'driver' });
    const driverToken = createSession(await users.findById(target.users_id)).token;
    const list = await request('/api/vehicles', { token: driverToken });
    assert.equal(list.status, 200);
    assert.equal(list.body.vehicles.some(vehicle => vehicle.vehicle_id === vehicleId), false);
    assert.equal((await request('/api/daily-checks', {
      token: driverToken, method: 'POST', body: { vehicle_id: vehicleId },
    })).status, 404);
    await request(`/api/admin/vehicles/${vehicleId}`, { token: adminToken, method: 'PATCH', body: { status: 'active' } });
    const active = await request('/api/vehicles', { token: driverToken });
    assert.equal(active.body.vehicles.some(vehicle => vehicle.vehicle_id === vehicleId), true);
  });

  await t.test('driver cannot read or mutate admin data and admin cannot perform driver operations', async () => {
    await users.updateUser(target.users_id, { role: 'driver' });
    const driverToken = createSession(await users.findById(target.users_id)).token;
    for (const [route, method, body] of [
      ['/api/admin/users', 'GET'],
      ['/api/admin/vehicles', 'GET'],
      ['/api/admin/daily-checks', 'GET'],
      ['/api/admin/users', 'POST', { name: 'Forbidden', email: 'forbidden@example.test', role: 'admin' }],
      [`/api/admin/users/${admin.users_id}`, 'PATCH', { status: 'inactive' }],
      [`/api/admin/users/${admin.users_id}/reset-password`, 'PATCH'],
      ['/api/admin/vehicles', 'POST', { plate_number: 'FORBIDDEN', brand: 'Test', model: 'Model' }],
    ]) assert.equal((await request(route, { token: driverToken, method, body })).status, 403);
    const adminToken = createSession(admin).token;
    assert.equal((await request('/api/daily-checks/my-history', { token: adminToken })).status, 403);
    assert.equal((await request('/api/daily-checks', {
      token: adminToken, method: 'POST', body: { vehicle_id: '740ba058-e5b0-4f60-bd59-8ec61fe33771' },
    })).status, 403);
    assert.equal((await users.findById(admin.users_id)).status, 'active');
  });

  await t.test('concurrent account creation returns one success and one duplicate conflict', async raceTest => {
    const originalLookup = users.findByEmail;
    let arrivals = 0;
    let release;
    const ready = new Promise(resolve => { release = resolve; });
    raceTest.mock.method(users, 'findByEmail', async (...args) => {
      const found = await originalLookup(...args);
      if (++arrivals === 2) release();
      await ready;
      return found;
    });
    const token = createSession(admin).token;
    const body = { name: 'New Driver', email: 'duplicate@example.test', role: 'driver' };
    const results = await Promise.all([0, 1].map(() => request('/api/admin/users', { token, method: 'POST', body })));
    assert.deepEqual(results.map(result => result.status).sort(), [201, 409]);
    assert.equal(results.find(result => result.status === 409).body.error, 'Email sudah terdaftar');
    assert.equal((await pool.query('SELECT COUNT(*) FROM users WHERE email = $1', [body.email])).rows[0].count, '1');
  });

  await t.test('concurrent vehicle creation returns one success and one duplicate conflict', async raceTest => {
    const vehicles = require('../src/models/vehicle.model');
    const originalLookup = vehicles.findByPlateNumber;
    let arrivals = 0;
    let release;
    const ready = new Promise(resolve => { release = resolve; });
    raceTest.mock.method(vehicles, 'findByPlateNumber', async (...args) => {
      const found = await originalLookup(...args);
      if (++arrivals === 2) release();
      await ready;
      return found;
    });
    const token = createSession(admin).token;
    const body = { plate_number: 'B 456 RACE', brand: 'Test', model: 'Model' };
    const results = await Promise.all([0, 1].map(() => request('/api/admin/vehicles', { token, method: 'POST', body })));
    assert.deepEqual(results.map(result => result.status).sort(), [201, 409]);
    assert.equal(results.find(result => result.status === 409).body.error, 'Plat nomor sudah terdaftar');
    assert.equal((await pool.query('SELECT COUNT(*) FROM vehicles WHERE plate_number = $1', [body.plate_number])).rows[0].count, '1');
  });

  await t.test('concurrent starts create one report and return 409 for the losing request', async (raceTest) => {
    const checks = require('../src/models/dailyCheck.model');
    const originalLookup = checks.findByVehicleAndDate;
    let arrivals = 0;
    let release;
    const bothChecked = new Promise(resolve => { release = resolve; });
    raceTest.mock.method(checks, 'findByVehicleAndDate', async (...args) => {
      const found = await originalLookup(...args);
      arrivals += 1;
      if (arrivals === 2) release();
      await bothChecked;
      return found;
    });
    await users.updateUser(target.users_id, { role: 'driver' });
    const token = createSession(await users.findById(target.users_id)).token;
    const vehicle = await pool.query("INSERT INTO vehicles (plate_number, brand, model) VALUES ('RACE-START-TEST', 'Test', 'Model') RETURNING vehicle_id");
    const vehicleId = vehicle.rows[0].vehicle_id;
    const results = await Promise.all([0, 1].map(() => request('/api/daily-checks', {
      token, method: 'POST', body: { vehicle_id: vehicleId, gps_lat: -6.2, gps_long: 106.8 },
    })));
    assert.deepEqual(results.map(result => result.status).sort(), [201, 409]);
    assert.equal(results.find(result => result.status === 409).body.error, 'Mobil ini sudah di-checking hari ini');
    assert.equal((await pool.query('SELECT COUNT(*) FROM daily_checks WHERE vehicle_id = $1', [vehicleId])).rows[0].count, '1');
  });

  await t.test('real login route blocks repeated failures while an existing admin session remains usable', async () => {
    let blocked;
    for (let attempt = 0; attempt <= 20; attempt += 1) {
      const result = await request('/api/auth/login', {
        method: 'POST', body: { email: 'missing@example.test', password: 'incorrect-password' },
      });
      if (result.status === 429) { blocked = result; break; }
      assert.equal(result.status, 401);
    }
    assert.ok(blocked, 'Login failures must be limited within 20 failures per window');
    assert.equal(blocked.body.code, 'LOGIN_RATE_LIMITED');
    assert.ok(Number(blocked.headers.get('retry-after')) > 0);
    assert.equal((await request('/api/admin/users', { token: createSession(admin).token })).status, 200);
  });
});
