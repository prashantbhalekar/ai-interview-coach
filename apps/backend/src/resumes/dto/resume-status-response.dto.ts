export interface ResumeStatusResponseDto {
  id: string;
  status: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  storageBucket: string;
  storageUrl: string;
  failureReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}
