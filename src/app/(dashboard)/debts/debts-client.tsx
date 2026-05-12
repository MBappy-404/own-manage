"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Plus, Users, Pencil, Trash2, ArrowUpRight, ArrowDownLeft, Calendar, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { debtSchema, type DebtInput } from "@/lib/validations";
import { smartFetch } from "@/lib/sync";
import { useI18n } from "@/lib/i18n/provider";
import { CurrencyValue } from "@/components/ui/currency-value";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { formatDate, cn } from "@/lib/utils";

type Debt = {
  id: string;
  personName: string;
  amount: number;
  type: "GIVEN" | "TAKEN";
  status: "PENDING" | "PAID";
  dueDate?: string | Date | null;
  notes?: string | null;
};

export function DebtsClient({
  initial,
  currency,
}: {
  initial: Debt[];
  currency: string;
}) {
  const { t } = useI18n();
  const [items, setItems] = React.useState<Debt[]>(initial);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Debt | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  async function refresh() {
    const res = await smartFetch("/api/debts", { method: "GET" });
    const data = await res.json();
    setItems(data.debts);
  }

  function handleDelete(id: string) {
    setDeletingId(id);
    setConfirmOpen(true);
  }

  async function onConfirmDelete() {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      const res = await smartFetch(`/api/debts/${deletingId}`, { method: "DELETE" });
      if (!res.ok) return toast.error(t("settings.updateFailed"));
      toast.success(t("debts.deleted"));
      setItems((prev) => prev.filter((d) => d.id !== deletingId));
      setConfirmOpen(false);
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  }

  async function toggleStatus(debt: Debt) {
    const newStatus = debt.status === "PENDING" ? "PAID" : "PENDING";
    const res = await smartFetch(`/api/debts/${debt.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) return toast.error(t("settings.updateFailed"));
    toast.success(t("common.saveChanges"));
    setItems((prev) =>
      prev.map((d) => (d.id === debt.id ? { ...d, status: newStatus } : d))
    );
  }

  const totalGiven = items
    .filter((d) => d.type === "GIVEN" && d.status === "PENDING")
    .reduce((acc, curr) => acc + curr.amount, 0);
  const totalTaken = items
    .filter((d) => d.type === "TAKEN" && d.status === "PENDING")
    .reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {t("debts.title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("debts.subtitle")}</p>
        </div>
        <Button
          variant="premium"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="w-4 h-4" /> {t("debts.add")}
        </Button>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="bg-success/5 border-success/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center text-success">
              <ArrowUpRight className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-success uppercase tracking-wider">
                {t("debts.given")} (Pending)
              </p>
              <h3 className="text-2xl font-bold">
                <CurrencyValue value={totalGiven} currency={currency} />
              </h3>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-destructive/5 border-destructive/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive">
              <ArrowDownLeft className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-destructive uppercase tracking-wider">
                {t("debts.taken")} (Pending)
              </p>
              <h3 className="text-2xl font-bold">
                <CurrencyValue value={totalTaken} currency={currency} />
              </h3>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("common.all")}</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            {!items.length ? (
              <div className="py-12 text-center text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-10" />
                <p>{t("debts.empty")}</p>
              </div>
            ) : (
              <ul className="divide-y">
                {items.map((debt, idx) => (
                  <motion.li
                    key={debt.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.02 }}
                    className={cn(
                      "flex items-center gap-4 px-6 py-4 hover:bg-accent/30 transition-colors",
                      debt.status === "PAID" && "opacity-60 grayscale-[0.5]"
                    )}
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                        debt.type === "GIVEN"
                          ? "bg-success/10 text-success"
                          : "bg-destructive/10 text-destructive"
                      )}
                    >
                      {debt.type === "GIVEN" ? (
                        <ArrowUpRight className="w-5 h-5" />
                      ) : (
                        <ArrowDownLeft className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold truncate">{debt.personName}</p>
                        <Badge
                          variant={debt.status === "PAID" ? "success" : "secondary"}
                          className="text-[10px]"
                        >
                          {debt.status === "PAID" ? t("debts.paid") : t("debts.pending")}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        {debt.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(debt.dueDate)}
                          </span>
                        )}
                        {debt.notes && (
                          <span className="truncate max-w-[150px]">
                            · {debt.notes}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={cn(
                          "font-bold tabular-nums",
                          debt.type === "GIVEN" ? "text-success" : "text-destructive"
                        )}
                      >
                        {debt.type === "GIVEN" ? "+" : "-"}
                        <CurrencyValue value={debt.amount} currency={currency} />
                      </p>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => toggleStatus(debt)}
                        className={debt.status === "PAID" ? "text-success" : ""}
                        title={debt.status === "PAID" ? "Mark as Pending" : "Mark as Paid"}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          setEditing(debt);
                          setOpen(true);
                        }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(debt.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </div>
                  </motion.li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      <DebtDialog
        open={open}
        onOpenChange={setOpen}
        initial={editing}
        onSaved={refresh}
      />

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={onConfirmDelete}
        title={t("debts.confirmDelete")}
        isLoading={isDeleting}
      />
    </div>
  );
}

function DebtDialog({
  open,
  onOpenChange,
  initial,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: Debt | null;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const editing = !!initial;
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DebtInput>({
    resolver: zodResolver(debtSchema) as unknown as Resolver<DebtInput>,
    defaultValues: {
      personName: "",
      amount: 0,
      type: "GIVEN",
      status: "PENDING",
      notes: "",
    },
  });

  React.useEffect(() => {
    if (initial) {
      reset({
        personName: initial.personName,
        amount: initial.amount,
        type: initial.type,
        status: initial.status,
        dueDate: initial.dueDate ? new Date(initial.dueDate) : null,
        notes: initial.notes ?? "",
      });
    } else if (open) {
      reset({
        personName: "",
        amount: 0,
        type: "GIVEN",
        status: "PENDING",
        dueDate: null,
        notes: "",
      });
    }
  }, [initial, open, reset]);

  const typeValue = watch("type");
  const dueDateValue = watch("dueDate");

  async function onSubmit(values: DebtInput) {
    const url = editing ? `/api/debts/${initial!.id}` : "/api/debts";
    const method = editing ? "PUT" : "POST";
    const res = await smartFetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) return toast.error(t("settings.updateFailed"));
    toast.success(editing ? t("common.saveChanges") : t("common.save"));
    onOpenChange(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editing ? t("debts.edit") : t("debts.add")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="personName">{t("debts.person")}</Label>
            <Input
              id="personName"
              placeholder="e.g. John Doe, Rakib"
              {...register("personName")}
            />
            {errors.personName && (
              <p className="text-xs text-destructive">{errors.personName.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">{t("debts.amount")}</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                {...register("amount")}
              />
              {errors.amount && (
                <p className="text-xs text-destructive">{errors.amount.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">{t("debts.type")}</Label>
              <Select
                value={typeValue}
                onValueChange={(v: string) => setValue("type", v as "GIVEN" | "TAKEN")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GIVEN">{t("debts.given")}</SelectItem>
                  <SelectItem value="TAKEN">{t("debts.taken")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dueDate">{t("debts.dueDate")}</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDateValue ? format(new Date(dueDateValue), "yyyy-MM-dd") : ""}
              onChange={(e) =>
                setValue("dueDate", e.target.value ? new Date(e.target.value) : null)
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">{t("common.notes")}</Label>
            <Input id="notes" {...register("notes")} />
          </div>
          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" variant="premium" disabled={isSubmitting}>
              {editing ? t("common.save") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
