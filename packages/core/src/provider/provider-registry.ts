import { AnthropicProvider } from './anthropic-provider.js';
import { LLMProvider } from '../types/llm-provider.js';

type ProviderFactory = () => LLMProvider;

const providers: Record<string, ProviderFactory> = {
  anthropic: () => AnthropicProvider.getInstance(),
};

export function getProvider(name: string): LLMProvider {
  const factory = providers[name];
  if (!factory) {
    throw new Error(`Unknown provider: "${name}". Available: ${Object.keys(providers).join(', ')}`);
  }
  return factory();
}
