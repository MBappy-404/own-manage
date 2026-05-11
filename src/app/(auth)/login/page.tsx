import { Suspense } from "react";
import { LoginForm } from "@/components/forms/login-form";
import { AuthHeading, AuthBottomLink } from "@/components/forms/auth-heading";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div>
      <AuthHeading titleKey="auth.welcomeBack" subtitleKey="auth.welcomeBackSubtitle" />
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-muted/40" />}>
        <LoginForm />
      </Suspense>
      <AuthBottomLink
        textKey="auth.dontHaveAccount"
        linkKey="common.createAccount"
        href="/register"
      />
    </div>
  );
}
