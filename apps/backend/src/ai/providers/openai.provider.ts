import { BadGatewayException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  AiProvider,
  GenerateStructuredOutputInput,
  GenerateStructuredOutputResult,
} from './ai-provider.interface';

interface OpenAiResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
  };
}

@Injectable()
export class OpenAiProvider implements AiProvider {
  readonly name = 'openai' as const;

  constructor(private readonly configService: ConfigService) {}

  async generateStructuredOutput(
    input: GenerateStructuredOutputInput,
  ): Promise<GenerateStructuredOutputResult> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY') ?? '';

    if (!apiKey) {
      throw new ServiceUnavailableException('OPENAI_API_KEY is not configured');
    }

    const model = input.model ?? this.configService.get<string>('OPENAI_MODEL', 'gpt-4o-mini');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'Return only valid JSON. Do not add markdown fences, prose, or extra keys.',
          },
          {
            role: 'user',
            content: input.prompt,
          },
        ],
        temperature: input.temperature ?? 0.2,
        response_format: {
          type: 'json_object',
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new BadGatewayException(
        `OpenAI request failed with ${response.status}: ${errorBody.slice(0, 300)}`,
      );
    }

    const payload = (await response.json()) as OpenAiResponse;
    const text = payload.choices?.[0]?.message?.content?.trim();

    if (!text) {
      throw new BadGatewayException('OpenAI response did not contain message content');
    }

    const usage: {
      inputTokens?: number;
      outputTokens?: number;
    } = {};

    if (payload.usage?.prompt_tokens !== undefined) {
      usage.inputTokens = payload.usage.prompt_tokens;
    }

    if (payload.usage?.completion_tokens !== undefined) {
      usage.outputTokens = payload.usage.completion_tokens;
    }

    return {
      provider: this.name,
      model,
      text,
      ...(Object.keys(usage).length > 0 ? { usage } : {}),
    };
  }
}
