import { Skeleton } from "@/components/ui/skeleton";

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div
      aria-busy="true"
      className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-3 w-48" />
        </div>
      ))}
    </div>
  );
}
