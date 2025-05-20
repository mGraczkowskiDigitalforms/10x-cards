export interface AuthApiError {
  error: string;
  code?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  confirmPassword: string;
}

export interface ResetPasswordCredentials {
  password: string;
  confirmPassword: string;
}

export interface ForgotPasswordCredentials {
  email: string;
}

export interface User {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
} 