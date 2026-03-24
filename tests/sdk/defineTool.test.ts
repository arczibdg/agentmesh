import { describe, it, expect } from 'vitest';
import { defineTool } from '../../packages/core/src/plugins/defineTool';

describe('defineTool', () => {
  it('returns a valid tool adapter config', () => {
    const tool = defineTool({
      name: 'linear',
      description: 'Manage Linear issues',
      auth: { type: 'bearer', envVar: 'LINEAR_API_KEY' },
      tools: [{
        name: 'create_issue',
        description: 'Create a Linear issue',
        parameters: { title: 'string', team: 'string' },
        handler: async () => ({ id: '123' }),
      }],
    });
    expect(tool.name).toBe('linear');
    expect(tool.tools).toHaveLength(1);
    expect(tool.name).toBeDefined();
  });
});
