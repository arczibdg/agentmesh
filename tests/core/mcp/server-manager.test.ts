import { describe, it, expect, beforeEach } from 'vitest';
import { McpServerManager } from '../../../packages/core/src/mcp/server-manager.js';

describe('McpServerManager', () => {
  let manager: McpServerManager;

  beforeEach(() => {
    manager = new McpServerManager();
  });

  it('registers server definitions', () => {
    manager.register('github', { command: 'npx', args: ['@modelcontextprotocol/server-github'] });
    expect(manager.isRegistered('github')).toBe(true);
    expect(manager.isRegistered('unknown')).toBe(false);
  });

  it('throws when requesting unregistered server', async () => {
    await expect(manager.getTools('unknown')).rejects.toThrow('MCP server "unknown" is not registered');
  });

  it('tracks which agents use which servers', () => {
    manager.register('github', { command: 'npx' });
    manager.addConsumer('github', 'coder');
    manager.addConsumer('github', 'reviewer');
    expect(manager.getConsumers('github')).toEqual(expect.arrayContaining(['coder', 'reviewer']));
    expect(manager.getConsumers('github')).toHaveLength(2);

    manager.removeConsumer('github', 'coder');
    expect(manager.getConsumers('github')).toEqual(['reviewer']);
  });

  it('reports server health status', () => {
    manager.register('github', { command: 'npx' });
    expect(manager.getStatus('github')).toBe('registered');
  });

  it('start transitions status to running', async () => {
    manager.register('github', { command: 'npx' });
    await manager.start('github');
    expect(manager.getStatus('github')).toBe('running');
  });

  it('shutdown transitions status to stopped', async () => {
    manager.register('github', { command: 'npx' });
    await manager.start('github');
    await manager.shutdown('github');
    expect(manager.getStatus('github')).toBe('stopped');
  });

  it('shutdownAll stops all servers', async () => {
    manager.register('github', { command: 'npx' });
    manager.register('slack', { command: 'node', args: ['slack-server.js'] });
    await manager.start('github');
    await manager.start('slack');
    await manager.shutdownAll();
    expect(manager.getStatus('github')).toBe('stopped');
    expect(manager.getStatus('slack')).toBe('stopped');
  });
});
