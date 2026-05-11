import { RegisterForm } from "@/components/forms/register-form";
import { AuthHeading, AuthBottomLink } from "@/components/forms/auth-heading";

export const metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <div>
      <AuthHeading
        titleKey="auth.createAccountTitle"
        subtitleKey="auth.createAccountSubtitle"
      />
      <RegisterForm />
      <AuthBottomLink
        textKey="auth.alreadyHaveAccount"
        linkKey="common.signIn"
        href="/login"
      />
    </div>
  );
}
