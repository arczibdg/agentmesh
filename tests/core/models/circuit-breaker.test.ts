import { describe, it, expect, vi } from 'vitest';
import { CircuitBreaker } from '../../../packages/core/src/models/circuit-breaker.js';

describe('CircuitBreaker', () => {
  it('starts in closed state and allows calls', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 3, resetTimeoutMs: 1000 });
    expect(cb.isOpen()).toBe(false);
    expect(cb.isHalfOpen()).toBe(false);

    const result = await cb.call(async () => 'ok');
    expect(result).toBe('ok');
  });

  it('opens after reaching failure threshold', () => {
    const cb = new CircuitBreaker({ failureThreshold: 3, resetTimeoutMs: 1000 });

    for (let i = 0; i < 3; i++) {
      cb.recordFailure();
    }

    expect(cb.isOpen()).toBe(true);
  });

  it('rejects calls when open', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 2, resetTimeoutMs: 1000 });

    cb.recordFailure();
    cb.recordFailure();

    await expect(cb.call(async () => 'ok')).rejects.toThrow(/circuit open/i);
  });

  it('transitions to half-open after reset timeout', () => {
    const cb = new CircuitBreaker({ failureThreshold: 2, resetTimeoutMs: 100 });

    cb.recordFailure();
    cb.recordFailure();
    expect(cb.isOpen()).toBe(true);

    vi.useFakeTimers();
    vi.advanceTimersByTime(150);

    expect(cb.isHalfOpen()).toBe(true);
    expect(cb.isOpen()).toBe(false);

    vi.useRealTimers();
  });

  it('closes again after successful call in half-open', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 2, resetTimeoutMs: 100 });

    cb.recordFailure();
    cb.recordFailure();

    vi.useFakeTimers();
    vi.advanceTimersByTime(150);

    const result = await cb.call(async () => 'recovered');
    expect(result).toBe('recovered');
    expect(cb.isOpen()).toBe(false);
    expect(cb.isHalfOpen()).toBe(false);

    vi.useRealTimers();
  });

  it('resets failure count on success', () => {
    const cb = new CircuitBreaker({ failureThreshold: 3, resetTimeoutMs: 1000 });

    cb.recordFailure();
    cb.recordFailure();
    cb.recordSuccess();

    // Should not be open — success reset the counter
    cb.recordFailure();
    expect(cb.isOpen()).toBe(false);
  });
});
