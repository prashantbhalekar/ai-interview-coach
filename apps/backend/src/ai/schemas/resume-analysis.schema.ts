import { z } from 'zod';

export const resumeAnalysisSchema = z.object({
  overallScore: z.number().int().min(0).max(100),
  summary: z.string().min(1),
  strengths: z.array(z.string().min(1)).min(1),
  gaps: z.array(z.string().min(1)).min(1),
  recommendations: z.array(z.string().min(1)).min(1),
  keywordsMatched: z.array(z.string().min(1)).default([]),
  keywordsMissing: z.array(z.string().min(1)).default([]),
});

export const resumeAnalysisJsonSchema = {
  type: 'object',
  properties: {
    overallScore: {
      type: 'integer',
      minimum: 0,
      maximum: 100,
    },
    summary: {
      type: 'string',
      minLength: 1,
    },
    strengths: {
      type: 'array',
      items: {
        type: 'string',
      },
      minItems: 1,
    },
    gaps: {
      type: 'array',
      items: {
        type: 'string',
      },
      minItems: 1,
    },
    recommendations: {
      type: 'array',
      items: {
        type: 'string',
      },
      minItems: 1,
    },
    keywordsMatched: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    keywordsMissing: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
  },
  required: ['overallScore', 'summary', 'strengths', 'gaps', 'recommendations'],
  additionalProperties: false,
} as const;

export type ResumeAnalysisResult = z.infer<typeof resumeAnalysisSchema>;
