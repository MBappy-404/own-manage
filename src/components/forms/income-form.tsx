"use client";

import * as React from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

import { incomeSchema, type IncomeInput } from "@/lib/validations";
import { INCOME_FREQUENCIES, prettyEnum } from "@/lib/utils";
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

type Income = {
  id: string;
  amount: number;
  source: string;
  category: string;
  frequency: string;
  date: Date | string;
  notes?: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Income | null;
  onSaved: () => void;
};

const CATEGORIES = ["Salary", "Freelance", "Business", "Investment", "Bonus", "Gift", "Other"];

export function IncomeFormDialog({ open, onOpenChange, initial, onSaved }: Props) {
  const editing = !!initial;
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
    },
  });

  React.useEffect(() => {
    if (initial) {
      reset({
        amount: initial.amount,
        source: initial.source,
        category: initial.category,
        frequency: initial.frequency as IncomeInput["frequency"],
        date: new Date(initial.date),
        notes: initial.notes ?? "",
      });
    } else if (open) {
      reset({
        amount: 0,
        source: "",
        category: "Salary",
        frequency: "ONE_TIME",
        date: new Date(),
        notes: "",
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
      toast.error("Could not save income");
      return;
    }
    toast.success(editing ? "Income updated" : "Income added");
    onOpenChange(false);
    onSaved();
  }

  const date = watch("date");
  const frequency = watch("frequency");
  const category = watch("category");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit income" : "Add income"}</DialogTitle>
          <DialogDescription>
            Track every dollar flowing in — salary, gigs, gifts, investments.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="source">Source</Label>
              <Input id="source" placeholder="e.g. Acme Corp salary" {...register("source")} />
              {errors.source && <p className="text-xs text-destructive">{errors.source.message}</p>}
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
                onValueChange={(v) => setValue("category", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Frequency</Label>
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
              {editing ? "Save changes" : "Add income"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
