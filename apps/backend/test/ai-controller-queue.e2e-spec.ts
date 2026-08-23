import { createHash } from 'crypto';
import { EmbeddingSourceType } from '@prisma/client';
import { AiController } from '../src/ai/ai.controller';

describe('AI Controller Queue Integration (phase 8)', () => {
  it('enqueues embedding jobs for resume and job description content', async () => {
    const response = {
      provider: 'gemini',
      model: 'gemini-2.5-flash-lite',
      result: {
        overallScore: 82,
        summary: 'Summary',
        strengths: ['Strong backend profile'],
        gaps: ['Need more system design detail'],
        recommendations: ['Add production metrics'],
        keywordsMatched: ['Node.js'],
        keywordsMissing: ['Kubernetes'],
      },
    };

    const aiService = {
      analyzeResume: jest.fn(async () => response),
    };

    const embeddingQueueService = {
      enqueueEmbeddingProcessing: jest.fn(async () => 'job-id'),
    };

    const controller = new AiController(aiService as never, embeddingQueueService as never);

    const dto = {
      resumeText: '  Built resilient APIs with NestJS and PostgreSQL.  ',
      jobDescription: '  Looking for senior backend engineer with observability experience.  ',
    };

    const result = await controller.analyzeResume(
      {
        user: {
          sub: 'user-1',
          email: 'user@example.com',
        },
      },
      dto,
    );

    expect(result).toEqual(response);
    expect(aiService.analyzeResume).toHaveBeenCalledWith({
      userId: 'user-1',
      resumeText: dto.resumeText,
      jobDescription: dto.jobDescription,
    });

    expect(embeddingQueueService.enqueueEmbeddingProcessing).toHaveBeenCalledTimes(2);

    const resumeContent = dto.resumeText.trim();
    const jobDescriptionContent = dto.jobDescription.trim();

    const expectedResumeHash = createHash('sha256').update(resumeContent).digest('hex');
    const expectedJobDescriptionHash = createHash('sha256')
      .update(jobDescriptionContent)
      .digest('hex');

    expect(embeddingQueueService.enqueueEmbeddingProcessing).toHaveBeenNthCalledWith(1, {
      userId: 'user-1',
      sourceType: EmbeddingSourceType.RESUME,
      sourceRefId: expectedResumeHash,
      content: resumeContent,
      metadata: {
        operation: 'resume_analysis',
      },
    });

    expect(embeddingQueueService.enqueueEmbeddingProcessing).toHaveBeenNthCalledWith(2, {
      userId: 'user-1',
      sourceType: EmbeddingSourceType.JOB_DESCRIPTION,
      sourceRefId: expectedJobDescriptionHash,
      content: jobDescriptionContent,
      metadata: {
        operation: 'resume_analysis',
      },
    });
  });

  it('returns analysis response even when one embedding enqueue fails', async () => {
    const response = {
      provider: 'gemini',
      model: 'gemini-2.5-flash-lite',
      result: {
        overallScore: 79,
        summary: 'Summary',
        strengths: ['API design'],
        gaps: ['Depth in reliability'],
        recommendations: ['Add incident examples'],
        keywordsMatched: ['Node.js'],
        keywordsMissing: ['SLO'],
      },
    };

    const aiService = {
      analyzeResume: jest.fn(async () => response),
    };

    const embeddingQueueService = {
      enqueueEmbeddingProcessing: jest
        .fn()
        .mockRejectedValueOnce(new Error('queue unavailable'))
        .mockResolvedValueOnce('job-id-2'),
    };

    const controller = new AiController(aiService as never, embeddingQueueService as never);

    const result = await controller.analyzeResume(
      {
        user: {
          sub: 'user-2',
          email: 'user2@example.com',
        },
      },
      {
        resumeText: 'Built APIs',
        jobDescription: 'Need backend skills',
      },
    );

    expect(result).toEqual(response);
    expect(embeddingQueueService.enqueueEmbeddingProcessing).toHaveBeenCalledTimes(2);
  });
});
