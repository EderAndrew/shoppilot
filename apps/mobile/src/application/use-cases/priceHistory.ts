import { PriceHistory } from "@/domain/entities/PriceHistory";
import { buildPriceRecordedEventMetadata } from "@/domain/events/eventMetadata";
import { calculatePriceInsight, type PriceInsight } from "@/domain/services/priceInsight";
import { logBusinessEvent } from "@/shared/logging/logger";

import type {
  AppendPriceHistoryInput,
  PriceHistoryRecord,
  PriceHistoryRepository,
} from "../ports/PriceHistoryRepository";
import type { UserEventRepository } from "../ports/UserEventRepository";

function validateAppendInput(input: AppendPriceHistoryInput): AppendPriceHistoryInput {
  const now = input.recordedAt ?? new Date().toISOString();
  const priceHistory = new PriceHistory({
    createdAt: now,
    id: "validation-only",
    price: input.price,
    productId: input.productId,
    recordedAt: now,
    shoppingListId: input.shoppingListId,
    shoppingListItemId: input.shoppingListItemId ?? null,
    userId: "validation-only",
  });

  return {
    price: priceHistory.price.toNumber(),
    productId: priceHistory.productId,
    recordedAt: input.recordedAt,
    shoppingListId: priceHistory.shoppingListId,
    shoppingListItemId: priceHistory.shoppingListItemId,
  };
}

export class RecordPriceHistory {
  constructor(
    private readonly priceHistory: PriceHistoryRepository,
    private readonly userEvents?: UserEventRepository,
  ) {}

  async execute(input: AppendPriceHistoryInput): Promise<PriceHistoryRecord> {
    const validInput = validateAppendInput(input);
    const previous = this.userEvents
      ? await this.priceHistory.getLatestPreviousPrice({
          beforeRecordedAt: validInput.recordedAt,
          productId: validInput.productId,
        })
      : null;
    const priceInsight = this.userEvents
      ? calculatePriceInsight(validInput.price, previous?.price ?? null)
      : undefined;
    const priceRecord = await this.priceHistory.append(validInput);

    if (this.userEvents) {
      await this.userEvents.append({
        entityId: priceRecord.id,
        entityType: "price_history",
        eventType: "PRICE_RECORDED",
        metadata: buildPriceRecordedEventMetadata({
          price: priceRecord.price,
          priceInsight,
          productId: priceRecord.productId,
          shoppingListId: priceRecord.shoppingListId,
          shoppingListItemId: priceRecord.shoppingListItemId,
        }),
      });
      logBusinessEvent("Preço registrado", {
        entityId: priceRecord.id,
        eventType: "PRICE_RECORDED",
      });
    }

    return priceRecord;
  }
}

export class GetPreviousProductPrice {
  constructor(private readonly priceHistory: PriceHistoryRepository) {}

  execute(input: {
    productId: string;
    beforeRecordedAt?: string;
  }): Promise<PriceHistoryRecord | null> {
    return this.priceHistory.getLatestPreviousPrice(input);
  }
}

export class ListProductPriceHistory {
  constructor(private readonly priceHistory: PriceHistoryRepository) {}

  execute(productId: string): Promise<PriceHistoryRecord[]> {
    return this.priceHistory.listByProduct(productId);
  }
}

export class CalculatePriceInsight {
  constructor(private readonly priceHistory: PriceHistoryRepository) {}

  async execute(input: {
    productId: string;
    currentPrice: number;
    beforeRecordedAt?: string;
  }): Promise<PriceInsight> {
    const previous = await this.priceHistory.getLatestPreviousPrice({
      beforeRecordedAt: input.beforeRecordedAt,
      productId: input.productId,
    });

    return calculatePriceInsight(input.currentPrice, previous?.price ?? null);
  }
}
