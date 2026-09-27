import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { isValidYmd } from "@/lib/ymd";

const Body = z.object({
  goal_id: z.uuid(),
  amount: z.number().positive().max(1_000_000_000_000),
  date: z.string().refine(isValidYmd),
  record_as_expense: z.boolean(),
});

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { goal_id, amount, date, record_as_expense } = parsed.data;

  const { data: goal } = await supabase
    .from("savings_goals")
    .select("name")
    .eq("id", goal_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

  const { error } = await supabase
    .from("goal_contributions")
    .insert({ goal_id, user_id: user.id, amount, date });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Optional mirror as a normal expense so the monthly balance stays honest.
  // Not linked to the contribution: deleting one never deletes the other.
  if (record_as_expense) {
    const { error: txErr } = await supabase.from("transactions").insert({
      user_id: user.id,
      amount,
      type: "expense",
      description: goal.name,
      category_key: "savings",
      date,
    });
    if (txErr) return NextResponse.json({ error: txErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await supabase
    .from("goal_contributions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
