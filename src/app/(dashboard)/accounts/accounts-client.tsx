"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Plus, CreditCard, Pencil, Trash2, Wallet, Coins } from "lucide-react";
import { toast } from "sonner";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { financeAccountSchema, type FinanceAccountInput } from "@/lib/validations";
import { useRouter } from "next/navigation";
import { smartFetch } from "@/lib/sync";
import { useI18n } from "@/lib/i18n/provider";
import { useSyncedState } from "@/hooks/use-synced-state";
import { CurrencyValue } from "@/components/ui/currency-value";
import { ConfirmModal } from "@/components/shared/confirm-modal";

type Account = {
  id: string;
  name: string;
  balance: number;
  currency: string;
  icon?: string | null;
};

export function AccountsClient({
  initial,
  currency: userCurrency,
}: {
  initial: Account[];
  currency: string;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [items, setItems] = useSyncedState<Account[]>(initial);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Account | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  async function refresh() {
    const res = await smartFetch("/api/finance-accounts", { method: "GET" });
    const data = await res.json();
    setItems(data.accounts);
    router.refresh();
  }

  React.useEffect(() => {
    router.refresh();
  }, [router]);

  function handleDelete(id: string) {
    setDeletingId(id);
    setConfirmOpen(true);
  }

  async function onConfirmDelete() {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      const res = await smartFetch(`/api/finance-accounts/${deletingId}`, {
        method: "DELETE",
      });
      if (!res.ok) return toast.error(t("settings.updateFailed"));
      toast.success(t("accounts.deleted"));
      setItems((prev) => prev.filter((a) => a.id !== deletingId));
      setConfirmOpen(false);
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  }

  const totalBalance = items.reduce((acc, curr) => acc + curr.balance, 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {t("accounts.title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("accounts.subtitle")}</p>
        </div>
        <Button
          variant="premium"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="w-4 h-4" /> {t("accounts.add")}
        </Button>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-1 bg-premium-gradient text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Wallet className="w-24 h-24 rotate-12" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-white/80 text-sm font-medium">
              {t("dashboard.totalBalance")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              <CurrencyValue value={totalBalance} currency={userCurrency} />
            </div>
            <p className="text-xs text-white/60 mt-1">
              Across {items.length} accounts
            </p>
          </CardContent>
        </Card>

        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map((acc, idx) => (
            <motion.div
              key={acc.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="hover:border-primary/50 transition-colors group">
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-primary">
                      {acc.name.toLowerCase().includes("binance") ? (
                        <Coins className="w-5 h-5" />
                      ) : (
                        <CreditCard className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{acc.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        <CurrencyValue value={acc.balance} currency={acc.currency} />
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        setEditing(acc);
                        setOpen(true);
                      }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDelete(acc.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {!items.length && (
        <Card>
          <CardContent className="p-12 text-center">
            <CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-20" />
            <p className="text-muted-foreground">{t("accounts.empty")}</p>
          </CardContent>
        </Card>
      )}

      <AccountDialog
        open={open}
        onOpenChange={setOpen}
        initial={editing}
        onSaved={refresh}
      />

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={onConfirmDelete}
        title={t("accounts.confirmDelete")}
        isLoading={isDeleting}
      />
    </div>
  );
}

function AccountDialog({
  open,
  onOpenChange,
  initial,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: Account | null;
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
  } = useForm<FinanceAccountInput>({
    resolver: zodResolver(financeAccountSchema) as unknown as Resolver<FinanceAccountInput>,
    defaultValues: {
      name: "",
      balance: 0,
      currency: "BDT",
    },
  });

  React.useEffect(() => {
    if (initial) {
      reset({
        name: initial.name,
        balance: initial.balance,
        currency: initial.currency,
      });
    } else if (open) {
      reset({
        name: "",
        balance: 0,
        currency: "BDT",
      });
    }
  }, [initial, open, reset]);

  const currencyValue = watch("currency");

  async function onSubmit(values: FinanceAccountInput) {
    const url = editing
      ? `/api/finance-accounts/${initial!.id}`
      : "/api/finance-accounts";
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
          <DialogTitle>{editing ? t("accounts.edit") : t("accounts.add")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="name">{t("accounts.name")}</Label>
            <Input
              id="name"
              placeholder="e.g. BKash, Nagad, City Bank"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="balance">{t("accounts.balance")}</Label>
              <Input
                id="balance"
                type="number"
                step="0.01"
                {...register("balance")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">{t("accounts.currency")}</Label>
              <Select
                value={currencyValue}
                onValueChange={(v) => setValue("currency", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BDT">BDT</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
