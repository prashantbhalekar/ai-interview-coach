export interface HealthResponse {
  success: boolean;
  service: string;
  status: 'ok' | string;
  timestamp: string;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  fullName: string;
}

export interface ResumeUploadResponse {
  resumeId: string;
  status: string;
  queueJobId: string;
  fileName: string;
  createdAt: string;
}

export interface ResumeStatusResponse {
  id: string;
  status: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  storageBucket: string;
  storageUrl: string;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ResumeAnalysisResult {
  overallScore: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  recommendations: string[];
  keywordsMatched: string[];
  keywordsMissing: string[];
}

export interface AnalyzeResumeRequest {
  resumeText: string;
  jobDescription: string;
}

export interface AnalyzeResumeResponse {
  provider: string;
  model: string;
  result: ResumeAnalysisResult;
}

export interface InterviewSessionSummary {
  id: string;
  title: string;
  focusArea: string | null;
  status: string;
  currentQuestionIndex: number;
  questionCount: number;
  answeredCount: number;
  overallScore: number | null;
  updatedAt: string;
  createdAt: string;
}

export interface InterviewQuestion {
  id: string;
  order: number;
  text: string;
}

export interface InterviewAnswer {
  id: string;
  order: number;
  questionId: string;
  questionText: string;
  answerText: string;
  score: number;
  feedbackSummary: string;
  followUpQuestion: string;
  createdAt: string;
}

export interface InterviewEvaluation {
  overallScore: number;
  strengths: string[];
  improvements: string[];
  followUpPlan: string[];
  updatedAt: string;
}

export interface InterviewSessionDetail {
  id: string;
  title: string;
  focusArea: string | null;
  status: string;
  currentQuestionIndex: number;
  currentQuestion: InterviewQuestion | null;
  questions: InterviewQuestion[];
  answers: InterviewAnswer[];
  evaluation: InterviewEvaluation | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInterviewSessionRequest {
  title?: string;
  focusArea?: string;
}

export interface SubmitInterviewAnswerRequest {
  questionId?: string;
  answerText: string;
}

export interface SubmitInterviewAnswerResponse {
  sessionId: string;
  status: string;
  submittedAnswer: InterviewAnswer;
  nextQuestion: InterviewQuestion | null;
  evaluation: InterviewEvaluation;
}

export interface InterviewResultsResponse {
  sessionId: string;
  title: string;
  status: string;
  overallScore: number;
  strengths: string[];
  improvements: string[];
  followUpPlan: string[];
  answers: InterviewAnswer[];
}
