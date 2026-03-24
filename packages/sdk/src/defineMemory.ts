export interface MemoryBackendInput {
  name: string;
  configSchema: Record<string, string | { type: string; default?: unknown }>;
  connect: (config: Record<string, unknown>) => Promise<unknown>;
  get: (namespace: string, key: string) => Promise<unknown>;
  set: (namespace: string, key: string, value: unknown) => Promise<void>;
  list: (namespace: string) => Promise<string[]>;
  clear: (namespace: string) => Promise<void>;
}

export interface MemoryBackend extends MemoryBackendInput {
  __type: 'agentmesh:memory';
}

export function defineMemory(input: MemoryBackendInput): MemoryBackend {
  return { ...input, __type: 'agentmesh:memory' };
}
