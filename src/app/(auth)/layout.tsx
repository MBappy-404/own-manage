import Link from "next/link";
import { Wallet } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-svh grid lg:grid-cols-2">
      <div className="hidden lg:flex relative bg-premium-gradient text-primary-foreground p-12 flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.2),transparent_50%)]" />
        <Link href="/" className="relative flex items-center gap-2">
          <div className="grid place-items-center w-10 h-10 rounded-xl bg-white/20 backdrop-blur">
            <Wallet className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl">OwnManage</span>
        </Link>
        <div className="relative">
          <h2 className="text-4xl xl:text-5xl font-bold leading-tight">
            Your finances,
            <br />
            beautifully organized.
          </h2>
          <p className="mt-4 text-white/80 max-w-md">
            Track income, expenses, and savings with AI-powered insights. Hit
            your goals with confidence.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4 max-w-md">
            {[
              { label: "Categories", value: "10+" },
              { label: "Insights", value: "AI" },
              { label: "Charts", value: "Live" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl bg-white/10 backdrop-blur p-3"
              >
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-xs text-white/70">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-white/70">
          © {new Date().getFullYear()} OwnManage. Premium fintech for everyone.
        </p>
      </div>
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="lg:hidden flex items-center gap-2 mb-8 justify-center"
          >
            <div className="grid place-items-center w-10 h-10 rounded-xl bg-premium-gradient text-white shadow-lg">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight">OwnManage</span>
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
