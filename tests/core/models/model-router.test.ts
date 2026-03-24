import { describe, it, expect } from 'vitest';
import { parseModelString, ModelRouter } from '../../../packages/core/src/models/model-router.js';

describe('parseModelString', () => {
  it('parses anthropic models', () => {
    expect(parseModelString('claude-sonnet-4-6')).toEqual({
      provider: 'anthropic',
      model: 'claude-sonnet-4-6',
    });
    expect(parseModelString('claude-opus-4-6')).toEqual({
      provider: 'anthropic',
      model: 'claude-opus-4-6',
    });
  });

  it('parses openai models', () => {
    expect(parseModelString('gpt-4o')).toEqual({
      provider: 'openai',
      model: 'gpt-4o',
    });
  });

  it('parses ollama models with prefix', () => {
    const result = parseModelString('ollama/llama3');
    expect(result).toEqual({
      provider: 'ollama',
      model: 'llama3',
      baseUrl: 'http://localhost:11434',
    });
  });

  it('parses explicit provider prefix', () => {
    expect(parseModelString('openai/gpt-4o-mini')).toEqual({
      provider: 'openai',
      model: 'gpt-4o-mini',
    });
  });

  it('parses gemini models', () => {
    expect(parseModelString('gemini-pro')).toEqual({
      provider: 'google',
      model: 'gemini-pro',
    });
  });

  it('defaults unknown models to openai', () => {
    expect(parseModelString('some-random-model')).toEqual({
      provider: 'openai',
      model: 'some-random-model',
    });
  });
});

describe('ModelRouter', () => {
  it('creates a client for a known provider', () => {
    const router = new ModelRouter();
    const client = router.getClient('claude-sonnet-4-6');

    expect(client.provider).toBe('anthropic');
    expect(client.config.model).toBe('claude-sonnet-4-6');
    expect(client.circuitBreaker).toBeDefined();
  });

  it('creates separate clients for different models of same provider', () => {
    const router = new ModelRouter();
    const client1 = router.getClient('claude-sonnet-4-6');
    const client2 = router.getClient('claude-opus-4-6');

    expect(client1).not.toBe(client2);
    expect(client1.provider).toBe('anthropic');
    expect(client2.provider).toBe('anthropic');
  });

  it('reuses client for same model string', () => {
    const router = new ModelRouter();
    const client1 = router.getClient('claude-sonnet-4-6');
    const client2 = router.getClient('claude-sonnet-4-6');

    expect(client1).toBe(client2);
  });

  it('creates separate clients for different providers', () => {
    const router = new ModelRouter();
    const anthropic = router.getClient('claude-sonnet-4-6');
    const openai = router.getClient('gpt-4o');

    expect(anthropic).not.toBe(openai);
    expect(anthropic.provider).toBe('anthropic');
    expect(openai.provider).toBe('openai');
  });
});
