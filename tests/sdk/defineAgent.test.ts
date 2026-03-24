import { describe, it, expect } from 'vitest';
import { defineAgent } from '../../packages/core/src/plugins/defineAgent';

describe('defineAgent', () => {
  it('returns a valid agent config with all fields', () => {
    const agent = defineAgent({
      role: 'Review PRs',
      defaultModel: 'claude-sonnet-4-6',
      defaultTools: ['github'],
      systemPrompt: 'You are a reviewer.',
      configSchema: { auto_approve: { type: 'boolean', default: false } },
    });
    expect(agent.role).toBe('Review PRs');
    expect(agent.defaultModel).toBe('claude-sonnet-4-6');
    expect(agent.defaultTools).toEqual(['github']);
    expect(agent.role).toBeDefined();
  });

  it('works with minimal fields', () => {
    const agent = defineAgent({ role: 'Do stuff' });
    expect(agent.role).toBe('Do stuff');
    expect(agent.defaultModel).toBeUndefined();
    expect(agent.defaultTools).toEqual([]);
    expect(agent.role).toBeDefined();
  });
});
