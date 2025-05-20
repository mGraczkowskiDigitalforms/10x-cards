import { useCallback } from 'react';
import { toast } from 'sonner';
import { AuthService } from '../services/auth.service';
import type { 
  LoginCredentials, 
  RegisterCredentials,
  ResetPasswordCredentials,
  ForgotPasswordCredentials,
  User 
} from '../types';

export const useAuthService = () => {
  const login = useCallback(async (credentials: LoginCredentials): Promise<User> => {
    try {
      const user = await AuthService.login(credentials);
      toast.success('Zalogowano pomyślnie');
      return user;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Wystąpił błąd podczas logowania');
      throw error;
    }
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials): Promise<User> => {
    try {
      const user = await AuthService.register(credentials);
      toast.success('Konto zostało utworzone');
      return user;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Wystąpił błąd podczas rejestracji');
      throw error;
    }
  }, []);

  const resetPassword = useCallback(async (credentials: ResetPasswordCredentials): Promise<void> => {
    try {
      await AuthService.resetPassword(credentials);
      toast.success('Hasło zostało zmienione');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Wystąpił błąd podczas zmiany hasła');
      throw error;
    }
  }, []);

  const forgotPassword = useCallback(async (credentials: ForgotPasswordCredentials): Promise<void> => {
    try {
      await AuthService.forgotPassword(credentials);
      toast.success('Link do resetowania hasła został wysłany na podany adres email');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Wystąpił błąd podczas wysyłania linku resetującego hasło');
      throw error;
    }
  }, []);

  return {
    login,
    register,
    resetPassword,
    forgotPassword
  };
}; 