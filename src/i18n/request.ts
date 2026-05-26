import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

export type Locale = "id" | "en";
export const DEFAULT_LOCALE: Locale = "id";
export const LOCALE_COOKIE = "sft-locale";

function isLocale(value: string | undefined): value is Locale {
  return value === "id" || value === "en";
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const stored = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale: Locale = isLocale(stored) ? stored : DEFAULT_LOCALE;

  const messages = (await import(`../../messages/${locale}.json`)).default;

  return {
    locale,
    messages,
    timeZone: "Asia/Jakarta",
  };
});
