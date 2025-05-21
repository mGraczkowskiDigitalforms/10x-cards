import { GenerateView } from "@/components/generate/GenerateView";
import { UserPanel } from "@/features/auth/components/UserPanel";
import { useEffect, useState } from "react";

interface DashboardViewProps {
  user: {
    id: string;
    email: string;
    lastLoginAt: string;
  };
}

export function DashboardView({ user }: DashboardViewProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return (
    <div className="min-h-screen flex flex-col" data-test-id="dashboard-view" data-hydrated={isHydrated}>
      <div className="bg-secondary/50 border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            {/* User info */}
            <div className="flex items-center gap-4" data-test-id="user-info">
              <span className="text-sm text-muted-foreground">
                Logged in as:{" "}
                <span className="font-medium text-foreground" data-test-id="user-email">
                  {user.email}
                </span>
              </span>
              <span className="text-sm text-muted-foreground">
                Last login:{" "}
                <span className="font-medium text-foreground" data-test-id="user-last-login">
                  {new Date(user.lastLoginAt).toLocaleString()}
                </span>
              </span>
            </div>

            {/* Logout button */}
            <div className="flex items-center w-full sm:w-auto" data-test-id="user-panel-container">
              <UserPanel user={user} />
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 flex-1" data-test-id="dashboard-main" role="main">
        <h1 className="text-3xl font-bold mb-8">Generate Flashcards</h1>
        <GenerateView userId={user.id} />
      </main>
    </div>
  );
}
