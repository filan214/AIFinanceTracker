"use client";

import { cn } from "@/lib/cn";

export function PageHeader({
  title,
  subtitle,
  actions,
  liveBadge,
  className,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  liveBadge?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {liveBadge && (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              <span className="relative flex h-[5px] w-[5px]">
                <span className="absolute inline-flex h-full w-full animate-pulse-dot rounded-full bg-emerald-500" />
                <span className="relative inline-flex h-[5px] w-[5px] rounded-full bg-emerald-500" />
              </span>
              Live
            </span>
          )}
        </div>
        {subtitle ? (
          <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2.5">{actions}</div> : null}
    </div>
  );
}
