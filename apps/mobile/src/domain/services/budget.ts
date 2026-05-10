import type { ShoppingListItem } from "../entities/ShoppingListItem";
import { Money, type MoneyInput } from "../value-objects/Money";

export type ShoppingListBudgetSummary = {
  budget: number;
  total: number;
  remaining: number;
  usedPercentage: number;
  isOverBudget: boolean;
};

export function calculateShoppingListBudget(
  budgetInput: MoneyInput,
  items: Pick<ShoppingListItem, "calculateTotalPrice">[],
): ShoppingListBudgetSummary {
  const budget = Money.positive(budgetInput);
  const total = items.reduce(
    (currentTotal, item) => currentTotal.add(item.calculateTotalPrice()),
    Money.zero(),
  );
  const remaining = budget.subtract(total);
  const usedPercentage = budget.cents === 0 ? 0 : (total.cents / budget.cents) * 100;

  return {
    budget: budget.toNumber(),
    isOverBudget: total.isGreaterThan(budget),
    remaining: remaining.toNumber(),
    total: total.toNumber(),
    usedPercentage,
  };
}
