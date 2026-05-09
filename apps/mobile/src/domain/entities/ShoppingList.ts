import type { ShoppingListStatus } from "@shop-pilot/shared/domain-types/shopping";

import type { ShoppingListItem } from "./ShoppingListItem";
import { calculateShoppingListBudget } from "../services/budget";
import { Money, type MoneyInput } from "../value-objects/Money";
import { canTransitionShoppingListStatus } from "../value-objects/ShoppingListStatus";

export type ShoppingListProps = {
  id: string;
  userId: string;
  name: string;
  budget: MoneyInput;
  status?: ShoppingListStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  archivedAt?: string | null;
};

export class ShoppingList {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly budget: Money;
  readonly status: ShoppingListStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly completedAt: string | null;
  readonly archivedAt: string | null;

  constructor(props: ShoppingListProps) {
    const name = props.name.trim();
    if (!name) throw new RangeError("Shopping list name is required.");

    this.id = props.id;
    this.userId = props.userId;
    this.name = name;
    this.budget = Money.positive(props.budget);
    this.status = props.status ?? "active";
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.completedAt = props.completedAt ?? null;
    this.archivedAt = props.archivedAt ?? null;
  }

  calculateBudget(items: ShoppingListItem[]) {
    return calculateShoppingListBudget(this.budget, items);
  }

  complete(completedAt = new Date().toISOString()): ShoppingList {
    return this.transition("completed", { completedAt });
  }

  archive(archivedAt = new Date().toISOString()): ShoppingList {
    return this.transition("archived", { archivedAt });
  }

  private transition(
    status: ShoppingListStatus,
    timestamps: Pick<Partial<ShoppingListProps>, "completedAt" | "archivedAt">,
  ): ShoppingList {
    if (!canTransitionShoppingListStatus(this.status, status)) {
      throw new RangeError("Unsupported shopping list status transition.");
    }

    return new ShoppingList({
      archivedAt: timestamps.archivedAt ?? this.archivedAt,
      budget: this.budget,
      completedAt: timestamps.completedAt ?? this.completedAt,
      createdAt: this.createdAt,
      id: this.id,
      name: this.name,
      status,
      updatedAt: new Date().toISOString(),
      userId: this.userId,
    });
  }

  toRecord() {
    return {
      archivedAt: this.archivedAt,
      budget: this.budget.toNumber(),
      completedAt: this.completedAt,
      createdAt: this.createdAt,
      id: this.id,
      name: this.name,
      status: this.status,
      updatedAt: this.updatedAt,
      userId: this.userId,
    };
  }
}
