interface ResumeAnalysisPromptInput {
  resumeText: string;
  jobDescription: string;
}

export function buildResumeAnalysisPrompt(input: ResumeAnalysisPromptInput): string {
  return [
    'You are an expert technical recruiter and interview coach.',
    'Analyze the candidate resume against the job description.',
    'Return only valid JSON with this exact shape:',
    '{',
    '  "overallScore": number (0-100),',
    '  "summary": string,',
    '  "strengths": string[],',
    '  "gaps": string[],',
    '  "recommendations": string[],',
    '  "keywordsMatched": string[],',
    '  "keywordsMissing": string[]',
    '}',
    'Do not return markdown or extra keys.',
    '',
    'Job Description:',
    input.jobDescription,
    '',
    'Resume Text:',
    input.resumeText,
  ].join('\n');
}
