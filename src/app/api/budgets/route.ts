import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { currentMonth } from "@/lib/ai/dates";
import { EXPENSE_CATEGORY_KEYS, type ExpenseCategoryKey } from "@/lib/draft";
import { loadBudgetsWithSpent } from "@/lib/planning/budgets-server";
import { isValidMonth } from "@/lib/ymd";

const Upsert = z.object({
  category_key: z.enum(EXPENSE_CATEGORY_KEYS as [ExpenseCategoryKey, ...ExpenseCategoryKey[]]),
  amount: z.number().positive().max(1_000_000_000_000),
});

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const month = req.nextUrl.searchParams.get("month") || currentMonth();
  if (!isValidMonth(month)) return NextResponse.json({ error: "Invalid month" }, { status: 400 });

  try {
    const data = await loadBudgetsWithSpent(supabase, user.id, month);
    return NextResponse.json({ data, month });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Upsert.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { data, error } = await supabase
    .from("budgets")
    .upsert(
      { user_id: user.id, ...parsed.data, updated_at: new Date().toISOString() },
      { onConflict: "user_id,category_key" }
    )
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id || !z.uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const { error } = await supabase.from("budgets").delete().eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
