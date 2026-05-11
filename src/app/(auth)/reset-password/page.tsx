import Link from "next/link";
import { ResetPasswordForm } from "@/components/forms/reset-password-form";
import { AuthHeading, AuthBottomLink } from "@/components/forms/auth-heading";

export const metadata = { title: "Set new password" };

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token ?? "";
  return (
    <div>
      <AuthHeading titleKey="auth.resetTitle" subtitleKey="auth.resetSubtitle" />
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <p className="text-sm text-destructive">
          Missing reset token. Request a new link from{" "}
          <Link href="/forgot-password" className="underline">
            forgot password
          </Link>
          .
        </p>
      )}
      <AuthBottomLink textKey="" linkKey="auth.backToSignin" href="/login" />
    </div>
  );
}
