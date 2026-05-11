import { 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  getDate,
  getDaysInMonth
} from "date-fns";
type IncomeLike = { amount: number; date: Date | string };
type ExpenseLike = { amount: number; date: Date | string; category: string; merchant?: string | null };
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

export function generateInsights(args: {
  incomes: IncomeLike[];
  expenses: ExpenseLike[];
  monthlyBudget?: number | null;
}): Insight[] {
  const { incomes, expenses, monthlyBudget } = args;
  const insights: Insight[] = [];
  const now = new Date();
  const currentDayOfMonth = getDate(now);
  const daysInMonth = getDaysInMonth(now);

  const thisMonth = { start: startOfMonth(now), end: endOfMonth(now) };
  const lastMonth = {
    start: startOfMonth(subMonths(now, 1)),
    end: endOfMonth(subMonths(now, 1)),
  };

  const expThis = filterByInterval(expenses, thisMonth.start, thisMonth.end);
  const expLast = filterByInterval(expenses, lastMonth.start, lastMonth.end);
  const incThis = filterByInterval(incomes, thisMonth.start, thisMonth.end);
  
  const sumExpThis = sumAmount(expThis);
  const sumExpLast = sumAmount(expLast);
  const sumIncThis = sumAmount(incThis);

  const savingsThis = sumIncThis - sumExpThis;
  const savingsRate = sumIncThis > 0 ? (savingsThis / sumIncThis) * 100 : 0;

  // 1. FINANCIAL STRENGTH: Elite Savings & Safety Net
  if (sumIncThis > 0) {
    if (savingsRate >= 40) {
      insights.push({
        id: "elite-savings",
        title: "আপনার টাকা জমানোর অভ্যাস দারুণ!",
        message: `আপনি আয়ের ${Math.round(savingsRate)}% জমিয়ে ফেলছেন, যা সত্যিই প্রশংসনীয়। এভাবে চললে খুব দ্রুতই আপনি অনেক বড় অংকের টাকা জমাতে পারবেন।`,
        tone: "positive",
        icon: "Trophy",
      });
    } else if (savingsRate > 0 && savingsRate < 20) {
      insights.push({
        id: "savings-push",
        title: "হাতে টাকা রাখার পরিমাণ বাড়াতে হবে",
        message: `আপনার আয়ের মাত্র ${Math.round(savingsRate)}% জমছে। মাস শেষে হাতে অন্তত ২০% টাকা না থাকলে ভবিষ্যতে হুট করে বড় খরচের সময় সমস্যায় পড়তে পারেন।`,
        tone: "warning",
        icon: "TrendingUp",
      });
    } else if (savingsRate <= 0 && sumExpThis > 0) {
      insights.push({
        id: "capital-erosion",
        title: "সাবধান! আয়ের চেয়ে বেশি খরচ হচ্ছে",
        message: "আপনার এই মাসের খরচ আয়ের সীমা ছাড়িয়ে গেছে। এভাবে চলতে থাকলে আপনাকে ঋণের কবলে পড়তে হতে পারে। আজই অদরকারী খরচগুলো বন্ধ করার চেষ্টা করুন।",
        tone: "danger",
        icon: "AlertOctagon",
      });
    }
  }

  // 2. PREDICTIVE: Burn Rate & Daily Survival
  if (currentDayOfMonth > 2 && sumExpThis > 0) {
    const dailyAvg = sumExpThis / currentDayOfMonth;
    
    if (monthlyBudget && sumExpThis > monthlyBudget * 0.75) {
      const remainingBudget = Math.max(0, monthlyBudget - sumExpThis);
      const daysUntilLimit = Math.floor(remainingBudget / Math.max(dailyAvg, 1));
      
      if (daysUntilLimit < (daysInMonth - currentDayOfMonth)) {
        insights.push({
          id: "budget-crash-warning",
          title: "পকেটের টাকা দ্রুত ফুরিয়ে আসছে",
          message: `আপনার বর্তমান খরচের গতিতে চললে আগামী ${daysUntilLimit} দিনের মধ্যে আপনার এই মাসের বাজেট শেষ হয়ে যাবে। মাস শেষে পকেট শূন্য দেখতে না চাইলে খরচ আজই কমিয়ে দিন।`,
          tone: "danger",
          icon: "Zap",
        });
      }
    }
  }

  // 3. COMPARATIVE: Month-over-Month Trend Intelligence
  if (sumExpLast > 0 && sumExpThis > 0 && currentDayOfMonth > 7) {
    const dailyLast = sumExpLast / getDaysInMonth(subMonths(now, 1));
    const dailyThis = sumExpThis / currentDayOfMonth;
    const trendPct = ((dailyThis - dailyLast) / dailyLast) * 100;

    if (trendPct > 15) {
      insights.push({
        id: "trend-spike-intense",
        title: "খরচ কি হাতের নাগালের বাইরে যাচ্ছে?",
        message: `গত মাসের তুলনায় প্রতিদিন গড়ে আপনার খরচ ${Math.round(trendPct)}% বেড়ে গেছে। কেন এত বেশি খরচ হচ্ছে? এখনই একটু নজর দিন।`,
        tone: "warning",
        icon: "ArrowUpRight",
      });
    } else if (trendPct < -15) {
      insights.push({
        id: "frugal-mastery",
        title: "খরচ নিয়ন্ত্রণে আপনি সেরা!",
        message: `সাবাস! গত মাসের তুলনায় প্রতিদিনের খরচ আপনি ${Math.round(Math.abs(trendPct))}% কমিয়ে এনেছেন। এভাবে চলতে থাকলে মাস শেষে অনেক টাকা জমাতে পারবেন।`,
        tone: "positive",
        icon: "ShieldCheck",
      });
    }
  }

  // 4. CATEGORICAL: Sector Deep-Dive & Advice
  const breakdown = categoryBreakdown(expThis);
  if (breakdown.length > 0) {
    const top = breakdown[0];
    const topPct = (top.total / sumExpThis) * 100;
    
    if (top.category === "FOOD" && topPct > 35) {
      insights.push({
        id: "food-leakage",
        title: "খাবার খরচ একটু কমানো দরকার",
        message: `আপনার মোট খরচের ${Math.round(topPct)}% শুধু খাবারেই চলে যাচ্ছে। বাইরের খাবার কমিয়ে বাসায় রান্না করার অভ্যাস করলে বেশ কিছু টাকা সাশ্রয় হবে।`,
        tone: "neutral",
        icon: "Utensils",
      });
    } else if (top.category === "SHOPPING" && topPct > 25) {
      insights.push({
        id: "shopping-spree-alert",
        title: "শপিং-এ অনেক বেশি খরচ হচ্ছে",
        message: "আপনার শপিং খাতে খরচ একটু বেশিই দেখা যাচ্ছে। হুটহাট কেনাকাটা না করে আগে ভেবে দেখুন জিনিসটি আপনার সত্যিই প্রয়োজন কি না।",
        tone: "warning",
        icon: "ShoppingBag",
      });
    }
  }

  // 5. BEHAVIORAL: Weekend/Holiday Spending (Friday & Saturday)
  const holidayExp = expThis.filter(e => {
    const day = new Date(e.date).getDay();
    return day === 5 || day === 6; 
  });
  const weekdayExp = expThis.filter(e => {
    const day = new Date(e.date).getDay();
    return day !== 5 && day !== 6;
  });
  
  if (holidayExp.length > 0 && weekdayExp.length > 0) {
    const avgHoliday = sumAmount(holidayExp) / Math.max(holidayExp.length, 1);
    const avgWeekday = sumAmount(weekdayExp) / Math.max(weekdayExp.length, 1);
    
    if (avgHoliday > avgWeekday * 2.5) {
      insights.push({
        id: "holiday-drain-intense",
        title: "ছুটির দিনের খরচ একটু সামলে!",
        message: "সপ্তাহের অন্য দিনগুলোর চেয়ে শুক্র ও শনিবার আপনার খরচ আড়াই গুণেরও বেশি। ছুটির দিনের আমেজে পকেট যেন একদম ফাঁকা না হয়ে যায় সেদিকে খেয়াল রাখুন।",
        tone: "warning",
        icon: "Coffee",
      });
    }
  }

  // 6. VOLUME & ANOMALY: Spikes & Patterns
  const peak = highestSpendingDay(expThis);
  if (peak && peak.total > 1000 && currentDayOfMonth > 3) {
    const dailyAvg = sumExpThis / currentDayOfMonth;
    if (peak.total > dailyAvg * 5) {
      const peakDate = new Date(peak.date);
      const formattedDate = peakDate.toLocaleDateString("bn-BD", { day: "numeric", month: "long" });
      insights.push({
        id: "major-outlier",
        title: "হঠাৎ বড় অংকের খরচ!",
        message: `${formattedDate} তারিখে আপনার খরচ সাধারণ গড়ের চেয়ে ৫ গুণ বেশি ছিল। এমন হুটহাট বড় খরচ আপনার জমানো টাকা কমিয়ে দিচ্ছে।`,
        tone: "danger",
        icon: "Zap",
      });
    }
  }

  // 7. STRATEGIC FALLBACK: Long-term Wisdom
  if (insights.length < 4) {
    insights.push({
      id: "emergency-fund-pro",
      title: "বিপদের জন্য টাকা জমান",
      message: "হাতে অন্তত ৬ মাসের খরচ চালানোর মতো টাকা আলাদা করে রাখুন। হুট করে কোনো বিপদ এলে এই টাকাই আপনাকে রক্ষা করবে।",
      tone: "neutral",
      icon: "Shield",
    });
    insights.push({
      id: "investment-logic",
      title: "টাকা জমানোর পাশাপাশি বিনিয়োগ করুন",
      message: "শুধু জমানোই শেষ কথা নয়, টাকা বাড়ানোর জন্য সঠিক জায়গায় বিনিয়োগ করার কথা চিন্তা করুন।",
      tone: "positive",
      icon: "TrendingUp",
    });
  }

  return insights.slice(0, 8);
}
