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
import { CurrencyValue } from "@/components/ui/currency-value";
import { IncomeExpenseArea } from "@/components/charts/area-chart";
import { useI18n } from "@/lib/i18n/provider";

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
  const { t, locale } = useI18n();
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
      `${userName} · ${period} report · Generated ${format(new Date(), "PP")}`,
      14,
      25,
    );

    doc.setFontSize(11);
    doc.setTextColor(40);
    doc.text(
      [
        `Total income: ${formatCurrency(incomeTotal, currency, locale)}`,
        `Total expense: ${formatCurrency(expenseTotal, currency, locale)}`,
        `Net savings: ${formatCurrency(savings, currency, locale)}`,
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
        formatCurrency(i.amount, currency, locale),
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
        formatCurrency(e.amount, currency, locale),
      ]),
      headStyles: { fillColor: [239, 68, 68] },
      didDrawPage: () => {
        doc.setFontSize(12);
        doc.text("Expenses", 14, next + 8);
      },
    });

    doc.save(`ownmanage-${period}-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    toast.success(t("reports.exported"));
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide font-medium">
            <FileText className="w-4 h-4 text-primary" /> {t("nav.reports")}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-1">
            {t("reports.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("reports.subtitle")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="w-4 h-4" /> {t("reports.print")}
          </Button>
          <Button variant="premium" onClick={exportPdf}>
            <Download className="w-4 h-4" /> {t("reports.exportPdf")}
          </Button>
        </div>
      </header>

      <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
        <TabsList>
          <TabsTrigger value="day">{t("reports.daily")}</TabsTrigger>
          <TabsTrigger value="week">{t("common.thisWeek")}</TabsTrigger>
          <TabsTrigger value="month">{t("common.thisMonth")}</TabsTrigger>
          <TabsTrigger value="year">{t("common.thisYear")}</TabsTrigger>
        </TabsList>
      </Tabs>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCell label={t("reports.income")} value={<CurrencyValue value={incomeTotal} currency={currency} />} tone="success" />
        <SummaryCell label={t("reports.expense")} value={<CurrencyValue value={expenseTotal} currency={currency} />} tone="destructive" />
        <SummaryCell
          label={t("reports.savings")}
          value={<CurrencyValue value={savings} currency={currency} />}
          tone={savings >= 0 ? "success" : "warning"}
        />
        <SummaryCell label={t("reports.transactionsCount")} value={String(filteredExp.length + filteredInc.length)} />
      </section>

      {series && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>{t("reports.flow")}</CardTitle>
          </CardHeader>
          <CardContent>
            <IncomeExpenseArea income={series.inc} expense={series.exp} />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{t("reports.topCategories")}</CardTitle>
          </CardHeader>
          <CardContent>
            {!breakdown.length ? (
              <p className="text-sm text-muted-foreground">{t("reports.noExpenses")}</p>
            ) : (
              <ul className="space-y-2">
                {breakdown.slice(0, 6).map((b) => (
                  <li key={b.category} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t(`category.${b.category}`)}</span>
                    <span className="font-semibold tabular-nums">
                      <CurrencyValue value={b.total} currency={currency} />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{t("reports.transactions")}</CardTitle>
          </CardHeader>
          <CardContent className="max-h-72 overflow-y-auto pr-1 space-y-2">
            {[...filteredInc.map((i) => ({ ...i, type: "INCOME" as const })), ...filteredExp.map((e) => ({ ...e, type: "EXPENSE" as const }))]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 50)
              .map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {tx.type === "INCOME"
                        ? tx.source
                        : (tx.merchant ?? t(`category.${tx.category}`))}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(tx.date)}</p>
                  </div>
                  <Badge variant={tx.type === "INCOME" ? "success" : "destructive"}>
                    {tx.type === "INCOME" ? "+" : "-"}
                    <CurrencyValue value={tx.amount} currency={currency} />
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
  value: React.ReactNode;
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
        <div className={`text-xl font-bold mt-1 ${toneClass}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
