"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { 
  Crown, 
  Medal, 
  Trophy, 
  Pencil, 
  Trash2, 
  Loader2, 
  MessageSquare, 
  Send, 
  Star, 
  Bell, 
  Smartphone, 
  Trash,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  AlertOctagon,
  Wallet
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, getInitials } from "@/lib/utils";
import { CurrencyValue } from "@/components/ui/currency-value";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

type FeedbackItem = {
  id: string;
  userId: string;
  name: string;
  email: string;
  message: string;
  rating: number;
  createdAt: string;
};

type BroadcastItem = {
  id: string;
  title: string;
  message: string;
  type: "INFO" | "WARNING" | "SUCCESS" | "ALERT";
  createdAt: string;
};

export function LeaderboardClient({
  currency,
  isAdmin
}: {
  currency: string;
  isAdmin: boolean;
}) {
  const { t, locale } = useI18n();
  const [activeHubTab, setActiveHubTab] = React.useState<string>("ranks");
  
  // Leaderboard State
  const [period, setPeriod] = React.useState<"week" | "month" | "all">("month");
  const [sort, setSort] = React.useState<"savings" | "income" | "expense">("savings");
  const [data, setData] = React.useState<Response | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [editingUser, setEditingUser] = React.useState<Row | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  // Feedbacks State
  const [feedbacks, setFeedbacks] = React.useState<FeedbackItem[]>([]);
  const [feedbacksLoading, setFeedbacksLoading] = React.useState(false);

  // Broadcast State
  const [broadcasts, setBroadcasts] = React.useState<BroadcastItem[]>([]);
  const [broadcastsLoading, setBroadcastsLoading] = React.useState(false);
  const [broadcastTitle, setBroadcastTitle] = React.useState("");
  const [broadcastMessage, setBroadcastMessage] = React.useState("");
  const [broadcastType, setBroadcastType] = React.useState<string>("INFO");
  const [sendingBroadcast, setSendingBroadcast] = React.useState(false);

  // Fetch Leaderboard
  const refreshData = React.useCallback(() => {
    setLoading(true);
    fetch(`/api/leaderboard?period=${period}&sort=${sort}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d: Response) => setData(d))
      .finally(() => setLoading(false));
  }, [period, sort]);

  // Fetch Feedbacks
  const fetchFeedbacks = React.useCallback(async () => {
    setFeedbacksLoading(true);
    try {
      const res = await fetch("/api/feedback", { cache: "no-store" });
      if (res.ok) {
        const d = await res.json();
        setFeedbacks(d);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFeedbacksLoading(false);
    }
  }, []);

  // Fetch Broadcast History
  const fetchBroadcasts = React.useCallback(async () => {
    setBroadcastsLoading(true);
    try {
      const res = await fetch("/api/admin/broadcast", { cache: "no-store" });
      if (res.ok) {
        const d = await res.json();
        setBroadcasts(d);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBroadcastsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (activeHubTab === "ranks") {
      refreshData();
    } else if (activeHubTab === "feedback") {
      fetchFeedbacks();
    } else if (activeHubTab === "broadcast") {
      fetchBroadcasts();
    }
  }, [activeHubTab, refreshData, fetchFeedbacks, fetchBroadcasts]);

  const handleDeleteFeedback = async (id: string) => {
    if (!confirm(locale === "bn" ? "আপনি কি নিশ্চিতভাবে এই ফিডব্যাকটি মুছে ফেলতে চান?" : "Are you sure you want to delete this feedback?")) return;
    try {
      const res = await fetch(`/api/feedback/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success(locale === "bn" ? "ফিডব্যাক মুছে ফেলা হয়েছে" : "Feedback deleted");
      fetchFeedbacks();
    } catch {
      toast.error("Failed to delete feedback");
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      toast.error(locale === "bn" ? "অনুগ্রহ করে টাইটেল ও নোটিফিকেশন বিবরণ লিখুন!" : "Please write a title and a message!");
      return;
    }

    setSendingBroadcast(true);
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: broadcastTitle,
          message: broadcastMessage,
          type: broadcastType,
        }),
      });

      if (!res.ok) throw new Error("Failed");
      toast.success(locale === "bn" ? "নোটিফিকেশন সফলভাবে ব্রডকাস্ট করা হয়েছে! 📢" : "Notification broadcasted successfully! 📢");
      setBroadcastTitle("");
      setBroadcastMessage("");
      fetchBroadcasts();
    } catch {
      toast.error("Failed to send broadcast");
    } finally {
      setSendingBroadcast(false);
    }
  };

  const getNotifClass = (type: string) => {
    switch (type) {
      case "SUCCESS":
        return { bg: "bg-success/15 border-success/30 text-success", icon: CheckCircle2 };
      case "WARNING":
        return { bg: "bg-warning/15 border-warning/30 text-warning", icon: AlertTriangle };
      case "ALERT":
        return { bg: "bg-destructive/15 border-destructive/30 text-destructive", icon: AlertOctagon };
      default:
        return { bg: "bg-primary/15 border-primary/30 text-primary", icon: Info };
    }
  };

  const leaderboard = data?.leaderboard ?? [];
  const top3 = leaderboard.slice(0, 3);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-primary font-bold uppercase tracking-wide px-3 py-1 rounded-full bg-primary/10 mb-1">
            <ShieldCheck className="w-4 h-4" /> {locale === "bn" ? "অ্যাডমিন প্যানেল" : "ADMIN HUB"}
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            {locale === "bn" ? "অ্যাডমিন কমান্ড সেন্টার 🛠️" : "Admin Command Center 🛠️"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {locale === "bn" ? "লিডারবোর্ড, ফিডব্যাক এবং পুশ নোটিফিকেশন ব্রডকাস্ট করার ওয়ান-স্টপ হাব।" : "Manage global leaderboard standings, review user feedback, and send live mobile push alerts."}
          </p>
        </div>
      </header>

      <Tabs value={activeHubTab} onValueChange={setActiveHubTab} className="space-y-6">
        <TabsList className="bg-muted/80 p-1 rounded-2xl grid grid-cols-3 max-w-lg border">
          <TabsTrigger value="ranks" className="rounded-xl font-bold py-2 text-xs sm:text-sm">
            <Trophy className="w-4 h-4 mr-1.5 shrink-0" />
            {locale === "bn" ? "মেম্বার র‍্যাঙ্ক" : "Ranks & Users"}
          </TabsTrigger>
          <TabsTrigger value="feedback" className="rounded-xl font-bold py-2 text-xs sm:text-sm">
            <MessageSquare className="w-4 h-4 mr-1.5 shrink-0" />
            {locale === "bn" ? "ব্যবহারকারী মতামত" : "Feedbacks"}
          </TabsTrigger>
          <TabsTrigger value="broadcast" className="rounded-xl font-bold py-2 text-xs sm:text-sm">
            <Bell className="w-4 h-4 mr-1.5 shrink-0" />
            {locale === "bn" ? "ব্রডকাস্ট সেন্টার" : "Broadcasts"}
          </TabsTrigger>
        </TabsList>

        {/* 1. LEADERBOARD & USERS TAB */}
        <TabsContent value="ranks" className="space-y-6 outline-none">
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

          <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-lg">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle>{t("leaderboard.full")}</CardTitle>
              <span className="text-xs text-muted-foreground font-medium bg-muted px-2.5 py-1 rounded-full border">
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
                <p className="px-6 text-sm text-muted-foreground">{t("common.loading")}</p>
              ) : (
                <ul className="divide-y divide-border/40">
                  {leaderboard.map((row) => (
                    <li
                      key={row.id}
                      className={cn(
                        "flex items-center gap-3 px-6 py-3.5 transition-colors hover:bg-muted/30",
                        row.isCurrentUser && "bg-primary/5",
                      )}
                    >
                      <span className="w-8 text-sm font-extrabold text-muted-foreground/70 tabular-nums">
                        #{row.rank}
                      </span>
                      <Avatar className="w-9 h-9">
                        {row.image && <AvatarImage src={row.image} />}
                        <AvatarFallback>{getInitials(row.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate flex items-center gap-1.5">
                          {row.name}
                          {row.isCurrentUser && (
                            <span className="text-[9px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                              {t("common.you")}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {row.email} · {t("leaderboard.income")}{" "}
                          <span className="font-medium text-foreground">
                            <CurrencyValue value={row.income} currency={currency} />
                          </span>{" "}
                          · {t("leaderboard.expense")}{" "}
                          <span className="font-medium text-foreground">
                            <CurrencyValue value={row.expense} currency={currency} />
                          </span>
                        </p>
                      </div>
                      <p
                        className={cn(
                          "text-sm font-bold tabular-nums",
                          row.savings >= 0 ? "text-success" : "text-destructive",
                        )}
                      >
                        <CurrencyValue value={row.savings} currency={currency} />
                      </p>
                      {isAdmin && !row.isCurrentUser && (
                        <div className="flex items-center gap-1 ml-4 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary rounded-xl"
                            onClick={() => setEditingUser(row)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-xl"
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
        </TabsContent>

        {/* 2. USER FEEDBACKS TAB */}
        <TabsContent value="feedback" className="space-y-4 outline-none">
          {feedbacksLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-44 w-full" />
              ))}
            </div>
          ) : feedbacks.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto opacity-20 mb-3" />
              <p className="text-sm font-medium">
                {locale === "bn" ? "এখনো কোনো ব্যবহারকারী ফিডব্যাক বা মতামত জমা দেননি।" : "No user feedbacks have been submitted yet."}
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {feedbacks.map((fb) => (
                <Card key={fb.id} className="border border-border/50 bg-card/60 backdrop-blur-xl shadow-md relative overflow-hidden group hover:border-primary/20 transition-all">
                  <CardHeader className="pb-2 flex flex-row items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 border">
                        <AvatarFallback className="font-bold bg-primary/10 text-primary">
                          {getInitials(fb.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-sm font-bold">{fb.name}</CardTitle>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{fb.email}</p>
                      </div>
                    </div>
                    {/* STARS */}
                    <div className="flex items-center gap-0.5 shrink-0 bg-muted/60 px-2 py-0.5 rounded-lg border text-xs font-bold text-amber-500">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{fb.rating}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-1">
                    <p className="text-xs sm:text-sm text-foreground/95 bg-background/40 p-3 rounded-2xl border border-border/30 leading-relaxed min-h-[70px] whitespace-pre-wrap">
                      {fb.message}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium">
                      <span>
                        {new Date(fb.createdAt).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteFeedback(fb.id)}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/15 rounded-lg transition-colors"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* 3. BROADCAST CENTER TAB */}
        <TabsContent value="broadcast" className="outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* COMPOSER FORM (8 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <Card className="border border-border/50 bg-card/60 backdrop-blur-xl shadow-md">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg font-bold">
                    <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                    {locale === "bn" ? "নতুন নোটিফিকেশন ব্রডকাস্ট" : "Notification Composer"}
                  </CardTitle>
                  <CardDescription>
                    {locale === "bn" 
                      ? "যেকোনো টাইটেল, বিবরণ ও অ্যালার্ট ক্যাটেগরি লিখে সবার কাছে মুহূর্তের মধ্যে পুশ নোটিফিকেশন পাঠান।"
                      : "Broadcast a push alert to all registered users instantly."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSendBroadcast} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="broadcast-title" className="font-bold text-xs uppercase text-muted-foreground">
                        {locale === "bn" ? "নোটিফিকেশন টাইটেল" : "Notification Title"}
                      </Label>
                      <Input
                        id="broadcast-title"
                        value={broadcastTitle}
                        onChange={(e) => setBroadcastTitle(e.target.value)}
                        placeholder={locale === "bn" ? "যেমন: নতুন পেমেন্ট অপশন যুক্ত হয়েছে!" : "e.g., System Update Completed"}
                        className="rounded-xl border-border/50 bg-background/30"
                        maxLength={100}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="broadcast-message" className="font-bold text-xs uppercase text-muted-foreground">
                        {locale === "bn" ? "নোটিফিকেশন বিবরণ (Message)" : "Notification Message"}
                      </Label>
                      <Textarea
                        id="broadcast-message"
                        value={broadcastMessage}
                        onChange={(e) => setBroadcastMessage(e.target.value)}
                        placeholder={locale === "bn" ? "যেমন: এখন থেকে বিকাশ ও নগদের পাশাপাশি সহজেই আপনার ব্যাংক ব্যালেন্স ম্যানুয়ালি যুক্ত করতে পারবেন..." : "e.g. You can now configure dynamic transaction frequencies on all category settings..."}
                        className="rounded-xl min-h-[100px] border-border/50 bg-background/30"
                        maxLength={250}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="font-bold text-xs uppercase text-muted-foreground">
                        {locale === "bn" ? "অ্যালার্ট ক্যাটেগরি (Severity)" : "Alert Category"}
                      </Label>
                      <div className="grid grid-cols-4 gap-2">
                        {["INFO", "SUCCESS", "WARNING", "ALERT"].map((type) => {
                          const config = getNotifClass(type);
                          const isSelected = broadcastType === type;
                          return (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setBroadcastType(type)}
                              className={cn(
                                "py-2 px-1 rounded-xl text-[10px] sm:text-xs font-bold border transition-all flex flex-col items-center justify-center gap-1.5",
                                isSelected 
                                  ? `${config.bg} ring-2 ring-primary scale-[1.03] shadow-sm` 
                                  : "border-border/60 bg-background/30 text-muted-foreground hover:bg-muted/40"
                              )}
                            >
                              <config.icon className="w-4.5 h-4.5" />
                              <span>{type}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={sendingBroadcast}
                      className="w-full rounded-xl gap-2 font-bold shadow-md shadow-primary/10 mt-2"
                    >
                      {sendingBroadcast ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {locale === "bn" ? "ব্রডকাস্ট করা হচ্ছে..." : "Broadcasting..."}
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          {locale === "bn" ? "নোটিফিকেশন পাঠান (Broadcast Now)" : "Send Broadcast Alert"}
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* PAST BROADCASTS HISTORY */}
              <Card className="border border-border/50 bg-card/60 backdrop-blur-xl shadow-md">
                <CardHeader className="py-4">
                  <CardTitle className="text-base font-bold">
                    {locale === "bn" ? "ব্রডকাস্টের পূর্ববর্তী ইতিহাস" : "Broadcast History"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-0">
                  {broadcastsLoading ? (
                    <div className="px-6 space-y-2">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : broadcasts.length === 0 ? (
                    <p className="px-6 py-4 text-xs text-muted-foreground text-center">
                      {locale === "bn" ? "কোনো নোটিফিকেশন ব্রডকাস্ট করার ইতিহাস নেই।" : "No broadcast history found."}
                    </p>
                  ) : (
                    <div className="divide-y divide-border/40 max-h-[300px] overflow-y-auto">
                      {broadcasts.map((br) => {
                        const style = getNotifClass(br.type);
                        return (
                          <div key={br.id} className="p-4 text-xs sm:text-sm flex gap-3 items-start hover:bg-muted/20 transition-colors group/history relative">
                            <div className={cn("p-1.5 rounded-lg border shrink-0", style.bg)}>
                              <style.icon className="w-4.5 h-4.5" />
                            </div>
                            <div className="flex-1 min-w-0 space-y-1 pr-6">
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-extrabold text-foreground truncate">{br.title}</p>
                                <span className="text-[10px] text-muted-foreground shrink-0 font-medium group-hover/history:opacity-0 transition-opacity">
                                  {new Date(br.createdAt).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-US", {
                                    month: "short",
                                    day: "numeric",
                                    hour: "numeric",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                              <p className="text-muted-foreground font-normal text-xs leading-relaxed">{br.message}</p>
                            </div>

                            {/* DELETE BROADCAST HISTORY ITEM */}
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (!confirm(locale === "bn" ? "এই ব্রডকাস্টটি ইতিহাস থেকে মুছে ফেলতে চান?" : "Are you sure you want to delete this broadcast?")) return;
                                try {
                                  const res = await fetch(`/api/admin/broadcast?id=${br.id}`, { method: "DELETE" });
                                  if (res.ok) {
                                    toast.success(locale === "bn" ? "ব্রডকাস্ট মুছে ফেলা হয়েছে" : "Broadcast deleted");
                                    fetchBroadcasts();
                                  } else {
                                    throw new Error("Failed");
                                  }
                                } catch {
                                  toast.error("Failed to delete broadcast");
                                }
                              }}
                              className="absolute right-3 top-4 p-1 rounded hover:bg-destructive/10 text-muted-foreground/40 hover:text-destructive opacity-0 group-hover/history:opacity-100 transition-opacity"
                              aria-label="Delete Broadcast"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* LIVE SMARTPHONE PREVIEW (5 cols) */}
            <div className="lg:col-span-5 sticky top-24">
              <Card className="border-none bg-transparent shadow-none">
                <CardHeader className="px-0 py-0 pb-3 text-center lg:text-left">
                  <CardTitle className="text-sm font-bold flex items-center justify-center lg:justify-start gap-1.5">
                    <Smartphone className="w-4.5 h-4.5 text-primary" />
                    {locale === "bn" ? "মোবাইল লাইভ প্রিভিউ" : "Live Phone Push Preview"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center p-0">
                  {/* Phone frame container */}
                  <div className="w-[270px] h-[520px] rounded-[40px] border-[8px] border-zinc-800 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-neutral-950 to-neutral-900 shadow-2xl relative overflow-hidden flex flex-col items-center">
                    
                    {/* Notch */}
                    <div className="absolute top-2 w-28 h-4 rounded-full bg-black z-30 flex items-center justify-between px-4 text-[7px] text-white/70">
                      <span className="font-semibold">9:41</span>
                      <div className="w-2.5 h-2.5 rounded-full bg-white/20 scale-[0.7] flex items-center justify-center" />
                    </div>

                    {/* Lock Screen Wallpaper */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/35 via-zinc-950/90 to-purple-950/40 z-0" />
                    
                    {/* Time & Date */}
                    <div className="relative z-10 text-center mt-12 space-y-0.5 text-white/80">
                      <p className="text-[10px] font-medium tracking-wide uppercase opacity-70">
                        {new Date().toLocaleDateString(locale === "bn" ? "bn-BD" : "en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <h2 className="text-3xl font-extrabold tracking-tight">09:41</h2>
                    </div>

                    {/* LIVE SMARTPHONE NOTIFICATION PREVIEW CONTAINER */}
                    <div className="relative z-10 w-full px-3 mt-12 flex-1 flex flex-col justify-start">
                      
                      {/* Interactive Widget box */}
                      <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 text-white shadow-lg space-y-1.5 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <div className="grid place-items-center w-5 h-5 rounded-md bg-premium-gradient shrink-0">
                              <Wallet className="w-3 h-3 text-white" />
                            </div>
                            <span className="text-[10px] font-bold opacity-80 tracking-wide">
                              OwnManage
                            </span>
                          </div>
                          <span className="text-[8px] opacity-60">
                            {locale === "bn" ? "এখন" : "now"}
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="text-[11px] font-extrabold tracking-tight text-white/95 break-words">
                            {broadcastTitle.trim() || (locale === "bn" ? "নোটিফিকেশন টাইটেল প্রিভিউ" : "Notification Title Preview")}
                          </h4>
                          <p className="text-[10px] text-white/70 leading-normal font-normal break-words line-clamp-3">
                            {broadcastMessage.trim() || (locale === "bn" ? "টাইপ করার সাথে সাথে নোটিফিকেশন কেমন দেখাবে তা এখানে লাইভ প্রিভিউ দেখতে পাবেন..." : "Type in composer to see dynamic visual updates instantly...")}
                          </p>
                        </div>
                      </div>

                    </div>

                    {/* Phone swipe indicator at bottom */}
                    <div className="absolute bottom-2.5 w-24 h-1 rounded-full bg-white/40 z-20" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="rounded-2xl border bg-card/95 backdrop-blur-xl max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("leaderboard.editUser")}</DialogTitle>
            <DialogDescription>
              {t("leaderboard.updateUserDetails", { name: editingUser?.name ?? "" })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label htmlFor="name">{t("common.fullName")}</Label>
              <Input
                id="name"
                defaultValue={editingUser?.name}
                placeholder="John Doe"
                className="rounded-xl border-border/60 bg-background/40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("common.email")}</Label>
              <Input
                id="email"
                defaultValue={editingUser?.email}
                placeholder="john@example.com"
                className="rounded-xl border-border/60 bg-background/40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Profile Image URL</Label>
              <Input
                id="image"
                defaultValue={editingUser?.image ?? ""}
                placeholder="https://..."
                className="rounded-xl border-border/60 bg-background/40"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEditingUser(null)} className="rounded-xl">
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
                    headers: { "Content-Type": "application/json" },
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
              className="rounded-xl"
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("common.saveChanges")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation */}
      <Dialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <DialogContent className="rounded-2xl border bg-card/95 backdrop-blur-xl max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("leaderboard.deleteUser")}</DialogTitle>
            <DialogDescription>
              {t("leaderboard.confirmDeleteUser")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeletingId(null)} className="rounded-xl">
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
              className="rounded-xl"
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
          "relative overflow-hidden border border-border/40 bg-card/75 backdrop-blur-xl shadow-md",
          row.isCurrentUser && "ring-2 ring-primary border-transparent",
        )}
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${meta.color} opacity-[0.07]`} />
        <CardContent className="relative p-5 flex items-center gap-4">
          <div className={`grid place-items-center w-12 h-12 rounded-xl bg-gradient-to-br ${meta.color} text-white shadow-lg shrink-0`}>
            <meta.icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-extrabold">
              {meta.label}
            </p>
            <p className="font-bold truncate text-sm sm:text-base text-foreground">{row.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("leaderboard.savings")} <span className="font-medium text-foreground"><CurrencyValue value={row.savings} currency={currency} /></span>
            </p>
          </div>
          <Avatar className="w-10 h-10 border border-white/20">
            {row.image && <AvatarImage src={row.image} />}
            <AvatarFallback>{getInitials(row.name)}</AvatarFallback>
          </Avatar>
        </CardContent>
      </Card>
    </motion.div>
  );
}
