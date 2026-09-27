import { cn } from "@/lib/cn";
import { fieldClass } from "./field";

// Rupiah input: digits only, "Rp" prefix. Value is a digits-only string.
export function AmountInput({
  value,
  onChange,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
}) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-zinc-400">
        Rp
      </span>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ""))}
        placeholder="0"
        className={cn(fieldClass, "pl-10 font-mono")}
      />
    </div>
  );
}
