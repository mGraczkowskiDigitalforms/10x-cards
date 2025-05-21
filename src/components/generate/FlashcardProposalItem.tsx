import { useState, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Edit2, Save } from "lucide-react";
import { useFlashcardValidation } from "@/components/hooks/useFlashcardValidation";

interface FlashcardProposalItemProps {
  front: string;
  back: string;
  accepted: boolean;
  rejected: boolean;
  edited: boolean;
  index: number;
  onAccept: () => void;
  onEdit: (front: string, back: string) => void;
  onReject: () => void;
  testId?: string;
}

export function FlashcardProposalItem({
  front,
  back,
  accepted,
  rejected,
  edited,
  index,
  onAccept,
  onEdit,
  onReject,
  testId = `flashcard-proposal-${index}`,
}: FlashcardProposalItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedFront, setEditedFront] = useState(front);
  const [editedBack, setEditedBack] = useState(back);
  const { validateAndNotify, MAX_FRONT_LENGTH, MAX_BACK_LENGTH } = useFlashcardValidation();

  const handleSaveEdit = useCallback(async () => {
    console.log("Attempting to save edit...");
    if (validateAndNotify(editedFront, editedBack)) {
      console.log("Saving edit...");
      onEdit(editedFront, editedBack);
      setIsEditing(false);
    } else {
      console.log("Save validation failed, staying in edit mode");
    }
  }, [editedFront, editedBack, onEdit, validateAndNotify]);

  const handleCancelEdit = useCallback(() => {
    console.log("Canceling edit...");
    setEditedFront(front);
    setEditedBack(back);
    setIsEditing(false);
  }, [front, back]);

  const handleStartEdit = useCallback(() => {
    console.log("Starting edit...");
    setEditedFront(front);
    setEditedBack(back);
    setIsEditing(true);
  }, [front, back]);

  useEffect(() => {
    console.log("Edit mode changed:", isEditing);
  }, [isEditing]);

  const handleFrontChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newText = e.target.value;
      if (newText.length <= MAX_FRONT_LENGTH) {
        setEditedFront(newText);
      }
    },
    [MAX_FRONT_LENGTH]
  );

  const handleBackChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newText = e.target.value;
      if (newText.length <= MAX_BACK_LENGTH) {
        setEditedBack(newText);
      }
    },
    [MAX_BACK_LENGTH]
  );

  const getCardClassName = () => {
    if (accepted) return "p-4 border-green-500";
    if (rejected) return "p-4 border-red-500 opacity-75";
    return "p-4";
  };

  return (
    <Card className={getCardClassName()} data-test-id={testId} data-edit-mode={isEditing}>
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
                className={editedFront.length === MAX_FRONT_LENGTH ? "border-yellow-500" : ""}
                data-test-id={`${testId}-edit-front`}
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
                className={editedBack.length === MAX_BACK_LENGTH ? "border-yellow-500" : ""}
                data-test-id={`${testId}-edit-back`}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" size="sm" onClick={handleCancelEdit} data-test-id={`${testId}-cancel-edit`}>
                Cancel
              </Button>
              <Button variant="default" size="sm" onClick={handleSaveEdit} data-test-id={`${testId}-save-edit`}>
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
              <p className="p-2 bg-gray-50 rounded-md min-h-[2.5rem]" data-test-id={`${testId}-front`}>
                {front}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Back</label>
                <span className="text-sm text-gray-500">
                  {back.length}/{MAX_BACK_LENGTH}
                </span>
              </div>
              <p className="p-2 bg-gray-50 rounded-md min-h-[2.5rem]" data-test-id={`${testId}-back`}>
                {back}
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              {!accepted && !rejected && (
                <Button variant="outline" size="sm" onClick={handleStartEdit} data-test-id={`${testId}-edit`}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              <Button
                variant={accepted ? "outline" : "default"}
                size="sm"
                onClick={onAccept}
                disabled={accepted}
                data-test-id={`${testId}-accept`}
              >
                <Check className="h-4 w-4 mr-2" />
                {accepted ? "Accepted" : "Accept"}
              </Button>
              <Button
                variant={rejected ? "outline" : "destructive"}
                size="sm"
                onClick={onReject}
                disabled={rejected}
                data-test-id={`${testId}-reject`}
              >
                <X className="h-4 w-4 mr-2" />
                {rejected ? "Rejected" : "Reject"}
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
