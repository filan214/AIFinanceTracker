import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

export const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "",
});

// Free tier: OpenRouter has no free gemini-2.5-flash slug, so this avoids
// billing against account credits. Rate-limited per-account and may change
// without notice — swap here if OpenRouter drops or replaces it.
export const DEFAULT_MODEL = "google/gemma-4-26b-a4b-it:free";

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

// Multimodal prompt (text + one image). Uses the Chat Completions endpoint,
// which is OpenRouter's primary API and accepts base64 images.
export async function askLLMWithImage(
  prompt: string,
  imageDataUrl: string,
  opts: { maxOutputTokens?: number } = {}
): Promise<string> {
  const comma = imageDataUrl.indexOf(",");
  const mediaType = imageDataUrl.slice(5, imageDataUrl.indexOf(";")); // "data:<type>;base64,"
  const { text } = await generateText({
    model: openrouter.chat(DEFAULT_MODEL),
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image", image: imageDataUrl.slice(comma + 1), mediaType },
        ],
      },
    ],
    maxOutputTokens: opts.maxOutputTokens ?? 512,
  });
  return text.trim();
}
