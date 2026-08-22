import { BadGatewayException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiUsageService } from '../src/ai/ai-usage.service';
import { AiService } from '../src/ai/ai.service';
import { type AiProvider } from '../src/ai/providers/ai-provider.interface';
import { OllamaProvider } from '../src/ai/providers/ollama.provider';
import { OpenAiProvider } from '../src/ai/providers/openai.provider';

type FetchMock = jest.MockedFunction<typeof fetch>;

describe('AI Platform (phase 6)', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('uses AI_PROVIDER=openai and validates structured output', async () => {
    const successUsage = {
      recordSuccess: jest.fn(async () => undefined),
      recordFailure: jest.fn(async () => undefined),
    } as unknown as AiUsageService;

    const openAiProvider: AiProvider = {
      name: 'openai',
      generateStructuredOutput: jest.fn(async () => ({
        provider: 'openai' as const,
        model: 'gpt-4o-mini',
        text: JSON.stringify({
          overallScore: 84,
          summary: 'Strong backend profile with relevant Node and Nest experience.',
          strengths: ['Backend systems', 'API design'],
          gaps: ['Limited distributed systems examples'],
          recommendations: ['Add measurable production impact examples'],
          keywordsMatched: ['Node.js', 'NestJS'],
          keywordsMissing: ['System design'],
        }),
        usage: {
          inputTokens: 120,
          outputTokens: 60,
        },
      })),
    };

    const ollamaProvider: AiProvider = {
      name: 'ollama',
      generateStructuredOutput: jest.fn(async () => {
        throw new Error('Unexpected ollama execution in provider switch test');
      }),
    };

    const geminiProvider: AiProvider = {
      name: 'gemini',
      generateStructuredOutput: jest.fn(async () => {
        throw new Error('Unexpected gemini execution in provider switch test');
      }),
    };

    const config = new ConfigService({
      AI_PROVIDER: 'openai',
      OPENAI_MODEL: 'gpt-4o-mini',
      GEMINI_MODEL: 'gemini-1.5-flash',
      OLLAMA_MODEL: 'llama3.1:8b',
    });

    const service = new AiService(config, successUsage, {
      openai: openAiProvider,
      ollama: ollamaProvider,
      gemini: geminiProvider,
    });

    const result = await service.analyzeResume({
      userId: 'user-1',
      resumeText: 'Built NestJS APIs and improved latency by 40%.',
      jobDescription: 'Need strong Node and backend engineering skills.',
    });

    expect(result.provider).toBe('openai');
    expect(result.model).toBe('gpt-4o-mini');
    expect(result.result.overallScore).toBe(84);
    expect(openAiProvider.generateStructuredOutput).toHaveBeenCalledTimes(1);
    expect(successUsage.recordSuccess).toHaveBeenCalledTimes(1);
    expect(successUsage.recordFailure).not.toHaveBeenCalled();
  });

  it('rejects malformed structured output and records failure', async () => {
    const usage = {
      recordSuccess: jest.fn(async () => undefined),
      recordFailure: jest.fn(async () => undefined),
    } as unknown as AiUsageService;

    const config = new ConfigService({
      AI_PROVIDER: 'gemini',
      GEMINI_MODEL: 'gemini-1.5-flash',
      OPENAI_MODEL: 'gpt-4o-mini',
      OLLAMA_MODEL: 'llama3.1:8b',
    });

    const service = new AiService(config, usage, {
      gemini: {
        name: 'gemini',
        generateStructuredOutput: jest.fn(async () => ({
          provider: 'gemini' as const,
          model: 'gemini-1.5-flash',
          text: 'not-json-response',
        })),
      },
      openai: {
        name: 'openai',
        generateStructuredOutput: jest.fn(async () => ({
          provider: 'openai' as const,
          model: 'gpt-4o-mini',
          text: '{}',
        })),
      },
      ollama: {
        name: 'ollama',
        generateStructuredOutput: jest.fn(async () => ({
          provider: 'ollama' as const,
          model: 'llama3.1:8b',
          text: '{}',
        })),
      },
    });

    await expect(
      service.analyzeResume({
        userId: 'user-2',
        resumeText: 'Sample resume text',
        jobDescription: 'Sample jd text',
      }),
    ).rejects.toThrow(BadGatewayException);

    expect(usage.recordSuccess).not.toHaveBeenCalled();
    expect(usage.recordFailure).toHaveBeenCalledTimes(1);
  });

  it('OpenAI provider maps response body to normalized result', async () => {
    const fetchMock = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: '{"overallScore":88}',
            },
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 40,
        },
      }),
    })) as unknown as FetchMock;

    global.fetch = fetchMock;

    const provider = new OpenAiProvider(
      new ConfigService({
        OPENAI_API_KEY: 'openai-test-key',
        OPENAI_MODEL: 'gpt-4o-mini',
      }),
    );

    const result = await provider.generateStructuredOutput({
      operation: 'resume_analysis',
      schemaName: 'ResumeAnalysisResult',
      prompt: 'Return JSON',
    });

    expect(result.provider).toBe('openai');
    expect(result.model).toBe('gpt-4o-mini');
    expect(result.text).toBe('{"overallScore":88}');
    expect(result.usage).toMatchObject({ inputTokens: 100, outputTokens: 40 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('Ollama provider uses configured base url and returns normalized result', async () => {
    const fetchMock = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        response: '{"overallScore":76}',
        prompt_eval_count: 50,
        eval_count: 22,
      }),
    })) as unknown as FetchMock;

    global.fetch = fetchMock;

    const provider = new OllamaProvider(
      new ConfigService({
        OLLAMA_BASE_URL: 'http://localhost:11434',
        OLLAMA_MODEL: 'llama3.1:8b',
      }),
    );

    const result = await provider.generateStructuredOutput({
      operation: 'resume_analysis',
      schemaName: 'ResumeAnalysisResult',
      prompt: 'Return JSON',
    });

    expect(result.provider).toBe('ollama');
    expect(result.model).toBe('llama3.1:8b');
    expect(result.text).toBe('{"overallScore":76}');
    expect(result.usage).toMatchObject({ inputTokens: 50, outputTokens: 22 });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:11434/api/generate',
      expect.objectContaining({
        method: 'POST',
      }),
    );
  });
});
