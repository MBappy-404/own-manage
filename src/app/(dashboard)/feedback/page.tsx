"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Send,
  Sparkles,
  CheckCircle,
  MessageSquare,
  Trash2,
  Pencil,
  Calendar,
  CheckSquare,
  Clock,
  X,
  User,
  AlertCircle,
  Mail
} from "lucide-react";
import { toast } from "sonner";

import { useI18n } from "@/lib/i18n/provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

type FeedbackItem = {
  id: string;
  userId: string;
  name: string;
  email: string;
  message: string;
  rating: number;
  status: "PENDING" | "DONE";
  adminResponse?: string | null;
  createdAt: string;
};

const ADMIN_EMAIL = "sadikulsad0810@gmail.com";

export default function FeedbackPage() {
  const { data: session } = useSession();
  const { t, locale } = useI18n();
  const isAdmin = session?.user?.email === ADMIN_EMAIL;

  // Form states
  const [rating, setRating] = React.useState<number>(5);
  const [message, setMessage] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [hoveredStar, setHoveredStar] = React.useState<number | null>(null);

  // List states
  const [feedbacks, setFeedbacks] = React.useState<FeedbackItem[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);

  // Modals / Interactive states
  const [editingFeedback, setEditingFeedback] = React.useState<FeedbackItem | null>(null);
  const [editMessage, setEditMessage] = React.useState<string>("");
  const [editRating, setEditRating] = React.useState<number>(5);
  const [editHoveredStar, setEditHoveredStar] = React.useState<number | null>(null);
  const [editSubmitting, setEditSubmitting] = React.useState<boolean>(false);

  const [resolvingFeedback, setResolvingFeedback] = React.useState<FeedbackItem | null>(null);
  const [adminReply, setAdminReply] = React.useState<string>("");
  const [resolveSubmitting, setResolveSubmitting] = React.useState<boolean>(false);

  const [deletingFeedback, setDeletingFeedback] = React.useState<FeedbackItem | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = React.useState<boolean>(false);

  // Fetch feedbacks
  const fetchFeedbacks = React.useCallback(async () => {
    try {
      const res = await fetch("/api/feedback", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setFeedbacks(data);
    } catch (err) {
      console.error(err);
      toast.error(locale === "bn" ? "ফিডব্যাক লোড করা সম্ভব হয়নি।" : "Failed to load feedbacks.");
    } finally {
      setLoading(false);
    }
  }, [locale]);

  React.useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  // Submit new feedback
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error(locale === "bn" ? "অনুগ্রহ করে কিছু মতামত লিখুন!" : "Please write some message!");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, message }),
      });

      if (!res.ok) throw new Error("Failed to submit");

      toast.success(t("feedback.submitted"));
      setMessage("");
      setRating(5);
      fetchFeedbacks();
    } catch (err) {
      console.error(err);
      toast.error(locale === "bn" ? "সাবমিট করা সম্ভব হয়নি। আবার চেষ্টা করুন।" : "Failed to submit. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit edited feedback
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFeedback) return;
    if (!editMessage.trim()) {
      toast.error(locale === "bn" ? "মতামত খালি রাখা যাবে না!" : "Message cannot be empty!");
      return;
    }

    setEditSubmitting(true);
    try {
      const res = await fetch(`/api/feedback/${editingFeedback.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: editRating, message: editMessage }),
      });

      if (!res.ok) throw new Error("Failed to update");

      toast.success(locale === "bn" ? "মতামত সফলভাবে আপডেট করা হয়েছে।" : "Feedback updated successfully.");
      setEditingFeedback(null);
      fetchFeedbacks();
    } catch (err) {
      console.error(err);
      toast.error(locale === "bn" ? "আপডেট করা সম্ভব হয়নি।" : "Failed to update feedback.");
    } finally {
      setEditSubmitting(false);
    }
  };

  // Submit admin reply & resolve feedback
  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingFeedback) return;
    if (!adminReply.trim()) {
      toast.error(locale === "bn" ? "দয়া করে একটি রিপ্লাই লিখুন!" : "Please write a response message!");
      return;
    }

    setResolveSubmitting(true);
    try {
      const res = await fetch(`/api/feedback/${resolvingFeedback.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DONE", adminResponse: adminReply }),
      });

      if (!res.ok) throw new Error("Failed to resolve");

      toast.success(locale === "bn" ? "মতামতটি সফলভাবে সম্পন্ন চিহ্নিত করা হয়েছে।" : "Feedback marked as completed successfully.");
      setResolvingFeedback(null);
      setAdminReply("");
      fetchFeedbacks();
    } catch (err) {
      console.error(err);
      toast.error(locale === "bn" ? "সমাধান সাবমিট করা সম্ভব হয়নি।" : "Failed to submit resolution.");
    } finally {
      setResolveSubmitting(false);
    }
  };

  // Confirm delete feedback
  const handleDeleteConfirm = async () => {
    if (!deletingFeedback) return;

    setDeleteSubmitting(true);
    try {
      const res = await fetch(`/api/feedback/${deletingFeedback.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      toast.success(locale === "bn" ? "মতামত সফলভাবে মুছে ফেলা হয়েছে।" : "Feedback deleted successfully.");
      setDeletingFeedback(null);
      fetchFeedbacks();
    } catch (err) {
      console.error(err);
      toast.error(locale === "bn" ? "মুছে ফেলা সম্ভব হয়নি।" : "Failed to delete feedback.");
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:py-10 px-4 space-y-8 relative">

      {/* HEADER SECTION */}
      <header className="space-y-2 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 text-xs text-primary font-bold uppercase tracking-wide px-3 py-1 rounded-full bg-primary/10 mb-1">
          <MessageSquare className="w-4 h-4" />
          {locale === "bn" ? "ফিডব্যাক ও পরামর্শ" : "FEEDBACK & SUGGESTIONS"}
        </div>
        <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-indigo-500 to-accent">
          {locale === "bn" ? "মতামত ও পরামর্শ" : "Give Feedback & Suggestions"}
        </h1>
        <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
          {locale === "bn"
            ? "OwnManage অ্যাপটি আপনার কেমন লাগছে বা কোনো পরামর্শ থাকলে আমাদের জানান! নিচে আপনি আপনার প্রেরিত মতামত এবং তার অগ্রগতির স্ট্যাটাস দেখতে পারবেন।"
            : "Tell us what you think of OwnManage! Let us know if you have any suggestions, and track our reviews and status updates below."}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* SUBMISSION FORM - Left Col */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border border-border/50 bg-card/60 backdrop-blur-xl shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-10 opacity-5">
              <Sparkles className="w-36 h-36 text-primary" />
            </div>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                {locale === "bn" ? "নতুন মতামত জানান" : "Share New Feedback"}
              </CardTitle>
              <CardDescription>
                {locale === "bn" ? "আপনার সামগ্রিক রেটিং এবং পরামর্শ দিন" : "Provide your overall rating and suggestions"}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <form onSubmit={handleSubmit} className="space-y-6">

                {/* STARS */}
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider block">
                    {t("feedback.ratingLabel")}
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isActive = hoveredStar !== null ? star <= hoveredStar : star <= rating;
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoveredStar(star)}
                          onMouseLeave={() => setHoveredStar(null)}
                          className="p-1 focus:outline-none transition-transform hover:scale-125"
                          aria-label={`Rate ${star} stars`}
                        >
                          <Star
                            className={`w-8 h-8 sm:w-10 sm:h-10 transition-colors ${isActive
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground/30 fill-transparent"
                              }`}
                          />
                        </button>
                      );
                    })}
                    <span className="ml-3 text-sm font-bold text-muted-foreground tabular-nums">
                      {rating} / 5
                    </span>
                  </div>
                </div>

                {/* TEXTAREA */}
                <div className="space-y-2">
                  <label htmlFor="feedback-message" className="text-xs uppercase font-bold text-muted-foreground tracking-wider block">
                    {t("feedback.messageLabel")}
                  </label>
                  <Textarea
                    id="feedback-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t("feedback.messagePlaceholder")}
                    className="min-h-[140px] rounded-2xl border-border/50 bg-background/50 backdrop-blur-sm p-4 text-sm sm:text-base focus-visible:ring-primary focus-visible:border-primary"
                    maxLength={1000}
                  />
                  <div className="text-right text-[10px] text-muted-foreground">
                    {message.length} / 1000
                  </div>
                </div>

                {/* SUBMIT BUTTON */}
                <Button
                  type="submit"
                  disabled={submitting}
                  size="lg"
                  className="w-full rounded-2xl px-8 shadow-md gap-2 font-bold transition-all hover:shadow-lg active:scale-95 bg-primary hover:bg-primary/95 text-primary-foreground"
                >
                  {submitting ? (
                    t("feedback.submitting")
                  ) : (
                    <>
                      {t("feedback.submit")}
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* FEEDBACK HISTORY - Right Col */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border border-border/50 bg-card/60 backdrop-blur-xl shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold flex items-center justify-between">
                <span>
                  {isAdmin
                    ? (locale === "bn" ? "ব্যবহারকারীদের মতামত ও পরামর্শ তালিকা" : "All User Feedback History")
                    : (locale === "bn" ? "আপনার পাঠানো মতামত তালিকা" : "Your Feedback History")}
                </span>
                <Badge variant="secondary" className="px-2.5 py-0.5 rounded-full font-bold">
                  {feedbacks.length}
                </Badge>
              </CardTitle>
              <CardDescription>
                {isAdmin
                  ? (locale === "bn" ? "অ্যাপ ব্যবহারকারীদের বিভিন্ন ফিডব্যাক ও সমস্যা সমাধান করুন" : "Review and resolve app feedback sent by users")
                  : (locale === "bn" ? "আপনার পাঠানো পরামর্শ ও রিভিউ স্ট্যাটাস ট্র্যাক করুন" : "Track status and view resolutions of your suggestions")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-3">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm text-muted-foreground">{locale === "bn" ? "ফিডব্যাক লোড হচ্ছে..." : "Loading feedbacks..."}</p>
                </div>
              ) : feedbacks.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-border/50 rounded-2xl">
                  <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <h3 className="font-semibold text-foreground text-sm">
                    {locale === "bn" ? "কোনো মতামত পাওয়া যায়নি" : "No feedback found"}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                    {locale === "bn"
                      ? "এখন পর্যন্ত কোনো মতামত দেয়া হয়নি। অ্যাপকে আরও চমৎকার করতে আপনার মূল্যবান মতামত দিন!"
                      : "You haven't submitted any feedback yet. Share your thoughts to help us make the app awesome!"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
                  <AnimatePresence initial={false}>
                    {feedbacks.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="p-4 rounded-2xl border border-border/50 bg-background/50 backdrop-blur-sm space-y-3 relative overflow-hidden transition-all hover:bg-background/80 hover:shadow-md"
                      >
                        {/* Status Line */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            {item.status === "DONE" ? (
                              <Badge className="bg-success/15 text-success border-success/30 px-2 py-0.5 rounded-full flex items-center gap-1 font-bold text-[10px]">
                                <CheckCircle className="w-3 h-3" />
                                {locale === "bn" ? "সম্পন্ন" : "Done"}
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 font-bold text-[10px]">
                                <Clock className="w-3 h-3 animate-pulse" />
                                {locale === "bn" ? "পর্যালোচনাধীন" : "Pending Review"}
                              </Badge>
                            )}

                            {/* Stars */}
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`w-3.5 h-3.5 ${s <= item.rating
                                    ? "text-amber-400 fill-amber-400"
                                    : "text-muted-foreground/20 fill-transparent"
                                    }`}
                                />
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar className="w-3.5 h-3.5" />
                            <span className="tabular-nums">{formatDate(item.createdAt)}</span>
                          </div>
                        </div>

                        {/* Message text */}
                        <p className="text-sm leading-relaxed text-foreground break-words pr-2 font-medium">
                          {item.message}
                        </p>

                        {/* Admin info (Visible to Admin only) */}
                        {isAdmin && (
                          <div className="pt-1.5 pb-0.5 border-t border-border/30 flex items-center justify-between text-[11px] text-muted-foreground flex-wrap gap-2">
                            <span className="flex items-center gap-1 font-semibold text-primary">
                              <User className="w-3 h-3" /> {item.name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {item.email}
                            </span>
                          </div>
                        )}

                        {/* Admin response output bubble */}
                        {item.adminResponse && (
                          <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-1 relative animate-in fade-in slide-in-from-top-1 duration-300">
                            <div className="flex items-center gap-1.5 text-[10px] text-primary font-bold uppercase tracking-wider">
                              <MessageSquare className="w-3 h-3" />
                              {locale === "bn" ? "অ্যাডমিনের উত্তর" : "Admin Response"}
                            </div>
                            <p className="text-xs text-foreground leading-relaxed font-semibold">
                              {item.adminResponse}
                            </p>
                          </div>
                        )}

                        {/* Buttons section */}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/20">
                          {/* User action buttons */}
                          {!isAdmin && item.status === "PENDING" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 rounded-xl text-xs gap-1 font-bold border-border/60 hover:bg-background/80"
                                onClick={() => {
                                  setEditingFeedback(item);
                                  setEditMessage(item.message);
                                  setEditRating(item.rating);
                                }}
                              >
                                <Pencil className="w-3.5 h-3.5 text-primary" />
                                {locale === "bn" ? "সংশোধন" : "Edit"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 rounded-xl text-xs gap-1 font-bold border-destructive/20 hover:bg-destructive/10 text-destructive hover:border-destructive/30"
                                onClick={() => setDeletingFeedback(item)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                {locale === "bn" ? "মুছুন" : "Delete"}
                              </Button>
                            </>
                          )}

                          {/* Admin action buttons */}
                          {isAdmin && (
                            <>
                              {item.status === "PENDING" && (
                                <Button
                                  size="sm"
                                  className="h-8 rounded-xl text-xs gap-1 font-bold bg-success hover:bg-success/90 text-white"
                                  onClick={() => {
                                    setResolvingFeedback(item);
                                    setAdminReply("");
                                  }}
                                >
                                  <CheckSquare className="w-3.5 h-3.5" />
                                  {locale === "bn" ? "উত্তর ও সমাধান দিন" : "Reply & Resolve"}
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 rounded-xl text-xs gap-1 font-bold border-destructive/20 hover:bg-destructive/10 text-destructive hover:border-destructive/30"
                                onClick={() => setDeletingFeedback(item)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                {locale === "bn" ? "মুছুন" : "Delete"}
                              </Button>
                            </>
                          )}
                        </div>

                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

            </CardContent>
          </Card>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* EDIT MODAL DIALOG */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {editingFeedback && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setEditingFeedback(null)}
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-border/50 bg-card/95 backdrop-blur-2xl p-6 shadow-2xl z-10 space-y-5"
            >
              <button
                onClick={() => setEditingFeedback(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-background/80 transition-colors text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-1.5 pr-6">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Pencil className="w-5 h-5 text-primary animate-pulse" />
                  {locale === "bn" ? "মতামত সংশোধন করুন" : "Edit Your Feedback"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {locale === "bn"
                    ? "আপনার রেটিং এবং বিস্তারিত মতামত আপডেট করতে পারেন।"
                    : "You can update your message and rating suggestion."}
                </p>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">

                {/* Rating selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider block">
                    {t("feedback.ratingLabel")}
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isActive = editHoveredStar !== null ? star <= editHoveredStar : star <= editRating;
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setEditRating(star)}
                          onMouseEnter={() => setEditHoveredStar(star)}
                          onMouseLeave={() => setEditHoveredStar(null)}
                          className="p-0.5 focus:outline-none transition-transform hover:scale-115"
                        >
                          <Star
                            className={`w-8 h-8 transition-colors ${isActive
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground/30 fill-transparent"
                              }`}
                          />
                        </button>
                      );
                    })}
                    <span className="ml-2.5 text-sm font-bold text-muted-foreground">
                      {editRating} / 5
                    </span>
                  </div>
                </div>

                {/* Message input */}
                <div className="space-y-1.5">
                  <label htmlFor="edit-message" className="text-xs font-bold uppercase text-muted-foreground tracking-wider block">
                    {t("feedback.messageLabel")}
                  </label>
                  <Textarea
                    id="edit-message"
                    value={editMessage}
                    onChange={(e) => setEditMessage(e.target.value)}
                    className="min-h-[120px] rounded-2xl border-border bg-background p-4 text-sm focus-visible:ring-primary"
                    maxLength={1000}
                  />
                  <div className="text-right text-[10px] text-muted-foreground">
                    {editMessage.length} / 1000
                  </div>
                </div>

                {/* Submit buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="rounded-2xl px-5 font-bold"
                    onClick={() => setEditingFeedback(null)}
                  >
                    {locale === "bn" ? "বাতিল" : "Cancel"}
                  </Button>
                  <Button
                    type="submit"
                    disabled={editSubmitting}
                    className="rounded-2xl px-6 bg-primary text-primary-foreground font-bold hover:bg-primary/90"
                  >
                    {editSubmitting ? (locale === "bn" ? "আপডেট হচ্ছে..." : "Updating...") : (locale === "bn" ? "সংরক্ষণ করুন" : "Save Changes")}
                  </Button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* ADMIN RESOLVE MODAL DIALOG */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {resolvingFeedback && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setResolvingFeedback(null)}
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-border/50 bg-card/95 backdrop-blur-2xl p-6 shadow-2xl z-10 space-y-5"
            >
              <button
                onClick={() => setResolvingFeedback(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-background/80 transition-colors text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-1.5 pr-6">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-success" />
                  {locale === "bn" ? "মতামতের উত্তর ও সমাধান দিন" : "Reply & Resolve Feedback"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {locale === "bn"
                    ? "মতামত সম্পন্ন চিহ্নিত করতে ব্যবহারকারীকে একটি রেসপন্স বা সমাধান বার্তা পাঠান।"
                    : "Send a resolution response to the user to mark their feedback as resolved."}
                </p>
              </div>

              {/* Summary of original feedback */}
              <div className="p-3.5 rounded-2xl bg-muted/50 border border-border/40 text-xs space-y-1 text-muted-foreground max-h-[100px] overflow-y-auto">
                <div className="font-bold flex items-center gap-1 text-foreground">
                  <User className="w-3.5 h-3.5 text-primary" />
                  {resolvingFeedback.name} ({resolvingFeedback.email})
                </div>
                <p className="italic font-medium leading-relaxed">
                  &ldquo;{resolvingFeedback.message}&rdquo;
                </p>
              </div>

              <form onSubmit={handleResolveSubmit} className="space-y-4">

                {/* Admin Message reply input */}
                <div className="space-y-1.5">
                  <label htmlFor="admin-reply" className="text-xs font-bold uppercase text-muted-foreground tracking-wider block">
                    {locale === "bn" ? "সমাধান বা রেসপন্স বার্তা" : "Resolution Response Message"}
                  </label>
                  <Textarea
                    id="admin-reply"
                    value={adminReply}
                    onChange={(e) => setAdminReply(e.target.value)}
                    placeholder={locale === "bn" ? "যেমন: সমস্যাটি সমাধান করা হয়েছে! ফিডব্যাকের জন্য ধন্যবাদ।" : "e.g. This issue has been fixed in the latest version! Thank you for sharing."}
                    className="min-h-[100px] rounded-2xl border-border bg-background p-4 text-sm focus-visible:ring-primary"
                    maxLength={1000}
                  />
                </div>

                {/* Submit buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="rounded-2xl px-5 font-bold"
                    onClick={() => setResolvingFeedback(null)}
                  >
                    {locale === "bn" ? "বাতিল" : "Cancel"}
                  </Button>
                  <Button
                    type="submit"
                    disabled={resolveSubmitting}
                    className="rounded-2xl px-6 bg-success text-white font-bold hover:bg-success/90"
                  >
                    {resolveSubmitting ? (locale === "bn" ? "সাবমিট হচ্ছে..." : "Submitting...") : (locale === "bn" ? "সম্পন্ন করুন" : "Resolve & Done")}
                  </Button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION DIALOG */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {deletingFeedback && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setDeletingFeedback(null)}
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border/50 bg-card/95 backdrop-blur-2xl p-6 shadow-2xl z-10 space-y-4"
            >
              <div className="space-y-3">
                <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive">
                  <AlertCircle className="w-6 h-6 animate-bounce" />
                </div>
                <div className="text-center space-y-1">
                  <h3 className="text-lg font-bold text-foreground">
                    {locale === "bn" ? "ফিডব্যাকটি মুছে ফেলতে চান?" : "Are you sure?"}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {locale === "bn"
                      ? "এই মতামতটি স্থায়ীভাবে মুছে ফেলা হবে এবং এটি আর উদ্ধার করা যাবে না।"
                      : "This feedback will be permanently deleted. This action cannot be undone."}
                  </p>
                </div>
              </div>

              {/* Submit buttons */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-2xl px-5 font-bold"
                  onClick={() => setDeletingFeedback(null)}
                >
                  {locale === "bn" ? "বাতিল" : "Cancel"}
                </Button>
                <Button
                  type="button"
                  disabled={deleteSubmitting}
                  className="rounded-2xl px-6 bg-destructive text-destructive-foreground font-bold hover:bg-destructive/95"
                  onClick={handleDeleteConfirm}
                >
                  {deleteSubmitting ? (locale === "bn" ? "মুছে ফেলা হচ্ছে..." : "Deleting...") : (locale === "bn" ? "নিশ্চিত মুছুন" : "Confirm Delete")}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
