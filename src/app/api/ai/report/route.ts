import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { askLLM } from "@/lib/llm";
import { computeReportData } from "@/lib/reports/compute-report";
import type { AIReportContent, ReportData } from "@/types/report";

const EMPTY: AIReportContent = {
  summary: { paragraph1: "", paragraph2: "", paragraph3: "" },
  recommendations: [],
};

// Cached AI report content (the LLM narrative + recommendations) per month.
// Returns the raw ai_insights rows; the client parses content into AIReportContent.
export async function GET(req: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const month = req.nextUrl.searchParams.get("month");
  let q = supabase
    .from("ai_insights")
    .select("month, language, content, created_at")
    .eq("user_id", user.id)
    .eq("type", "monthly_report");
  if (month) q = q.eq("month", month);

  const { data } = await q.order("created_at", { ascending: false });
  return NextResponse.json({ data: data ?? [] });
}

// Pull the JSON object out of an LLM reply, tolerating code fences / stray prose.
function parseLLMJSON(raw: string): unknown | null {
  let s = raw.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) s = fence[1].trim();
  const open = s.indexOf("{");
  const close = s.lastIndexOf("}");
  if (open >= 0 && close > open) s = s.slice(open, close + 1);
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

// Coerce an arbitrary parsed object into the AIReportContent shape.
function normalizeAIContent(parsed: unknown): AIReportContent {
  if (!parsed || typeof parsed !== "object") return EMPTY;
  const obj = parsed as Record<string, unknown>;
  const summary = (obj.summary ?? {}) as Record<string, unknown>;
  const recs = Array.isArray(obj.recommendations) ? obj.recommendations : [];
  return {
    summary: {
      paragraph1: str(summary.paragraph1),
      paragraph2: str(summary.paragraph2),
      paragraph3: str(summary.paragraph3),
    },
    recommendations: recs
      .filter((r): r is Record<string, unknown> => !!r && typeof r === "object")
      .slice(0, 3)
      .map((r, i) => ({
        id: str(r.id) || String(i + 1).padStart(2, "0"),
        title: str(r.title),
        description: str(r.description),
        outcome: str(r.outcome),
      })),
  };
}

function hasContent(c: AIReportContent): boolean {
  return (
    !!c.summary.paragraph1.trim() ||
    !!c.summary.paragraph2.trim() ||
    c.recommendations.length > 0
  );
}

function buildPrompt(d: ReportData, langName: string): string {
  const { metrics, categoryBreakdown, biggestMovers, highlights } = d;
  const catList =
    categoryBreakdown
      .slice(0, 6)
      .map((c) => `${c.categoryKey} Rp ${c.total} (${c.vsLastMonth >= 0 ? "+" : ""}${c.vsLastMonth}%)`)
      .join("; ") || "none";
  const mover = biggestMovers[0];
  const moverText = mover
    ? `${mover.categoryKey} (${mover.changePercent >= 0 ? "+" : ""}${mover.changePercent}%)`
    : "none";
  const subs = highlights.newSubscriptions.names.join(", ") || "none";
  const maxTx = highlights.mostExpensiveDay
    ? `Rp ${highlights.mostExpensiveDay.amount} (${highlights.mostExpensiveDay.description || "?"})`
    : "none";

  return `You are a personal finance advisor writing a monthly report.

User's financial data for ${d.month}:
- Total spent: Rp ${metrics.totalSpent}
- Total income: Rp ${metrics.totalIncome}
- Saved: Rp ${metrics.saved} (${metrics.savingsRate}% savings rate)
- Spending change vs last month: ${metrics.spentChange}%
- Category breakdown: ${catList}
- Biggest category change: ${moverText}
- New subscriptions detected: ${subs}
- Most expensive single transaction: ${maxTx}

Respond ONLY with valid JSON in this exact format:
{
  "summary": {
    "paragraph1": "Overall spending and income summary with savings rate.",
    "paragraph2": "Analysis of the biggest category change and what drove it.",
    "paragraph3": "A positive observation or notable outlier, reassuring tone."
  },
  "recommendations": [
    { "id": "01", "title": "Short action title", "description": "2-3 sentences. Specific, data-driven, actionable.", "outcome": "Short result label e.g. Save Rp 60K" },
    { "id": "02", "title": "Short action title", "description": "2-3 sentences.", "outcome": "Short result label" },
    { "id": "03", "title": "Short action title", "description": "2-3 sentences.", "outcome": "Short result label" }
  ]
}

Rules:
- Respond in ${langName}.
- Tone: friendly, direct, second-person ("you" / "kamu").
- Use specific numbers from the data — never guess.
- Bold key numbers and percentages using **bold** markdown inside paragraph strings.
- "paragraph1" covers: total spend, income, savings rate.
- "paragraph2" covers: biggest mover category + driver (new subscriptions if applicable).
- "paragraph3" covers: something positive (a category that decreased, or good savings rate).
- Each recommendation must reference a specific number from the data.
- "outcome" must be concise (max 4 words).
- Return ONLY valid JSON, no markdown fences.`;
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { language, month, regenerate } = await req.json();
  const lang = language === "en" ? "en" : "id";
  const langName = lang === "en" ? "English" : "Bahasa Indonesia";
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "Invalid month" }, { status: 400 });
  }

  const existing = await supabase
    .from("ai_insights")
    .select("id, content")
    .eq("user_id", user.id)
    .eq("type", "monthly_report")
    .eq("month", month)
    .eq("language", lang)
    .maybeSingle();

  // Cache hit: return the stored content unless the caller forced a regenerate.
  if (existing.data && !regenerate) {
    const cached = normalizeAIContent(parseLLMJSON(existing.data.content));
    if (hasContent(cached)) return NextResponse.json({ data: cached });
    // else: unparseable / legacy plain-text row → fall through and regenerate.
  }

  const reportData = await computeReportData(supabase, user.id, month);

  let aiContent: AIReportContent = EMPTY;
  try {
    const raw = await askLLM(buildPrompt(reportData, langName), {
      maxOutputTokens: 1024,
    });
    aiContent = normalizeAIContent(parseLLMJSON(raw));
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "AI request failed" },
      { status: 500 }
    );
  }

  // Cache the AI content (replace any existing row for this month + language).
  if (existing.data) {
    await supabase.from("ai_insights").delete().eq("id", existing.data.id);
  }
  await supabase.from("ai_insights").insert({
    user_id: user.id,
    type: "monthly_report",
    month,
    language: lang,
    content: JSON.stringify(aiContent),
    is_read: false,
  });

  return NextResponse.json({ data: aiContent });
}
