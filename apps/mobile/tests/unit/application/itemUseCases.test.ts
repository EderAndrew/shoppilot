import { describe, expect, it, vi } from "vitest";

import type { ShoppingListItemRepository } from "../../../src/application/ports/ShoppingListItemRepository";
import type { ShoppingListRepository } from "../../../src/application/ports/ShoppingListRepository";
import {
  AddShoppingListItem,
  CheckShoppingListItem,
  RemoveShoppingListItem,
  UpdateShoppingListItem,
} from "../../../src/application/use-cases/shoppingListItems";

const list = {
  archivedAt: null,
  budget: 50,
  completedAt: null,
  createdAt: "2026-05-04T00:00:00.000Z",
  id: "list-1",
  name: "May groceries",
  status: "active" as const,
  updatedAt: "2026-05-04T00:00:00.000Z",
  userId: "user-1",
};

const baseItem = {
  bought: false,
  createdAt: "2026-05-04T00:00:00.000Z",
  id: "item-1",
  productId: "product-1",
  quantity: 1,
  shoppingListId: "list-1",
  totalPrice: 10,
  unitPrice: 10,
  updatedAt: "2026-05-04T00:00:00.000Z",
  userId: "user-1",
};

function repositories(items = [baseItem]) {
  const shoppingLists: ShoppingListRepository = {
    archive: vi.fn(),
    complete: vi.fn(),
    create: vi.fn(),
    getDetails: vi.fn(async () => ({ items, list })),
    list: vi.fn(),
  };
  const shoppingListItems: ShoppingListItemRepository = {
    add: vi.fn(async (input) => ({ ...baseItem, ...input, id: "item-new" })),
    listByShoppingList: vi.fn(async () => items),
    remove: vi.fn(async () => undefined),
    setBought: vi.fn(async (input) => ({ ...baseItem, bought: input.bought })),
    update: vi.fn(async (input) => ({
      ...baseItem,
      ...input,
      id: input.itemId,
    })),
  };

  return { shoppingListItems, shoppingLists };
}

describe("shopping list item use cases", () => {
  it("adds an item with derived total and recalculates the budget", async () => {
    const { shoppingListItems, shoppingLists } = repositories([
      { ...baseItem, id: "item-new", quantity: 2, totalPrice: 20, unitPrice: 10 },
    ]);
    const result = await new AddShoppingListItem(shoppingListItems, shoppingLists).execute({
      productId: "product-1",
      quantity: 2,
      shoppingListId: "list-1",
      unitPrice: 10,
    });

    expect(shoppingListItems.add).toHaveBeenCalledWith(
      expect.objectContaining({ totalPrice: 20 }),
    );
    expect(result.budgetSummary.total).toBe(20);
  });

  it("updates quantity and unit price before recalculating the budget", async () => {
    const { shoppingListItems, shoppingLists } = repositories([
      { ...baseItem, quantity: 3, totalPrice: 30, unitPrice: 10 },
    ]);

    await new UpdateShoppingListItem(shoppingListItems, shoppingLists).execute({
      itemId: "item-1",
      quantity: 3,
      shoppingListId: "list-1",
    });

    expect(shoppingListItems.update).toHaveBeenCalledWith(
      expect.objectContaining({ totalPrice: 30 }),
    );
  });

  it("removes and checks items", async () => {
    const { shoppingListItems, shoppingLists } = repositories([]);

    await expect(
      new RemoveShoppingListItem(shoppingListItems, shoppingLists).execute({
        itemId: "item-1",
        shoppingListId: "list-1",
      }),
    ).resolves.toMatchObject({ budgetSummary: { total: 0 } });
    await expect(
      new CheckShoppingListItem(shoppingListItems, shoppingLists).execute({
        bought: true,
        itemId: "item-1",
        shoppingListId: "list-1",
      }),
    ).resolves.toMatchObject({ item: { bought: true } });
  });
});
