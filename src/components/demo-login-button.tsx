"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

// One-click sign-in to the shared demo account, used on the login and landing
// pages. Renders nothing unless a demo account is configured via
// NEXT_PUBLIC_DEMO_EMAIL (inlined at build time).
export function DemoLoginButton({
  variant = "secondary",
  size = "lg",
  className,
}: Pick<ButtonProps, "variant" | "size" | "className">) {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const demoEmail = process.env.NEXT_PUBLIC_DEMO_EMAIL;
  if (!demoEmail) return null;

  async function handleDemo() {
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: demoEmail ?? "",
      password: process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? "",
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        onClick={handleDemo}
        disabled={loading}
      >
        <Sparkles className="h-4 w-4 text-emerald-500" />
        {loading ? tCommon("loading") : t("demoCta")}
      </Button>
      {error && (
        <p className="mt-2 w-full basis-full text-sm text-rose-600">{error}</p>
      )}
    </>
  );
}
