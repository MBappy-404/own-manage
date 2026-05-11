import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().email("Enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password too long"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8).max(72),
});

export const incomeSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  source: z.string().min(1, "Source is required").max(80),
  category: z.string().min(1).max(40).default("Salary"),
  frequency: z.enum(["ONE_TIME", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"]).default("ONE_TIME"),
  date: z.coerce.date(),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export const expenseSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  category: z.enum([
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
  ]),
  paymentMethod: z.enum([
    "CASH",
    "CARD",
    "BANK_TRANSFER",
    "MOBILE_PAYMENT",
    "OTHER",
  ]).default("CASH"),
  date: z.coerce.date(),
  notes: z.string().max(500).optional().or(z.literal("")),
  merchant: z.string().max(80).optional().or(z.literal("")),
});

export const savingsGoalSchema = z.object({
  title: z.string().min(1).max(80),
  targetAmount: z.coerce.number().positive(),
  currentAmount: z.coerce.number().min(0).default(0),
  deadline: z.coerce.date().optional().nullable(),
  description: z.string().max(300).optional().or(z.literal("")),
});

export const profileSchema = z.object({
  name: z.string().min(2).max(80),
  currency: z.string().min(3).max(5),
  monthlyBudget: z.coerce.number().min(0).optional().nullable(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type IncomeInput = z.infer<typeof incomeSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
export type SavingsGoalInput = z.infer<typeof savingsGoalSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
