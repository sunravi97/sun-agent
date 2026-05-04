import Anthropic from '@anthropic-ai/sdk';
import { LLMProvider, LLMRequest, LLMResponse } from '../types/llm-provider.js';
import { StopReason } from '../types/constants.js';

export class AnthropicProvider implements LLMProvider {

  private static instance: AnthropicProvider;

  private static readonly stopReasonMap: Record<string, string> = {
    end_turn: StopReason.FINISH,
    max_tokens: StopReason.MAX_TOKEN,
    tool_use: StopReason.TOOL_REQUESTED,
  };
  
  private client: Anthropic;

  private constructor() {
    this.client = new Anthropic();
  }

  public static getInstance(): AnthropicProvider {
    if (!this.instance) {
      this.instance = new AnthropicProvider();
    }
    return this.instance;
  }

  async complete(request: LLMRequest): Promise<LLMResponse> {
    const response = await this.client.messages.create({
      model: request.model,
      max_tokens: request.maxTokens,
      system: request.system,
      messages: request.messages,
    });

    const textBlock = response.content.find(block => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text content in response');
    }

    return {
      content: textBlock.text,
      stopReason: response.stop_reason === null
        ? StopReason.STREAM
        : AnthropicProvider.stopReasonMap[response.stop_reason] ?? StopReason.FINISH,
    };
  }
}
