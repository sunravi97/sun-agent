export type AgentConfig = {
  name: string;
  description: string;
  version: string;
  provider: string;
  model: string;
  maxTokens: number;
  prompts: PromptConfig;
};

type PromptConfig = {
  system: string; //file path to system context
  context: string; //list of filepaths that provide context for the agent
};

export type ResolvedAgentConfig = Omit<AgentConfig, 'prompts'> & {
  prompts: {
    system: string;
    context: string;
  };
};