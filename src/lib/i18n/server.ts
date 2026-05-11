import { cookies } from "next/headers";
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  translate,
  type Locale,
} from "./translations";

export const LOCALE_COOKIE = "ownmanage_locale";

export function getServerLocale(): Locale {
  try {
    const c = cookies().get(LOCALE_COOKIE)?.value;
    if (c && (SUPPORTED_LOCALES as readonly string[]).includes(c)) {
      return c as Locale;
    }
  } catch {}
  return DEFAULT_LOCALE;
}

export function getServerT() {
  const locale = getServerLocale();
  const t = (key: string, params?: Record<string, string | number>) =>
    translate(locale, key, params);
  return { locale, t };
}
