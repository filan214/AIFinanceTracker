import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import { ThemeProvider } from "next-themes";
import { LocaleProvider, type Locale } from "@/i18n/locale-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Smart Finn Track — AI-powered personal finance",
  description:
    "Track your money, automatically categorized and analyzed by AI. Bahasa Indonesia and English.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const stored = cookieStore.get("sft-locale")?.value;
  const initialLocale: Locale = stored === "en" ? "en" : "id";

  return (
    <html
      lang={initialLocale}
      className={inter.variable}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LocaleProvider initialLocale={initialLocale}>
            {children}
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
