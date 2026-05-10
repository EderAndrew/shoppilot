import { describe, expect, it } from "vitest";

import { ShoppingListItem } from "../../../src/domain/entities/ShoppingListItem";

const baseItem = {
  createdAt: "2026-05-04T00:00:00.000Z",
  id: "item-1",
  productId: "product-1",
  shoppingListId: "list-1",
  updatedAt: "2026-05-04T00:00:00.000Z",
  userId: "user-1",
};

describe("ShoppingListItem", () => {
  it("calculates total price from quantity and unit price", () => {
    const item = new ShoppingListItem({
      ...baseItem,
      quantity: 2.5,
      unitPrice: 4.2,
    });

    expect(item.calculateTotalPrice().toNumber()).toBe(10.5);
  });

  it("rounds totals to money precision", () => {
    const item = new ShoppingListItem({
      ...baseItem,
      quantity: 1.333,
      unitPrice: 3.37,
    });

    expect(item.calculateTotalPrice().toNumber()).toBe(4.49);
  });

  it("rejects persisted totals that do not match domain math", () => {
    expect(
      () =>
        new ShoppingListItem({
          ...baseItem,
          quantity: 2,
          totalPrice: 9,
          unitPrice: 4,
        }),
    ).toThrow("Item total must equal");
  });
});
