import { Alert, AlertDescription } from "@/components/ui/alert";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorAlertProps {
  errorMessage: string;
  onDismiss?: () => void;
}

export function ErrorAlert({ errorMessage, onDismiss }: ErrorAlertProps) {
  return (
    <Alert variant="destructive" className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <XCircle className="h-4 w-4" />
        <AlertDescription>{errorMessage}</AlertDescription>
      </div>
      {onDismiss && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 hover:bg-destructive/20"
          onClick={onDismiss}
        >
          Dismiss
        </Button>
      )}
    </Alert>
  );
} 