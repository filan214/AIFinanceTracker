import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

export const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
});

// Google AI Studio free tier: small per-project, per-model request quotas
// (per-minute and per-day; the daily one resets at midnight Pacific); over
// either, calls 429 (never billed). Swap here to change models.
// (gemini-2.5-flash is closed to new projects; 3.7/3.8 ignore thinkingBudget.)
export const DEFAULT_MODEL = "gemini-3.5-flash";

// Simple classification/extraction tasks run on Flash-Lite, which has its own
// separate quota — keeping 3.5 Flash's for chat, receipts, reports.
export const LITE_MODEL = "gemini-3.5-flash-lite";

// 3.5 Flash "thinks" by default, and thinking tokens count against
// maxOutputTokens — enough to truncate the short JSON answers these prompts
// expect (e.g. categorize's 16 tokens). None of our tasks need it; turn it off.
export const NO_THINKING = {
  google: { thinkingConfig: { thinkingBudget: 0 } },
};

// Flash-Lite doesn't think by default and rejects a thinkingConfig (400).
export function modelSettings(lite: boolean) {
  return lite
    ? { modelId: LITE_MODEL, providerOptions: undefined }
    : { modelId: DEFAULT_MODEL, providerOptions: NO_THINKING };
}

export async function askLLM(
  prompt: string,
  opts: { maxOutputTokens?: number; lite?: boolean } = {}
): Promise<string> {
  const { modelId, providerOptions } = modelSettings(opts.lite ?? false);
  const { text } = await generateText({
    model: google(modelId),
    prompt,
    maxOutputTokens: opts.maxOutputTokens ?? 1024,
    providerOptions,
  });
  return text.trim();
}

// Multimodal prompt (text + one image, base64 data URL).
export async function askLLMWithImage(
  prompt: string,
  imageDataUrl: string,
  opts: { maxOutputTokens?: number } = {}
): Promise<string> {
  const comma = imageDataUrl.indexOf(",");
  const mediaType = imageDataUrl.slice(5, imageDataUrl.indexOf(";")); // "data:<type>;base64,"
  const { text } = await generateText({
    model: google(DEFAULT_MODEL),
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
    providerOptions: NO_THINKING,
  });
  return text.trim();
}
