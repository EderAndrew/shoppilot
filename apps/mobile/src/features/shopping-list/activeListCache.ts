import type { ShoppingListDetailsResult } from "@/application/use-cases/shoppingLists";
import { ShoppingList } from "@/domain/entities/ShoppingList";
import { ShoppingListItem } from "@/domain/entities/ShoppingListItem";
import type { ActiveListRealtimeChange } from "@/infrastructure/realtime/activeListSubscription";
import { shoppingListItemRowToRecord } from "@/infrastructure/mappers/shoppingListItemMapper";
import { shoppingListRowToRecord } from "@/infrastructure/mappers/shoppingListMapper";

function recalculateDetailsBudget(details: ShoppingListDetailsResult): ShoppingListDetailsResult {
  const list = new ShoppingList(details.list);
  const items = details.items.map((item) => new ShoppingListItem(item));

  return {
    ...details,
    budgetSummary: list.calculateBudget(items),
  };
}

export function patchActiveListDetailsCache(
  current: ShoppingListDetailsResult | undefined,
  change: ActiveListRealtimeChange,
): ShoppingListDetailsResult | undefined {
  if (!current) return current;

  if (change.table === "shopping_lists") {
    return recalculateDetailsBudget({
      ...current,
      list: shoppingListRowToRecord(change.row),
    });
  }

  if (change.eventType === "DELETE") {
    return recalculateDetailsBudget({
      ...current,
      items: current.items.filter((item) => item.id !== change.oldRow.id),
    });
  }

  const incomingItem = shoppingListItemRowToRecord(change.row);
  const existingItem = current.items.find((item) => item.id === incomingItem.id);
  const nextItems = existingItem
    ? current.items.map((item) =>
        item.id === incomingItem.id
          ? { ...incomingItem, productName: existingItem.productName ?? incomingItem.productName }
          : item,
      )
    : [...current.items, incomingItem];

  return recalculateDetailsBudget({
    ...current,
    items: nextItems,
  });
}
