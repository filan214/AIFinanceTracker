import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { generateSessionTitle } from "@/lib/chat/title";

// PATCH — auto-generate (or set) a session title from the first user message.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    firstMessage?: string;
    title?: string;
    language?: string;
  };
  const language = body.language === "en" ? "en" : "id";

  const title = body.title?.trim()
    ? body.title.trim().slice(0, 40)
    : await generateSessionTitle(body.firstMessage ?? "", language);

  const { data, error } = await supabase
    .from("chat_sessions")
    .update({ title, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, title, updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
