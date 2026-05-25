"use client";

import * as React from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

import { expenseSchema, type ExpenseInput } from "@/lib/validations";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from "@/lib/utils";
import { smartFetch } from "@/lib/sync";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n/provider";

type Expense = {
  id: string;
  amount: number;
  category: string;
  paymentMethod: string;
  date: Date | string;
  notes?: string | null;
  merchant?: string | null;
  financeAccountId?: string | null;
};

type FinanceAccount = {
  id: string;
  name: string;
  balance: number;
  currency: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Expense | null;
  onSaved: () => void;
};

export function ExpenseFormDialog({ open, onOpenChange, initial, onSaved }: Props) {
  const { t } = useI18n();
  const editing = !!initial;
  const [accounts, setAccounts] = React.useState<FinanceAccount[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseInput>({
    resolver: zodResolver(expenseSchema) as unknown as Resolver<ExpenseInput>,
    defaultValues: {
      amount: 0,
      category: "FOOD",
      paymentMethod: "CASH",
      date: new Date(),
      notes: "",
      merchant: "",
      financeAccountId: "",
    },
  });

  React.useEffect(() => {
    async function fetchAccounts() {
      const res = await smartFetch("/api/finance-accounts");
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
      }
    }
    if (open) {
      fetchAccounts();
    }
  }, [open]);

  React.useEffect(() => {
    if (initial) {
      reset({
        amount: initial.amount,
        category: initial.category as ExpenseInput["category"],
        paymentMethod: initial.paymentMethod as ExpenseInput["paymentMethod"],
        date: new Date(initial.date),
        notes: initial.notes ?? "",
        merchant: initial.merchant ?? "",
        financeAccountId: initial.financeAccountId ?? "",
      });
    } else if (open) {
      reset({
        amount: 0,
        category: "FOOD",
        paymentMethod: "CASH",
        date: new Date(),
        notes: "",
        merchant: "",
        financeAccountId: "",
      });
    }
  }, [initial, open, reset]);

  async function onSubmit(values: ExpenseInput) {
    const url = editing ? `/api/expense/${initial!.id}` : "/api/expense";
    const method = editing ? "PUT" : "POST";
    const res = await smartFetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      toast.error(t("settings.updateFailed"));
      return;
    }
    toast.success(editing ? t("expense.updated") : t("expense.added"));
    onOpenChange(false);
    onSaved();
  }

  const date = watch("date");
  const category = watch("category");
  const paymentMethod = watch("paymentMethod");
  const financeAccountId = watch("financeAccountId");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? t("expense.edit") : t("expense.add")}</DialogTitle>
          <DialogDescription>
            {t("expense.dialogSubtitle")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="merchant">{t("expense.merchant")}</Label>
              <Input id="merchant" placeholder={t("expense.merchantPlaceholder")} {...register("merchant")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="amount">{t("common.amount")}</Label>
              <Input id="amount" type="number" step="0.01" {...register("amount")} />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date">{t("common.date")}</Label>
              <Input
                id="date"
                type="date"
                value={date ? format(new Date(date), "yyyy-MM-dd") : ""}
                onChange={(e) =>
                  setValue("date", e.target.value ? new Date(e.target.value) : new Date())
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("common.category")}</Label>
              <Select
                value={category}
                onValueChange={(v) => setValue("category", v as ExpenseInput["category"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {EXPENSE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {t(`category.${c}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("expense.paymentMethod")}</Label>
              <Select
                value={paymentMethod}
                onValueChange={(v) =>
                  setValue("paymentMethod", v as ExpenseInput["paymentMethod"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {t(`payment.${c}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {accounts.length > 0 && (
              <div className="space-y-1.5 col-span-2">
                <Label>{t("accounts.title")}</Label>
                <Select
                  value={financeAccountId || "none"}
                  onValueChange={(v) =>
                    setValue("financeAccountId", v === "none" ? "" : v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("common.optional")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("common.none")}</SelectItem>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.name} ({acc.balance} {acc.currency})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">{t("expense.detailsLabel")}</Label>
            <Textarea
              id="notes"
              placeholder={t("expense.detailsPlaceholder")}
              rows={3}
              {...register("notes")}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" variant="premium" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {editing ? t("common.saveChanges") : t("expense.add")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
