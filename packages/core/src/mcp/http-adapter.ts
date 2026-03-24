import type { HttpToolDef } from '../config/types.js';

export class HttpToolAdapter {
  private tools = new Map<string, HttpToolDef>();

  register(def: HttpToolDef): void {
    this.tools.set(def.name, def);
  }

  async call(toolName: string, method: string, path: string, body?: unknown): Promise<unknown> {
    const def = this.tools.get(toolName);
    if (!def) {
      throw new Error(`HTTP tool "${toolName}" is not registered`);
    }

    const url = `${def.url.replace(/\/$/, '')}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (def.auth) {
      headers['Authorization'] = def.auth;
    }

    const res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    return res.json();
  }
}
