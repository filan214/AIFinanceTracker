import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function DELETE() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [txResult, aiResult] = await Promise.all([
    supabase.from("transactions").delete().eq("user_id", user.id),
    supabase.from("ai_insights").delete().eq("user_id", user.id),
  ]);

  if (txResult.error || aiResult.error) {
    return NextResponse.json(
      { error: txResult.error?.message || aiResult.error?.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
