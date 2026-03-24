import { randomUUID } from 'node:crypto';
import type { BusMessage } from './types.js';

type RequestHandler = (msg: BusMessage) => Promise<unknown>;
type BroadcastHandler = (msg: BusMessage) => void;

export class MessageBus {
  private requestHandlers = new Map<string, RequestHandler>();
  private broadcastHandlers = new Map<string, BroadcastHandler[]>();
  private history: BusMessage[] = [];
  private maxHistory: number;

  constructor(options?: { maxHistory?: number }) {
    this.maxHistory = options?.maxHistory ?? 10_000;
  }

  private addToHistory(msg: BusMessage): void {
    this.history.push(msg);
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(-this.maxHistory);
    }
  }

  onRequest(agentName: string, handler: RequestHandler): void {
    this.requestHandlers.set(agentName, handler);
  }

  onBroadcast(agentName: string, handler: BroadcastHandler): void {
    if (!this.broadcastHandlers.has(agentName)) {
      this.broadcastHandlers.set(agentName, []);
    }
    this.broadcastHandlers.get(agentName)!.push(handler);
  }

  async ask(from: string, to: string, payload: unknown, timeoutMs = 30_000): Promise<unknown> {
    const msg: BusMessage = {
      id: randomUUID(),
      from,
      to,
      type: 'request',
      payload,
      timestamp: Date.now(),
    };
    this.addToHistory(msg);

    const handler = this.requestHandlers.get(to);
    if (!handler) {
      throw new Error(`No handler registered for agent '${to}'`);
    }

    let timer: ReturnType<typeof setTimeout>;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`Request to '${to}' timed out after ${timeoutMs}ms`)), timeoutMs);
    });
    try {
      const result = await Promise.race([handler(msg), timeoutPromise]);
      clearTimeout(timer!);

      const response: BusMessage = {
        id: randomUUID(),
        from: to,
        to: from,
        type: 'response',
        payload: result,
        timestamp: Date.now(),
      };
      this.addToHistory(response);
      return result;
    } catch (err) {
      clearTimeout(timer!);
      throw err;
    }
  }

  broadcast(from: string, event: string, payload: unknown): void {
    const msg: BusMessage = {
      id: randomUUID(),
      from,
      to: '*',
      type: 'broadcast',
      event,
      payload,
      timestamp: Date.now(),
    };
    this.addToHistory(msg);

    for (const [agentName, handlers] of this.broadcastHandlers) {
      if (agentName === from) continue;
      for (const handler of handlers) {
        handler(msg);
      }
    }
  }

  getHistory(): BusMessage[] {
    return [...this.history];
  }

  clear(): void {
    this.history = [];
  }
}
