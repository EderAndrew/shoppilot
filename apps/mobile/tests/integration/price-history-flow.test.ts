import { describe, expect, it, vi } from "vitest";

import type { PriceHistoryRepository } from "../../src/application/ports/PriceHistoryRepository";
import type { ShoppingListItemRepository } from "../../src/application/ports/ShoppingListItemRepository";
import type { ShoppingListRepository } from "../../src/application/ports/ShoppingListRepository";
import {
  AddShoppingListItem,
  UpdateShoppingListItem,
} from "../../src/application/use-cases/shoppingListItems";

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
    listActive: vi.fn(),
    listArchived: vi.fn(),
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
  const priceHistory: PriceHistoryRepository = {
    append: vi.fn(async (input) => ({
      createdAt: "2026-05-04T00:00:00.000Z",
      id: "price-new",
      recordedAt: "2026-05-04T00:00:00.000Z",
      userId: "user-1",
      ...input,
      shoppingListItemId: input.shoppingListItemId ?? null,
    })),
    getLatestPreviousPrice: vi.fn(async () => ({
      createdAt: "2026-05-03T00:00:00.000Z",
      id: "price-old",
      price: 8,
      productId: "product-1",
      recordedAt: "2026-05-03T00:00:00.000Z",
      shoppingListId: "list-previous",
      shoppingListItemId: "item-previous",
      userId: "user-1",
    })),
    listByProduct: vi.fn(async () => []),
  };

  return { priceHistory, shoppingListItems, shoppingLists };
}

describe("price history flow", () => {
  it("adds an item, records price history, and returns refreshed insight", async () => {
    const { priceHistory, shoppingListItems, shoppingLists } = repositories([
      { ...baseItem, id: "item-new", quantity: 1, totalPrice: 10, unitPrice: 10 },
    ]);
    const result = await new AddShoppingListItem(
      shoppingListItems,
      shoppingLists,
      priceHistory,
    ).execute({
      productId: "product-1",
      quantity: 1,
      shoppingListId: "list-1",
      unitPrice: 10,
    });

    expect(priceHistory.append).toHaveBeenCalledWith(
      expect.objectContaining({ price: 10, shoppingListItemId: "item-new" }),
    );
    expect(result.priceInsight).toMatchObject({ absoluteDifference: 2, status: "more_expensive" });
  });

  it("updates an item price by appending a new history record", async () => {
    const { priceHistory, shoppingListItems, shoppingLists } = repositories();

    await new UpdateShoppingListItem(shoppingListItems, shoppingLists, priceHistory).execute({
      itemId: "item-1",
      shoppingListId: "list-1",
      unitPrice: 12,
    });

    expect(priceHistory.append).toHaveBeenCalledWith(
      expect.objectContaining({ price: 12, shoppingListItemId: "item-1" }),
    );
  });
});
