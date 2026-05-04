export const SHOPPING_LIST_STATUSES = ["active", "completed", "archived"] as const;

export type ShoppingListStatus = (typeof SHOPPING_LIST_STATUSES)[number];

export const SHOPPING_ITEM_BOUGHT_STATES = ["pending", "bought"] as const;

export type ShoppingItemBoughtState = (typeof SHOPPING_ITEM_BOUGHT_STATES)[number];
