import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { askLLMWithImage } from "@/lib/llm";
import { readReceipt, MAX_RECEIPT_DATA_URL_CHARS } from "@/lib/receipt";
import { todayYmd } from "@/lib/ai/dates";

const Body = z.object({
  image: z
    .string()
    .max(MAX_RECEIPT_DATA_URL_CHARS)
    .regex(/^data:image\/(jpeg|png|webp);base64,/),
});

function buildPrompt(today: string): string {
  return `You read shopping receipts. Today is ${today}.
Return ONLY a JSON object:
{"total": number, "date": "YYYY-MM-DD" or null, "merchant": string, "category_key": string}
- total: the final amount paid (grand total after tax and discounts), whole Rupiah, digits only.
- date: the transaction date printed on the receipt, or null if not visible.
- merchant: the store or restaurant name, short.
- category_key: one of food, transport, entertainment, shopping, bills, health, education, savings.
If the image is not a receipt, return {"total": null}.`;
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid image" }, { status: 400 });

  const today = todayYmd();
  const result = await readReceipt(
    () => askLLMWithImage(buildPrompt(today), parsed.data.image, { maxOutputTokens: 256 }),
    today
  );
  if ("draft" in result) return NextResponse.json({ data: result.draft });
  return NextResponse.json(result, { status: result.error === "busy" ? 503 : 422 });
}
