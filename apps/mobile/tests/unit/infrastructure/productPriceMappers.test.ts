import { describe, expect, it } from "vitest";

import { priceHistoryRowToRecord } from "../../../src/infrastructure/mappers/priceHistoryMapper";
import { productRowToRecord } from "../../../src/infrastructure/mappers/productMapper";

describe("product and price mappers", () => {
  it("maps product rows to records preserving optional identifiers", () => {
    expect(
      productRowToRecord({
        barcode: "789",
        brand: "Acme",
        created_at: "created",
        id: "product-1",
        name: "Rice",
        unit: "kg",
        updated_at: "updated",
        user_id: "user-1",
      }),
    ).toEqual({
      barcode: "789",
      brand: "Acme",
      createdAt: "created",
      id: "product-1",
      name: "Rice",
      unit: "kg",
      updatedAt: "updated",
      userId: "user-1",
    });
  });

  it("maps price history rows to append-only records", () => {
    expect(
      priceHistoryRowToRecord({
        created_at: "created",
        id: "price-1",
        price: 12.5,
        product_id: "product-1",
        recorded_at: "recorded",
        shopping_list_id: "list-1",
        shopping_list_item_id: "item-1",
        user_id: "user-1",
      }),
    ).toEqual({
      createdAt: "created",
      id: "price-1",
      price: 12.5,
      productId: "product-1",
      recordedAt: "recorded",
      shoppingListId: "list-1",
      shoppingListItemId: "item-1",
      userId: "user-1",
    });
  });
});
