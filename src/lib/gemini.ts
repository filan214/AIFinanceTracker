import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export function getModel() {
  return genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
}

export async function askGemini(prompt: string): Promise<string> {
  const model = getModel();
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}
