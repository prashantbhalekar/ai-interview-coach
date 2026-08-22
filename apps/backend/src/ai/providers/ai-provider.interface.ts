export type AiProviderName = 'gemini' | 'openai' | 'ollama';

export interface AiUsageMeta {
  inputTokens?: number;
  outputTokens?: number;
}

export interface GenerateStructuredOutputInput {
  operation: string;
  schemaName: string;
  prompt: string;
  model?: string;
  temperature?: number;
  timeoutMs?: number;
  responseJsonSchema?: Record<string, unknown>;
}

export interface GenerateStructuredOutputResult {
  provider: AiProviderName;
  model: string;
  text: string;
  usage?: AiUsageMeta;
}

export interface AiProvider {
  readonly name: AiProviderName;
  generateStructuredOutput(
    input: GenerateStructuredOutputInput,
  ): Promise<GenerateStructuredOutputResult>;
}
