import type { Locale } from "@/i18n/locale-provider";

const LOCALE_TAG: Record<Locale, string> = {
  id: "id-ID",
  en: "en-US",
};

export function formatCurrency(amount: number, locale: Locale = "id"): string {
  const formatted = new Intl.NumberFormat(LOCALE_TAG[locale], {
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
  return `Rp ${formatted}`;
}

// Compact currency for tight chart labels / stat rows, e.g. "Rp 2,3 jt" / "Rp 2.3M".
// Non-breaking spaces keep the whole token on one line so it never stacks
// ("Rp" above "780 rb") inside narrow stat columns.
export function formatCompactCurrency(
  amount: number,
  locale: Locale = "id"
): string {
  const formatted = new Intl.NumberFormat(LOCALE_TAG[locale], {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Math.abs(amount));
  return `Rp\u00a0${formatted}`;
}

export function formatSignedCurrency(
  amount: number,
  locale: Locale = "id"
): string {
  const sign = amount < 0 ? "-" : amount > 0 ? "+" : "";
  return `${sign}${formatCurrency(amount, locale)}`;
}

export function formatDate(date: Date | string, locale: Locale = "id"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(LOCALE_TAG[locale], {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function formatDateShort(
  date: Date | string,
  locale: Locale = "id"
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(LOCALE_TAG[locale], {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function formatPercent(
  value: number,
  locale: Locale = "id",
  withSign = true
): string {
  const sign = withSign && value > 0 ? "+" : "";
  return `${sign}${new Intl.NumberFormat(LOCALE_TAG[locale], {
    maximumFractionDigits: 0,
  }).format(value)}%`;
}
