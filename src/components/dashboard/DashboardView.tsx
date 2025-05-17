import { GenerateView } from "@/components/generate/GenerateView";
import { UserPanel } from "@/components/auth/UserPanel";

interface DashboardViewProps {
  user: {
    id: string;
    email: string;
    lastLoginAt: string;
  };
}

export function DashboardView({ user }: DashboardViewProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-secondary/50 border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            {/* User info */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Logged in as: <span className="font-medium text-foreground">{user.email}</span>
              </span>
              <span className="text-sm text-muted-foreground">
                Last login: <span className="font-medium text-foreground">
                  {new Date(user.lastLoginAt).toLocaleString()}
                </span>
              </span>
            </div>
            
            {/* Logout button */}
            <div className="flex items-center w-full sm:w-auto">
              <UserPanel user={user} />
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 flex-1">
        <h1 className="text-3xl font-bold mb-8">Generate Flashcards</h1>
        <GenerateView userId={user.id} />
      </main>
    </div>
  );
} 