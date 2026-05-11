"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Moon, Sparkles, Sun, Monitor } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { profileSchema, type ProfileInput } from "@/lib/validations";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { LOCALE_LABELS, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n/translations";

const CURRENCIES = ["USD", "EUR", "GBP", "INR", "BDT", "JPY", "CNY", "AUD", "CAD", "PKR"];

export function SettingsClient({
  initial,
}: {
  initial: { name: string; email: string; currency: string; monthlyBudget: number | null };
}) {
  const { theme, setTheme } = useTheme();
  const { t, locale, setLocale } = useI18n();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema) as unknown as Resolver<ProfileInput>,
    defaultValues: {
      name: initial.name,
      currency: initial.currency,
      monthlyBudget: initial.monthlyBudget ?? undefined,
    },
  });

  async function onSubmit(values: ProfileInput) {
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) return toast.error(t("settings.updateFailed"));
    toast.success(t("settings.updated"));
  }

  const currency = watch("currency");

  const themeOptions: { value: string; labelKey: string; icon: typeof Sun }[] = [
    { value: "light", labelKey: "common.light", icon: Sun },
    { value: "dark", labelKey: "common.dark", icon: Moon },
    { value: "system", labelKey: "common.system", icon: Monitor },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          {t("settings.title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("settings.subtitle")}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.profile")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">{t("common.fullName")}</Label>
                <Input id="name" {...register("name")} />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">{t("common.email")}</Label>
                <Input id="email" value={initial.email} disabled />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{t("settings.currency")}</Label>
                  <Select
                    value={currency}
                    onValueChange={(v) => setValue("currency", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="monthlyBudget">
                    {t("settings.monthlyBudget")}
                  </Label>
                  <Input
                    id="monthlyBudget"
                    type="number"
                    step="0.01"
                    placeholder={t("common.optional")}
                    {...register("monthlyBudget")}
                  />
                </div>
              </div>
              <Button type="submit" variant="premium" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {t("common.saveChanges")}
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.appearance")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label className="mb-2 block">{t("common.theme")}</Label>
              <div className="grid grid-cols-3 gap-3">
                {themeOptions.map((opt) => (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => setTheme(opt.value)}
                    className={cn(
                      "rounded-xl border p-4 flex flex-col items-center gap-2 transition-colors",
                      theme === opt.value
                        ? "border-primary bg-primary/5 ring-2 ring-primary/40"
                        : "hover:bg-accent/30",
                    )}
                  >
                    <opt.icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{t(opt.labelKey)}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-2 block">{t("common.language")}</Label>
              <div className="grid grid-cols-2 gap-3">
                {SUPPORTED_LOCALES.map((l) => (
                  <button
                    type="button"
                    key={l}
                    onClick={() => setLocale(l as Locale)}
                    className={cn(
                      "rounded-xl border p-4 flex flex-col items-center gap-1 transition-colors",
                      locale === l
                        ? "border-primary bg-primary/5 ring-2 ring-primary/40"
                        : "hover:bg-accent/30",
                    )}
                  >
                    <span className="text-base font-semibold">
                      {LOCALE_LABELS[l]}
                    </span>
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      {l}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border bg-card-radial p-4 flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-primary mt-1 shrink-0" />
              <div className="text-xs text-muted-foreground">
                {t("settings.tip")}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
