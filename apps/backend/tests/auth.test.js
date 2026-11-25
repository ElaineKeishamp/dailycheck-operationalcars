const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const userModel = require('../src/models/user.model');
const { verifyToken, verifyPasswordChangeToken, requireAdmin, requireDriver } = require('../src/middlewares/auth');
const { createSession } = require('../src/services/authSession.service');

process.env.JWT_SECRET = 'isolated-auth-test-secret';

let user;
beforeEach(() => {
  user = {
    users_id: 'test-user', name: 'Test Driver', email: 'driver@example.test',
    role: 'driver', status: 'active', session_version: 2,
    is_shared_account: false, must_change_password: false,
  };
});

function response() {
  return {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

function token(claims = {}, options = {}) {
  return jwt.sign({ id: user.users_id, role: user.role, session_version: 2, ...claims },
    process.env.JWT_SECRET, { expiresIn: '12h', ...options });
}

async function authenticate(t, authorization, lookup = async () => user) {
  const find = t.mock.method(userModel, 'findSessionById', lookup);
  const req = { headers: { authorization } };
  const res = response();
  let passed = false;
  await verifyToken(req, res, () => { passed = true; });
  return { req, res, passed, find };
}

test('new session has a version, expiry, and only public user fields', () => {
  const session = createSession({ ...user, password_hash: 'private' });
  const decoded = jwt.verify(session.token, process.env.JWT_SECRET);
  assert.equal(decoded.session_version, 2);
  assert.equal(decoded.exp - decoded.iat, 12 * 60 * 60);
  assert.equal(session.user.id, user.users_id);
  assert.equal('password_hash' in session.user, false);
  assert.equal('session_version' in session.user, false);
});

test('session creation fails if the database has not supplied a valid version', () => {
  assert.throws(() => createSession({ ...user, session_version: undefined }));
  assert.throws(() => createSession({ ...user, session_version: -1 }));
});

test('active session uses the current database role, not the JWT role', async (t) => {
  const result = await authenticate(t, `Bearer ${token({ role: 'admin' })}`);
  assert.equal(result.passed, true);
  assert.equal(result.req.user.role, 'driver');
  assert.equal(result.find.mock.calls.length, 1);
  const res = response();
  requireAdmin(result.req, res, () => assert.fail('driver reached admin handler'));
  assert.equal(res.statusCode, 403);
  let driverPassed = false;
  requireDriver(result.req, response(), () => { driverPassed = true; });
  assert.equal(driverPassed, true);
});

test('inactive and deleted accounts are rejected', async (t) => {
  user.status = 'inactive';
  const inactive = await authenticate(t, `Bearer ${token()}`);
  assert.equal(inactive.res.statusCode, 401);
  assert.equal(inactive.passed, false);
  const deleted = await authenticate(t, `Bearer ${token()}`, async () => null);
  assert.equal(deleted.res.statusCode, 401);
  assert.equal(deleted.res.body.code, 'SESSION_EXPIRED');
});

test('revoked version is rejected even after account reactivation', async (t) => {
  user.session_version = 4;
  const result = await authenticate(t, `Bearer ${token()}`);
  assert.equal(result.res.statusCode, 401);
  assert.equal(result.passed, false);
});

test('legacy tokens and upload tickets cannot authenticate', async (t) => {
  for (const claims of [
    { id: 'test-user', role: 'admin' },
    { purpose: 'photo-upload', users_id: 'test-user' },
    { id: 'test-user', session_version: -1 },
    { id: 'test-user', session_version: '2' },
  ]) {
    const signed = jwt.sign(claims, process.env.JWT_SECRET);
    const result = await authenticate(t, `Bearer ${signed}`);
    assert.equal(result.res.statusCode, 401);
    assert.equal(result.passed, false);
    assert.equal(result.find.mock.calls.length, 0);
  }
});

test('missing, malformed, expired, and invalidly signed credentials are rejected before database access', async (t) => {
  const invalidSignature = jwt.sign({ id: user.users_id, session_version: 2 }, 'another-secret');
  for (const header of [undefined, 'Basic abc', 'Bearer', `Bearer ${token()} extra`,
    `Bearer ${token({}, { expiresIn: -1 })}`, `Bearer ${invalidSignature}`]) {
    const result = await authenticate(t, header);
    assert.equal(result.res.statusCode, 401);
    assert.equal(result.passed, false);
    assert.equal(result.find.mock.calls.length, 0);
  }
});

test('database failures deny access with 503 rather than invalidating the session', async (t) => {
  const result = await authenticate(t, `Bearer ${token()}`, async () => { throw new Error('database unavailable'); });
  assert.equal(result.res.statusCode, 503);
  assert.equal(result.passed, false);
  assert.equal(result.res.body.code, undefined);
});

test('temporary-password accounts cannot access protected operations for either role', async (t) => {
  user.must_change_password = true;
  for (const role of ['admin', 'driver']) {
    user.role = role;
    const result = await authenticate(t, `Bearer ${token()}`);
    assert.equal(result.passed, false);
    assert.equal(result.res.statusCode, 403);
    assert.equal(result.res.body.code, 'PASSWORD_CHANGE_REQUIRED');
  }
});

test('temporary-password sessions can authenticate for password change, but revoked sessions cannot', async (t) => {
  user.must_change_password = true;
  t.mock.method(userModel, 'findSessionById', async () => user);
  const req = { headers: { authorization: `Bearer ${token()}` } };
  let passed = false;
  await verifyPasswordChangeToken(req, response(), () => { passed = true; });
  assert.equal(passed, true);
  assert.equal(req.user.must_change_password, true);

  user.session_version = 3;
  const res = response();
  await verifyPasswordChangeToken(req, res, () => assert.fail('revoked session reached password handler'));
  assert.equal(res.statusCode, 401);
});
