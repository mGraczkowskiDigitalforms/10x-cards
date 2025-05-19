import { useCallback } from 'react';
import { toast } from 'sonner';

export const MAX_FRONT_LENGTH = 200;
export const MAX_BACK_LENGTH = 500;

interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

export function useFlashcardValidation() {
  const validateContent = useCallback((front: string, back: string): ValidationResult => {
    if (front.trim() === '' || back.trim() === '') {
      console.log('Validation failed: empty fields');
      return {
        isValid: false,
        errorMessage: 'Both front and back text are required'
      };
    }

    if (front.length > MAX_FRONT_LENGTH) {
      console.log('Validation failed: front too long');
      return {
        isValid: false,
        errorMessage: `Front text cannot exceed ${MAX_FRONT_LENGTH} characters`
      };
    }

    if (back.length > MAX_BACK_LENGTH) {
      console.log('Validation failed: back too long');
      return {
        isValid: false,
        errorMessage: `Back text cannot exceed ${MAX_BACK_LENGTH} characters`
      };
    }

    return { isValid: true };
  }, []);

  const validateAndNotify = useCallback((front: string, back: string): boolean => {
    const result = validateContent(front, back);
    if (!result.isValid && result.errorMessage) {
      toast.error(result.errorMessage);
    }
    return result.isValid;
  }, [validateContent]);

  return {
    validateContent,
    validateAndNotify,
    MAX_FRONT_LENGTH,
    MAX_BACK_LENGTH
  };
} 