function createCircuitBreaker({
  name = 'default',
  failureThreshold = 3,
  failureWindow = 30000, // Time window to track failures
  initialBackoff = 2000, // Backoff duration (start)
  maxBackoff = 30000, // Max backoff duration
  testRequest = null,
} = {}) {
  let state = 'CLOSED';
  let failures = [];
  let backoff = initialBackoff;
  let lastFailureTime = null;
  let lastRecoveryCheck = 0;
  let checkingRecovery = false;

  function log(message) {
    console.log(`[CircuitBreaker:${name}] ${message}`);
  }

  function recordFailure() {
    const now = Date.now();
    failures.push(now);
    failures = failures.filter((ts) => now - ts <= failureWindow);
    lastFailureTime = now;
  }

  function shouldOpenCircuit() {
    return failures.length >= failureThreshold;
  }

  function isBackoffComplete() {
    return Date.now() - lastFailureTime >= backoff;
  }

  async function tryRecovery() {
    if (!testRequest || checkingRecovery || !isBackoffComplete()) return;

    checkingRecovery = true;
    lastRecoveryCheck = Date.now();

    log('Attempting recovery test...');

    try {
      const success = await testRequest();
      if (success) {
        failures = [];
        backoff = initialBackoff;
        state = 'CLOSED';
        log('Recovery test passed. Circuit CLOSED.');
      } else {
        backoff = Math.min(backoff * 2, maxBackoff);
        log('Recovery test failed. Increasing backoff.');
      }
    } catch {
      backoff = Math.min(backoff * 2, maxBackoff);
      log(`Recovery test threw an error: ${err.message}`);
    } finally {
      checkingRecovery = false;
    }
  }

  return async function withCircuitBreaker(fn, args = []) {
    if (state === 'OPEN') {
      await tryRecovery();
      if (state === 'OPEN') {
        return {
          status: 503,
          error: 'Service is temporarily unavailable due to repeated failures.',
          message: `Circuit breaker is OPEN. Retry after backoff of ${Math.round(
            backoff / 1000
          )} seconds.`,
        };
      }
    }

    try {
      const result = await fn(...args);
      failures = [];
      backoff = initialBackoff;
      return {
        status: 200,
        message: 'Request succeeded.',
        data: result,
      };
    } catch (error) {
      recordFailure();
      if (shouldOpenCircuit()) {
        state = 'OPEN';
        log('Too many failures. Circuit is now OPEN.');
      }
      return {
        status: 502,
        error: 'The request to the external service failed.',
        message: error.message || 'Unknown error',
      };
    }
  };
}

module.exports = createCircuitBreaker;
