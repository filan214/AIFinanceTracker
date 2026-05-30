import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { askLLM } from "@/lib/llm";
import type { AnomalyResult } from "@/types/anomaly";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { language } = await req.json();
  const lang = language === "en" ? "en" : "id";

  const now = new Date();
  const fourWeeksAgo = new Date(now);
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  const { data: txns } = await supabase
    .from("transactions")
    .select("id, amount, type, category_key, date, description")
    .eq("user_id", user.id)
    .eq("type", "expense")
    .gte("date", fourWeeksAgo.toISOString().slice(0, 10))
    .order("date", { ascending: true });

  if (!txns || txns.length < 5) {
    return NextResponse.json({ detected: false });
  }

  const weeklyData: Record<string, Record<string, number>> = {};
  const thisWeekTransactions: { id: string; description: string; amount: number }[] = [];
  const priorDescriptions = new Set<string>();

  for (const tx of txns) {
    const d = new Date(tx.date);
    const weekNum = Math.floor(
      (now.getTime() - d.getTime()) / (7 * 24 * 60 * 60 * 1000)
    );
    const weekKey = `week_${weekNum}`;
    if (!weeklyData[weekKey]) weeklyData[weekKey] = {};
    weeklyData[weekKey][tx.category_key] =
      (weeklyData[weekKey][tx.category_key] || 0) + Number(tx.amount);

    if (weekNum === 0) {
      thisWeekTransactions.push({
        id: tx.id,
        description: tx.description,
        amount: Number(tx.amount),
      });
    } else {
      priorDescriptions.add(tx.description);
    }
  }

  const langName = lang === "en" ? "English" : "Bahasa Indonesia";

  const prompt = `You are a financial anomaly detector for a personal finance app.

Analyze the weekly spending data below and detect ONE most significant anomaly.

Weekly spending by category (last 4 weeks, in IDR; week_0 = this week):
${JSON.stringify(weeklyData)}

All transactions this week (id, description, amount in IDR):
${JSON.stringify(thisWeekTransactions)}

Descriptions seen in the previous 3 weeks (used for "isNew" detection):
${JSON.stringify([...priorDescriptions])}

If you detect an anomaly, respond ONLY with valid JSON in this exact format:
{
  "detected": true,
  "category": "<category_key present in the data>",
  "categoryLabel": "<human-readable label>",
  "thisWeek": 327000,
  "typical": 230000,
  "percentageChange": 42,
  "direction": "up",
  "summary": "Entertainment spending is up 42% this week — well above your 4-week average.",
  "triggeredTransactions": [
    { "id": "<id from this week's transactions>", "description": "Netflix", "amount": 65000, "isNew": true }
  ]
}

If NO significant anomaly detected, respond ONLY with:
{ "detected": false }

Rules:
- Return ONLY valid JSON — no markdown, no explanation outside the JSON
- "category" must be one of the category keys present in the data
- "typical" = average of the 3 previous weeks for that category
- "isNew" = true if the description is NOT in the previous-3-weeks list above
- "triggeredTransactions" = max 3 transactions from this week most responsible for the spike; use their real id
- "summary" must be a single sentence in ${langName}
- "categoryLabel" must be in ${langName}`;

  try {
    const raw = await askLLM(prompt, { maxOutputTokens: 512 });

    // Strip markdown fences in case the model wraps the JSON.
    const clean = raw.replace(/```json|```/g, "").trim();
    const result = JSON.parse(clean) as AnomalyResult;

    if (!result || result.detected !== true) {
      return NextResponse.json({ detected: false });
    }

    await supabase.from("ai_insights").insert({
      user_id: user.id,
      type: "anomaly",
      content: result.summary,
      language: lang,
      month: now.toISOString().slice(0, 7),
    });

    return NextResponse.json(result);
  } catch {
    // Fallback if the model did not return valid JSON.
    return NextResponse.json({ detected: false });
  }
}
