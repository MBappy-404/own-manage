import { LeaderboardClient } from "./leaderboard-client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const metadata = { title: "Leaderboard" };

export default async function LeaderboardPage() {
  const session = (await getServerSession(authOptions))!;
  return (
    <LeaderboardClient currency={session.user.currency || "USD"} />
  );
}
