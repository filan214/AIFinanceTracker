export const fieldClass =
  "h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      {children}
    </label>
  );
}
