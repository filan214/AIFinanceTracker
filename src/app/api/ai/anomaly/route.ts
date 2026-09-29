import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { askLLM } from "@/lib/llm";
import {
  weekIndex,
  filterTriggeredTransactions,
  hasSpendingSpike,
  markNewTransactions,
} from "@/lib/anomaly";
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
  const thisWeekTransactions: {
    id: string;
    description: string;
    amount: number;
    category_key: string;
  }[] = [];
  const priorDescriptions = new Set<string>();

  for (const tx of txns) {
    const weekNum = weekIndex(now, tx.date);
    const weekKey = `week_${weekNum}`;
    if (!weeklyData[weekKey]) weeklyData[weekKey] = {};
    weeklyData[weekKey][tx.category_key] =
      (weeklyData[weekKey][tx.category_key] || 0) + Number(tx.amount);

    if (weekNum === 0) {
      thisWeekTransactions.push({
        id: tx.id,
        description: tx.description,
        amount: Number(tx.amount),
        category_key: tx.category_key,
      });
    } else {
      priorDescriptions.add(tx.description);
    }
  }

  // Nothing rose meaningfully this week: skip the AI call entirely.
  if (!hasSpendingSpike(weeklyData)) {
    return NextResponse.json({ detected: false });
  }

  const langName = lang === "en" ? "English" : "Bahasa Indonesia";

  const prompt = `You detect spending anomalies. Find the ONE most significant one, if any.

Weekly spending by category (IDR; week_0 = this week, week_1..3 = previous weeks):
${JSON.stringify(weeklyData)}

This week's transactions:
${JSON.stringify(thisWeekTransactions)}

If there is an anomaly, return ONLY this JSON:
{"detected":true,"category":"<category_key from the data>","categoryLabel":"<label>","thisWeek":327000,"typical":230000,"percentageChange":42,"direction":"up","summary":"<one sentence>","triggeredTransactions":[{"id":"<real id>","description":"Netflix","amount":65000}]}
Otherwise return ONLY: {"detected":false}

Rules:
- "typical" = average of week_1..3 for that category.
- "triggeredTransactions": max 3 from this week most responsible; real ids only; each MUST have category_key equal to "category".
- "summary" and "categoryLabel" in ${langName}.`;

  try {
    const raw = await askLLM(prompt, { maxOutputTokens: 512, lite: true });

    // Strip markdown fences in case the model wraps the JSON.
    const clean = raw.replace(/```json|```/g, "").trim();
    const result = JSON.parse(clean) as AnomalyResult;

    if (!result || result.detected !== true) {
      return NextResponse.json({ detected: false });
    }

    // Defense in depth: never trust the model to have filtered these itself.
    result.triggeredTransactions = markNewTransactions(
      filterTriggeredTransactions(result.triggeredTransactions ?? [], result.category, txns),
      txns,
      priorDescriptions
    );

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
