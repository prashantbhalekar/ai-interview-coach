export interface ResumeUploadResponseDto {
  resumeId: string;
  status: string;
  queueJobId: string;
  fileName: string;
  createdAt: Date;
}
