"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LanguageToggle } from "@/components/language-toggle";
import { LogoMark } from "@/components/layout/sidebar";
import { createClient } from "@/lib/supabase/client";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function scorePassword(pw: string): number {
  if (!pw) return 0;
  if (pw.length < 8) return 1;
  let score = 1;
  if (pw.length >= 12) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

const STRENGTH_BAR = ["bg-rose-500", "bg-amber-500", "bg-emerald-400", "bg-emerald-600"];
const STRENGTH_TEXT = [
  "text-rose-600 dark:text-rose-400",
  "text-amber-600 dark:text-amber-400",
  "text-emerald-600 dark:text-emerald-400",
  "text-emerald-600 dark:text-emerald-400",
];

export default function RegisterPage() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const emailValid = useMemo(() => EMAIL_RE.test(email), [email]);
  const strength = useMemo(() => scorePassword(password), [password]);
  const canSubmit =
    name.trim().length > 0 && emailValid && password.length >= 8 && !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/onboarding");
    router.refresh();
  }

  const benefits = [t("benefit1"), t("benefit2"), t("benefit3")];

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-zinc-900 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -right-16 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl"
        />

        <div className="relative flex items-center gap-2.5">
          <LogoMark size={30} />
          <span className="text-sm font-semibold">{tCommon("appName")}</span>
        </div>

        <div className="relative space-y-6">
          <h2 className="max-w-md text-3xl font-semibold leading-tight text-white">
            {tCommon("tagline")}
          </h2>
          <ul className="space-y-3.5">
            {benefits.map((b, i) => (
              <li
                key={b}
                className="animate-slide-up flex items-center gap-3 text-sm text-zinc-300"
                style={{ animationDelay: `${120 + i * 90}ms` }}
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                {b}
              </li>
            ))}
          </ul>
        </div>

        <div />
      </div>

      {/* Form panel */}
      <div className="flex flex-col p-6 sm:p-10">
        <div className="flex items-center justify-between lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <LogoMark size={28} />
            <span className="text-sm font-semibold">{tCommon("appName")}</span>
          </Link>
          <LanguageToggle variant="segmented" />
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            <h1 className="animate-fade-in text-2xl font-semibold">
              {t("registerTitle")}
            </h1>
            <p className="animate-fade-in mt-1 text-sm text-zinc-500">
              {t("registerSubtitle")}
            </p>

            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              {/* Name */}
              <div
                className="animate-slide-up"
                style={{ animationDelay: "60ms" }}
              >
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                  {t("name")}
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <Input
                    type="text"
                    placeholder="Filan"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Email */}
              <div
                className="animate-slide-up"
                style={{ animationDelay: "120ms" }}
              >
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                  {t("email")}
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`pl-9 pr-9 ${error ? "border-rose-500" : ""}`}
                  />
                  {emailValid && (
                    <Check className="animate-fade-in absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />
                  )}
                </div>
              </div>

              {/* Password */}
              <div
                className="animate-slide-up"
                style={{ animationDelay: "180ms" }}
              >
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                  {t("password")}
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`pl-9 pr-10 ${error ? "border-rose-500" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Strength meter */}
                {password.length > 0 && (
                  <div className="animate-fade-in mt-2">
                    <div className="flex gap-1">
                      {[0, 1, 2, 3].map((i) => (
                        <span
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            i < strength
                              ? STRENGTH_BAR[strength - 1]
                              : "bg-zinc-200 dark:bg-zinc-700"
                          }`}
                        />
                      ))}
                    </div>
                    <p
                      className={`mt-1.5 text-[11px] font-medium ${
                        strength > 0 ? STRENGTH_TEXT[strength - 1] : "text-zinc-400"
                      }`}
                    >
                      {t("passwordStrength")}:{" "}
                      {t(`strength${strength}` as "strength0")}
                    </p>
                  </div>
                )}
                {password.length === 0 && (
                  <p className="mt-1.5 text-[11px] text-zinc-400">
                    {t("passwordHint")}
                  </p>
                )}
              </div>

              {error && <p className="text-sm text-rose-600">{error}</p>}

              <Button
                type="submit"
                size="lg"
                disabled={!canSubmit}
                className="animate-slide-up w-full bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
                style={{ animationDelay: "240ms" }}
              >
                {loading ? tCommon("loading") : t("registerCta")}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-zinc-500">
              {t("haveAccount")}{" "}
              <Link
                href="/login"
                className="font-medium text-emerald-600 hover:underline"
              >
                {t("signIn")}
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
