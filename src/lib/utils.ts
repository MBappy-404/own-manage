import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number,
  currency: string = "USD",
  locale: string = "en",
): string {
  const numberLocale = locale === "bn" ? "bn-BD" : "en-US";
  if (currency === "BDT") {
    const formatted = new Intl.NumberFormat(numberLocale, {
      maximumFractionDigits: 0,
    }).format(amount || 0);
    // Using a bolder Taka symbol approach if possible, but for string we just return the char
    return `৳${formatted}`;
  }
  return new Intl.NumberFormat(numberLocale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

export function formatCompactCurrency(
  amount: number,
  currency: string = "USD",
  locale: string = "en",
): string {
  const numberLocale = locale === "bn" ? "bn-BD" : "en-US";
  if (currency === "BDT") {
    const formatted = new Intl.NumberFormat(numberLocale, {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount || 0);
    return `৳${formatted}`;
  }
  return new Intl.NumberFormat(numberLocale, {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount || 0);
}

export function formatDate(date: Date | string, withTime = false): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(withTime && { hour: "2-digit", minute: "2-digit" }),
  }).format(d);
}

export function getInitials(name?: string | null) {
  if (!name) return "U";
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function percentChange(current: number, previous: number): number {
  if (!previous) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function safeDivide(a: number, b: number): number {
  return b === 0 ? 0 : a / b;
}

export const EXPENSE_CATEGORIES = [
  "FOOD",
  "GROCERIES",
  "DINING",
  "SNACKS",
  "SHOPPING",
  "CLOTHING",
  "ELECTRONICS",
  "FURNITURE",
  "PERSONAL_CARE",
  "BEAUTY",
  "BILLS",
  "UTILITIES",
  "INTERNET",
  "PHONE",
  "MOBILE_RECHARGE",
  "RENT",
  "HOUSING",
  "INSURANCE",
  "TAXES",
  "LOAN",
  "TRANSPORT",
  "FUEL",
  "PARKING",
  "TRAVEL",
  "DELIVERY",
  "MEDICAL",
  "PHARMACY",
  "DENTAL",
  "FITNESS",
  "EDUCATION",
  "CHILDCARE",
  "BABY",
  "PET",
  "ENTERTAINMENT",
  "TOURNAMENT",
  "SUBSCRIPTIONS",
  "GIFTS",
  "CHARITY",
  "OFFICE",
  "MAINTENANCE",
  "REPAIR",
  "LEGAL",
  "TOYS",
  "OTHERS",
] as const;

export const PAYMENT_METHODS = [
  "CASH",
  "CARD",
  "BANK_TRANSFER",
  "BKASH",
  "NAGAD",
  "ROCKET",
  "MOBILE_PAYMENT",
  "OTHER",
] as const;

export const INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Business",
  "PartTime",
  "Consulting",
  "Teaching",
  "Sales",
  "SideHustle",
  "Investment",
  "Dividends",
  "Interest",
  "Rental",
  "Remittance",
  "Bonus",
  "Commission",
  "Allowance",
  "Pension",
  "Government",
  "Agriculture",
  "Royalties",
  "Refund",
  "Cashback",
  "Gift",
  "Other",
] as const;

export const INCOME_FREQUENCIES = [
  "ONE_TIME",
  "DAILY",
  "WEEKLY",
  "MONTHLY",
  "YEARLY",
] as const;

export function prettyEnum(value: string): string {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export const CATEGORY_COLORS: Record<string, string> = {
  FOOD: "#f97316",
  GROCERIES: "#10b981",
  DINING: "#f43f5e",
  SNACKS: "#fb923c",
  SHOPPING: "#ec4899",
  CLOTHING: "#06b6d4",
  ELECTRONICS: "#3b82f6",
  FURNITURE: "#78716c",
  PERSONAL_CARE: "#d946ef",
  BEAUTY: "#f472b6",
  BILLS: "#0ea5e9",
  UTILITIES: "#0284c7",
  INTERNET: "#2563eb",
  PHONE: "#1d4ed8",
  MOBILE_RECHARGE: "#0ea5e9",
  RENT: "#0d9488",
  HOUSING: "#14b8a6",
  INSURANCE: "#6b7280",
  TAXES: "#475569",
  LOAN: "#b45309",
  TRANSPORT: "#6366f1",
  FUEL: "#ca8a04",
  PARKING: "#a16207",
  TRAVEL: "#22c55e",
  DELIVERY: "#84cc16",
  MEDICAL: "#ef4444",
  PHARMACY: "#dc2626",
  DENTAL: "#f87171",
  FITNESS: "#16a34a",
  EDUCATION: "#eab308",
  CHILDCARE: "#fbbf24",
  BABY: "#fcd34d",
  PET: "#a3e635",
  ENTERTAINMENT: "#a855f7",
  TOURNAMENT: "#8b5cf6",
  SUBSCRIPTIONS: "#4f46e5",
  GIFTS: "#facc15",
  CHARITY: "#f59e0b",
  OFFICE: "#64748b",
  MAINTENANCE: "#7c3aed",
  REPAIR: "#9333ea",
  LEGAL: "#334155",
  TOYS: "#fbbf24",
  OTHERS: "#64748b",
};

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? "#64748b";
}
