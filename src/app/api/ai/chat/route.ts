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
    sessionId?: string | null;
  };
  const language = body.language === "en" ? "en" : "id";
  const sessionId = body.sessionId ?? null;

  // Text of the last user message — persisted alongside the AI reply.
  function lastUserText(): string {
    for (let i = body.messages.length - 1; i >= 0; i--) {
      const m = body.messages[i];
      if (m.role !== "user") continue;
      return m.parts
        .filter((p) => p.type === "text")
        .map((p) => (p as { text: string }).text)
        .join("")
        .trim();
    }
    return "";
  }

  const tools = buildChatTools(supabase, user.id);

  const result = streamText({
    model: openrouter(DEFAULT_MODEL),
    system: buildChatSystemPrompt(language),
    messages: await convertToModelMessages(body.messages),
    tools,
    stopWhen: stepCountIs(5),
    maxOutputTokens: 2048,
  });

  return result.toUIMessageStreamResponse({
    // Persist the exchange after the stream completes. We store the assistant's
    // full response parts (text + tool outputs like the category breakdown), not
    // just the text, so charts re-render when an old conversation is reopened.
    onFinish: async ({ responseMessage }) => {
      if (!sessionId) return;
      const userText = lastUserText();
      const assistantText = responseMessage.parts
        .filter((p) => p.type === "text")
        .map((p) => (p as { text: string }).text)
        .join("")
        .trim();
      try {
        const rows = [] as {
          session_id: string;
          role: string;
          content: string;
          parts?: unknown;
        }[];
        if (userText) rows.push({ session_id: sessionId, role: "user", content: userText });
        if (assistantText || responseMessage.parts.length)
          rows.push({
            session_id: sessionId,
            role: "assistant",
            content: assistantText,
            parts: responseMessage.parts,
          });
        if (rows.length) await supabase.from("chat_messages").insert(rows);
        await supabase
          .from("chat_sessions")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", sessionId)
          .eq("user_id", user.id);
      } catch {
        // persistence is best-effort — never fail the response over it
      }
    },
  });
}
