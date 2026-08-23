import { BadGatewayException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiUsageService } from '../src/ai/ai-usage.service';
import { AiService } from '../src/ai/ai.service';
import { type AiProvider } from '../src/ai/providers/ai-provider.interface';
import { GeminiProviderException } from '../src/ai/providers/gemini-provider.error';
import { GeminiProvider } from '../src/ai/providers/gemini.provider';
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
      GEMINI_MODEL: 'gemini-2.5-flash-lite',
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

  it('caches identical resume analysis requests within TTL', async () => {
    const usage = {
      recordSuccess: jest.fn(async () => undefined),
      recordFailure: jest.fn(async () => undefined),
    } as unknown as AiUsageService;

    const openAiProvider: AiProvider = {
      name: 'openai',
      generateStructuredOutput: jest.fn(async () => ({
        provider: 'openai' as const,
        model: 'gpt-4o-mini',
        text: JSON.stringify({
          overallScore: 81,
          summary: 'Cached output should be reused for identical input.',
          strengths: ['APIs'],
          gaps: ['Distributed systems'],
          recommendations: ['Add measurable scaling examples'],
          keywordsMatched: ['Node.js'],
          keywordsMissing: ['Caching'],
        }),
      })),
    };

    const service = new AiService(
      new ConfigService({
        AI_PROVIDER: 'openai',
        OPENAI_MODEL: 'gpt-4o-mini',
        AI_RESUME_ANALYSIS_CACHE_TTL_MS: 120000,
        AI_RESUME_ANALYSIS_CACHE_MAX_ENTRIES: 200,
      }),
      usage,
      {
        openai: openAiProvider,
        ollama: {
          name: 'ollama',
          generateStructuredOutput: jest.fn(async () => {
            throw new Error('Unexpected ollama execution in cache test');
          }),
        },
        gemini: {
          name: 'gemini',
          generateStructuredOutput: jest.fn(async () => {
            throw new Error('Unexpected gemini execution in cache test');
          }),
        },
      },
    );

    const input = {
      userId: 'cache-user',
      resumeText: 'Built APIs and improved latency.',
      jobDescription: 'Need backend engineer with Node.js and performance tuning.',
    };

    const firstResult = await service.analyzeResume(input);
    const secondResult = await service.analyzeResume(input);

    expect(firstResult.result.overallScore).toBe(81);
    expect(secondResult.result.overallScore).toBe(81);
    expect(openAiProvider.generateStructuredOutput).toHaveBeenCalledTimes(1);
    expect(usage.recordSuccess).toHaveBeenCalledTimes(1);
    expect(usage.recordFailure).not.toHaveBeenCalled();
  });

  it('rejects malformed structured output and records failure', async () => {
    const usage = {
      recordSuccess: jest.fn(async () => undefined),
      recordFailure: jest.fn(async () => undefined),
    } as unknown as AiUsageService;

    const config = new ConfigService({
      AI_PROVIDER: 'gemini',
      GEMINI_MODEL: 'gemini-2.5-flash-lite',
      OPENAI_MODEL: 'gpt-4o-mini',
      OLLAMA_MODEL: 'llama3.1:8b',
    });

    const service = new AiService(config, usage, {
      gemini: {
        name: 'gemini',
        generateStructuredOutput: jest.fn(async () => ({
          provider: 'gemini' as const,
          model: 'gemini-2.5-flash-lite',
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

  describe('Gemini provider hardening', () => {
    it('uses v1beta endpoint, x-goog-api-key, timeout signal, and responseJsonSchema', async () => {
      const fetchMock = jest.fn(async () => ({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: '{"overallScore":90}' }],
              },
            },
          ],
          usageMetadata: {
            promptTokenCount: 12,
            candidatesTokenCount: 7,
          },
        }),
      })) as unknown as FetchMock;

      global.fetch = fetchMock;

      const provider = new GeminiProvider(
        new ConfigService({
          GEMINI_API_KEY: 'gemini-test-key',
          GEMINI_MODEL: 'gemini-2.5-flash-lite',
          GEMINI_REQUEST_TIMEOUT_MS: 30000,
        }),
      );

      const result = await provider.generateStructuredOutput({
        operation: 'resume_analysis',
        schemaName: 'ResumeAnalysisResult',
        prompt: 'Return JSON',
        responseJsonSchema: {
          type: 'object',
          properties: {
            overallScore: {
              type: 'integer',
            },
          },
          required: ['overallScore'],
          additionalProperties: false,
        },
      });

      expect(result.provider).toBe('gemini');
      expect(result.model).toBe('gemini-2.5-flash-lite');
      expect(result.text).toBe('{"overallScore":90}');
      expect(result.usage).toMatchObject({ inputTokens: 12, outputTokens: 7 });

      expect(fetchMock).toHaveBeenCalledTimes(1);

      const [requestUrl, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(requestUrl).toBe(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent',
      );
      expect(requestInit.method).toBe('POST');
      expect(requestInit.signal).toBeDefined();
      expect(requestInit.headers).toMatchObject({
        'Content-Type': 'application/json',
        'x-goog-api-key': 'gemini-test-key',
      });

      const body = JSON.parse(String(requestInit.body)) as {
        generationConfig: {
          responseMimeType: string;
          responseJsonSchema?: Record<string, unknown>;
        };
      };

      expect(body.generationConfig.responseMimeType).toBe('application/json');
      expect(body.generationConfig.responseJsonSchema).toBeDefined();
    });

    it('normalizes HTTP 400 errors', async () => {
      const fetchMock = jest.fn(async () => ({
        ok: false,
        status: 400,
        text: async () =>
          JSON.stringify({
            error: {
              code: 'invalid_request',
              status: 'INVALID_ARGUMENT',
              message: 'bad request body',
            },
          }),
      })) as unknown as FetchMock;

      global.fetch = fetchMock;

      const provider = new GeminiProvider(new ConfigService({ GEMINI_API_KEY: 'gemini-test-key' }));

      await expect(
        provider.generateStructuredOutput({
          operation: 'resume_analysis',
          schemaName: 'ResumeAnalysisResult',
          prompt: 'Return JSON',
        }),
      ).rejects.toMatchObject({
        details: {
          httpStatus: 400,
          providerCode: 'invalid_request',
          retriable: false,
        },
      });
    });

    it('normalizes HTTP 401 and 403 without exposing provider details', async () => {
      const provider = new GeminiProvider(new ConfigService({ GEMINI_API_KEY: 'gemini-test-key' }));

      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          text: async () => JSON.stringify({ error: { code: 'authentication' } }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
          text: async () => JSON.stringify({ error: { code: 'permission_denied' } }),
        }) as unknown as FetchMock;

      await expect(
        provider.generateStructuredOutput({
          operation: 'resume_analysis',
          schemaName: 'ResumeAnalysisResult',
          prompt: 'Return JSON',
        }),
      ).rejects.toMatchObject({
        details: {
          providerCode: 'authentication',
          safeMessage: 'Gemini authentication or permission failed',
          retriable: false,
        },
      });

      await expect(
        provider.generateStructuredOutput({
          operation: 'resume_analysis',
          schemaName: 'ResumeAnalysisResult',
          prompt: 'Return JSON',
        }),
      ).rejects.toMatchObject({
        details: {
          providerCode: 'permission_denied',
          safeMessage: 'Gemini authentication or permission failed',
          retriable: false,
        },
      });
    });

    it('normalizes HTTP 429 and 5xx as retriable', async () => {
      const provider = new GeminiProvider(new ConfigService({ GEMINI_API_KEY: 'gemini-test-key' }));

      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          text: async () => JSON.stringify({ error: { code: 'rate_limit_exceeded' } }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          text: async () => JSON.stringify({ error: { code: 'service_unavailable' } }),
        }) as unknown as FetchMock;

      await expect(
        provider.generateStructuredOutput({
          operation: 'resume_analysis',
          schemaName: 'ResumeAnalysisResult',
          prompt: 'Return JSON',
        }),
      ).rejects.toMatchObject({
        details: {
          providerCode: 'rate_limit_exceeded',
          retriable: true,
        },
      });

      await expect(
        provider.generateStructuredOutput({
          operation: 'resume_analysis',
          schemaName: 'ResumeAnalysisResult',
          prompt: 'Return JSON',
        }),
      ).rejects.toMatchObject({
        details: {
          providerCode: 'service_unavailable',
          retriable: true,
        },
      });
    });

    it('handles malformed error JSON by falling back to HTTP status mapping', async () => {
      const fetchMock = jest.fn(async () => ({
        ok: false,
        status: 429,
        text: async () => 'not-json',
      })) as unknown as FetchMock;

      global.fetch = fetchMock;

      const provider = new GeminiProvider(new ConfigService({ GEMINI_API_KEY: 'gemini-test-key' }));

      await expect(
        provider.generateStructuredOutput({
          operation: 'resume_analysis',
          schemaName: 'ResumeAnalysisResult',
          prompt: 'Return JSON',
        }),
      ).rejects.toMatchObject({
        details: {
          providerCode: 'rate_limit_exceeded',
          retriable: true,
        },
      });
    });

    it('maps fetch abort to timeout exception', async () => {
      const abortError = new Error('aborted');
      abortError.name = 'AbortError';

      const fetchMock = jest.fn(async () => {
        throw abortError;
      }) as unknown as FetchMock;

      global.fetch = fetchMock;

      const provider = new GeminiProvider(
        new ConfigService({ GEMINI_API_KEY: 'gemini-test-key', GEMINI_REQUEST_TIMEOUT_MS: 50 }),
      );

      await expect(
        provider.generateStructuredOutput({
          operation: 'resume_analysis',
          schemaName: 'ResumeAnalysisResult',
          prompt: 'Return JSON',
        }),
      ).rejects.toMatchObject({
        details: {
          providerCode: 'timeout',
          providerStatus: 'TIMEOUT',
          retriable: true,
        },
      });
    });

    it('rejects malformed success JSON body', async () => {
      const fetchMock = jest.fn(async () => ({
        ok: true,
        json: async () => {
          throw new Error('unexpected token');
        },
      })) as unknown as FetchMock;

      global.fetch = fetchMock;

      const provider = new GeminiProvider(new ConfigService({ GEMINI_API_KEY: 'gemini-test-key' }));

      await expect(
        provider.generateStructuredOutput({
          operation: 'resume_analysis',
          schemaName: 'ResumeAnalysisResult',
          prompt: 'Return JSON',
        }),
      ).rejects.toMatchObject({
        details: {
          providerCode: 'malformed_provider_response',
          providerStatus: 'INVALID_JSON',
          retriable: false,
        },
      });
    });

    it('rejects empty candidates with explicit status', async () => {
      const fetchMock = jest.fn(async () => ({
        ok: true,
        json: async () => ({
          candidates: [],
        }),
      })) as unknown as FetchMock;

      global.fetch = fetchMock;

      const provider = new GeminiProvider(new ConfigService({ GEMINI_API_KEY: 'gemini-test-key' }));

      await expect(
        provider.generateStructuredOutput({
          operation: 'resume_analysis',
          schemaName: 'ResumeAnalysisResult',
          prompt: 'Return JSON',
        }),
      ).rejects.toMatchObject({
        details: {
          providerCode: 'malformed_provider_response',
          providerStatus: 'MISSING_CANDIDATES',
        },
      });
    });

    it('rejects missing text in candidate parts', async () => {
      const fetchMock = jest.fn(async () => ({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: '   ' }],
              },
              finishReason: 'STOP',
            },
          ],
        }),
      })) as unknown as FetchMock;

      global.fetch = fetchMock;

      const provider = new GeminiProvider(new ConfigService({ GEMINI_API_KEY: 'gemini-test-key' }));

      await expect(
        provider.generateStructuredOutput({
          operation: 'resume_analysis',
          schemaName: 'ResumeAnalysisResult',
          prompt: 'Return JSON',
        }),
      ).rejects.toMatchObject({
        details: {
          providerCode: 'malformed_provider_response',
          providerStatus: 'STOP',
        },
      });
    });

    it('throws typed GeminiProviderException for normalization path', async () => {
      const fetchMock = jest.fn(async () => ({
        ok: false,
        status: 500,
        text: async () => JSON.stringify({ error: { code: 'api_error', status: 'INTERNAL' } }),
      })) as unknown as FetchMock;

      global.fetch = fetchMock;

      const provider = new GeminiProvider(new ConfigService({ GEMINI_API_KEY: 'gemini-test-key' }));

      await expect(
        provider.generateStructuredOutput({
          operation: 'resume_analysis',
          schemaName: 'ResumeAnalysisResult',
          prompt: 'Return JSON',
        }),
      ).rejects.toBeInstanceOf(GeminiProviderException);
    });
  });
});
