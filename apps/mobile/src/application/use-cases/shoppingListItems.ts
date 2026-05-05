import { ShoppingListItem } from "@/domain/entities/ShoppingListItem";
import {
  buildItemEventMetadata,
  buildPriceRecordedEventMetadata,
} from "@/domain/events/eventMetadata";
import {
  calculateShoppingListBudget,
  type ShoppingListBudgetSummary,
} from "@/domain/services/budget";
import { calculatePriceInsight, type PriceInsight } from "@/domain/services/priceInsight";
import { Money } from "@/domain/value-objects/Money";
import { Quantity } from "@/domain/value-objects/Quantity";
import { createAppError } from "@/shared/errors/appError";
import { logBusinessEvent } from "@/shared/logging/logger";

import type { PriceHistoryRepository } from "../ports/PriceHistoryRepository";
import type { ShoppingListDetails, ShoppingListRepository } from "../ports/ShoppingListRepository";
import type {
  AddShoppingListItemInput,
  ShoppingListItemRecord,
  ShoppingListItemRepository,
  UpdateShoppingListItemInput,
} from "../ports/ShoppingListItemRepository";
import type { UserEventRepository } from "../ports/UserEventRepository";

export type ItemMutationResult = {
  item?: ShoppingListItemRecord;
  budgetSummary: ShoppingListBudgetSummary;
  priceInsight?: PriceInsight;
};

function calculateItemTotal(quantity: number, unitPrice: number): number {
  return Money.positive(unitPrice).multiply(Quantity.from(quantity).toNumber()).toNumber();
}

function summaryFromDetails(details: ShoppingListDetails): ShoppingListBudgetSummary {
  return calculateShoppingListBudget(
    details.list.budget,
    details.items.map((item) => new ShoppingListItem(item)),
  );
}

function requireDetails(details: ShoppingListDetails | null): ShoppingListDetails {
  if (!details) {
    throw createAppError({ category: "not_found", message: "Não encontramos esse registro." });
  }

  return details;
}

export class AddShoppingListItem {
  constructor(
    private readonly shoppingListItems: ShoppingListItemRepository,
    private readonly shoppingLists: ShoppingListRepository,
    private readonly priceHistory?: PriceHistoryRepository,
    private readonly userEvents?: UserEventRepository,
  ) {}

  async execute(input: Omit<AddShoppingListItemInput, "totalPrice">): Promise<ItemMutationResult> {
    const previousPrice = this.priceHistory
      ? await this.priceHistory.getLatestPreviousPrice({ productId: input.productId })
      : null;
    const item = await this.shoppingListItems.add({
      ...input,
      totalPrice: calculateItemTotal(input.quantity, input.unitPrice),
    });
    const priceInsight = calculatePriceInsight(input.unitPrice, previousPrice?.price ?? null);

    if (this.priceHistory) {
      const priceRecord = await this.priceHistory.append({
        price: input.unitPrice,
        productId: input.productId,
        shoppingListId: input.shoppingListId,
        shoppingListItemId: item.id,
      });

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
    }

    if (this.userEvents) {
      await this.userEvents.append({
        entityId: item.id,
        entityType: "shopping_list_item",
        eventType: "ITEM_ADDED",
        metadata: buildItemEventMetadata(item),
      });
      logBusinessEvent("Item adicionado à lista de compras", {
        entityId: item.id,
        eventType: "ITEM_ADDED",
      });
    }

    const details = requireDetails(await this.shoppingLists.getDetails(input.shoppingListId));

    return {
      budgetSummary: summaryFromDetails(details),
      item,
      priceInsight,
    };
  }
}

export type UpdateShoppingListItemUseCaseInput = UpdateShoppingListItemInput & {
  shoppingListId: string;
};

export class UpdateShoppingListItem {
  constructor(
    private readonly shoppingListItems: ShoppingListItemRepository,
    private readonly shoppingLists: ShoppingListRepository,
    private readonly priceHistory?: PriceHistoryRepository,
    private readonly userEvents?: UserEventRepository,
  ) {}

