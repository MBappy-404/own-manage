"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { registerSchema, type RegisterInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleIcon } from "@/components/icons/google-icon";
import { useI18n } from "@/lib/i18n/provider";

export function RegisterForm() {
  const router = useRouter();
  const { t } = useI18n();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema) as unknown as Resolver<RegisterInput>,
    defaultValues: { name: "", email: "", password: "" },
  });

  async function onSubmit(values: RegisterInput) {
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Failed to register");
      return;
    }
    const signed = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });
    if (signed?.error) {
      toast.error("Account created — please sign in.");
      router.push("/login");
      return;
    }
    toast.success(`Welcome, ${values.name.split(" ")[0]}!`);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">{t("common.fullName")}</Label>
        <Input
          id="name"
          placeholder="Jane Doe"
          autoComplete="name"
          {...register("name")}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>
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
      <div className="space-y-1.5">
        <Label htmlFor="password">{t("common.password")}</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
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
        {t("common.createAccount")}
      </Button>
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">{t("auth.or")}</span>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        size="lg"
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
      >
        <GoogleIcon className="w-4 h-4" />
        {t("auth.signupWithGoogle")}
      </Button>
      <p className="text-xs text-muted-foreground text-center mt-4">
        {t("auth.terms")}
      </p>
    </form>
  );
}
