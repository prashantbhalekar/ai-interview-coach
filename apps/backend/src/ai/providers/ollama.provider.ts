import { BadGatewayException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  AiProvider,
  GenerateStructuredOutputInput,
  GenerateStructuredOutputResult,
} from './ai-provider.interface';

interface OllamaResponse {
  response?: string;
  prompt_eval_count?: number;
  eval_count?: number;
}

@Injectable()
export class OllamaProvider implements AiProvider {
  readonly name = 'ollama' as const;

  constructor(private readonly configService: ConfigService) {}

  async generateStructuredOutput(
    input: GenerateStructuredOutputInput,
  ): Promise<GenerateStructuredOutputResult> {
    const baseUrl = this.configService.get<string>('OLLAMA_BASE_URL', 'http://localhost:11434');

    if (!baseUrl) {
      throw new ServiceUnavailableException('OLLAMA_BASE_URL is not configured');
    }

    const model = input.model ?? this.configService.get<string>('OLLAMA_MODEL', 'llama3.1:8b');
    const endpoint = `${baseUrl.replace(/\/$/, '')}/api/generate`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt: `${input.prompt}\n\nReturn only valid JSON.`,
        format: 'json',
        stream: false,
        options: {
          temperature: input.temperature ?? 0.2,
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new BadGatewayException(
        `Ollama request failed with ${response.status}: ${errorBody.slice(0, 300)}`,
      );
    }

    const payload = (await response.json()) as OllamaResponse;
    const text = payload.response?.trim();

    if (!text) {
      throw new BadGatewayException('Ollama response did not contain generated text');
    }

    const usage: {
      inputTokens?: number;
      outputTokens?: number;
    } = {};

    if (payload.prompt_eval_count !== undefined) {
      usage.inputTokens = payload.prompt_eval_count;
    }

    if (payload.eval_count !== undefined) {
      usage.outputTokens = payload.eval_count;
    }

    return {
      provider: this.name,
      model,
      text,
      ...(Object.keys(usage).length > 0 ? { usage } : {}),
    };
  }
}
