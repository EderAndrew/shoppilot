import { describe, expect, it, vi } from "vitest";

import type { ShoppingListRepository } from "../../../src/application/ports/ShoppingListRepository";
import {
  ArchiveShoppingList,
  CompleteShoppingList,
  CreateShoppingList,
  GetShoppingListDetails,
  ListShoppingLists,
} from "../../../src/application/use-cases/shoppingLists";

const list = {
  archivedAt: null,
  budget: 100,
  completedAt: null,
  createdAt: "2026-05-04T00:00:00.000Z",
  id: "list-1",
  name: "May groceries",
  status: "active" as const,
  updatedAt: "2026-05-04T00:00:00.000Z",
  userId: "user-1",
};

const item = {
  bought: false,
  createdAt: "2026-05-04T00:00:00.000Z",
  id: "item-1",
  productId: "product-1",
  quantity: 2,
  shoppingListId: "list-1",
  totalPrice: 20,
  unitPrice: 10,
  updatedAt: "2026-05-04T00:00:00.000Z",
  userId: "user-1",
};

function repository(): ShoppingListRepository {
  return {
    archive: vi.fn(async () => ({ ...list, archivedAt: "now", status: "archived" as const })),
    complete: vi.fn(async () => ({ ...list, completedAt: "now", status: "completed" as const })),
    create: vi.fn(async () => list),
    getDetails: vi.fn(async () => ({ items: [item], list })),
    list: vi.fn(async () => [list]),
  };
}

describe("shopping list use cases", () => {
  it("creates a list with an empty budget summary", async () => {
    const result = await new CreateShoppingList(repository()).execute({
      budget: 100,
      name: "May groceries",
    });

    expect(result.budgetSummary).toMatchObject({ remaining: 100, total: 0 });
  });

  it("lists and gets details with recalculated totals", async () => {
    const repo = repository();

    await expect(new ListShoppingLists(repo).execute()).resolves.toEqual([list]);
    await expect(new GetShoppingListDetails(repo).execute("list-1")).resolves.toMatchObject({
      budgetSummary: { remaining: 80, total: 20, usedPercentage: 20 },
    });
  });

  it("completes and archives lists", async () => {
    const repo = repository();

    await expect(new CompleteShoppingList(repo).execute("list-1")).resolves.toMatchObject({
      status: "completed",
    });
    await expect(new ArchiveShoppingList(repo).execute("list-1")).resolves.toMatchObject({
      status: "archived",
    });
  });
});
