import { describe, it, expect, afterEach } from 'vitest';
import { MeshRuntime } from '../../packages/core/src/index';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

describe('MeshRuntime lifecycle', () => {
  const tmpDir = path.join(os.tmpdir(), 'agentmesh-test-' + Date.now());
  let runtime: MeshRuntime;

  afterEach(async () => {
    if (runtime) await runtime.stop();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('loads config, registers agents, reports status', async () => {
    fs.mkdirSync(tmpDir, { recursive: true });
    const configPath = path.join(tmpDir, 'mesh.yaml');
    fs.writeFileSync(configPath, `
version: "1"
defaults:
  model: claude-sonnet-4-6
  timeout: 30s
memory:
  path: ${tmpDir}/memory.db
  namespaces:
    - shared
agents:
  alpha:
    role: "Test agent alpha"
    memory:
      read: [shared]
      write: [shared]
  beta:
    role: "Test agent beta"
    memory:
      read: [shared]
`);

    runtime = new MeshRuntime();
    await runtime.load({ configPath });

    const status = runtime.getStatus();
    expect(status.agents).toHaveLength(2);
    expect(status.agents[0].name).toBe('alpha');
    expect(status.agents[1].name).toBe('beta');
  });

  it('enforces memory permissions across agents', async () => {
    fs.mkdirSync(tmpDir, { recursive: true });
    const configPath = path.join(tmpDir, 'mesh.yaml');
    fs.writeFileSync(configPath, `
version: "1"
memory:
  path: ${tmpDir}/memory.db
  namespaces:
    - deploys
agents:
  writer:
    role: "Writes"
    model: gpt-4o
    memory:
      read: [deploys]
      write: [deploys]
  reader:
    role: "Reads"
    model: gpt-4o
    memory:
      read: [deploys]
`);

    runtime = new MeshRuntime();
    await runtime.load({ configPath });

    const mem = runtime.getMemory();
    // Writer can write
    await mem.set('deploys', 'last', 'v1', 'writer', { read: ['deploys'], write: ['deploys'] });
    // Reader can read
    const val = await mem.get('deploys', 'last', 'reader', { read: ['deploys'], write: [] });
    expect(val).toBe('v1');
    // Reader cannot write
    await expect(
      mem.set('deploys', 'x', 'y', 'reader', { read: ['deploys'], write: [] })
    ).rejects.toThrow('permission');
  });

  it('filters agents when agentFilter is provided', async () => {
    fs.mkdirSync(tmpDir, { recursive: true });
    const configPath = path.join(tmpDir, 'mesh.yaml');
    fs.writeFileSync(configPath, `
version: "1"
agents:
  alpha:
    role: "Agent A"
    model: gpt-4o
  beta:
    role: "Agent B"
    model: gpt-4o
  gamma:
    role: "Agent C"
    model: gpt-4o
`);

    runtime = new MeshRuntime();
    await runtime.load({ configPath, agentFilter: ['alpha', 'gamma'] });

    const status = runtime.getStatus();
    expect(status.agents).toHaveLength(2);
    expect(status.agents.map(a => a.name)).toEqual(['alpha', 'gamma']);
  });
});
