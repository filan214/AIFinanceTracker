export type ChatSession = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type ChatMessageRow = {
  id: string;
  role: "user" | "assistant";
  content: string;
  // Structured AI SDK message parts (text + tool outputs). Null for older rows
  // and user messages, which fall back to a plain text part on render.
  parts?: unknown[] | null;
  created_at: string;
};

// All helpers degrade gracefully: if the chat-history tables aren't migrated
// yet (or a request fails), the chat still works without persistence.

export async function listSessions(): Promise<ChatSession[]> {
  try {
    const res = await fetch("/api/chat/sessions");
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

export async function createSession(): Promise<ChatSession | null> {
  try {
    const res = await fetch("/api/chat/sessions", { method: "POST" });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

export async function getSessionMessages(
  id: string
): Promise<ChatMessageRow[]> {
  try {
    const res = await fetch(`/api/chat/sessions/${id}`);
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

export async function deleteSession(id: string): Promise<void> {
  try {
    await fetch(`/api/chat/sessions/${id}`, { method: "DELETE" });
  } catch {
    // ignore — sidebar removal is optimistic
  }
}

export async function updateSessionTitle(
  id: string,
  firstMessage: string,
  language: string
): Promise<string | null> {
  try {
    const res = await fetch(`/api/chat/sessions/${id}/title`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstMessage, language }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data?.title ?? null;
  } catch {
    return null;
  }
}
