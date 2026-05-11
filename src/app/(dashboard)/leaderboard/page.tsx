import { LeaderboardClient } from "./leaderboard-client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const metadata = { title: "Leaderboard" };

export default async function LeaderboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  
  const isAdmin = session.user.email === "sadikulsad0810@gmail.com";
  
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">Only administrators can view the leaderboard.</p>
      </div>
    );
  }

  return (
    <LeaderboardClient 
      currency={session.user.currency || "USD"} 
      isAdmin={isAdmin}
    />
  );
}
