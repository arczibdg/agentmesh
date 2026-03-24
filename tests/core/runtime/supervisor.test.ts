import { describe, it, expect } from 'vitest';
import { Supervisor } from '../../../packages/core/src/runtime/supervisor.js';

describe('Supervisor', () => {
  it('tracks registered agents', () => {
    const sup = new Supervisor();
    sup.register('reviewer', { role: 'code review' });

    expect(sup.getAgentNames()).toEqual(['reviewer']);
  });

  it('reports agent status as registered after registration', () => {
    const sup = new Supervisor();
    sup.register('planner', { role: 'planning' });

    expect(sup.getStatus('planner')).toBe('registered');
  });

  it('rejects duplicate agent names', () => {
    const sup = new Supervisor();
    sup.register('writer', { role: 'writing' });

    expect(() => sup.register('writer', { role: 'writing v2' })).toThrow(
      "Agent 'writer' is already registered",
    );
  });

  it('getStatusAll returns all agent statuses', () => {
    const sup = new Supervisor();
    sup.register('alpha', { role: 'role-a' });
    sup.register('beta', { role: 'role-b' });

    const all = sup.getStatusAll();
    expect(all).toEqual([
      { name: 'alpha', status: 'registered' },
      { name: 'beta', status: 'registered' },
    ]);
  });

  it('throws when getting status of unknown agent', () => {
    const sup = new Supervisor();

    expect(() => sup.getStatus('ghost')).toThrow("Agent 'ghost' not found");
  });
});
