import { ShoppingList } from "@/domain/entities/ShoppingList";
import { ShoppingListItem } from "@/domain/entities/ShoppingListItem";
import { buildShoppingListEventMetadata } from "@/domain/events/eventMetadata";
import type { ShoppingListBudgetSummary } from "@/domain/services/budget";
import { logBusinessEvent } from "@/shared/logging/logger";
import { createAppError } from "@/shared/errors/appError";

import type {
  CreateShoppingListInput,
  ShoppingListDetails,
  ShoppingListRecord,
  ShoppingListRepository,
} from "../ports/ShoppingListRepository";
import type { UserEventRepository } from "../ports/UserEventRepository";

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
  constructor(
    private readonly shoppingLists: ShoppingListRepository,
    private readonly userEvents?: UserEventRepository,
  ) {}

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

    if (this.userEvents) {
      await this.userEvents.append({
        entityId: created.id,
        entityType: "shopping_list",
        eventType: "SHOPPING_LIST_CREATED",
        metadata: buildShoppingListEventMetadata(created),
      });
      logBusinessEvent("Lista de compras criada", {
        entityId: created.id,
        eventType: "SHOPPING_LIST_CREATED",
      });
    }

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
      throw createAppError({ category: "not_found", message: "Não encontramos esse registro." });
    }

    return {
      ...details,
      budgetSummary: toBudgetSummary(details),
    };
  }
}

export class CompleteShoppingList {
  constructor(
    private readonly shoppingLists: ShoppingListRepository,
    private readonly userEvents?: UserEventRepository,
  ) {}

  async execute(listId: string): Promise<ShoppingListRecord> {
    const completed = await this.shoppingLists.complete({ listId });

    if (this.userEvents) {
      await this.userEvents.append({
        entityId: completed.id,
        entityType: "shopping_list",
        eventType: "SHOPPING_LIST_COMPLETED",
        metadata: buildShoppingListEventMetadata(completed),
      });
      logBusinessEvent("Lista de compras concluída", {
        entityId: completed.id,
        eventType: "SHOPPING_LIST_COMPLETED",
      });
    }

    return completed;
  }
}

export class ArchiveShoppingList {
  constructor(private readonly shoppingLists: ShoppingListRepository) {}

  async execute(listId: string): Promise<ShoppingListRecord> {
    return this.shoppingLists.archive({ listId });
  }
}
