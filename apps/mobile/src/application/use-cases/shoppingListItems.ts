import { ShoppingListItem } from "@/domain/entities/ShoppingListItem";
import { calculateShoppingListBudget, type ShoppingListBudgetSummary } from "@/domain/services/budget";
import { Money } from "@/domain/value-objects/Money";
import { Quantity } from "@/domain/value-objects/Quantity";
import { createAppError } from "@/shared/errors/appError";

import type {
  ShoppingListDetails,
  ShoppingListRepository,
} from "../ports/ShoppingListRepository";
import type {
  AddShoppingListItemInput,
  ShoppingListItemRecord,
  ShoppingListItemRepository,
  UpdateShoppingListItemInput,
} from "../ports/ShoppingListItemRepository";

export type ItemMutationResult = {
  item?: ShoppingListItemRecord;
  budgetSummary: ShoppingListBudgetSummary;
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
    throw createAppError({ category: "not_found", message: "We could not find that record." });
  }

  return details;
}

export class AddShoppingListItem {
  constructor(
    private readonly shoppingListItems: ShoppingListItemRepository,
    private readonly shoppingLists: ShoppingListRepository,
  ) {}

  async execute(
    input: Omit<AddShoppingListItemInput, "totalPrice">,
  ): Promise<ItemMutationResult> {
    const item = await this.shoppingListItems.add({
      ...input,
      totalPrice: calculateItemTotal(input.quantity, input.unitPrice),
    });
    const details = requireDetails(await this.shoppingLists.getDetails(input.shoppingListId));

    return {
      budgetSummary: summaryFromDetails(details),
      item,
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
  ) {}

  async execute(input: UpdateShoppingListItemUseCaseInput): Promise<ItemMutationResult> {
    const currentDetails = requireDetails(await this.shoppingLists.getDetails(input.shoppingListId));
    const currentItem = currentDetails.items.find((item) => item.id === input.itemId);

    if (!currentItem) {
      throw createAppError({ category: "not_found", message: "We could not find that record." });
    }

    const quantity = input.quantity ?? currentItem.quantity;
    const unitPrice = input.unitPrice ?? currentItem.unitPrice;
    const item = await this.shoppingListItems.update({
      ...input,
      quantity,
      totalPrice: calculateItemTotal(quantity, unitPrice),
      unitPrice,
    });
    const details = requireDetails(await this.shoppingLists.getDetails(input.shoppingListId));

    return {
      budgetSummary: summaryFromDetails(details),
      item,
    };
  }
}

export class RemoveShoppingListItem {
  constructor(
    private readonly shoppingListItems: ShoppingListItemRepository,
    private readonly shoppingLists: ShoppingListRepository,
  ) {}

  async execute(input: { itemId: string; shoppingListId: string }): Promise<ItemMutationResult> {
    await this.shoppingListItems.remove(input.itemId);
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
    const details = requireDetails(await this.shoppingLists.getDetails(input.shoppingListId));

    return {
      budgetSummary: summaryFromDetails(details),
      item,
    };
  }
}
