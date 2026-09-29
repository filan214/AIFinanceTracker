import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { askLLM } from "@/lib/llm";
import { categorizeExpense } from "@/lib/categorize";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { transactionId, description, type } = await req.json();

  if (type === "income") {
    if (transactionId) {
      await supabase
        .from("transactions")
        .update({ category_key: "income" })
        .eq("id", transactionId)
        .eq("user_id", user.id);
    }
    return NextResponse.json({ category_key: "income" });
  }

  const category_key = await categorizeExpense(String(description ?? ""), (prompt) =>
    askLLM(prompt, { maxOutputTokens: 16, lite: true })
  );

  if (transactionId) {
    await supabase
      .from("transactions")
      .update({ category_key })
      .eq("id", transactionId)
      .eq("user_id", user.id);
  }

  return NextResponse.json({ category_key });
}
