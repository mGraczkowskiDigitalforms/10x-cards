import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

function FlashcardSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div>
          <Skeleton className="h-5 w-20 mb-2" /> {/* Front label */}
          <Skeleton className="h-4 w-full" /> {/* Front content */}
        </div>
        <div>
          <Skeleton className="h-5 w-20 mb-2" /> {/* Back label */}
          <Skeleton className="h-4 w-full" /> {/* Back content */}
        </div>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Skeleton className="h-9 w-[70px]" /> {/* Edit button */}
        <Skeleton className="h-9 w-[70px]" /> {/* Reject button */}
        <Skeleton className="h-9 w-[70px]" /> {/* Accept button */}
      </CardFooter>
    </Card>
  );
}

export function LoadingIndicator() {
  return (
    <div className="space-y-4">
      <FlashcardSkeleton />
      <FlashcardSkeleton />
      <FlashcardSkeleton />
    </div>
  );
} 