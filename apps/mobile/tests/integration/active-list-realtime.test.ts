import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import type { ShoppingListDetailsResult } from "../../src/application/use-cases/shoppingLists";
import { patchActiveListDetailsCache } from "../../src/features/shopping-list/activeListCache";
import type { Tables } from "../../src/infrastructure/supabase/database.types";

const listRow: Tables<"shopping_lists"> = {
  archived_at: null,
  budget: 20,
  completed_at: null,
  created_at: "2026-05-04T00:00:00.000Z",
  id: "list-1",
  name: "May groceries",
  status: "active",
  updated_at: "2026-05-04T00:00:00.000Z",
  user_id: "user-1",
};

function itemRow(
  overrides: Partial<Tables<"shopping_list_items">> = {},
): Tables<"shopping_list_items"> {
  return {
    bought: false,
    created_at: "2026-05-04T00:00:00.000Z",
    id: "item-1",
    product_id: "product-1",
    quantity: 1,
    shopping_list_id: "list-1",
    total_price: 8,
    unit_price: 8,
    updated_at: "2026-05-04T00:00:00.000Z",
    user_id: "user-1",
    ...overrides,
  };
}

function details(items = [itemRow()]): ShoppingListDetailsResult {
  return {
    budgetSummary: {
      budget: 20,
      isOverBudget: false,
      remaining: 12,
      total: 8,
      usedPercentage: 40,
    },
    items: items.map((item) => ({
      bought: item.bought,
      createdAt: item.created_at,
      id: item.id,
      productId: item.product_id,
      productName: "Rice",
      quantity: item.quantity,
      shoppingListId: item.shopping_list_id,
      totalPrice: item.total_price,
      unitPrice: item.unit_price,
      updatedAt: item.updated_at,
      userId: item.user_id,
    })),
    list: {
      archivedAt: listRow.archived_at,
      budget: listRow.budget,
      completedAt: listRow.completed_at,
      createdAt: listRow.created_at,
      id: listRow.id,
      name: listRow.name,
      status: listRow.status,
      updatedAt: listRow.updated_at,
      userId: listRow.user_id,
    },
  };
}

describe("active-list Realtime cache patching", () => {
  it("adds, updates, removes items, and recalculates budget totals", () => {
    const inserted = patchActiveListDetailsCache(details([]), {
      eventType: "INSERT",
      row: itemRow(),
      table: "shopping_list_items",
    });

    expect(inserted?.items).toHaveLength(1);
    expect(inserted?.budgetSummary).toMatchObject({ remaining: 12, total: 8 });

    const updated = patchActiveListDetailsCache(details(), {
      eventType: "UPDATE",
      row: itemRow({ quantity: 3, total_price: 24, unit_price: 8 }),
      table: "shopping_list_items",
    });

    expect(updated?.items[0]).toMatchObject({ productName: "Rice", quantity: 3, totalPrice: 24 });
    expect(updated?.budgetSummary).toMatchObject({ isOverBudget: true, remaining: -4, total: 24 });

    const removed = patchActiveListDetailsCache(updated, {
      eventType: "DELETE",
      oldRow: { id: "item-1" },
      table: "shopping_list_items",
    });

    expect(removed?.items).toEqual([]);
    expect(removed?.budgetSummary).toMatchObject({ remaining: 20, total: 0 });
  });

  it("keeps the adapter scoped to the authenticated active list and removes the channel", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/infrastructure/realtime/activeListSubscription.ts"),
      "utf8",
    );

    expect(source).toContain("active-list:${userId}:${listId}");
    expect(source).toContain("filter: `id=eq.${listId}`");
    expect(source).toContain("filter: `shopping_list_id=eq.${listId}`");
    expect(source).toContain("client.removeChannel(channel)");
    expect(source).not.toContain('table: "products"');
    expect(source).not.toContain('table: "price_history"');
    expect(source).not.toContain('table: "user_events"');
  });
});
