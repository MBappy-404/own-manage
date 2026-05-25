"use client";

import * as React from "react";
import { Star, Send, Sparkles, CheckCircle, MessageSquare } from "lucide-react";
import { toast } from "sonner";

import { useI18n } from "@/lib/i18n/provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function FeedbackPage() {
  const { t, locale } = useI18n();
  const [rating, setRating] = React.useState<number>(5);
  const [message, setMessage] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [submitted, setSubmitted] = React.useState<boolean>(false);
  const [hoveredStar, setHoveredStar] = React.useState<number | null>(null);

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
      setSubmitted(true);
      toast.success(t("feedback.submitted"));
      setMessage("");
    } catch (err) {
      console.error(err);
      toast.error(locale === "bn" ? "সাবমিট করা সম্ভব হয়নি। আবার চেষ্টা করুন।" : "Failed to submit. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 flex flex-col items-center justify-center min-h-[400px]">
        <Card className="w-full border-none bg-card/60 backdrop-blur-xl shadow-xl p-6 sm:p-8 text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-success/15 border border-success/30 flex items-center justify-center animate-bounce">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {locale === "bn" ? "ধন্যবাদ! মতামত সফল হয়েছে" : "Feedback Received!"}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("feedback.submitted")}
            </p>
          </div>
          <Button
            onClick={() => setSubmitted(false)}
            variant="outline"
            className="rounded-2xl px-6"
          >
            {locale === "bn" ? "আবার মতামত দিন" : "Submit Another Feedback"}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 sm:py-10 px-4 space-y-6">
      <header className="space-y-1">
        <div className="inline-flex items-center gap-2 text-xs text-primary font-bold uppercase tracking-wide px-3 py-1 rounded-full bg-primary/10 mb-1">
          <MessageSquare className="w-4 h-4" /> {locale === "bn" ? "ফিডব্যাক" : "FEEDBACK"}
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
          {t("feedback.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("feedback.subtitle")}
        </p>
      </header>

      <Card className="border border-border/50 bg-card/60 backdrop-blur-xl shadow-lg relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-10 opacity-5">
          <Sparkles className="w-36 h-36 text-primary" />
        </div>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold">
            {locale === "bn" ? "আপনার অভিজ্ঞতা নির্ধারণ করুন" : "Rate Your Experience"}
          </CardTitle>
          <CardDescription>
            {locale === "bn" ? "অ্যাপটি সম্পর্কে আপনার সামগ্রিক রেটিং দিন" : "How would you rate OwnManage?"}
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                        className={`w-8 h-8 sm:w-10 sm:h-10 transition-colors ${
                          isActive
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
              className="w-full sm:w-auto rounded-2xl px-8 shadow-md gap-2 font-bold transition-all hover:shadow-lg active:scale-95"
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
  );
}
