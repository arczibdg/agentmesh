import type { McpServerDef } from '../config/types.js';

type ServerStatus = 'registered' | 'starting' | 'running' | 'failed' | 'stopped';

interface ManagedServer {
  def: McpServerDef;
  status: ServerStatus;
  consumers: Set<string>;
  process?: unknown;
}

export class McpServerManager {
  private servers = new Map<string, ManagedServer>();

  register(name: string, def: McpServerDef): void {
    this.validateCommand(def.command);
    this.servers.set(name, {
      def,
      status: 'registered',
      consumers: new Set(),
    });
  }

  private validateCommand(command: string): void {
    if (/[;&|`$(){}]/.test(command)) {
      throw new Error(`MCP server command contains unsafe characters: ${command}`);
    }
  }

  isRegistered(name: string): boolean {
    return this.servers.has(name);
  }

  addConsumer(serverName: string, agentName: string): void {
    this.getServer(serverName).consumers.add(agentName);
  }

  removeConsumer(serverName: string, agentName: string): void {
    this.getServer(serverName).consumers.delete(agentName);
  }

  getConsumers(serverName: string): string[] {
    return [...this.getServer(serverName).consumers];
  }

  getStatus(serverName: string): ServerStatus {
    return this.getServer(serverName).status;
  }

  async getTools(serverName: string): Promise<unknown[]> {
    this.getServer(serverName);
    // MCP client connection stubbed — return empty array
    return [];
  }

  async start(serverName: string): Promise<void> {
    const server = this.getServer(serverName);
    server.status = 'starting';
    // Actual process spawn stubbed for runtime integration
    server.status = 'running';
  }

  async shutdown(serverName: string): Promise<void> {
    const server = this.getServer(serverName);
    server.status = 'stopped';
  }

  async shutdownAll(): Promise<void> {
    const names = [...this.servers.keys()];
    await Promise.all(names.map((name) => this.shutdown(name)));
  }

  private getServer(name: string): ManagedServer {
    const server = this.servers.get(name);
    if (!server) {
      throw new Error(`MCP server "${name}" is not registered`);
    }
    return server;
  }
}
