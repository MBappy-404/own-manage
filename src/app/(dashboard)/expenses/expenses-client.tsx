"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2, TrendingDown } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExpenseFormDialog } from "@/components/forms/expense-form";
import { StatCard } from "@/components/dashboard/stat-card";
import { CategoryPie } from "@/components/charts/category-pie";
import { SimpleBar } from "@/components/charts/bar-chart";
import { ExpenseHeatmap } from "@/components/charts/heatmap";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, formatDate, getCategoryColor } from "@/lib/utils";
import { CurrencyValue } from "@/components/ui/currency-value";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import {
  buildDailySeries,
  bestEarningMonth,
  categoryBreakdown,
  filterByInterval,
  highestSpendingDay,
  lowestSpendingDay,
  periodInterval,
  spendingByDayOfWeek,
  sumAmount,
} from "@/lib/analytics";
import { ExpenseTrendChart } from "./expense-trend-chart";
import { useRouter } from "next/navigation";
import { smartFetch } from "@/lib/sync";
import { useI18n } from "@/lib/i18n/provider";
import { useSyncedState } from "@/hooks/use-synced-state";

const PAGE_SIZE = 20;

type Expense = {
  id: string;
  amount: number;
  category: string;
  paymentMethod: string;
  date: string;
  notes?: string | null;
  merchant?: string | null;
};

