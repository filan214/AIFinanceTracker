import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

// Shared white card shell with an optional icon + title header, used by the
// breakdown, trend, movers, highlights and recommendations sections.
export function ReportCard({
  icon: Icon,
  title,
  action,
  children,
  className,
}: {
  icon?: LucideIcon;
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={
        "animate-slide-up rounded-xl border border-zinc-200 bg-white p-5 shadow-[var(--shadow-sm)] dark:border-zinc-800 dark:bg-zinc-900 " +
        (className ?? "")
      }
    >
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4 text-zinc-400" />}
            {title && <h3 className="text-[13px] font-semibold">{title}</h3>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
