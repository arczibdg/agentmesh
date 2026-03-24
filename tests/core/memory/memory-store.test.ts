import { describe, it, expect, afterEach } from 'vitest';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { unlinkSync } from 'node:fs';
import { MemoryStore } from '../../../packages/core/src/memory/memory-store.js';

describe('MemoryStore', () => {
  const dbPath = join(tmpdir(), `agentmesh-store-test-${Date.now()}-${Math.random().toString(36).slice(2)}.db`);
  let store: MemoryStore;

  afterEach(() => {
    store?.close();
    try { unlinkSync(dbPath); } catch { /* ignore */ }
    try { unlinkSync(dbPath + '-wal'); } catch { /* ignore */ }
    try { unlinkSync(dbPath + '-shm'); } catch { /* ignore */ }
  });

  it('rejects write to namespace agent lacks permission for', async () => {
    store = new MemoryStore({ dbPath, namespaces: ['shared', 'private'] });
    const permissions = { read: ['shared'], write: ['shared'] };

    await expect(
      store.set('private', 'key1', 'value', 'agent-a', permissions)
    ).rejects.toThrow("Agent 'agent-a' lacks write permission for namespace 'private'");
  });

  it('allows write to permitted namespace', async () => {
    store = new MemoryStore({ dbPath, namespaces: ['shared'] });
    const permissions = { read: ['shared'], write: ['shared'] };

    await store.set('shared', 'key1', { data: 42 }, 'agent-a', permissions);
    const result = await store.get('shared', 'key1', 'agent-a', permissions);
    expect(result).toEqual({ data: 42 });
  });

  it('rejects read from namespace agent lacks permission for', async () => {
    store = new MemoryStore({ dbPath, namespaces: ['shared', 'secret'] });
    const writePerms = { read: ['shared', 'secret'], write: ['shared', 'secret'] };
    const readPerms = { read: ['shared'], write: ['shared'] };

    await store.set('secret', 'key1', 'hidden', 'agent-admin', writePerms);

    await expect(
      store.get('secret', 'key1', 'agent-b', readPerms)
    ).rejects.toThrow("Agent 'agent-b' lacks read permission for namespace 'secret'");
  });

  it('session memory is isolated per agent and not persisted', async () => {
    store = new MemoryStore({ dbPath, namespaces: ['shared'] });

    store.setSession('agent-a', 'counter', 10);
    store.setSession('agent-b', 'counter', 20);

    expect(store.getSession('agent-a', 'counter')).toBe(10);
    expect(store.getSession('agent-b', 'counter')).toBe(20);
    expect(store.getSession('agent-c', 'counter')).toBeNull();
  });
});
