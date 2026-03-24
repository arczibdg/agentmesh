import type { ModelClient } from '../models/model-router.js';
import type { AgentContext } from '@agentmesh/sdk';

interface AgentRunnerOptions {
  agentName: string;
  role: string;
  systemPrompt?: string;
  modelClient: ModelClient;
  model: string;
  context: AgentContext;
  timeoutMs: number;
  retries: number;
  maxTurns: number;
}

export class AgentRunner {
  private options: AgentRunnerOptions;
  private conversationHistory: Array<{ role: string; content: string }> = [];

  constructor(options: AgentRunnerOptions) {
    this.options = options;
    this.conversationHistory.push({
      role: 'system',
      content: options.systemPrompt ?? `You are an AI agent. Your role: ${options.role}`,
    });
  }

  async run(userMessage: string): Promise<string> {
    this.conversationHistory.push({ role: 'user', content: userMessage });

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.options.retries; attempt++) {
      try {
        const response = await this.options.modelClient.circuitBreaker.call(() =>
          this.options.modelClient.chat({
            model: this.options.model,
            messages: this.conversationHistory,
          }),
        );
        this.conversationHistory.push({ role: 'assistant', content: response });
        this.trimHistory();
        return response;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < this.options.retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10_000);
          await new Promise(r => setTimeout(r, delay));
        }
      }
    }

    throw lastError ?? new Error('Agent run failed');
  }

  private trimHistory(): void {
    const maxMessages = this.options.maxTurns * 2;
    if (this.conversationHistory.length > maxMessages + 1) {
      const systemPrompt = this.conversationHistory[0];
      this.conversationHistory = [systemPrompt, ...this.conversationHistory.slice(-maxMessages)];
    }
  }
}
