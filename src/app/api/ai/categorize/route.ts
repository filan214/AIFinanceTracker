import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { askGemini } from "@/lib/gemini";

const VALID_CATEGORIES = [
  "food",
  "transport",
  "entertainment",
  "shopping",
  "bills",
  "health",
  "education",
  "savings",
  "income",
];

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
Return ONLY the category key from this list:
food, transport, entertainment, shopping, bills, health, education, savings, income

Transaction: "${description}"
Return only the key. No explanation.`;

  try {
    const raw = await askGemini(prompt);
    const category_key = VALID_CATEGORIES.includes(raw) ? raw : "shopping";

    if (transactionId) {
      await supabase
        .from("transactions")
        .update({ category_key })
        .eq("id", transactionId)
        .eq("user_id", user.id);
    }

    return NextResponse.json({ category_key });
  } catch {
    return NextResponse.json({ category_key: "shopping" });
  }
}
