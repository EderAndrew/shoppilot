import { describe, expect, it, vi } from "vitest";

import type { AIRepository } from "../../../src/application/ports/AIRepository";
import type { SuggestedItem } from "../../../src/domain/entities/AISuggestion";
import { SuggestShoppingListItems } from "../../../src/application/use-cases/aiSuggestions";

function makeAI(items: Partial<SuggestedItem>[]): AIRepository {
  return { suggestItems: vi.fn().mockResolvedValue(items) };
}

const baseInput = {
  prompt: "básicos",
  listId: "l1",
  listName: "Compras",
  existingItemNames: [] as string[],
};

describe("SuggestShoppingListItems", () => {
  it("marks suggestion as already_on_list when name matches existing item (case-insensitive)", async () => {
    const ai = makeAI([{ name: "Arroz", quantity: 2 }]);
    const { suggestions } = await new SuggestShoppingListItems(ai).execute({
      ...baseInput,
      existingItemNames: ["arroz"],
    });
    expect(suggestions[0].status).toBe("already_on_list");
  });

  it("marks suggestion as pending when name does not match existing items", async () => {
    const ai = makeAI([{ name: "Feijão", quantity: 1 }]);
    const { suggestions } = await new SuggestShoppingListItems(ai).execute({
      ...baseInput,
      existingItemNames: ["arroz"],
    });
    expect(suggestions[0].status).toBe("pending");
  });

  it("handles empty AI response gracefully", async () => {
    const ai = makeAI([]);
    const { suggestions } = await new SuggestShoppingListItems(ai).execute(baseInput);
    expect(suggestions).toHaveLength(0);
  });

  it("generates unique id for each suggestion", async () => {
    const ai = makeAI([
      { name: "Arroz", quantity: 1 },
      { name: "Feijão", quantity: 1 },
    ]);
    const { suggestions } = await new SuggestShoppingListItems(ai).execute(baseInput);
    expect(suggestions[0].id).toBeTruthy();
    expect(suggestions[1].id).toBeTruthy();
    expect(suggestions[0].id).not.toBe(suggestions[1].id);
  });

  it("trims whitespace before comparison", async () => {
    const ai = makeAI([{ name: "  Arroz  ", quantity: 1 }]);
    const { suggestions } = await new SuggestShoppingListItems(ai).execute({
      ...baseInput,
      existingItemNames: ["arroz"],
    });
    expect(suggestions[0].status).toBe("already_on_list");
  });

  it("passes prompt and context to the AI repository", async () => {
    const ai = makeAI([]);
    await new SuggestShoppingListItems(ai).execute({
      prompt: "churrasco",
      listId: "l1",
      listName: "Festas",
      existingItemNames: ["carne"],
    });
    expect(ai.suggestItems).toHaveBeenCalledWith("churrasco", {
      listName: "Festas",
      existingItemNames: ["carne"],
    });
  });
});
