import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { askGemini } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { message, history, language } = await req.json();
  const lang = language === "en" ? "en" : "id";

  if (!message?.trim()) {
    return NextResponse.json({ error: "Empty message" }, { status: 400 });
  }

  const now = new Date();
  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const { data: txns } = await supabase
    .from("transactions")
    .select("amount, type, category_key, date, description")
    .eq("user_id", user.id)
    .gte("date", threeMonthsAgo.toISOString().slice(0, 10))
    .order("date", { ascending: false })
    .limit(200);

  function buildSummary() {
    if (!txns || txns.length === 0) return "No transaction data available.";

    const byMonth: Record<string, { income: number; expense: number; byCategory: Record<string, number> }> = {};
    for (const t of txns) {
      const m = t.date.slice(0, 7);
      if (!byMonth[m]) byMonth[m] = { income: 0, expense: 0, byCategory: {} };
      if (t.type === "income") {
        byMonth[m].income += Number(t.amount);
      } else {
        byMonth[m].expense += Number(t.amount);
        byMonth[m].byCategory[t.category_key] =
          (byMonth[m].byCategory[t.category_key] || 0) + Number(t.amount);
      }
    }
    return JSON.stringify(byMonth);
  }

  const historyStr = (history || [])
    .slice(-6)
    .map((h: { role: string; content: string }) => `${h.role}: ${h.content}`)
    .join("\n");

  const prompt = `You are a personal finance advisor with the user's transaction data.

Transaction summary (last 90 days): ${buildSummary()}
${historyStr ? `Conversation history:\n${historyStr}\n` : ""}
User message: "${message}"

- Respond in ${lang === "en" ? "English" : "Bahasa Indonesia"}
- Answer based strictly on the data provided
- Be concise, specific, and helpful
- Use Rp for currency amounts`;

  try {
    const reply = await askGemini(prompt);
    return NextResponse.json({ reply });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
