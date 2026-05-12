"use client";

import * as React from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { forgotPasswordSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n/provider";

type Values = { email: string };

export function ForgotPasswordForm() {
  const { t } = useI18n();
  const [resetUrl, setResetUrl] = React.useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(forgotPasswordSchema) as unknown as Resolver<Values>,
    defaultValues: { email: "" },
  });

  async function onSubmit(values: Values) {
    const res = await fetch("/api/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.error ?? t("settings.updateFailed"));
      return;
    }
    if (data.resetUrl) {
      setResetUrl(data.resetUrl);
      toast.success(t("reports.exported"));
    } else {
      toast.success(t("reports.exported"));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">{t("common.email")}</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>
      <Button
        type="submit"
        variant="premium"
        className="w-full"
        size="lg"
        disabled={isSubmitting}
      >
        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {t("auth.sendResetLink")}
      </Button>
      {resetUrl && (
        <div className="rounded-lg border bg-muted/40 p-3 text-xs space-y-2">
          <p className="font-medium">Demo reset link:</p>
          <a
            href={resetUrl}
            className="text-primary break-all hover:underline"
          >
            {resetUrl}
          </a>
          <p className="text-muted-foreground">
            In production, wire up an email provider (Resend / SendGrid) and
            this link will be emailed instead.
          </p>
        </div>
      )}
    </form>
  );
}
