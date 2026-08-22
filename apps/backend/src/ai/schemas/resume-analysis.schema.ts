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

export type ResumeAnalysisResult = z.infer<typeof resumeAnalysisSchema>;
