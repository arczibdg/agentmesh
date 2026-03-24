import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { parseConfig } from '../../../packages/core/src/config/parser.js';

describe('parseConfig', () => {
  const savedEnv: Record<string, string | undefined> = {};

  beforeEach(() => {
    savedEnv['TEST_MODEL'] = process.env['TEST_MODEL'];
    savedEnv['TEST_TOKEN'] = process.env['TEST_TOKEN'];
  });

  afterEach(() => {
    for (const [key, value] of Object.entries(savedEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  it('parses valid YAML into MeshConfig with correct fields', () => {
    const yaml = `
version: "1"
agents:
  coder:
    role: "Write code"
    model: claude-sonnet-4-6
    timeout: 60s
    retries: 2
    checkpoint: true
    tools:
      mcp: [filesystem]
    memory:
      read: [shared]
      write: [shared]
`;
    const config = parseConfig(yaml);
    expect(config.version).toBe('1');
    expect(config.agents.coder.role).toBe('Write code');
    expect(config.agents.coder.model).toBe('claude-sonnet-4-6');
    expect(config.agents.coder.timeout).toBe('60s');
    expect(config.agents.coder.retries).toBe(2);
    expect(config.agents.coder.checkpoint).toBe(true);
    expect(config.agents.coder.tools?.mcp).toEqual(['filesystem']);
    expect(config.agents.coder.memory?.read).toEqual(['shared']);
  });

  it('resolves $env variables from process.env', () => {
    process.env['TEST_MODEL'] = 'claude-opus-4';
    process.env['TEST_TOKEN'] = 'secret123';

    const yaml = `
version: "1"
agents:
  bot:
    role: "Bot"
    model: $env.TEST_MODEL
    tools:
      http:
        - name: api
          url: https://api.example.com
          auth: "Bearer $env.TEST_TOKEN"
`;
    const config = parseConfig(yaml);
    expect(config.agents.bot.model).toBe('claude-opus-4');
    expect(config.agents.bot.tools?.http?.[0].auth).toBe('Bearer secret123');
  });

  it('throws on missing $env variable with clear error message', () => {
    delete process.env['MISSING_VAR'];

    const yaml = `
version: "1"
agents:
  bot:
    role: "Bot"
    model: $env.MISSING_VAR
`;
    expect(() => parseConfig(yaml)).toThrow('MISSING_VAR');
    expect(() => parseConfig(yaml)).toThrow('not set');
  });

  it('applies defaults to agents (model, timeout, retries)', () => {
    const yaml = `
version: "1"
defaults:
  model: claude-sonnet-4-6
  timeout: 120s
  retries: 3
agents:
  coder:
    role: "Write code"
  reviewer:
    role: "Review code"
`;
    const config = parseConfig(yaml);
    expect(config.agents.coder.model).toBe('claude-sonnet-4-6');
    expect(config.agents.coder.timeout).toBe('120s');
    expect(config.agents.coder.retries).toBe(3);
    expect(config.agents.reviewer.model).toBe('claude-sonnet-4-6');
  });

  it('agent-level values override defaults', () => {
    const yaml = `
version: "1"
defaults:
  model: claude-sonnet-4-6
  timeout: 120s
  retries: 3
agents:
  coder:
    role: "Write code"
    model: claude-opus-4
    timeout: 60s
    retries: 1
`;
    const config = parseConfig(yaml);
    expect(config.agents.coder.model).toBe('claude-opus-4');
    expect(config.agents.coder.timeout).toBe('60s');
    expect(config.agents.coder.retries).toBe(1);
  });
});
