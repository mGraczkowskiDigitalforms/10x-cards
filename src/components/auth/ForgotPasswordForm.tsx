import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AuthLayout } from './AuthLayout';
import { AuthInput } from './AuthInput';

interface ForgotPasswordFormProps {
  onSubmit: (email: string) => Promise<void>;
}

export function ForgotPasswordForm({ onSubmit }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const errors: typeof fieldErrors = {};

    if (!email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Please enter a valid email address';
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
      await onSubmit(email);
      toast.success('Password reset instructions have been sent to your email.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Reset your password"
      subtitle="Enter your email address and we'll send you a link to reset your password"
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
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
          disabled={isLoading}
          placeholder="Enter your email address"
          error={fieldErrors.email}
        />

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending reset instructions...
            </>
          ) : (
            'Send reset instructions'
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