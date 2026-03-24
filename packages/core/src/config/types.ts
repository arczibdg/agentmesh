export interface MeshConfig {
  version: string;
  defaults?: {
    model?: string;
    timeout?: string;
    retries?: number;
  };
  memory?: {
    store?: string;
    path?: string;
    namespaces?: string[];
  };
  mcp?: Record<string, McpServerDef>;
  agents: Record<string, AgentDef>;
}

export interface McpServerDef {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface AgentDef {
  role: string;
  model?: string;
  tools?: {
    mcp?: string[];
    http?: HttpToolDef[];
  };
  memory?: {
    read?: string[];
    write?: string[];
  };
  listen?: { from: string; on: string }[];
  timeout?: string;
  retries?: number;
  config?: Record<string, unknown>;
}

export interface HttpToolDef {
  name: string;
  url: string;
  auth?: string;
}
