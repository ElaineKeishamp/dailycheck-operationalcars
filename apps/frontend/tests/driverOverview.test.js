import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadDriverOverview } from '../src/utils/driverOverview.js';

const completedCheck = { daily_id: 'check-id', status: 'submitted' };

function clientFor(history, today) {
  return { async get(path) {
    const result = path.endsWith('/my-history') ? history : today;
    if (result instanceof Error) throw result;
    return { data: result };
  } };
}

test('only successful empty responses mean no history and no completed check today', async () => {
  const result = await loadDriverOverview(clientFor({ reports: [] }, { daily_check: null }));
  assert.deepEqual(result.history, { status: 'fulfilled', value: [] });
  assert.deepEqual(result.today, { status: 'fulfilled', value: null });
});

test('history failure remains an error while the completed report still loads', async () => {
  const result = await loadDriverOverview(clientFor(new Error('offline'), { daily_check: completedCheck }));
  assert.equal(result.history.status, 'rejected');
  assert.equal(result.today.value, completedCheck);
});

test('today lookup failure cannot masquerade as no completed report', async () => {
  const result = await loadDriverOverview(clientFor({ reports: [completedCheck] }, new Error('server unavailable')));
  assert.equal(result.history.status, 'fulfilled');
  assert.equal(result.today.status, 'rejected');
});

test('malformed payloads are errors, not empty fallback data', async () => {
  const result = await loadDriverOverview(clientFor({ reports: null }, {}));
  assert.equal(result.history.status, 'rejected');
  assert.equal(result.today.status, 'rejected');
});

test('a retry uses the new response and passes the abort signal to both requests', async () => {
  const controller = new AbortController();
  let calls = 0;
  const client = { async get(path, options) {
    assert.equal(options.signal, controller.signal);
    calls += 1;
    if (calls <= 2) throw new Error('temporary failure');
    return { data: path.endsWith('/my-history') ? { reports: [completedCheck] } : { daily_check: completedCheck } };
  } };
  const failed = await loadDriverOverview(client, controller.signal);
  assert.equal(failed.history.status, 'rejected');
  const retried = await loadDriverOverview(client, controller.signal);
  assert.deepEqual(retried.history.value, [completedCheck]);
  assert.equal(retried.today.value, completedCheck);
  assert.equal(calls, 4);
});
