import { describe, it, expect } from "vitest";
import { extractJson } from "./llm-json";

describe("extractJson", () => {
  it("parses a fenced object", () => {
    expect(extractJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });
  it("parses an object surrounded by prose", () => {
    expect(extractJson('Sure! {"amount": 5} Hope that helps.')).toEqual({ amount: 5 });
  });
  it("parses an array", () => {
    expect(extractJson('["food","transport"]')).toEqual(["food", "transport"]);
  });
  it("returns null for garbage or empty input", () => {
    expect(extractJson("no json here")).toBeNull();
    expect(extractJson("{broken")).toBeNull();
    expect(extractJson("")).toBeNull();
  });
});
