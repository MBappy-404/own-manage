"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Crown, Medal, Trophy } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency, getInitials } from "@/lib/utils";

type Row = {
  id: string;
  rank: number;
  name: string;
  image?: string | null;
  income: number;
  expense: number;
  savings: number;
  isCurrentUser: boolean;
};

type Response = {
  period: string;
  sort: string;
  leaderboard: Row[];
  currentUserRank: Row | null;
  totalUsers: number;
};

export function LeaderboardClient({ currency }: { currency: string }) {
  const [period, setPeriod] = React.useState<"week" | "month" | "all">("month");
  const [sort, setSort] = React.useState<"savings" | "income" | "expense">("savings");
  const [data, setData] = React.useState<Response | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?period=${period}&sort=${sort}`)
      .then((r) => r.json())
      .then((d: Response) => setData(d))
      .finally(() => setLoading(false));
  }, [period, sort]);

  const top3 = data?.leaderboard.slice(0, 3) ?? [];
  const rest = data?.leaderboard.slice(3) ?? [];

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide font-medium">
          <Trophy className="w-4 h-4 text-primary" /> Global ranks
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-1">
          Leaderboard
        </h1>
        <p className="text-sm text-muted-foreground">
          See where you stand among other OwnManage users.
        </p>
      </header>

      <div className="flex flex-wrap gap-3 items-center justify-between">
        <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
          <TabsList>
            <TabsTrigger value="week">Weekly</TabsTrigger>
            <TabsTrigger value="month">Monthly</TabsTrigger>
            <TabsTrigger value="all">All-time</TabsTrigger>
          </TabsList>
        </Tabs>
        <Tabs value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
          <TabsList>
            <TabsTrigger value="savings">Savings</TabsTrigger>
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="expense">Expense</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))
          : top3.map((row, i) => <PodiumCard key={row.id} row={row} index={i} currency={currency} />)}
      </section>

      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle>Full ranking</CardTitle>
          <span className="text-xs text-muted-foreground">
            {data?.totalUsers ?? 0} users tracked
          </span>
        </CardHeader>
        <CardContent className="px-0">
          {loading ? (
            <div className="px-6 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !rest.length ? (
            <p className="px-6 text-sm text-muted-foreground">
              You&apos;re in the top 3 already 🏆
            </p>
          ) : (
            <ul className="divide-y">
              {rest.map((row) => (
                <li
                  key={row.id}
                  className={cn(
                    "flex items-center gap-3 px-6 py-3",
                    row.isCurrentUser && "bg-primary/5",
                  )}
                >
                  <span className="w-8 text-sm font-bold text-muted-foreground tabular-nums">
                    #{row.rank}
                  </span>
                  <Avatar className="w-9 h-9">
                    {row.image && <AvatarImage src={row.image} />}
                    <AvatarFallback>{getInitials(row.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {row.name}
                      {row.isCurrentUser && (
                        <span className="ml-2 text-[10px] uppercase tracking-wide text-primary">
                          You
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Income {formatCurrency(row.income, currency)} · Expense{" "}
                      {formatCurrency(row.expense, currency)}
                    </p>
                  </div>
                  <p
                    className={cn(
                      "text-sm font-semibold tabular-nums",
                      row.savings >= 0 ? "text-success" : "text-destructive",
                    )}
                  >
                    {formatCurrency(row.savings, currency)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {data?.currentUserRank && data.currentUserRank.rank > 50 && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-3">
            <Trophy className="w-5 h-5 text-primary" />
            <p className="text-sm">
              Your current rank is{" "}
              <span className="font-bold">#{data.currentUserRank.rank}</span> of{" "}
              {data.totalUsers}.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PodiumCard({
  row,
  index,
  currency,
}: {
  row: Row;
  index: number;
  currency: string;
}) {
  const meta = [
    { icon: Crown, color: "from-amber-400 to-yellow-500", label: "1st" },
    { icon: Medal, color: "from-slate-300 to-slate-500", label: "2nd" },
    { icon: Medal, color: "from-amber-600 to-orange-700", label: "3rd" },
  ][index];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
    >
      <Card
        className={cn(
          "relative overflow-hidden",
          row.isCurrentUser && "ring-2 ring-primary",
        )}
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${meta.color} opacity-15`} />
        <CardContent className="relative p-5 flex items-center gap-4">
          <div className={`grid place-items-center w-12 h-12 rounded-xl bg-gradient-to-br ${meta.color} text-white shadow-lg shrink-0`}>
            <meta.icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
              {meta.label}
            </p>
            <p className="font-bold truncate text-base">{row.name}</p>
            <p className="text-xs text-muted-foreground">
              Savings {formatCurrency(row.savings, currency)}
            </p>
          </div>
          <Avatar className="w-10 h-10">
            {row.image && <AvatarImage src={row.image} />}
            <AvatarFallback>{getInitials(row.name)}</AvatarFallback>
          </Avatar>
        </CardContent>
      </Card>
    </motion.div>
  );
}
