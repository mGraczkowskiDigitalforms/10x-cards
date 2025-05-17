import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Save, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { FlashcardProposalViewModel } from './GenerateView';

interface BulkSaveButtonProps {
  flashcards: FlashcardProposalViewModel[];
  generationId: number | null;
  userId: string;
  disabled?: boolean;
  onSuccess?: () => void;
}

export function BulkSaveButton({ 
  flashcards, 
  generationId,
  userId,
  disabled = false,
  onSuccess 
}: BulkSaveButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const acceptedFlashcards = flashcards.filter(card => card.accepted);
  const acceptedCount = acceptedFlashcards.length;
  const totalCount = flashcards.length;

  const handleSave = async (saveAcceptedOnly: boolean) => {
    if (!generationId || flashcards.length === 0) return;

    const cardsToSave = saveAcceptedOnly ? acceptedFlashcards : flashcards;
    if (cardsToSave.length === 0) {
      toast.error(saveAcceptedOnly ? 'No accepted flashcards to save' : 'No flashcards to save');
      return;
    }

    const toastId = toast.loading(
      saveAcceptedOnly 
        ? `Saving ${acceptedCount} accepted flashcard${acceptedCount === 1 ? '' : 's'}...`
        : `Saving all ${totalCount} flashcard${totalCount === 1 ? '' : 's'}...`
    );
    setIsLoading(true);

    try {
      const response = await fetch('/api/flashcards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flashcards: cardsToSave.map(card => ({
            front: card.front,
            back: card.back,
            source: card.edited ? 'ai-edited' : 'ai-full',
            generation_id: generationId,
            user_id: userId
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save flashcards');
      }

      toast.success(
        saveAcceptedOnly 
          ? `Successfully saved ${acceptedCount} accepted flashcard${acceptedCount === 1 ? '' : 's'}`
          : `Successfully saved all ${totalCount} flashcard${totalCount === 1 ? '' : 's'}`,
        { id: toastId }
      );
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to save flashcards', 
        { id: toastId }
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Button
        onClick={() => handleSave(false)}
        disabled={disabled || isLoading || totalCount === 0}
        className="w-full sm:w-auto"
        variant="default"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Save All ({totalCount})
          </>
        )}
      </Button>

      <Button
        onClick={() => handleSave(true)}
        disabled={disabled || isLoading || acceptedCount === 0}
        className="w-full sm:w-auto"
        variant="secondary"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <CheckCircle className="mr-2 h-4 w-4" />
            Save Accepted ({acceptedCount})
          </>
        )}
      </Button>
    </div>
  );
} 