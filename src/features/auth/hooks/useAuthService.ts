import { useCallback } from "react";
import { toast } from "sonner";
import { AuthService } from "../services/auth.service";
import type {
  LoginCredentials,
  RegisterCredentials,
  ResetPasswordCredentials,
  ForgotPasswordCredentials,
  User,
} from "../types";

export const useAuthService = () => {
  const login = useCallback(async (credentials: LoginCredentials): Promise<User> => {
    try {
      const user = await AuthService.login(credentials);
      toast.success("Successfully logged in");
      return user;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred while logging in");
      throw error;
    }
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials): Promise<User> => {
    try {
      const user = await AuthService.register(credentials);
      toast.success("Account created successfully");
      return user;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred while registering");
      throw error;
    }
  }, []);

  const resetPassword = useCallback(async (credentials: ResetPasswordCredentials): Promise<void> => {
    try {
      await AuthService.resetPassword(credentials);
      toast.success("Password has been changed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred while resetting password");
      throw error;
    }
  }, []);

  const forgotPassword = useCallback(async (credentials: ForgotPasswordCredentials): Promise<void> => {
    try {
      await AuthService.forgotPassword(credentials);
      toast.success("Password reset link has been sent to your email");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred while sending reset link");
      throw error;
    }
  }, []);

  return {
    login,
    register,
    resetPassword,
    forgotPassword,
  };
};
