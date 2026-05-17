import { describe, expect, it, vi } from "vitest";

import type { PriceHistoryRepository } from "../../src/application/ports/PriceHistoryRepository";
import type { ProductRepository } from "../../src/application/ports/ProductRepository";
import type { ShoppingListItemRepository } from "../../src/application/ports/ShoppingListItemRepository";
import type { ShoppingListRepository } from "../../src/application/ports/ShoppingListRepository";
import type { UserEventRepository } from "../../src/application/ports/UserEventRepository";
import { RecordPriceHistory } from "../../src/application/use-cases/priceHistory";
import { CreateProduct } from "../../src/application/use-cases/products";
import {
  AddShoppingListItem,
  CheckShoppingListItem,
  RemoveShoppingListItem,
  UpdateShoppingListItem,
} from "../../src/application/use-cases/shoppingListItems";
import { CompleteShoppingList } from "../../src/application/use-cases/shoppingLists";

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
  quantity: 1,
  shoppingListId: "list-1",
  totalPrice: 10,
  unitPrice: 10,
  updatedAt: "2026-05-04T00:00:00.000Z",
  userId: "user-1",
};

function buildRepositories() {
  const userEvents: UserEventRepository = {
    append: vi.fn(async (input) => ({
      createdAt: "2026-05-04T00:00:00.000Z",
      id: `event-${input.eventType}`,
      metadata: input.metadata ?? {},
      userId: "user-1",
      ...input,
    })),
    listByEntity: vi.fn(async () => []),
  };
  const shoppingLists: ShoppingListRepository = {
    archive: vi.fn(),
    complete: vi.fn(async () => ({
      ...list,
      completedAt: "2026-05-04T02:00:00.000Z",
      status: "completed" as const,
    })),
    create: vi.fn(),
    getDetails: vi.fn(async () => ({ items: [item], list })),
    list: vi.fn(),
    listActive: vi.fn(),
    listArchived: vi.fn(),
  };
  const shoppingListItems: ShoppingListItemRepository = {
    add: vi.fn(async (input) => ({ ...item, ...input, id: "item-new" })),
    listByShoppingList: vi.fn(async () => [item]),
    remove: vi.fn(async () => undefined),
    setBought: vi.fn(async (input) => ({ ...item, bought: input.bought })),
    update: vi.fn(async (input) => ({
      ...item,
      ...input,
      id: input.itemId,
      totalPrice: input.totalPrice ?? item.totalPrice,
      unitPrice: input.unitPrice ?? item.unitPrice,
    })),
  };
  const priceHistory: PriceHistoryRepository = {
    append: vi.fn(async (input) => ({
      createdAt: "2026-05-04T00:00:00.000Z",
      id: "price-new",
      recordedAt: "2026-05-04T00:00:00.000Z",
      shoppingListItemId: input.shoppingListItemId ?? null,
      userId: "user-1",
      ...input,
    })),
    getLatestPreviousPrice: vi.fn(async () => ({
      createdAt: "2026-05-03T00:00:00.000Z",
      id: "price-old",
      price: 8,
      productId: "product-1",
      recordedAt: "2026-05-03T00:00:00.000Z",
      shoppingListId: "list-old",
      shoppingListItemId: "item-old",
      userId: "user-1",
    })),
    listByProduct: vi.fn(async () => []),
  };
  const products: ProductRepository = {
    create: vi.fn(async (input) => ({
      barcode: input.barcode ?? null,
      brand: input.brand ?? null,
      createdAt: "2026-05-04T00:00:00.000Z",
      id: "product-1",
      name: input.name,
      unit: input.unit ?? null,
      updatedAt: "2026-05-04T00:00:00.000Z",
      userId: "user-1",
    })),
    findDuplicateCandidates: vi.fn(async () => []),
    getById: vi.fn(async () => null),
    search: vi.fn(async () => []),
    updateBrand: vi.fn(async () => ({ barcode: null, brand: null, createdAt: "", id: "product-1", name: "", unit: null, updatedAt: "", userId: "user-1" })),
  };

  return { priceHistory, products, shoppingListItems, shoppingLists, userEvents };
}

describe("user events flow", () => {
  it("records required events with safe owned references", async () => {
    const repos = buildRepositories();

    await new AddShoppingListItem(
      repos.shoppingListItems,
      repos.shoppingLists,
      repos.priceHistory,
      repos.userEvents,
    ).execute({
      productId: "product-1",
      quantity: 1,
      shoppingListId: "list-1",
      unitPrice: 10,
    });
    await new UpdateShoppingListItem(
      repos.shoppingListItems,
      repos.shoppingLists,
      repos.priceHistory,
      repos.userEvents,
    ).execute({ itemId: "item-1", shoppingListId: "list-1", unitPrice: 12 });
    await new RemoveShoppingListItem(
      repos.shoppingListItems,
      repos.shoppingLists,
      repos.userEvents,
    ).execute({ itemId: "item-1", shoppingListId: "list-1" });
    await new CheckShoppingListItem(
      repos.shoppingListItems,
      repos.shoppingLists,
      repos.userEvents,
    ).execute({ bought: true, itemId: "item-1", shoppingListId: "list-1" });
    await new RecordPriceHistory(repos.priceHistory, repos.userEvents).execute({
      price: 10,
      productId: "product-1",
      shoppingListId: "list-1",
      shoppingListItemId: "item-1",
    });
    await new CompleteShoppingList(repos.shoppingLists, repos.userEvents).execute("list-1");
    await new CreateProduct(repos.products, repos.userEvents).execute({
      brand: "Acme",
      name: "Rice",
      unit: "kg",
    });

    const calls = vi.mocked(repos.userEvents.append).mock.calls.map(([input]) => input);
    expect(calls.map((call) => call.eventType)).toEqual(
      expect.arrayContaining([
        "ITEM_ADDED",
        "ITEM_UPDATED",
        "ITEM_REMOVED",
        "ITEM_CHECKED",
        "PRICE_RECORDED",
        "SHOPPING_LIST_COMPLETED",
        "PRODUCT_CREATED",
      ]),
    );
    expect(calls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ entityId: "item-new", entityType: "shopping_list_item" }),
        expect.objectContaining({ entityId: "list-1", entityType: "shopping_list" }),
        expect.objectContaining({ entityId: "product-1", entityType: "product" }),
      ]),
    );
  });
});
