import { describe, it, expect } from 'vitest';
import { defineMemory } from '../../packages/core/src/plugins/defineMemory';

describe('defineMemory', () => {
  it('returns a valid memory backend config', () => {
    const mem = defineMemory({
      name: 'redis',
      configSchema: { url: 'string' },
      connect: async () => ({}),
      get: async () => null,
      set: async () => {},
      list: async () => [],
      clear: async () => {},
    });
    expect(mem.name).toBe('redis');
    expect(mem.name).toBeDefined();
  });
});
