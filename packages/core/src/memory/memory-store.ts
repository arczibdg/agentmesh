import { SqliteBackend } from './sqlite-backend.js';

interface MemoryPermissions {
  read: string[];
  write: string[];
}

interface MemoryStoreOptions {
  dbPath: string;
  namespaces: string[];
}

export class MemoryStore {
  private sqlite: SqliteBackend;
  private namespaces: Set<string>;
  private sessions: Map<string, Map<string, unknown>> = new Map();

  constructor(options: MemoryStoreOptions) {
    this.sqlite = new SqliteBackend(options.dbPath);
    this.namespaces = new Set(options.namespaces);
  }

  async get(namespace: string, key: string, agentName: string, permissions: MemoryPermissions): Promise<unknown> {
    if (!permissions.read.includes(namespace)) {
      throw new Error(`Agent '${agentName}' lacks read permission for namespace '${namespace}'`);
    }
    return this.sqlite.get(namespace, key);
  }

  async set(namespace: string, key: string, value: unknown, agentName: string, permissions: MemoryPermissions): Promise<void> {
    if (!permissions.write.includes(namespace)) {
      throw new Error(`Agent '${agentName}' lacks write permission for namespace '${namespace}'`);
    }
    return this.sqlite.set(namespace, key, value, agentName);
  }

  async list(namespace: string): Promise<string[]> {
    return this.sqlite.list(namespace);
  }

  async clear(namespace: string): Promise<void> {
    return this.sqlite.clear(namespace);
  }

  getSession(agentName: string, key: string): unknown {
    return this.sessions.get(agentName)?.get(key) ?? null;
  }

  setSession(agentName: string, key: string, value: unknown): void {
    if (!this.sessions.has(agentName)) {
      this.sessions.set(agentName, new Map());
    }
    this.sessions.get(agentName)!.set(key, value);
  }

  close(): void {
    this.sqlite.close();
  }
}
