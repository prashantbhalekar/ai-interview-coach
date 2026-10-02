interface BuildInterviewQuestionsPromptInput {
  focusArea: string;
  questionCount: number;
}

export function buildInterviewQuestionsPrompt(input: BuildInterviewQuestionsPromptInput): string {
  return [
    'You are an expert technical interviewer.',
    `Generate exactly ${input.questionCount} interview questions for the focus area below.`,
    'Questions should progress from foundational to advanced.',
    'Each question must be practical, specific, and suitable for mock interview practice.',
    'Avoid duplicates and avoid generic wording.',
    '',
    'Focus Area:',
    input.focusArea,
    '',
    'Return only valid JSON that matches the required schema.',
  ].join('\n');
}
