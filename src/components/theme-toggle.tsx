"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

export function ThemeToggle({
  className,
  variant = "inline",
}: {
  className?: string;
  variant?: "inline" | "segmented";
}) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted && (theme === "dark" || (theme === "system" && resolvedTheme === "dark"));

  if (variant === "segmented") {
    const options: { value: string; icon: typeof Sun }[] = [
      { value: "light", icon: Sun },
      { value: "dark", icon: Moon },
    ];
    return (
      <div
        className={cn(
          "inline-flex rounded-lg border border-zinc-200 bg-white p-0.5 dark:border-zinc-700 dark:bg-zinc-900",
          className
        )}
      >
        {options.map(({ value, icon: Icon }) => {
          const active = mounted && (theme === value || (theme === "system" && resolvedTheme === value));
          return (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              className={cn(
                "rounded-md p-1.5 transition-colors",
                active
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200"
              )}
              aria-label={`Theme: ${value}`}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
        className
      )}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Moon className="h-3.5 w-3.5" />
      ) : (
        <Sun className="h-3.5 w-3.5" />
      )}
    </button>
  );
}
