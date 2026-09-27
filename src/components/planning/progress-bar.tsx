import { cn } from "@/lib/cn";

const TONE = {
  ok: "bg-emerald-500",
  warn: "bg-amber-500",
  over: "bg-rose-500",
} as const;

export function ProgressBar({ pct, tone }: { pct: number; tone: keyof typeof TONE }) {
  const clamped = Math.min(100, Math.max(0, pct));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
    >
      <div
        className={cn("h-full rounded-full transition-all", TONE[tone])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
