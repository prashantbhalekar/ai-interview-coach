import { z } from 'zod';

export const interviewQuestionsSchema = z.object({
  questions: z.array(z.string().min(1)).min(3).max(8),
});

export const interviewQuestionsJsonSchema = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'string',
        minLength: 1,
      },
      minItems: 3,
      maxItems: 8,
    },
  },
  required: ['questions'],
  additionalProperties: false,
} as const;

export type InterviewQuestionsResult = z.infer<typeof interviewQuestionsSchema>;
