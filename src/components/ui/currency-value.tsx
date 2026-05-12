"use client";

import * as React from "react";
import { formatCurrency, cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { useBalanceVisibility } from "@/hooks/use-balance-visibility";

interface CurrencyValueProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: number;
  currency: string;
  boldSymbol?: boolean;
  hideable?: boolean;
}

export function CurrencyValue({
  value,
  currency,
  boldSymbol = true,
  hideable = true,
  className,
  ...props
}: CurrencyValueProps) {
  const { locale } = useI18n();
  const { isVisible } = useBalanceVisibility();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const formatted = formatCurrency(value, currency, locale);
  const showHidden = hideable && mounted && !isVisible;

  if (showHidden) {
    const symbol = currency === "BDT" ? "৳" : currency === "USD" ? "$" : "";
    return (
      <span className={cn("tabular-nums tracking-[0.2em] font-mono", className)} {...props}>
        {symbol && <span className={cn(currency === "BDT" && boldSymbol && "font-black mr-0.5 text-[1.1em]")}>{symbol}</span>}
        ****
      </span>
    );
  }

  if (currency === "BDT" && boldSymbol) {
    // Some locales might put the symbol after, but for BDT we expect it before
    const hasSymbol = formatted.includes("৳");
    if (hasSymbol) {
      const amount = formatted.replace("৳", "").trim();
      return (
        <span className={cn("tabular-nums inline-flex items-baseline", className)} {...props}>
          <span className="font-black mr-0.5 text-[1.1em]">৳</span>
          <span>{amount}</span>
        </span>
      );
    }
  }

  return (
    <span className={cn("tabular-nums", className)} {...props}>
      {formatted}
    </span>
  );
}
