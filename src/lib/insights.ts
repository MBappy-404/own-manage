import {
  subMonths,
  startOfMonth,
  endOfMonth,
  getDate,
  getDaysInMonth,
} from "date-fns";

type IncomeLike = { amount: number; date: Date | string };
type ExpenseLike = {
  amount: number;
  date: Date | string;
  category: string;
  merchant?: string | null;
};

import {
  filterByInterval,
  sumAmount,
  categoryBreakdown,
  highestSpendingDay,
} from "./analytics";

export type Insight = {
  id: string;
  title: string;
  message: string;
  tone: "positive" | "neutral" | "warning" | "danger";
  icon?: string;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function topMerchant(expenses: ExpenseLike[]): { name: string; total: number } | null {
  if (!expenses.length) return null;
  const map: Record<string, number> = {};
  for (const e of expenses) {
    if (e.merchant) map[e.merchant] = (map[e.merchant] ?? 0) + e.amount;
  }
  const entries = Object.entries(map);
  if (!entries.length) return null;
  const [name, total] = entries.sort((a, b) => b[1] - a[1])[0];
  return { name, total };
}


function weekdaySplit(expenses: ExpenseLike[]): {
  holidayTotal: number;
  weekdayTotal: number;
  holidayCount: number;
  weekdayCount: number;
} {
  let holidayTotal = 0,
    weekdayTotal = 0,
    holidayCount = 0,
    weekdayCount = 0;
  for (const e of expenses) {
    const day = new Date(e.date).getDay();
    const isHoliday = day === 5 || day === 6; // Friday & Saturday (BD weekend)
    if (isHoliday) {
      holidayTotal += e.amount;
      holidayCount++;
    } else {
      weekdayTotal += e.amount;
      weekdayCount++;
    }
  }
  return { holidayTotal, weekdayTotal, holidayCount, weekdayCount };
}

// ─── Main ────────────────────────────────────────────────────────────────────

export function generateInsights(args: {
  incomes: IncomeLike[];
  expenses: ExpenseLike[];
  monthlyBudget?: number | null;
  t: (key: string, params?: Record<string, string | number>) => string;
}): Insight[] {
  const { incomes, expenses, monthlyBudget, t } = args;
  const insights: Insight[] = [];
  const now = new Date();
  const currentDayOfMonth = getDate(now);
  const daysInMonth = getDaysInMonth(now);
  const daysRemaining = daysInMonth - currentDayOfMonth;
  const monthProgress = currentDayOfMonth / daysInMonth; // 0→1

  const thisMonth = { start: startOfMonth(now), end: endOfMonth(now) };
  const lastMonth = {
    start: startOfMonth(subMonths(now, 1)),
    end: endOfMonth(subMonths(now, 1)),
  };
  const twoMonthsAgo = {
    start: startOfMonth(subMonths(now, 2)),
    end: endOfMonth(subMonths(now, 2)),
  };

  const expThis = filterByInterval(expenses, thisMonth.start, thisMonth.end);
  const expLast = filterByInterval(expenses, lastMonth.start, lastMonth.end);
  const expTwoAgo = filterByInterval(expenses, twoMonthsAgo.start, twoMonthsAgo.end);
  const incThis = filterByInterval(incomes, thisMonth.start, thisMonth.end);
  const incLast = filterByInterval(incomes, lastMonth.start, lastMonth.end);

  const sumExpThis = sumAmount(expThis);
  const sumExpLast = sumAmount(expLast);
  const sumExpTwoAgo = sumAmount(expTwoAgo);
  const sumIncThis = sumAmount(incThis);
  const sumIncLast = sumAmount(incLast);

  const savingsThis = sumIncThis - sumExpThis;
  const savingsRate = sumIncThis > 0 ? (savingsThis / sumIncThis) * 100 : 0;
  const dailyAvgExp = currentDayOfMonth > 0 ? sumExpThis / currentDayOfMonth : 0;
  const projectedMonthlyExp = dailyAvgExp * daysInMonth;
  const projectedSavings = sumIncThis - projectedMonthlyExp;

  const breakdown = categoryBreakdown(expThis);
  const peak = highestSpendingDay(expThis);

  // ═══════════════════════════════════════════════════════════════════
  // BLOCK 1 — INCOME INSIGHTS
  // ═══════════════════════════════════════════════════════════════════

  // 1a. No income recorded this month
  if (sumIncThis === 0 && currentDayOfMonth > 5) {
    insights.push({
      id: "no-income-logged",
      title: "এই মাসে কোনো আয় যোগ করা হয়নি",
      message:
        "এখন পর্যন্ত এই মাসে কোনো আয়ের তথ্য নেই। আপনার বেতন বা অন্য আয়গুলো যোগ করুন, তাহলে সঠিক হিসাব পাবেন।",
      tone: "warning",
      icon: "AlertCircle",
    });
  }

  // 1b. Income dropped significantly vs last month
  if (sumIncLast > 0 && sumIncThis > 0) {
    const incomeDropPct = ((sumIncLast - sumIncThis) / sumIncLast) * 100;
    if (incomeDropPct >= 20) {
      insights.push({
        id: "income-drop-alert",
        title: "এই মাসে আয় কমে গেছে",
        message: `গত মাসের তুলনায় এই মাসে আপনার আয় প্রায় ${Math.round(incomeDropPct)}% কমে গেছে। খরচের পরিকল্পনা সেই অনুযায়ী ঠিক করে নিন।`,
        tone: "warning",
        icon: "TrendingDown",
      });
    }
  }

  // 1c. Income surged
  if (sumIncLast > 0 && sumIncThis > 0) {
    const incomeRisePct = ((sumIncThis - sumIncLast) / sumIncLast) * 100;
    if (incomeRisePct >= 20) {
      insights.push({
        id: "income-surge",
        title: "এই মাসে আয় বেড়েছে — চমৎকার!",
        message: `গত মাসের তুলনায় আপনার আয় ${Math.round(incomeRisePct)}% বেড়েছে। এই বাড়তি টাকার একটা অংশ সঞ্চয় বা বিনিয়োগে রাখার এখনই সুযোগ।`,
        tone: "positive",
        icon: "TrendingUp",
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // BLOCK 2 — SAVINGS RATE TIERS
  // ═══════════════════════════════════════════════════════════════════

  if (sumIncThis > 0 && sumExpThis > 0) {
    if (savingsRate >= 50) {
      insights.push({
        id: "savings-champion",
        title: "আপনি সত্যিকারের সেভিংস চ্যাম্পিয়ন!",
        message: `আয়ের ${Math.round(savingsRate)}% জমাচ্ছেন — এটা অসাধারণ। এই ধারা ধরে রাখুন এবং জমানো টাকা উৎপাদনশীল বিনিয়োগে লাগান।`,
        tone: "positive",
        icon: "Trophy",
      });
    } else if (savingsRate >= 30) {
      insights.push({
        id: "savings-strong",
        title: "সঞ্চয়ের গতি দারুণ চলছে!",
        message: `আয়ের ${Math.round(savingsRate)}% জমছে, যা সুস্থ আর্থিক অভ্যাসের লক্ষণ। লক্ষ্য রাখুন যেন এটা ৪০%-এ নিয়ে যেতে পারেন।`,
        tone: "positive",
        icon: "ShieldCheck",
      });
    } else if (savingsRate >= 20) {
      insights.push({
        id: "savings-stable",
        title: "সঞ্চয় ঠিকঠাক আছে, আরেকটু বাড়ান",
        message: `আয়ের ${Math.round(savingsRate)}% জমছে — এটা গ্রহণযোগ্য, তবে ৩০%-এর লক্ষ্যে পৌঁছানোর চেষ্টা করুন। ছোট ছোট অপ্রয়োজনীয় খরচ বাদ দিলেই হবে।`,
        tone: "neutral",
        icon: "PiggyBank",
      });
    } else if (savingsRate > 0 && savingsRate < 20) {
      insights.push({
        id: "savings-low",
        title: "সঞ্চয় বাড়ানো দরকার",
        message: `মাত্র ${Math.round(savingsRate)}% জমছে। বিশেষজ্ঞরা বলেন আয়ের অন্তত ২০% জমানো উচিত। এখনই পরিকল্পনা করুন।`,
        tone: "warning",
        icon: "TrendingUp",
      });
    } else if (savingsRate <= 0) {
      insights.push({
        id: "savings-negative",
        title: "সাবধান! ঘাটতি বাজেটে চলছেন",
        message:
          "আয়ের চেয়ে বেশি খরচ হচ্ছে। এটা চলতে থাকলে ঋণ বা আর্থিক সংকট অনিবার্য। আজই জরুরি ভিত্তিতে বাজেট পুনর্বিন্যাস করুন।",
        tone: "danger",
        icon: "AlertOctagon",
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // BLOCK 3 — BUDGET UTILIZATION (5 TIERS)
  // ═══════════════════════════════════════════════════════════════════

  if (monthlyBudget && monthlyBudget > 0 && sumExpThis > 0) {
    const budgetUsedPct = (sumExpThis / monthlyBudget) * 100;
    const expectedUsagePct = monthProgress * 100;

    if (budgetUsedPct >= 100) {
      insights.push({
        id: "budget-busted",
        title: "বাজেট পুরোপুরি শেষ হয়ে গেছে!",
        message: `মাসের ${Math.round(monthProgress * 100)}% সময়ে আপনার পুরো মাসিক বাজেট (${Math.round(budgetUsedPct)}%) খরচ হয়ে গেছে। বাকি দিনগুলো কীভাবে চলবেন সেটা এখনই ঠিক করুন।`,
        tone: "danger",
        icon: "XCircle",
      });
    } else if (budgetUsedPct >= 85) {
      const remainingBudget = monthlyBudget - sumExpThis;
      const dailyAllowance = daysRemaining > 0 ? remainingBudget / daysRemaining : 0;
      insights.push({
        id: "budget-critical",
        title: "বাজেটের শেষ প্রান্তে আছেন",
        message: `বাজেটের ${Math.round(budgetUsedPct)}% খরচ হয়েছে, বাকি মাত্র ৳${remainingBudget.toLocaleString("bn-BD")}। আগামী ${daysRemaining} দিন প্রতিদিন সর্বোচ্চ ৳${Math.round(dailyAllowance).toLocaleString("bn-BD")} খরচ করতে পারবেন।`,
        tone: "danger",
        icon: "Gauge",
      });
    } else if (budgetUsedPct >= 75 && budgetUsedPct > expectedUsagePct + 15) {
      insights.push({
        id: "budget-ahead-pace",
        title: "বাজেট ব্যবহারের গতি বেশি",
        message: `মাসের এই পর্যায়ে ${Math.round(expectedUsagePct)}% ব্যবহার হওয়ার কথা, কিন্তু ${Math.round(budgetUsedPct)}% হয়ে গেছে। এখনই গতি না কমালে মাস শেষ হওয়ার আগেই বাজেট ফুরাবে।`,
        tone: "warning",
        icon: "Zap",
      });
    } else if (budgetUsedPct < expectedUsagePct - 20) {
      insights.push({
        id: "budget-under-control",
        title: "বাজেট নিয়ন্ত্রণ চমৎকার!",
        message: `এই পর্যন্ত বাজেটের মাত্র ${Math.round(budgetUsedPct)}% খরচ হয়েছে — প্রত্যাশার চেয়ে অনেক কম। বাড়তি সঞ্চয় জরুরি ফান্ডে বা বিনিয়োগে রাখার কথা ভাবুন।`,
        tone: "positive",
        icon: "CheckCircle",
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // BLOCK 4 — PROJECTED MONTH-END BALANCE
  // ═══════════════════════════════════════════════════════════════════

  if (sumIncThis > 0 && dailyAvgExp > 0 && currentDayOfMonth > 5 && daysRemaining > 3) {
    if (projectedSavings < 0) {
      insights.push({
        id: "projected-deficit",
        title: "মাস শেষে ঘাটতির আশঙ্কা",
        message: `বর্তমান খরচের হার অনুযায়ী মাস শেষে আনুমানিক ৳${Math.abs(Math.round(projectedSavings)).toLocaleString("bn-BD")} ঘাটতি হতে পারে। এখনই খরচ কমালে এই পরিস্থিতি এড়ানো সম্ভব।`,
        tone: "danger",
        icon: "TrendingDown",
      });
    } else if (projectedSavings > 0 && projectedSavings / sumIncThis >= 0.30) {
      insights.push({
        id: "projected-surplus",
        title: "মাস শেষে ভালো উদ্বৃত্তের সম্ভাবনা",
        message: `এই গতিতে চললে মাস শেষে প্রায় ৳${Math.round(projectedSavings).toLocaleString("bn-BD")} উদ্বৃত্ত থাকবে। এই টাকার পরিকল্পনা এখনই করে রাখুন।`,
        tone: "positive",
        icon: "Target",
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // BLOCK 5 — MONTH-OVER-MONTH TREND (daily-normalized)
  // ═══════════════════════════════════════════════════════════════════

  if (sumExpLast > 0 && sumExpThis > 0 && currentDayOfMonth > 7) {
    const dailyLast = sumExpLast / getDaysInMonth(subMonths(now, 1));
    const dailyThis = sumExpThis / currentDayOfMonth;
    const trendPct = ((dailyThis - dailyLast) / dailyLast) * 100;

    // Check 2-month trend for consistency
    const dailyTwoAgo =
      sumExpTwoAgo > 0 ? sumExpTwoAgo / getDaysInMonth(subMonths(now, 2)) : null;
    const twoMonthTrend =
      dailyTwoAgo && dailyTwoAgo > 0
        ? ((dailyThis - dailyTwoAgo) / dailyTwoAgo) * 100
        : null;

    if (trendPct > 30) {
      insights.push({
        id: "expense-spike-critical",
        title: "খরচ নিয়ন্ত্রণের বাইরে যাচ্ছে",
        message: `গত মাসের তুলনায় প্রতিদিনের গড় খরচ ${Math.round(trendPct)}% বেড়ে গেছে। এটা গুরুত্বপূর্ণ সতর্কসংকেত — দ্রুত পর্যালোচনা করুন।`,
        tone: "danger",
        icon: "ArrowUpRight",
      });
    } else if (trendPct > 15) {
      insights.push({
        id: "expense-rising",
        title: "খরচ বাড়ছে, একটু নজর দিন",
        message: `প্রতিদিনের গড় খরচ গত মাসের তুলনায় ${Math.round(trendPct)}% বেশি। এখনই নিয়ন্ত্রণ না করলে মাস শেষে বড় ঘাটতি হতে পারে।`,
        tone: "warning",
        icon: "ArrowUpRight",
      });
    } else if (trendPct < -25) {
      insights.push({
        id: "frugal-mastery",
        title: "খরচ নিয়ন্ত্রণে আপনি অসাধারণ!",
        message: `গত মাসের তুলনায় প্রতিদিনের খরচ ${Math.round(Math.abs(trendPct))}% কমিয়েছেন। এই সাফল্যকে ধরে রাখুন।`,
        tone: "positive",
        icon: "ShieldCheck",
      });
    } else if (trendPct < -15) {
      insights.push({
        id: "expense-declining-good",
        title: "খরচ কমছে — ভালো লক্ষণ",
        message: `গত মাসের তুলনায় দৈনিক খরচ ${Math.round(Math.abs(trendPct))}% কমেছে। এভাবে চলতে থাকলে মাস শেষে উল্লেখযোগ্য সঞ্চয় হবে।`,
        tone: "positive",
        icon: "TrendingDown",
      });
    }

    // Consistent 2-month uptrend warning
    if (twoMonthTrend !== null && twoMonthTrend > 20 && trendPct > 10) {
      insights.push({
        id: "two-month-uptrend",
        title: "দুই মাস ধরে খরচ বেড়েই চলছে",
        message:
          "গত দুই মাস ধরে ধারাবাহিকভাবে আপনার খরচ বাড়ছে। এটা শুধু মৌসুমী নয়, বরং একটা অভ্যাসগত পরিবর্তন। এখনই পদক্ষেপ নিন।",
        tone: "danger",
        icon: "AlertTriangle",
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // BLOCK 6 — CATEGORY-WISE DEEP ANALYSIS
  // ═══════════════════════════════════════════════════════════════════

  if (breakdown.length > 0) {
    const catMap: Record<string, number> = {};
    for (const b of breakdown) catMap[b.category] = b.total;

    const topCat = breakdown[0];
    const topPct = sumExpThis > 0 ? (topCat.total / sumExpThis) * 100 : 0;

    // FOOD
    if (catMap["FOOD"]) {
      const foodPct = (catMap["FOOD"] / sumExpThis) * 100;
      if (foodPct > 45) {
        insights.push({
          id: "food-critical",
          title: "খাবারে প্রায় অর্ধেক টাকা চলে যাচ্ছে",
          message: `মোট খরচের ${Math.round(foodPct)}% শুধু খাবারে। বাইরে খাওয়া কমিয়ে বাড়িতে রান্নার অভ্যাস করলে প্রতি মাসে বড় অংক বাঁচানো সম্ভব।`,
          tone: "warning",
          icon: "Utensils",
        });
      } else if (foodPct > 30) {
        insights.push({
          id: "food-high",
          title: "খাবার খরচটা একটু বেশি মনে হচ্ছে",
          message: `খাবারে ${Math.round(foodPct)}% যাচ্ছে। সপ্তাহে অন্তত ৩-৪ দিন বাসায় রান্না করলে এই খরচ উল্লেখযোগ্যভাবে কমবে।`,
          tone: "neutral",
          icon: "Utensils",
        });
      }
    }

    // SHOPPING
    if (catMap["SHOPPING"]) {
      const shopPct = (catMap["SHOPPING"] / sumExpThis) * 100;
      if (shopPct > 35) {
        insights.push({
          id: "shopping-heavy",
          title: "শপিং খাতে অনেক বেশি খরচ",
          message: `মোট খরচের ${Math.round(shopPct)}% শপিং-এ যাচ্ছে। কেনাকাটার আগে একটু ভাবুন — এটা কি সত্যিই দরকার? ২৪ ঘণ্টা অপেক্ষা করলে অনেক আবেগী কেনাকাটা এড়ানো যায়।`,
          tone: "warning",
          icon: "ShoppingBag",
        });
      }
    }

    // TRANSPORT
    if (catMap["TRANSPORT"] || catMap["TRANSPORTATION"]) {
      const transVal = catMap["TRANSPORT"] ?? catMap["TRANSPORTATION"] ?? 0;
      const transPct = (transVal / sumExpThis) * 100;
      if (transPct > 20) {
        insights.push({
          id: "transport-high",
          title: "যাতায়াত খরচ একটু বেশি",
          message: `যাতায়াতে ${Math.round(transPct)}% খরচ হচ্ছে। রাইডশেয়ারের বদলে গণপরিবহন বা কারপুল ব্যবহার করলে উল্লেখযোগ্য সাশ্রয় হতে পারে।`,
          tone: "neutral",
          icon: "Car",
        });
      }
    }

    // ENTERTAINMENT
    if (catMap["ENTERTAINMENT"]) {
      const entPct = (catMap["ENTERTAINMENT"] / sumExpThis) * 100;
      if (entPct > 20) {
        insights.push({
          id: "entertainment-high",
          title: "বিনোদন খরচ নিয়ন্ত্রণ করুন",
          message: `বিনোদনে ${Math.round(entPct)}% খরচ হচ্ছে। বিনোদন দরকার, তবে বাজেট ঠিক করে রাখলে বাকি খরচে চাপ পড়বে না।`,
          tone: "neutral",
          icon: "Tv",
        });
      }
    }

    // HEALTH
    if (catMap["HEALTH"] || catMap["MEDICAL"]) {
      const healthVal = (catMap["HEALTH"] ?? 0) + (catMap["MEDICAL"] ?? 0);
      const healthPct = (healthVal / sumExpThis) * 100;
      if (healthPct > 20) {
        insights.push({
          id: "health-spending-high",
          title: "স্বাস্থ্য খরচ বেশি — নিজের যত্ন নিন",
          message: `এই মাসে স্বাস্থ্য খাতে ${Math.round(healthPct)}% খরচ হয়েছে। প্রয়োজনীয় চিকিৎসা অবশ্যই করাবেন, তবে প্রতিরোধমূলক স্বাস্থ্যসেবা দীর্ঘমেয়াদে খরচ কমায়।`,
          tone: "neutral",
          icon: "HeartPulse",
        });
      }
    }

    // EDUCATION
    if (catMap["EDUCATION"]) {
      const eduPct = (catMap["EDUCATION"] / sumExpThis) * 100;
      if (eduPct > 5) {
        insights.push({
          id: "education-investment",
          title: "শিক্ষায় বিনিয়োগ — স্মার্ট সিদ্ধান্ত",
          message: `আপনি শিক্ষায় ${Math.round(eduPct)}% ব্যয় করছেন। এটা একটি দীর্ঘমেয়াদী বিনিয়োগ — চালিয়ে যান, তবে বিনামূল্যের বিকল্পগুলোও দেখুন।`,
          tone: "positive",
          icon: "BookOpen",
        });
      }
    }

    // HOUSING / RENT
    if (catMap["HOUSING"] || catMap["RENT"]) {
      const housingVal = (catMap["HOUSING"] ?? 0) + (catMap["RENT"] ?? 0);
      const housingPct = (housingVal / sumExpThis) * 100;
      if (housingPct > 40) {
        insights.push({
          id: "housing-heavy",
          title: "বাড়িভাড়া আয়ের বড় অংশ নিচ্ছে",
          message: `বাসস্থান খরচ মোট ব্যয়ের ${Math.round(housingPct)}%। আদর্শভাবে এটা ৩০%-এর নিচে রাখা উচিত। রুমমেট বা কম খরচের এলাকা বিবেচনা করতে পারেন।`,
          tone: "warning",
          icon: "Home",
        });
      }
    }

    // UTILITIES
    if (catMap["UTILITIES"] || catMap["BILLS"]) {
      const utilVal = (catMap["UTILITIES"] ?? 0) + (catMap["BILLS"] ?? 0);
      const utilPct = (utilVal / sumExpThis) * 100;
      if (utilPct > 15) {
        insights.push({
          id: "utilities-high",
          title: "ইউটিলিটি বিল একটু বেশি",
          message: `বিদ্যুৎ, পানি ও গ্যাস বিলে ${Math.round(utilPct)}% যাচ্ছে। এনার্জি-সেভিং অভ্যাস গড়লে মাসে মাসে একটু সাশ্রয় হবে।`,
          tone: "neutral",
          icon: "Lightbulb",
        });
      }
    }

    // Category over-concentration (one category > 60%)
    if (topPct > 60 && breakdown.length > 1) {
      insights.push({
        id: "category-overconcentration",
        title: "খরচ একটি খাতে কেন্দ্রীভূত",
        message: `আপনার মোট খরচের ${Math.round(topPct)}% শুধু "${topCat.category}" খাতে যাচ্ছে। খরচের বৈচিত্র্য না থাকলে কোনো এক খাতে সংকট হলে পুরো বাজেট বিপর্যস্ত হতে পারে।`,
        tone: "warning",
        icon: "PieChart",
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // BLOCK 7 — BEHAVIORAL PATTERN ANALYSIS
  // ═══════════════════════════════════════════════════════════════════

  // 7a. Weekend vs Weekday
  const { holidayTotal, weekdayTotal, holidayCount, weekdayCount } = weekdaySplit(expThis);
  if (holidayCount > 1 && weekdayCount > 1) {
    const avgHoliday = holidayTotal / holidayCount;
    const avgWeekday = weekdayTotal / Math.max(weekdayCount, 1);

    if (avgHoliday > avgWeekday * 3) {
      insights.push({
        id: "weekend-drain-severe",
        title: "ছুটির দিনে খরচ তিনগুণেরও বেশি!",
        message:
          "শুক্র-শনিবার আপনার গড় খরচ কার্যদিবসের চেয়ে ৩ গুণেরও বেশি। ছুটির দিনে বাজেট পূর্বনির্ধারিত রাখলে এই ফাঁকফোকর বন্ধ হবে।",
        tone: "danger",
        icon: "Coffee",
      });
    } else if (avgHoliday > avgWeekday * 2) {
      insights.push({
        id: "weekend-drain",
        title: "ছুটির দিনের খরচ সামলে রাখুন",
        message:
          "সপ্তাহান্তে আপনার খরচ কার্যদিবসের দ্বিগুণেরও বেশি হয়ে যাচ্ছে। ছুটির দিনের পরিকল্পনায় একটা বাজেট রাখলে পুরো মাসের সাশ্রয় হবে।",
        tone: "warning",
        icon: "Coffee",
      });
    }
  }

  // 7b. High-frequency micro-transactions ("death by 1000 cuts")
  if (expThis.length > 0 && currentDayOfMonth > 5) {
    const avgTxPerDay = expThis.length / currentDayOfMonth;
    const avgTxAmount = sumExpThis / expThis.length;

    if (avgTxPerDay > 5 && avgTxAmount < 300) {
      insights.push({
        id: "micro-transaction-drain",
        title: "ছোট ছোট খরচ মিলে বড় ক্ষতি",
        message: `প্রতিদিন গড়ে ${Math.round(avgTxPerDay)}টি ছোট লেনদেন হচ্ছে, প্রতিটি গড়ে ৳${Math.round(avgTxAmount)} মাত্র। এই ছোট খরচগুলোই সম্মিলিতভাবে বড় অংক খেয়ে ফেলছে।`,
        tone: "warning",
        icon: "Scissors",
      });
    }
  }

  // 7c. Merchant concentration (spending too much at one place)
  const merchant = topMerchant(expThis);
  if (merchant && sumExpThis > 0) {
    const merchantPct = (merchant.total / sumExpThis) * 100;
    if (merchantPct > 30) {
      insights.push({
        id: "merchant-concentration",
        title: `এক জায়গায় বেশি টাকা যাচ্ছে`,
        message: `"${merchant.name}"-এ আপনার মোট খরচের ${Math.round(merchantPct)}% যাচ্ছে। বিকল্প বিকল্প যাচাই করলে দাম ও মান দুটোতেই সুবিধা পেতে পারেন।`,
        tone: "neutral",
        icon: "MapPin",
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // BLOCK 8 — ANOMALY & SPIKE DETECTION
  // ═══════════════════════════════════════════════════════════════════

  if (peak && currentDayOfMonth > 3 && dailyAvgExp > 0) {
    const spikeRatio = peak.total / dailyAvgExp;

    if (spikeRatio >= 10) {
      const peakDate = new Date(peak.date);
      const formattedDate = peakDate.toLocaleDateString("bn-BD", {
        day: "numeric",
        month: "long",
      });
      insights.push({
        id: "mega-outlier",
        title: "একটি দিনে অস্বাভাবিক বড় খরচ!",
        message: `${formattedDate} তারিখে আপনার দৈনিক গড়ের ১০ গুণেরও বেশি খরচ হয়েছে। এই ধরনের আকস্মিক খরচ থেকে বাঁচতে বড় কেনাকাটার আগে পরিকল্পনা করুন।`,
        tone: "danger",
        icon: "Zap",
      });
    } else if (spikeRatio >= 5 && peak.total > 1000) {
      const peakDate = new Date(peak.date);
      const formattedDate = peakDate.toLocaleDateString("bn-BD", {
        day: "numeric",
        month: "long",
      });
      insights.push({
        id: "major-outlier",
        title: "হঠাৎ বড় অংকের খরচ ছিল",
        message: `${formattedDate} তারিখে গড়ের চেয়ে ৫ গুণ বেশি খরচ হয়েছিল। এমন আকস্মিক খরচের জন্য আলাদা ইমার্জেন্সি ফান্ড থাকলে মূল সঞ্চয়ে টান পড়ে না।`,
        tone: "warning",
        icon: "AlertTriangle",
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // BLOCK 9 — INCOME-TO-EXPENSE RATIO INSIGHT
  // ═══════════════════════════════════════════════════════════════════

  if (sumIncThis > 0 && sumExpThis > 0) {
    const ratio = sumExpThis / sumIncThis;

    if (ratio > 1.2) {
      insights.push({
        id: "expense-income-ratio-critical",
        title: "খরচ আয়ের ১২০% ছাড়িয়ে গেছে",
        message:
          "আপনি আয়ের চেয়ে ২০% বেশি খরচ করছেন। এটা সঞ্চয় নয়, বরং আর্থিক ঘাটতি। দ্রুত পদক্ষেপ না নিলে ঋণ অনিবার্য।",
        tone: "danger",
        icon: "AlertOctagon",
      });
    } else if (ratio > 0.90 && ratio <= 1.0) {
      insights.push({
        id: "barely-breaking-even",
        title: "কোনোমতে ব্যালেন্স টিকে আছে",
        message:
          "আয় ও খরচ প্রায় সমান। সামান্য অপ্রত্যাশিত খরচ হলেই ঘাটতিতে পড়বেন। অন্তত ১০% কোথাও কমানোর চেষ্টা করুন।",
        tone: "warning",
        icon: "Scale",
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // BLOCK 10 — MID-MONTH CHECKPOINT
  // ═══════════════════════════════════════════════════════════════════

  if (currentDayOfMonth >= 14 && currentDayOfMonth <= 17 && sumIncThis > 0 && sumExpThis > 0) {
    const halfMonthExpected = sumIncThis * 0.5;
    if (sumExpThis > halfMonthExpected * 1.25) {
      insights.push({
        id: "midmonth-overspend",
        title: "মাসের মাঝামাঝিতেই বেশি খরচ",
        message:
          "মাসের মাত্র অর্ধেক পার হয়েছে, কিন্তু প্রত্যাশিত অর্ধেক খরচের চেয়ে ২৫% বেশি হয়ে গেছে। বাকি দিনগুলো সতর্কভাবে চলুন।",
        tone: "warning",
        icon: "CalendarClock",
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // BLOCK 11 — ZERO EXPENSE / NO DATA
  // ═══════════════════════════════════════════════════════════════════

  if (expThis.length === 0 && currentDayOfMonth > 3) {
    insights.push({
      id: "no-expense-data",
      title: "এই মাসে কোনো খরচ যোগ করা হয়নি",
      message:
        "এখন পর্যন্ত কোনো খরচের তথ্য নেই। নিয়মিত খরচ যোগ করলেই কেবল সঠিক বিশ্লেষণ ও পরামর্শ পাওয়া সম্ভব।",
      tone: "neutral",
      icon: "ClipboardList",
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // BLOCK 11 — SMART ANOMALIES & PREDICTIONS
  // ═══════════════════════════════════════════════════════════════════

  // 11a. Weekend Splurge Detection (Friday/Saturday in BD)
  const weekendStats = weekdaySplit(expThis);
  const avgWeekend = weekendStats.holidayCount > 0 ? weekendStats.holidayTotal / weekendStats.holidayCount : 0;
  const avgWeekdayAt660 = weekendStats.weekdayCount > 0 ? weekendStats.weekdayTotal / weekendStats.weekdayCount : 0;

  if (avgWeekend > avgWeekdayAt660 * 1.8 && weekendStats.holidayTotal > 1000) {
    insights.unshift({
      id: "weekend-splurge",
      title: "সাপ্তাহিক ছুটির দিনে খরচ অনেক বেশি",
      message: `আপনার সাধারণ দিনের তুলনায় ছুটির দিনে খরচ প্রায় ${Math.round((avgWeekend / avgWeekdayAt660) * 100 - 100)}% বেশি। ছুটির দিনের আনন্দ যেন আপনার পুরো মাসের বাজেট নষ্ট না করে সেদিকে খেয়াল রাখুন।`,
      tone: "warning",
      icon: "Flame",
    });
  }

  // 11b. Burn Rate Risk (Spending faster than time passing)
  if (monthlyBudget && sumExpThis > 0) {
    const budgetUsed = sumExpThis / monthlyBudget;
    if (budgetUsed > monthProgress + 0.15 && budgetUsed < 1) {
      insights.unshift({
        id: "burn-rate-risk",
        title: "বাজেট শেষ হওয়ার ঝুঁকি",
        message: `এই মাসের সময়ের তুলনায় আপনার খরচের গতি বেশি। এভাবেই চলতে থাকলে মাসের শেষ ১০ দিন আপনার হাতে কোনো টাকা থাকবে না। খরচ কমানোর এখনই সময়।`,
        tone: "danger",
        icon: "Siren",
      });
    }
  }

  // 11c. Category Concentration Risk
  if (breakdown.length > 0 && breakdown[0].total > sumExpThis * 0.5 && sumExpThis > 2000) {
    insights.unshift({
      id: "category-concentration",
      title: `${t(`category.${breakdown[0].category}`)} খাতে অত্যাধিক ব্যয়`,
      message: `আপনার এই মাসের মোট খরচের অর্ধেকই (${Math.round((breakdown[0].total / sumExpThis) * 100)}%) যাচ্ছে শুধুমাত্র একটি খাতে। এই খাতে খরচ কমিয়ে সঞ্চয় বাড়ানো সম্ভব কি না ভেবে দেখুন।`,
      tone: "warning",
      icon: "PieChart",
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // BLOCK 12 — STRATEGIC WISDOM (always-relevant fallbacks)
  // ═══════════════════════════════════════════════════════════════════

  const strategicPool: Insight[] = [
    {
      id: "emergency-fund",
      title: "জরুরি ফান্ড গড়ে তুলুন",
      message:
        "অন্তত ৬ মাসের খরচ সমপরিমাণ অর্থ আলাদা একটি সেভিংস অ্যাকাউন্টে রাখুন। এই ফান্ড আপনার আর্থিক নিরাপত্তার ভিত।",
      tone: "neutral",
      icon: "Shield",
    },
    {
      id: "50-30-20-rule",
      title: "৫০-৩০-২০ নিয়ম মেনে চলুন",
      message:
        "আয়ের ৫০% প্রয়োজনীয় খরচে, ৩০% ইচ্ছামতো খরচে এবং ২০% সঞ্চয়ে রাখুন — এই সহজ নিয়ম মেনে চললে আর্থিক স্বাস্থ্য ভালো থাকে।",
      tone: "neutral",
      icon: "BarChart3",
    },
    {
      id: "invest-early",
      title: "বিনিয়োগে দেরি করবেন না",
      message:
        "আজই ছোট পরিমাণে হলেও বিনিয়োগ শুরু করুন। চক্রবৃদ্ধি সুদ সময়ের সাথে আপনার সম্পদ বাড়িয়ে তোলে।",
      tone: "positive",
      icon: "TrendingUp",
    },
    {
      id: "automate-savings",
      title: "সঞ্চয় স্বয়ংক্রিয় করুন",
      message:
        "বেতন পাওয়ার সাথে সাথেই নির্দিষ্ট পরিমাণ আলাদা করে রাখুন। 'বাকি টাকা থাকলে জমাবো' মানসিকতা কাজ করে না।",
      tone: "positive",
      icon: "RefreshCw",
    },
    {
      id: "avoid-lifestyle-inflation",
      title: "আয় বাড়লেই খরচ বাড়াবেন না",
      message:
        "আয় বাড়ার সাথে সাথে জীবনযাত্রার মান বাড়ানোর প্রবণতা সম্পদ গড়ার পথে সবচেয়ে বড় বাধা। বাড়তি আয়ের বড় অংশ বিনিয়োগে রাখুন।",
      tone: "neutral",
      icon: "Info",
    },
    {
      id: "track-consistently",
      title: "প্রতিদিন হিসাব লিখুন",
      message:
        "নিয়মিত লেনদেন ট্র্যাক করার অভ্যাস আর্থিক সচেতনতা বাড়ায়। যারা হিসাব রাখেন, তারা গড়ে ২০% কম খরচ করেন।",
      tone: "positive",
      icon: "ClipboardCheck",
    },
  ];

  // Fill remaining slots with strategic insights (no duplicates)
  const usedIds = new Set(insights.map((i) => i.id));
  for (const tip of strategicPool) {
    if (insights.length >= 8) break;
    if (!usedIds.has(tip.id)) {
      insights.push(tip);
      usedIds.add(tip.id);
    }
  }

  return insights.slice(0, 8);
}