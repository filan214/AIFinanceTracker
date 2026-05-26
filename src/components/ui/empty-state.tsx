import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export function EmptyState({
  icon: Icon,
  title,
  subtitle,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-white px-6 py-16 text-center dark:border-zinc-800 dark:bg-zinc-900",
        className
      )}
    >
      {Icon ? (
        <div className="mb-4 rounded-full bg-zinc-100 p-3 dark:bg-zinc-800">
          <Icon className="h-6 w-6 text-zinc-500" />
        </div>
      ) : null}
      <h3 className="text-base font-medium text-zinc-900 dark:text-zinc-100">
        {title}
      </h3>
      {subtitle ? (
        <p className="mt-1 max-w-sm text-sm text-zinc-500">{subtitle}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
