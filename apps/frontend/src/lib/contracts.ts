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
