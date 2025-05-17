import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AuthLayout } from './AuthLayout';
import { AuthInput } from './AuthInput';

interface ResetPasswordFormProps {
  onSubmit: (password: string) => Promise<void>;
}

export function ResetPasswordForm({ onSubmit }: ResetPasswordFormProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const errors: typeof fieldErrors = {};

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await onSubmit(password);
      toast.success('Your password has been reset successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Create new password"
      subtitle="Enter your new password below"
    >
      <form 
        onSubmit={handleSubmit} 
        className="space-y-4"
        noValidate // Disable browser validation
      >
        {error && (
          <ErrorAlert 
            errorMessage={error} 
            onDismiss={() => setError(null)} 
          />
        )}

        <AuthInput
          label="New Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          showPasswordToggle
          required
          disabled={isLoading}
          placeholder="Enter your new password"
          error={fieldErrors.password}
          hint="Must be at least 8 characters"
        />

        <AuthInput
          label="Confirm New Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          showPasswordToggle
          required
          disabled={isLoading}
          placeholder="Confirm your new password"
          error={fieldErrors.confirmPassword}
        />

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Resetting password...
            </>
          ) : (
            'Reset password'
          )}
        </Button>

        <div className="text-center text-sm">
          Remember your password?{' '}
          <a 
            href="/auth/login" 
            className="font-medium text-primary hover:underline"
          >
            Back to login
          </a>
        </div>
      </form>
    </AuthLayout>
  );
} 