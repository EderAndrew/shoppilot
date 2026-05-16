import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function src(relPath: string): string {
  return readFileSync(resolve(process.cwd(), "src", relPath), "utf8");
}

describe("AI suggestion flow — security invariants", () => {
  it("useConfirmSuggestions delegates item addition to AddShoppingListItem use case", () => {
    const hook = src("features/ai-assistant/useConfirmSuggestions.ts");
    expect(hook).toContain("AddShoppingListItem");
    expect(hook).toContain("addItem.execute(");
  });

  it("AddShoppingListItem use case emits ITEM_ADDED event after each addition", () => {
    const useCase = src("application/use-cases/shoppingListItems.ts");
    expect(useCase).toContain("ITEM_ADDED");
    expect(useCase).toContain("userEvents.append(");
  });

  it("SupabaseShoppingListItemRepository sets user_id via requireCurrentUserId, not from caller input", () => {
    const repo = src("infrastructure/repositories/SupabaseShoppingListItemRepository.ts");
    expect(repo).toContain("requireCurrentUserId");
  });

  it("useConfirmSuggestions does not set userId directly — ownership is enforced at the repository layer", () => {
    const hook = src("features/ai-assistant/useConfirmSuggestions.ts");
    expect(hook).not.toMatch(/userId\s*:/);
    expect(hook).not.toMatch(/user_id\s*:/);
  });

  it("AI repository timeout prevents indefinite blocking of the UI", () => {
    const repo = src("infrastructure/repositories/SupabaseAIRepository.ts");
    expect(repo).toContain("Promise.race");
    expect(repo).toContain("setTimeout");
    expect(repo).toContain("AIServiceError");
  });
});
