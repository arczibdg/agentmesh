export interface AgentTemplateInput {
  role: string;
  defaultModel?: string;
  defaultTools?: string[];
  systemPrompt?: string;
  configSchema?: Record<string, { type: string; default?: unknown; enum?: unknown[] }>;
}

export interface AgentTemplate extends AgentTemplateInput {
  defaultTools: string[];
}

export function defineAgent(input: AgentTemplateInput): AgentTemplate {
  return {
    ...input,
    defaultTools: input.defaultTools ?? [],
  };
}
