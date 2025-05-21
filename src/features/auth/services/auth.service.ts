import type {
  LoginCredentials,
  RegisterCredentials,
  ResetPasswordCredentials,
  ForgotPasswordCredentials,
  User,
  AuthApiError,
} from "../types";

class AuthError extends Error {
  constructor(error: AuthApiError) {
    super(error.error);
    this.name = "AuthError";
  }
}

// Helper function to handle API responses
async function handleAuthResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json();
    if (error.error === "Invalid login credentials") {
      throw new AuthError({ error: "Invalid credentials" });
    }
    throw new AuthError(error);
  }
  return response.json();
}

export async function login(credentials: LoginCredentials): Promise<User> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  return handleAuthResponse<User>(response);
}

export async function register(credentials: RegisterCredentials): Promise<User> {
  // Destructure and remove confirmPassword, since it's only used for validation
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { confirmPassword, ...registerData } = credentials;
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(registerData),
  });

  return handleAuthResponse<User>(response);
}

export async function resetPassword(credentials: ResetPasswordCredentials): Promise<boolean> {
  // Destructure and remove confirmPassword, since it's only used for validation
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { confirmPassword, ...resetData } = credentials;
  const response = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(resetData),
  });

  await handleAuthResponse<Record<string, unknown>>(response);
  return true;
}

export async function forgotPassword(credentials: ForgotPasswordCredentials): Promise<boolean> {
  const response = await fetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  await handleAuthResponse<Record<string, unknown>>(response);
  return true;
}
