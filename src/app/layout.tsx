import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { ThemeProvider } from "next-themes";
import { LocaleProvider, type Locale } from "@/i18n/locale-provider";
import { AuthProvider } from "@/lib/supabase/auth-context";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const SHARE_TITLE = "Smart Finn Track: personal finance with an AI advisor";
const SHARE_DESCRIPTION =
  "Track spending in Bahasa Indonesia or English, ask an AI advisor about your real transactions, scan receipts and plan budgets. Try the live demo, no sign-up needed.";

export const metadata: Metadata = {
  // Link previews need absolute image URLs; the images themselves come from
  // opengraph-image.png / twitter-image.png in this folder.
  metadataBase: new URL("https://ai-finance-tracker-delta-drab.vercel.app"),
  title: "Smart Finn Track — AI-powered personal finance",
  description:
    "Track your money, automatically categorized and analyzed by AI. Bahasa Indonesia and English.",
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Smart Finn Track",
    title: SHARE_TITLE,
    description: SHARE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SHARE_TITLE,
    description: SHARE_DESCRIPTION,
  },
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
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <LocaleProvider initialLocale={initialLocale}>
              {children}
            </LocaleProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
