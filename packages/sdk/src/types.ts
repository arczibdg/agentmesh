export interface AgentMessage {
  id: string;
  from: string;
  to: string | '*';
  type: 'request' | 'response' | 'broadcast';
  payload: unknown;
  timestamp: number;
}

export interface MemoryEntry {
  namespace: string;
  key: string;
  value: unknown;
  updatedBy: string;
  updatedAt: number;
}

export interface ModelConfig {
  provider: string;
  model: string;
  baseUrl?: string;
}

export interface ToolCall {
  name: string;
  parameters: Record<string, unknown>;
}

export interface ToolResult {
  name: string;
  result: unknown;
  error?: string;
}

export interface AgentContext {
  agentName: string;
  memory: {
    get(namespace: string, key: string): Promise<unknown>;
    set(namespace: string, key: string, value: unknown): Promise<void>;
    list(namespace: string): Promise<string[]>;
  };
  bus: {
    ask(targetAgent: string, payload: unknown): Promise<unknown>;
    broadcast(payload: unknown): void;
  };
  log: {
    info(msg: string): void;
    warn(msg: string): void;
    error(msg: string): void;
  };
}
