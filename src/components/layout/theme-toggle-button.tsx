"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/provider";

export function ThemeToggleButton() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { t } = useI18n();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const current = mounted ? resolvedTheme : theme;

  return (
    <Button
      size="icon-sm"
      variant="ghost"
      onClick={() => setTheme(current === "dark" ? "light" : "dark")}
      aria-label={t("common.theme")}
    >
      {mounted && current === "dark" ? (
        <Sun className="w-4 h-4" />
      ) : (
        <Moon className="w-4 h-4" />
      )}
    </Button>
  );
}
