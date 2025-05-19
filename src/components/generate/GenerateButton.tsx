import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface GenerateButtonProps {
  disabled?: boolean;
  isTextValid: boolean;
  textLength: number;
  isLoading?: boolean;
  onClick?: () => void;
}

export function GenerateButton({ 
  disabled = false, 
  isTextValid, 
  textLength,
  isLoading = false,
  onClick 
}: GenerateButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <Button 
      type={onClick ? "button" : "submit"}
      disabled={disabled || !isTextValid || textLength < 1000 || isLoading}
      className="w-full sm:w-auto"
      onClick={handleClick}
      data-test-id="generate-submit-button"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        'Generate Flashcards'
      )}
    </Button>
  );
} 