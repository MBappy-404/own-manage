"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { IncomeFormDialog } from "@/components/forms/income-form";
import { formatCurrency, formatDate, prettyEnum } from "@/lib/utils";
import {
  sumAmount,
  buildMonthlySeries,
  highestIncomeDay,
  bestEarningMonth,
  periodInterval,
  filterByInterval,
} from "@/lib/analytics";
import { smartFetch } from "@/lib/sync";
import { IncomeExpenseArea } from "@/components/charts/area-chart";
import { StatCard } from "@/components/dashboard/stat-card";
import { useI18n } from "@/lib/i18n/provider";

type IncomeItem = {
  id: string;
  amount: number;
  source: string;
  category: string;
  frequency: string;
  date: string;
  notes?: string | null;
};

export function IncomeClient({
  initial,
  currency,
}: {
  initial: IncomeItem[];
  currency: string;
}) {
  const { t } = useI18n();
  const [items, setItems] = React.useState<IncomeItem[]>(initial);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<IncomeItem | null>(null);
  const [search, setSearch] = React.useState("");

  async function refresh() {
    const res = await smartFetch("/api/income", { method: "GET" });
    const data = await res.json();
    setItems(data.incomes);
  }

  async function handleDelete(id: string) {
    if (!confirm(t("income.confirmDelete"))) return;
    const res = await smartFetch(`/api/income/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Could not delete");
      return;
    }
    toast.success(t("income.deleted"));
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  const incomesWithDate = React.useMemo(
    () => items.map((i) => ({ ...i, date: new Date(i.date) })),
    [items],
  );

  const total = sumAmount(incomesWithDate);
  const month = periodInterval("month");
  const week = periodInterval("week");
  const day = periodInterval("day");
  const monthTotal = sumAmount(filterByInterval(incomesWithDate, month.start, month.end));
  const weekTotal = sumAmount(filterByInterval(incomesWithDate, week.start, week.end));
  const dayTotal = sumAmount(filterByInterval(incomesWithDate, day.start, day.end));
  const monthlySeries = buildMonthlySeries(incomesWithDate, 8);
  const emptySeries = monthlySeries.map((m) => ({ label: m.label, total: 0 }));
  const peak = highestIncomeDay(incomesWithDate);
  const best = bestEarningMonth(incomesWithDate);

  const filtered = items.filter((i) =>
    !search ? true : `${i.source} ${i.category}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {t("income.title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("income.subtitle")}</p>
        </div>
        <Button
          variant="premium"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="w-4 h-4" /> {t("income.add")}
        </Button>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard label={t("income.total")} value={total} currency={currency} icon="TrendingUp" variant="primary" delay={0} />
        <StatCard label={t("common.thisMonth")} value={monthTotal} currency={currency} icon="TrendingUp" variant="success" delay={0.05} />
        <StatCard label={t("common.thisWeek")} value={weekTotal} currency={currency} icon="TrendingUp" variant="success" delay={0.1} />
        <StatCard label={t("income.today")} value={dayTotal} currency={currency} icon="TrendingUp" variant="success" delay={0.15} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle>{t("income.trend")}</CardTitle>
            <p className="text-xs text-muted-foreground">{t("dashboard.lastMonths", { n: 8 })}</p>
          </CardHeader>
          <CardContent>
            <IncomeExpenseArea income={monthlySeries} expense={emptySeries} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>{t("income.highlights")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                {t("income.bestMonth")}
              </p>
              <p className="font-semibold">
                {best ? `${formatCurrency(best.total, currency)} (${best.month})` : "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                {t("income.peakDay")}
              </p>
              <p className="font-semibold">
                {peak ? `${formatCurrency(peak.total, currency)} · ${peak.date}` : "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                {t("income.entries")}
              </p>
              <p className="font-semibold">{items.length}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle>{t("income.all")}</CardTitle>
            <Input
              placeholder={t("income.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sm:max-w-xs"
            />
          </CardHeader>
          <CardContent className="px-0">
            {!filtered.length ? (
              <div className="px-6 py-10 text-center">
                <TrendingUp className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">{t("income.empty")}</p>
                <p className="text-xs text-muted-foreground">
                  {t("income.emptyHint")}
                </p>
              </div>
            ) : (
              <ul className="divide-y">
                {filtered.map((i, idx) => (
                  <motion.li
                    key={i.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="flex items-center gap-3 px-6 py-3 hover:bg-accent/30"
                  >
                    <div className="w-10 h-10 grid place-items-center rounded-lg bg-success/15 text-success shrink-0">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium truncate">{i.source}</p>
                        <Badge variant="secondary" className="text-[10px]">
                          {i.category}
                        </Badge>
                        {i.frequency !== "ONE_TIME" && (
                          <Badge variant="outline" className="text-[10px]">
                            {prettyEnum(i.frequency)}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(i.date)}{i.notes ? ` · ${i.notes}` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums text-success">
                        +{formatCurrency(i.amount, currency)}
                      </p>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          setEditing(i);
                          setOpen(true);
                        }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(i.id)}
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

      <IncomeFormDialog
        open={open}
        onOpenChange={setOpen}
        initial={editing}
        onSaved={refresh}
      />
    </div>
  );
}
