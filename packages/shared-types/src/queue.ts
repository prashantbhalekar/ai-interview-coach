export const queueNames = {
  resumeProcessing: 'resume-processing',
  analysisProcessing: 'analysis-processing',
  interviewProcessing: 'interview-processing',
} as const;

export const queueJobNames = {
  resumeProcess: 'resume.process',
  analysisProcess: 'analysis.process',
  interviewProcess: 'interview.process',
} as const;

export interface ResumeProcessingJobPayload {
  resumeId: string;
  userId: string;
  storageKey: string;
}

export interface AnalysisProcessingJobPayload {
  analysisId: string;
  userId: string;
}

export interface InterviewProcessingJobPayload {
  interviewSessionId: string;
  userId: string;
}
