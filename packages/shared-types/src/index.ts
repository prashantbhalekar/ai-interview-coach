export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export * from './queue';
