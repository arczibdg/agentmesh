import { describe, it, expect, beforeEach } from 'vitest';
import { MessageBus } from '../../../packages/core/src/bus/message-bus.js';
import type { BusMessage } from '../../../packages/core/src/bus/types.js';

describe('MessageBus', () => {
  let bus: MessageBus;

  beforeEach(() => {
    bus = new MessageBus();
  });

  it('ask sends request and receives response', async () => {
    bus.onRequest('agentB', async (msg: BusMessage) => {
      expect(msg.from).toBe('agentA');
      expect(msg.to).toBe('agentB');
      expect(msg.payload).toEqual({ question: 'hello' });
      return { answer: 42 };
    });

    const result = await bus.ask('agentA', 'agentB', { question: 'hello' });
    expect(result).toEqual({ answer: 42 });
  });

  it('ask times out if no handler registered', async () => {
    await expect(
      bus.ask('agentA', 'unknownAgent', { data: 1 }, 100),
    ).rejects.toThrow(/timeout/i);
  });

  it('broadcast delivers to all subscribers', () => {
    const received: string[] = [];

    bus.onBroadcast('agentB', (msg: BusMessage) => {
      received.push('agentB');
      expect(msg.event).toBe('status');
      expect(msg.payload).toEqual({ ready: true });
    });

    bus.onBroadcast('agentC', (msg: BusMessage) => {
      received.push('agentC');
    });

    bus.broadcast('agentA', 'status', { ready: true });

    expect(received).toContain('agentB');
    expect(received).toContain('agentC');
    expect(received).toHaveLength(2);
  });

  it('broadcast does not deliver to sender', () => {
    const received: string[] = [];

    bus.onBroadcast('agentA', (_msg: BusMessage) => {
      received.push('agentA');
    });

    bus.onBroadcast('agentB', (_msg: BusMessage) => {
      received.push('agentB');
    });

    bus.broadcast('agentA', 'ping', {});

    expect(received).toEqual(['agentB']);
  });

  it('getHistory returns all messages', async () => {
    bus.onRequest('agentB', async () => 'ok');

    await bus.ask('agentA', 'agentB', 'hello');

    const history = bus.getHistory();
    expect(history.length).toBe(2);
    expect(history[0].type).toBe('request');
    expect(history[0].from).toBe('agentA');
    expect(history[0].to).toBe('agentB');
    expect(history[1].type).toBe('response');
    expect(history[1].from).toBe('agentB');
    expect(history[1].to).toBe('agentA');
  });

  it('clear resets history', async () => {
    bus.onRequest('agentB', async () => 'ok');
    await bus.ask('agentA', 'agentB', 'test');

    expect(bus.getHistory().length).toBe(2);
    bus.clear();
    expect(bus.getHistory().length).toBe(0);
  });

  it('getHistory returns a copy, not the internal array', async () => {
    bus.onRequest('agentB', async () => 'ok');
    await bus.ask('agentA', 'agentB', 'test');

    const h1 = bus.getHistory();
    const h2 = bus.getHistory();
    expect(h1).not.toBe(h2);
    expect(h1).toEqual(h2);
  });
});
