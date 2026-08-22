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
