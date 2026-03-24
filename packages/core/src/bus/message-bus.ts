import { randomUUID } from 'node:crypto';
import type { BusMessage } from './types.js';

type RequestHandler = (msg: BusMessage) => Promise<unknown>;
type BroadcastHandler = (msg: BusMessage) => void;

export class MessageBus {
  private requestHandlers = new Map<string, RequestHandler>();
  private broadcastHandlers = new Map<string, BroadcastHandler[]>();
  private history: BusMessage[] = [];

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
    this.history.push(msg);

    const handler = this.requestHandlers.get(to);
    if (!handler) {
      return new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Request to '${to}' timeout: no handler registered`)), timeoutMs);
      });
    }

    const result = await Promise.race([
      handler(msg),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Request to '${to}' timeout after ${timeoutMs}ms`)), timeoutMs),
      ),
    ]);

    const response: BusMessage = {
      id: randomUUID(),
      from: to,
      to: from,
      type: 'response',
      payload: result,
      timestamp: Date.now(),
    };
    this.history.push(response);
    return result;
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
    this.history.push(msg);

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
