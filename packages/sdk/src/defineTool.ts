export interface ToolHandler {
  name: string;
  description: string;
  parameters: Record<string, string>;
  handler: (params: Record<string, unknown>, ctx: unknown) => Promise<unknown>;
}

export interface ToolAdapterInput {
  name: string;
  description: string;
  auth?: { type: string; envVar: string };
  tools: ToolHandler[];
}

export interface ToolAdapter extends ToolAdapterInput {
  __type: 'agentmesh:tool';
}

export function defineTool(input: ToolAdapterInput): ToolAdapter {
  return { ...input, __type: 'agentmesh:tool' };
}
