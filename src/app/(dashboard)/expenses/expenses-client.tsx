"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Pencil, Plus, Trash2, TrendingDown } from "lucide-react";
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
import { EXPENSE_CATEGORIES, formatCurrency, formatDate, getCategoryColor, prettyEnum } from "@/lib/utils";
import {
  buildDailySeries,
  categoryBreakdown,
  filterByInterval,
  highestSpendingDay,
  lowestSpendingDay,
  periodInterval,
  spendingByDayOfWeek,
  sumAmount,
} from "@/lib/analytics";

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
  const [items, setItems] = React.useState<Expense[]>(initial);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Expense | null>(null);
  const [search, setSearch] = React.useState("");
  const [filterCategory, setFilterCategory] = React.useState<string>("ALL");

  async function refresh() {
    const res = await fetch("/api/expense");
    const data = await res.json();
    setItems(data.expenses);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this expense?")) return;
    const res = await fetch(`/api/expense/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Could not delete");
      return;
    }
    toast.success("Deleted");
    setItems((prev) => prev.filter((i) => i.id !== id));
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
  const monthExp = filterByInterval(withDate, month.start, month.end);
  const weekExp = filterByInterval(withDate, week.start, week.end);
  const dayExp = filterByInterval(withDate, day.start, day.end);
  const breakdown = categoryBreakdown(withDate as unknown as never);
  const heatmap = buildDailySeries(withDate, 90);
  const dayOfWeek = spendingByDayOfWeek(withDate as unknown as never);
  const peak = highestSpendingDay(withDate as unknown as never);
  const low = lowestSpendingDay(withDate as unknown as never);

  const filtered = items.filter((i) => {
    const matchesCategory = filterCategory === "ALL" || i.category === filterCategory;
    const text = `${i.merchant ?? ""} ${i.notes ?? ""} ${i.category}`.toLowerCase();
    const matchesSearch = !search || text.includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-sm text-muted-foreground">
            Categorize every dollar to see where your money really goes.
          </p>
        </div>
        <Button
          variant="premium"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="w-4 h-4" /> Add expense
        </Button>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard label="Total expense" value={total} currency={currency} icon={TrendingDown} variant="destructive" delay={0} />
        <StatCard label="This month" value={sumAmount(monthExp)} currency={currency} icon={TrendingDown} variant="warning" delay={0.05} />
        <StatCard label="This week" value={sumAmount(weekExp)} currency={currency} icon={TrendingDown} variant="warning" delay={0.1} />
        <StatCard label="Today" value={sumAmount(dayExp)} currency={currency} icon={TrendingDown} variant="warning" delay={0.15} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>By Category</CardTitle>
            <p className="text-xs text-muted-foreground">All-time breakdown</p>
          </CardHeader>
          <CardContent>
            <CategoryPie data={breakdown} currency={currency} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Spending by Day</CardTitle>
            <p className="text-xs text-muted-foreground">All-time</p>
          </CardHeader>
          <CardContent>
            <SimpleBar data={dayOfWeek} dataKey="total" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Spend heatmap</CardTitle>
            <p className="text-xs text-muted-foreground">Last 90 days</p>
          </CardHeader>
          <CardContent>
            <ExpenseHeatmap data={heatmap} currency={currency} />
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">Highest</p>
                <p className="font-semibold">
                  {peak ? formatCurrency(peak.total, currency) : "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Lowest</p>
                <p className="font-semibold">
                  {low ? formatCurrency(low.total, currency) : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle>All expenses</CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              <Input
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 sm:max-w-xs"
              />
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All categories</SelectItem>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {prettyEnum(c)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="px-0">
            {!filtered.length ? (
              <div className="px-6 py-10 text-center">
                <TrendingDown className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">No expenses match</p>
                <p className="text-xs text-muted-foreground">
                  Try changing your filters or add a new expense.
                </p>
              </div>
            ) : (
              <ul className="divide-y">
                {filtered.map((e, idx) => (
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
                          {e.merchant ?? prettyEnum(e.category)}
                        </p>
                        <Badge variant="secondary" className="text-[10px]">
                          {prettyEnum(e.category)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(e.date)} · {prettyEnum(e.paymentMethod)}
                        {e.notes ? ` · ${e.notes}` : ""}
                      </p>
                    </div>
                    <p className="text-sm font-semibold tabular-nums text-destructive">
                      -{formatCurrency(e.amount, currency)}
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
          </CardContent>
        </Card>
      </section>

      <ExpenseFormDialog
        open={open}
        onOpenChange={setOpen}
        initial={editing}
        onSaved={refresh}
      />
    </div>
  );
}
