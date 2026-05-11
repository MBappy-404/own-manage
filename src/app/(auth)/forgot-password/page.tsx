import { ForgotPasswordForm } from "@/components/forms/forgot-password-form";
import { AuthHeading, AuthBottomLink } from "@/components/forms/auth-heading";

export const metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <div>
      <AuthHeading titleKey="auth.forgotTitle" subtitleKey="auth.forgotSubtitle" />
      <ForgotPasswordForm />
      <AuthBottomLink textKey="" linkKey="auth.backToSignin" href="/login" />
    </div>
  );
}
