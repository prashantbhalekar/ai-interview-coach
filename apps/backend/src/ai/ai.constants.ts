import type { AiProvider } from './providers/ai-provider.interface';

export const AI_PROVIDER_REGISTRY = Symbol('AI_PROVIDER_REGISTRY');

export type AiProviderRegistry = Record<string, AiProvider>;
