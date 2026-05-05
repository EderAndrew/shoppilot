import { describe, expect, it, vi } from "vitest";

import type { UserEventRepository } from "../../../src/application/ports/UserEventRepository";
import { RecordUserEvent } from "../../../src/application/use-cases/userEvents";
import type { PriceHistoryRepository } from "../../../src/application/ports/PriceHistoryRepository";
import type { ShoppingListItemRepository } from "../../../src/application/ports/ShoppingListItemRepository";
import type { ShoppingListRepository } from "../../../src/application/ports/ShoppingListRepository";
import {
  CheckShoppingListItem,
  AddShoppingListItem,
} from "../../../src/application/use-cases/shoppingListItems";
import { CompleteShoppingList } from "../../../src/application/use-cases/shoppingLists";

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

function userEvents(): UserEventRepository {
  return {
    append: vi.fn(async (input) => ({
      createdAt: "2026-05-04T00:00:00.000Z",
      id: "event-1",
      metadata: input.metadata ?? {},
      userId: "user-1",
      ...input,
    })),
    listByEntity: vi.fn(async () => []),
  };
}

function repositories() {
  const shoppingLists: ShoppingListRepository = {
    archive: vi.fn(),
    complete: vi.fn(async () => ({
      ...list,
      completedAt: "2026-05-04T01:00:00.000Z",
      status: "completed" as const,
    })),
    create: vi.fn(),
    getDetails: vi.fn(async () => ({ items: [item], list })),
    list: vi.fn(),
  };
  const shoppingListItems: ShoppingListItemRepository = {
    add: vi.fn(async (input) => ({ ...item, ...input, id: "item-new" })),
    listByShoppingList: vi.fn(async () => [item]),
    remove: vi.fn(),
    setBought: vi.fn(async (input) => ({ ...item, bought: input.bought })),
    update: vi.fn(),
  };
  const priceHistory: PriceHistoryRepository = {
    append: vi.fn(async (input) => ({
      createdAt: "2026-05-04T00:00:00.000Z",
      id: "price-1",
      recordedAt: "2026-05-04T00:00:00.000Z",
      shoppingListItemId: input.shoppingListItemId ?? null,
      userId: "user-1",
      ...input,
    })),
    getLatestPreviousPrice: vi.fn(async () => null),
    listByProduct: vi.fn(async () => []),
  };

  return { priceHistory, shoppingListItems, shoppingLists };
}

describe("event use cases", () => {
  it("records sanitized user event metadata", async () => {
    const events = userEvents();

    await new RecordUserEvent(events).execute({
      entityId: "list-1",
      entityType: "shopping_list",
      eventType: "SHOPPING_LIST_COMPLETED",
      metadata: { list_id: "list-1", session: { access_token: "secret" } },
    });

    expect(events.append).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: { list_id: "list-1" },
      }),
    );
  });

  it("records list completion and item checked events", async () => {
    const events = userEvents();
    const { shoppingListItems, shoppingLists } = repositories();

    await new CompleteShoppingList(shoppingLists, events).execute("list-1");
    await new CheckShoppingListItem(shoppingListItems, shoppingLists, events).execute({
      bought: true,
      itemId: "item-1",
      shoppingListId: "list-1",
    });

    expect(events.append).toHaveBeenCalledWith(
      expect.objectContaining({
        entityId: "list-1",
        eventType: "SHOPPING_LIST_COMPLETED",
      }),
    );
    expect(events.append).toHaveBeenCalledWith(
      expect.objectContaining({
        entityId: "item-1",
        eventType: "ITEM_CHECKED",
      }),
    );
  });

  it("records item added and price recorded events after add succeeds", async () => {
    const events = userEvents();
    const { priceHistory, shoppingListItems, shoppingLists } = repositories();

    await new AddShoppingListItem(shoppingListItems, shoppingLists, priceHistory, events).execute({
      productId: "product-1",
      quantity: 2,
      shoppingListId: "list-1",
      unitPrice: 10,
    });

    expect(events.append).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "ITEM_ADDED" }),
    );
    expect(events.append).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "PRICE_RECORDED" }),
    );
  });
});
