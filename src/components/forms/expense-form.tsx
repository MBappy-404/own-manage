"use client";

import * as React from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

import { expenseSchema, type ExpenseInput } from "@/lib/validations";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, prettyEnum } from "@/lib/utils";
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

type Expense = {
  id: string;
  amount: number;
  category: string;
  paymentMethod: string;
  date: Date | string;
  notes?: string | null;
  merchant?: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Expense | null;
  onSaved: () => void;
};

export function ExpenseFormDialog({ open, onOpenChange, initial, onSaved }: Props) {
  const editing = !!initial;
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
    },
  });

  React.useEffect(() => {
    if (initial) {
      reset({
        amount: initial.amount,
        category: initial.category as ExpenseInput["category"],
        paymentMethod: initial.paymentMethod as ExpenseInput["paymentMethod"],
        date: new Date(initial.date),
        notes: initial.notes ?? "",
        merchant: initial.merchant ?? "",
      });
    } else if (open) {
      reset({
        amount: 0,
        category: "FOOD",
        paymentMethod: "CASH",
        date: new Date(),
        notes: "",
        merchant: "",
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
      toast.error("Could not save expense");
      return;
    }
    toast.success(editing ? "Expense updated" : "Expense added");
    onOpenChange(false);
    onSaved();
  }

  const date = watch("date");
  const category = watch("category");
  const paymentMethod = watch("paymentMethod");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit expense" : "Add expense"}</DialogTitle>
          <DialogDescription>
            Capture each spend to power smarter analytics & AI insights.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="merchant">Merchant / What for</Label>
              <Input id="merchant" placeholder="e.g. Whole Foods, Uber" {...register("merchant")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" type="number" step="0.01" {...register("amount")} />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date">Date</Label>
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
              <Label>Category</Label>
              <Select
                value={category}
                onValueChange={(v) => setValue("category", v as ExpenseInput["category"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {prettyEnum(c)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Payment method</Label>
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
                      {prettyEnum(c)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" placeholder="Optional" rows={2} {...register("notes")} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="premium" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {editing ? "Save changes" : "Add expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
