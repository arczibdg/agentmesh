import YAML from 'yaml';
import type { MeshConfig } from './types.js';

export function parseConfig(yamlContent: string): MeshConfig {
  const raw = YAML.parse(yamlContent) as MeshConfig;
  const resolved = resolveEnvVars(raw);
  return applyDefaults(resolved);
}

function resolveEnvVars(obj: unknown): any {
  if (typeof obj === 'string') {
    const exactMatch = obj.match(/^\$env\.(.+)$/);
    if (exactMatch) {
      const envVar = exactMatch[1];
      const value = process.env[envVar];
      if (value === undefined) {
        throw new Error(
          `Environment variable ${envVar} is not set. Add it to your .env file or export it.`,
        );
      }
      return value;
    }
    return obj.replace(/\$env\.([A-Z_][A-Z0-9_]*)/g, (_, envVar) => {
      const value = process.env[envVar];
      if (value === undefined) {
        throw new Error(
          `Environment variable ${envVar} is not set. Add it to your .env file or export it.`,
        );
      }
      return value;
    });
  }
  if (Array.isArray(obj)) return obj.map(resolveEnvVars);
  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = resolveEnvVars(value);
    }
    return result;
  }
  return obj;
}

function applyDefaults(config: MeshConfig): MeshConfig {
  if (!config.defaults) return config;
  const { model, timeout, retries, checkpoint } = config.defaults;
  for (const agent of Object.values(config.agents)) {
    if (model && !agent.model) agent.model = model;
    if (timeout && !agent.timeout) agent.timeout = timeout;
    if (retries !== undefined && agent.retries === undefined) agent.retries = retries;
    if (checkpoint !== undefined && agent.checkpoint === undefined) agent.checkpoint = checkpoint;
  }
  return config;
}
