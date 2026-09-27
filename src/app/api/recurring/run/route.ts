import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { todayYmd } from "@/lib/ai/dates";
import { recurringDue, type RecurringSchedule } from "@/lib/recurring-due";

// Materialize every due occurrence of the user's active recurring rules.
// Idempotent: the (recurring_rule_id, date) unique index + ignoreDuplicates
// means two tabs running this at once can't create duplicates.
export async function POST() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: rules, error } = await supabase
    .from("recurring_rules")
    .select("id, description, amount, type, category_key, day_of_month, start_date, last_generated_month, active")
    .eq("user_id", user.id)
    .eq("active", true);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const today = todayYmd();
  let created = 0;
  for (const rule of rules ?? []) {
    const { dates, lastGeneratedMonth } = recurringDue(rule as RecurringSchedule, today);
    if (dates.length === 0) continue;

    const { data: inserted, error: insErr } = await supabase
      .from("transactions")
      .upsert(
        dates.map((date) => ({
          user_id: user.id,
          amount: rule.amount,
          type: rule.type,
          description: rule.description,
          category_key: rule.category_key,
          date,
          recurring_rule_id: rule.id,
        })),
        { onConflict: "recurring_rule_id,date", ignoreDuplicates: true }
      )
      .select("id");
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
    created += inserted?.length ?? 0;

    await supabase
      .from("recurring_rules")
      .update({ last_generated_month: lastGeneratedMonth })
      .eq("id", rule.id)
      .eq("user_id", user.id);
  }

  return NextResponse.json({ created });
}
