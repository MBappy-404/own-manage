"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import * as React from "react";
import { PWARegister } from "@/components/pwa-register";
import { I18nProvider } from "@/lib/i18n/provider";
import type { Locale } from "@/lib/i18n/translations";

export function Providers({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <I18nProvider initialLocale={initialLocale}>
          {children}
          <Toaster
            richColors
            position="top-center"
            toastOptions={{
              className: "rounded-xl",
            }}
          />
          <PWARegister />
        </I18nProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
