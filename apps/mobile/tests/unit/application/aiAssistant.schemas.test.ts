import { describe, expect, it } from "vitest";

import { aiSuggestionsResponseSchema } from "../../../src/features/ai-assistant/aiAssistant.schemas";

describe("aiSuggestionsResponseSchema", () => {
  it("accepts valid suggestions array", () => {
    const result = aiSuggestionsResponseSchema.safeParse({
      suggestions: [{ name: "Arroz", quantity: 2, unit: "kg", category: "Grãos" }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects suggestion with empty name", () => {
    const result = aiSuggestionsResponseSchema.safeParse({
      suggestions: [{ name: "", quantity: 1 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects suggestion with quantity 0", () => {
    const result = aiSuggestionsResponseSchema.safeParse({
      suggestions: [{ name: "Arroz", quantity: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects suggestion with negative quantity", () => {
    const result = aiSuggestionsResponseSchema.safeParse({
      suggestions: [{ name: "Arroz", quantity: -1 }],
    });
    expect(result.success).toBe(false);
  });

  it("accepts suggestion without optional fields", () => {
    const result = aiSuggestionsResponseSchema.safeParse({
      suggestions: [{ name: "Arroz", quantity: 1 }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts suggestions array with 0 items", () => {
    const result = aiSuggestionsResponseSchema.safeParse({ suggestions: [] });
    expect(result.success).toBe(true);
  });

  it("rejects more than 20 suggestions", () => {
    const suggestions = Array.from({ length: 21 }, (_, i) => ({
      name: `Item ${i + 1}`,
      quantity: 1,
    }));
    const result = aiSuggestionsResponseSchema.safeParse({ suggestions });
    expect(result.success).toBe(false);
  });

  it("applies default quantity of 1 when quantity is omitted", () => {
    const result = aiSuggestionsResponseSchema.safeParse({
      suggestions: [{ name: "Arroz" }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.suggestions[0].quantity).toBe(1);
    }
  });
});
