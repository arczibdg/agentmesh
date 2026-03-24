import type { ModelConfig } from '@agentmesh/sdk';
import { CircuitBreaker } from './circuit-breaker.js';

export function parseModelString(model: string): ModelConfig {
  // Explicit provider prefix: "provider/model"
  if (model.includes('/')) {
    const [provider, ...rest] = model.split('/');
    const modelName = rest.join('/');

    if (provider === 'ollama') {
      return { provider: 'ollama', model: modelName, baseUrl: 'http://localhost:11434' };
    }

    return { provider, model: modelName };
  }

  // Infer provider from model name
  if (model.startsWith('claude')) {
    return { provider: 'anthropic', model };
  }

  if (model.startsWith('gpt-') || model.startsWith('o1') || model.startsWith('o3')) {
    return { provider: 'openai', model };
  }

  if (model.startsWith('gemini')) {
    return { provider: 'google', model };
  }

  // Default to openai
  return { provider: 'openai', model };
}

export interface ModelClient {
  provider: string;
  config: ModelConfig;
  circuitBreaker: CircuitBreaker;
  chat(params: { model: string; messages: Array<{ role: string; content: string }> }): Promise<string>;
}

export class ModelRouter {
  private clients = new Map<string, ModelClient>();

  getClient(modelString: string): ModelClient {
    const config = parseModelString(modelString);

    const existing = this.clients.get(config.provider);
    if (existing) {
      return existing;
    }

    const client: ModelClient = {
      provider: config.provider,
      config,
      circuitBreaker: new CircuitBreaker({ failureThreshold: 5, resetTimeoutMs: 30_000 }),
      chat: async () => {
        throw new Error(`Chat not implemented for provider: ${config.provider}`);
      },
    };

    this.clients.set(config.provider, client);
    return client;
  }
}
