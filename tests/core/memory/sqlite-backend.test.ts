import { describe, it, expect, afterEach } from 'vitest';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { unlinkSync } from 'node:fs';
import { SqliteBackend } from '../../../packages/core/src/memory/sqlite-backend.js';

describe('SqliteBackend', () => {
  const dbPath = join(tmpdir(), `agentmesh-test-${Date.now()}-${Math.random().toString(36).slice(2)}.db`);
  let backend: SqliteBackend;

  afterEach(() => {
    backend?.close();
    try { unlinkSync(dbPath); } catch { /* ignore */ }
    try { unlinkSync(dbPath + '-wal'); } catch { /* ignore */ }
    try { unlinkSync(dbPath + '-shm'); } catch { /* ignore */ }
  });

  it('set and get a value with nested fields', async () => {
    backend = new SqliteBackend(dbPath);
    const value = { name: 'test', nested: { count: 42, items: ['a', 'b'] } };
    await backend.set('ns1', 'key1', value, 'agent-a');
    const result = await backend.get('ns1', 'key1');
    expect(result).toEqual(value);
  });

  it('returns null for missing key', async () => {
    backend = new SqliteBackend(dbPath);
    const result = await backend.get('ns1', 'nonexistent');
    expect(result).toBeNull();
  });

  it('lists keys in namespace with isolation', async () => {
    backend = new SqliteBackend(dbPath);
    await backend.set('ns1', 'a', 1, 'agent-a');
    await backend.set('ns1', 'b', 2, 'agent-a');
    await backend.set('ns2', 'c', 3, 'agent-b');

    const ns1Keys = await backend.list('ns1');
    const ns2Keys = await backend.list('ns2');

    expect(ns1Keys).toEqual(['a', 'b']);
    expect(ns2Keys).toEqual(['c']);
  });

  it('clears namespace without affecting others', async () => {
    backend = new SqliteBackend(dbPath);
    await backend.set('ns1', 'a', 1, 'agent-a');
    await backend.set('ns2', 'b', 2, 'agent-b');

    await backend.clear('ns1');

    expect(await backend.list('ns1')).toEqual([]);
    expect(await backend.list('ns2')).toEqual(['b']);
  });

  it('overwrites existing key', async () => {
    backend = new SqliteBackend(dbPath);
    await backend.set('ns1', 'key1', 'old', 'agent-a');
    await backend.set('ns1', 'key1', 'new', 'agent-b');

    const result = await backend.get('ns1', 'key1');
    expect(result).toBe('new');
  });
});
