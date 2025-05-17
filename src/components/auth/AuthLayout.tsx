import { type ReactNode } from 'react';
import { Card } from '@/components/ui/card';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="w-full p-6">
        <div className="space-y-2 text-center mb-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>

        {children}
      </Card>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        <a 
          href="https://10xcards.com/terms" 
          className="hover:text-primary underline underline-offset-4"
        >
          Terms of Service
        </a>
        {' · '}
        <a 
          href="https://10xcards.com/privacy" 
          className="hover:text-primary underline underline-offset-4"
        >
          Privacy Policy
        </a>
      </div>
    </div>
  );
} 