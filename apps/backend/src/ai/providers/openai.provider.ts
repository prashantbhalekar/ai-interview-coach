import { Injectable, NotImplementedException } from '@nestjs/common';
import type {
  AiProvider,
  GenerateStructuredOutputInput,
  GenerateStructuredOutputResult,
} from './ai-provider.interface';

@Injectable()
export class OpenAiProvider implements AiProvider {
  readonly name = 'openai' as const;

  async generateStructuredOutput(
    input: GenerateStructuredOutputInput,
  ): Promise<GenerateStructuredOutputResult> {
    throw new NotImplementedException(
      `OpenAI provider placeholder is not implemented for operation ${input.operation}`,
    );
  }
}
