import { Injectable, NotImplementedException } from '@nestjs/common';
import type {
  AiProvider,
  GenerateStructuredOutputInput,
  GenerateStructuredOutputResult,
} from './ai-provider.interface';

@Injectable()
export class OllamaProvider implements AiProvider {
  readonly name = 'ollama' as const;

  async generateStructuredOutput(
    input: GenerateStructuredOutputInput,
  ): Promise<GenerateStructuredOutputResult> {
    throw new NotImplementedException(
      `Ollama provider placeholder is not implemented for operation ${input.operation}`,
    );
  }
}
