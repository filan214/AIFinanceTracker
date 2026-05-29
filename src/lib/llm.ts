import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

export const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "",
});

export const DEFAULT_MODEL = "google/gemini-2.5-flash";

export async function askLLM(
  prompt: string,
  opts: { maxOutputTokens?: number } = {}
): Promise<string> {
  const { text } = await generateText({
    model: openrouter(DEFAULT_MODEL),
    prompt,
    maxOutputTokens: opts.maxOutputTokens ?? 1024,
  });
  return text.trim();
}
