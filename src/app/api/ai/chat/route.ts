import { NextResponse } from "next/server";
import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from "ai";
import { createServerSupabase } from "@/lib/supabase/server";
import { buildChatTools } from "@/lib/ai/tools";
import { buildChatSystemPrompt } from "@/lib/ai/prompts";
import { openrouter, DEFAULT_MODEL } from "@/lib/llm";

export async function POST(req: Request) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json(
      { error: "OPENROUTER_API_KEY is not configured." },
      { status: 500 }
    );
  }

  const body = (await req.json()) as {
    messages: UIMessage[];
    language?: string;
  };
  const language = body.language === "en" ? "en" : "id";

  const tools = buildChatTools(supabase, user.id);

  const result = streamText({
    model: openrouter(DEFAULT_MODEL),
    system: buildChatSystemPrompt(language),
    messages: await convertToModelMessages(body.messages),
    tools,
    stopWhen: stepCountIs(5),
    maxOutputTokens: 2048,
  });

  return result.toUIMessageStreamResponse();
}
