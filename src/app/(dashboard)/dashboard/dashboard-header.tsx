"use client";

import * as React from "react";
import { Plus, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { IncomeFormDialog } from "@/components/forms/income-form";
import { ExpenseFormDialog } from "@/components/forms/expense-form";
import { useBalanceVisibility } from "@/hooks/use-balance-visibility";

type Props = {
  incomeLabel: string;
  expenseLabel: string;
};

export function DashboardHeader({ incomeLabel, expenseLabel }: Props) {
  const [incomeOpen, setIncomeOpen] = React.useState(false);
  const [expenseOpen, setExpenseOpen] = React.useState(false);
  const { isVisible, toggleVisibility } = useBalanceVisibility();

  const handleSaved = () => {
    // Dashboard page is a server component — reload to show fresh data
    window.location.reload();
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => toggleVisibility()}
          className="px-2"
          title={isVisible ? "Hide balance" : "Show balance"}
        >
          {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setIncomeOpen(true)}
        >
          <Plus className="w-4 h-4" /> {incomeLabel}
        </Button>
        <Button 
          variant="premium" 
          size="sm"
          onClick={() => setExpenseOpen(true)}
        >
          <Plus className="w-4 h-4" /> {expenseLabel}
        </Button>
      </div>

      <IncomeFormDialog
        open={incomeOpen}
        onOpenChange={setIncomeOpen}
        onSaved={handleSaved}
      />
      <ExpenseFormDialog
        open={expenseOpen}
        onOpenChange={setExpenseOpen}
        onSaved={handleSaved}
      />
    </>
  );
}
