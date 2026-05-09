import { describe, expect, it, vi } from "vitest";

import type { PriceHistoryRepository } from "../../../src/application/ports/PriceHistoryRepository";
import {
  CalculatePriceInsight,
  GetPreviousProductPrice,
  ListProductPriceHistory,
  RecordPriceHistory,
} from "../../../src/application/use-cases/priceHistory";

const priceRecord = {
  createdAt: "2026-05-04T00:00:00.000Z",
  id: "price-1",
  price: 10,
  productId: "product-1",
  recordedAt: "2026-05-04T00:00:00.000Z",
  shoppingListId: "list-1",
  shoppingListItemId: "item-1",
  userId: "user-1",
};

function repository(previous = priceRecord): PriceHistoryRepository {
  return {
    append: vi.fn(async (input) => ({ ...priceRecord, ...input, id: "price-new" })),
    getLatestPreviousPrice: vi.fn(async () => previous),
    listByProduct: vi.fn(async () => [priceRecord]),
  };
}

describe("price history use cases", () => {
  it("appends price history without updating existing rows", async () => {
    const priceHistory = repository();

    await new RecordPriceHistory(priceHistory).execute({
      price: 12,
      productId: "product-1",
      shoppingListId: "list-1",
      shoppingListItemId: "item-1",
    });

    expect(priceHistory.append).toHaveBeenCalledTimes(1);
    expect(priceHistory.append).toHaveBeenCalledWith(
      expect.objectContaining({ price: 12, productId: "product-1" }),
    );
  });

  it("gets the latest previous product price", async () => {
    const priceHistory = repository();

    await expect(
      new GetPreviousProductPrice(priceHistory).execute({ productId: "product-1" }),
    ).resolves.toMatchObject({ price: 10 });
  });

  it("lists product price history", async () => {
    const priceHistory = repository();

    await expect(
      new ListProductPriceHistory(priceHistory).execute("product-1"),
    ).resolves.toHaveLength(1);
  });

  it("calculates price insight from the latest previous price", async () => {
    const priceHistory = repository();

    await expect(
      new CalculatePriceInsight(priceHistory).execute({ currentPrice: 12, productId: "product-1" }),
    ).resolves.toMatchObject({ absoluteDifference: 2, status: "more_expensive" });
  });
});
