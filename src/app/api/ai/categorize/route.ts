import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { askLLM } from "@/lib/llm";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { transactionId, description, type } = await req.json();

  if (type === "income") {
    if (transactionId) {
      await supabase
        .from("transactions")
        .update({ category_key: "income" })
        .eq("id", transactionId)
        .eq("user_id", user.id);
    }
    return NextResponse.json({ category_key: "income" });
  }

  const prompt = `You are a financial transaction categorizer.
Categories:
- food: meals, drinks, groceries, restaurants, cafes, snacks
- transport: fuel, gojek, grab, taxi, parking, tolls, public transit
- entertainment: movies, streaming subscriptions (netflix, spotify), concerts, games
- shopping: clothes, shoes, electronics, home goods, accessories
- bills: utilities (electricity, water, gas), internet, phone, rent, insurance
- health: medicine, doctor, hospital, gym, supplements
- education: courses, books, tuition, training
- savings: transfers to savings, investments
- income: salary, freelance income, refunds

Transaction description: "${description}"

Reply with EXACTLY ONE word — the category key. No quotes, no punctuation, no explanation.`;

  async function categorize(): Promise<string> {
    try {
      const raw = await askLLM(prompt, { maxOutputTokens: 16 });
      const normalized = raw.toLowerCase();
      const match = normalized.match(
        /\b(food|transport|entertainment|shopping|bills|health|education|savings|income)\b/
      );
      return match ? match[1] : "shopping";
    } catch {
      return "shopping";
    }
  }

  const category_key = await categorize();

  if (transactionId) {
    await supabase
      .from("transactions")
      .update({ category_key })
      .eq("id", transactionId)
      .eq("user_id", user.id);
  }

  return NextResponse.json({ category_key });
}
