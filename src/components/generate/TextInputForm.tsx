import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { GenerateButton } from './GenerateButton';

interface TextInputFormProps {
  onSubmit: (text: string) => void;
  disabled?: boolean;
  shouldReset?: boolean;
  isLoading?: boolean;
}

export function TextInputForm({ onSubmit, disabled, shouldReset, isLoading }: TextInputFormProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (shouldReset) {
      setText('');
      setError(null);
    }
  }, [shouldReset]);

  const validateText = (value: string): boolean => {
    if (value.length < 1000) {
      setError('Text must be at least 1000 characters long');
      return false;
    }
    if (value.length > 10000) {
      setError('Text cannot be longer than 10000 characters');
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateText(text)) {
      onSubmit(text);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    validateText(newText);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('text');
    
    // Calculate where the paste would occur and what the final text would be
    const selectionStart = e.currentTarget.selectionStart ?? 0;
    const selectionEnd = e.currentTarget.selectionEnd ?? 0;
    const beforeSelection = text.substring(0, selectionStart);
    const afterSelection = text.substring(selectionEnd);
    const newText = beforeSelection + pastedText + afterSelection;
    
    if (newText.length > 10000) {
      e.preventDefault();
      const remainingChars = 10000 - text.length + (selectionEnd - selectionStart);
      toast.error(
        remainingChars > 0
          ? `You can paste up to ${remainingChars} characters`
          : 'Text would exceed the 10000 character limit'
      );
      return;
    }

    // If pasting would result in text less than 1000 characters, show a warning
    if (newText.length < 1000) {
      toast.warning(`Text needs at least ${1000 - newText.length} more characters`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-test-id="generate-form">
      <div className="space-y-2">
        <Textarea
          value={text}
          onChange={handleTextChange}
          onPaste={handlePaste}
          placeholder="Enter your text here (1000-10000 characters)..."
          className="min-h-[200px] max-h-[400px]"
          disabled={disabled || isLoading}
          data-test-id="generate-text-input"
        />
        <p className={`text-sm ${text.length > 10000 ? 'text-red-500' : 'text-gray-500'}`} data-test-id="character-count">
          Characters: {text.length} / 10000
          {text.length < 1000 && (
            <span className="text-yellow-500 ml-2" data-test-id="characters-needed">
              (Need {1000 - text.length} more)
            </span>
          )}
        </p>
      </div>

      {error && (
        <Alert variant="destructive" data-test-id="generate-error-alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <GenerateButton 
        disabled={disabled}
        isTextValid={!error}
        textLength={text.length}
        isLoading={isLoading}
        data-test-id="generate-submit-button"
      />
    </form>
  );
} 