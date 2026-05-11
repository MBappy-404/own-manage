"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { IncomeFormDialog } from "@/components/forms/income-form";
import { ExpenseFormDialog } from "@/components/forms/expense-form";

type Props = {
  incomeLabel: string;
  expenseLabel: string;
};

export function DashboardHeader({ incomeLabel, expenseLabel }: Props) {
  const [incomeOpen, setIncomeOpen] = React.useState(false);
  const [expenseOpen, setExpenseOpen] = React.useState(false);
  const router = useRouter();

  const handleSaved = () => {
    router.refresh();
  };

  return (
    <>
      <div className="flex gap-2">
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
