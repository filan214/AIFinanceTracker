import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Loading..."
      className={cn("skeleton", className)}
    />
  );
}
