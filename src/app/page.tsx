import Link from "next/link";
import { ArrowRight, BarChart3, Brain, LineChart, PiggyBank, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { ThemeToggleButton } from "@/components/layout/theme-toggle-button";
import { getServerT } from "@/lib/i18n/server";

export default function Home() {
  const { t } = getServerT();

  const features = [
    {
      icon: Wallet,
      title: t("landing.feature.track.title"),
      desc: t("landing.feature.track.desc"),
    },
    {
      icon: BarChart3,
      title: t("landing.feature.analytics.title"),
      desc: t("landing.feature.analytics.desc"),
    },
    {
      icon: Brain,
      title: t("landing.feature.ai.title"),
      desc: t("landing.feature.ai.desc"),
    },
    {
      icon: PiggyBank,
      title: t("landing.feature.savings.title"),
      desc: t("landing.feature.savings.desc"),
    },
    {
      icon: ShieldCheck,
      title: t("landing.feature.privacy.title"),
      desc: t("landing.feature.privacy.desc"),
    },
  ];

  return (
    <main className="min-h-svh">
      <nav className="container flex items-center justify-between py-5">
        <Link href="/" className="flex items-center gap-2">
          <div className="grid place-items-center w-9 h-9 rounded-xl bg-premium-gradient text-white shadow-lg">
            <Wallet className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight">
            {t("common.appName")}
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggleButton />
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">{t("common.signIn")}</Link>
          </Button>
          <Button asChild size="sm" variant="premium">
            <Link href="/register">
              {t("common.getStarted")}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </nav>

      <section className="container pt-12 pb-20 md:pt-24 md:pb-32 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border bg-card/60 backdrop-blur px-3 py-1 mb-6 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          {t("landing.heroPre")}
        </div>
        <h1 className="text-4xl md:text-7xl font-bold tracking-tight">
          {t("landing.heroTitle1")}
          <br />
          <span className="premium-text">{t("landing.heroTitle2")}</span>
        </h1>
        <p className="mt-6 text-base md:text-xl text-muted-foreground max-w-2xl mx-auto">
          {t("landing.heroSubtitle")}
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg" variant="premium">
            <Link href="/register">
              {t("landing.ctaCreate")}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/login">{t("common.signIn")}</Link>
          </Button>
        </div>
        <div className="mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><LineChart className="w-4 h-4" /> {t("landing.chips.realtime")}</span>
          <span className="flex items-center gap-1.5"><Brain className="w-4 h-4" /> {t("landing.chips.ai")}</span>
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" /> {t("landing.chips.secure")}</span>
        </div>
      </section>

      <section className="container pb-24">
        <div className="grid md:grid-cols-3 gap-5">
          {features.map((f) => (
            <Card key={f.title} className="glass-card hover:-translate-y-1 transition-transform">
              <CardContent className="p-6">
                <div className="w-10 h-10 grid place-items-center rounded-lg bg-premium-gradient text-white mb-4">
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-lg">{f.title}</h3>
                <p className="text-sm text-muted-foreground mt-1.5">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t">
        <div className="container py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} {t("common.appName")}. {t("landing.footer")}</p>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-foreground">{t("common.signIn")}</Link>
            <Link href="/register" className="hover:text-foreground">{t("common.signUp")}</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
