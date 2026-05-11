"use client";

import * as React from "react";
import Link from "next/link";

import { useI18n } from "@/lib/i18n/provider";
import { LanguageToggle } from "@/components/layout/language-toggle";

type Props = {
  titleKey: string;
  subtitleKey: string;
};

export function AuthHeading({ titleKey, subtitleKey }: Props) {
  const { t } = useI18n();
  return (
    <div className="mb-6">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t(titleKey)}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t(subtitleKey)}</p>
        </div>
        <LanguageToggle />
      </div>
    </div>
  );
}

export function AuthBottomLink({
  textKey,
  linkKey,
  href,
}: {
  textKey: string;
  linkKey: string;
  href: string;
}) {
  const { t } = useI18n();
  return (
    <p className="text-sm text-muted-foreground mt-6 text-center">
      {t(textKey)}{" "}
      <Link href={href} className="text-primary font-medium hover:underline">
        {t(linkKey)}
      </Link>
    </p>
  );
}
