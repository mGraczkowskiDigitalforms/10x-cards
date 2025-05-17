import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Check, X, Edit2, Save } from 'lucide-react';
import { toast } from 'sonner';

const MAX_FRONT_LENGTH = 200;
const MAX_BACK_LENGTH = 500;

interface FlashcardProposalItemProps {
  front: string;
  back: string;
  accepted: boolean;
  rejected: boolean;
  edited: boolean;
  onAccept: () => void;
  onEdit: (front: string, back: string) => void;
  onReject: () => void;
}

export function FlashcardProposalItem({
  front,
  back,
  accepted,
  rejected,
  edited,
  onAccept,
  onEdit,
  onReject,
}: FlashcardProposalItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedFront, setEditedFront] = useState(front);
  const [editedBack, setEditedBack] = useState(back);

  const handleSaveEdit = () => {
    if (editedFront.length > MAX_FRONT_LENGTH) {
      toast.error(`Front text cannot exceed ${MAX_FRONT_LENGTH} characters`);
      return;
    }
    if (editedBack.length > MAX_BACK_LENGTH) {
      toast.error(`Back text cannot exceed ${MAX_BACK_LENGTH} characters`);
      return;
    }
    if (editedFront.trim() === '' || editedBack.trim() === '') {
      toast.error('Both front and back text are required');
      return;
    }

    onEdit(editedFront, editedBack);
    setIsEditing(false);
  };

  const handleStartEdit = () => {
    setEditedFront(front);
    setEditedBack(back);
    setIsEditing(true);
  };

  const handleFrontChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    if (newText.length <= MAX_FRONT_LENGTH) {
      setEditedFront(newText);
    }
  };

  const handleBackChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    if (newText.length <= MAX_BACK_LENGTH) {
      setEditedBack(newText);
    }
  };

  const getCardClassName = () => {
    if (accepted) return 'p-4 border-green-500';
    if (rejected) return 'p-4 border-red-500 opacity-75';
    return 'p-4';
  };

  return (
    <Card className={getCardClassName()}>
      <div className="space-y-4">
        {isEditing ? (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Front ({editedFront.length}/{MAX_FRONT_LENGTH})
              </label>
              <Textarea
                value={editedFront}
                onChange={handleFrontChange}
                maxLength={MAX_FRONT_LENGTH}
                placeholder="Front side text..."
                className={editedFront.length === MAX_FRONT_LENGTH ? 'border-yellow-500' : ''}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Back ({editedBack.length}/{MAX_BACK_LENGTH})
              </label>
              <Textarea
                value={editedBack}
                onChange={handleBackChange}
                maxLength={MAX_BACK_LENGTH}
                placeholder="Back side text..."
                className={editedBack.length === MAX_BACK_LENGTH ? 'border-yellow-500' : ''}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSaveEdit}
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Front</label>
                <span className="text-sm text-gray-500">
                  {front.length}/{MAX_FRONT_LENGTH}
                </span>
              </div>
              <p className="p-2 bg-gray-50 rounded-md min-h-[2.5rem]">{front}</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Back</label>
                <span className="text-sm text-gray-500">
                  {back.length}/{MAX_BACK_LENGTH}
                </span>
              </div>
              <p className="p-2 bg-gray-50 rounded-md min-h-[2.5rem]">{back}</p>
            </div>
            <div className="flex justify-end space-x-2">
              {!accepted && !rejected && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStartEdit}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              <Button
                variant={accepted ? 'outline' : 'default'}
                size="sm"
                onClick={onAccept}
                disabled={accepted}
              >
                <Check className="h-4 w-4 mr-2" />
                {accepted ? 'Accepted' : 'Accept'}
              </Button>
              <Button
                variant={rejected ? 'outline' : 'destructive'}
                size="sm"
                onClick={onReject}
                disabled={rejected}
              >
                <X className="h-4 w-4 mr-2" />
                {rejected ? 'Rejected' : 'Reject'}
              </Button>
            </div>
            <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
              <div>
                {rejected && <span className="text-red-500">Rejected</span>}
                {accepted && <span className="text-green-500">Accepted</span>}
              </div>
              {edited && !isEditing && <span>(edited)</span>}
            </div>
          </>
        )}
      </div>
    </Card>
  );
} 