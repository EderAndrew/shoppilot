import { describe, expect, it } from "vitest";

import { productRowToRecord } from "../../../src/infrastructure/mappers/productMapper";
import { shoppingListItemRowToRecord } from "../../../src/infrastructure/mappers/shoppingListItemMapper";
import { shoppingListRowToRecord } from "../../../src/infrastructure/mappers/shoppingListMapper";

describe("shopping mappers", () => {
  it("maps shopping list rows to application records", () => {
    expect(
      shoppingListRowToRecord({
        archived_at: null,
        budget: 100,
        completed_at: null,
        created_at: "created",
        id: "list-1",
        name: "May",
        status: "active",
        updated_at: "updated",
        user_id: "user-1",
      }),
    ).toMatchObject({ archivedAt: null, budget: 100, userId: "user-1" });
  });

  it("maps item rows to application records", () => {
    expect(
      shoppingListItemRowToRecord({
        bought: true,
        created_at: "created",
        id: "item-1",
        product_id: "product-1",
        quantity: 2,
        shopping_list_id: "list-1",
        total_price: 20,
        unit_price: 10,
        updated_at: "updated",
        user_id: "user-1",
      }),
    ).toMatchObject({ bought: true, shoppingListId: "list-1", totalPrice: 20 });
  });

  it("maps product rows to application records", () => {
    expect(
      productRowToRecord({
        barcode: null,
        brand: "Brand",
        created_at: "created",
        id: "product-1",
        name: "Rice",
        unit: "kg",
        updated_at: "updated",
        user_id: "user-1",
      }),
    ).toMatchObject({ brand: "Brand", name: "Rice", unit: "kg" });
  });
});
