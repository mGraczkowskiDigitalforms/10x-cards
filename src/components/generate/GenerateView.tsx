import { useState } from 'react';
import type { FlashcardProposalDto, GenerationCreateResponseDto } from '@/types';
import { TextInputForm } from '@/components/generate/TextInputForm';
import { FlashcardProposalList } from '@/components/generate/FlashcardProposalList';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { BulkSaveButton } from '@/components/generate/BulkSaveButton';

export interface FlashcardProposalViewModel extends FlashcardProposalDto {
  edited: boolean;
  accepted: boolean;
  rejected: boolean;
}

export function GenerateView() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proposals, setProposals] = useState<FlashcardProposalViewModel[]>([]);
  const [generationId, setGenerationId] = useState<number | null>(null);
  const [shouldResetForm, setShouldResetForm] = useState(false);

  const handleGenerate = async (text: string) => {
    try {
      setLoading(true);
      setError(null);
      setShouldResetForm(false);
      
      const response = await fetch('/api/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate flashcards. Please try again.');
      }

      const data: GenerationCreateResponseDto = await response.json();
      
      setGenerationId(data.generation.id);
      setProposals(
        data.flashcards_proposal.map(proposal => ({
          ...proposal,
          edited: false,
          accepted: false,
          rejected: false,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = (index: number) => {
    setProposals(prev => 
      prev.map((p, i) => i === index ? { ...p, accepted: true, rejected: false } : p)
    );
  };

  const handleEdit = (index: number, front: string, back: string) => {
    setProposals(prev =>
      prev.map((p, i) => i === index ? { ...p, front, back, edited: true } : p)
    );
  };

  const handleReject = (index: number) => {
    setProposals(prev => 
      prev.map((p, i) => i === index ? { ...p, rejected: true, accepted: false } : p)
    );
  };

  const handleSaveSuccess = () => {
    setProposals([]);
    setGenerationId(null);
    setShouldResetForm(true);
  };

  return (
    <div className="space-y-8">
      <TextInputForm 
        onSubmit={handleGenerate} 
        disabled={loading} 
        shouldReset={shouldResetForm}
      />
      
      {loading && <LoadingIndicator />}
      
      {error && (
        <ErrorAlert 
          errorMessage={error} 
          onDismiss={() => setError(null)} 
        />
      )}
      
      {proposals.length > 0 && (
        <>
          <BulkSaveButton
            flashcards={proposals}
            generationId={generationId}
            disabled={loading}
            onSuccess={handleSaveSuccess}
          />

          <FlashcardProposalList
            proposals={proposals}
            onAccept={handleAccept}
            onEdit={handleEdit}
            onReject={handleReject}
          />
        </>
      )}
    </div>
  );
} 