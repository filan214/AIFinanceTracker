import type { SupabaseClient } from "@supabase/supabase-js";
import { summarizeGoals, type GoalRow, type GoalView } from "@/lib/goal-progress";

// Goals with their contributions and progress. Shared by /api/goals and the
// chat advisor's getGoals tool.
export async function loadGoals(
  supabase: SupabaseClient,
  userId: string,
  today: string
): Promise<GoalView[]> {
  const { data, error } = await supabase
    .from("savings_goals")
    .select("id, name, target_amount, target_date, created_at, goal_contributions(id, amount, date)")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return summarizeGoals((data ?? []) as GoalRow[], today);
}
