import {
  SHOPPING_LIST_STATUSES,
  type ShoppingListStatus,
} from "@shop-pilot/shared/domain-types/shopping";

export { SHOPPING_LIST_STATUSES, type ShoppingListStatus };

const allowedTransitions: Record<ShoppingListStatus, ShoppingListStatus[]> = {
  active: ["completed", "archived"],
  archived: [],
  completed: ["archived"],
};

export function isShoppingListStatus(value: unknown): value is ShoppingListStatus {
  return (
    typeof value === "string" &&
    SHOPPING_LIST_STATUSES.includes(value as ShoppingListStatus)
  );
}

export function assertShoppingListStatus(value: unknown): ShoppingListStatus {
  if (!isShoppingListStatus(value)) {
    throw new RangeError("Unsupported shopping list status.");
  }

  return value;
}

export function canTransitionShoppingListStatus(
  from: ShoppingListStatus,
  to: ShoppingListStatus,
): boolean {
  return from === to || allowedTransitions[from].includes(to);
}