export function ExpensesClient({
  initial,
  currency,
}: {
  initial: Expense[];
  currency: string;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [items, setItems] = useSyncedState<Expense[]>(initial);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Expense | null>(null);
  const [search, setSearch] = React.useState("");
  const [filterCategory, setFilterCategory] = React.useState<string>("ALL");
  const [filterPayment, setFilterPayment] = React.useState<string>("ALL");
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [page, setPage] = React.useState(1);

  async function refresh() {
    const res = await smartFetch("/api/expense", { method: "GET" });
    const data = await res.json();
    setItems(data.expenses);
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
      const res = await smartFetch(`/api/expense/${deletingId}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error(t("settings.updateFailed"));
        return;
      }
      toast.success(t("expense.deleted"));
      setItems((prev) => prev.filter((i) => i.id !== deletingId));
      router.refresh();
      setConfirmOpen(false);
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  }

  const withDate = React.useMemo(
    () =>
      items.map((e) => ({
        ...e,
        date: new Date(e.date),
      })),
    [items],
  );

  const total = sumAmount(withDate);
  const month = periodInterval("month");
  const week = periodInterval("week");
  const day = periodInterval("day");
  const year = periodInterval("year");
  const monthExp = filterByInterval(withDate, month.start, month.end);
  const weekExp = filterByInterval(withDate, week.start, week.end);
  const dayExp = filterByInterval(withDate, day.start, day.end);
  const yearExp = filterByInterval(withDate, year.start, year.end);
  const monthBreakdown = categoryBreakdown(monthExp);
  const topCategoryMonth = monthBreakdown[0];
  const daysInMonthSoFar = Math.max(
    1,
    Math.ceil((Date.now() - month.start.getTime()) / 86400000),
  );
  const avgDailyMonth = sumAmount(monthExp) / daysInMonthSoFar;
  const breakdown = categoryBreakdown(withDate);
  const heatmap = buildDailySeries(withDate, 90);
  const dayOfWeek = spendingByDayOfWeek(withDate);
  const peak = highestSpendingDay(withDate);
  const low = lowestSpendingDay(withDate);
  const peakMonth = bestEarningMonth(withDate);

  const filtered = items.filter((i) => {
    const matchesCategory = filterCategory === "ALL" || i.category === filterCategory;
    const matchesPayment = filterPayment === "ALL" || i.paymentMethod === filterPayment;
    const text = `${i.merchant ?? ""} ${i.notes ?? ""} ${i.category} ${i.paymentMethod}`.toLowerCase();
    const matchesSearch = !search || text.includes(search.toLowerCase());
    return matchesCategory && matchesPayment && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  React.useEffect(() => {
    setPage(1);
  }, [search, filterCategory, filterPayment]);

  React.useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const rangeStart = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, filtered.length);

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t("expense.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("expense.subtitle")}
          </p>
        </div>
        <Button
          variant="premium"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="w-4 h-4" /> {t("expense.add")}
        </Button>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
        <StatCard label={t("expense.total")} value={total} currency={currency} icon="TrendingDown" variant="destructive" delay={0} />
        <StatCard label={t("common.thisMonth")} value={sumAmount(monthExp)} currency={currency} icon="TrendingDown" variant="warning" delay={0.05} />
        <StatCard label={t("common.thisWeek")} value={sumAmount(weekExp)} currency={currency} icon="TrendingDown" variant="warning" delay={0.1} />
        <StatCard label={t("expense.byDay")} value={sumAmount(dayExp)} currency={currency} icon="TrendingDown" variant="warning" delay={0.15} />
        <StatCard label={t("expense.yearTotal")} value={sumAmount(yearExp)} currency={currency} icon="TrendingDown" variant="warning" delay={0.2} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ExpenseTrendChart items={withDate} title={t("expense.trend")} />
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>{t("expense.highlights")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                {t("expense.topCategoryMonth")}
              </p>
              <p className="font-semibold text-sm">
                {topCategoryMonth ? (
                  <>
                    {t(`category.${topCategoryMonth.category}`)}{" "}
                    <span className="text-muted-foreground font-normal">
                      (<CurrencyValue value={topCategoryMonth.total} currency={currency} />)
                    </span>
                  </>
                ) : "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                {t("expense.avgDailyMonth")}
              </p>
              <p className="font-semibold">
                <CurrencyValue value={avgDailyMonth} currency={currency} />
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                {t("expense.peakMonth")}
              </p>
              <p className="font-semibold">
                {peakMonth ? (
                  <>
                    <CurrencyValue value={peakMonth.total} currency={currency} /> ({peakMonth.month})
                  </>
                ) : "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                {t("expense.peakDay")}
              </p>
              <p className="font-semibold">
                {peak ? (
                  <>
                    <CurrencyValue value={peak.total} currency={currency} /> · {peak.date}
                  </>
                ) : "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                {t("expense.entries")}
              </p>
              <p className="font-semibold">{items.length}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{t("expense.byCategory")}</CardTitle>
            <p className="text-xs text-muted-foreground">{t("common.allTime")}</p>
          </CardHeader>
          <CardContent>
            <CategoryPie data={breakdown} currency={currency} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{t("expense.byDay")}</CardTitle>
            <p className="text-xs text-muted-foreground">{t("common.allTime")}</p>
          </CardHeader>
          <CardContent>
            <SimpleBar data={dayOfWeek} dataKey="total" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{t("expense.heatmap")}</CardTitle>
            <p className="text-xs text-muted-foreground">{t("expense.last90Days")}</p>
          </CardHeader>
          <CardContent>
            <ExpenseHeatmap data={heatmap} currency={currency} />
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">{t("expense.highest")}</p>
                <p className="font-semibold">
                  {peak ? <CurrencyValue value={peak.total} currency={currency} /> : "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">{t("expense.lowest")}</p>
                <p className="font-semibold">
                  {low ? <CurrencyValue value={low.total} currency={currency} /> : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle>{t("expense.all")}</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Input
                placeholder={t("common.search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 sm:min-w-[180px]"
              />
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="ALL">{t("expense.allCategories")}</SelectItem>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {t(`category.${c}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterPayment} onValueChange={setFilterPayment}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder={t("expense.filterPayment")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t("expense.allPayments")}</SelectItem>
                  {PAYMENT_METHODS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {t(`payment.${p}`)}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="px-0">
            {!filtered.length ? (
              <div className="px-6 py-10 text-center">
                <TrendingDown className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">{t("expense.empty")}</p>
                <p className="text-xs text-muted-foreground">
                  {t("expense.emptyHint")}
                </p>
              </div>
            ) : (
              <ul className="divide-y">
                {paginated.map((e, idx) => (
                  <motion.li
                    key={e.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="flex items-center gap-3 px-6 py-3 hover:bg-accent/30"
                  >
                    <div
                      className="w-10 h-10 grid place-items-center rounded-lg text-white shrink-0"
                      style={{ background: getCategoryColor(e.category) }}
                    >
                      <TrendingDown className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium truncate">
                          {e.merchant ?? t(`category.${e.category}`)}
                        </p>
                        <Badge variant="secondary" className="text-[10px]">
                          {t(`category.${e.category}`)}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {t(`payment.${e.paymentMethod}`)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {formatDate(e.date)}
                        {e.notes ? ` · ${e.notes}` : ""}
                      </p>
                    </div>
                    <p className="text-sm font-semibold tabular-nums text-destructive">
                      -<CurrencyValue value={e.amount} currency={currency} />
                    </p>
                    <div className="flex gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          setEditing(e);
                          setOpen(true);
                        }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(e.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </div>
                  </motion.li>
                ))}
              </ul>
            )}
            {filtered.length > PAGE_SIZE && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t">
                <p className="text-xs text-muted-foreground">
                  {t("common.paginationShowing", {
                    from: rangeStart,
                    to: rangeEnd,
                    total: filtered.length,
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

      <ExpenseFormDialog
        open={open}
        onOpenChange={setOpen}
        initial={editing}
        onSaved={refresh}
      />

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={onConfirmDelete}
        title={t("expense.confirmDeleteTitle") || t("common.confirmDelete")}
        description={t("expense.confirmDelete")}
        isLoading={isDeleting}
      />
    </div>
  );
}
