import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { askLLM } from "@/lib/llm";
import { extractJson } from "@/lib/llm-json";
import { quickParse } from "@/lib/quick-parse";
import { mergeAiDraft } from "@/lib/draft";
import { todayYmd } from "@/lib/ai/dates";

const Body = z.object({ text: z.string().trim().min(1).max(200) });

function buildPrompt(text: string, today: string): string {
  return `You convert a short personal-finance note into one transaction.
Today is ${today} (Asia/Jakarta).
Note: ${JSON.stringify(text)}

Return ONLY a JSON object:
{"amount": number, "type": "income" | "expense", "description": string, "date": "YYYY-MM-DD", "category_key": string}

Rules:
- amount: whole Rupiah. "rb"/"ribu"/"k" = thousand, "jt"/"juta" = million. "35rb" = 35000, "1,5jt" = 1500000.
- date: resolve relative words (kemarin/yesterday, lusa, "2 hari lalu", weekday names) against today. Default today.
- description: short title of what it was, in the same language as the note, without the amount or date words. Capitalize the first letter.
- category_key: one of food, transport, entertainment, shopping, bills, health, education, savings, income. Use income only when type is income.`;
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const today = todayYmd();
  const base = quickParse(parsed.data.text, today);
  try {
    const raw = await askLLM(buildPrompt(parsed.data.text, today), { maxOutputTokens: 256 });
    return NextResponse.json({ data: mergeAiDraft(base, extractJson(raw)) });
  } catch {
    // AI down or misconfigured: the rule-based parse is still useful.
    return NextResponse.json({ data: base });
  }
}
