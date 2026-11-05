// The small markdown subset the advisor writes: paragraphs, flat lists, bold and
// italic. Model text only ever becomes React text nodes, never HTML.

export type Inline = { text: string; style?: "bold" | "italic" };

export type ChatBlock =
  | { type: "p"; content: Inline[] }
  | { type: "ol"; start: number; items: Inline[][] }
  | { type: "ul"; items: Inline[][] };

const INLINE = /\*\*(.+?)\*\*|\*(?![\s*])(.+?)(?<![\s*])\*/g;

export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  for (const m of text.matchAll(INLINE)) {
    if (m.index > last) out.push({ text: text.slice(last, m.index) });
    out.push(
      m[1] !== undefined
        ? { text: m[1], style: "bold" }
        : { text: m[2], style: "italic" }
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}

export function parseChatMarkdown(markdown: string): ChatBlock[] {
  const blocks: ChatBlock[] = [];

  for (const raw of markdown.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue; // A blank line between list items doesn't end the list.

    const previous = blocks[blocks.length - 1];
    const ordered = line.match(/^(\d{1,2})[.)]\s+(.*)$/);
    const bullet = line.match(/^[-*]\s+(.*)$/);
    const heading = line.match(/^#{1,6}\s+(.*)$/);

    if (ordered) {
      const item = parseInline(ordered[2]);
      if (previous?.type === "ol") previous.items.push(item);
      else blocks.push({ type: "ol", start: Number(ordered[1]), items: [item] });
    } else if (bullet) {
      const item = parseInline(bullet[1]);
      if (previous?.type === "ul") previous.items.push(item);
      else blocks.push({ type: "ul", items: [item] });
    } else if (heading) {
      const text = heading[1].replace(/\*/g, "");
      blocks.push({ type: "p", content: [{ text, style: "bold" }] });
    } else {
      blocks.push({ type: "p", content: parseInline(line) });
    }
  }

  return blocks;
}
