"use client";

import * as React from "react";
import { Download, FileText, Printer } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  buildDailySeries,
  buildMonthlySeries,
  categoryBreakdown,
  filterByInterval,
  periodInterval,
  sumAmount,
} from "@/lib/analytics";
import { formatCurrency, formatDate, prettyEnum } from "@/lib/utils";
import { IncomeExpenseArea } from "@/components/charts/area-chart";

type Income = {
  id: string;
  amount: number;
  source: string;
  category: string;
  date: string;
};
type Expense = {
  id: string;
  amount: number;
  category: string;
  paymentMethod: string;
  merchant?: string | null;
  notes?: string | null;
  date: string;
};

type Period = "day" | "week" | "month" | "year";

export function ReportsClient({
  incomes,
  expenses,
  currency,
  userName,
}: {
  incomes: Income[];
  expenses: Expense[];
  currency: string;
  userName: string;
}) {
  const [period, setPeriod] = React.useState<Period>("month");

  const incomesWithDate = incomes.map((i) => ({ ...i, date: new Date(i.date) }));
  const expensesWithDate = expenses.map((e) => ({ ...e, date: new Date(e.date) }));

  const range = periodInterval(period);
  const filteredInc = filterByInterval(incomesWithDate, range.start, range.end);
  const filteredExp = filterByInterval(expensesWithDate, range.start, range.end);

  const incomeTotal = sumAmount(filteredInc);
  const expenseTotal = sumAmount(filteredExp);
  const savings = incomeTotal - expenseTotal;
  const breakdown = categoryBreakdown(filteredExp as never);

  const series =
    period === "day"
      ? null
      : period === "week"
        ? {
            inc: buildDailySeries(incomesWithDate, 7),
            exp: buildDailySeries(expensesWithDate, 7),
          }
        : period === "month"
          ? {
              inc: buildDailySeries(incomesWithDate, 30),
              exp: buildDailySeries(expensesWithDate, 30),
            }
          : {
              inc: buildMonthlySeries(incomesWithDate, 12),
              exp: buildMonthlySeries(expensesWithDate, 12),
            };

  async function exportPdf() {
    const { jsPDF } = await import("jspdf");
    const autoTableModule = await import("jspdf-autotable");
    const autoTable = autoTableModule.default;
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.setTextColor(33, 33, 33);
    doc.text("OwnManage — Financial Report", 14, 18);

    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(
      `${userName} · ${prettyEnum(period)} report · Generated ${format(new Date(), "PP")}`,
      14,
      25,
    );

    doc.setFontSize(11);
    doc.setTextColor(40);
    doc.text(
      [
        `Total income: ${formatCurrency(incomeTotal, currency)}`,
        `Total expense: ${formatCurrency(expenseTotal, currency)}`,
        `Net savings: ${formatCurrency(savings, currency)}`,
      ],
      14,
      35,
    );

    autoTable(doc, {
      startY: 60,
      head: [["Date", "Source", "Category", "Amount"]],
      body: filteredInc.map((i) => [
        formatDate(i.date),
        i.source,
        i.category,
        formatCurrency(i.amount, currency),
      ]),
      headStyles: { fillColor: [16, 185, 129] },
      didDrawPage: (data) => {
        doc.setFontSize(12);
        doc.text("Income", 14, data.settings.startY ? data.settings.startY - 6 : 56);
      },
    });

    const next = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? 70;

    autoTable(doc, {
      startY: next + 14,
      head: [["Date", "Merchant", "Category", "Method", "Amount"]],
      body: filteredExp.map((e) => [
        formatDate(e.date),
        e.merchant ?? prettyEnum(e.category),
        prettyEnum(e.category),
        prettyEnum(e.paymentMethod),
        formatCurrency(e.amount, currency),
      ]),
      headStyles: { fillColor: [239, 68, 68] },
      didDrawPage: () => {
        doc.setFontSize(12);
        doc.text("Expenses", 14, next + 8);
      },
    });

    doc.save(`ownmanage-${period}-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    toast.success("Report exported.");
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide font-medium">
            <FileText className="w-4 h-4 text-primary" /> Reports
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-1">
            Financial Reports
          </h1>
          <p className="text-sm text-muted-foreground">
            Download daily, weekly, monthly, or yearly financial summaries.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="w-4 h-4" /> Print
          </Button>
          <Button variant="premium" onClick={exportPdf}>
            <Download className="w-4 h-4" /> Export PDF
          </Button>
        </div>
      </header>

      <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
        <TabsList>
          <TabsTrigger value="day">Daily</TabsTrigger>
          <TabsTrigger value="week">Weekly</TabsTrigger>
          <TabsTrigger value="month">Monthly</TabsTrigger>
          <TabsTrigger value="year">Yearly</TabsTrigger>
        </TabsList>
      </Tabs>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCell label="Income" value={formatCurrency(incomeTotal, currency)} tone="success" />
        <SummaryCell label="Expense" value={formatCurrency(expenseTotal, currency)} tone="destructive" />
        <SummaryCell
          label="Savings"
          value={formatCurrency(savings, currency)}
          tone={savings >= 0 ? "success" : "warning"}
        />
        <SummaryCell label="Transactions" value={String(filteredExp.length + filteredInc.length)} />
      </section>

      {series && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <IncomeExpenseArea income={series.inc} expense={series.exp} />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Top categories</CardTitle>
          </CardHeader>
          <CardContent>
            {!breakdown.length ? (
              <p className="text-sm text-muted-foreground">No expenses in this period.</p>
            ) : (
              <ul className="space-y-2">
                {breakdown.slice(0, 6).map((b) => (
                  <li key={b.category} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{prettyEnum(b.category)}</span>
                    <span className="font-semibold tabular-nums">
                      {formatCurrency(b.total, currency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Transactions</CardTitle>
          </CardHeader>
          <CardContent className="max-h-72 overflow-y-auto pr-1 space-y-2">
            {[...filteredInc.map((i) => ({ ...i, type: "INCOME" as const })), ...filteredExp.map((e) => ({ ...e, type: "EXPENSE" as const }))]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 50)
              .map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {t.type === "INCOME"
                        ? t.source
                        : (t.merchant ?? prettyEnum(t.category))}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(t.date)}</p>
                  </div>
                  <Badge variant={t.type === "INCOME" ? "success" : "destructive"}>
                    {t.type === "INCOME" ? "+" : "-"}
                    {formatCurrency(t.amount, currency)}
                  </Badge>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryCell({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "success" | "destructive" | "warning";
}) {
  const toneClass =
    tone === "success"
      ? "text-success"
      : tone === "destructive"
        ? "text-destructive"
        : tone === "warning"
          ? "text-warning"
          : "text-foreground";
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
          {label}
        </p>
        <p className={`text-xl font-bold mt-1 ${toneClass}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
