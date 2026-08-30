const { describe, it } = require('node:test');
const assert = require('node:assert');
const { InstanceLock } = require('../src/utils/instanceLock');

describe('Anti-Collision & Instance Lock Tests', () => {
  it('InstanceLock.isProcessAlive correctly checks active PID', () => {
    // Current PID must be alive
    assert.strictEqual(InstanceLock.isProcessAlive(process.pid), true);

    // Non-existent PID (e.g. 99999999) must be false
    assert.strictEqual(InstanceLock.isProcessAlive(99999999), false);
  });

  it('InstanceLock handles invalid PID inputs safely', () => {
    assert.strictEqual(InstanceLock.isProcessAlive(null), false);
    assert.strictEqual(InstanceLock.isProcessAlive(undefined), false);
    assert.strictEqual(InstanceLock.isProcessAlive('string'), false);
  });
});
