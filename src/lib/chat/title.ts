import { askLLM } from "@/lib/llm";

const MAX_LEN = 40;

function truncate(message: string): string {
  const clean = message.trim().replace(/\s+/g, " ");
  return clean.length > 35 ? clean.slice(0, 32).trimEnd() + "..." : clean;
}

// Generate a short, human-friendly session title from the first user message.
// Uses a cheap AI summarization (~20 tokens) and falls back to plain
// truncation if the model is unavailable or returns nothing usable.
export async function generateSessionTitle(
  message: string,
  language: "id" | "en"
): Promise<string> {
  const fallback = truncate(message);
  if (!message.trim()) return "New conversation";

  try {
    const langName = language === "en" ? "English" : "Bahasa Indonesia";
    const raw = await askLLM(
      `Summarize this personal-finance question as a short title of 3-5 words, in ${langName}, Title Case, no punctuation, no quotes, no trailing period.\n\nQuestion: "${message}"`,
      { maxOutputTokens: 20 }
    );
    const clean = raw.replace(/["'\n.]/g, "").trim();
    if (!clean) return fallback;
    return clean.length > MAX_LEN ? clean.slice(0, MAX_LEN).trimEnd() : clean;
  } catch {
    return fallback;
  }
}
