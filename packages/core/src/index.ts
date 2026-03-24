import fs from 'node:fs';
import path from 'node:path';
import { parseConfig } from './config/parser.js';
import { validateConfig } from './config/validator.js';
import type { MeshConfig } from './config/types.js';
import { Supervisor } from './runtime/supervisor.js';
import { MessageBus } from './bus/message-bus.js';
import { McpServerManager } from './mcp/server-manager.js';
import { HttpToolAdapter } from './mcp/http-adapter.js';
import { MemoryStore } from './memory/memory-store.js';
import { ModelRouter } from './models/model-router.js';

export interface MeshRuntimeOptions {
  configPath: string;
  agentFilter?: string[];
}

export class MeshRuntime {
  private config!: MeshConfig;
  private supervisor = new Supervisor();
  private bus = new MessageBus();
  private mcpManager = new McpServerManager();
  private httpAdapter = new HttpToolAdapter();
  private memoryStore!: MemoryStore;
  private modelRouter = new ModelRouter();

  async load(options: MeshRuntimeOptions): Promise<void> {
    const yamlContent = fs.readFileSync(options.configPath, 'utf-8');
    this.config = parseConfig(yamlContent);
    validateConfig(this.config);

    // Initialize memory
    const configDir = path.dirname(path.resolve(options.configPath));
    const memPath = path.resolve(configDir, this.config.memory?.path ?? '.agentmesh/memory.db');
    if (!memPath.startsWith(configDir + path.sep) && !memPath.startsWith(configDir + '/')) {
      throw new Error(`memory.path must be within the project directory. Got: ${memPath}`);
    }
    const memDir = path.dirname(memPath);
    if (!fs.existsSync(memDir)) fs.mkdirSync(memDir, { recursive: true });
    this.memoryStore = new MemoryStore({
      dbPath: memPath,
      namespaces: this.config.memory?.namespaces ?? [],
    });

    // Register MCP servers
    if (this.config.mcp) {
      for (const [name, def] of Object.entries(this.config.mcp)) {
        this.mcpManager.register(name, def);
      }
    }

    // Register agents
    const agentEntries = Object.entries(this.config.agents);
    for (const [name, def] of agentEntries) {
      if (options.agentFilter && !options.agentFilter.includes(name)) continue;
      this.supervisor.register(name, def);

      if (def.tools?.mcp) {
        for (const serverName of def.tools.mcp) {
          this.mcpManager.addConsumer(serverName, name);
        }
      }
      if (def.tools?.http) {
        for (const httpDef of def.tools.http) {
          this.httpAdapter.register(httpDef);
        }
      }
    }
  }

  async start(): Promise<void> {
    // Start MCP servers that have consumers
    for (const [name] of Object.entries(this.config.mcp ?? {})) {
      if (this.mcpManager.getConsumers(name).length > 0) {
        await this.mcpManager.start(name);
      }
    }
    // Start agent workers
    const workerPath = new URL('./runtime/worker-entry.js', import.meta.url).pathname;
    await this.supervisor.startAll(workerPath);
  }

  async stop(): Promise<void> {
    await this.supervisor.stopAll();
    await this.mcpManager.shutdownAll();
    this.memoryStore.close();
  }

  getStatus() {
    return { agents: this.supervisor.getStatusAll() };
  }

  getBus(): MessageBus { return this.bus; }
  getMemory(): MemoryStore { return this.memoryStore; }
}

// Re-exports for package consumers
export { parseConfig } from './config/parser.js';
export { validateConfig } from './config/validator.js';
export type { MeshConfig, AgentDef, McpServerDef, HttpToolDef } from './config/types.js';
export { Supervisor } from './runtime/supervisor.js';
export { MessageBus } from './bus/message-bus.js';
export type { BusMessage } from './bus/types.js';
export { McpServerManager } from './mcp/server-manager.js';
export { HttpToolAdapter } from './mcp/http-adapter.js';
export { MemoryStore } from './memory/memory-store.js';
export { SqliteBackend } from './memory/sqlite-backend.js';
export { ModelRouter, parseModelString } from './models/model-router.js';
export type { ModelClient } from './models/model-router.js';
export { CircuitBreaker } from './models/circuit-breaker.js';
export { AgentRunner } from './runtime/agent-runner.js';

// Plugin SDK (merged from @agentmesh/sdk)
export { defineAgent } from './plugins/defineAgent.js';
export type { AgentTemplate, AgentTemplateInput } from './plugins/defineAgent.js';
export { defineTool } from './plugins/defineTool.js';
export type { ToolAdapter, ToolAdapterInput, ToolHandler } from './plugins/defineTool.js';
export { defineMemory } from './plugins/defineMemory.js';
export type { MemoryBackend, MemoryBackendInput } from './plugins/defineMemory.js';
export type { MemoryEntry, ModelConfig, ToolCall, ToolResult, AgentContext } from './types.js';
