export interface LLMProvider {
  complete(request: LLMRequest): Promise<LLMResponse>;
  // TODO: stream(request: LLMRequest): AsyncIterable<string>
}

export type LLMMessage = {
  role: "user" | "assistant";
  content: string;
};

export type LLMRequest = {
  model: string;
  system: string;
  messages: LLMMessage[];
  maxTokens: number;
};

export type LLMResponse = {
  content: string;
  stopReason: string;
  // TODO: toolCalls when tool use is implemented
};
