import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { CATEGORY_KEYS, type CategoryKey } from "@/lib/mock-data";
import { isValidYmd } from "@/lib/ymd";
import { todayYmd } from "@/lib/ai/dates";
import { resumeLastMonth } from "@/lib/recurring-due";

const RuleInput = z.object({
  description: z.string().trim().min(1).max(120),
  amount: z.number().positive().max(1_000_000_000_000),
  type: z.enum(["income", "expense"]),
  category_key: z.enum(CATEGORY_KEYS as [CategoryKey, ...CategoryKey[]]),
  day_of_month: z.number().int().min(1).max(31),
  start_date: z.string().refine(isValidYmd),
});
const RulePatch = RuleInput.partial().extend({ id: z.uuid(), active: z.boolean().optional() });

// income ⇔ category "income"; an expense can never carry the income category.
function fixCategory<T extends { type?: string; category_key?: CategoryKey }>(r: T): T {
  if (r.type === "income") return { ...r, category_key: "income" };
  if (r.type === "expense" && r.category_key === "income") return { ...r, category_key: "shopping" };
  return r;
}

async function getUser() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET() {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("recurring_rules")
    .select("id, description, amount, type, category_key, day_of_month, start_date, last_generated_month, active")
    .eq("user_id", user.id)
    .order("day_of_month", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    data: (data ?? []).map((r) => ({ ...r, amount: Number(r.amount) })),
  });
}

export async function POST(req: NextRequest) {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = RuleInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { data, error } = await supabase
    .from("recurring_rules")
    .insert({ user_id: user.id, ...fixCategory(parsed.data) })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = RulePatch.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { id, ...fields } = fixCategory(parsed.data);
  let update: typeof fields & { last_generated_month?: string } = fields;
  if (fields.active === true) {
    const { data: current } = await supabase
      .from("recurring_rules")
      .select("active, day_of_month, last_generated_month")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    // Resuming a paused rule must not back-fill the months it was paused.
    if (current && !current.active) {
      const day_of_month = fields.day_of_month ?? current.day_of_month;
      update = { ...fields, last_generated_month: resumeLastMonth({ ...current, day_of_month }, todayYmd()) };
    }
  }
  const { data, error } = await supabase
    .from("recurring_rules")
    .update(update)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Rule not found" }, { status: 404 });
  return NextResponse.json({ data });
}

export async function DELETE(req: NextRequest) {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id || !z.uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  // Generated transactions stay (FK is ON DELETE SET NULL).
  const { error } = await supabase.from("recurring_rules").delete().eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
