import type { AgentContext } from '../types.js';

export interface ToolHandler {
  name: string;
  description: string;
  parameters: Record<string, string>;
  handler: (params: Record<string, unknown>, ctx: AgentContext) => Promise<unknown>;
}

export interface ToolAdapterInput {
  name: string;
  description: string;
  auth?: { type: string; envVar: string };
  tools: ToolHandler[];
}

export interface ToolAdapter extends ToolAdapterInput {
}

export function defineTool(input: ToolAdapterInput): ToolAdapter {
  return { ...input };
}
