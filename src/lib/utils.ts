import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number,
  currency: string = "USD",
  locale: string = "en-US",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

export function formatCompactCurrency(
  amount: number,
  currency: string = "USD",
): string {
  return new Intl.NumberFormat("en-US", {
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
  "SHOPPING",
  "BILLS",
  "TRAVEL",
  "ENTERTAINMENT",
  "EDUCATION",
  "MEDICAL",
  "HOUSING",
  "TRANSPORT",
  "OTHERS",
] as const;

export const PAYMENT_METHODS = [
  "CASH",
  "CARD",
  "BANK_TRANSFER",
  "MOBILE_PAYMENT",
  "OTHER",
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
  SHOPPING: "#ec4899",
  BILLS: "#0ea5e9",
  TRAVEL: "#22c55e",
  ENTERTAINMENT: "#a855f7",
  EDUCATION: "#eab308",
  MEDICAL: "#ef4444",
  HOUSING: "#14b8a6",
  TRANSPORT: "#6366f1",
  OTHERS: "#64748b",
};

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? "#64748b";
}
