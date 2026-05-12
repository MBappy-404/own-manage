"use client";

import * as React from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

import { incomeSchema, type IncomeInput } from "@/lib/validations";
import { INCOME_FREQUENCIES } from "@/lib/utils";
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

type Income = {
  id: string;
  amount: number;
  source: string;
  category: string;
  frequency: string;
  date: Date | string;
  notes?: string | null;
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
  initial?: Income | null;
  onSaved: () => void;
};

const CATEGORIES = ["Salary", "Freelance", "Business", "Investment", "Bonus", "Gift", "Other"];

export function IncomeFormDialog({ open, onOpenChange, initial, onSaved }: Props) {
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
  } = useForm<IncomeInput>({
    resolver: zodResolver(incomeSchema) as unknown as Resolver<IncomeInput>,
    defaultValues: {
      amount: 0,
      source: "",
      category: "Salary",
      frequency: "ONE_TIME",
      date: new Date(),
      notes: "",
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
        source: initial.source,
        category: initial.category,
        frequency: initial.frequency as IncomeInput["frequency"],
        date: new Date(initial.date),
        notes: initial.notes ?? "",
        financeAccountId: initial.financeAccountId ?? "",
      });
    } else if (open) {
      reset({
        amount: 0,
        source: "",
        category: "Salary",
        frequency: "ONE_TIME",
        date: new Date(),
        notes: "",
        financeAccountId: "",
      });
    }
  }, [initial, open, reset]);

  async function onSubmit(values: IncomeInput) {
    const url = editing ? `/api/income/${initial!.id}` : "/api/income";
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
    toast.success(editing ? t("income.updated") : t("income.added"));
    onOpenChange(false);
    onSaved();
  }

  const date = watch("date");
  const frequency = watch("frequency");
  const category = watch("category");
  const financeAccountId = watch("financeAccountId");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? t("income.edit") : t("income.add")}</DialogTitle>
          <DialogDescription>
            {t("income.dialogSubtitle")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="source">{t("income.source")}</Label>
              <Input id="source" placeholder={t("income.sourcePlaceholder")} {...register("source")} />
              {errors.source && <p className="text-xs text-destructive">{errors.source.message}</p>}
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
                onValueChange={(v) => setValue("category", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {t(`incomeCategory.${c}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("income.frequency")}</Label>
              <Select
                value={frequency}
                onValueChange={(v) => setValue("frequency", v as IncomeInput["frequency"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INCOME_FREQUENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {t(`frequency.${c}`)}
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
            <Label htmlFor="notes">{t("common.notes")}</Label>
            <Textarea id="notes" placeholder={t("common.optional")} rows={2} {...register("notes")} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" variant="premium" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {editing ? t("common.saveChanges") : t("income.add")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
