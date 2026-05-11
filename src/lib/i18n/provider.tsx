"use client";

import * as React from "react";
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  translate,
  type Locale,
} from "./translations";

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const LocaleContext = React.createContext<Ctx | null>(null);

export const LOCALE_STORAGE_KEY = "ownmanage.locale";
export const LOCALE_COOKIE = "ownmanage_locale";

function writeCookie(value: string) {
  try {
    const oneYear = 60 * 60 * 24 * 365;
    document.cookie = `${LOCALE_COOKIE}=${value}; path=/; max-age=${oneYear}; samesite=lax`;
  } catch {}
}

function readClientLocale(initial: Locale | undefined): Locale {
  if (typeof window === "undefined") return initial ?? DEFAULT_LOCALE;
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
    if (stored && SUPPORTED_LOCALES.includes(stored)) return stored;
    if (initial && SUPPORTED_LOCALES.includes(initial)) return initial;
    const nav = window.navigator.language?.slice(0, 2);
    if (nav === "bn") return "bn";
  } catch {}
  return initial ?? DEFAULT_LOCALE;
}

export function I18nProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = React.useState<Locale>(
    initialLocale ?? DEFAULT_LOCALE,
  );

  React.useEffect(() => {
    const l = readClientLocale(initialLocale);
    setLocaleState(l);
    document.documentElement.lang = l;
    writeCookie(l);
  }, [initialLocale]);

  const setLocale = React.useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, l);
    } catch {}
    writeCookie(l);
    document.documentElement.lang = l;
  }, []);

  const t = React.useCallback(
    (key: string, params?: Record<string, string | number>) =>
      translate(locale, key, params),
    [locale],
  );

  const value = React.useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useI18n() {
  const ctx = React.useContext(LocaleContext);
  if (!ctx) {
    return {
      locale: DEFAULT_LOCALE,
      setLocale: () => {},
      t: (key: string, params?: Record<string, string | number>) =>
        translate(DEFAULT_LOCALE, key, params),
    };
  }
  return ctx;
}
