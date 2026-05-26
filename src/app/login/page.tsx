"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LanguageToggle } from "@/components/language-toggle";

export default function LoginPage() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const router = useRouter();

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden bg-gradient-to-br from-emerald-600 to-emerald-800 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold">{tCommon("appName")}</span>
        </div>
        <blockquote className="max-w-md text-2xl leading-snug">
          “{tCommon("tagline")}.”
          <footer className="mt-3 text-sm font-medium text-emerald-100/80">
            — Smart Finn Track
          </footer>
        </blockquote>
        <div />
      </div>

      <div className="flex flex-col p-6 sm:p-10">
        <div className="flex items-center justify-between lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-600 text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold">{tCommon("appName")}</span>
          </Link>
          <LanguageToggle variant="segmented" />
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            <h1 className="text-2xl font-semibold">{t("loginTitle")}</h1>
            <p className="mt-1 text-sm text-zinc-500">{t("loginSubtitle")}</p>

            <form
              className="mt-8 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                router.push("/dashboard");
              }}
            >
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                  {t("email")}
                </label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  required
                  defaultValue="demo@smartfinn.app"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                  {t("password")}
                </label>
                <Input type="password" placeholder="••••••••" required />
              </div>
              <Button type="submit" size="lg" className="w-full">
                {t("loginCta")}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-zinc-500">
              {t("noAccount")}{" "}
              <Link
                href="/register"
                className="font-medium text-emerald-600 hover:underline"
              >
                {t("signUp")}
              </Link>
            </p>
          </div>
        </div>
        <div className="hidden justify-end lg:flex">
          <LanguageToggle variant="segmented" />
        </div>
      </div>
    </div>
  );
}
