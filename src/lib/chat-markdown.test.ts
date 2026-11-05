import { describe, it, expect } from "vitest";
import { parseChatMarkdown, parseInline } from "./chat-markdown";

describe("parseInline", () => {
  it("splits bold and italic from plain text", () => {
    expect(parseInline("Total **Rp 50.000** for *Bills* today")).toEqual([
      { text: "Total " },
      { text: "Rp 50.000", style: "bold" },
      { text: " for " },
      { text: "Bills", style: "italic" },
      { text: " today" },
    ]);
  });

  it("does not treat spaced asterisks as italic", () => {
    expect(parseInline("2 * 3 * 4")).toEqual([{ text: "2 * 3 * 4" }]);
  });

  it("leaves an unclosed marker as text while a reply is streaming", () => {
    expect(parseInline("Total **Rp 50")).toEqual([{ text: "Total **Rp 50" }]);
  });
});

describe("parseChatMarkdown", () => {
  it("keeps each line of the reported advisor answer in its own block", () => {
    const blocks = parseChatMarkdown(
      "Here are your transactions:\n\n1. Spotify — Rp 54.990 (*Entertainment*)\n2. Bayar kos — Rp 750.000 (*Bills*)\n\nTotal spent: Rp 804.990.\n\n💡 Takeaway: Bills dominate."
    );
    expect(blocks.map((b) => b.type)).toEqual(["p", "ol", "p", "p"]);
    const list = blocks[1];
    expect(list.type === "ol" && list.items).toHaveLength(2);
  });

  it("merges list items separated by blank lines into one list", () => {
    const blocks = parseChatMarkdown("- one\n\n- two\n* three");
    expect(blocks).toEqual([
      {
        type: "ul",
        items: [[{ text: "one" }], [{ text: "two" }], [{ text: "three" }]],
      },
    ]);
  });

  it("keeps the numbering when text interrupts an ordered list", () => {
    const blocks = parseChatMarkdown("1. a\nnote\n2. b");
    expect(blocks[2]).toEqual({ type: "ol", start: 2, items: [[{ text: "b" }]] });
  });

  it("flattens indented items and shows headings as bold lines", () => {
    expect(parseChatMarkdown("## **Summary**\n  - nested")).toEqual([
      { type: "p", content: [{ text: "Summary", style: "bold" }] },
      { type: "ul", items: [[{ text: "nested" }]] },
    ]);
  });

  it("handles CRLF and empty input", () => {
    expect(parseChatMarkdown("a\r\nb").map((b) => b.type)).toEqual(["p", "p"]);
    expect(parseChatMarkdown("")).toEqual([]);
  });
});
