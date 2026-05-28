import {
  Brain,
  TrendingUp,
  TrendingDown,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Wallet,
  PiggyBank,
  Activity,
} from "lucide-react";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getServerT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { generateInsights } from "@/lib/insights";
import {
  bestEarningMonth,
  buildMonthlySeries,
  categoryBreakdown,
  filterByInterval,
  highestSpendingDay,
  lowestSpendingDay,
  periodInterval,
  sumAmount,
  financialHealthScore,
} from "@/lib/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InsightsList } from "@/components/dashboard/insights-list";
import { IncomeExpenseArea } from "@/components/charts/area-chart";
import { formatCurrency } from "@/lib/utils";
import { AISummaryCard } from "@/components/dashboard/ai-summary-card";
import { getDate, getDaysInMonth } from "date-fns";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = { title: "AI Insights" };

export default async function InsightsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const userId = session.user.id;
  const currency = session.user.currency || "BDT";
  const { t, locale } = getServerT();

  const [incomes, expenses, profile] = await Promise.all([
    prisma.income.findMany({ where: { userId }, orderBy: { date: "desc" } }),
    prisma.expense.findMany({ where: { userId }, orderBy: { date: "desc" } }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { monthlyBudget: true },
    }),
  ]);

  const insights = generateInsights({
    incomes,
    expenses,
    monthlyBudget: profile?.monthlyBudget,
    t,
  });

  const month = periodInterval("month");
  const monthExp = filterByInterval(expenses, month.start, month.end);
  const monthInc = filterByInterval(incomes, month.start, month.end);

  const now = new Date();
  const currentDay = getDate(now);
  const totalDays = getDaysInMonth(now);
  const sumExpThis = sumAmount(monthExp);
  const projectedSpend = currentDay > 0 ? (sumExpThis / currentDay) * totalDays : 0;

  const healthScore = financialHealthScore({
    income: sumAmount(monthInc),
    expense: sumExpThis,
    monthlyBudget: profile?.monthlyBudget,
    expenseCount: monthExp.length,
  });

  const top = categoryBreakdown(monthExp)[0];
  const peak = highestSpendingDay(expenses);
  const low = lowestSpendingDay(expenses);
  const best = bestEarningMonth(incomes);

  // ─── LIFETIME AVERAGES & ACTIVE MONTHS ───
  const allTransactionDates = [...incomes, ...expenses].map((item) => new Date(item.date).getTime());
  const oldestTxDate = allTransactionDates.length > 0 ? new Date(Math.min(...allTransactionDates)) : now;
  const activeMonths = Math.max(
    1,
    (now.getFullYear() - oldestTxDate.getFullYear()) * 12 + (now.getMonth() - oldestTxDate.getMonth()) + 1
  );

  const totalLifetimeIncome = sumAmount(incomes);
  const totalLifetimeExpense = sumAmount(expenses);

  const avgMonthlyIncome = totalLifetimeIncome / activeMonths;
  const avgMonthlyExpense = totalLifetimeExpense / activeMonths;
  const avgMonthlySavings = avgMonthlyIncome - avgMonthlyExpense;
  const avgSavingsRate = avgMonthlyIncome > 0 ? (avgMonthlySavings / avgMonthlyIncome) * 100 : 0;

  // ─── CATEGORY LIFETIME AVERAGES ───
  const foodCats = ["FOOD", "GROCERIES", "DINING", "SNACKS"];
  const housingCats = ["RENT", "HOUSING", "BILLS", "UTILITIES", "INTERNET", "PHONE", "MOBILE_RECHARGE", "INSURANCE", "LOAN"];
  const shoppingCats = ["SHOPPING", "CLOTHING", "ELECTRONICS", "ENTERTAINMENT", "TRAVEL", "GIFTS", "SUBSCRIPTIONS"];

  const totalFood = expenses.filter(e => foodCats.includes(e.category.toUpperCase())).reduce((a, b) => a + b.amount, 0);
  const totalHousing = expenses.filter(e => housingCats.includes(e.category.toUpperCase())).reduce((a, b) => a + b.amount, 0);
  const totalShopping = expenses.filter(e => shoppingCats.includes(e.category.toUpperCase())).reduce((a, b) => a + b.amount, 0);

  const actualMonthlyFood = totalFood / activeMonths;
  const actualMonthlyHousing = totalHousing / activeMonths;
  const actualMonthlyShopping = totalShopping / activeMonths;
  const actualMonthlySavings = avgMonthlySavings > 0 ? avgMonthlySavings : 0;

  // ─── BUDGET PLANNER RECOMMENDATIONS (50/30/20 & Custom Categories) ───
  const baseAllocation = avgMonthlyIncome > 0 ? avgMonthlyIncome : avgMonthlyExpense;
  const recFood = baseAllocation * 0.3;
  const recHousing = baseAllocation * 0.35;
  const recShopping = baseAllocation * 0.15;
  const recSavings = baseAllocation * 0.2;

  const pctFood = baseAllocation > 0 ? (actualMonthlyFood / baseAllocation) * 100 : 0;
  const pctHousing = baseAllocation > 0 ? (actualMonthlyHousing / baseAllocation) * 100 : 0;
  const pctShopping = baseAllocation > 0 ? (actualMonthlyShopping / baseAllocation) * 100 : 0;
  const pctSavings = baseAllocation > 0 ? (actualMonthlySavings / baseAllocation) * 100 : 0;

  const isFoodOver = actualMonthlyFood > recFood;
  const isHousingOver = actualMonthlyHousing > recHousing;
  const isShoppingOver = actualMonthlyShopping > recShopping;
  const isSavingsUnder = avgSavingsRate < 20;

  // ─── DEFICIT & EXTRA EARNING NEEDED ───
  const isDeficit = avgMonthlyExpense > avgMonthlyIncome;
  const deficitAmount = avgMonthlyExpense - avgMonthlyIncome;
  const recIncomeForHealthySavings = avgMonthlyExpense / 0.8;
  const extraIncomeNeeded = recIncomeForHealthySavings - avgMonthlyIncome;

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide font-medium">
          <Brain className="w-4 h-4 text-primary" /> {t("insights.engineLabel")}
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-1">
          {t("insights.title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("insights.subtitle")}</p>
      </header>

      <section className="space-y-6">
        <AISummaryCard
          healthScore={healthScore}
          projectedSpending={projectedSpend}
          monthlyBudget={profile?.monthlyBudget}
          currency={currency}
          locale={locale}
          topInsightMessage={insights[0]?.message}
        />

        <InsightsList insights={insights} />
      </section>

      {/* ─── AVERAGE MONTHLY REPORT GRID ─── */}
      <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          {t("insights.avgReportTitle")}
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-card border border-border/50 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <TrendingUp className="w-12 h-12 text-success" />
            </div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
              {t("insights.avgIncome")}
            </p>
            <p className="text-lg md:text-2xl font-bold mt-1 tracking-tight text-success">
              {formatCurrency(avgMonthlyIncome, currency, locale)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              {locale === "bn" ? `${activeMonths} মাসের হিসাব অনুযায়ী` : `Based on ${activeMonths} active months`}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border/50 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <TrendingDown className="w-12 h-12 text-destructive" />
            </div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
              {t("insights.avgExpense")}
            </p>
            <p className="text-lg md:text-2xl font-bold mt-1 tracking-tight text-destructive">
              {formatCurrency(avgMonthlyExpense, currency, locale)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              {locale === "bn" ? `প্রতি মাসের গড় খরচ` : `Average spend per month`}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border/50 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <Wallet className="w-12 h-12 text-primary" />
            </div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
              {t("insights.avgSavings")}
            </p>
            <p className={`text-lg md:text-2xl font-bold mt-1 tracking-tight ${avgMonthlySavings >= 0 ? "text-primary" : "text-warning"}`}>
              {formatCurrency(avgMonthlySavings, currency, locale)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              {avgMonthlySavings >= 0 
                ? (locale === "bn" ? "উদ্বৃত্ত অর্থ" : "Surplus savings")
                : (locale === "bn" ? "মাসিক ঘাটতি পরিমাণ" : "Deficit budget")}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border/50 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <PiggyBank className="w-12 h-12 text-purple-500" />
            </div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
              {t("insights.avgSavingsRate")}
            </p>
            <p className="text-lg md:text-2xl font-bold mt-1 tracking-tight text-purple-600 dark:text-purple-400">
              {avgSavingsRate.toFixed(1)}%
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              {avgSavingsRate >= 20 
                ? (locale === "bn" ? "আদর্শ সঞ্চয়ের হার বজায় আছে" : "Healthy savings rate")
                : (locale === "bn" ? "সঞ্চয়ের হার বাড়ানো উচিত" : "Below 20% savings goal")}
            </p>
          </div>
        </div>
      </section>

      {/* ─── AI FINANCIAL PLANNING & PROJECTION SECTION ─── */}
      <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
        <Card className="border-none bg-gradient-to-br from-primary/5 via-background to-background shadow-md overflow-hidden border border-border/40">
          <CardHeader className="pb-3 flex flex-row items-center gap-2">
            <div className="grid place-items-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">
                {t("insights.projectionTitle")}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {locale === "bn" ? "আপনার গড় খরচের ওপর ভিত্তি করে ভবিষ্যতের আর্থিক পরিকল্পনা ও বিশ্লেষণ" : "Future financial roadmap and plan based on active spending habits"}
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isDeficit ? (
              <div className="p-4 rounded-2xl border border-destructive/20 bg-destructive/5 text-sm space-y-3">
                <div className="flex items-center gap-2 text-destructive font-bold text-base">
                  <AlertTriangle className="w-5 h-5" />
                  {t("insights.deficitWarning")}
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {locale === "bn" ? (
                    <>
                      আপনি বর্তমানে <strong>ঘাটতি বাজেটে</strong> চলছেন। আপনার গড় মাসিক আয় হচ্ছে <strong>{formatCurrency(avgMonthlyIncome, currency, locale)}</strong> কিন্তু গড় ব্যয় <strong>{formatCurrency(avgMonthlyExpense, currency, locale)}</strong>, যার ফলে প্রতি মাসে আপনার গড়ে <strong>{formatCurrency(deficitAmount, currency, locale)}</strong> ঘাটতি হচ্ছে।
                    </>
                  ) : (
                    <>
                      You are running on a <strong>deficit budget</strong>. Your average monthly income is <strong>{formatCurrency(avgMonthlyIncome, currency, locale)}</strong>, while your average monthly expense is <strong>{formatCurrency(avgMonthlyExpense, currency, locale)}</strong>, resulting in a recurring monthly deficit of <strong>{formatCurrency(deficitAmount, currency, locale)}</strong>.
                    </>
                  )}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl bg-background border border-border/40">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {locale === "bn" ? "জীবনযাত্রা বজায় রাখতে বাড়তি প্রয়োজন" : "Minimum Extra Income Required"}
                    </p>
                    <p className="text-xl font-bold mt-1 text-destructive">
                      {formatCurrency(deficitAmount, currency, locale)}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {locale === "bn" ? "শুধু বর্তমান খরচ মেটানোর জন্য প্রতি মাসে বাড়তি লাগবে" : "Per month needed just to cover your current expenses"}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-premium-gradient/10 border border-primary/25">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                      {locale === "bn" ? "আদর্শ আয়ের লক্ষ্যমাত্রা (২০% সঞ্চয় সহ)" : "Healthy Income Target (20% Savings)"}
                    </p>
                    <p className="text-xl font-bold mt-1 text-primary">
                      {formatCurrency(recIncomeForHealthySavings, currency, locale)}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {locale === "bn" 
                        ? `(যার জন্য আরও ${formatCurrency(extraIncomeNeeded, currency, locale)} বাড়তি আয় প্রয়োজন)` 
                        : `(Requires earning ${formatCurrency(extraIncomeNeeded, currency, locale)} more/mo)`}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl border border-success/20 bg-success/5 text-sm space-y-3">
                <div className="flex items-center gap-2 text-success font-bold text-base">
                  <CheckCircle2 className="w-5 h-5" />
                  {t("insights.surplusSignal")}
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {locale === "bn" ? (
                    <>
                      চমৎকার! আপনার বাজেট এবং খরচ পুরোপুরি নিয়ন্ত্রণে আছে। আপনার গড় মাসিক আয় হচ্ছে <strong>{formatCurrency(avgMonthlyIncome, currency, locale)}</strong> এবং গড় ব্যয় <strong>{formatCurrency(avgMonthlyExpense, currency, locale)}</strong>, যার ফলে প্রতি মাসে আপনার গড়ে <strong>{formatCurrency(avgMonthlySavings, currency, locale)}</strong> উদ্বৃত্ত থাকে। আপনার গড় সঞ্চয়ের হার <strong>{avgSavingsRate.toFixed(1)}%</strong> যা আদর্শ শৃঙ্খলার লক্ষণ।
                    </>
                  ) : (
                    <>
                      Excellent! Your budget and spending are fully under control. Your average monthly income is <strong>{formatCurrency(avgMonthlyIncome, currency, locale)}</strong>, while your average monthly expense is <strong>{formatCurrency(avgMonthlyExpense, currency, locale)}</strong>, allowing you to save <strong>{formatCurrency(avgMonthlySavings, currency, locale)}</strong> every month. Your average savings rate of <strong>{avgSavingsRate.toFixed(1)}%</strong> represents robust financial discipline.
                    </>
                  )}
                </p>
                <div className="p-3 rounded-xl bg-background border border-border/40 w-fit">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {locale === "bn" ? "মাসিক গড়ে উদ্বৃত্ত" : "Monthly Avg Surplus"}
                  </p>
                  <p className="text-xl font-bold mt-1 text-success">
                    {formatCurrency(avgMonthlySavings, currency, locale)}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ─── RECOMMENDED MONTHLY SPENDING PLAN ─── */}
      <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
        <Card className="border border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold">
              {t("insights.recommendedSpendTitle")}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {locale === "bn" ? "আয়ের ওপর ভিত্তি করে আদর্শ বাজেট (৫০-৩০-২০ নিয়ম) বনাম আপনার বর্তমান গড়ের তুলনা" : "Comparison between ideal budget framework (50-30-20 rule) and your real averages"}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* COMPARATIVE BARS */}
              <div className="space-y-4">
                
                {/* 1. Food */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span>{locale === "bn" ? "খাবার ও কাঁচাবাজার (Food & Meals)" : "Food & Meals"}</span>
                    <span className={isFoodOver ? "text-destructive" : "text-success"}>
                      {locale === "bn" 
                        ? `গড়: ${formatCurrency(actualMonthlyFood, currency, locale)} (${pctFood.toFixed(0)}%)`
                        : `Avg: ${formatCurrency(actualMonthlyFood, currency, locale)} (${pctFood.toFixed(0)}%)`}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
                      <div 
                        className={`h-full ${isFoodOver ? "bg-destructive" : "bg-success"}`} 
                        style={{ width: `${Math.min(pctFood, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>{locale === "bn" ? `প্রস্তাবিত: ${formatCurrency(recFood, currency, locale)} (৩০%)` : `Ideal Target: ${formatCurrency(recFood, currency, locale)} (30%)`}</span>
                      {isFoodOver && <span className="text-destructive font-semibold">{locale === "bn" ? "সীমা অতিরিক্ত!" : "Limit Exceeded!"}</span>}
                    </div>
                  </div>
                </div>

                {/* 2. Housing */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span>{locale === "bn" ? "বাসস্থান ও ইউটিলিটি বিল (Housing & Rent)" : "Housing & Utilities"}</span>
                    <span className={isHousingOver ? "text-destructive" : "text-success"}>
                      {locale === "bn" 
                        ? `গড়: ${formatCurrency(actualMonthlyHousing, currency, locale)} (${pctHousing.toFixed(0)}%)`
                        : `Avg: ${formatCurrency(actualMonthlyHousing, currency, locale)} (${pctHousing.toFixed(0)}%)`}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
                      <div 
                        className={`h-full ${isHousingOver ? "bg-destructive" : "bg-success"}`} 
                        style={{ width: `${Math.min(pctHousing, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>{locale === "bn" ? `প্রস্তাবিত: ${formatCurrency(recHousing, currency, locale)} (৩৫%)` : `Ideal Target: ${formatCurrency(recHousing, currency, locale)} (35%)`}</span>
                      {isHousingOver && <span className="text-destructive font-semibold">{locale === "bn" ? "সীমা অতিরিক্ত!" : "Limit Exceeded!"}</span>}
                    </div>
                  </div>
                </div>

                {/* 3. Shopping & Fun */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span>{locale === "bn" ? "কেনাকাটা ও বিনোদন (Shopping & Leisure)" : "Shopping & Fun"}</span>
                    <span className={isShoppingOver ? "text-destructive" : "text-success"}>
                      {locale === "bn" 
                        ? `গড়: ${formatCurrency(actualMonthlyShopping, currency, locale)} (${pctShopping.toFixed(0)}%)`
                        : `Avg: ${formatCurrency(actualMonthlyShopping, currency, locale)} (${pctShopping.toFixed(0)}%)`}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
                      <div 
                        className={`h-full ${isShoppingOver ? "bg-destructive" : "bg-success"}`} 
                        style={{ width: `${Math.min(pctShopping, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>{locale === "bn" ? `প্রস্তাবিত: ${formatCurrency(recShopping, currency, locale)} (১৫%)` : `Ideal Target: ${formatCurrency(recShopping, currency, locale)} (15%)`}</span>
                      {isShoppingOver && <span className="text-destructive font-semibold">{locale === "bn" ? "সীমা অতিরিক্ত!" : "Limit Exceeded!"}</span>}
                    </div>
                  </div>
                </div>

                {/* 4. Savings */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span>{locale === "bn" ? "সঞ্চয় ও বিনিয়োগ (Savings & Invest)" : "Savings & Investments"}</span>
                    <span className={isSavingsUnder ? "text-warning" : "text-success"}>
                      {locale === "bn" 
                        ? `গড়: ${formatCurrency(actualMonthlySavings, currency, locale)} (${pctSavings.toFixed(0)}%)`
                        : `Avg: ${formatCurrency(actualMonthlySavings, currency, locale)} (${pctSavings.toFixed(0)}%)`}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
                      <div 
                        className={`h-full ${isSavingsUnder ? "bg-warning" : "bg-success"}`} 
                        style={{ width: `${Math.min(pctSavings, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>{locale === "bn" ? `প্রস্তাবিত: ${formatCurrency(recSavings, currency, locale)} (২০%)` : `Ideal Target: ${formatCurrency(recSavings, currency, locale)} (20%)`}</span>
                      {isSavingsUnder && <span className="text-warning font-semibold">{locale === "bn" ? "লক্ষ্যমাত্রার নিচে" : "Below Target"}</span>}
                    </div>
                  </div>
                </div>

              </div>

              {/* DYNAMIC ACTIONABLE ADVICE */}
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/30 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-primary" />
                    {locale === "bn" ? "AI পারসোনালাইজড আর্থিক বুদ্ধি" : "AI Personalized Spending Guidance"}
                  </h3>
                  <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                    {isFoodOver && (
                      <div className="flex gap-2">
                        <span className="shrink-0 font-bold">🍔</span>
                        <p>{locale === "bn" 
                          ? "আপনার খাবার ও কাঁচাবাজার খরচ প্রস্তাবিত বাজেটের চেয়ে বেশি। বাইরে রেস্টুরেন্টে খাওয়া বা ডেলিভারি নেওয়ার পরিমাণ কমিয়ে দিন, বাসায় রান্না করুন।" 
                          : "Your food and groceries spending is higher than recommended. Consider cooking more at home and reducing restaurant dining or delivery."}
                        </p>
                      </div>
                    )}
                    {isHousingOver && (
                      <div className="flex gap-2">
                        <span className="shrink-0 font-bold">🏠</span>
                        <p>{locale === "bn" 
                          ? "বাসস্থান ও বিলের খরচ আপনার বাজেটের বড় অংশ দখল করেছে। রাইড শেয়ারিং কমিয়ে গণপরিবহন ব্যবহার করা বা ইউটিলিটি ব্যবহারে সাশ্রয়ী হওয়ার চেষ্টা করুন।" 
                          : "Housing and bill costs occupy a large portion of your budget. Try saving on utility usage or switching to cost-effective alternatives."}
                        </p>
                      </div>
                    )}
                    {isShoppingOver && (
                      <div className="flex gap-2">
                        <span className="shrink-0 font-bold">🛍️</span>
                        <p>{locale === "bn" 
                          ? "শপিং এবং বিনোদন খাতে অতিরিক্ত খরচ হচ্ছে। কেনাকাটা করার আগে ২৪ ঘণ্টা ভাবার নিয়ম চালু করুন, অপ্রয়োজনীয় সাবস্ক্রিপশন বাতিল করুন।" 
                          : "You are spending heavily on shopping and entertainment. Try implementing a 24-hour waiting rule for new purchases and cancel unused subscriptions."}
                        </p>
                      </div>
                    )}
                    {isSavingsUnder && (
                      <div className="flex gap-2">
                        <span className="shrink-0 font-bold">💰</span>
                        <p>{locale === "bn" 
                          ? "আপনার সঞ্চয়ের হার ২০%-এর নিচে আছে। বেতন পাওয়ার সাথে সাথেই প্রথমে সঞ্চয়ের অংশ আলাদা করে ফেলার অভ্যাস করুন (Pay Yourself First)!" 
                          : "Your savings rate is below the recommended 20%. Try automating a portion of your income to savings immediately upon receipt (Pay Yourself First)!"}
                        </p>
                      </div>
                    )}
                    {!isFoodOver && !isHousingOver && !isShoppingOver && !isSavingsUnder && (
                      <div className="flex gap-2">
                        <span className="shrink-0 font-bold">🎉</span>
                        <p>{locale === "bn" 
                          ? "অসাধারণ! আপনার প্রতিটি খাতের খরচ আপনার আয়ের সীমার ভেতরেই রয়েছে। এই নিয়মানুবর্তিতা আপনাকে অনেক দ্রুত আর্থিক স্বাধীনতা এনে দেবে!" 
                          : "Incredible! Your spending in every major sector remains well within budget guidelines. Keep maintaining this exemplary discipline to reach financial freedom sooner!"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-border/40 text-[10px] text-muted-foreground text-center">
                  {locale === "bn" 
                    ? "উপরে উল্লেখিত খরচ পরিকল্পনাটি আপনার আয়ের ৫০/৩০/২০ নিয়মের ওপর ভিত্তি করে তৈরি।" 
                    : "The suggested allocations conform directly to the golden 50/30/20 personal finance budget guideline."}
                </div>
              </div>

            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle>{t("insights.flow")}</CardTitle>
          </CardHeader>
          <CardContent>
            <IncomeExpenseArea
              income={buildMonthlySeries(incomes, 12)}
              expense={buildMonthlySeries(expenses, 12)}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>{t("insights.signals")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row
              label={t("insights.topCategory")}
              value={top ? `${t(`category.${top.category}`)} (${formatCurrency(top.total, currency, locale)})` : "—"}
            />
            <Row
              label={t("insights.bestMonth")}
              value={best ? `${best.month} (${formatCurrency(best.total, currency, locale)})` : "—"}
            />
            <Row
              label={t("insights.peakDay")}
              value={peak ? `${peak.date} (${formatCurrency(peak.total, currency, locale)})` : "—"}
            />
            <Row
              label={t("insights.lowDay")}
              value={low ? `${low.date} (${formatCurrency(low.total, currency, locale)})` : "—"}
            />
            <Row
              label={t("insights.monthIncome")}
              value={formatCurrency(sumAmount(monthInc), currency, locale)}
            />
            <Row
              label={t("insights.monthExpense")}
              value={formatCurrency(sumAmount(monthExp), currency, locale)}
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground text-xs uppercase tracking-wide">
        {label}
      </span>
      <span className="font-semibold text-right truncate">{value}</span>
    </div>
  );
}

