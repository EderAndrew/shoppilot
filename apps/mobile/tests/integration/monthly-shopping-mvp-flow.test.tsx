import { describe, expect, it, vi } from "vitest";

import type { PriceHistoryRepository } from "../../src/application/ports/PriceHistoryRepository";
import type { ProductRepository } from "../../src/application/ports/ProductRepository";
import type { ShoppingListItemRepository } from "../../src/application/ports/ShoppingListItemRepository";
import type {
  ShoppingListRecord,
  ShoppingListRepository,
} from "../../src/application/ports/ShoppingListRepository";
import type { UserEventRepository } from "../../src/application/ports/UserEventRepository";
import { CreateProduct } from "../../src/application/use-cases/products";
import {
  AddShoppingListItem,
  CheckShoppingListItem,
  UpdateShoppingListItem,
} from "../../src/application/use-cases/shoppingListItems";
import {
  CompleteShoppingList,
  CreateShoppingList,
} from "../../src/application/use-cases/shoppingLists";

function buildMvpRepositories() {
  let list: ShoppingListRecord | null = null;
  const items: Awaited<ReturnType<ShoppingListItemRepository["listByShoppingList"]>> = [];
  const priceRecords: Awaited<ReturnType<PriceHistoryRepository["listByProduct"]>> = [];

  const userEvents: UserEventRepository = {
    append: vi.fn(async (input) => ({
      createdAt: "2026-05-04T00:00:00.000Z",
      id: `event-${vi.mocked(userEvents.append).mock.calls.length + 1}`,
      metadata: input.metadata ?? {},
      userId: "user-1",
      ...input,
    })),
    listByEntity: vi.fn(async () => []),
  };

  const shoppingLists: ShoppingListRepository = {
    archive: vi.fn(),
    complete: vi.fn(async () => {
      if (!list) throw new Error("missing list");
      list = {
        ...list,
        completedAt: "2026-05-04T02:00:00.000Z",
        status: "completed",
        updatedAt: "2026-05-04T02:00:00.000Z",
      };
      return list;
    }),
    create: vi.fn(async (input) => {
      list = {
        archivedAt: null,
        budget: input.budget,
        completedAt: null,
        createdAt: "2026-05-04T00:00:00.000Z",
        id: "list-1",
        name: input.name,
        status: "active",
        updatedAt: "2026-05-04T00:00:00.000Z",
        userId: "user-1",
      };
      return list;
    }),
    getDetails: vi.fn(async () => (list ? { items: [...items], list } : null)),
    list: vi.fn(async () => (list ? [list] : [])),
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
  };

  const shoppingListItems: ShoppingListItemRepository = {
    add: vi.fn(async (input) => {
      const item = {
        bought: false,
        createdAt: "2026-05-04T00:00:00.000Z",
        id: "item-1",
        productId: input.productId,
        productName: "Rice",
        quantity: input.quantity,
        shoppingListId: input.shoppingListId,
        totalPrice: input.totalPrice,
        unitPrice: input.unitPrice,
        updatedAt: "2026-05-04T00:00:00.000Z",
        userId: "user-1",
      };
      items.push(item);
      return item;
    }),
    listByShoppingList: vi.fn(async () => [...items]),
    remove: vi.fn(async () => undefined),
    setBought: vi.fn(async (input) => {
      const item = items.find((candidate) => candidate.id === input.itemId);
      if (!item) throw new Error("missing item");
      item.bought = input.bought;
      return item;
    }),
    update: vi.fn(async (input) => {
      const item = items.find((candidate) => candidate.id === input.itemId);
      if (!item) throw new Error("missing item");
      Object.assign(item, {
        bought: input.bought ?? item.bought,
        quantity: input.quantity ?? item.quantity,
        totalPrice: input.totalPrice ?? item.totalPrice,
        unitPrice: input.unitPrice ?? item.unitPrice,
      });
      return item;
    }),
  };

  const priceHistory: PriceHistoryRepository = {
    append: vi.fn(async (input) => {
      const record = {
        createdAt: "2026-05-04T00:00:00.000Z",
        id: `price-${priceRecords.length + 1}`,
        recordedAt: input.recordedAt ?? "2026-05-04T00:00:00.000Z",
        shoppingListItemId: input.shoppingListItemId ?? null,
        userId: "user-1",
        ...input,
      };
      priceRecords.push(record);
      return record;
    }),
    getLatestPreviousPrice: vi.fn(async () => priceRecords.at(-1) ?? null),
    listByProduct: vi.fn(async () => [...priceRecords]),
  };

  return { priceHistory, products, shoppingListItems, shoppingLists, userEvents };
}

describe("monthly shopping MVP happy path", () => {
  it("creates a list, creates a product, adds and updates an item, checks it, and completes the list", async () => {
    const repos = buildMvpRepositories();

    const createdList = await new CreateShoppingList(repos.shoppingLists, repos.userEvents).execute(
      { budget: 30, name: "May groceries" },
    );
    const product = await new CreateProduct(repos.products, repos.userEvents).execute({
      brand: "Acme",
      name: "Rice",
      unit: "kg",
    });
    const added = await new AddShoppingListItem(
      repos.shoppingListItems,
      repos.shoppingLists,
      repos.priceHistory,
      repos.userEvents,
    ).execute({
      productId: product.id,
      quantity: 2,
      shoppingListId: createdList.list.id,
      unitPrice: 8,
    });
    const updated = await new UpdateShoppingListItem(
      repos.shoppingListItems,
      repos.shoppingLists,
      repos.priceHistory,
      repos.userEvents,
    ).execute({
      itemId: added.item?.id ?? "",
      quantity: 3,
      shoppingListId: createdList.list.id,
      unitPrice: 9,
    });
    const checked = await new CheckShoppingListItem(
      repos.shoppingListItems,
      repos.shoppingLists,
      repos.userEvents,
    ).execute({
      bought: true,
      itemId: added.item?.id ?? "",
      shoppingListId: createdList.list.id,
    });
    const completed = await new CompleteShoppingList(repos.shoppingLists, repos.userEvents).execute(
      createdList.list.id,
    );

    expect(added.budgetSummary).toMatchObject({ remaining: 14, total: 16 });
    expect(updated.budgetSummary).toMatchObject({ remaining: 3, total: 27 });
    expect(checked.item).toMatchObject({ bought: true });
    expect(completed).toMatchObject({ status: "completed" });
    expect(repos.priceHistory.append).toHaveBeenCalledTimes(2);
    expect(vi.mocked(repos.userEvents.append).mock.calls.map(([input]) => input.eventType)).toEqual(
      expect.arrayContaining([
        "SHOPPING_LIST_CREATED",
        "PRODUCT_CREATED",
        "ITEM_ADDED",
        "PRICE_RECORDED",
        "ITEM_UPDATED",
        "ITEM_CHECKED",
        "SHOPPING_LIST_COMPLETED",
      ]),
    );
  });
});
