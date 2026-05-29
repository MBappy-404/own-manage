import {
  BookOpen,
  TrendingUp,
  TrendingDown,
  CreditCard,
  PiggyBank,
  Brain,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { getServerSession } from "next-auth";
import Link from "next/link";

import { authOptions } from "@/lib/auth";
import { getServerT } from "@/lib/i18n/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";


export const metadata = { title: "User Guide" };

export default async function GuidePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const { locale } = getServerT();

  const bnGuide = {
    title: "ব্যবহারকারী নির্দেশিকা (User Guide) 📘",
    subtitle: "OwnManage অ্যাপটি ব্যবহারের বিস্তারিত ও সহজ নির্দেশিকা",
    intro: "নিজের অর্থ ব্যবস্থাপনায় পারদর্শী হতে এবং ভবিষ্যতের স্মার্ট আর্থিক পরিকল্পনা গড়তে OwnManage-এ আপনাকে স্বাগতম! নিচে অ্যাপটির প্রধান ফিচারগুলো এবং সেগুলো সঠিকভাবে ব্যবহারের নিয়মগুলো দেওয়া হলো:",
    steps: [
      {
        icon: TrendingUp,
        title: "১. আয় এবং আয়ের উৎস যুক্ত করা 💵",
        desc: "আপনার প্রতি মাসের বেতন, বোনাস, ফ্রিল্যান্সিং বা গিফট থেকে আসা যেকোনো অর্থ সাথে সাথে ড্যাশবোর্ডের উপরে থাকা 'আয় যোগ করুন' বাটনে ক্লিক করে যুক্ত করুন। নিয়মিত আয় ট্র্যাকিং করার মাধ্যমে AI আপনার আয়ের ধারা বুঝতে পারে এবং সঠিক ভবিষ্যৎ পরিকল্পনা তৈরি করতে পারে।",
        tip: "পরামর্শ: নিয়মিত বা এককালীন (One-time) ফ্রিকোয়েন্সি সিলেক্ট করে আপনার আয়ের ধরন নির্ধারণ করতে পারেন।",
        color: "text-success bg-success/15 border-success/30",
      },
      {
        icon: TrendingDown,
        title: "২. দৈনিক খরচ বা ব্যয় লিখে রাখা 💸",
        desc: "আপনি প্রতিদিন যা খরচ করছেন—কাঁচাবাজার, রেস্টুরেন্ট, ইউটিলিটি বিল বা মোবাইল রিচার্জ—সবকিছুই 'ব্যয় যোগ করুন' অপশন থেকে ক্যাটেগরি অনুযায়ী লিখে রাখুন। যত বেশি খরচের হিসাব লিখবেন, এআই তত নিখুঁতভাবে আপনার অপ্রয়োজনীয় খরচের খাত চিহ্নিত করতে পারবে।",
        tip: "পরামর্শ: খরচ লেখার সময় 'মার্চেন্ট / কিসের জন্য' ফিল্ডে নাম উল্লেখ করলে কোন দোকানে কত ব্যয় হচ্ছে তা বিশ্লেষণ করা সহজ হয়।",
        color: "text-destructive bg-destructive/15 border-destructive/30",
      },
      {
        icon: CreditCard,
        title: "৩. ওয়ালেট ও বিভিন্ন ওয়ালেট ব্যালেন্স লিঙ্ক করা 🏦",
        desc: "নিরাপত্তা আমাদের সর্বোচ্চ অগ্রাধিকার! OwnManage-এ আপনার কোনো ব্যাংক অ্যাকাউন্ট নম্বর, পাসওয়ার্ড বা বিকাশ/নগদের পিন নম্বরের মতো সংবেদনশীল কোনো পেমেন্ট তথ্য দিতে হবে না। আপনার ক্যাশ, বিকাশ বা ব্যাংকে এই মুহূর্তে কত টাকা আছে, শুধুমাত্র সেই টাকার অংকটি (Amount) প্রারম্ভিক ব্যালেন্স হিসেবে বসিয়ে দিলেই আপনি আপনার আয় ও ব্যয়ের নিখুঁত হিসাব রাখতে পারবেন। পরবর্তীতে যেকোনো আয় বা ব্যয় ট্র্যাকিং-এর সময় নির্দিষ্ট ওয়ালেটটি সিলেক্ট করলেই ব্যালেন্স স্বয়ংক্রিয়ভাবে আপডেট (Auto Update) হয়ে যাবে। ফলে কোনো পেমেন্ট ইনফো ছাড়াই আপনার সকল আর্থিক ডেটা থাকবে ১০০% নিরাপদ ও সম্পূর্ণ সুরক্ষিত।",
        tip: "পরামর্শ: BKash বা Nagad-এ লেনদেনের সময় পেমেন্ট মাধ্যম বিকাশ/নগদ সিলেক্ট করতে পারেন। কোনো সংবেদনশীল ব্যাংক ডিটেইলস প্রয়োজন নেই।",
        color: "text-blue-500 bg-blue-500/15 border-blue-500/30",
      },
      {
        icon: Brain,
        title: "৪. আর্থিক বুদ্ধিমত্তা ও এআই পরামর্শ নেওয়া 🧠",
        desc: "এটি আমাদের অ্যাপের সবচেয়ে শক্তিশালী ফিচার! 'আর্থিক বিশ্লেষণ' (AI Insights) পেজে গেলে এআই আপনার আজীবন খরচের গড় এবং আয়ের তুলনা করে আপনার মাসিক ঘাটতি বা উদ্বৃত্তের হিসাব বের করবে। ঘাটতি থাকলে আপনাকে কীভাবে বাজেট বণ্টন করতে হবে এবং কত টাকা অতিরিক্ত আয় করতে হবে তার চমৎকার বিশ্লেষণ ও কাস্টম পরামর্শ দেওয়া হবে।",
        tip: "পরামর্শ: এআই ৫০-৩০-২০ নিয়মের ওপর ভিত্তি করে আপনার ক্যাটেগরিগুলোর তুলনামূলক সীমার লাইভ প্রগ্রেস বার প্রদর্শন করবে।",
        color: "text-purple-500 bg-purple-500/15 border-purple-500/30",
      },
      {
        icon: PiggyBank,
        title: "৫. সঞ্চয়ের সুনির্দিষ্ট লক্ষ্যমাত্রা নির্ধারণ 🎯",
        desc: "জরুরি ফান্ড তৈরি, নতুন ফোন কেনা বা ঘুরতে যাওয়ার জন্য 'সঞ্চয় লক্ষ্যমাত্রা' (Savings Goals) পেজে গিয়ে লক্ষ্য তৈরি করুন। লক্ষ্যমাত্রা ও ডেডলাইন সেট করে দিলে আপনি আপনার জমানো অর্থের প্রগ্রেস দেখতে পাবেন।",
        tip: "পরামর্শ: নিয়মিত খরচের পাশাপাশি ছোট সঞ্চয় লক্ষ্যমাত্রা গড়ে তোলার মাধ্যমে আর্থিক শৃঙ্খলা বৃদ্ধি পায়।",
        color: "text-teal-500 bg-teal-500/15 border-teal-500/30",
      },
    ],
    cta: "ড্যাশবোর্ডে ফিরে যান",
  };

  const enGuide = {
    title: "User Guide 📘",
    subtitle: "Complete interactive guide on how to master OwnManage",
    intro: "Welcome to OwnManage! To help you manage your personal finances like a fintech pro, we've prepared a comprehensive guide explaining the key features of the application:",
    steps: [
      {
        icon: TrendingUp,
        title: "1. Log Income & Sources 💵",
        desc: "Add every salary, bonus, freelance earnings, or gig income by tapping the 'Add Income' button on the dashboard. Logging income helps our AI engines analyze your regular cash flow.",
        tip: "Tip: Use flexible frequencies (daily, monthly, yearly) to match your real payment cycles.",
        color: "text-success bg-success/15 border-success/30",
      },
      {
        icon: TrendingDown,
        title: "2. Track Expenses Diligently 💸",
        desc: "Log all your purchases—groceries, bills, dining out, or rent—using the 'Add Expense' button. The more transactions you enter, the more accurate the AI's smart warnings and spending alerts will be.",
        tip: "Tip: Add details in the 'Merchant' field to identify where your money flows most.",
        color: "text-destructive bg-destructive/15 border-destructive/30",
      },
      {
        icon: CreditCard,
        title: "3. Set Up Wallets & Account Balances 🏦",
        desc: "Security is our top priority! You do not need to share any sensitive banking or payment details—no bank account numbers, passwords, or mobile wallet PINs are required. Simply set the current cash or balance amounts you have in your accounts as a starting point. When you log transactions and select a wallet, your balances will automatically update (Auto Update) in real-time. This lets you track your real income and expenses perfectly without entering any private financial credentials, keeping your data 100% secure and private.",
        tip: "Tip: Select BKash/Nagad during transactions; absolutely no real banking credentials or sensitive inputs are required.",
        color: "text-blue-500 bg-blue-500/15 border-blue-500/30",
      },
      {
        icon: Brain,
        title: "4. Get AI Financial Intelligence 🧠",
        desc: "Under 'AI Insights', the engine analyzes your lifetime average spending and income to forecast surpluses or deficits. It details exactly how much extra you need to earn and suggests specific category budgets.",
        tip: "Tip: Follow the gold-standard 50/30/20 budget allocations visualized dynamically on the insights page.",
        color: "text-purple-500 bg-purple-500/15 border-purple-500/30",
      },
      {
        icon: PiggyBank,
        title: "5. Hit Your Savings Goals 🎯",
        desc: "Create savings milestones (emergency fund, travel, electronics) with target amounts and timelines. Visualize your live completion rate and deadline indicators.",
        tip: "Tip: Pay Yourself First by automating savings goals when monthly income hits.",
        color: "text-teal-500 bg-teal-500/15 border-teal-500/30",
      },
    ],
    cta: "Back to Dashboard",
  };

  const guide = locale === "bn" ? bnGuide : enGuide;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <header className="text-center sm:text-left">
        <div className="inline-flex items-center justify-center sm:justify-start gap-2 text-xs text-primary font-bold uppercase tracking-wide px-3 py-1 rounded-full bg-primary/10 mb-2">
          <BookOpen className="w-4 h-4" /> {locale === "bn" ? "ব্যবহারবিধি" : "HOW TO USE"}
        </div>
        <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight mt-1 bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
          {guide.title}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {guide.subtitle}
        </p>
      </header>

      <section className="p-5 rounded-2xl bg-card border shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5">
          <Sparkles className="w-48 h-48 text-primary" />
        </div>
        <p className="text-sm md:text-base leading-relaxed text-muted-foreground relative z-10 font-medium">
          {guide.intro}
        </p>
      </section>

      {/* STEP CARDS */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {guide.steps.map((step, idx) => {
          const StepIcon = step.icon;
          return (
            <Card key={idx} className="border border-border/50 bg-card/60 backdrop-blur-xl relative overflow-hidden group hover:border-primary/30 transition-all duration-300">
              <CardHeader className="pb-2 flex flex-row items-center gap-3">
                <div className={`grid place-items-center w-10 h-10 rounded-xl border shrink-0 ${step.color}`}>
                  <StepIcon className="w-5 h-5" />
                </div>
                <CardTitle className="text-base font-bold leading-snug">
                  {step.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs md:text-sm text-muted-foreground leading-relaxed">
                <p>{step.desc}</p>
                {step.tip && (
                  <div className="p-2.5 rounded-xl bg-muted/50 border border-border/30 text-xs text-primary font-medium flex items-start gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 mt-0.5 shrink-0 animate-pulse text-primary" />
                    <span>{step.tip}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </section>

      <div className="flex justify-center pt-4">
        <Button asChild size="lg" className="rounded-2xl px-8 shadow-md">
          <Link href="/dashboard" className="inline-flex items-center gap-2">
            {guide.cta}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
