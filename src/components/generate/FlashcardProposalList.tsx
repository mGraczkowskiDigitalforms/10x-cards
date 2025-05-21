import type { FlashcardProposalViewModel } from "./GenerateView";
import { FlashcardProposalItem } from "./FlashcardProposalItem";

interface FlashcardProposalListProps {
  proposals: FlashcardProposalViewModel[];
  onAccept: (index: number) => void;
  onEdit: (index: number, front: string, back: string) => void;
  onReject: (index: number) => void;
}

export function FlashcardProposalList({ proposals, onAccept, onEdit, onReject }: FlashcardProposalListProps) {
  if (proposals.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6" data-test-id="flashcard-proposal-list">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Generated Flashcards</h2>
        <div className="text-sm text-gray-500" data-test-id="flashcard-stats">
          {proposals.filter((p) => p.accepted).length} of {proposals.length} accepted
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-test-id="flashcard-grid">
        {proposals.map((proposal, index) => (
          <FlashcardProposalItem
            key={`${proposal.front}-${index}`}
            front={proposal.front}
            back={proposal.back}
            accepted={proposal.accepted}
            rejected={proposal.rejected}
            edited={proposal.edited}
            index={index}
            onAccept={() => onAccept(index)}
            onEdit={(front, back) => onEdit(index, front, back)}
            onReject={() => onReject(index)}
            data-test-id={`flashcard-proposal-${index}`}
          />
        ))}
      </div>
    </div>
  );
}
