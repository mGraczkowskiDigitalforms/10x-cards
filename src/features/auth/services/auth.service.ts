import type { 
  LoginCredentials, 
  RegisterCredentials,
  ResetPasswordCredentials,
  ForgotPasswordCredentials,
  User,
  AuthApiError 
} from '../types';

class AuthError extends Error {
  constructor(error: AuthApiError) {
    super(error.error);
    this.name = 'AuthError';
  }
}

export class AuthService {
  private static async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json();
      if (error.error === 'Invalid login credentials') {
        throw new AuthError({ error: 'Invalid credentials' });
      }
      throw new AuthError(error);
    }
    return response.json();
  }

  static async login(credentials: LoginCredentials): Promise<User> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    return this.handleResponse<User>(response);
  }

  static async register(credentials: RegisterCredentials): Promise<User> {
    const { confirmPassword, ...registerData } = credentials;
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerData),
    });

    return this.handleResponse<User>(response);
  }

  static async resetPassword(credentials: ResetPasswordCredentials): Promise<void> {
    const { confirmPassword, ...resetData } = credentials;
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resetData),
    });

    return this.handleResponse<void>(response);
  }

  static async forgotPassword(credentials: ForgotPasswordCredentials): Promise<void> {
    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    return this.handleResponse<void>(response);
  }
} 