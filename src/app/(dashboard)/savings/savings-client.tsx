"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Pencil, PiggyBank, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { savingsGoalSchema, type SavingsGoalInput } from "@/lib/validations";
import { formatCurrency, formatDate } from "@/lib/utils";

type Goal = {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
  description: string | null;
};

export function SavingsClient({
  initial,
  currency,
}: {
  initial: Goal[];
  currency: string;
}) {
  const [items, setItems] = React.useState<Goal[]>(initial);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Goal | null>(null);

  async function refresh() {
    const res = await fetch("/api/savings-goals");
    const data = await res.json();
    setItems(data.goals);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this goal?")) return;
    const res = await fetch(`/api/savings-goals/${id}`, { method: "DELETE" });
    if (!res.ok) return toast.error("Could not delete");
    toast.success("Deleted");
    setItems((prev) => prev.filter((g) => g.id !== id));
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Savings Goals
          </h1>
          <p className="text-sm text-muted-foreground">
            Define what you&apos;re saving for and track progress visually.
          </p>
        </div>
        <Button
          variant="premium"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="w-4 h-4" /> New goal
        </Button>
      </header>

      {!items.length ? (
        <Card>
          <CardContent className="p-8 text-center">
            <PiggyBank className="w-10 h-10 mx-auto text-primary mb-3" />
            <p className="font-semibold">No goals yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Start with something small — emergency fund, vacation, new gear.
            </p>
            <Button
              variant="premium"
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              <Plus className="w-4 h-4" /> Create your first goal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((g, idx) => {
            const pct = Math.min(100, (g.currentAmount / g.targetAmount) * 100);
            return (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold truncate">{g.title}</h3>
                        {g.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {g.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setEditing(g);
                            setOpen(true);
                          }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(g.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-baseline justify-between mb-1.5">
                        <span className="text-2xl font-bold tabular-nums">
                          {formatCurrency(g.currentAmount, currency)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          / {formatCurrency(g.targetAmount, currency)}
                        </span>
                      </div>
                      <Progress value={pct} />
                      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                        <span>{Math.round(pct)}% reached</span>
                        {g.deadline && (
                          <span>by {formatDate(g.deadline)}</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <GoalDialog
        open={open}
        onOpenChange={setOpen}
        initial={editing}
        onSaved={refresh}
      />
    </div>
  );
}

function GoalDialog({
  open,
  onOpenChange,
  initial,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: Goal | null;
  onSaved: () => void;
}) {
  const editing = !!initial;
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SavingsGoalInput>({
    resolver: zodResolver(savingsGoalSchema) as unknown as Resolver<SavingsGoalInput>,
    defaultValues: {
      title: "",
      targetAmount: 0,
      currentAmount: 0,
      deadline: null,
      description: "",
    },
  });

  React.useEffect(() => {
    if (initial) {
      reset({
        title: initial.title,
        targetAmount: initial.targetAmount,
        currentAmount: initial.currentAmount,
        deadline: initial.deadline ? new Date(initial.deadline) : null,
        description: initial.description ?? "",
      });
    } else if (open) {
      reset({
        title: "",
        targetAmount: 0,
        currentAmount: 0,
        deadline: null,
        description: "",
      });
    }
  }, [initial, open, reset]);

  const deadline = watch("deadline");

  async function onSubmit(values: SavingsGoalInput) {
    const url = editing
      ? `/api/savings-goals/${initial!.id}`
      : "/api/savings-goals";
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) return toast.error("Could not save");
    toast.success(editing ? "Goal updated" : "Goal created");
    onOpenChange(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit goal" : "New savings goal"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder="Emergency fund" {...register("title")} />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="targetAmount">Target</Label>
              <Input
                id="targetAmount"
                type="number"
                step="0.01"
                {...register("targetAmount")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currentAmount">Saved</Label>
              <Input
                id="currentAmount"
                type="number"
                step="0.01"
                {...register("currentAmount")}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="deadline">Deadline (optional)</Label>
            <Input
              id="deadline"
              type="date"
              value={deadline ? format(new Date(deadline), "yyyy-MM-dd") : ""}
              onChange={(e) =>
                setValue("deadline", e.target.value ? new Date(e.target.value) : null)
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={2}
              placeholder="Why this goal matters"
              {...register("description")}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="premium" disabled={isSubmitting}>
              {editing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
