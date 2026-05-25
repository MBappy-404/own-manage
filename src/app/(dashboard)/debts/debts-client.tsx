"use client";

import * as React from "react";
import { Plus, Users, Pencil, Trash2, ArrowUpRight, ArrowDownLeft, Calendar, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
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
import { useRouter } from "next/navigation";
import { smartFetch } from "@/lib/sync";
import { useI18n } from "@/lib/i18n/provider";
import { useSyncedState } from "@/hooks/use-synced-state";
import { CurrencyValue } from "@/components/ui/currency-value";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { formatDate, cn, formatCurrency } from "@/lib/utils";

type Debt = {
  id: string;
  personName: string;
  amount: number;
  type: "GIVEN" | "TAKEN";
  status: "PENDING" | "PAID";
  dueDate?: string | Date | null;
  notes?: string | null;
  financeAccountId?: string | null;
};

type Account = {
  id: string;
  name: string;
  balance: number;
  currency: string;
};

const PAGE_SIZE = 20;

export function DebtsClient({
  initial,
  accounts = [],
  currency,
}: {
  initial: Debt[];
  accounts: Account[];
  currency: string;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [items, setItems] = useSyncedState<Debt[]>(initial);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Debt | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  async function refresh() {
    const res = await smartFetch("/api/debts", { method: "GET" });
    const data = await res.json();
    setItems(data.debts);
    router.refresh();
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

  const [page, setPage] = React.useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));

  React.useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginated = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const rangeStart = items.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, items.length);

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
          <CardContent className="p-0">
            {!items.length ? (
              <div className="py-12 text-center text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-10" />
                <p>{t("debts.empty")}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-muted bg-muted/10 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <th className="px-6 py-3.5">{t("debts.type")}</th>
                      <th className="px-6 py-3.5">{t("debts.person")}</th>
                      <th className="px-6 py-3.5">{t("debts.dueDate")}</th>
                      <th className="px-6 py-3.5">{t("common.notes")}</th>
                      <th className="px-6 py-3.5 text-right">{t("common.amount")}</th>
                      <th className="px-6 py-3.5 text-center">{t("debts.status")}</th>
                      <th className="px-6 py-3.5 text-right">{t("common.actions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-muted/30">
                    {paginated.map((debt) => (
                      <tr
                        key={debt.id}
                        className={cn(
                          "hover:bg-accent/10 transition-colors align-middle",
                          debt.status === "PAID" && "opacity-60 grayscale-[0.3]"
                        )}
                      >
                        <td className="px-6 py-4">
                          <div
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                              debt.type === "GIVEN"
                                ? "bg-success/10 text-success"
                                : "bg-destructive/10 text-destructive"
                            )}
                          >
                            {debt.type === "GIVEN" ? (
                              <ArrowUpRight className="w-4.5 h-4.5" />
                            ) : (
                              <ArrowDownLeft className="w-4.5 h-4.5" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-foreground">
                          <div className="flex flex-col">
                            <span>{debt.personName}</span>
                            {debt.financeAccountId && (
                              <div className="mt-0.5">
                                <Badge variant="outline" className="text-[9px] px-1 py-0 border-muted text-muted-foreground font-normal">
                                  {accounts.find(a => a.id === debt.financeAccountId)?.name || "Account"}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                          {debt.dueDate ? (
                            <span className="flex items-center gap-1 text-xs">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDate(debt.dueDate)}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground max-w-[180px] truncate text-xs">
                          {debt.notes || "—"}
                        </td>
                        <td className="px-6 py-4 text-right font-bold tabular-nums text-sm">
                          <span className={debt.type === "GIVEN" ? "text-success" : "text-destructive"}>
                            {debt.type === "GIVEN" ? "+" : "-"}
                            <CurrencyValue value={debt.amount} currency={currency} />
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge
                            variant={debt.status === "PAID" ? "success" : "secondary"}
                            className="text-[10px] px-2 py-0.5"
                          >
                            {debt.status === "PAID" ? t("debts.paid") : t("debts.pending")}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            {debt.status !== "PAID" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => toggleStatus(debt)}
                                  className="text-muted-foreground hover:text-success"
                                  title="Mark as Paid"
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
                                  title="Edit"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleDelete(debt.id)}
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {items.length > PAGE_SIZE && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t">
                <p className="text-xs text-muted-foreground">
                  {t("common.paginationShowing", {
                    from: rangeStart,
                    to: rangeEnd,
                    total: items.length,
                  })}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    {t("common.prev")}
                  </Button>
                  <span className="text-xs font-medium tabular-nums px-2">
                    {t("common.paginationPage", { page, total: totalPages })}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    {t("common.next")}
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <DebtDialog
        open={open}
        onOpenChange={setOpen}
        initial={editing}
        accounts={accounts}
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
  accounts,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: Debt | null;
  accounts: Account[];
  onSaved: () => void;
}) {
  const { t, locale } = useI18n();
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
      financeAccountId: "",
      dueDate: new Date(),
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
        financeAccountId: initial.financeAccountId ?? "",
      });
    } else if (open) {
      reset({
        personName: "",
        amount: 0,
        type: "GIVEN",
        status: "PENDING",
        dueDate: new Date(),
        notes: "",
        financeAccountId: "",
      });
    }
  }, [initial, open, reset]);

  const typeValue = watch("type");
  const dueDateValue = watch("dueDate");
  const financeAccountIdValue = watch("financeAccountId");

  async function onSubmit(values: DebtInput) {
    const url = editing ? `/api/debts/${initial!.id}` : "/api/debts";
    const method = editing ? "PUT" : "POST";
    const res = await smartFetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        financeAccountId: values.financeAccountId || null,
      }),
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
            <Label htmlFor="financeAccountId">{t("accounts.title")} ({t("common.optional")})</Label>
            <Select
              value={financeAccountIdValue || "none"}
              onValueChange={(v: string) => setValue("financeAccountId", v === "none" ? "" : v)}
            >
              <SelectTrigger id="financeAccountId">
                <SelectValue placeholder={t("common.none")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("common.none")}</SelectItem>
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name} ({formatCurrency(acc.balance, acc.currency, locale)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
