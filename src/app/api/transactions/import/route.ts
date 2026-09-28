import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { askLLM } from "@/lib/llm";
import { isValidYmd } from "@/lib/ymd";
import type { ExpenseCategoryKey } from "@/lib/draft";
import {
  CATEGORIZE_BATCH_SIZE,
  buildCategorizePrompt,
  chunk,
  parseCategoryBatch,
} from "@/lib/csv/batch";

const Row = z.object({
  date: z.string().refine(isValidYmd),
  description: z.string().trim().min(1).max(120),
  amount: z.number().positive().max(1_000_000_000_000),
  type: z.enum(["income", "expense"]),
});
const Body = z.object({ rows: z.array(Row).min(1).max(500) });

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid rows" }, { status: 400 });
  const { rows } = parsed.data;

  const expenses = rows.filter((r) => r.type === "expense");
  const batches = chunk(expenses, CATEGORIZE_BATCH_SIZE);
  const results = await Promise.all(
    batches.map(async (batch): Promise<ExpenseCategoryKey[]> => {
      try {
        const raw = await askLLM(buildCategorizePrompt(batch.map((r) => r.description)), {
          maxOutputTokens: 1024,
        });
        return parseCategoryBatch(raw, batch.length);
      } catch {
        return batch.map(() => "shopping");
      }
    })
  );
  const categories = results.flat();

  let e = 0;
  const inserts = rows.map((r) => ({
    user_id: user.id,
    amount: r.amount,
    type: r.type,
    description: r.description,
    date: r.date,
    category_key: r.type === "income" ? "income" : categories[e++],
  }));

  const { error, count } = await supabase.from("transactions").insert(inserts, { count: "exact" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ inserted: count ?? inserts.length }, { status: 201 });
}
