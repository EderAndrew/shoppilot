import { ShoppingList } from "@/domain/entities/ShoppingList";
import { ShoppingListItem } from "@/domain/entities/ShoppingListItem";
import type { ShoppingListBudgetSummary } from "@/domain/services/budget";
import { createAppError } from "@/shared/errors/appError";

import type {
  CreateShoppingListInput,
  ShoppingListDetails,
  ShoppingListRecord,
  ShoppingListRepository,
} from "../ports/ShoppingListRepository";

export type ShoppingListUseCaseResult = {
  list: ShoppingListRecord;
  budgetSummary: ShoppingListBudgetSummary;
};

export type ShoppingListDetailsResult = ShoppingListDetails & {
  budgetSummary: ShoppingListBudgetSummary;
};

function toBudgetSummary(details: ShoppingListDetails): ShoppingListBudgetSummary {
  const list = new ShoppingList(details.list);
  const items = details.items.map((item) => new ShoppingListItem(item));
  return list.calculateBudget(items);
}

export class CreateShoppingList {
  constructor(private readonly shoppingLists: ShoppingListRepository) {}

  async execute(input: CreateShoppingListInput): Promise<ShoppingListUseCaseResult> {
    const list = new ShoppingList({
      archivedAt: null,
      budget: input.budget,
      completedAt: null,
      createdAt: new Date().toISOString(),
      id: "new",
      name: input.name,
      status: "active",
      updatedAt: new Date().toISOString(),
      userId: "current",
    });
    const created = await this.shoppingLists.create({
      budget: list.budget.toNumber(),
      name: list.name,
    });

    return {
      budgetSummary: new ShoppingList(created).calculateBudget([]),
      list: created,
    };
  }
}

export class ListShoppingLists {
  constructor(private readonly shoppingLists: ShoppingListRepository) {}

  execute(): Promise<ShoppingListRecord[]> {
    return this.shoppingLists.list();
  }
}

export class GetShoppingListDetails {
  constructor(private readonly shoppingLists: ShoppingListRepository) {}

  async execute(listId: string): Promise<ShoppingListDetailsResult> {
    const details = await this.shoppingLists.getDetails(listId);
    if (!details) {
      throw createAppError({ category: "not_found", message: "We could not find that record." });
    }

    return {
      ...details,
      budgetSummary: toBudgetSummary(details),
    };
  }
}

export class CompleteShoppingList {
  constructor(private readonly shoppingLists: ShoppingListRepository) {}

  async execute(listId: string): Promise<ShoppingListRecord> {
    return this.shoppingLists.complete({ listId });
  }
}

export class ArchiveShoppingList {
  constructor(private readonly shoppingLists: ShoppingListRepository) {}

  async execute(listId: string): Promise<ShoppingListRecord> {
    return this.shoppingLists.archive({ listId });
  }
}
