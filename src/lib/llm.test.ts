import { describe, it, expect } from "vitest";
import { modelSettings } from "./llm";

describe("modelSettings", () => {
  it("uses 3.5 Flash with thinking off for the default model", () => {
    expect(modelSettings(false)).toEqual({
      modelId: "gemini-3.5-flash",
      providerOptions: { google: { thinkingConfig: { thinkingBudget: 0 } } },
    });
  });

  it("uses Flash-Lite with no thinking config (the API rejects one with 400)", () => {
    expect(modelSettings(true)).toEqual({
      modelId: "gemini-3.5-flash-lite",
      providerOptions: undefined,
    });
  });
});
