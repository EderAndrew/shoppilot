import { describe, expect, it } from "vitest";

import { ShoppingList } from "../../../src/domain/entities/ShoppingList";
import { ShoppingListItem } from "../../../src/domain/entities/ShoppingListItem";
import { calculateShoppingListBudget } from "../../../src/domain/services/budget";

function item(quantity: number, unitPrice: number) {
  return new ShoppingListItem({
    bought: false,
    createdAt: "2026-05-04T00:00:00.000Z",
    id: `${quantity}-${unitPrice}`,
    productId: "product-1",
    quantity,
    shoppingListId: "list-1",
    unitPrice,
    updatedAt: "2026-05-04T00:00:00.000Z",
    userId: "user-1",
  });
}

describe("shopping list budget", () => {
  it("calculates total, remaining budget, percentage, and over-budget state", () => {
    const summary = calculateShoppingListBudget(100, [item(2, 10), item(1.5, 20)]);

    expect(summary).toEqual({
      budget: 100,
      isOverBudget: false,
      remaining: 50,
      total: 50,
      usedPercentage: 50,
    });
  });

  it("reports over-budget state when item totals exceed budget", () => {
    const list = new ShoppingList({
      budget: 25,
      createdAt: "2026-05-04T00:00:00.000Z",
      id: "list-1",
      name: "May groceries",
      updatedAt: "2026-05-04T00:00:00.000Z",
      userId: "user-1",
    });

    expect(list.calculateBudget([item(3, 10)])).toMatchObject({
      isOverBudget: true,
      remaining: -5,
      total: 30,
      usedPercentage: 120,
    });
  });
});
