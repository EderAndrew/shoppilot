import { describe, expect, it } from "vitest";

import { sanitizeUserEventMetadata } from "../../src/domain/entities/UserEvent";
import {
  buildItemEventMetadata,
  buildPriceRecordedEventMetadata,
  buildShoppingListEventMetadata,
} from "../../src/domain/events/eventMetadata";

describe("user event metadata safety", () => {
  it("excludes tokens and raw session payloads", () => {
    const metadata = sanitizeUserEventMetadata({
      accessToken: "secret",
      list_id: "list-1",
      raw_session: {
        refresh_token: "secret",
        user_id: "user-1",
      },
      safe: { nested: true },
    });

    expect(metadata).toEqual({
      list_id: "list-1",
      safe: { nested: true },
    });
  });

  it("builds bounded metadata for list, item, and price events", () => {
    expect(
      buildShoppingListEventMetadata({ budget: 100, id: "list-1", status: "completed" }),
    ).toEqual({ budget: 100, list_id: "list-1", status: "completed" });
    expect(
      buildItemEventMetadata({
        bought: true,
        id: "item-1",
        productId: "product-1",
        quantity: 2,
        shoppingListId: "list-1",
        totalPrice: 20,
        unitPrice: 10,
      }),
    ).toEqual(
      expect.objectContaining({
        bought: true,
        item_id: "item-1",
        list_id: "list-1",
        product_id: "product-1",
      }),
    );
    expect(
      buildPriceRecordedEventMetadata({
        price: 10,
        priceInsight: {
          absoluteDifference: 2,
          currentPrice: 10,
          percentageDifference: 25,
          previousPrice: 8,
          status: "more_expensive",
        },
        productId: "product-1",
        shoppingListId: "list-1",
      }),
    ).toEqual(
      expect.objectContaining({
        absolute_difference: 2,
        comparison_status: "more_expensive",
        previous_price: 8,
      }),
    );
  });
});
