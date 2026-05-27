import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { askGemini } from "@/lib/gemini";

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("ai_insights")
    .select("*")
    .eq("user_id", user.id)
    .eq("type", "monthly_report")
    .order("created_at", { ascending: false });

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { language, month } = await req.json();
  const lang = language === "en" ? "en" : "id";

  const existing = await supabase
    .from("ai_insights")
    .select("id")
    .eq("user_id", user.id)
    .eq("type", "monthly_report")
    .eq("month", month)
    .maybeSingle();

  if (existing.data) {
    return NextResponse.json({ error: "Report already exists for this month" }, { status: 409 });
  }

  const [y, m] = month.split("-").map(Number);
  const start = `${month}-01`;
  const end = new Date(y, m, 0).toISOString().slice(0, 10);

  const prevMonth = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
  const [py, pm] = prevMonth.split("-").map(Number);
  const prevStart = `${prevMonth}-01`;
  const prevEnd = new Date(py, pm, 0).toISOString().slice(0, 10);

  const [currentTxns, prevTxns] = await Promise.all([
    supabase
      .from("transactions")
      .select("amount, type, category_key")
      .eq("user_id", user.id)
      .gte("date", start)
      .lte("date", end),
    supabase
      .from("transactions")
      .select("amount, type, category_key")
      .eq("user_id", user.id)
      .gte("date", prevStart)
      .lte("date", prevEnd),
  ]);

  function summarize(txns: typeof currentTxns.data) {
    if (!txns) return { total: 0, byCategory: {} };
    let total = 0;
    const byCategory: Record<string, number> = {};
    for (const t of txns) {
      if (t.type === "expense") {
        total += Number(t.amount);
        byCategory[t.category_key] = (byCategory[t.category_key] || 0) + Number(t.amount);
      }
    }
    return { total, byCategory };
  }

  const currentData = summarize(currentTxns.data);
  const prevData = summarize(prevTxns.data);

  const prompt = `Write a monthly finance summary.

${month} data: ${JSON.stringify(currentData)}
${prevMonth} data: ${JSON.stringify(prevData)}

- Respond in ${lang === "en" ? "English" : "Bahasa Indonesia"}
- Informal, friendly, second-person tone
- Max 4–5 sentences, no bullet points
- Cover: overall change %, biggest category change, 2–3 tips for next month`;

  try {
    const content = await askGemini(prompt);

    const { data } = await supabase
      .from("ai_insights")
      .insert({
        user_id: user.id,
        type: "monthly_report",
        content,
        language: lang,
        month,
      })
      .select()
      .single();

    return NextResponse.json({ data }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