  async execute(input: UpdateShoppingListItemUseCaseInput): Promise<ItemMutationResult> {
    const currentDetails = requireDetails(
      await this.shoppingLists.getDetails(input.shoppingListId),
    );
    const currentItem = currentDetails.items.find((item) => item.id === input.itemId);

    if (!currentItem) {
      throw createAppError({ category: "not_found", message: "Não encontramos esse registro." });
    }

    const quantity = input.quantity ?? currentItem.quantity;
    const unitPrice = input.unitPrice ?? currentItem.unitPrice;
    const priceChanged = input.unitPrice !== undefined && input.unitPrice !== currentItem.unitPrice;
    const previousPrice =
      priceChanged && this.priceHistory
        ? await this.priceHistory.getLatestPreviousPrice({ productId: currentItem.productId })
        : null;
    const item = await this.shoppingListItems.update({
      ...input,
      quantity,
      totalPrice: calculateItemTotal(quantity, unitPrice),
      unitPrice,
    });
    const priceInsight = priceChanged
      ? calculatePriceInsight(unitPrice, previousPrice?.price ?? null)
      : undefined;

    if (priceChanged && this.priceHistory) {
      const priceRecord = await this.priceHistory.append({
        price: unitPrice,
        productId: currentItem.productId,
        shoppingListId: input.shoppingListId,
        shoppingListItemId: item.id,
      });

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
    }

    if (this.userEvents) {
      await this.userEvents.append({
        entityId: item.id,
        entityType: "shopping_list_item",
        eventType: "ITEM_UPDATED",
        metadata: buildItemEventMetadata(item),
      });
      logBusinessEvent("Item da lista de compras atualizado", {
        entityId: item.id,
        eventType: "ITEM_UPDATED",
      });
    }

    const details = requireDetails(await this.shoppingLists.getDetails(input.shoppingListId));

    return {
      budgetSummary: summaryFromDetails(details),
      item,
      priceInsight,
    };
  }
}

export class RemoveShoppingListItem {
  constructor(
    private readonly shoppingListItems: ShoppingListItemRepository,
    private readonly shoppingLists: ShoppingListRepository,
    private readonly userEvents?: UserEventRepository,
  ) {}

  async execute(input: { itemId: string; shoppingListId: string }): Promise<ItemMutationResult> {
    const currentItem = this.userEvents
      ? requireDetails(await this.shoppingLists.getDetails(input.shoppingListId)).items.find(
          (item) => item.id === input.itemId,
        )
      : null;

    if (this.userEvents && !currentItem) {
      throw createAppError({ category: "not_found", message: "Não encontramos esse registro." });
    }

    await this.shoppingListItems.remove(input.itemId);

    if (this.userEvents && currentItem) {
      await this.userEvents.append({
        entityId: currentItem.id,
        entityType: "shopping_list_item",
        eventType: "ITEM_REMOVED",
        metadata: buildItemEventMetadata(currentItem),
      });
      logBusinessEvent("Item removido da lista de compras", {
        entityId: currentItem.id,
        eventType: "ITEM_REMOVED",
      });
    }

    const details = requireDetails(await this.shoppingLists.getDetails(input.shoppingListId));

    return {
      budgetSummary: summaryFromDetails(details),
    };
  }
}

export class CheckShoppingListItem {
  constructor(
    private readonly shoppingListItems: ShoppingListItemRepository,
    private readonly shoppingLists: ShoppingListRepository,
    private readonly userEvents?: UserEventRepository,
  ) {}

  async execute(input: {
    itemId: string;
    shoppingListId: string;
    bought: boolean;
  }): Promise<ItemMutationResult> {
    const item = await this.shoppingListItems.setBought({
      bought: input.bought,
      itemId: input.itemId,
    });

    if (input.bought && this.userEvents) {
      await this.userEvents.append({
        entityId: item.id,
        entityType: "shopping_list_item",
        eventType: "ITEM_CHECKED",
        metadata: buildItemEventMetadata(item),
      });
      logBusinessEvent("Item marcado como comprado", {
        entityId: item.id,
        eventType: "ITEM_CHECKED",
      });
    }

    const details = requireDetails(await this.shoppingLists.getDetails(input.shoppingListId));

    return {
      budgetSummary: summaryFromDetails(details),
      item,
    };
  }
}
