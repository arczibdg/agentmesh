import { Worker } from 'node:worker_threads';
import type { AgentDef } from '../config/types.js';

type AgentStatus = 'registered' | 'starting' | 'running' | 'stopped' | 'failed';

interface ManagedAgent {
  name: string;
  def: AgentDef;
  status: AgentStatus;
  worker?: Worker;
  startedAt?: number;
  restarts: number;
}

export class Supervisor {
  private agents = new Map<string, ManagedAgent>();

  register(name: string, def: Partial<AgentDef> & { role: string; model?: string }): void {
    if (this.agents.has(name)) throw new Error(`Agent '${name}' is already registered`);
    this.agents.set(name, { name, def: def as AgentDef, status: 'registered', restarts: 0 });
  }

  getAgentNames(): string[] {
    return [...this.agents.keys()];
  }

  getStatus(name: string): AgentStatus {
    const agent = this.agents.get(name);
    if (!agent) throw new Error(`Agent '${name}' not found`);
    return agent.status;
  }

  getStatusAll(): Array<{ name: string; status: AgentStatus }> {
    return [...this.agents.values()].map(a => ({ name: a.name, status: a.status }));
  }

  async startAll(workerPath: string): Promise<void> {
    for (const [name] of this.agents) {
      await this.startAgent(name, workerPath);
    }
  }

  async startAgent(name: string, workerPath: string): Promise<void> {
    const agent = this.agents.get(name);
    if (!agent) throw new Error(`Agent '${name}' not found`);
    agent.status = 'starting';
    const worker = new Worker(workerPath, { workerData: { agentName: name, agentDef: agent.def } });
    worker.on('error', () => { agent.status = 'failed'; });
    worker.on('exit', (code) => { if (code !== 0 && agent.status !== 'stopped') agent.status = 'failed'; });
    agent.worker = worker;
    agent.status = 'running';
    agent.startedAt = Date.now();
  }

  async stopAll(): Promise<void> {
    for (const [name] of this.agents) {
      await this.stopAgent(name);
    }
  }

  async stopAgent(name: string): Promise<void> {
    const agent = this.agents.get(name);
    if (!agent?.worker) return;
    agent.status = 'stopped';
    await agent.worker.terminate();
    agent.worker = undefined;
  }
}
