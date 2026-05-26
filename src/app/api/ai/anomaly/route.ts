import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { askGemini } from "@/lib/gemini";

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
    .select("amount, type, category_key, date")
    .eq("user_id", user.id)
    .eq("type", "expense")
    .gte("date", fourWeeksAgo.toISOString().slice(0, 10))
    .order("date", { ascending: true });

  if (!txns || txns.length < 5) {
    return NextResponse.json({ anomaly: null });
  }

  const weeklyData: Record<string, Record<string, number>> = {};
  for (const tx of txns) {
    const d = new Date(tx.date);
    const weekNum = Math.floor(
      (now.getTime() - d.getTime()) / (7 * 24 * 60 * 60 * 1000)
    );
    const weekKey = `week_${weekNum}`;
    if (!weeklyData[weekKey]) weeklyData[weekKey] = {};
    weeklyData[weekKey][tx.category_key] =
      (weeklyData[weekKey][tx.category_key] || 0) + Number(tx.amount);
  }

  const prompt = `Analyze the weekly spending data (IDR) and identify anomalies.

Data (last 4 weeks): ${JSON.stringify(weeklyData)}

- Respond in ${lang === "en" ? "English" : "Bahasa Indonesia"}
- Only flag real anomalies (significant spikes, new recurring charges)
- If anomaly: explain in 1–2 sentences, actionable
- If none: respond exactly "normal"`;

  try {
    const result = await askGemini(prompt);

    if (result.toLowerCase().trim() === "normal") {
      return NextResponse.json({ anomaly: null });
    }

    await supabase.from("ai_insights").insert({
      user_id: user.id,
      type: "anomaly",
      content: result,
      language: lang,
      month: now.toISOString().slice(0, 7),
    });

    return NextResponse.json({ anomaly: result });
  } catch {
    return NextResponse.json({ anomaly: null });
  }
}
