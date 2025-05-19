import { forwardRef, useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  showPasswordToggle?: boolean;
  'data-test-id'?: string;
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ className, label, error, hint, id, type = 'text', showPasswordToggle, placeholder, 'data-test-id': testId, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
    const inputType = showPassword ? 'text' : type;

    return (
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            {label}
          </label>
          {hint && !error && (
            <span className="text-xs text-muted-foreground">
              {hint}
            </span>
          )}
        </div>
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            placeholder={placeholder}
            className={cn(
              "w-full px-3 py-2 border rounded-md transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "placeholder:text-muted-foreground/60",
              error ? 
                "border-destructive focus:ring-destructive/50 focus:border-destructive" : 
                "border-input dark:border-input",
              "dark:bg-background dark:text-foreground",
              showPasswordToggle && "pr-10",
              className
            )}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={
              error ? `${inputId}-error` : 
              hint ? `${inputId}-hint` : 
              undefined
            }
            data-test-id={testId}
            {...props}
          />
          
          {/* Password Toggle Button */}
          {showPasswordToggle && type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2",
                "text-muted-foreground hover:text-foreground",
                "focus:outline-none focus:ring-2 focus:ring-primary/50",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                props.disabled && "pointer-events-none"
              )}
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
              data-test-id={testId ? `${testId}-toggle` : undefined}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div
            id={`${inputId}-error`}
            className="mt-1.5 text-sm text-destructive flex items-center gap-1.5"
            role="alert"
          >
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }
);

AuthInput.displayName = 'AuthInput'; 