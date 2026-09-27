// Pull the first JSON object/array out of an LLM reply (models often wrap
// JSON in ``` fences or add a sentence around it). Returns null if none parses.
export function extractJson(raw: string): unknown {
  const s = raw.replace(/```(?:json)?/gi, "").trim();
  const obj = s.indexOf("{");
  const arr = s.indexOf("[");
  const useArr = arr >= 0 && (obj < 0 || arr < obj);
  const open = useArr ? arr : obj;
  if (open < 0) return null;
  const close = s.lastIndexOf(useArr ? "]" : "}");
  if (close <= open) return null;
  try {
    return JSON.parse(s.slice(open, close + 1));
  } catch {
    return null;
  }
}
