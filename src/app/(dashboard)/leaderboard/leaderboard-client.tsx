"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Crown, Medal, Trophy, Pencil, Trash2, Loader2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, getInitials } from "@/lib/utils";
import { CurrencyValue } from "@/components/ui/currency-value";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/provider";

type Row = {
  id: string;
  rank: number;
  name: string;
  email: string;
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

export function LeaderboardClient({
  currency,
  isAdmin
}: {
  currency: string;
  isAdmin: boolean;
}) {
  const { t } = useI18n();
  const [period, setPeriod] = React.useState<"week" | "month" | "all">("month");
  const [sort, setSort] = React.useState<"savings" | "income" | "expense">("savings");
  const [data, setData] = React.useState<Response | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [editingUser, setEditingUser] = React.useState<Row | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const refreshData = React.useCallback(() => {
    setLoading(true);
    fetch(`/api/leaderboard?period=${period}&sort=${sort}`)
      .then((r) => r.json())
      .then((d: Response) => setData(d))
      .finally(() => setLoading(false));
  }, [period, sort]);

  React.useEffect(() => {
    refreshData();
  }, [refreshData]);

  const leaderboard = data?.leaderboard ?? [];
  const top3 = leaderboard.slice(0, 3);

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide font-medium">
          <Trophy className="w-4 h-4 text-primary" /> {t("leaderboard.globalRanks")}
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-1">
          {t("leaderboard.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("leaderboard.subtitle")}
        </p>
      </header>

      <div className="flex flex-wrap gap-3 items-center justify-between">
        <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
          <TabsList>
            <TabsTrigger value="week">{t("leaderboard.weekly")}</TabsTrigger>
            <TabsTrigger value="month">{t("leaderboard.monthly")}</TabsTrigger>
            <TabsTrigger value="all">{t("common.allTime")}</TabsTrigger>
          </TabsList>
        </Tabs>
        <Tabs value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
          <TabsList>
            <TabsTrigger value="savings">{t("leaderboard.savings")}</TabsTrigger>
            <TabsTrigger value="income">{t("leaderboard.income")}</TabsTrigger>
            <TabsTrigger value="expense">{t("leaderboard.expense")}</TabsTrigger>
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
          <CardTitle>{t("leaderboard.full")}</CardTitle>
          <span className="text-xs text-muted-foreground">
            {t("leaderboard.usersTracked", { n: data?.totalUsers ?? 0 })}
          </span>
        </CardHeader>
        <CardContent className="px-0">
          {loading ? (
            <div className="px-6 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !leaderboard.length ? (
            <p className="px-6 text-sm text-muted-foreground">
              {t("common.loading")}
            </p>
          ) : (
            <ul className="divide-y">
              {leaderboard.map((row) => (
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
                          {t("common.you")}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("leaderboard.income")} <CurrencyValue value={row.income} currency={currency} /> · {t("leaderboard.expense")}{" "}
                      <CurrencyValue value={row.expense} currency={currency} />
                    </p>
                  </div>
                  <p
                    className={cn(
                      "text-sm font-semibold tabular-nums",
                      row.savings >= 0 ? "text-success" : "text-destructive",
                    )}
                  >
                    <CurrencyValue value={row.savings} currency={currency} />
                  </p>
                  {isAdmin && !row.isCurrentUser && (
                    <div className="flex items-center gap-1 ml-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => setEditingUser(row)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeletingId(row.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
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
              {t("leaderboard.rankBanner", { rank: data.currentUserRank.rank, total: data.totalUsers })}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("leaderboard.editUser")}</DialogTitle>
            <DialogDescription>
              {t("leaderboard.updateUserDetails", { name: editingUser?.name ?? "" })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("common.fullName")}</Label>
              <Input
                id="name"
                defaultValue={editingUser?.name}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("common.email")}</Label>
              <Input
                id="email"
                defaultValue={editingUser?.email}
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Profile Image URL</Label>
              <Input
                id="image"
                defaultValue={editingUser?.image ?? ""}
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              disabled={submitting}
              onClick={async () => {
                if (!editingUser) return;
                const name = (document.getElementById("name") as HTMLInputElement).value;
                const email = (document.getElementById("email") as HTMLInputElement).value;
                const image = (document.getElementById("image") as HTMLInputElement).value;

                setSubmitting(true);
                try {
                  const res = await fetch(`/api/admin/users/${editingUser.id}`, {
                    method: "PATCH",
                    body: JSON.stringify({ name, email, image }),
                  });
                  if (!res.ok) throw new Error("Failed to update");
                  toast.success(t("settings.updated"));
                  setEditingUser(null);
                  refreshData();
                } catch {
                  toast.error(t("settings.updateFailed"));
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("common.saveChanges")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("leaderboard.deleteUser")}</DialogTitle>
            <DialogDescription>
              {t("leaderboard.confirmDeleteUser")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingId(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              disabled={submitting}
              onClick={async () => {
                if (!deletingId) return;
                setSubmitting(true);
                try {
                  const res = await fetch(`/api/admin/users/${deletingId}`, {
                    method: "DELETE",
                  });
                  if (!res.ok) throw new Error("Failed to delete");
                  toast.success(t("income.deleted"));
                  setDeletingId(null);
                  refreshData();
                } catch {
                  toast.error(t("settings.updateFailed"));
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
  const { t } = useI18n();
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
              {t("leaderboard.savings")} <CurrencyValue value={row.savings} currency={currency} />
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
