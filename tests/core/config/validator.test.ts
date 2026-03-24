import { describe, it, expect } from 'vitest';
import { validateConfig } from '../../../packages/core/src/config/validator.js';

describe('validateConfig', () => {
  it('passes for valid config', () => {
    const config = {
      version: '1',
      agents: {
        assistant: {
          role: 'General-purpose AI assistant',
        },
      },
    };
    expect(() => validateConfig(config)).not.toThrow();
  });

  it('fails for missing version', () => {
    const config = {
      agents: {
        assistant: {
          role: 'Bot',
        },
      },
    };
    expect(() => validateConfig(config)).toThrow('version');
  });

  it('fails for empty agents object', () => {
    const config = {
      version: '1',
      agents: {},
    };
    expect(() => validateConfig(config)).toThrow();
  });

  it('fails for unknown field on agent', () => {
    const config = {
      version: '1',
      agents: {
        assistant: {
          role: 'Bot',
          modl: 'claude-sonnet-4-6',
        },
      },
    };
    expect(() => validateConfig(config)).toThrow('modl');
  });

  it('fails for invalid version', () => {
    const config = {
      version: '2',
      agents: {
        assistant: {
          role: 'Bot',
        },
      },
    };
    expect(() => validateConfig(config)).toThrow('version');
  });
});
